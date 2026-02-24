'use client';

import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import { Eye } from 'lucide-react';
import * as React from 'react';

import api from '@/lib/api';
import { numberToCurrency } from '@/lib/helper';
import { buildPaginatedTableURL } from '@/lib/table';
import { useDialog } from '@/hooks/useDialog';
import { useServerTable } from '@/hooks/useServerTable';

import { Button } from '@/components/button';
import withAuth from '@/components/hoc/withAuth';
import { IconLink } from '@/components/icon-link';
import { AdminLayout } from '@/components/layout/admin/admin-layout';
import { PopupFilter, PopupFilterProps } from '@/components/table/popup-filter';
import { ServerTable } from '@/components/table/server-table';

import { useDeleteReceiptMutation } from '@/app/admin/expenses/hooks/mutation';

import { PaginatedApiResponse } from '@/types/api';
import { Expense } from '@/types/entities/expense';

type ExpenseFilter = {
  category: string[];
};

const EXPENSE_CATEGORY_OPTIONS = [
  { id: 'Food', name: 'Food' },
  { id: 'Transport', name: 'Transport' },
  { id: 'Accommodation', name: 'Accommodation' },
  { id: 'Entertainment', name: 'Entertainment' },
  { id: 'Other', name: 'Other' },
];

export default withAuth(AdminExpensesPage, 'admin');
function AdminExpensesPage() {
  const dialog = useDialog();
  //#region //*=========== Mutation ===========
  const { mutate: deleteReceipt, isPending: isLoading } =
    useDeleteReceiptMutation();
  //#endregion

  //#region //*=========== Table Definition ===========
  const { tableState, setTableState } = useServerTable<Expense>();

  const columns: ColumnDef<Expense>[] = [
    {
      header: 'Description',
      accessorKey: 'description',
      enableSorting: false,
    },
    {
      header: 'Group',
      accessorKey: 'group.name',
      enableSorting: false,
      cell: ({ row }) => row.original.group?.name ?? '—',
    },
    {
      header: 'Amount',
      accessorKey: 'amount',
      enableSorting: false,
      cell: ({ row }) => numberToCurrency(row.original.amount),
    },
    {
      header: 'Category',
      accessorKey: 'category',
      enableSorting: false,
    },
    {
      header: 'Date',
      accessorKey: 'date',
      enableSorting: false,
      cell: ({ row }) =>
        row.original.date
          ? format(new Date(row.original.date), 'yyyy-MM-dd')
          : '—',
    },
    {
      header: 'Created By',
      accessorKey: 'created_by.name',
      enableSorting: false,
      cell: ({ row }) => {
        const createdBy = row.original.created_by;
        if (!createdBy) return '—';
        return createdBy.name ?? createdBy.email ?? '—';
      },
    },
    {
      header: 'Paid By',
      accessorKey: 'paid_by.name',
      enableSorting: false,
      cell: ({ row }) => {
        const paidBy = row.original.paid_by;
        if (!paidBy) return '—';
        return paidBy.name ?? paidBy.email ?? '—';
      },
    },
    {
      header: 'Receipt',
      accessorKey: 'receipt_url',
      enableSorting: false,
      cell: ({ row }) => {
        const url = row.original.receipt_url;
        if (!url) return '—';
        return <IconLink href={url} icon={Eye} />;
      },
    },
    {
      id: 'actions',
      header: 'Action',
      enableSorting: false,
      cell: ({ row }) => {
        return (
          row.original.receipt_url && (
            <Button
              variant='destructive'
              size='sm'
              isLoading={isLoading}
              onClick={() =>
                dialog({
                  title: `Delete receipt`,
                  description:
                    'Are you sure you want to delete this receipt? This action cannot be undone.',
                  submitText: 'Delete',
                  variant: 'danger',
                  withIcon: false,
                  catchOnCancel: true,
                }).then(() => {
                  deleteReceipt({ id: row.original.id });
                })
              }
            >
              Delete Receipt
            </Button>
          )
        );
      },
    },
  ];
  //#endregion

  //#region //*=========== Filters ===========
  const [filterQuery, setFilterQuery] = React.useState<ExpenseFilter>({
    category: [],
  });

  const filterOption: PopupFilterProps<ExpenseFilter>['filterOption'] =
    React.useMemo(
      () => [
        {
          id: 'category',
          name: 'Category',
          options: EXPENSE_CATEGORY_OPTIONS,
        },
      ],
      [],
    );
  //#endregion

  //#region //*=========== Fetch Data ===========
  const expensesUrl = buildPaginatedTableURL({
    baseUrl: '/admin/expenses',
    tableState,
    additionalParam: {
      category: filterQuery.category[0],
    },
  });

  const { data: expensesData, isLoading: isLoadingExpenses } = useQuery<
    PaginatedApiResponse<Expense[]>
  >({
    queryKey: ['admin-expenses', expensesUrl],
    queryFn: async () => {
      const res = await api.get(expensesUrl);
      return res.data;
    },
    placeholderData: keepPreviousData,
    refetchOnWindowFocus: false,
  });
  //#endregion

  return (
    <AdminLayout
      title='Expenses'
      subheading='Review all recorded expenses on the platform.'
      breadcrumbs={['/admin', '/admin/expenses']}
    >
      <ServerTable
        columns={columns}
        data={expensesData}
        header={
          <PopupFilter
            filterOption={filterOption}
            setFilterQuery={setFilterQuery}
          />
        }
        isLoading={isLoadingExpenses}
        tableState={tableState}
        setTableState={setTableState}
        withFilter
      />
    </AdminLayout>
  );
}
