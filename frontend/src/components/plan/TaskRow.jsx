import { useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import {
  CheckIcon,
  CaretDownIcon,
  ArrowsCounterClockwiseIcon,
  BookOpenTextIcon,
} from '@phosphor-icons/react';

import { Badge, PriorityTag } from '../ui/Badge.jsx';
import { EXPO } from '../ui/Motion.jsx';
import { formatMinutes } from '../../lib/date.js';
import { cn } from '../../lib/utils.js';

/**
 * One line of a study plan.
 *
 * Completion is signalled by ink weight and a strikethrough rather than by
 * swapping the row's background: `raised` sits above `surface` in dark mode and
 * below it in light, so a background swap would mean opposite things in the two
 * themes.
 */
export function TaskRow({ task, onToggle, index = 0, readOnly = false }) {
  const reduce = useReducedMotion();
  const [open, setOpen] = useState(false);

  const done = Boolean(task.done);
  const reasons = task.reasons ?? [];
  const isRevision = task.kind === 'revision';

  return (
    <motion.li
      layout={!reduce}
      initial={reduce ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: Math.min(index * 0.04, 0.3), ease: EXPO }}
      className={cn(
        'rounded-card border bg-surface transition-colors duration-200',
        done ? 'border-line/60' : 'border-line hover:border-line-strong',
      )}
    >
      <div className="flex items-start gap-3 p-3.5 sm:gap-4 sm:p-4">
        <TickBox
          done={done}
          disabled={readOnly}
          label={`Mark ${task.title} as ${done ? 'not done' : 'done'}`}
          onToggle={() => onToggle?.(task.id)}
        />

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1.5">
            <div className="min-w-0">
              <h3
                className={cn(
                  'text-[14.5px] leading-snug font-medium transition-colors',
                  done ? 'text-ink-faint line-through' : 'text-ink',
                )}
              >
                {task.title}
              </h3>
              <p className="mt-1 flex items-center gap-1.5 text-[12px] text-ink-muted">
                {isRevision ? (
                  <ArrowsCounterClockwiseIcon size={12} weight="bold" className="shrink-0" />
                ) : (
                  <BookOpenTextIcon size={12} weight="bold" className="shrink-0" />
                )}
                <span className="truncate">{task.subtitle || task.label}</span>
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              {task.carriedOver && <Badge tone="mid">Carried over</Badge>}
              <PriorityTag priority={task.priority} score={task.score} showScore={!isRevision} />
              <span className="font-mono text-[12.5px] font-medium text-ink-soft tabular-nums">
                {formatMinutes(task.minutes)}
              </span>
            </div>
          </div>

          <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1.5">
            <span className="text-[11.5px] text-ink-faint">{task.label}</span>
            {(reasons.length > 0 || task.blurb) && (
              <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                aria-expanded={open}
                className="inline-flex items-center gap-1 text-[11.5px] font-medium text-accent transition-opacity hover:opacity-75"
              >
                Why this
                <motion.span
                  animate={{ rotate: open ? 180 : 0 }}
                  transition={reduce ? { duration: 0 } : { duration: 0.2 }}
                  className="grid place-items-center"
                >
                  <CaretDownIcon size={11} weight="bold" />
                </motion.span>
              </button>
            )}
          </div>

          <AnimatePresence initial={false}>
            {open && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={reduce ? { duration: 0 } : { duration: 0.28, ease: EXPO }}
                className="overflow-hidden"
              >
                <div className="mt-3 border-t border-line pt-3">
                  {task.blurb && (
                    <p className="text-[12.5px] leading-relaxed text-ink-muted">{task.blurb}</p>
                  )}
                  {reasons.length > 0 && (
                    <ul className="mt-2 flex flex-col gap-1.5">
                      {reasons.map((reason) => (
                        <li
                          key={reason}
                          className="flex items-start gap-2 text-[12.5px] leading-snug text-ink-soft"
                        >
                          <span
                            aria-hidden
                            className="mt-[6px] h-px w-2.5 shrink-0 bg-line-strong"
                          />
                          {reason}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.li>
  );
}

/** The tick itself. A checkbox in behaviour, a pill in shape, per the shape rule. */
function TickBox({ done, onToggle, label, disabled }) {
  const reduce = useReducedMotion();
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={done}
      aria-label={label}
      disabled={disabled}
      onClick={onToggle}
      className={cn(
        'mt-0.5 grid size-[22px] shrink-0 place-items-center rounded-full border transition-colors duration-150',
        done
          ? 'border-transparent bg-accent text-accent-ink'
          : 'border-line-strong text-transparent hover:border-accent hover:bg-accent-soft',
        disabled && 'pointer-events-none opacity-50',
      )}
    >
      <AnimatePresence initial={false}>
        {done && (
          <motion.span
            initial={reduce ? false : { scale: 0.4, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={reduce ? undefined : { scale: 0.4, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 650, damping: 26 }}
            className="grid place-items-center"
          >
            <CheckIcon size={12} weight="bold" />
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  );
}
