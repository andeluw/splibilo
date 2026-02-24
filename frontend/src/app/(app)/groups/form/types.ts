import type { File } from '@/types/dropzone';

export type CreateGroupForm = {
  name: string;
  description?: string;
  category: string;
  icon: File | null;
  members_can_edit_all_expenses: boolean;
  members_can_delete_expenses: boolean;
};

export type CreateGroupRequest = {
  name: string;
  description?: string;
  category: string;
  icon_url?: string;
  members_can_edit_all_expenses: boolean;
  members_can_delete_expenses: boolean;
};
