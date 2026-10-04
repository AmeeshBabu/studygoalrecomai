import { cn } from '../../lib/utils.js';

/**
 * Three rising bars: the study rhythm the product is named for. Drawn rather
 * than borrowed so the mark is not another generic sparkle or graduation cap.
 */
export function LogoMark({ size = 28, className }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 28 28"
      className={cn('shrink-0', className)}
      aria-hidden
    >
      <rect x="1" y="1" width="26" height="26" rx="8" fill="var(--accent)" />
      <rect x="7" y="15" width="3.5" height="6" rx="1.75" fill="var(--accent-ink)" opacity="0.55" />
      <rect x="12.25" y="11" width="3.5" height="10" rx="1.75" fill="var(--accent-ink)" opacity="0.8" />
      <rect x="17.5" y="7" width="3.5" height="14" rx="1.75" fill="var(--accent-ink)" />
    </svg>
  );
}

export function Logo({ size = 28, className, showWord = true }) {
  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <LogoMark size={size} />
      {showWord && (
        <span className="font-display text-[17px] font-semibold tracking-[-0.03em] text-ink">
          Cadence
        </span>
      )}
    </span>
  );
}
