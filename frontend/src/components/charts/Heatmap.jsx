import { useState } from 'react';
import { cn } from '../../lib/utils.js';
import { weekdayOf, formatLongDay, formatMinutes } from '../../lib/date.js';
import { ChartTooltip } from './ChartFrame.jsx';

/**
 * Sequential ramp, one hue, light to dark. Each step was validated against its
 * own surface rather than flipped: in dark mode the order reverses, because on
 * a dark ground it is the lighter step that reads as "more".
 *
 * Light  cobalt 300 → 700     Dark  cobalt 700 → 300
 */
const RAMP = [
  'bg-cobalt-300 dark:bg-cobalt-700',
  'bg-cobalt-400 dark:bg-cobalt-500',
  'bg-cobalt-500 dark:bg-cobalt-400',
  'bg-cobalt-700 dark:bg-cobalt-300',
];

const EMPTY = 'bg-raised';

/** Rows run Monday to Sunday, so a study week reads the way a student thinks. */
const ROW_LABELS = ['M', '', 'W', '', 'F', '', 'S'];
const rowOf = (key) => (weekdayOf(key) + 6) % 7;

function levelFor(minutes, target) {
  if (!minutes) return -1;
  const share = target > 0 ? minutes / target : 0;
  if (share < 0.35) return 0;
  if (share < 0.7) return 1;
  if (share < 1) return 2;
  return 3;
}

export function Heatmap({ days = [], target = 240, onSelect, className }) {
  const [hover, setHover] = useState(null);

  if (!days.length) {
    return <p className="py-8 text-center text-[13px] text-ink-faint">No history yet</p>;
  }

  // Pad the first week so every column is a real Monday-to-Sunday column.
  const lead = rowOf(days[0].key);
  const cells = [...Array.from({ length: lead }, () => null), ...days];
  const columns = Math.ceil(cells.length / 7);

  return (
    <div className={cn('relative', className)}>
      <div className="flex gap-[6px]">
        <div
          className="grid shrink-0 gap-[2px] font-mono text-[9px] text-ink-faint"
          style={{ gridTemplateRows: 'repeat(7, minmax(0, 1fr))' }}
          aria-hidden
        >
          {ROW_LABELS.map((l, i) => (
            <span key={i} className="flex items-center leading-none">
              {l}
            </span>
          ))}
        </div>

        <div
          className="grid min-w-0 flex-1 gap-[2px]"
          style={{
            gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
            gridTemplateRows: 'repeat(7, minmax(0, 1fr))',
            gridAutoFlow: 'column',
          }}
        >
          {cells.map((cell, i) => {
            if (!cell) return <span key={`pad-${i}`} aria-hidden />;
            const level = levelFor(cell.minutes, target);
            const label = `${formatLongDay(cell.key)}: ${
              cell.minutes ? formatMinutes(cell.minutes) : 'no study logged'
            }`;

            return (
              <button
                key={cell.key}
                type="button"
                title={label}
                aria-label={label}
                onClick={onSelect ? () => onSelect(cell) : undefined}
                onMouseEnter={(e) =>
                  setHover({
                    key: cell.key,
                    label,
                    x: e.currentTarget.offsetLeft + e.currentTarget.offsetWidth / 2,
                    y: e.currentTarget.offsetTop,
                  })
                }
                onMouseLeave={() => setHover(null)}
                className={cn(
                  'aspect-square w-full rounded-[3px] transition-[transform,opacity] duration-150',
                  'hover:scale-[1.35] hover:opacity-100 focus-visible:scale-[1.35]',
                  level < 0 ? EMPTY : RAMP[level],
                  hover && hover.key !== cell.key && 'opacity-70',
                  !onSelect && 'cursor-default',
                )}
              />
            );
          })}
        </div>
      </div>

      <ChartTooltip visible={!!hover} x={hover?.x ?? 0} y={hover?.y ?? 0} width={9999}>
        <span className="text-ink">{hover?.label}</span>
      </ChartTooltip>
    </div>
  );
}

/** Scale key. Required: on a continuous colour scale the ramp needs naming. */
export function HeatmapLegend({ className }) {
  return (
    <div className={cn('flex items-center gap-1.5 text-[11px] text-ink-faint', className)}>
      <span>Less</span>
      <span className={cn('size-2.5 rounded-[3px]', EMPTY)} aria-hidden />
      {RAMP.map((c) => (
        <span key={c} className={cn('size-2.5 rounded-[3px]', c)} aria-hidden />
      ))}
      <span>More</span>
    </div>
  );
}
