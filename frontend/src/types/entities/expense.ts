import type { Group } from '@/types/entities/group';
import type { User } from '@/types/entities/user';

export type Expense = {
  id: string;
  group_id: string;
  created_by_id: string;
  description: string;
  amount: number;
  category: string;
  date: string; // ISO string from backend
  paid_by_id: string;
  receipt_url: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;

  // Relations (from include in /admin/expenses)
  group?: Pick<Group, 'id' | 'name'>;
  created_by?: Pick<User, 'id' | 'name' | 'email'>;
  paid_by?: Pick<User, 'id' | 'name' | 'email'>;
};
