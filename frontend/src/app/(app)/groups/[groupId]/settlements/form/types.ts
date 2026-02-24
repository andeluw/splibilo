import type { File } from '@/types/dropzone';

export type CreateSettlementForm = {
  to_user_id: string;
  amount: number;
  date: string;
  notes?: string;
  proof_file: File | null;
};

export type CreateSettlementRequest = {
  to_user_id: string;
  amount: number;
  date: string;
  notes?: string;
  proof_url?: string;
};
