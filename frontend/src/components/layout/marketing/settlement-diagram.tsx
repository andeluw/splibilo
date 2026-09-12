'use client';

import { RotateCcw } from 'lucide-react';
import * as React from 'react';

import { cn } from '@/lib/utils';

/** Explains debt simplification by showing the tangle collapse into three
 *  payments. The settled state is the default render, so anyone who never sees
 *  the animation (reduced motion, no JS, no scroll) still reads the answer. */

type Node = {
  id: string;
  initials: string;
  name: string;
  x: number;
  y: number;
  owes: boolean;
};

const nodes: Node[] = [
  { id: 'laura', initials: 'LB', name: 'Laura', x: 74, y: 66, owes: false },
  { id: 'brian', initials: 'BF', name: 'Brian', x: 286, y: 66, owes: false },
  { id: 'devon', initials: 'DC', name: 'Devon', x: 74, y: 198, owes: true },
  { id: 'emma', initials: 'EW', name: 'Emma', x: 286, y: 198, owes: true },
];

const byId = Object.fromEntries(nodes.map((node) => [node.id, node]));

/** Every pair owing every other pair: the state a group ends a trip in. */
const tangled: [string, string][] = [
  ['devon', 'laura'],
  ['devon', 'brian'],
  ['emma', 'laura'],
  ['emma', 'brian'],
  ['devon', 'emma'],
  ['laura', 'brian'],
];

/** What the group actually has to pay once it is worked out. */
const settled: { from: string; to: string; amount: string }[] = [
  { from: 'emma', to: 'laura', amount: '129.550' },
  { from: 'devon', to: 'laura', amount: '54.650' },
  { from: 'devon', to: 'brian', amount: '41.750' },
];

const NODE_R = 21;

/** Math.hypot is not required to be correctly rounded, so Node and the browser
 *  can disagree in the last bit and blow up hydration. Every coordinate that
 *  reaches the DOM goes through here. */
const round = (n: number) => Math.round(n * 100) / 100;

/** Stops the line short of both circles so the arrowhead sits on the edge. */
function edgeLine(from: Node, to: Node, gap = NODE_R + 7) {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const len = Math.sqrt(dx * dx + dy * dy) || 1;
  const ux = dx / len;
  const uy = dy / len;
  return {
    x1: round(from.x + ux * gap),
    y1: round(from.y + uy * gap),
    x2: round(to.x - ux * gap),
    y2: round(to.y - uy * gap),
  };
}

type Phase = 'tangled' | 'settled';

