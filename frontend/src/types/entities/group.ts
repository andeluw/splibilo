export type Group = {
  id: string;
  name: string;
  description: string | null;

  category: string | null;
  icon_url: string | null;
  invite_code: string;

  is_archived: boolean;
  is_suspended: boolean;
  is_locked: boolean;

  members_can_edit_all_expenses: boolean;
  members_can_delete_expenses: boolean;

  created_at: string;
  updated_at: string;

  // computed / enriched fields from backend
  members_count?: number;
  user_net_balance?: number;
};

export type GroupMemberRole = 'OWNER' | 'MEMBER';

export type GroupMember = {
  id: string;
  group_id: string;
  user_id: string;
  role: GroupMemberRole;
  joined_at: string;
  user: {
    id: string;
    name: string;
    email: string;
    avatar_url: string | null;
  };
};

export type MeBalance = {
  net: number;
  total_should_pay: number;
  total_should_receive: number;
};

export type GroupDetail = {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  icon_url: string | null;
  invite_code: string | null;
  is_archived: boolean;
  is_suspended: boolean;
  is_locked: boolean;
  members_can_edit_all_expenses: boolean;
  members_can_delete_expenses: boolean;
  created_at: string;
  updated_at: string;
  group_members: GroupMember[];
  me_balance: MeBalance;
};

export type BalanceDebt = {
  from_user_id: string;
  to_user_id: string;
  amount: number;
};

export type GroupBalances = {
  debts: BalanceDebt[];
  me: {
    should_pay: BalanceDebt[];
    should_receive: BalanceDebt[];
  };
};

export type GroupAnalytics = {
  range: {
    from: string;
    to: string;
    applied: boolean;
  };
  totals: {
    group_total_expenses: number;
    group_total_settlements: number;
    group_net_outstanding: number;
    me_total_expenses_created: number;
    me_total_paid_as_payer: number;
    me_total_settlements_made: number;
  };
  by_category: {
    category: string | null;
    total_amount: number;
    count: number;
  }[];
  by_date: {
    date: string; // 'YYYY-MM-DD'
    total_expenses: number;
    expenses_count: number;
    total_settlements: number;
    settlements_count: number;
  }[];
  top_payers: {
    user_id: string;
    name: string;
    avatar_url: string | null;
    total_paid: number;
  }[];
};
