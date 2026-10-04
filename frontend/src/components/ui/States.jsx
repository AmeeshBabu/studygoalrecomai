import { motion } from 'motion/react';
import { cn } from '../../lib/utils.js';
import { Button } from './Button.jsx';

/** Loading placeholder. Shape-matched to whatever it stands in for. */
export function Skeleton({ className, rounded = 'rounded-[6px]' }) {
  return (
    <div
      aria-hidden
      className={cn('animate-pulse bg-raised', rounded, className)}
    />
  );
}

export function SkeletonCard({ lines = 3, className }) {
  return (
    <div className={cn('rounded-card border border-line bg-surface p-5', className)}>
      <Skeleton className="h-4 w-1/3" />
      <div className="mt-4 flex flex-col gap-2.5">
        {Array.from({ length: lines }).map((_, i) => (
          <Skeleton key={i} className={cn('h-3', i === lines - 1 ? 'w-2/3' : 'w-full')} />
        ))}
      </div>
    </div>
  );
}

/**
 * Empty states carry their own weight: they say what the space is for and give
 * the one action that fills it, rather than apologising for being blank.
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  actionLabel,
  onAction,
  secondary,
  className,
  compact = false,
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center text-center',
        compact ? 'px-4 py-10' : 'px-6 py-16',
        className,
      )}
    >
      {Icon && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          className="mb-5 grid size-14 place-items-center rounded-panel border border-line bg-raised text-ink-faint"
        >
          <Icon size={24} weight="duotone" />
        </motion.div>
      )}
      <h3 className="font-display text-base font-semibold tracking-[-0.01em] text-ink">{title}</h3>
      {description && (
        <p className="mt-2 max-w-[42ch] text-[13.5px] leading-relaxed text-ink-muted">
          {description}
        </p>
      )}
      {(action || actionLabel) && (
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
          {action ?? (
            <Button onClick={onAction} size="sm">
              {actionLabel}
            </Button>
          )}
          {secondary}
        </div>
      )}
    </div>
  );
}

export function ErrorState({ title = 'Something broke', description, onRetry, className }) {
  return (
    <div className={cn('rounded-card border border-high-200 bg-high-50 p-5 dark:border-high-900 dark:bg-high-900/25', className)}>
      <h3 className="text-sm font-semibold text-high-700 dark:text-high-500">{title}</h3>
      {description && (
        <p className="mt-1.5 text-[13px] leading-relaxed text-high-700/85 dark:text-high-500/85">
          {description}
        </p>
      )}
      {onRetry && (
        <Button variant="outlineDanger" size="sm" className="mt-4" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}
