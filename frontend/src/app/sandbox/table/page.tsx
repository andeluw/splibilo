'use client';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { ColumnDef } from '@tanstack/react-table';
import { Eye } from 'lucide-react';
import * as React from 'react';

import { mockQuery } from '@/lib/axios-mock';
import { buildPaginatedTableURL } from '@/lib/table';
import { useRenderCount } from '@/hooks/useRenderCount';
import { useServerTable } from '@/hooks/useServerTable';

import { IconButton } from '@/components/icon-button';
import { PaginatedTable } from '@/components/table/paginated-table';
import { PopupFilter, PopupFilterProps } from '@/components/table/popup-filter';
import { ServerTable } from '@/components/table/server-table';
import { Table } from '@/components/table/table';
import { Typography } from '@/components/typography';

import { User } from '@/app/api/mock/users/route';

import SandboxLayout from '../containers/SandboxLayout';

import { ApiResponse, PaginatedApiResponse } from '@/types/api';

// useServerTable reads useSearchParams, which Next refuses to prerender
// without a boundary above it.
export default function Page() {
  return (
    <React.Suspense fallback={null}>
      <TablePage />
    </React.Suspense>
  );
}

type UserFilter = {
  country: string[];
};

function TablePage() {
  const renderCount = useRenderCount();

  //#region  //*=========== Table Definition ===========
  const { tableState, setTableState } = useServerTable<User>();

  /**
   * Behavior:
   * - If no size set, text won't truncate and will take as much space as the content needs
   *      creating an overflow if needed
   * - If size is set, it will be truncated to the pixel specified
   */
  const columns: ColumnDef<User>[] = [
    {
      accessorKey: 'name',
      header: 'Role',
      // To set size, add size in pixel
      size: 200,
    },
    {
      accessorKey: 'email',
      header: 'Email',
    },
    {
      accessorKey: 'country',
      header: 'Country',
    },
    {
      id: 'actions',
      header: 'Action',
      cell: () => <IconButton variant='outline' icon={Eye} />,
    },
  ];
  //#endregion  //*======== Table Definition ===========

  //#region  //*=========== Fetch Data ===========
  const [filterQuery, setFilterQuery] = React.useState<UserFilter>({
    country: [],
  });

  const filterOption: PopupFilterProps<UserFilter>['filterOption'] =
    React.useMemo(
      () => [
        {
          id: 'country',
          name: 'Country',
          options: [
            { id: 'Indonesia', name: 'Indonesia' },
            { id: 'Malaysia', name: 'Malaysia' },
            { id: 'Singapore', name: 'Singapore' },
          ],
        },
      ],
      [],
    );

  const url = buildPaginatedTableURL({
    baseUrl: '/users',
    tableState,
    additionalParam: {
      country: filterQuery.country,
    },
  });

  const { data: queryData, isLoading } = useQuery<PaginatedApiResponse<User[]>>(
    {
      queryKey: [url],
      queryFn: mockQuery,
      placeholderData: keepPreviousData,
    },
  );

  const { data: unpaginatedData } = useQuery<ApiResponse<User[]>>({
    queryKey: ['/users'],
    queryFn: mockQuery,
    placeholderData: keepPreviousData,
  });
  //#endregion  //*======== Fetch Data ===========

  return (
    <SandboxLayout title='Table Sandbox'>

      <Typography as='h2' variant='h2' className='mt-8'>
        Server Table
      </Typography>
      <Typography variant='b2'>
        Table state such as filter, sort, and pagination is managed on the
        server.
      </Typography>
      <pre>
        {JSON.stringify(
          { renderCount, tableState, url, filterQuery },
          null,
          2,
        )}
      </pre>

      <ServerTable
        columns={columns}
        data={queryData}
        header={
          <PopupFilter
            filterOption={filterOption}
            setFilterQuery={setFilterQuery}
          />
        }
        isLoading={isLoading}
        tableState={tableState}
        setTableState={setTableState}
        className='mt-8'
        withFilter
      />

      <Typography as='h2' variant='h2' className='mt-8'>
        Paginated Table
      </Typography>
      <Typography variant='b2'>
        Server returned all the data then paginated on the client.
      </Typography>

      <PaginatedTable
        columns={columns}
        data={unpaginatedData?.data ?? []}
        withFilter
      />

      <Typography as='h2' variant='h2' className='mt-8'>
        Table
      </Typography>
      <Typography variant='b2'>
        Server returned all the data then paginated on the client.
      </Typography>

      <Table
        columns={columns}
        data={unpaginatedData?.data.slice(0, 20) ?? []}
        withFilter
      />
    </SandboxLayout>
  );
}
