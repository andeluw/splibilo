import type { File as DropzoneFile } from '@/types/dropzone';

export type UpdateGroupRequest = {
  name?: string;
  description?: string;
  category?: string;
  icon_url?: string | null;
  is_locked?: boolean;
  members_can_edit_all_expenses?: boolean;
  members_can_delete_expenses?: boolean;
};

export type UpdateGroupForm = {
  name: string;
  description: string;
  category: string;
  icon: DropzoneFile | null;
  icon_url: string | null;
  is_locked: boolean;
  members_can_edit_all_expenses: boolean;
  members_can_delete_expenses: boolean;
};
