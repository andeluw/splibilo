import type { File as DropzoneFile } from '@/types/dropzone';

export type UpdateMeRequest = {
  name?: string;
  avatar_url?: string | null;
  email_on_settlement_received?: boolean;
};

export type UpdateMeForm = {
  name: string;
  email: string;
  avatar: DropzoneFile | null;
  email_on_settlement_received: boolean;
};
