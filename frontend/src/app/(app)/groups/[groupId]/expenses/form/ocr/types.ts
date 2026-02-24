import { ExpenseShareForm } from '@/app/(app)/groups/[groupId]/expenses/form/types';

import type { File } from '@/types/dropzone';

export type OcrReceiptItem = {
  name: string;
  quantity: number;
  amount: number;
  participant_ids: string[];
};

export type OcrReceiptTotals = {
  subtotal: number;
  tax: number;
  grand_total: number;
};

export type OcrReceiptData = {
  raw_text: string;
  items: OcrReceiptItem[];
  totals: OcrReceiptTotals;
};

export type OcrReceiptRequest = {
  path: string;
};

export type CreateExpenseOCRForm = {
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
  include_tax: boolean;
  tax_amount: number;
  items: {
    name: string;
    quantity: number;
    amount: number;
    participant_ids: string[];
  }[];
};
