import { useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { useMeasure } from '../../lib/hooks.js';
import { cn } from '../../lib/utils.js';
import { ChartTooltip } from './ChartFrame.jsx';

/**
 * Change over time, one series. Straight segments rather than a smoothed
 * curve: interpolation invents readings between days that were never recorded.
 */
export function Sparkline({
  data = [],
  height = 132,
  format = (v) => String(v),
  target,
  className,
}) {
  const reduce = useReducedMotion();
  const [ref, { width }] = useMeasure();
  const [active, setActive] = useState(null);

  const padL = 6;
  const padR = 6;
  const padT = 24;
  const padB = 22;

  const n = data.length;
  const innerW = Math.max(width - padL - padR, 1);
  const innerH = Math.max(height - padT - padB, 1);
  const values = data.map((d) => d.value);
  const ceiling = Math.max(...values, target ?? 0, 1) * 1.15;

  const xAt = (i) => (n <= 1 ? padL + innerW / 2 : padL + (i / (n - 1)) * innerW);
  const yAt = (v) => padT + (1 - v / ceiling) * innerH;

  const points = data.map((d, i) => ({ ...d, x: xAt(i), y: yAt(d.value) }));
  const linePath = points.map((p, i) => `${i ? 'L' : 'M'}${p.x} ${p.y}`).join(' ');
  const areaPath =
    points.length > 1
      ? `${linePath} L${points.at(-1).x} ${padT + innerH} L${points[0].x} ${padT + innerH} Z`
      : '';

  const last = points.at(-1);
  const shown = active != null ? points[active] : null;

  const onMove = (e) => {
    if (n < 1) return;
    const box = e.currentTarget.getBoundingClientRect();
    const rel = e.clientX - box.left - padL;
    const idx = Math.round((rel / innerW) * (n - 1));
    setActive(Math.min(n - 1, Math.max(0, idx)));
  };

  const onKey = (e) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      e.preventDefault();
      const step = e.key === 'ArrowRight' ? 1 : -1;
      setActive((prev) => {
        const next = (prev == null ? n - 1 : prev) + step;
        return Math.min(n - 1, Math.max(0, next));
      });
    }
    if (e.key === 'Escape') setActive(null);
  };

  return (
    <div ref={ref} className={cn('relative w-full', className)} style={{ height }}>
      {width > 0 && n > 0 && (
        <svg
          width={width}
          height={height}
          tabIndex={0}
          role="img"
          aria-label={`Study time over the last ${n} days`}
          onMouseMove={onMove}
          onMouseLeave={() => setActive(null)}
          onBlur={() => setActive(null)}
          onKeyDown={onKey}
          className="rounded-[6px] outline-offset-4"
        >
          <defs>
            <linearGradient id="spark-wash" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.16" />
              <stop offset="100%" stopColor="var(--accent)" stopOpacity="0.01" />
            </linearGradient>
          </defs>

          {/* Daily goal: a solid hairline, one step off the surface. Never dashed. */}
          {target != null && target > 0 && (
            <line
              x1={padL}
              x2={width - padR}
              y1={yAt(target)}
              y2={yAt(target)}
              stroke="var(--line-strong)"
              strokeWidth="1"
            />
          )}

          {areaPath && <path d={areaPath} fill="url(#spark-wash)" />}

          <motion.path
            d={linePath}
            fill="none"
            stroke="var(--accent)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={reduce ? false : { pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={reduce ? { duration: 0 } : { duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
          />

          {/* Crosshair on the hovered day. */}
          {shown && (
            <line
              x1={shown.x}
              x2={shown.x}
              y1={padT}
              y2={padT + innerH}
              stroke="var(--line-strong)"
              strokeWidth="1"
            />
          )}

          {/* Endpoint marker, ringed in the surface colour so it stays legible. */}
          {last && (
            <circle
              cx={last.x}
              cy={last.y}
              r="4.5"
              fill="var(--accent)"
              stroke="var(--surface)"
              strokeWidth="2"
            />
          )}
          {shown && shown !== last && (
            <circle
              cx={shown.x}
              cy={shown.y}
              r="4.5"
              fill="var(--accent)"
              stroke="var(--surface)"
              strokeWidth="2"
            />
          )}

          {/* One direct label, at the end of the line. */}
          {last && !shown && (
            <text
              x={Math.min(last.x, width - padR)}
              y={last.y - 12 < padT ? last.y + 20 : last.y - 12}
              textAnchor="end"
              className="fill-ink font-mono text-[11px] font-medium"
            >
              {format(last.value)}
            </text>
          )}

          {data.map((d, i) => (
            <text
              key={d.key}
              x={xAt(i)}
              y={height - 6}
              textAnchor="middle"
              className={cn(
                'font-mono text-[10px]',
                active === i ? 'fill-ink-soft' : 'fill-ink-faint',
              )}
            >
              {d.short ?? d.label}
            </text>
          ))}
        </svg>
      )}

      <ChartTooltip visible={!!shown} x={shown?.x ?? 0} y={shown?.y ?? 0} width={width}>
        <span className="font-medium text-ink">{format(shown?.value ?? 0)}</span>
        <span className="ml-1.5 text-ink-muted">{shown?.label}</span>
      </ChartTooltip>
    </div>
  );
}
