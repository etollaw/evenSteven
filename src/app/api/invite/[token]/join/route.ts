import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: invite } = await supabase
    .from('group_invites')
    .select('*')
    .eq('token', token)
    .gt('expires_at', new Date().toISOString())
    .single()

  if (!invite) {
    return NextResponse.json({ error: 'Invalid or expired invite' }, { status: 400 })
  }

  const { error } = await supabase
    .from('group_members')
    .insert({ group_id: invite.group_id, user_id: user.id })

  if (error && !error.message.includes('duplicate')) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  await supabase.from('activity_feed').insert({
    group_id: invite.group_id,
    user_id: user.id,
    action: 'member_joined',
    metadata: {},
  })

  return NextResponse.json({ group_id: invite.group_id })
}
