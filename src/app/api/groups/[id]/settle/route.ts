import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: groupId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { to_user_id, amount, note } = body

  if (!to_user_id || !amount) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const { data: settlement, error } = await supabase
    .from('settlements')
    .insert({
      group_id: groupId,
      from_user_id: user.id,
      to_user_id,
      amount: parseFloat(amount),
      note: note?.trim() || null,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  await supabase.from('activity_feed').insert({
    group_id: groupId,
    user_id: user.id,
    action: 'settlement_added',
    metadata: { to_user_id, amount: parseFloat(amount) },
  })

  return NextResponse.json(settlement)
}
