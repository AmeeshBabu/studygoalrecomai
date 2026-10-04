import { cn } from '../../lib/utils.js';

/** Surface container. 16px radius, hairline border, warm-tinted shadow. */
export function Card({ as: Comp = 'div', className, interactive = false, children, ...props }) {
  return (
    <Comp
      className={cn(
        'rounded-card border border-line bg-surface',
        interactive &&
          'transition-[transform,box-shadow,border-color] duration-200 ease-[var(--ease-out-expo)] hover:-translate-y-0.5 hover:shadow-lift hover:border-line-strong',
        className,
      )}
      {...props}
    >
      {children}
    </Comp>
  );
}

/** Large page-level container, 24px radius. */
export function Panel({ className, children, ...props }) {
  return (
    <div className={cn('rounded-panel border border-line bg-surface', className)} {...props}>
      {children}
    </div>
  );
}

/**
 * Section heading. Stacked vertically by design: the split
 * headline-left / paragraph-right pattern is deliberately avoided.
 */
export function SectionHeading({ title, description, action, className, level = 'h2' }) {
  /* Callers pass either a tag name ('h3') or a depth number (3). */
  const Tag = typeof level === 'number' ? `h${level}` : level;

  return (
    <div className={cn('flex flex-wrap items-end justify-between gap-4', className)}>
      <div className="min-w-0">
        <Tag className="font-display text-lg font-semibold tracking-[-0.02em] text-ink">
          {title}
        </Tag>
        {description && (
          <p className="mt-1 max-w-[60ch] text-sm leading-relaxed text-ink-muted">{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}

/** Key figure with a label. Used across the dashboard and analytics pages. */
export function Stat({ label, value, unit, hint, tone = 'default', icon: Icon, className }) {
  const tones = {
    default: 'text-ink',
    accent: 'text-accent',
    high: 'text-high-600 dark:text-high-500',
    mid: 'text-mid-700 dark:text-mid-500',
    low: 'text-low-700 dark:text-low-500',
  };
  return (
    <div className={cn('min-w-0', className)}>
      <div className="flex items-center gap-1.5 text-[12px] font-medium text-ink-muted">
        {Icon && <Icon size={14} weight="bold" className="shrink-0 text-ink-faint" />}
        <span className="truncate">{label}</span>
      </div>
      <div className="mt-1.5 flex items-baseline gap-1">
        <span
          className={cn(
            'font-mono text-[26px] leading-none font-semibold tracking-[-0.03em]',
            tones[tone],
          )}
        >
          {value}
        </span>
        {unit && <span className="text-[13px] font-medium text-ink-faint">{unit}</span>}
      </div>
      {hint && <p className="mt-1.5 text-[12px] leading-snug text-ink-faint">{hint}</p>}
    </div>
  );
}
