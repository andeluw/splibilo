'use client';

import { Scan, Sparkle } from 'lucide-react';
import * as React from 'react';

import { cn } from '@/lib/utils';

/** Shows what scanning a receipt produces: a sweep, then the fields landing one
 *  by one. Renders fully filled by default, so the static state is the useful
 *  one for reduced motion and for anyone who never scrolls this far. */

const lines = [
  ['Nasi goreng ×2', '64.000'],
  ['Es teh manis ×4', '32.000'],
  ['Ayam bakar ×3', '111.000'],
];

const totals = [
  ['Subtotal', '207.000'],
  ['Tax 11%', '22.770'],
];

export function ReceiptScan() {
  const [scanning, setScanning] = React.useState(false);
  const [hasPlayed, setHasPlayed] = React.useState(false);
  const rootRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const node = rootRef.current;
    if (!node || hasPlayed) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setHasPlayed(true);
        setScanning(true);
        window.setTimeout(() => setScanning(false), 900);
        observer.disconnect();
      },
      { threshold: 0.5 },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [hasPlayed]);

  // While the sweep runs the values hold back, then land in reading order.
  const field = (index: number, className?: string) => ({
    className: cn(
      'figure transition-all duration-300 ease-[var(--ease-out)]',
      scanning ? 'translate-y-1 opacity-0' : 'translate-y-0 opacity-100',
      className,
    ),
    style: { transitionDelay: scanning ? '0ms' : `${index * 70}ms` },
  });

  return (
    <div
      ref={rootRef}
      className='bg-card shadow-ink border-border/60 relative overflow-hidden rounded-2xl border p-6 md:p-7'
    >
      {/* Single pass, so it reads as the camera reading the paper, not a loader */}
      <div
        aria-hidden
        className={cn(
          'via-primary-400/45 pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-transparent to-transparent transition-transform duration-[900ms] ease-in-out',
          scanning ? 'translate-y-[420px]' : '-translate-y-24 opacity-0',
        )}
      />

      <div className='flex items-center gap-2.5'>
        <Scan
          className='text-primary-700 dark:text-primary-300 h-4 w-4'
          strokeWidth={1.5}
          aria-hidden
        />
        <p className='text-muted-foreground text-xs font-medium'>
          {scanning ? 'Reading receipt' : 'Scanned receipt'}
        </p>
      </div>

      <dl className='mt-6 text-sm'>
        {lines.map(([item, price], index) => (
          <div
            key={item}
            className='border-border/60 flex items-center justify-between gap-4 border-b py-2.5 last:border-b-0'
          >
            <dt className='text-muted-foreground'>{item}</dt>
            <dd {...field(index, 'font-medium')}>{price}</dd>
          </div>
        ))}
      </dl>

      <dl className='border-border mt-4 border-t pt-4 text-sm'>
        {totals.map(([label, value], index) => (
          <div
            key={label}
            className='text-muted-foreground flex items-center justify-between py-1'
          >
            <dt>{label}</dt>
            <dd {...field(lines.length + index)}>{value}</dd>
          </div>
        ))}
        <div className='border-border/70 mt-2 flex items-center justify-between border-t pt-3 text-base font-semibold'>
          <dt>Total</dt>
          <dd {...field(lines.length + totals.length)}>229.770</dd>
        </div>
      </dl>

      <p className='text-muted-foreground mt-5 flex items-center gap-2 text-xs'>
        <Sparkle className='h-3.5 w-3.5' strokeWidth={1.5} aria-hidden />
        Every field stays editable before you save.
      </p>
    </div>
  );
}
