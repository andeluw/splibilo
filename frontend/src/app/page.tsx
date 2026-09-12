import {
  ArrowRight,
  Bolt,
  Fingerprint,
  SlidersHorizontal,
  Vault,
} from 'lucide-react';
import * as React from 'react';

import { ButtonLink } from '@/components/button-link';
import { ReceiptScan } from '@/components/layout/marketing/receipt-scan';
import { SettlementDiagram } from '@/components/layout/marketing/settlement-diagram';
import { SiteFooter } from '@/components/layout/marketing/site-footer';
import { Navbar } from '@/components/layout/user/navbar';
import { PrimaryLink } from '@/components/primary-link';
import { Typography } from '@/components/typography';

const steps = [
  {
    n: '01',
    title: 'Start a group',
    body: 'Invite people by email, or send them a code. You decide who is allowed to change an expense after it goes in.',
  },
  {
    n: '02',
    title: 'Add what you spent',
    body: 'Photograph the receipt or type it in. Split it evenly, or give each person their own amount.',
  },
  {
    n: '03',
    title: 'Settle in fewer payments',
    body: 'Splibilo untangles who owes who and works out the shortest set of transfers that clears everyone.',
  },
];

const features = [
  {
    icon: Fingerprint,
    title: 'Permissions that stick',
    body: 'Group owners choose who can edit or delete an expense once it is logged. Nobody quietly rewrites the history.',
  },
  {
    icon: SlidersHorizontal,
    title: 'Shares that add up',
    body: 'Give each person their own amount. Splibilo checks the parts against the total before saving, so nothing is lost in the rounding.',
  },
  {
    icon: Vault,
    title: 'Edits without surprises',
    body: 'Correct an amount and every share attached to it moves with it. You never end up with a half-fixed expense.',
  },
  {
    icon: Bolt,
    title: 'Balances that keep up',
    body: 'Add an expense or record a payment and every balance in the group updates at once, including the ones you are not part of.',
  },
];

export default function LandingPage() {
  return (
    <div className='bg-background text-foreground flex min-h-dvh flex-col'>
      <Navbar />
      <main id='main' className='flex-1'>
        <Hero />
        <SpecStrip />
        <HowItWorks />
        <Receipts />
        <Settlements />
        <Features />
        <ClosingCta />
      </main>
      <SiteFooter />
    </div>
  );
}

function Hero() {
  return (
    <section className='ambient grain relative overflow-hidden'>
      <div className='layout-wide relative grid items-center gap-16 pt-16 pb-24 md:pt-24 md:pb-32 lg:grid-cols-12 lg:gap-10'>
        <div className='lg:col-span-6'>
          <Typography
            as='h1'
            variant='j1'
            className='font-display text-4xl leading-[1.06] font-extrabold tracking-[-0.035em] md:text-5xl lg:text-6xl'
          >
            Everyone paid something.{' '}
            <span className='text-muted-foreground'>
              Nobody knows what they owe.
            </span>
          </Typography>

          <Typography
            variant='b1'
            className='text-muted-foreground mt-6 max-w-[52ch] leading-relaxed'
          >
            Splibilo keeps the running total for a trip, a house, or a shared
            project. Put the spending in, and it works out who owes what and the
            quickest way to square up.
          </Typography>

          <div className='mt-10 flex flex-wrap items-center gap-x-7 gap-y-4'>
            <ButtonLink
              href='/register'
              size='md'
              rightIcon={ArrowRight}
              className='px-6 transition-transform duration-200 active:translate-y-px'
            >
              Create a group
            </ButtonLink>
            <PrimaryLink
              href='/login'
              className='text-muted-foreground hover:text-foreground text-sm transition-colors duration-200'
            >
              I already have an account
            </PrimaryLink>
          </div>
        </div>

        <div className='lg:col-span-6 lg:pl-6'>
          <GroupPreview />
        </div>
      </div>
    </section>
  );
}

/* A still of the group screen. Not wired to data, it is here to show the shape
   of the product above the fold. */
