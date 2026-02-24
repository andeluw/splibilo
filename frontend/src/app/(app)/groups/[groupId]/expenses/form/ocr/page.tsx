'use client';

import { useQuery } from '@tanstack/react-query';
import { formatISO } from 'date-fns';
import { Plus, ScanText, X } from 'lucide-react';
import { useParams } from 'next/navigation';
import * as React from 'react';
import { FormProvider, useFieldArray, useForm } from 'react-hook-form';
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
import { useOcrReceiptMutation } from '@/app/(app)/groups/[groupId]/expenses/form/ocr/hooks/mutation';
import type { CreateExpenseOCRForm } from '@/app/(app)/groups/[groupId]/expenses/form/ocr/types';
import { EXPENSE_CATEGORY_OPTIONS } from '@/constant/options/expense';

import type { ApiResponse } from '@/types/api';
import type { File as DropzoneFile } from '@/types/dropzone';
import type { GroupMember } from '@/types/entities/group';

type ParsedReceiptItem = {
  name: string;
  quantity: number;
  amount: number;
};

type ParsedReceiptTotals = {
  subtotal: number;
  tax: number;
  grand_total: number;
};

type ParsedReceipt = {
  raw_text: string;
  items: ParsedReceiptItem[];
  totals: ParsedReceiptTotals;
};

export default withAuth(CreateExpenseOcrPage, 'user');

