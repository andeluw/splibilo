import { LoaderCircle } from 'lucide-react';

export default function Loading() {
  return (
    <div className='flex h-screen w-full items-center justify-center'>
      <LoaderCircle className='text-primary-600 dark:text-primary-300 h-10 w-10 animate-spin' />
    </div>
  );
}
