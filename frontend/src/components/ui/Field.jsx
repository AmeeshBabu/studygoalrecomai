import { forwardRef, useId } from 'react';
import { WarningCircleIcon } from '@phosphor-icons/react';
import { cn } from '../../lib/utils.js';

/**
 * Form field wrapper. Label always above the control, helper text in the
 * markup, error below. Placeholder is never used as a label.
 */
export function Field({ label, htmlFor, hint, error, required, className, children }) {
  return (
    <div className={cn('flex flex-col gap-2', className)}>
      {label && (
        <label
          htmlFor={htmlFor}
          className="text-[13px] font-medium text-ink-soft"
        >
          {label}
          {required && (
            <span className="ml-1 text-high-600 dark:text-high-500" aria-hidden>
              *
            </span>
          )}
        </label>
      )}
      {children}
      {error ? (
        <p className="flex items-center gap-1.5 text-[12px] font-medium text-high-700 dark:text-high-500">
          <WarningCircleIcon size={14} weight="fill" className="shrink-0" />
          {error}
        </p>
      ) : (
        hint && <p className="text-[12px] leading-snug text-ink-muted">{hint}</p>
      )}
    </div>
  );
}

const CONTROL = [
  'w-full rounded-input border bg-surface px-3.5 text-sm text-ink',
  'transition-[border-color,box-shadow] duration-150',
  'placeholder:text-ink-muted',
  'hover:border-line-strong',
  'focus:outline-none focus:border-accent focus:ring-[3px] focus:ring-accent/18',
  'disabled:opacity-50 disabled:cursor-not-allowed',
].join(' ');

export const Input = forwardRef(function Input({ className, invalid, ...props }, ref) {
  return (
    <input
      ref={ref}
      aria-invalid={invalid || undefined}
      className={cn(
        CONTROL,
        'h-11',
        invalid && 'border-high-500 focus:border-high-600 focus:ring-high-500/20',
        className,
      )}
      {...props}
    />
  );
});

export const Textarea = forwardRef(function Textarea({ className, rows = 3, ...props }, ref) {
  return (
    <textarea
      ref={ref}
      rows={rows}
      className={cn(CONTROL, 'resize-y py-2.5 leading-relaxed', className)}
      {...props}
    />
  );
});

export const Select = forwardRef(function Select({ className, children, ...props }, ref) {
  return (
    <div className="relative">
      <select
        ref={ref}
        className={cn(CONTROL, 'h-11 cursor-pointer appearance-none pr-9', className)}
        {...props}
      >
        {children}
      </select>
      <svg
        aria-hidden
        viewBox="0 0 16 16"
        className="pointer-events-none absolute top-1/2 right-3.5 size-3.5 -translate-y-1/2 text-ink-muted"
      >
        <path
          d="M4 6.5 8 10.5 12 6.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
});

/** Numeric stepper for minute and hour values. */
export function Stepper({ value, onChange, min = 0, max = 999, step = 15, suffix, id }) {
  const generated = useId();
  const inputId = id ?? generated;
  const clampTo = (n) => Math.min(max, Math.max(min, n));

  return (
    <div className="flex h-11 items-center gap-1 rounded-input border border-line bg-surface px-1 transition-colors focus-within:border-accent focus-within:ring-[3px] focus-within:ring-accent/18 hover:border-line-strong">
      <button
        type="button"
        aria-label="Decrease"
        onClick={() => onChange(clampTo(Number(value) - step))}
        className="grid size-8 shrink-0 place-items-center rounded-full text-ink-muted transition-colors hover:bg-raised hover:text-ink active:scale-95"
      >
        <svg viewBox="0 0 16 16" className="size-3.5" aria-hidden>
          <path d="M3.5 8h9" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
        </svg>
      </button>
      <input
        id={inputId}
        type="number"
        inputMode="numeric"
        value={value}
        min={min}
        max={max}
        onChange={(e) => onChange(clampTo(Number(e.target.value)))}
        className="w-full min-w-0 bg-transparent text-center font-mono text-sm font-medium text-ink outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
      />
      {suffix && <span className="pr-1 text-[12px] text-ink-muted">{suffix}</span>}
      <button
        type="button"
        aria-label="Increase"
        onClick={() => onChange(clampTo(Number(value) + step))}
        className="grid size-8 shrink-0 place-items-center rounded-full text-ink-muted transition-colors hover:bg-raised hover:text-ink active:scale-95"
      >
        <svg viewBox="0 0 16 16" className="size-3.5" aria-hidden>
          <path
            d="M8 3.5v9M3.5 8h9"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
          />
        </svg>
      </button>
    </div>
  );
}
