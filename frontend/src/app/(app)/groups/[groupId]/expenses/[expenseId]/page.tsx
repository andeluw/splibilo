'use client';

import { useQuery } from '@tanstack/react-query';
import { format, formatISO } from 'date-fns';
import { Pencil, X } from 'lucide-react';
import { useParams } from 'next/navigation';
import * as React from 'react';
import { FormProvider, useFieldArray, useForm } from 'react-hook-form';
import toast from 'react-hot-toast';

import api from '@/lib/api';
import { convertUrlToFileWithPreview } from '@/lib/form-utils';
import { numberToCurrency } from '@/lib/helper';
import { useUploadFileMutation } from '@/hooks/mutation/useUploadFileMutation';

import { Button } from '@/components/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/card';
import { DatePicker } from '@/components/datepicker';
import { DropzoneInput } from '@/components/dropzone-input';
import withAuth from '@/components/hoc/withAuth';
import { Input } from '@/components/input';
import UserLayout from '@/components/layout/user/user-layout';
import { Select } from '@/components/select';
import { Textarea } from '@/components/textarea';
import { Typography } from '@/components/typography';

import { useUpdateExpenseMutation } from '@/app/(app)/groups/[groupId]/expenses/[expenseId]/hooks/mutation';
import {
  type ExpenseDetail,
  type UpdateExpenseForm,
} from '@/app/(app)/groups/[groupId]/expenses/[expenseId]/types';
import { EXPENSE_CATEGORY_OPTIONS } from '@/constant/options/expense';

import type { ApiResponse } from '@/types/api';
import type { GroupMember } from '@/types/entities/group';

type RouteParams = {
  groupId: string;
  expenseId: string;
};

