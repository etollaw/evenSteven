import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { name, description, emoji } = body

  if (!name?.trim()) {
    return NextResponse.json({ error: 'Name is required' }, { status: 400 })
  }

  // Create group
  const { data: group, error: groupError } = await supabase
    .from('groups')
    .insert({ name: name.trim(), description: description?.trim() || null, emoji: emoji || '💰', created_by: user.id })
    .select()
    .single()

  if (groupError) {
    return NextResponse.json({ error: groupError.message }, { status: 500 })
  }

  // Add creator as member
  await supabase
    .from('group_members')
    .insert({ group_id: group.id, user_id: user.id })

  // Add activity
  await supabase
    .from('activity_feed')
    .insert({
      group_id: group.id,
      user_id: user.id,
      action: 'group_created',
      metadata: { group_name: group.name },
    })

  return NextResponse.json(group)
}