function CreateExpenseOcrPage() {
  const params = useParams();
  const groupId = params?.groupId as string;
  const user = useAuthStore.useUser();

  const [uploadedReceiptUrl, setUploadedReceiptUrl] = React.useState<
    string | null
  >(null);
  const [uploadedReceiptPath, setUploadedReceiptPath] = React.useState<
    string | null
  >(null);

  const methods = useForm<CreateExpenseOCRForm>({
    mode: 'onTouched',
    defaultValues: {
      description: '',
      amount: 0,
      category: '',
      date: '',
      paid_by_user_id: '',
      receipt: null,
      notes: '',
      items: [],
      include_tax: false,
      tax_amount: 0,
      shares: [],
      participant_ids: [],
      participant_search: '',
    },
  });

  const {
    handleSubmit,
    formState: { isValid },
    watch,
    setValue,
    getValues,
    control,
  } = methods;

  const receiptFile = watch('receipt') as DropzoneFile | null;
  const items = (watch('items') ?? []) as {
    name: string;
    quantity: number;
    amount: number;
    participant_ids?: string[];
  }[];
  const includeTax = !!watch('include_tax');
  const taxAmountRaw = watch('tax_amount');
  const taxAmount = Number(taxAmountRaw || 0);

  const {
    fields: itemFields,
    append,
    remove,
    replace,
  } = useFieldArray({
    control,
    name: 'items',
  });

  // Fetch group members
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

  const { mutate: createExpense, isPending: isCreatingExpense } =
    useCreateExpenseMutation({ groupId });

  const { mutateAsync: uploadFile, isPending: isUploading } =
    useUploadFileMutation('receipt');

  const { mutateAsync: parseReceipt, isPending: isParsing } =
    useOcrReceiptMutation();

  // Default payer when members arrive
  React.useEffect(() => {
    if (!members || members.length === 0) return;

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
  }, [members, getValues, setValue, user?.id]);

  // When receipt file changes: upload once, then parse, then fill items + subtotal (+ prefill tax if available)
  React.useEffect(() => {
    if (!receiptFile) {
      setUploadedReceiptUrl(null);
      setUploadedReceiptPath(null);
      replace([]);
      setValue('tax_amount', 0, {
        shouldDirty: true,
        shouldTouch: true,
      });
      setValue('include_tax', false, {
        shouldDirty: true,
        shouldTouch: true,
      });
      return;
    }

    uploadFile({ file: receiptFile })
      .then((uploadRes) => {
        const fileData = uploadRes.data.data as {
          file_url?: string;
          path?: string;
        };

        const fileUrl = fileData.file_url ?? null;
        const filePath = fileData.path ?? null;

        if (!filePath && !fileUrl) {
          toast.error('Upload did not return a valid file path.');
          return;
        }

        setUploadedReceiptUrl(fileUrl);
        setUploadedReceiptPath(filePath);

        return parseReceipt({
          path: filePath ?? fileUrl!,
        });
      })
      .then((parseRes) => {
        if (!parseRes) return;

        const receipt = parseRes.data.data as ParsedReceipt;

        const mappedItems =
          receipt.items?.map((item) => ({
            name: item.name,
            quantity: item.quantity,
            amount: item.amount,
            participant_ids: [] as string[],
          })) ?? [];

        replace(mappedItems);

        // subtotal always from items, not from backend totals
        const subtotalFromItems =
          receipt.items?.reduce((sum, i) => sum + Number(i.amount || 0), 0) ??
          0;

        if (subtotalFromItems > 0) {
          setValue('amount', subtotalFromItems, {
            shouldDirty: true,
            shouldTouch: true,
          });
        }

        // Prefill tax from OCR totals (optional)
        if (
          receipt.totals &&
          typeof receipt.totals.tax === 'number' &&
          receipt.totals.tax > 0
        ) {
          setValue('tax_amount', receipt.totals.tax, {
            shouldDirty: true,
            shouldTouch: true,
          });
          setValue('include_tax', true, {
            shouldDirty: true,
            shouldTouch: true,
          });
        }

        toast.success('Receipt parsed successfully');
      })
      .catch(() => {
        toast.error('Failed to upload or parse receipt');
      });
  }, [receiptFile, uploadFile, parseReceipt, replace, setValue, getValues]);

  // --- derived values (always recomputed from current form state) ---

  // subtotal from items, never from backend
  const subtotal = items.reduce(
    (acc, item) => acc + Number(item?.amount || 0),
    0,
  );

  const effectiveTax = includeTax && taxAmount > 0 ? taxAmount : 0;
  const grandTotal = subtotal + effectiveTax;

  // Per-person summary (equal split per item + proportional tax)
  const perPersonSummary = (() => {
    if (!members || members.length === 0 || items.length === 0) {
      return [] as {
        userId: string;
        name: string;
        base: number;
        tax: number;
        total: number;
      }[];
    }

    const subtotalFromItems = items.reduce(
      (sum, item) => sum + Number(item.amount || 0),
      0,
    );
    if (subtotalFromItems <= 0) return [];

    const preTaxSharesMap = new Map<string, number>();

    for (const item of items) {
      const itemAmount = Number(item.amount || 0);
      const participants = item.participant_ids ?? [];

      if (!itemAmount || itemAmount <= 0 || participants.length === 0) {
        continue;
      }

      const count = participants.length;
      const base = Math.floor(itemAmount / count);
      const remainder = itemAmount - base * count;

      participants.forEach((userId, idx) => {
        const add = base + (idx < remainder ? 1 : 0);
        const current = preTaxSharesMap.get(userId) ?? 0;
        preTaxSharesMap.set(userId, current + add);
      });
    }

    const finalSharesMap = new Map<string, number>(preTaxSharesMap);
    const taxPartsMap = new Map<string, number>();

    if (includeTax && taxAmount > 0 && subtotalFromItems > 0) {
      type UserTaxPart = {
        userId: string;
        base: number;
        remainder: number;
      };

      const taxParts: UserTaxPart[] = [];
      let allocatedBase = 0;

      preTaxSharesMap.forEach((userSubtotal, userId) => {
        const exact = (taxAmount * userSubtotal) / subtotalFromItems;
        const base = Math.floor(exact);
        const remainder = exact - base;
        taxParts.push({ userId, base, remainder });
        allocatedBase += base;
      });

      let remainderLeft = taxAmount - allocatedBase;

      taxParts.sort((a, b) => b.remainder - a.remainder);

      for (let i = 0; i < taxParts.length && remainderLeft > 0; i++) {
        taxParts[i].base += 1;
        remainderLeft -= 1;
      }

      taxParts.forEach(({ userId, base }) => {
        const current = finalSharesMap.get(userId) ?? 0;
        finalSharesMap.set(userId, current + base);
        taxPartsMap.set(userId, base);
      });
    }

    const result = members
      .map((m) => {
        const base = preTaxSharesMap.get(m.user_id) ?? 0;
        const tax = taxPartsMap.get(m.user_id) ?? 0;
        const total = finalSharesMap.get(m.user_id) ?? 0;

        if (base === 0 && tax === 0 && total === 0) return null;

        return {
          userId: m.user_id,
          name: m.user.name,
          base,
          tax,
          total,
        };
      })
      .filter(Boolean) as {
      userId: string;
      name: string;
      base: number;
      tax: number;
      total: number;
    }[];

    return result;
  })();

  // Keep "amount" in sync with subtotal + tax
  React.useEffect(() => {
    if (!Number.isNaN(grandTotal) && grandTotal >= 0) {
      setValue('amount', grandTotal, {
        shouldDirty: true,
        shouldTouch: true,
      });
    }
  }, [grandTotal, setValue]);

  const onSubmit = (data: CreateExpenseOCRForm) => {
    if (!members || members.length === 0) {
      toast.error('Cannot add an expense without any group members.');
      return;
    }

    if (!uploadedReceiptUrl) {
      toast.error('Please upload and parse a receipt image first.');
      return;
    }

    const totalAmountFromForm = Number(data.amount || 0);
    if (!totalAmountFromForm || totalAmountFromForm <= 0) {
      toast.error('Amount must be greater than zero.');
      return;
    }

    const formItems = (data.items ?? []) as {
      name: string;
      quantity: number;
      amount: number;
      participant_ids?: string[];
    }[];

    if (formItems.length === 0) {
      toast.error('Add at least one item from the receipt.');
      return;
    }

    const subtotalFromItems = formItems.reduce(
      (sum, item) => sum + Number(item.amount || 0),
      0,
    );

    const includeTaxFlag = !!data.include_tax;
    const taxInput = includeTaxFlag ? Number(data.tax_amount || 0) : 0;
    const taxToDistribute = includeTaxFlag && taxInput > 0 ? taxInput : 0;

    const expectedGrandTotal = subtotalFromItems + taxToDistribute;

    if (expectedGrandTotal !== totalAmountFromForm) {
      toast.error(
        `Subtotal (${numberToCurrency(
          subtotalFromItems,
        )}) + tax (${numberToCurrency(
          taxToDistribute,
        )}) does not match the total amount field (${numberToCurrency(
          totalAmountFromForm,
        )}). Adjust the items or tax if needed.`,
      );
      return;
    }

    // First compute pre-tax shares from items
    const preTaxSharesMap = new Map<string, number>();

    for (const item of formItems) {
      const label = item.name || 'Item';
      const itemAmount = Number(item.amount || 0);
      const participants = item.participant_ids ?? [];

      if (!itemAmount || itemAmount <= 0) {
        toast.error(`Item "${label}" must have an amount greater than zero.`);
        return;
      }

      if (participants.length === 0) {
        toast.error(`Select at least one participant for "${label}".`);
        return;
      }

      const count = participants.length;
      const base = Math.floor(itemAmount / count);
      const remainder = itemAmount - base * count;

      participants.forEach((userId, idx) => {
        const add = base + (idx < remainder ? 1 : 0);
        const current = preTaxSharesMap.get(userId) ?? 0;
        preTaxSharesMap.set(userId, current + add);
      });
    }

    // Start final shares map from pre-tax shares
    const finalSharesMap = new Map<string, number>(preTaxSharesMap);

    // Distribute tax proportionally to pre-tax shares
    if (taxToDistribute > 0) {
      if (subtotalFromItems <= 0) {
        toast.error('Cannot distribute tax because subtotal is zero.');
        return;
      }

      type UserTaxPart = {
        userId: string;
        base: number;
        remainder: number;
      };

      const taxParts: UserTaxPart[] = [];
      let allocatedBase = 0;

      preTaxSharesMap.forEach((userSubtotal, userId) => {
        const exact = (taxToDistribute * userSubtotal) / subtotalFromItems;
        const base = Math.floor(exact);
        const remainder = exact - base;
        taxParts.push({ userId, base, remainder });
        allocatedBase += base;
      });

      let remainderLeft = taxToDistribute - allocatedBase;

      taxParts.sort((a, b) => b.remainder - a.remainder);

      for (let i = 0; i < taxParts.length && remainderLeft > 0; i++) {
        taxParts[i].base += 1;
        remainderLeft -= 1;
      }

      taxParts.forEach(({ userId, base }) => {
        const current = finalSharesMap.get(userId) ?? 0;
        finalSharesMap.set(userId, current + base);
      });
    }

    const computedShares = Array.from(finalSharesMap.entries()).map(
      ([user_id, amount]) => ({ user_id, amount }),
    );

    const sumComputed = computedShares.reduce(
      (sum, s) => sum + (isNaN(s.amount) ? 0 : s.amount),
      0,
    );

    if (sumComputed !== expectedGrandTotal) {
      toast.error(
        `Computed shares (${numberToCurrency(
          sumComputed,
        )}) do not match subtotal + tax (${numberToCurrency(
          expectedGrandTotal,
        )}). Adjust the items or tax if needed.`,
      );
      return;
    }

    createExpense({
      description: data.description,
      amount: expectedGrandTotal,
      category: data.category,
      date: data.date
        ? new Date(data.date).toISOString()
        : formatISO(new Date()),
      paid_by_user_id: data.paid_by_user_id,
      ...(data.notes ? { notes: data.notes } : {}),
      receipt_url: uploadedReceiptUrl,
      shares: computedShares,
    });
  };

  const isSubmitting = isCreatingExpense || isUploading || isParsing;

  return (
    <UserLayout backHref={`/groups/${groupId}?tab=expenses`}>
      <section className='flex flex-col gap-8'>
        <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
          <div className='flex flex-col gap-2'>
            <Typography variant='h1' className='font-bold text-primary-800'>
              Add Expense from Receipt
            </Typography>
            <Typography variant='b3' className='text-muted-foreground'>
              Upload a receipt, let OCR read it, then edit the items and who
              ordered what.
            </Typography>
          </div>

          {groupId && (
            <ButtonLink
              href={`/groups/${groupId}/expenses/form`}
              variant='outline'
            >
              Use manual form
            </ButtonLink>
          )}
        </div>

        <Card>
          <FormProvider {...methods}>
            <form
              onSubmit={handleSubmit(onSubmit)}
              className='flex flex-col gap-6 p-6 sm:p-8'
            >
              {/* Receipt upload (required) */}
              <DropzoneInput
                id='receipt'
                label='Receipt image'
                helperText='Upload a photo or screenshot of the receipt (PNG/JPG, max 5MB). The system will upload and parse it automatically.'
                maxFiles={1}
                maxSize={5 * 1024 * 1024}
                accept={{ 'image/*': ['.png', '.jpg', '.jpeg'] }}
                validation={{ required: 'Receipt image is required' }}
              />

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
                  placeholder='e.g. 1087900'
                  helperText='Calculated from subtotal + tax. Edit the items or tax to update this amount.'
                  readOnly
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

              <Textarea
                id='notes'
                label='Notes'
                placeholder='Add any extra details like tip, taxes, or context (optional).'
                rows={3}
              />

              {/* Items & participants */}
              <div className='space-y-4 rounded-lg border bg-card/70 p-5 sm:p-6'>
                <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
                  <div>
                    <Typography variant='b2' className='font-semibold'>
                      Items and participants
                    </Typography>
                    <Typography variant='c1' className='text-muted-foreground'>
                      Edit each item from the receipt and select who shared it.
                      We&apos;ll calculate everyone&apos;s total for you.
                    </Typography>
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

                {itemFields.length === 0 && (
                  <Typography variant='c2' className='text-muted-foreground'>
                    No items yet. Upload a receipt or click &quot;Add item&quot;
                    to add rows manually.
                  </Typography>
                )}

                {itemFields.length > 0 && (
                  <ScrollArea className='h-80 rounded-lg border bg-background/60'>
                    <div className='divide-y'>
                      {itemFields.map((field, index) => (
                        <div
                          key={field.id}
                          className='grid items-start gap-4 px-4 py-4 sm:grid-cols-[minmax(0,2fr)_minmax(0,1.4fr)]'
                        >
                          <div className='space-y-3'>
                            <Input
                              id={`items.${index}.name`}
                              label='Item'
                              placeholder='e.g. Pizza'
                              helperText={
                                index === 0
                                  ? 'You can rename items if OCR text is messy.'
                                  : undefined
                              }
                            />
                            <div className='grid gap-3 sm:grid-cols-2'>
                              <Input
                                id={`items.${index}.quantity`}
                                label='Qty'
                                type='number'
                                min={1}
                                placeholder='1'
                              />
                              <Input
                                id={`items.${index}.amount`}
                                label='Total price'
                                type='number'
                                min={0}
                                prefix='Rp'
                                placeholder='0'
                              />
                            </div>
                          </div>

                          <div className='flex flex-col gap-3'>
                            <div className='flex items-center justify-between gap-2'>
                              <Typography
                                variant='c2'
                                className='text-muted-foreground'
                              >
                                Who joined this?
                              </Typography>
                              <Button
                                type='button'
                                size='icon'
                                variant='ghost'
                                className='h-8 w-8'
                                onClick={() => remove(index)}
                              >
                                <X className='h-4 w-4' />
                              </Button>
                            </div>

                            <div className='flex flex-wrap gap-2'>
                              {members?.map((m) => (
                                <div
                                  key={m.user_id}
                                  className='rounded-md border bg-background px-2 py-1'
                                >
                                  <Checkbox
                                    name={`items.${index}.participant_ids`}
                                    value={m.user_id}
                                    label={m.user.name}
                                    size='sm'
                                  />
                                </div>
                              ))}
                              {(!members || members.length === 0) && (
                                <Typography
                                  variant='c2'
                                  className='text-muted-foreground'
                                >
                                  No members found in this group.
                                </Typography>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}

                {/* Add item button at the bottom */}
                <div className='flex justify-start'>
                  <Button
                    type='button'
                    size='sm'
                    variant='outlineblack'
                    onClick={() =>
                      append({
                        name: '',
                        quantity: 1,
                        amount: 0,
                        participant_ids: [],
                      })
                    }
                    rightIcon={Plus}
                  >
                    Add item
                  </Button>
                </div>

                {/* Tax control */}
                <div className='space-y-3 rounded-lg border bg-background/60 p-4'>
                  <div className='flex items-start gap-3'>
                    <Checkbox
                      name='include_tax'
                      label='Include tax from receipt'
                      size='base'
                    />
                  </div>
                  {includeTax && (
                    <div className='mt-2 grid gap-3 sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]'>
                      <Input
                        id='tax_amount'
                        label='Tax amount'
                        type='number'
                        min={0}
                        prefix='Rp'
                        placeholder='e.g. 98700'
                      />
                      <div className='flex items-end'>
                        <Typography
                          variant='c2'
                          className='text-muted-foreground'
                        >
                          Enter the total tax from the receipt. We&apos;ll
                          distribute it proportionally based on each
                          person&apos;s pre-tax share.
                        </Typography>
                      </div>
                    </div>
                  )}
                </div>

                {/* Summary */}
                <div className='rounded-lg border bg-background/60 p-4'>
                  <Typography
                    variant='b3'
                    className='mb-2 font-semibold text-primary-900 dark:text-primary-50'
                  >
                    Summary
                  </Typography>

                  {/* Per-person summary */}
                  {perPersonSummary.length > 0 && (
                    <div className='mb-3 space-y-1.5'>
                      <Typography
                        variant='c2'
                        className='text-muted-foreground'
                      >
                        Per person
                      </Typography>
                      <div className='space-y-1'>
                        {perPersonSummary.map((p) => (
                          <div
                            key={p.userId}
                            className='flex items-center justify-between text-sm'
                          >
                            <span>{p.name}</span>
                            <span className='font-medium'>
                              {numberToCurrency(p.total)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Grand summary */}
                  <div className='space-y-1'>
                    <div className='flex items-center justify-between text-sm'>
                      <span className='text-muted-foreground'>Subtotal</span>
                      <span className='font-medium'>
                        {numberToCurrency(subtotal)}
                      </span>
                    </div>
                    <div className='flex items-center justify-between text-sm'>
                      <span className='text-muted-foreground'>Tax</span>
                      <span className='font-medium'>
                        {includeTax && effectiveTax > 0
                          ? numberToCurrency(effectiveTax)
                          : numberToCurrency(0)}
                      </span>
                    </div>
                    <div className='flex items-center justify-between text-sm'>
                      <span className='text-muted-foreground'>Grand total</span>
                      <span className='font-semibold text-primary-900 dark:text-primary-50'>
                        {numberToCurrency(grandTotal)}
                      </span>
                    </div>
                  </div>
                </div>

                <Typography variant='c2' className='text-amber-700'>
                  *Each item&apos;s price is split equally among the selected
                  participants. Tax is spread based on everyone&apos;s share,
                  and the total is the sum of all items plus tax.
                </Typography>
              </div>

              {/* Submit */}
              <div className='flex justify-end'>
                <Button
                  type='submit'
                  className='w-full sm:w-auto'
                  isLoading={isSubmitting}
                  disabled={!isValid || isSubmitting}
                  rightIcon={ScanText}
                >
                  Save expense
                </Button>
              </div>
            </form>
          </FormProvider>
        </Card>
      </section>
    </UserLayout>
  );
}
