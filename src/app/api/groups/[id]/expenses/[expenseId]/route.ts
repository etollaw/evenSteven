import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; expenseId: string }> }
) {
  const { id: groupId, expenseId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: expense } = await supabase
    .from('expenses')
    .select('id, payer_id, description, amount')
    .eq('id', expenseId)
    .eq('group_id', groupId)
    .maybeSingle()

  if (!expense) {
    return NextResponse.json({ error: 'Expense not found' }, { status: 404 })
  }

  if (expense.payer_id !== user.id) {
    return NextResponse.json({ error: 'Only the payer can delete this expense' }, { status: 403 })
  }

  await supabase.from('splits').delete().eq('expense_id', expenseId)
  const { error } = await supabase.from('expenses').delete().eq('id', expenseId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  await supabase.from('activity_feed').insert({
    group_id: groupId,
    user_id: user.id,
    action: 'expense_deleted',
    metadata: { description: expense.description, amount: expense.amount },
  })

  return NextResponse.json({ success: true })
}
