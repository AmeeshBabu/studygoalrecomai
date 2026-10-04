import { motion } from 'motion/react';
import { cn } from '../../lib/utils.js';

/**
 * Page masthead. Title, one line of orientation, and the page's own actions.
 * No eyebrow label: the sidebar already says where you are.
 */
export function PageHeader({ title, description, actions, meta, className }) {
  return (
    <div className={cn('mb-7', className)}>
      {/* Stacked on phones: sharing the row squeezes the title into a
          two-word column long before the actions run out of space. */}
      <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between sm:gap-x-6">
        <div className="min-w-0 sm:flex-1">
          <motion.h1
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="font-display text-[26px] leading-tight font-semibold tracking-[-0.03em] text-ink sm:text-[30px]"
          >
            {title}
          </motion.h1>
          {description && (
            <p className="mt-2 max-w-[62ch] text-[14px] leading-relaxed text-ink-muted">
              {description}
            </p>
          )}
        </div>
        {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
      </div>
      {meta && <div className="mt-5">{meta}</div>}
    </div>
  );
}
