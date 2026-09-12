'use client';

import { useQuery } from '@tanstack/react-query';
import { formatISO } from 'date-fns';
import { ScanText } from 'lucide-react';
import { useParams } from 'next/navigation';
import * as React from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import toast from 'react-hot-toast';

import api from '@/lib/api';
import { useUploadFileMutation } from '@/hooks/mutation/useUploadFileMutation';

import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { DatePicker } from '@/components/datepicker';
import { DropzoneInput } from '@/components/dropzone-input';
import withAuth from '@/components/hoc/withAuth';
import { Input } from '@/components/input';
import UserLayout from '@/components/layout/user/user-layout';
import { Select } from '@/components/select';
import { Textarea } from '@/components/textarea';
import { Typography } from '@/components/typography';

import useAuthStore from '@/store/useAuthStore';

import { useCreateSettlementMutation } from '@/app/(app)/groups/[groupId]/settlements/form/hooks/mutation';
import type { CreateSettlementForm } from '@/app/(app)/groups/[groupId]/settlements/form/types';

import type { ApiResponse } from '@/types/api';
import type { File as DropzoneFile } from '@/types/dropzone';
import type { GroupMember } from '@/types/entities/group';

export default withAuth(CreateSettlementPage, 'user');
function CreateSettlementPage() {
  const params = useParams();
  const groupId = params?.groupId as string;
  const user = useAuthStore.useUser();

  const methods = useForm<CreateSettlementForm>({
    mode: 'onTouched',
    defaultValues: {
      to_user_id: '',
      amount: 0,
      date: '',
      notes: '',
      proof_file: null,
    },
  });

  const {
    handleSubmit,
    formState: { isValid },
    watch,
    setValue,
  } = methods;

  const proofFile = watch('proof_file') as DropzoneFile | null;

  // Fetch group members (to choose whom we pay)
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
    members
      ?.filter((m) => m.user_id !== user?.id) // cannot settle to yourself
      .map((m) => ({
        label: m.user.name,
        value: m.user_id,
      })) ?? [];

  const { mutate: createSettlement, isPending: isCreatingSettlement } =
    useCreateSettlementMutation({ groupId });

  const { mutateAsync: uploadProof, isPending: isUploadingProof } =
    useUploadFileMutation('proof');

  React.useEffect(() => {
    const currentDate = methods.getValues('date');
    if (!currentDate) {
      setValue('date', formatISO(new Date()), {
        shouldDirty: false,
        shouldTouch: false,
      });
    }
  }, [methods, setValue]);

  const onSubmit = (data: CreateSettlementForm) => {
    if (!groupId) {
      toast.error('Group not found.');
      return;
    }

    if (!data.to_user_id) {
      toast.error('Please select who you are settling to.');
      return;
    }

    if (data.to_user_id === user?.id) {
      toast.error('You cannot create a settlement to yourself.');
      return;
    }

    const amount = Number(data.amount || 0);
    if (!amount || amount <= 0) {
      toast.error('Amount must be greater than zero.');
      return;
    }

    const isoDate = data.date
      ? new Date(data.date).toISOString()
      : formatISO(new Date());

    const basePayload = {
      to_user_id: data.to_user_id,
      amount,
      date: isoDate,
      ...(data.notes ? { notes: data.notes } : {}),
    };

    // If there is a proof file, upload it first to get proof_url
    if (proofFile) {
      uploadProof({ file: proofFile })
        .then((uploadRes) => {
          const fileData = uploadRes.data.data as {
            file_url?: string;
          };

          const proofUrl = fileData.file_url;
          if (!proofUrl) {
            toast.error('Upload did not return a proof URL.');
            return;
          }

          createSettlement({
            ...basePayload,
            proof_url: proofUrl,
          });
        })
        .catch(() => {
          toast.error('Failed to upload proof image.');
        });

      return;
    }

    // No proof file, just create settlement
    createSettlement(basePayload);
  };

  const isSubmitting = isCreatingSettlement || isUploadingProof;

  return (
    <UserLayout backHref={`/groups/${groupId}?tab=settlements`}>
      <section className='flex flex-col gap-8'>
        <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
          <div className='flex flex-col gap-2'>
            <Typography as='h1' variant='h1' className='text-primary-800 dark:text-primary-200'>
              Add Settlement
            </Typography>
            <Typography variant='b3' className='text-muted-foreground'>
              Record a payment to settle up with someone in your group.
            </Typography>
          </div>
        </div>

        <Card>
          <FormProvider {...methods}>
            <form
              onSubmit={handleSubmit(onSubmit)}
              className='flex flex-col gap-6 p-6 sm:p-8'
            >
              {/* To user */}
              <Select
                id='to_user_id'
                label='Settle to'
                options={memberOptions}
                placeholder={
                  isLoadingMembers
                    ? 'Loading members…'
                    : 'Select who receives this payment'
                }
                disabled={isLoadingMembers || isErrorMembers}
                helperText='Choose the friend you are paying back.'
                validation={{ required: 'Recipient is required' }}
              />

              {/* Amount & Date */}
              <div className='grid gap-4 sm:grid-cols-2'>
                <Input
                  id='amount'
                  label='Amount'
                  type='number'
                  prefix='Rp'
                  min={0}
                  placeholder='e.g. 100000'
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
                  helperText='When did this settlement happen?'
                  validation={{
                    required: 'Date and time are required',
                  }}
                />
              </div>

              {/* Notes */}
              <Textarea
                id='notes'
                label='Notes'
                placeholder='Optional: add a note like “repayment for dinner on Saturday”.'
                rows={3}
              />

              {/* Proof image (optional) */}
              <DropzoneInput
                id='proof_file'
                label='Proof of payment (optional)'
                helperText='Upload a screenshot or photo of the transfer (PNG/JPG, max 5MB).'
                maxFiles={1}
                maxSize={5 * 1024 * 1024}
                accept={{ 'image/*': ['.png', '.jpg', '.jpeg'] }}
              />

              {/* Submit */}
              <div className='flex justify-end'>
                <Button
                  type='submit'
                  className='w-full sm:w-auto'
                  isLoading={isSubmitting}
                  disabled={!isValid || isSubmitting}
                  rightIcon={ScanText}
                >
                  Save settlement
                </Button>
              </div>
            </form>
          </FormProvider>
        </Card>
      </section>
    </UserLayout>
  );
}
