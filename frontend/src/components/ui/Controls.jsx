import { useId } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { cn } from '../../lib/utils.js';

/** Labelled toggle. The label is the hit target, not just the switch. */
export function Switch({ checked, onChange, label, hint, id, disabled }) {
  const generated = useId();
  const inputId = id ?? generated;

  return (
    <div className="flex items-start justify-between gap-6">
      <label htmlFor={inputId} className={cn('min-w-0 cursor-pointer', disabled && 'opacity-50')}>
        <span className="block text-sm font-medium text-ink">{label}</span>
        {hint && <span className="mt-0.5 block text-[12.5px] leading-snug text-ink-muted">{hint}</span>}
      </label>
      <button
        id={inputId}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative mt-0.5 h-6 w-11 shrink-0 rounded-full transition-colors duration-200',
          'disabled:pointer-events-none disabled:opacity-50',
          checked ? 'bg-accent' : 'bg-line-strong',
        )}
      >
        <motion.span
          layout
          transition={{ type: 'spring', stiffness: 520, damping: 34 }}
          className={cn(
            'absolute top-1 size-4 rounded-full bg-white shadow-[0_1px_2px_rgb(26_25_23/0.3)]',
            checked ? 'left-6' : 'left-1',
          )}
        />
      </button>
    </div>
  );
}

/**
 * Segmented control. The selected pill slides between options via a shared
 * layoutId, which reads as one object moving instead of two fading.
 */
export function SegmentedControl({ options = [], value, onChange, size = 'md', className }) {
  const layoutId = useId();
  const reduce = useReducedMotion();
  const pad = size === 'sm' ? 'h-8 text-[12.5px]' : 'h-10 text-[13.5px]';

  return (
    <div
      role="tablist"
      className={cn('inline-flex rounded-full bg-raised p-1', className)}
    >
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(opt.value)}
            className={cn(
              'relative min-w-0 rounded-full px-3.5 font-medium whitespace-nowrap transition-colors',
              pad,
              active ? 'text-ink' : 'text-ink-muted hover:text-ink-soft',
            )}
          >
            {active && (
              <motion.span
                layoutId={reduce ? undefined : layoutId}
                transition={{ type: 'spring', stiffness: 460, damping: 38 }}
                className="absolute inset-0 rounded-full border border-line bg-surface shadow-card"
              />
            )}
            <span className="relative flex items-center gap-1.5">
              {opt.icon && <opt.icon size={15} weight="bold" />}
              {opt.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

/** Underlined tabs for page-level sections. */
export function Tabs({ options = [], value, onChange, className }) {
  const layoutId = useId();
  const reduce = useReducedMotion();

  return (
    <div role="tablist" className={cn('flex gap-1 border-b border-line', className)}>
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(opt.value)}
            className={cn(
              'relative px-3 pb-3 text-sm font-medium transition-colors',
              active ? 'text-ink' : 'text-ink-muted hover:text-ink-soft',
            )}
          >
            <span className="flex items-center gap-1.5">
              {opt.label}
              {opt.count != null && (
                <span className="font-mono text-[11px] text-ink-faint">{opt.count}</span>
              )}
            </span>
            {active && (
              <motion.span
                layoutId={reduce ? undefined : layoutId}
                transition={{ type: 'spring', stiffness: 460, damping: 38 }}
                className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-accent"
              />
            )}
          </button>
        );
      })}
    </div>
  );
}

/** Range input restyled to the design system, with a live value readout. */
export function Slider({ value, onChange, min = 0, max = 100, step = 1, label, format, id }) {
  const generated = useId();
  const inputId = id ?? generated;
  const share = ((value - min) / (max - min)) * 100;

  return (
    <div>
      {label && (
        <div className="mb-2.5 flex items-baseline justify-between gap-3">
          <label htmlFor={inputId} className="text-[13px] font-medium text-ink-soft">
            {label}
          </label>
          <span className="font-mono text-[13px] font-medium text-ink">
            {format ? format(value) : value}
          </span>
        </div>
      )}
      <input
        id={inputId}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{
          background: `linear-gradient(to right, var(--accent) ${share}%, color-mix(in srgb, var(--accent) 15%, transparent) ${share}%)`,
        }}
        className={cn(
          'h-1.5 w-full cursor-pointer appearance-none rounded-full',
          '[&::-webkit-slider-thumb]:size-5 [&::-webkit-slider-thumb]:appearance-none',
          '[&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2',
          '[&::-webkit-slider-thumb]:border-surface [&::-webkit-slider-thumb]:bg-accent',
          '[&::-webkit-slider-thumb]:shadow-card [&::-webkit-slider-thumb]:transition-transform',
          'hover:[&::-webkit-slider-thumb]:scale-110 active:[&::-webkit-slider-thumb]:scale-95',
          '[&::-moz-range-thumb]:size-4 [&::-moz-range-thumb]:rounded-full',
          '[&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-surface',
          '[&::-moz-range-thumb]:bg-accent',
        )}
      />
    </div>
  );
}
