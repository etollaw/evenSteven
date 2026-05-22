export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      users: {
        Row: UserProfile;
        Insert: Omit<UserProfile, "created_at" | "updated_at"> & {
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<UserProfile, "id" | "created_at" | "updated_at">>;
        Relationships: [];
      };
      groups: {
        Row: Group;
        Insert: Omit<Group, "created_at" | "updated_at" | "archived_at"> & {
          created_at?: string;
          updated_at?: string;
          archived_at?: string | null;
        };
        Update: Partial<Omit<Group, "id" | "created_at" | "updated_at">>;
        Relationships: [];
      };
      group_members: {
        Row: GroupMember;
        Insert: Omit<GroupMember, "id" | "joined_at"> & {
          id?: string;
          joined_at?: string;
        };
        Update: Partial<Omit<GroupMember, "id" | "group_id" | "user_id" | "joined_at">>;
        Relationships: [];
      };
      expenses: {
        Row: Expense;
        Insert: Omit<Expense, "id" | "created_at" | "updated_at"> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<Expense, "id" | "created_at" | "updated_at">>;
        Relationships: [];
      };
      splits: {
        Row: Split;
        Insert: Omit<Split, "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Omit<Split, "id" | "expense_id" | "created_at">>;
        Relationships: [];
      };
      settlements: {
        Row: Settlement;
        Insert: Omit<Settlement, "id" | "created_at" | "settled_at"> & {
          id?: string;
          created_at?: string;
          settled_at?: string;
        };
        Update: Partial<Omit<Settlement, "id" | "created_at">>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

export type UserProfile = {
  id: string;
  name: string;
  email: string;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
};

export type Group = {
  id: string;
  name: string;
  description: string | null;
  currency: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  archived_at: string | null;
};

export type GroupMember = {
  id: string;
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
  description: string;
  category: string;
  split_method: "equal" | "custom";
  paid_at: string;
  created_by: string;
  created_at: string;
  updated_at: string;
};

export type Split = {
  id: string;
  expense_id: string;
  user_id: string;
  amount_owed: number;
  created_at: string;
};

export type Settlement = {
  id: string;
  group_id: string;
  payer_id: string;
  receiver_id: string;
  amount: number;
  note: string | null;
  settled_at: string;
  created_by: string;
  created_at: string;
};

export type MemberWithProfile = GroupMember & {
  user: UserProfile;
};

export type ExpenseWithDetails = Expense & {
  payer: UserProfile;
  splits: Array<Split & { user: UserProfile }>;
};

export type SettlementWithProfiles = Settlement & {
  payer: UserProfile;
  receiver: UserProfile;
};

export type GroupDashboard = Group & {
  member_count: number;
  expense_count: number;
  total_spend: number;
};
