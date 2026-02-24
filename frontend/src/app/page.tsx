'use client';

import { ArrowRight,Camera, Receipt, Users, Wallet } from 'lucide-react';

import { ButtonLink } from '@/components/button-link';
import { Card, CardContent } from '@/components/card';
import UserLayout from '@/components/layout/user/user-layout';
import { NextImage } from '@/components/next-image';
import { Typography } from '@/components/typography';

export default function LandingPage() {
  return (
    <UserLayout noLayout>
      <main className='flex flex-col'>
        {/* ======================== HERO ======================== */}
        <section className='flex items-center justify-center min-h-main bg-gradient-to-b from-primary-50/20 to-primary-100  rounded-lg dark:from-primary-950/20'>
          <div className='container mx-auto max-w-5xl text-center px-6'>
            <Typography
              variant='h1'
              className='font-bold text-4xl md:text-5xl tracking-tight text-foreground'
            >
              Shared expenses made simple.
            </Typography>

            <Typography
              variant='b1'
              className='mt-4 text-muted-foreground max-w-xl mx-auto'
            >
              Create groups, track expenses, keep balances clear, and settle up
              effortlessly. Designed for trips, houses, projects, and daily
              life.
            </Typography>

            <div className='mt-8'>
              <ButtonLink href='/auth/register' size='lg'>
                Try Now
              </ButtonLink>
            </div>

            <Card className='mt-16 max-w-2xl mx-auto shadow-lg'>
              <CardContent className='p-6'>
                <div className='flex items-center gap-3 justify-center'>
                  <Receipt className='h-6 w-6 text-primary-700 dark:text-primary-300' />
                  <Typography variant='b1' className='font-semibold'>
                    Receipt scanning built-in
                  </Typography>
                </div>
                <Typography
                  variant='c1'
                  className='text-muted-foreground mt-2 text-center'
                >
                  Snap a photo, and we’ll extract the totals for you.
                </Typography>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* ======================== FEATURES ======================== */}
        <section className='py-24 bg-background'>
          <div className='container mx-auto max-w-6xl px-6 text-center'>
            <Typography
              variant='h2'
              className='text-3xl font-bold tracking-tight text-foreground'
            >
              Features that make sharing easier
            </Typography>

            <div className='mt-14 grid sm:grid-cols-2 lg:grid-cols-3 gap-8'>
              <FeatureCard
                icon={
                  <Users className='h-6 w-6 text-primary-700 dark:text-primary-300' />
                }
                title='Group Management'
                desc='Create groups, invite members, assign roles, and manage permissions.'
              />
              <FeatureCard
                icon={
                  <Wallet className='h-6 w-6 text-primary-700 dark:text-primary-300' />
                }
                title='Clear Balances'
                desc="Automatically see who paid, who owes, and each member's net balance."
              />
              <FeatureCard
                icon={
                  <Camera className='h-6 w-6 text-primary-700 dark:text-primary-300' />
                }
                title='Receipt Capture'
                desc='Upload receipts and extract key details instantly.'
              />
              <FeatureCard
                icon={
                  <Receipt className='h-6 w-6 text-primary-700 dark:text-primary-300' />
                }
                title='Expense History'
                desc='View and filter expenses with full breakdowns and attached images.'
              />
              <FeatureCard
                icon={
                  <ArrowRight className='h-6 w-6 text-primary-700 dark:text-primary-300' />
                }
                title='Settlements'
                desc='Record payments between members and update balances instantly.'
              />
              <FeatureCard
                icon={
                  <Wallet className='h-6 w-6 text-primary-700 dark:text-primary-300' />
                }
                title='Flexible Splits'
                desc='Split evenly or assign custom shares for each member.'
              />
            </div>
          </div>
        </section>

        {/* ======================== OCR LIGHT SECTION ======================== */}
        <section className='py-24 bg-primary-100/40 dark:bg-muted/10'>
          <div className='container mx-auto max-w-5xl px-6'>
            <div className='grid lg:grid-cols-2 gap-12 items-center'>
              <div>
                <Typography
                  variant='h2'
                  className='text-3xl font-bold tracking-tight'
                >
                  Capture receipts with ease
                </Typography>
                <Typography variant='b2' className='text-muted-foreground mt-4'>
                  Just take a picture — we help extract the total and date to
                  speed up your entry. A small touch that saves time on every
                  group outing.
                </Typography>
              </div>

              <Card className='shadow-md'>
                <CardContent className='p-4'>
                  <NextImage
                    src='/images/landing/receipt-demo.png'
                    alt='Receipt demo'
                    layout='fill'
                    className='relative h-80 w-full rounded-md overflow-hidden'
                    imgClassName='object-cover'
                  />
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* ======================== HOW IT WORKS ======================== */}
        <section className='py-24 bg-background'>
          <div className='container mx-auto max-w-6xl px-6 text-center'>
            <Typography
              variant='h2'
              className='text-3xl font-bold tracking-tight'
            >
              How it works
            </Typography>

            <div className='mt-14 grid sm:grid-cols-2 lg:grid-cols-3 gap-8'>
              <StepCard
                number='1'
                title='Create a Group'
                desc='Invite members or share an invite code.'
              />
              <StepCard
                number='2'
                title='Add Expenses'
                desc='Attach receipts, split amounts, and categorize.'
              />
              <StepCard
                number='3'
                title='Settle Up'
                desc='Record payments and keep everyone balanced.'
              />
            </div>
          </div>
        </section>

        {/* ======================== CTA ======================== */}
        <section className='py-24 bg-background text-center'>
          <Typography variant='h2' className='text-3xl font-bold'>
            Ready to begin?
          </Typography>
          <Typography
            variant='b2'
            className='text-muted-foreground mt-2 max-w-lg mx-auto'
          >
            Start sharing expenses with clarity and confidence.
          </Typography>

          <div className='mt-8'>
            <ButtonLink href='/auth/register' size='lg'>
              Try Now
            </ButtonLink>
          </div>
        </section>

        {/* ======================== FOOTER ======================== */}
        <footer className='py-10 border-t bg-background'>
          <div className='container mx-auto max-w-6xl px-6 text-center'>
            <Typography variant='h4' className='font-bold'>
              Splibilo
            </Typography>
            <Typography
              variant='c2'
              className='text-muted-foreground mt-2 max-w-md mx-auto'
            >
              Made to keep group expenses fair, clear, and stress-free.
            </Typography>

            <Typography variant='c2' className='text-muted-foreground mt-6'>
              © {new Date().getFullYear()} Splibilo. All rights reserved.
            </Typography>
          </div>
        </footer>
      </main>
    </UserLayout>
  );
}

/* ===================================================================== */
/* ========================== REUSABLE CARDS ============================ */
/* ===================================================================== */

function FeatureCard({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <Card className='shadow-sm border border-primary-100/40 dark:border-primary-900/40'>
      <CardContent className='p-6 text-left'>
        <div className='mb-3'>{icon}</div>
        <Typography variant='b1' className='font-semibold'>
          {title}
        </Typography>
        <Typography variant='c2' className='text-muted-foreground mt-1'>
          {desc}
        </Typography>
      </CardContent>
    </Card>
  );
}

function StepCard({
  number,
  title,
  desc,
}: {
  number: string;
  title: string;
  desc: string;
}) {
  return (
    <Card className='shadow-sm'>
      <CardContent className='p-6 text-center'>
        <Typography
          variant='h3'
          className='text-primary-700 dark:text-primary-300 font-bold'
        >
          {number}
        </Typography>
        <Typography variant='b1' className='mt-2 font-semibold'>
          {title}
        </Typography>
        <Typography variant='c2' className='text-muted-foreground mt-1'>
          {desc}
        </Typography>
      </CardContent>
    </Card>
  );
}