export function SettlementDiagram() {
  const [phase, setPhase] = React.useState<Phase>('settled');
  const [hasPlayed, setHasPlayed] = React.useState(false);
  const rootRef = React.useRef<HTMLDivElement>(null);

  const play = React.useCallback(() => {
    setPhase('tangled');
    window.setTimeout(() => setPhase('settled'), 1400);
  }, []);

  // Play once when it scrolls into view, and only for users who want motion.
  React.useEffect(() => {
    const node = rootRef.current;
    if (!node || hasPlayed) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setHasPlayed(true);
        play();
        observer.disconnect();
      },
      { threshold: 0.55 },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [hasPlayed, play]);

  const isTangled = phase === 'tangled';

  return (
    <div
      ref={rootRef}
      className='bg-card shadow-ink border-border/60 rounded-2xl border p-6 md:p-7'
    >
      <div className='flex items-center justify-between gap-4'>
        <p className='text-muted-foreground text-xs font-medium'>
          {isTangled ? 'Six payments' : 'Three payments'}
        </p>
        <button
          type='button'
          onClick={play}
          className='text-muted-foreground hover:text-foreground focus-visible:ring-ring inline-flex cursor-pointer items-center gap-1.5 rounded-md px-2 py-1 text-xs transition-colors duration-200 focus-visible:ring-2 focus-visible:outline-none'
        >
          <RotateCcw
            className={cn(
              'h-3.5 w-3.5 transition-transform duration-500 ease-[var(--ease-out)]',
              isTangled && '-rotate-180',
            )}
            strokeWidth={1.5}
            aria-hidden
          />
          Replay
        </button>
      </div>

      <svg
        viewBox='0 0 360 256'
        className='mt-4 w-full'
        role='img'
        aria-label='Four group members owing each other six separate payments, which reduce to three once the balances are worked out.'
      >
        <defs>
          <marker
            id='arrow-settled'
            viewBox='0 0 8 8'
            refX='6'
            refY='4'
            markerWidth='5'
            markerHeight='5'
            orient='auto-start-reverse'
          >
            <path d='M 0 1 L 7 4 L 0 7 z' className='fill-credit' />
          </marker>
          <marker
            id='arrow-tangled'
            viewBox='0 0 8 8'
            refX='6'
            refY='4'
            markerWidth='5'
            markerHeight='5'
            orient='auto-start-reverse'
          >
            <path d='M 0 1 L 7 4 L 0 7 z' className='fill-muted-foreground' />
          </marker>
        </defs>

        {/* The mess: every pair settling separately */}
        <g
          className='transition-opacity duration-500 ease-[var(--ease-out)]'
          style={{ opacity: isTangled ? 1 : 0 }}
        >
          {tangled.map(([from, to]) => {
            const line = edgeLine(byId[from], byId[to]);
            return (
              <line
                key={`${from}-${to}`}
                {...line}
                className='stroke-muted-foreground/55'
                strokeWidth={1.25}
                strokeDasharray='4 4'
                markerEnd='url(#arrow-tangled)'
              />
            );
          })}
        </g>

        {/* What is left after the balances cancel out */}
        <g>
          {settled.map(({ from, to, amount }, index) => {
            const line = edgeLine(byId[from], byId[to]);
            const dx = line.x2 - line.x1;
            const dy = line.y2 - line.y1;
            const length = round(Math.sqrt(dx * dx + dy * dy));
            // Sit the amount near the payer rather than mid-line: two of these
            // arrows cross at the centre, and midpoint labels land on top of
            // each other there.
            const t = 0.3;
            const labelX = round(line.x1 + dx * t);
            const labelY = round(line.y1 + dy * t);
            return (
              <g
                key={`${from}-${to}`}
                className='transition-opacity duration-300 ease-[var(--ease-out)]'
                style={{
                  opacity: isTangled ? 0 : 1,
                  transitionDelay: isTangled ? '0ms' : `${180 + index * 90}ms`,
                }}
              >
                <line
                  {...line}
                  className='stroke-credit'
                  strokeWidth={2}
                  strokeLinecap='round'
                  markerEnd='url(#arrow-settled)'
                  strokeDasharray={length}
                  strokeDashoffset={isTangled ? length : 0}
                  style={{
                    transition: 'stroke-dashoffset 520ms var(--ease-out)',
                    transitionDelay: isTangled
                      ? '0ms'
                      : `${180 + index * 90}ms`,
                  }}
                />
                <rect
                  x={labelX - 25}
                  y={labelY - 9}
                  width={50}
                  height={18}
                  rx={5}
                  className='fill-card'
                />
                <text
                  x={labelX}
                  y={labelY + 4}
                  textAnchor='middle'
                  className='fill-credit figure text-[11px] font-semibold'
                >
                  {amount}
                </text>
              </g>
            );
          })}
        </g>

        {nodes.map((node) => (
          <g key={node.id}>
            <circle
              cx={node.x}
              cy={node.y}
              r={NODE_R}
              className={node.owes ? 'fill-owed-soft' : 'fill-credit-soft'}
            />
            <text
              x={node.x}
              y={node.y + 4}
              textAnchor='middle'
              className={cn(
                'text-[11px] font-semibold',
                node.owes ? 'fill-owed' : 'fill-credit',
              )}
            >
              {node.initials}
            </text>
            {/* Names sit on the outside of the layout so arrows crossing the
                middle never run through them */}
            <text
              x={node.x}
              y={node.y + (node.owes ? NODE_R + 16 : -NODE_R - 9)}
              textAnchor='middle'
              className='fill-muted-foreground text-[11px]'
            >
              {node.name}
            </text>
          </g>
        ))}
      </svg>

      <p className='text-muted-foreground border-border/70 mt-2 border-t pt-4 text-xs'>
        Your balance is what you paid, less your share, less anything already
        settled.
      </p>
    </div>
  );
}
