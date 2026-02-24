'use client';

import * as React from 'react';
import { FormProvider, useForm } from 'react-hook-form';

import { Button } from '@/components/button';
import { Input } from '@/components/input';
import {
  Modal,
  ModalContent,
  ModalDescription,
  ModalFooter,
  ModalHeader,
  ModalSection,
  ModalTitle,
} from '@/components/modal';
import { Typography } from '@/components/typography';

import { useCreateInviteMutation } from '@/app/(app)/groups/[groupId]/hooks/mutation';

type InviteMemberModalReturn = {
  openModal: () => void;
};

type InviteMemberModalProps = {
  groupId: string;
  children: (props: InviteMemberModalReturn) => React.ReactNode;
};

type InviteFormValues = {
  email: string;
};

export function InviteMemberModal({
  groupId,
  children,
}: InviteMemberModalProps) {
  const [open, setOpen] = React.useState(false);

  const methods = useForm<InviteFormValues>({
    mode: 'onTouched',
    defaultValues: { email: '' },
  });

  const {
    handleSubmit,
    reset,
    formState: { isValid },
  } = methods;

  const { mutate: createInvite, isPending: isCreatingInvite } =
    useCreateInviteMutation();

  const modalReturn: InviteMemberModalReturn = {
    openModal: () => setOpen(true),
  };

  const onSubmit = (data: InviteFormValues) => {
    createInvite(
      { groupId, email: data.email },
      {
        onSuccess: () => {
          reset({ email: '' });
          setOpen(false);
        },
      },
    );
  };

  const handleClose = () => {
    reset({ email: '' });
    setOpen(false);
  };

  return (
    <>
      {children(modalReturn)}

      <Modal open={open} onOpenChange={setOpen}>
        <ModalContent>
          <FormProvider {...methods}>
            <form onSubmit={handleSubmit(onSubmit)}>
              <ModalHeader>
                <ModalTitle>Invite member by email</ModalTitle>
                <ModalDescription className='text-muted-foreground'>
                  Send an email invite so your friend can join this group.
                </ModalDescription>
              </ModalHeader>

              <ModalSection className='mt-4 space-y-4'>
                <Input
                  id='email'
                  type='email'
                  label='Email'
                  placeholder='friend@example.com'
                  validation={{
                    required: 'Email is required',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Please enter a valid email address',
                    },
                  }}
                />

                <Typography variant='c1' className='text-muted-foreground'>
                  The invite will be sent to this email address. They will need
                  to accept it before they appear in the members list.
                </Typography>
              </ModalSection>

              <ModalFooter className='gap-2'>
                <Button
                  type='button'
                  variant='outline'
                  className='w-full'
                  onClick={handleClose}
                >
                  Cancel
                </Button>
                <Button
                  type='submit'
                  className='w-full'
                  isLoading={isCreatingInvite}
                  disabled={!isValid || isCreatingInvite}
                >
                  Send invite
                </Button>
              </ModalFooter>
            </form>
          </FormProvider>
        </ModalContent>
      </Modal>
    </>
  );
}
