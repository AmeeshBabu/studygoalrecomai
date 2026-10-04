import { useEffect } from 'react';
import { animate, motion, useMotionValue, useTransform, useReducedMotion } from 'motion/react';
import { cn } from '../../lib/utils.js';

/* Shared easing. Matches --ease-out-expo so CSS and JS motion agree. */
export const EXPO = [0.16, 1, 0.3, 1];

/** Fade-and-rise as a block scrolls into view. Fires once. */
export function Reveal({ children, delay = 0, y = 16, className, as: Comp = 'div' }) {
  const reduce = useReducedMotion();
  const Motion = Comp === 'div' ? motion.div : motion[Comp] ?? motion.div;

  if (reduce) return <Comp className={className}>{children}</Comp>;

  return (
    <Motion
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.6, delay, ease: EXPO }}
    >
      {children}
    </Motion>
  );
}

/** Parent that walks its children in. Pair with <StaggerItem>. */
export function Stagger({ children, className, delay = 0, step = 0.06, as: Comp = 'div' }) {
  const reduce = useReducedMotion();
  const Motion = motion[Comp] ?? motion.div;

  if (reduce) return <Comp className={className}>{children}</Comp>;

  return (
    <Motion
      className={className}
      initial="hidden"
      animate="show"
      variants={{
        hidden: {},
        show: { transition: { staggerChildren: step, delayChildren: delay } },
      }}
    >
      {children}
    </Motion>
  );
}

export function StaggerItem({ children, className, y = 12, as: Comp = 'div' }) {
  const reduce = useReducedMotion();
  const Motion = motion[Comp] ?? motion.div;

  if (reduce) return <Comp className={className}>{children}</Comp>;

  return (
    <Motion
      className={className}
      variants={{
        hidden: { opacity: 0, y },
        show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EXPO } },
      }}
    >
      {children}
    </Motion>
  );
}

/** Route-level transition. Deliberately short: navigation should feel instant. */
export function PageTransition({ children, className }) {
  const reduce = useReducedMotion();
  if (reduce) return <div className={className}>{children}</div>;

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.28, ease: EXPO }}
    >
      {children}
    </motion.div>
  );
}

/**
 * Counts a figure up to its value. Only used on headline stats, where the
 * movement draws the eye to the number that changed.
 */
export function AnimatedNumber({ value, format = (v) => Math.round(v).toLocaleString(), className }) {
  const reduce = useReducedMotion();
  const mv = useMotionValue(0);
  const text = useTransform(mv, (v) => format(v));

  useEffect(() => {
    if (reduce) {
      mv.set(value);
      return;
    }
    const controls = animate(mv, value, { duration: 0.9, ease: EXPO });
    return () => controls.stop();
  }, [value, mv, reduce]);

  return (
    <motion.span className={cn('tabular-nums', className)} aria-label={format(value)}>
      {text}
    </motion.span>
  );
}
