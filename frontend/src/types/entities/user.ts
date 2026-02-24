export type User = {
  id: string;
  email: string;
  name: string;
  avatar_url: string;
  role: 'USER' | 'ADMIN';
  is_suspended: boolean;
  email_on_settlement_received: boolean;
}