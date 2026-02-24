import type { File } from '@/types/dropzone';

export type UpdateExpenseRequest = {
  description: string;
  amount: number;
  category?: string;
  date?: string; // ISO
  receipt_url?: string | null;
  notes?: string | null;
  shares: { user_id: string; amount: number }[];
};

export type ExpenseShareDetail = {
  id: string;
  expense_id: string;
  user_id: string;
  amount: number;
  user: {
    id: string;
    name: string;
    email: string;
  };
};

export type ExpenseDetail = {
  id: string;
  group_id: string;
  created_by_id: string;
  description: string;
  amount: number;
  category: string | null;
  date: Date | string;
  paid_by_id: string;
  receipt_url: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  created_by: {
    id: string;
    name: string;
    email: string;
  };
  paid_by: {
    id: string;
    name: string;
    email: string;
  };
  expense_shares: ExpenseShareDetail[];
};

export type UpdateExpenseForm = {
  description: string;
  amount: number;
  category: string;
  date: Date | string;
  paid_by_user_id: string;
  notes: string | null;
  receipt: File | null;
  shares: {
    user_id: string;
    amount: number;
  }[];
};