function ExpenseDetailPage() {
  const params = useParams() as unknown as RouteParams;
  const groupId = params.groupId;
  const expenseId = params.expenseId;

  const {
    data: expense,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['expense-detail', groupId, expenseId],
    queryFn: async () => {
      const res = await api.get<ApiResponse<ExpenseDetail>>(
        `/groups/${groupId}/expenses/${expenseId}`,
      );
      return res.data.data;
    },
    enabled: !!groupId && !!expenseId,
  });

  const {
    data: members,
    isLoading: isLoadingMembers,
    isError: isErrorMembers,
  } = useQuery({
    queryKey: ['group-members', groupId],
    queryFn: async () => {
      const res = await api.get<ApiResponse<GroupMember[]>>(
        `/groups/${groupId}/members`,
      );
      return res.data.data;
    },
    enabled: !!groupId,
  });

  const memberOptions =
    members?.map((m) => ({
      label: m.user.name,
      value: m.user_id,
    })) ?? [];

  const methods = useForm<UpdateExpenseForm>({
    mode: 'onTouched',
  });

  const {
    handleSubmit,
    reset,
    control,
    formState: { isDirty },
    watch,
  } = methods;

  const {
    fields: shareFields,
    append,
    remove,
  } = useFieldArray({
    control,
    name: 'shares',
  });

  const amountValue = watch('amount');
  const sharesValue = watch('shares') ?? [];
  const receiptValue = watch('receipt');

  const { mutate: updateExpense, isPending: isUpdating } =
    useUpdateExpenseMutation({
      groupId,
      expenseId,
    });

  const { mutateAsync: uploadFile, isPending: isUploadingReceipt } =
    useUploadFileMutation('receipt');

  // Reset form when detail is ready
  React.useEffect(() => {
    if (!expense) return;

    reset({
      description: expense.description,
      amount: expense.amount,
      category: expense.category ?? '',
      date: new Date(expense.date as string),
      paid_by_user_id: expense.paid_by_id,
      notes: expense.notes,
      receipt:
        expense.receipt_url !== '' && expense.receipt_url
          ? convertUrlToFileWithPreview({
              url: expense.receipt_url,
              fileName: `Receipt-${expense.id}`,
            })
          : undefined,
      shares:
        expense.expense_shares?.map((s) => ({
          user_id: s.user_id,
          amount: s.amount,
        })) ?? [],
    });
  }, [expense, reset, isLoading]);

  const totalShares = sharesValue.reduce(
    (sum: number, s: any) => sum + Number(s.amount || 0),
    0,
  );
  const amountNumber = Number(amountValue || 0);
  const sharesMismatch = totalShares !== amountNumber;
  const originalHasReceipt = !!expense?.receipt_url;
  const currentHasReceipt =
    Array.isArray(receiptValue) && receiptValue.length > 0;

  const hasReceiptChangeForButton = originalHasReceipt !== currentHasReceipt;

  const onSubmit = (data: UpdateExpenseForm) => {
    if (!members || members.length === 0) {
      toast.error('Cannot update an expense without group members.');
      return;
    }

    const shares = (data.shares ?? []) as { user_id: string; amount: number }[];

    const originalUrl = expense?.receipt_url ?? null;

    const firstFile =
      Array.isArray(data.receipt) && data.receipt.length > 0
        ? data.receipt[0]
        : null;

    const currentPreviewUrl = firstFile?.preview ?? null;

    const isReceiptChanged =
      originalUrl !== currentPreviewUrl ||
      (originalUrl === null && firstFile !== null) ||
      (originalUrl !== null && firstFile === null);

    Promise.all([
      isReceiptChanged
        ? data.receipt
          ? uploadFile({ file: data.receipt })
          : Promise.resolve(null)
        : Promise.resolve(null),
    ]).then(([uploadRes]) => {
      const rawDate = data.date;
      const isoDate =
        rawDate instanceof Date
          ? rawDate.toISOString()
          : rawDate
            ? new Date(rawDate).toISOString()
            : formatISO(new Date());

      updateExpense({
        description: data.description,
        amount: data.amount,
        category: data.category || undefined,
        date: isoDate,
        ...(isReceiptChanged && {
          receipt_url: uploadRes?.data?.data?.file_url ?? null,
        }),
        notes: data.notes ?? undefined,
        shares,
      });
    });
  };

  return (
    <UserLayout backHref={`/groups/${groupId}?tab=expenses`}>
      <section className='flex flex-col gap-6'>
        {isLoading && (
          <Card>
            <CardContent className='py-10'>
              <Typography variant='c1' className='text-muted-foreground'>
                Loading expense detail…
              </Typography>
            </CardContent>
          </Card>
        )}

        {isError && !isLoading && (
          <Card>
            <CardContent className='py-10'>
              <Typography variant='c1' className='text-destructive'>
                Failed to load expense. Please try again later.
              </Typography>
            </CardContent>
          </Card>
        )}

        {expense && (
          <Card className='shadow-sm'>
            <CardHeader className='flex flex-row items-start justify-between gap-3'>
              <div>
                <CardTitle className='flex items-center gap-2'>
                  Expense details
                  <span className='inline-flex items-center gap-1 rounded-full bg-primary-50 px-2 py-0.5 text-[11px] font-medium text-primary-800 dark:bg-primary-950/50 dark:text-primary-100'>
                    <Pencil className='h-3 w-3' />
                    Editable
                  </span>
                </CardTitle>
                <Typography variant='b3' className='mt-1 text-muted-foreground'>
                  Update any part of this expense, including who paid and how
                  the cost is shared.
                </Typography>
              </div>
              <div className='text-right text-xs text-muted-foreground'>
                <span className='text-nowrap'>
                  Created on{' '}
                  {format(new Date(expense.created_at), 'd MMM yyyy')}
                </span>
                {expense.updated_at !== expense.created_at && (
                  <div>
                    Last updated{' '}
                    {format(new Date(expense.updated_at), 'd MMM yyyy, HH:mm')}
                  </div>
                )}
              </div>
            </CardHeader>

            <CardContent>
              <FormProvider {...methods}>
                <form
                  onSubmit={handleSubmit(onSubmit)}
                  className='flex flex-col gap-6'
                >
                  {/* Basic info */}
                  <div className='space-y-4'>
                    <Input
                      id='description'
                      label='Description'
                      placeholder='e.g. Dinner at Pizza Place'
                      validation={{ required: 'Description is required' }}
                    />

                    <div className='grid gap-4 sm:grid-cols-2'>
                      <Input
                        id='amount'
                        label='Total amount'
                        type='number'
                        prefix='Rp'
                        min={0}
                        helperText='Update the total if the bill changed.'
                        validation={{
                          required: 'Amount is required',
                          min: {
                            value: 1,
                            message: 'Amount must be at least 1',
                          },
                        }}
                      />

                      <DatePicker
                        name='date'
                        label='Date'
                        placeholder='Select'
                        helperText='When did this expense happen?'
                        validation={{
                          required: 'Date and time are required',
                        }}
                      />
                    </div>

                    <div className='grid gap-4 sm:grid-cols-2'>
                      <Select
                        id='category'
                        label='Category'
                        options={EXPENSE_CATEGORY_OPTIONS}
                        placeholder='Select a category'
                        validation={{ required: 'Category is required' }}
                      />

                      <Select
                        id='paid_by_user_id'
                        label='Paid by'
                        options={memberOptions}
                        placeholder={
                          isLoadingMembers
                            ? 'Loading members…'
                            : 'Select who paid this expense'
                        }
                        disabled={isLoadingMembers || isErrorMembers}
                        validation={{ required: 'Payer is required' }}
                        helperText='Choose the person who actually paid this bill.'
                      />
                    </div>

                    <Textarea
                      id='notes'
                      label='Notes'
                      placeholder='Add any extra details like tip, taxes, or context (optional).'
                      rows={3}
                    />

                    {/* Receipt dropzone */}
                    <DropzoneInput
                      id='receipt'
                      label='Receipt image'
                      helperText='Upload or replace the receipt image (PNG/JPG, max 5MB).'
                      maxFiles={1}
                      maxSize={5 * 1024 * 1024}
                      accept={{ 'image/*': ['.png', '.jpg', '.jpeg'] }}
                    />
                  </div>

                  {/* Shares section */}
                  <div className='space-y-3 rounded-lg border bg-card/60 p-4'>
                    <div className='flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between'>
                      <Typography variant='b3' className='font-semibold'>
                        Shares
                      </Typography>
                      <Typography
                        variant='c2'
                        className='text-xs text-muted-foreground'
                      >
                        Total of shares:{' '}
                        <span className='font-semibold'>
                          {numberToCurrency(totalShares)}
                        </span>
                        {sharesMismatch && amountNumber > 0 && (
                          <span className='ml-1 text-owed'>
                            (does not match total)
                          </span>
                        )}
                      </Typography>
                    </div>

                    {shareFields.length === 0 && (
                      <Typography
                        variant='c2'
                        className='text-muted-foreground'
                      >
                        No shares yet. Add at least one person who is part of
                        this expense.
                      </Typography>
                    )}

                    {shareFields.length > 0 && (
                      <div className='space-y-2'>
                        {shareFields.map((field, index) => (
                          <div
                            key={field.id}
                            className='flex flex-wrap items-center gap-3 rounded-lg border bg-background/70 px-3 py-2'
                          >
                            <div className='min-w-[160px] flex-1'>
                              <Select
                                id={`shares.${index}.user_id`}
                                label='Member'
                                options={memberOptions}
                                placeholder='Choose member'
                                validation={{
                                  required: 'Member is required',
                                }}
                              />
                            </div>
                            <div className='w-40'>
                              <Input
                                id={`shares.${index}.amount`}
                                label='Amount'
                                type='number'
                                min={0}
                                prefix='Rp'
                              />
                            </div>
                            <Button
                              type='button'
                              variant='ghost'
                              size='icon'
                              className='h-8 w-8 text-muted-foreground'
                              onClick={() => remove(index)}
                              aria-label='Remove share'
                            >
                              <X className='h-4 w-4' />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className='flex justify-start'>
                      <Button
                        type='button'
                        size='sm'
                        variant='outlineblack'
                        onClick={() =>
                          append({
                            user_id: '',
                            amount: 0,
                          })
                        }
                      >
                        Add participant
                      </Button>
                    </div>

                    <Typography variant='c2' className='text-owed'>
                      *Make sure the total of all shares equals the total amount
                      above.
                    </Typography>
                  </div>

                  <div className='flex justify-end'>
                    <Button
                      type='submit'
                      className='w-full sm:w-auto'
                      isLoading={isUpdating || isUploadingReceipt}
                      disabled={
                        (!isDirty && !hasReceiptChangeForButton) ||
                        isUpdating ||
                        isUploadingReceipt ||
                        sharesMismatch
                      }
                    >
                      Save changes
                    </Button>
                  </div>
                </form>
              </FormProvider>
            </CardContent>
          </Card>
        )}
      </section>
    </UserLayout>
  );
}

export default withAuth(ExpenseDetailPage, 'user');
