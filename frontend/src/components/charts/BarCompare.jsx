import { useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { cn } from '../../lib/utils.js';

/**
 * Magnitude across named categories: horizontal bars, sorted.
 *
 * Every bar is the same colour on purpose. Subjects are nominal, so shading
 * them darker-where-larger would encode bar length twice and spend the only
 * free channel on something the length already says.
 */
export function BarCompare({
  data = [],
  formatValue = (v) => `${v}%`,
  max = 100,
  sort = true,
  onSelect,
  emptyLabel = 'No data yet',
  className,
}) {
  const reduce = useReducedMotion();
  const [hover, setHover] = useState(null);

  const rows = sort ? [...data].sort((a, b) => b.value - a.value) : data;
  const ceiling = Math.max(max, ...rows.map((r) => r.value), 1);

  if (!rows.length) {
    return (
      <p className="py-8 text-center text-[13px] text-ink-faint">{emptyLabel}</p>
    );
  }

  return (
    <ul className={cn('flex flex-col gap-3.5', className)}>
      {rows.map((row, i) => {
        const share = (row.value / ceiling) * 100;
        const active = hover === row.key;
        const Row = onSelect ? 'button' : 'div';

        return (
          <li key={row.key}>
            <Row
              type={onSelect ? 'button' : undefined}
              onClick={onSelect ? () => onSelect(row) : undefined}
              onMouseEnter={() => setHover(row.key)}
              onMouseLeave={() => setHover(null)}
              onFocus={() => setHover(row.key)}
              onBlur={() => setHover(null)}
              className={cn(
                'group block w-full text-left',
                onSelect && 'cursor-pointer rounded-[6px]',
              )}
            >
              {/* Name sits directly above its own bar. A side-by-side label
                  column would have to be clipped at card widths. */}
              <span className="flex items-baseline justify-between gap-3">
                <span
                  title={row.label}
                  className="min-w-0 truncate text-[13px] text-ink-soft transition-colors group-hover:text-ink"
                >
                  {row.label}
                </span>
                <span className="shrink-0 font-mono text-[12.5px] font-medium text-ink tabular-nums">
                  {formatValue(row.value, row)}
                </span>
              </span>

              {/* Track doubles as the 100% reference line. */}
              <span className="relative mt-1.5 block h-2.5 rounded-[4px] bg-raised">
                <motion.span
                  className={cn(
                    'absolute inset-y-0 left-0 rounded-r-[4px] bg-accent transition-opacity',
                    hover && !active && 'opacity-45',
                  )}
                  initial={reduce ? false : { width: 0 }}
                  animate={{ width: `${share}%` }}
                  transition={
                    reduce
                      ? { duration: 0 }
                      : { duration: 0.75, delay: i * 0.05, ease: [0.16, 1, 0.3, 1] }
                  }
                />
              </span>
            </Row>
            {row.hint && <p className="mt-1 text-[11.5px] text-ink-faint">{row.hint}</p>}
          </li>
        );
      })}
    </ul>
  );
}
