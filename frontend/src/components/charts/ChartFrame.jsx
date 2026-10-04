import { useState } from 'react';
import { ChartBarIcon, TableIcon } from '@phosphor-icons/react';
import { cn } from '../../lib/utils.js';

/**
 * Every chart in the app is wrapped in this.
 *
 * Two things it guarantees, both accessibility requirements rather than
 * decoration: a legend slot that sits outside the plot, and a table view of the
 * same numbers, so no value is ever reachable only by hovering a coloured mark.
 */
export function ChartFrame({
  title,
  subtitle,
  legend,
  action,
  table,
  children,
  className,
  bodyClassName,
}) {
  const [view, setView] = useState('chart');
  const showing = table ? view : 'chart';

  return (
    <section
      className={cn('flex flex-col rounded-card border border-line bg-surface p-5', className)}
    >
      <header className="mb-5 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="font-display text-[15px] font-semibold tracking-[-0.01em] text-ink">
            {title}
          </h3>
          {subtitle && (
            <p className="mt-1 text-[12.5px] leading-snug text-ink-muted">{subtitle}</p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {action}
          {table && (
            <button
              type="button"
              onClick={() => setView(showing === 'chart' ? 'table' : 'chart')}
              aria-label={showing === 'chart' ? 'Show data as a table' : 'Show chart'}
              title={showing === 'chart' ? 'Table view' : 'Chart view'}
              className="grid size-8 place-items-center rounded-full text-ink-faint transition-colors hover:bg-raised hover:text-ink"
            >
              {showing === 'chart' ? <TableIcon size={16} /> : <ChartBarIcon size={16} />}
            </button>
          )}
        </div>
      </header>

      <div className={cn('min-w-0 flex-1', bodyClassName)}>
        {showing === 'chart' ? children : <DataTable {...table} />}
      </div>

      {legend && showing === 'chart' && (
        <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-line pt-4">
          {legend}
        </div>
      )}
    </section>
  );
}

/** The WCAG-clean twin of any chart. Numbers align, so tabular figures here. */
function DataTable({ columns = [], rows = [] }) {
  return (
    <div className="max-h-[260px] overflow-auto">
      <table className="w-full text-left text-[13px]">
        <thead className="sticky top-0 bg-surface">
          <tr className="border-b border-line">
            {columns.map((c, i) => (
              <th
                key={c}
                scope="col"
                className={cn(
                  'py-2 text-[11px] font-medium tracking-wide text-ink-faint uppercase',
                  i > 0 && 'text-right',
                )}
              >
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={ri} className="border-b border-line/60 last:border-0">
              {row.map((cell, ci) => (
                <td
                  key={ci}
                  className={cn(
                    'py-2',
                    ci === 0
                      ? 'pr-3 text-ink-soft'
                      : 'text-right font-mono text-ink tabular-nums',
                  )}
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Identity key that rides beside a label. Text never wears the data colour. */
export function LegendItem({ swatchClass, shape = 'square', label, value }) {
  return (
    <span className="inline-flex items-center gap-2 text-[12px] text-ink-muted">
      <span
        aria-hidden
        className={cn(
          'shrink-0',
          shape === 'line' ? 'h-[2px] w-4 rounded-full' : 'size-2.5 rounded-[3px]',
          swatchClass,
        )}
      />
      {label}
      {value != null && <span className="font-mono text-ink-soft">{value}</span>}
    </span>
  );
}

/**
 * Floating readout. Positioned by the caller in container coordinates and kept
 * inside the box, since a tooltip that leaves the card is worse than none.
 */
export function ChartTooltip({ x, y, width, children, visible }) {
  if (!visible) return null;
  const left = Math.min(Math.max(x, 60), Math.max(width - 60, 60));
  return (
    <div
      role="status"
      className="pointer-events-none absolute z-20 -translate-x-1/2 -translate-y-[calc(100%+12px)] rounded-input border border-line bg-surface px-2.5 py-1.5 text-[12px] whitespace-nowrap shadow-lift"
      style={{ left, top: y }}
    >
      {children}
    </div>
  );
}
