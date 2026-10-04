import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { XIcon } from '@phosphor-icons/react';
import { cn } from '../../lib/utils.js';

/**
 * Centred on desktop, a bottom sheet on phones, which is where a thumb
 * expects it. Escape closes, background scroll is locked while open.
 */
export function Modal({ open, onClose, title, description, children, footer, size = 'md' }) {
  const reduce = useReducedMotion();

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === 'Escape' && onClose();
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  const widths = { sm: 'sm:max-w-md', md: 'sm:max-w-lg', lg: 'sm:max-w-2xl' };

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6">
          <motion.div
            className="absolute inset-0 bg-sand-950/45 backdrop-blur-[3px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={title}
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 24, scale: 0.98 }}
            animate={reduce ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: 16, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 380, damping: 32 }}
            className={cn(
              'relative flex max-h-[92vh] w-full flex-col overflow-hidden border border-line bg-surface shadow-modal',
              'rounded-t-panel sm:rounded-panel',
              widths[size],
            )}
          >
            <header className="flex items-start justify-between gap-4 px-6 pt-6 pb-4">
              <div className="min-w-0">
                <h2 className="font-display text-lg font-semibold tracking-[-0.02em] text-ink">
                  {title}
                </h2>
                {description && (
                  <p className="mt-1 text-[13px] leading-relaxed text-ink-muted">{description}</p>
                )}
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="-mt-1 -mr-2 grid size-9 shrink-0 place-items-center rounded-full text-ink-faint transition-colors hover:bg-raised hover:text-ink"
              >
                <XIcon size={18} weight="bold" />
              </button>
            </header>

            <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-6">{children}</div>

            {footer && (
              <footer className="flex flex-wrap items-center justify-end gap-2 border-t border-line bg-raised/60 px-6 py-4">
                {footer}
              </footer>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

/** Destructive confirmation. Always names the thing being removed. */
export function ConfirmDialog({ open, onClose, onConfirm, title, description, confirmLabel = 'Delete' }) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      description={description}
      size="sm"
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 items-center rounded-full px-4 text-sm font-medium text-ink-muted transition-colors hover:bg-raised hover:text-ink"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="inline-flex h-10 items-center rounded-full bg-high-600 px-4 text-sm font-medium text-white transition-colors hover:bg-high-700"
          >
            {confirmLabel}
          </button>
        </>
      }
    >
      <p className="text-sm leading-relaxed text-ink-soft">
        This cannot be undone.
      </p>
    </Modal>
  );
}
