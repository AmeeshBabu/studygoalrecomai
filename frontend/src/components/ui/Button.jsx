import { forwardRef } from 'react';
import { motion } from 'motion/react';
import { cn } from '../../lib/utils.js';

/**
 * All buttons are pills, per the project's shape rule.
 * Contrast is checked per variant: the primary pairs cobalt with white
 * (7.4:1 in light) and the lifted blue with near-black ink in dark.
 */
const VARIANTS = {
  primary:
    'bg-accent text-accent-ink hover:bg-accent-hover shadow-[0_1px_2px_rgb(42_39_36/0.12)]',
  secondary:
    'bg-surface text-ink border border-line-strong hover:bg-raised hover:border-ink-faint',
  ghost: 'text-ink-muted hover:text-ink hover:bg-raised',
  soft: 'bg-accent-soft text-accent hover:brightness-95 dark:hover:brightness-110',
  danger: 'bg-high-600 text-white hover:bg-high-700',
  outlineDanger:
    'border border-high-200 text-high-700 hover:bg-high-50 dark:border-high-900 dark:text-high-500 dark:hover:bg-high-900/30',
};

const SIZES = {
  sm: 'h-8 px-3 text-[13px] gap-1.5',
  md: 'h-10 px-4 text-sm gap-2',
  lg: 'h-12 px-6 text-[15px] gap-2',
};

/**
 * motion.create() must never run during render: it returns a fresh component
 * type each call, which remounts the node and drops focus mid-interaction.
 * Cached per element type instead.
 */
const motionCache = new Map();
function motionFor(Comp) {
  if (typeof Comp === 'string' && motion[Comp]) return motion[Comp];
  if (!motionCache.has(Comp)) motionCache.set(Comp, motion.create(Comp));
  return motionCache.get(Comp);
}

export const Button = forwardRef(function Button(
  {
    as: Comp = 'button',
    variant = 'primary',
    size = 'md',
    icon: Icon,
    iconRight: IconRight,
    className,
    children,
    loading = false,
    disabled,
    ...props
  },
  ref,
) {
  const Motion = motionFor(Comp);
  return (
    <Motion
      ref={ref}
      /* Inside a <form> an untyped button submits, so a plain action button
         would fire the form. Forms pass type="submit" explicitly. */
      type={Comp === 'button' ? 'button' : undefined}
      whileTap={disabled || loading ? undefined : { scale: 0.975 }}
      transition={{ type: 'spring', stiffness: 600, damping: 30 }}
      disabled={Comp === 'button' ? disabled || loading : undefined}
      aria-busy={loading || undefined}
      className={cn(
        'inline-flex items-center justify-center rounded-full font-medium whitespace-nowrap',
        'transition-colors duration-150 select-none',
        'disabled:opacity-45 disabled:pointer-events-none',
        VARIANTS[variant],
        SIZES[size],
        className,
      )}
      {...props}
    >
      {loading ? (
        <span
          aria-hidden
          className="size-3.5 shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent"
        />
      ) : (
        Icon && <Icon size={size === 'sm' ? 15 : 17} weight="bold" className="shrink-0" />
      )}
      {children}
      {IconRight && !loading && (
        <IconRight size={size === 'sm' ? 15 : 17} weight="bold" className="shrink-0" />
      )}
    </Motion>
  );
});

/** Square icon-only button. Always needs an aria-label from the caller. */
export function IconButton({ icon: Icon, label, size = 'md', variant = 'ghost', className, ...props }) {
  const box = size === 'sm' ? 'size-8' : 'size-10';
  return (
    <motion.button
      type="button"
      aria-label={label}
      title={label}
      whileTap={{ scale: 0.94 }}
      transition={{ type: 'spring', stiffness: 600, damping: 30 }}
      className={cn(
        'inline-flex items-center justify-center rounded-full transition-colors duration-150',
        'disabled:opacity-45 disabled:pointer-events-none',
        VARIANTS[variant],
        box,
        className,
      )}
      {...props}
    >
      <Icon size={size === 'sm' ? 16 : 18} weight="bold" />
    </motion.button>
  );
}
