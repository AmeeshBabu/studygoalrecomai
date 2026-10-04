import { Link } from 'react-router-dom';
import { Logo } from '../components/brand/Logo.jsx';
import { Button } from '../components/ui/Button.jsx';
import { ArrowLeftIcon } from '@phosphor-icons/react';

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-paper px-6 text-center">
      <Logo size={32} />
      <p className="mt-10 font-mono text-[13px] tracking-[0.1em] text-ink-faint">404</p>
      <h1 className="text-display mt-3 text-[34px] font-semibold text-ink">
        That page is not on the syllabus
      </h1>
      <p className="mt-3 max-w-[44ch] text-[14.5px] leading-relaxed text-ink-muted">
        The link you followed does not point anywhere in Cadence. Your plan is still where you left
        it.
      </p>
      <Button as={Link} to="/app" className="mt-8" icon={ArrowLeftIcon}>
        Back to the dashboard
      </Button>
    </div>
  );
}
