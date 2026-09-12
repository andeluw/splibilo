'use client';

import { useQuery } from '@tanstack/react-query';
import { formatISO } from 'date-fns';
import { Check, ScanText, Split, X } from 'lucide-react';
import { useParams } from 'next/navigation';
import * as React from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import toast from 'react-hot-toast';

import api from '@/lib/api';
import { numberToCurrency } from '@/lib/helper';
import { useUploadFileMutation } from '@/hooks/mutation/useUploadFileMutation';

import { Button } from '@/components/button';
import { ButtonLink } from '@/components/button-link';
import { Card } from '@/components/card';
import { Checkbox } from '@/components/checkbox';
import { DatePicker } from '@/components/datepicker';
import { DropzoneInput } from '@/components/dropzone-input';
import withAuth from '@/components/hoc/withAuth';
import { Input } from '@/components/input';
import UserLayout from '@/components/layout/user/user-layout';
import { ScrollArea } from '@/components/scroll-area';
import { Select } from '@/components/select';
import { Textarea } from '@/components/textarea';
import { Typography } from '@/components/typography';

import useAuthStore from '@/store/useAuthStore';

import { useCreateExpenseMutation } from '@/app/(app)/groups/[groupId]/expenses/form/hooks/mutation';
import { CreateExpenseForm } from '@/app/(app)/groups/[groupId]/expenses/form/types';
import { EXPENSE_CATEGORY_OPTIONS } from '@/constant/options/expense';

import type { ApiResponse } from '@/types/api';
import type { GroupMember } from '@/types/entities/group';

export default withAuth(CreateExpensePage, 'user');

