import { File } from '@/types/dropzone';

export type RegisterForm = {
  name: string;
  email: string;
  password: string;
  confirm_password: string;
  avatar?: File | null;
};

export type RegisterRequest = {
  name: string;
  email: string;
  password: string;
  avatar_url?: string;
};

export type RegisterResponse = {
  id: string;
  email: string;
  name: string;
  avatar_url: string;
  role: 'USER';
};
