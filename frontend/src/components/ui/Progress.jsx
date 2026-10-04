import { motion, useReducedMotion } from 'motion/react';
import { cn } from '../../lib/utils.js';

/**
 * Meters, not charts. The rule they follow: the fill carries the state and the
 * unfilled track is a lighter step of the same hue, so the bar reads as one
 * object rather than a coloured bar sitting on a grey one.
 */
const FILL = {
  accent: 'bg-accent',
  high: 'bg-high-600 dark:bg-high-500',
  mid: 'bg-mid-600 dark:bg-mid-500',
  low: 'bg-low-600 dark:bg-low-500',
  ink: 'bg-ink',
};

const TRACK = {
  accent: 'bg-accent/15',
  high: 'bg-high-600/15 dark:bg-high-500/20',
  mid: 'bg-mid-600/15 dark:bg-mid-500/20',
  low: 'bg-low-600/15 dark:bg-low-500/20',
  ink: 'bg-ink/10',
};

const BAR_SIZE = { xs: 'h-1', sm: 'h-1.5', md: 'h-2', lg: 'h-2.5' };

export function ProgressBar({
  value = 0,
  max = 100,
  tone = 'accent',
  size = 'md',
  label,
  hint,
  showValue = false,
  className,
  animate = true,
}) {
  const reduce = useReducedMotion();
  const pctValue = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0;

  return (
    <div className={cn('w-full', className)}>
      {(label || showValue) && (
        <div className="mb-2 flex items-baseline justify-between gap-3">
          {label && <span className="truncate text-[13px] font-medium text-ink-soft">{label}</span>}
          {showValue && (
            <span className="shrink-0 font-mono text-[12px] font-medium text-ink-muted">
              {Math.round(pctValue)}%
            </span>
          )}
        </div>
      )}
      <div
        role="progressbar"
        aria-valuenow={Math.round(pctValue)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label || 'Progress'}
        className={cn('w-full overflow-hidden rounded-full', TRACK[tone], BAR_SIZE[size])}
      >
        <motion.div
          className={cn('h-full rounded-full', FILL[tone])}
          initial={animate && !reduce ? { width: 0 } : false}
          animate={{ width: `${pctValue}%` }}
          transition={
            reduce ? { duration: 0 } : { duration: 0.9, ease: [0.16, 1, 0.3, 1] }
          }
        />
      </div>
      {hint && <p className="mt-1.5 text-[12px] text-ink-faint">{hint}</p>}
    </div>
  );
}

/**
 * Single-value ring. A donut is the wrong form for comparing categories, but
 * it is the right one for a lone share of a whole, which is what completion is.
 */
export function Ring({
  value = 0,
  max = 100,
  size = 140,
  stroke = 12,
  tone = 'accent',
  children,
  className,
  animate = true,
}) {
  const reduce = useReducedMotion();
  const share = max > 0 ? Math.min(1, Math.max(0, value / max)) : 0;
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;

  const strokeColor = {
    accent: 'var(--accent)',
    high: 'var(--color-high-600)',
    mid: 'var(--color-mid-600)',
    low: 'var(--color-low-600)',
  }[tone];

  return (
    <div
      className={cn('relative grid shrink-0 place-items-center', className)}
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90" aria-hidden>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={strokeColor}
          strokeWidth={stroke}
          opacity={0.15}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={strokeColor}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={animate && !reduce ? { strokeDashoffset: circumference } : false}
          animate={{ strokeDashoffset: circumference * (1 - share) }}
          transition={reduce ? { duration: 0 } : { duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">{children}</div>
    </div>
  );
}

/**
 * Part-to-whole across a handful of states. Segments are separated by a 2px
 * surface gap rather than a stroke, so no border ink is added to the data.
 */
export function SegmentBar({ segments = [], className, height = 10 }) {
  const reduce = useReducedMotion();
  const total = segments.reduce((acc, s) => acc + s.value, 0);
  if (total <= 0) {
    return (
      <div
        className={cn('w-full rounded-full bg-raised', className)}
        style={{ height }}
        aria-hidden
      />
    );
  }

  return (
    <div className={cn('flex w-full gap-[2px]', className)} style={{ height }}>
      {segments
        .filter((s) => s.value > 0)
        .map((s, i, arr) => (
          <motion.div
            key={s.key}
            title={`${s.label}: ${s.value}`}
            className={cn(
              'h-full',
              s.className,
              i === 0 && 'rounded-l-full',
              i === arr.length - 1 && 'rounded-r-full',
            )}
            initial={reduce ? false : { flexGrow: 0 }}
            animate={{ flexGrow: s.value }}
            transition={reduce ? { duration: 0 } : { duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            style={{ flexBasis: 0 }}
          />
        ))}
    </div>
  );
}