function GroupPreview() {
  const members = [
    { name: 'Laura Bennett', amount: '+184.200', isCredit: true },
    { name: 'Brian Foster', amount: '+41.750', isCredit: true },
    { name: 'Devon Carter', amount: '−96.400', isCredit: false },
    { name: 'Emma Walsh', amount: '−129.550', isCredit: false },
  ];

  return (
    <div className='relative'>
      <div className='bg-card shadow-ink border-border/60 rounded-2xl border p-6 md:p-7'>
        <div className='flex items-start justify-between gap-4'>
          <div>
            <Typography className='text-muted-foreground text-xs font-medium'>
              Group
            </Typography>
            <Typography variant='h3' className='mt-1.5'>
              Bali, long weekend
            </Typography>
          </div>
          <span className='border-primary-200 text-primary-700 dark:border-primary-800 dark:text-primary-300 figure rounded border px-2 py-1 text-[11px] font-medium'>
            4 members
          </span>
        </div>

        <dl className='border-border/70 mt-6 flex items-end justify-between border-t pt-5'>
          <div>
            <dt className='text-muted-foreground text-xs font-medium'>
              Total logged
            </dt>
            <dd className='figure mt-1.5 text-xl font-semibold sm:text-2xl'>
              Rp 1.842.300
            </dd>
          </div>
          <div className='text-right'>
            <dt className='text-muted-foreground text-xs font-medium'>
              Unsettled
            </dt>
            <dd className='figure text-owed mt-1.5 text-xl font-semibold sm:text-2xl'>
              Rp 225.950
            </dd>
          </div>
        </dl>

        <ul className='mt-5'>
          {members.map((member, index) => (
            <li
              key={member.name}
              className='animate-rise flex items-center justify-between gap-4 py-2.5'
              style={{ animationDelay: `${180 + index * 60}ms` }}
            >
              <div className='flex items-center gap-3'>
                <span
                  aria-hidden
                  className='bg-secondary text-muted-foreground flex h-8 w-8 items-center justify-center rounded-lg text-[11px] font-semibold'
                >
                  {member.name
                    .split(' ')
                    .map((part) => part[0])
                    .join('')}
                </span>
                <Typography variant='s3'>{member.name}</Typography>
              </div>
              <span
                className={
                  member.isCredit
                    ? 'figure text-credit text-sm font-semibold'
                    : 'figure text-owed text-sm font-semibold'
                }
              >
                {member.amount}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* Pulled up over the card so the two surfaces read as depth, not a stack */}
      <div className='bg-primary-700 shadow-ink relative -mt-6 ml-8 w-[min(20rem,85%)] rounded-xl p-4 text-white md:ml-14'>
        <p className='text-xs font-medium text-white/70'>Suggested transfer</p>
        <p className='mt-2 text-base font-medium'>Emma pays Laura</p>
        <p className='figure mt-0.5 text-lg font-semibold'>Rp 129.550</p>
      </div>
    </div>
  );
}

function SpecStrip() {
  const specs = [
    ['Splits', 'Share it evenly, or set the amount per person'],
    ['Receipts', 'Photograph one and the form fills itself in'],
    ['Settling up', 'The fewest payments that clear the whole group'],
  ];

  return (
    <section className='border-border/70 border-y'>
      <div className='layout-wide grid divide-y sm:grid-cols-3 sm:divide-x sm:divide-y-0'>
        {specs.map(([label, value]) => (
          <div key={label} className='py-7 sm:px-7 sm:first:pl-0'>
            <Typography className='text-primary-700 dark:text-primary-300 text-sm font-medium'>
              {label}
            </Typography>
            <Typography variant='b3' className='text-muted-foreground mt-2'>
              {value}
            </Typography>
          </div>
        ))}
      </div>
    </section>
  );
}

function HowItWorks() {
  return (
    <section id='how-it-works' className='py-24 md:py-32'>
      <div className='layout-wide'>
        <div className='max-w-2xl'>
          <Typography
            as='h2'
            variant='j2'
            className='font-display text-3xl tracking-[-0.03em] md:text-4xl'
          >
            Three steps, and the sums stop being your problem
          </Typography>
        </div>

        <ol className='mt-16'>
          {steps.map((step) => (
            <li
              key={step.n}
              className='border-border/70 grid gap-4 border-t py-8 md:grid-cols-12 md:gap-10 md:py-10'
            >
              <span className='text-primary-500 dark:text-primary-400 figure text-sm font-semibold md:col-span-1'>
                {step.n}
              </span>
              <Typography as='h3' variant='h2' className='md:col-span-4'>
                {step.title}
              </Typography>
              <Typography
                variant='b3'
                className='text-muted-foreground max-w-[60ch] leading-relaxed md:col-span-7'
              >
                {step.body}
              </Typography>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function Receipts() {
  const pulled = [
    ['Every line', 'each item and what it cost'],
    ['The extras', 'service charge and tax, kept separate'],
    ['The total', 'checked against the lines above it'],
  ];

  return (
    <section
      id='receipts'
      className='bg-primary-50/60 dark:bg-primary-950/25 grain relative overflow-hidden py-24 md:py-32'
    >
      <div className='layout-wide relative grid items-center gap-14 lg:grid-cols-2 lg:gap-20'>
        <div>
          <Typography
            as='h2'
            variant='j2'
            className='font-display text-3xl tracking-[-0.03em] md:text-4xl'
          >
            Photograph it. The form fills itself in.
          </Typography>
          <Typography
            variant='b2'
            className='text-muted-foreground mt-6 max-w-[56ch] leading-relaxed'
          >
            Point your camera at the receipt on the table. Splibilo reads the
            items, the tax, and the total, and has them waiting in the expense
            form. The photo stays attached, so anyone in the group can check it
            later.
          </Typography>

          <ul className='mt-8 space-y-3'>
            {pulled.map(([label, detail]) => (
              <li key={label} className='flex items-baseline gap-4'>
                <span className='text-primary-700 dark:text-primary-300 w-28 shrink-0 text-sm font-semibold'>
                  {label}
                </span>
                <Typography variant='b3' className='text-muted-foreground'>
                  {detail}
                </Typography>
              </li>
            ))}
          </ul>
        </div>

        <ReceiptScan />
      </div>
    </section>
  );
}

function Settlements() {
  return (
    <section id='settlements' className='py-24 md:py-32'>
      <div className='layout-wide grid items-center gap-14 lg:grid-cols-2 lg:gap-20'>
        <div className='order-2 min-w-0 lg:order-1'>
          <SettlementDiagram />
        </div>

        <div className='order-1 lg:order-2'>
          <Typography
            as='h2'
            variant='j2'
            className='font-display text-3xl tracking-[-0.03em] md:text-4xl'
          >
            The shortest way out of a tangle
          </Typography>
          <Typography
            variant='b2'
            className='text-muted-foreground mt-6 max-w-[56ch] leading-relaxed'
          >
            Four people owing each other in circles is a lot of transfers for no
            reason. Splibilo looks at the group as a whole and pairs off who is
            owed with who owes, so it clears in as few payments as possible.
          </Typography>
          <Typography
            variant='b3'
            className='text-muted-foreground mt-4 max-w-[56ch] leading-relaxed'
          >
            Mark one as paid and everyone sees it straight away. No reminder
            messages in the group chat.
          </Typography>
        </div>
      </div>
    </section>
  );
}

function Features() {
  return (
    <section className='border-border/70 border-t py-24 md:py-32'>
      <div className='layout-wide grid gap-10 lg:grid-cols-12 lg:gap-16'>
        <div className='lg:col-span-4'>
          <Typography
            as='h2'
            variant='j2'
            className='font-display text-3xl tracking-[-0.03em] md:text-4xl'
          >
            Boring where it counts
          </Typography>
          <Typography
            variant='b3'
            className='text-muted-foreground mt-5 max-w-[42ch] leading-relaxed'
          >
            Money between friends only works if the numbers are never in
            question. These are the parts you should never have to think about.
          </Typography>
        </div>

        <ul className='grid gap-10 sm:grid-cols-2 lg:col-span-8'>
          {features.map(({ icon: Icon, title, body }) => (
            <li key={title} className='border-border/70 border-t pt-6'>
              <Icon
                className='text-primary-700 dark:text-primary-300 h-5 w-5'
                strokeWidth={1.5}
                aria-hidden
              />
              <Typography as='h3' variant='h5' className='mt-4'>
                {title}
              </Typography>
              <Typography
                variant='b3'
                className='text-muted-foreground mt-2 max-w-[46ch] leading-relaxed'
              >
                {body}
              </Typography>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function ClosingCta() {
  return (
    <section className='layout-wide pb-24 md:pb-32'>
      <div className='ambient grain border-border/60 relative overflow-hidden rounded-2xl border px-7 py-14 md:px-14 md:py-20'>
        <div className='relative flex flex-col gap-8 md:flex-row md:items-end md:justify-between'>
          <div>
            <Typography
              as='h2'
              variant='j2'
              className='font-display max-w-[18ch] text-3xl tracking-[-0.03em] md:text-4xl'
            >
              Start with the trip you still have not settled
            </Typography>
            <Typography
              variant='b3'
              className='text-muted-foreground mt-4 max-w-[48ch]'
            >
              Setting up a group takes about a minute. The old receipts can go
              in afterwards.
            </Typography>
          </div>
          <ButtonLink
            href='/register'
            size='md'
            rightIcon={ArrowRight}
            className='shrink-0 px-6 transition-transform duration-200 active:translate-y-px'
          >
            Create a group
          </ButtonLink>
        </div>
      </div>
    </section>
  );
}
