import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowsClockwiseIcon, CaretDownIcon, XIcon } from '@phosphor-icons/react';
import { useApp } from '../../store/AppProvider.jsx';
import { formatDay, formatMinutes } from '../../lib/date.js';
import { cn, plural } from '../../lib/utils.js';

/**
 * The adaptive planner's visible half. Reconciliation runs at boot and records
 * what it moved; this is where the student is told, in the specific rather than
 * the abstract, which tasks were carried forward and from when.
 */
export function AdaptiveBanner() {
  const { adjustments, adjustmentsSeen, actions } = useApp();
  const [open, setOpen] = useState(false);

  const show = adjustments.length > 0 && !adjustmentsSeen;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: -8, height: 0 }}
          animate={{ opacity: 1, y: 0, height: 'auto' }}
          exit={{ opacity: 0, y: -8, height: 0 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="overflow-hidden"
        >
          <div className="mb-6 rounded-card border border-accent/25 bg-accent-soft p-4 sm:p-5">
            <div className="flex items-start gap-3.5">
              <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-full bg-accent text-accent-ink">
                <ArrowsClockwiseIcon size={17} weight="bold" />
              </span>

              <div className="min-w-0 flex-1">
                <p className="text-[14px] font-semibold text-ink">
                  Your study plan has been automatically adjusted
                </p>
                <p className="mt-1 text-[13px] leading-relaxed text-ink-soft">
                  {plural(adjustments.length, 'task')} you did not finish{' '}
                  {adjustments.length === 1 ? 'was' : 'were'} carried forward and re-prioritised.
                  Anything pushed back moves up the ranking, so it will not quietly disappear.
                </p>

                <button
                  type="button"
                  onClick={() => setOpen((v) => !v)}
                  aria-expanded={open}
                  className="mt-2.5 inline-flex items-center gap-1 text-[12.5px] font-medium text-accent transition-opacity hover:opacity-75"
                >
                  {open ? 'Hide details' : 'See what moved'}
                  <CaretDownIcon
                    size={13}
                    weight="bold"
                    className={cn('transition-transform duration-200', open && 'rotate-180')}
                  />
                </button>

                <AnimatePresence initial={false}>
                  {open && (
                    <motion.ul
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                      className="overflow-hidden"
                    >
                      <div className="mt-3 flex flex-col gap-1.5 border-t border-accent/15 pt-3">
                        {adjustments.slice(0, 8).map((adj, i) => (
                          <li
                            key={`${adj.date}-${adj.title}-${i}`}
                            className="flex items-baseline justify-between gap-4 text-[12.5px]"
                          >
                            <span className="min-w-0 truncate text-ink-soft">
                              <span className="font-medium text-ink">{adj.title}</span>
                              {adj.subtitle && (
                                <span className="text-ink-muted"> · {adj.subtitle}</span>
                              )}
                            </span>
                            <span className="shrink-0 font-mono text-[11.5px] text-ink-muted">
                              {formatDay(adj.date)}
                              {adj.minutes ? ` · ${formatMinutes(adj.minutes)}` : ''}
                            </span>
                          </li>
                        ))}
                        {adjustments.length > 8 && (
                          <li className="text-[12px] text-ink-faint">
                            and {adjustments.length - 8} more
                          </li>
                        )}
                      </div>
                    </motion.ul>
                  )}
                </AnimatePresence>
              </div>

              <button
                type="button"
                onClick={actions.dismissAdjustments}
                aria-label="Dismiss"
                className="-mt-1 -mr-1 grid size-8 shrink-0 place-items-center rounded-full text-ink-faint transition-colors hover:bg-surface hover:text-ink"
              >
                <XIcon size={15} weight="bold" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
