export type Profile = {
  id: string
  name: string
  email: string
  avatar_url: string | null
  created_at: string
}

export type Group = {
  id: string
  name: string
  description: string | null
  emoji: string
  created_by: string | null
  created_at: string
}

export type GroupMember = {
  id: string
  group_id: string
  user_id: string
  joined_at: string
}

export type ExpenseCategory =
  | 'food'
  | 'transport'
  | 'accommodation'
  | 'entertainment'
  | 'utilities'
  | 'shopping'
  | 'health'
  | 'other'

export type Expense = {
  id: string
  group_id: string
  payer_id: string
  amount: number
  description: string
  category: ExpenseCategory
  expense_date: string
  created_at: string
}

export type Split = {
  id: string
  expense_id: string
  user_id: string
  amount_owed: number
}

export type Settlement = {
  id: string
  group_id: string
  from_user_id: string
  to_user_id: string
  amount: number
  note: string | null
  settled_at: string
}

export type ActivityFeed = {
  id: string
  group_id: string
  user_id: string | null
  action: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  metadata: any
  created_at: string
}

export type GroupInvite = {
  id: string
  group_id: string
  created_by: string
  token: string
  expires_at: string
  created_at: string
}
