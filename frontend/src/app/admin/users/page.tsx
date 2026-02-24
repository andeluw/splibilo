'use client';

import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { ColumnDef } from '@tanstack/react-table';
import * as React from 'react';

import api from '@/lib/api';
import { buildPaginatedTableURL } from '@/lib/table';
import { useDialog } from '@/hooks/useDialog';
import { useServerTable } from '@/hooks/useServerTable';

import { Button } from '@/components/button';
import withAuth from '@/components/hoc/withAuth';
import { AdminLayout } from '@/components/layout/admin/admin-layout';
import { NextImage } from '@/components/next-image';
import { PopupFilter, PopupFilterProps } from '@/components/table/popup-filter';
import { ServerTable } from '@/components/table/server-table';

import { useUserSuspensionMutation } from '@/app/admin/users/hooks/mutation';

import { PaginatedApiResponse } from '@/types/api';
import { User } from '@/types/entities/user';

type UserFilter = {
  is_suspended: string[]; // ['true'] or ['false']
};

export default withAuth(AdminUsersPage, 'admin');
function AdminUsersPage() {
  const dialog = useDialog();
  const [processingUserId, setProcessingUserId] = React.useState<string | null>(
    null,
  );

  //#region //*=========== Mutation ===========
  const { mutate: updateUserSuspension, isPending: isUpdatingSuspension } =
    useUserSuspensionMutation();
  //#endregion

  //#region //*=========== Table Definition ===========
  const { tableState, setTableState } = useServerTable<User>();

  const columns: ColumnDef<User>[] = [
    {
      header: 'Avatar',
      accessorKey: 'avatar_url',
      enableSorting: false,
      cell: ({ row }) => {
        const url = row.original.avatar_url ?? '/images/default-avatar.png';

        return (
          <div className='relative h-8 w-8 overflow-hidden rounded-full'>
            <NextImage
              src={url}
              alt={row.original.name ?? 'Avatar'}
              layout='fill'
              className='object-cover object-center'
            />
          </div>
        );
      },
    },
    {
      header: 'Email',
      accessorKey: 'email',
      enableSorting: false,
    },
    {
      header: 'Name',
      accessorKey: 'name',
      enableSorting: false,
    },
    {
      id: 'actions',
      header: 'Action',
      enableSorting: false,
      cell: ({ row }) => {
        const isSuspended = row.original.is_suspended;
        const isLoading =
          isUpdatingSuspension && processingUserId === row.original.id;

        const actionLabel = isSuspended ? 'Unsuspend' : 'Suspend';
        const variant = isSuspended ? 'outlineblack' : 'destructive';
        const dialogVariant = isSuspended ? 'warning' : 'danger';
        const description = isSuspended
          ? 'Are you sure you want to unsuspend this user?'
          : 'Are you sure you want to suspend this user?';

        return (
          <Button
            variant={variant}
            size='sm'
            isLoading={isLoading}
            onClick={() =>
              dialog({
                title: `${actionLabel} ${row.original.name}`,
                description,
                submitText: actionLabel,
                variant: dialogVariant,
                withIcon: false,
                catchOnCancel: true,
              }).then(() => {
                setProcessingUserId(row.original.id);
                updateUserSuspension(
                  { id: row.original.id, is_suspended: !isSuspended },
                  {
                    onSettled: () => {
                      setProcessingUserId(null);
                    },
                  },
                );
              })
            }
          >
            {actionLabel}
          </Button>
        );
      },
    },
  ];
  //#endregion

  //#region //*=========== Filters ===========
  const [filterQuery, setFilterQuery] = React.useState<UserFilter>({
    is_suspended: [],
  });

  const filterOption: PopupFilterProps<UserFilter>['filterOption'] =
    React.useMemo(
      () => [
        {
          id: 'is_suspended',
          name: 'Status',
          options: [
            { id: 'false', name: 'Active' },
            { id: 'true', name: 'Suspended' },
          ],
        },
      ],
      [],
    );
  //#endregion

  //#region //*=========== Fetch Data ===========
  const userUrl = buildPaginatedTableURL({
    baseUrl: '/admin/users',
    tableState,
    additionalParam: {
      is_suspended: filterQuery.is_suspended[0],
    },
  });

  const { data: userData, isLoading: isLoadingUserList } = useQuery<
    PaginatedApiResponse<User[]>
  >({
    queryKey: ['admin-users', userUrl],
    queryFn: async () => {
      const res = await api.get(userUrl);
      return res.data;
    },
    placeholderData: keepPreviousData,
    refetchOnWindowFocus: false,
  });
  //#endregion

  return (
    <AdminLayout
      title='Users'
      subheading='User management and administration'
      breadcrumbs={['/admin', '/admin/users']}
    >
      <ServerTable
        columns={columns}
        data={userData}
        header={
          <PopupFilter
            filterOption={filterOption}
            setFilterQuery={setFilterQuery}
          />
        }
        isLoading={isLoadingUserList}
        tableState={tableState}
        setTableState={setTableState}
        withFilter
      />
    </AdminLayout>
  );
}
