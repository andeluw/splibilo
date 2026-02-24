// app/admin/users/page.tsx
import { AdminLayout } from '@/components/layout/admin/admin-layout';

export default function AdminUsersPage() {
  return (
    <AdminLayout
      title='Users'
      subheading='Activate or suspend Splibilo users'
      breadcrumbs={['/admin']}
    >
      <p className='text-sm text-muted-foreground'>
        Here you’ll manage user suspensions, bans, and re-activations.
      </p>
      {/* table, filters, etc. */}
    </AdminLayout>
  );
}