function CreateExpensePage() {
  const params = useParams();
  const groupId = params?.groupId as string;
  const user = useAuthStore.useUser();

  const methods = useForm<CreateExpenseForm>({
    mode: 'onTouched',
    defaultValues: {
      description: '',
      amount: 0,
      category: '',
      date: '',
      paid_by_user_id: '',
      receipt: null,
      notes: '',
      participant_ids: [],
      participant_search: '',
      shares: [],
    },
  });

  const {
    handleSubmit,
    formState: { isValid },
    watch,
    setValue,
    getValues,
  } = methods;

  const amountValue = watch('amount');
  const participantIds = watch('participant_ids') ?? [];
  const participantSearch = watch('participant_search') ?? '';
  const shares = watch('shares') ?? [];

  // Fetch members
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

  // Default participants & payer when members arrive
  React.useEffect(() => {
    if (!members || members.length === 0) return;

    const currentParticipantIds = getValues('participant_ids') ?? [];
    if (currentParticipantIds.length === 0) {
      const allIds = members.map((m) => m.user_id);
      setValue('participant_ids', allIds, {
        shouldDirty: false,
        shouldTouch: false,
      });
    }

    const currentPayer = getValues('paid_by_user_id');
    if (!currentPayer) {
      const currentUser = user?.id;
      if (currentUser) {
        setValue('paid_by_user_id', currentUser, {
          shouldDirty: false,
          shouldTouch: false,
        });
      }
    }
  }, [members, getValues, setValue]);

  React.useEffect(() => {
    if (!members || members.length === 0) return;

    const selectedMembers = members.filter((m) =>
      participantIds.includes(m.user_id),
    );

    const currentShares = (getValues('shares') ?? []) as {
      user_id: string;
      amount: number;
    }[];

    const newShares = selectedMembers.map((m) => {
      const existing = currentShares.find((s) => s.user_id === m.user_id);
      return (
        existing ?? {
          user_id: m.user_id,
          amount: 0,
        }
      );
    });

    const currentIds = currentShares
      .filter((s) => selectedMembers.some((m) => m.user_id === s.user_id))
      .map((s) => s.user_id)
      .sort();

    const newIds = newShares.map((s) => s.user_id).sort();

    if (currentIds.join(',') !== newIds.join(',')) {
      setValue('shares', newShares, {
        shouldDirty: true,
        shouldTouch: true,
      });
    }
  }, [participantIds, members, getValues, setValue]);

  const { mutate: createExpense, isPending: isCreatingExpense } =
    useCreateExpenseMutation({ groupId });

  const { mutateAsync: uploadFile, isPending: isUploading } =
    useUploadFileMutation('receipt');

  const handleSplitEqually = () => {
    if (!members || members.length === 0) return;

    const selectedMembers = members.filter((m) =>
      participantIds.includes(m.user_id),
    );

    if (selectedMembers.length === 0) {
      toast.error('Select at least one member to split with.');
      return;
    }

    const rawAmount = Number(amountValue || 0);
    if (!rawAmount || rawAmount <= 0) {
      toast.error('Enter the total amount first before splitting.');
      return;
    }

    const count = selectedMembers.length;
    const base = Math.floor(rawAmount / count);
    const remainder = rawAmount - base * count;

    const newShares = selectedMembers.map((m, index) => ({
      user_id: m.user_id,
      amount: base + (index === 0 ? remainder : 0),
    }));

    setValue('shares', newShares, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    });
  };

  const handleIncludeAll = () => {
    if (!members || members.length === 0) return;

    setValue(
      'participant_ids',
      members.map((m) => m.user_id),
      {
        shouldDirty: true,
        shouldTouch: true,
        shouldValidate: true,
      },
    );
  };

  const handleClearAll = () => {
    setValue('participant_ids', [], {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    });
  };

  const onSubmit = (data: CreateExpenseForm) => {
    if (!members || members.length === 0) {
      toast.error('Cannot add an expense without any group members.');
      return;
    }

    const totalAmount = Number(data.amount || 0);
    if (!totalAmount || totalAmount <= 0) {
      toast.error('Amount must be greater than zero.');
      return;
    }

    const sharesWithAmount = (data.shares ?? []).map((s) => ({
      ...s,
      amount: Number(s.amount || 0),
    }));

    if (sharesWithAmount.length === 0) {
      toast.error('Select at least one participant for the split.');
      return;
    }

    const sumShares = sharesWithAmount.reduce(
      (sum, s) => sum + (isNaN(s.amount) ? 0 : s.amount),
      0,
    );

    if (sumShares !== totalAmount) {
      toast.error(
        `Shares must add up to the total amount. Currently: ${numberToCurrency(
          sumShares,
        )} / ${numberToCurrency(totalAmount)}`,
      );
      return;
    }

    const hasReceiptFile = !!data.receipt;

    Promise.all([
      hasReceiptFile
        ? uploadFile({ file: data.receipt! })
        : Promise.resolve(null),
    ]).then(([uploadRes]) => {
      createExpense({
        description: data.description,
        amount: totalAmount,
        category: data.category,
        date: data.date
          ? new Date(data.date).toISOString()
          : formatISO(new Date()),
        paid_by_user_id: data.paid_by_user_id,
        ...(data.notes ? { notes: data.notes } : {}),
        ...(hasReceiptFile
          ? { receipt_url: uploadRes?.data.data.file_url }
          : {}),
        shares: sharesWithAmount.map((s) => ({
          user_id: s.user_id,
          amount: s.amount,
        })),
      });
    });
  };

  const isSubmitting = isCreatingExpense || isUploading;

  const memberOptions =
    members?.map((m) => ({
      label: m.user.name,
      value: m.user_id,
    })) ?? [];

  const totalMembers = members?.length ?? 0;
  const selectedCount = participantIds.length;

  const filteredMembers =
    members?.filter((m) => {
      if (!participantSearch) return true;
      const q = participantSearch.toLowerCase();
      return (
        m.user.name.toLowerCase().includes(q) ||
        m.user.email.toLowerCase().includes(q)
      );
    }) ?? [];

  return (
    <UserLayout backHref={`/groups/${groupId}?tab=expenses`}>
      <section className='flex flex-col gap-8'>
        <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
          <div className='flex flex-col gap-2'>
            <Typography as='h1' variant='h1' className='text-primary-800 dark:text-primary-200'>
              Add Expense
            </Typography>
            <Typography variant='b3' className='text-muted-foreground'>
              Record a new expense and decide who pays and how it is shared.
            </Typography>
          </div>

          {groupId && (
            <ButtonLink
              href={`/groups/${groupId}/expenses/form/ocr`}
              variant='primary'
              rightIcon={ScanText}
            >
              Use receipt OCR
            </ButtonLink>
          )}
        </div>

        <Card>
          <FormProvider {...methods}>
            <form
              onSubmit={handleSubmit(onSubmit)}
              className='flex flex-col gap-6 p-6 sm:p-8'
            >
              {/* Basic info */}
              <Input
                id='description'
                label='Description'
                placeholder='e.g. Dinner at Seafood Restaurant'
                validation={{ required: 'Description is required' }}
              />

              <div className='grid gap-4 sm:grid-cols-2'>
                <Input
                  id='amount'
                  label='Total amount'
                  type='number'
                  prefix='Rp'
                  min={0}
                  placeholder='e.g. 250000'
                  helperText='Use the total amount for the whole bill.'
                  validation={{
                    required: 'Amount is required',
                    min: {
                      value: 1,
                      message: 'Amount must be at least 1',
                    },
                  }}
                />

                <DatePicker
                  id='date'
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

              {/* Receipt & notes */}
              <DropzoneInput
                id='receipt'
                label='Receipt (optional)'
                helperText='Upload a photo or screenshot of the receipt (PNG/JPG, max 5MB).'
                maxFiles={1}
                maxSize={5 * 1024 * 1024}
                accept={{ 'image/*': ['.png', '.jpg', '.jpeg'] }}
              />

              <Textarea
                id='notes'
                label='Notes'
                placeholder='Add any extra details like tip, taxes, or context (optional).'
                rows={3}
              />

              {/* Shares section */}
              <div className='space-y-4 rounded-lg border bg-card/70 p-5 sm:p-6'>
                <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
                  <div>
                    <Typography variant='b2' className='font-semibold'>
                      Split between members
                    </Typography>
                    <Typography variant='c1' className='text-muted-foreground'>
                      Decide which members are included and how much each pays.
                    </Typography>
                    <Typography
                      variant='c2'
                      className='mt-1 text-muted-foreground'
                    >
                      Selected {selectedCount} of {totalMembers} members.
                    </Typography>
                  </div>

                  <div className='flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3'>
                    <Input
                      id='participant_search'
                      placeholder='Search members'
                      className='sm:w-52'
                    />
                    <div className='flex gap-2 self-end sm:self-auto'>
                      <Button
                        type='button'
                        size='sm'
                        variant='primary'
                        onClick={handleIncludeAll}
                        disabled={!members || members.length === 0}
                        rightIcon={Check}
                      >
                        Include all
                      </Button>
                      <Button
                        type='button'
                        size='sm'
                        variant='outlineblack'
                        onClick={handleClearAll}
                        disabled={!members || members.length === 0}
                        rightIcon={X}
                      >
                        Clear
                      </Button>
                      <Button
                        type='button'
                        size='sm'
                        variant='ghost'
                        onClick={handleSplitEqually}
                        disabled={
                          !members ||
                          members.length === 0 ||
                          !amountValue ||
                          Number(amountValue) <= 0
                        }
                        rightIcon={Split}
                      >
                        Split equally
                      </Button>
                    </div>
                  </div>
                </div>

                {isLoadingMembers && (
                  <Typography
                    variant='c1'
                    className='pt-2 text-muted-foreground'
                  >
                    Loading members…
                  </Typography>
                )}

                {isErrorMembers && (
                  <Typography variant='c1' className='pt-2 text-destructive'>
                    Failed to load members. You can retry later.
                  </Typography>
                )}

                {!isLoadingMembers &&
                  !isErrorMembers &&
                  (!members || members.length === 0) && (
                    <Typography
                      variant='c1'
                      className='pt-2 text-muted-foreground'
                    >
                      No members found in this group.
                    </Typography>
                  )}

                {!isLoadingMembers &&
                  !isErrorMembers &&
                  members &&
                  members.length > 0 && (
                    <div className='rounded-lg border bg-background/60'>
                      <ScrollArea className='h-64'>
                        <div className='divide-y'>
                          {filteredMembers.map((m) => {
                            const isIncluded = participantIds.includes(
                              m.user_id,
                            );
                            const shareIndex = shares.findIndex(
                              (s: { user_id: string }) =>
                                s.user_id === m.user_id,
                            );

                            return (
                              <div
                                key={m.user_id}
                                className='flex items-center justify-between gap-4 px-4 py-4'
                              >
                                <div className='flex flex-col gap-1'>
                                  <Checkbox
                                    name='participant_ids'
                                    value={m.user_id}
                                    label={m.user.name}
                                    size='base'
                                  />
                                  <Typography
                                    variant='c2'
                                    className='ml-6 text-muted-foreground'
                                  >
                                    {m.user.email}
                                  </Typography>
                                </div>

                                <div className='w-40'>
                                  {isIncluded && shareIndex !== -1 ? (
                                    <Input
                                      id={`shares.${shareIndex}.amount`}
                                      label='Share'
                                      type='number'
                                      min={0}
                                      prefix='Rp'
                                      placeholder='0'
                                      disabled={amountValue === 0}
                                    />
                                  ) : (
                                    <Typography
                                      variant='c2'
                                      className='text-right text-muted-foreground'
                                    >
                                      Not included
                                    </Typography>
                                  )}
                                </div>
                              </div>
                            );
                          })}

                          {filteredMembers.length === 0 && (
                            <div className='px-4 py-3'>
                              <Typography
                                variant='c2'
                                className='text-muted-foreground'
                              >
                                No members match your search.
                              </Typography>
                            </div>
                          )}
                        </div>
                      </ScrollArea>
                    </div>
                  )}

                <Typography variant='c2' className='text-owed'>
                  *Make sure the sum of all shares equals the total amount.
                </Typography>
              </div>

              {/* Submit */}
              <div className='flex justify-end'>
                <Button
                  type='submit'
                  className='w-full sm:w-auto'
                  isLoading={isSubmitting}
                  disabled={!isValid || isSubmitting}
                >
                  Add Expense
                </Button>
              </div>
            </form>
          </FormProvider>
        </Card>
      </section>
    </UserLayout>
  );
}
