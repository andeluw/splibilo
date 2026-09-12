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
import { Select } from '@/components/select';
import { Typography } from '@/components/typography';

import {
  useAcceptInviteMutation,
  useJoinGroupMutation,
} from '@/app/(app)/groups/hooks/mutation';

type JoinGroupForm = {
  method: 'group' | 'invite' | '';
  code: string;
};

type ModalReturnType = {
  openModal: () => void;
};

type JoinGroupModalProps = {
  children: (props: ModalReturnType) => React.JSX.Element;
};

const JOIN_METHOD_OPTIONS = [
  { label: 'Group invite code', value: 'group' },
  { label: 'Member invite code', value: 'invite' },
];

export function JoinGroupModal({ children }: JoinGroupModalProps) {
  const [open, setOpen] = React.useState(false);

  const methods = useForm<JoinGroupForm>({
    mode: 'onTouched',
    defaultValues: {
      method: 'group',
      code: '',
    },
  });

  const { handleSubmit, reset } = methods;

  const { mutate: joinGroup, isPending: isJoining } = useJoinGroupMutation();
  const { mutate: acceptInvite, isPending: isAccepting } =
    useAcceptInviteMutation();

  const isLoading = isJoining || isAccepting;

  const modalReturn: ModalReturnType = {
    openModal: () => setOpen(true),
  };

  const handleClose = () => {
    setOpen(false);
    reset({
      method: 'group',
      code: '',
    });
  };

  const onSubmit = (data: JoinGroupForm) => {
    if (!data.method) return;

    if (data.method === 'group') {
      joinGroup(
        { invite_code: data.code },
        {
          onSuccess: () => {
            handleClose();
          },
        },
      );
    } else {
      acceptInvite(
        { code: data.code },
        {
          onSuccess: () => {
            handleClose();
          },
        },
      );
    }
  };

  return (
    <>
      {children(modalReturn)}

      <Modal open={open} onOpenChange={setOpen}>
        <ModalContent>
          <FormProvider {...methods}>
            <form onSubmit={handleSubmit(onSubmit)}>
              <ModalHeader>
                <ModalTitle>Join with code</ModalTitle>
                <ModalDescription className='text-muted-foreground'>
                  Enter the invite code you received. You can join either using
                  a group invite code or a member invite code.
                </ModalDescription>
              </ModalHeader>

              <ModalSection className='mt-4 space-y-4'>
                <Select
                  id='method'
                  label='Join type'
                  options={JOIN_METHOD_OPTIONS}
                  placeholder='Select join type'
                  helperText='Choose whether you are using a group invite code or a member invite code.'
                  validation={{
                    required: 'Please select how you want to join',
                  }}
                />

                <Input
                  id='code'
                  label='Invite code'
                  placeholder='e.g. QEG57U7Q'
                  validation={{ required: 'Invite code is required' }}
                />

                <Typography variant='c1' className='text-muted-foreground'>
                  Your code usually looks like a short mix of letters and
                  numbers. Ask your friend to send it again if you are not sure.
                </Typography>
              </ModalSection>

              <ModalFooter className='gap-2'>
                <Button
                  type='button'
                  variant='outlineblack'
                  className='w-full'
                  onClick={handleClose}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button
                  type='submit'
                  className='w-full'
                  isLoading={isLoading}
                  disabled={isLoading}
                >
                  Join group
                </Button>
              </ModalFooter>
            </form>
          </FormProvider>
        </ModalContent>
      </Modal>
    </>
  );
}
