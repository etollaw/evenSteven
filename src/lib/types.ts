export type Profile = {
  id: string;
  email: string | null;
  display_name: string;
  avatar_url: string | null;
  created_at: string;
};

export type Group = {
  id: string;
  name: string;
  emoji: string | null;
  description: string | null;
  currency: string;
  created_by: string;
  created_at: string;
};

export type GroupMember = {
  group_id: string;
  user_id: string;
  role: "owner" | "member";
  joined_at: string;
};

export type Expense = {
  id: string;
  group_id: string;
  payer_id: string;
  amount: number;
  currency: string;
  description: string;
  category: string | null;
  occurred_at: string;
  split_type: "equal" | "exact" | "percentage" | "shares";
  notes: string | null;
  created_by: string;
  created_at: string;
};

export type ExpenseSplit = {
  id: string;
  expense_id: string;
  user_id: string;
  amount_owed: number;
  shares: number | null;
  percentage: number | null;
};

export type Settlement = {
  id: string;
  group_id: string;
  from_user: string;
  to_user: string;
  amount: number;
  note: string | null;
  created_by: string;
  created_at: string;
};

export type ExpenseComment = {
  id: string;
  expense_id: string;
  user_id: string;
  body: string;
  created_at: string;
};

export type GroupInvite = {
  id: string;
  group_id: string;
  code: string;
  created_by: string;
  created_at: string;
  expires_at: string | null;
  max_uses: number | null;
  uses: number;
};
