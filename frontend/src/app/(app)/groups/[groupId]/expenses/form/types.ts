// app/(app)/groups/[groupId]/expenses/form/types.ts
import type { File } from '@/types/dropzone';

export type ExpenseShareForm = {
  user_id: string;
  amount: number;
};

export type CreateExpenseForm = {
  description: string;
  amount: number;
  category: string;
  date: string;
  paid_by_user_id: string;
  receipt: File | null;
  notes?: string;
  shares: ExpenseShareForm[];
  participant_ids: string[];
  participant_search?: string;
};

export type ExpenseShareRequest = {
  user_id: string;
  amount: number;
};

export type CreateExpenseRequest = {
  description: string;
  amount: number;
  category: string;
  date: string; // ISO string
  paid_by_user_id: string;
  receipt_url?: string;
  notes?: string;
  shares: ExpenseShareRequest[];
};
