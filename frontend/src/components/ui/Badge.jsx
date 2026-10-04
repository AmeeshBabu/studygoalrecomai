import { cn } from '../../lib/utils.js';
import { DIFFICULTY, IMPORTANCE_LABELS } from '../../engine/scoring.js';

/** Neutral pill label. */
export function Badge({ tone = 'neutral', className, children, ...props }) {
  const tones = {
    neutral: 'bg-raised text-ink-muted border-line',
    accent: 'bg-accent-soft text-accent border-transparent',
    high: 'bg-high-50 text-high-700 border-high-200 dark:bg-high-900/35 dark:text-high-500 dark:border-high-900',
    mid: 'bg-mid-50 text-mid-700 border-mid-200 dark:bg-mid-900/35 dark:text-mid-500 dark:border-mid-900',
    low: 'bg-low-50 text-low-700 border-low-200 dark:bg-low-900/35 dark:text-low-500 dark:border-low-900',
  };
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-medium whitespace-nowrap',
        tones[tone],
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}

const PRIORITY_TONE = { high: 'high', medium: 'mid', low: 'low' };
const PRIORITY_LABEL = { high: 'High', medium: 'Medium', low: 'Low' };
const DOT = {
  high: 'bg-high-600 dark:bg-high-500',
  medium: 'bg-mid-600 dark:bg-mid-500',
  low: 'bg-low-600 dark:bg-low-500',
};

/**
 * The dot here is load-bearing: it encodes the computed priority band, which
 * is genuine semantic state rather than decoration. Colour is never the only
 * channel, the label always accompanies it.
 */
export function PriorityTag({ priority = 'low', score, showScore = false, className }) {
  return (
    <Badge tone={PRIORITY_TONE[priority]} className={className}>
      <span className={cn('size-1.5 shrink-0 rounded-full', DOT[priority])} aria-hidden />
      {PRIORITY_LABEL[priority]}
      {showScore && score != null && (
        <span className="font-mono opacity-70">{score}</span>
      )}
    </Badge>
  );
}

export function DifficultyTag({ difficulty = 'medium', className }) {
  const tone = { easy: 'low', medium: 'mid', hard: 'high' }[difficulty] ?? 'neutral';
  return (
    <Badge tone={tone} className={className}>
      {DIFFICULTY[difficulty]?.label ?? difficulty}
    </Badge>
  );
}

/** Subject exam weight, 1-5, drawn as filled bars rather than stars. */
export function ImportanceMeter({ value = 3, className, showLabel = true }) {
  return (
    <span className={cn('inline-flex items-center gap-1.5', className)}>
      <span className="flex items-end gap-[3px]" aria-hidden>
        {[1, 2, 3, 4, 5].map((i) => (
          <span
            key={i}
            style={{ height: `${4 + i * 2}px` }}
            className={cn(
              'w-[3px] rounded-full transition-colors',
              i <= value ? 'bg-accent' : 'bg-line-strong',
            )}
          />
        ))}
      </span>
      {showLabel && (
        <span className="text-[11px] font-medium text-ink-muted">
          {IMPORTANCE_LABELS[value]}
        </span>
      )}
      <span className="sr-only">Exam weight {value} of 5</span>
    </span>
  );
}

/** Round monogram standing in for a subject. Avoids a per-subject colour
 *  rainbow, which would break the single-accent rule. */
export function SubjectMark({ name = '', size = 'md', active = false, className }) {
  const letters = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
  const sizes = {
    sm: 'size-7 text-[10px]',
    md: 'size-9 text-[11px]',
    lg: 'size-11 text-[13px]',
  };
  return (
    <span
      aria-hidden
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full border font-mono font-semibold tracking-tight',
        active
          ? 'border-transparent bg-accent text-accent-ink'
          : 'border-line bg-raised text-ink-muted',
        sizes[size],
        className,
      )}
    >
      {letters || '?'}
    </span>
  );
}
