'use client';

import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { ColumnDef } from '@tanstack/react-table';
import * as React from 'react';

import api from '@/lib/api';
import { buildPaginatedTableURL } from '@/lib/table';
import { useServerTable } from '@/hooks/useServerTable';

import withAuth from '@/components/hoc/withAuth';
import { AdminLayout } from '@/components/layout/admin/admin-layout';
import { NextImage } from '@/components/next-image';
import { PopupFilter, PopupFilterProps } from '@/components/table/popup-filter';
import { ServerTable } from '@/components/table/server-table';

import { GROUP_CATEGORY_OPTIONS } from '@/constant/options/group';

import { PaginatedApiResponse } from '@/types/api';
import { Group } from '@/types/entities/group';

type GroupFilter = {
  category: string[];
  is_archived: string[];
};

export default withAuth(AdminGroupsPage, 'admin');
function AdminGroupsPage() {
  //#region Table state
  const { tableState, setTableState } = useServerTable<Group>();
  //#endregion

  //#region Columns
  const columns: ColumnDef<Group>[] = [
    {
      header: 'Icon',
      accessorKey: 'icon_url',
      enableSorting: false,
      cell: ({ row }) => {
        const url = row.original.icon_url ?? '/images/default-group-icon.png';
        return (
          <div className='relative h-8 w-8 overflow-hidden rounded-md'>
            <NextImage
              src={url}
              alt={row.original.name}
              layout='fill'
              className='object-cover object-center'
            />
          </div>
        );
      },
    },
    {
      header: 'Name',
      accessorKey: 'name',
    },
    {
      header: 'Category',
      accessorKey: 'category',
    },
    {
      header: 'Invite Code',
      accessorKey: 'invite_code',
    },
    // {
    //   header: 'Archived',
    //   accessorKey: 'is_archived',
    //   cell: ({ row }) => (row.original.is_archived ? 'Yes' : 'No'),
    // },
  ];
  //#endregion

  //#region Filters
  const [filterQuery, setFilterQuery] = React.useState<GroupFilter>({
    category: [],
    is_archived: [],
  });

  const filterOption: PopupFilterProps<GroupFilter>['filterOption'] =
    React.useMemo(
      () => [
        {
          id: 'category',
          name: 'Category',
          options: GROUP_CATEGORY_OPTIONS.map((c) => ({
            id: c.value,
            name: c.label,
          })),
        },
        {
          id: 'is_archived',
          name: 'Archive Status',
          options: [
            { id: 'false', name: 'Active' },
            { id: 'true', name: 'Archived' },
          ],
        },
      ],
      [],
    );
  //#endregion

  //#region Fetch Data
  const groupsUrl = buildPaginatedTableURL({
    baseUrl: '/admin/groups',
    tableState,
    additionalParam: {
      category: filterQuery.category[0],
      is_archived: filterQuery.is_archived[0],
    },
  });

  const { data: groupsData, isLoading } = useQuery<
    PaginatedApiResponse<Group[]>
  >({
    queryKey: ['admin-groups', groupsUrl],
    queryFn: async () => {
      const res = await api.get(groupsUrl);
      return res.data;
    },
    placeholderData: keepPreviousData,
    refetchOnWindowFocus: false,
  });
  //#endregion

  return (
    <AdminLayout
      title='Groups'
      subheading='List of all user-created groups'
      breadcrumbs={['/admin', '/admin/groups']}
    >
      <ServerTable
        columns={columns}
        data={groupsData}
        header={
          <PopupFilter
            filterOption={filterOption}
            setFilterQuery={setFilterQuery}
          />
        }
        isLoading={isLoading}
        tableState={tableState}
        setTableState={setTableState}
        withFilter
      />
    </AdminLayout>
  );
}
