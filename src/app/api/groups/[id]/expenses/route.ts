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

  // Verify membership
  const { data: member } = await supabase
    .from('group_members')
    .select('*')
    .eq('group_id', groupId)
    .eq('user_id', user.id)
    .single()

  if (!member) {
    return NextResponse.json({ error: 'Not a member of this group' }, { status: 403 })
  }

  const body = await request.json()
  const { description, amount, payer_id, splits, category, expense_date } = body

  if (!description?.trim() || !amount || !payer_id || !splits?.length) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  // Validate splits sum equals amount
  const splitsTotal = splits.reduce((sum: number, s: { amount_owed: number }) => sum + s.amount_owed, 0)
  if (Math.abs(splitsTotal - parseFloat(amount)) > 0.02) {
    return NextResponse.json({ error: 'Splits must equal total amount' }, { status: 400 })
  }

  // Create expense
  const { data: expense, error: expenseError } = await supabase
    .from('expenses')
    .insert({
      group_id: groupId,
      payer_id,
      amount: parseFloat(amount),
      description: description.trim(),
      category: category || 'other',
      expense_date: expense_date || new Date().toISOString().split('T')[0],
    })
    .select()
    .single()

  if (expenseError) {
    return NextResponse.json({ error: expenseError.message }, { status: 500 })
  }

  // Create splits
  const { error: splitsError } = await supabase
    .from('splits')
    .insert(
      splits.map((s: { user_id: string; amount_owed: number }) => ({
        expense_id: expense.id,
        user_id: s.user_id,
        amount_owed: parseFloat(s.amount_owed.toFixed(2)),
      }))
    )

  if (splitsError) {
    // Rollback expense
    await supabase.from('expenses').delete().eq('id', expense.id)
    return NextResponse.json({ error: splitsError.message }, { status: 500 })
  }

  // Add activity
  await supabase.from('activity_feed').insert({
    group_id: groupId,
    user_id: user.id,
    action: 'expense_added',
    metadata: {
      expense_id: expense.id,
      description: expense.description,
      amount: expense.amount,
      payer_id,
    },
  })

  return NextResponse.json(expense)
}
