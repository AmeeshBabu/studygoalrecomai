import { NavLink } from 'react-router-dom';
import { motion, useReducedMotion } from 'motion/react';
import { SunIcon, MoonIcon } from '@phosphor-icons/react';
import { NAV_GROUPS, SETTINGS_ITEM } from '../../routes.jsx';
import { useApp } from '../../store/AppProvider.jsx';
import { Logo } from '../brand/Logo.jsx';
import { cn, initials } from '../../lib/utils.js';

function NavItem({ item, onNavigate }) {
  const reduce = useReducedMotion();
  return (
    <NavLink
      to={item.to}
      end={item.end}
      onClick={onNavigate}
      className={({ isActive }) =>
        cn(
          'group relative flex items-center gap-3 rounded-full py-2 pr-3 pl-3.5 text-[13.5px] font-medium transition-colors',
          isActive ? 'text-accent' : 'text-ink-muted hover:bg-raised hover:text-ink',
        )
      }
    >
      {({ isActive }) => (
        <>
          {isActive && (
            <motion.span
              layoutId={reduce ? undefined : 'nav-active'}
              transition={{ type: 'spring', stiffness: 480, damping: 40 }}
              className="absolute inset-0 rounded-full bg-accent-soft"
            />
          )}
          <item.icon
            size={17}
            weight={isActive ? 'fill' : 'regular'}
            className="relative shrink-0"
          />
          <span className="relative truncate">{item.label}</span>
        </>
      )}
    </NavLink>
  );
}

function ThemeToggle() {
  const { profile, actions } = useApp();
  const isDark =
    profile.theme === 'dark' ||
    (profile.theme === 'system' &&
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches);

  return (
    <button
      type="button"
      onClick={() => actions.updateProfile({ theme: isDark ? 'light' : 'dark' })}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Light mode' : 'Dark mode'}
      className="grid size-9 shrink-0 place-items-center rounded-full text-ink-faint transition-colors hover:bg-raised hover:text-ink"
    >
      {isDark ? <SunIcon size={17} weight="bold" /> : <MoonIcon size={17} weight="bold" />}
    </button>
  );
}

/** Countdown block. The one number a student checks more than any other. */
function ExamCountdown() {
  const { stats, profile } = useApp();
  const days = stats.daysLeft;
  if (days == null || !profile.examDate) return null;

  const tone =
    days <= 7 ? 'text-high-600 dark:text-high-500' : days <= 21 ? 'text-mid-700 dark:text-mid-500' : 'text-ink';

  return (
    <div className="rounded-card border border-line bg-raised/70 px-3.5 py-3">
      <p className="text-[11px] font-medium text-ink-muted">
        {days < 0 ? 'Exam passed' : 'Until exam'}
      </p>
      <div className="mt-1 flex items-baseline gap-1.5">
        <span className={cn('font-mono text-2xl leading-none font-semibold tracking-[-0.03em]', tone)}>
          {Math.max(0, days)}
        </span>
        <span className="text-[12px] font-medium text-ink-faint">
          {Math.abs(days) === 1 ? 'day' : 'days'}
        </span>
      </div>
      {profile.examName && (
        <p className="mt-1.5 truncate text-[11.5px] text-ink-faint">{profile.examName}</p>
      )}
    </div>
  );
}

export function SidebarContent({ onNavigate }) {
  const { profile, account } = useApp();

  return (
    <div className="flex h-full flex-col">
      <div className="px-5 py-5">
        <Logo />
      </div>

      <nav className="flex-1 overflow-y-auto px-3 pb-4">
        {NAV_GROUPS.map((group) => (
          <div key={group.label} className="mb-5">
            <p className="mb-1.5 px-3.5 text-[10.5px] font-medium tracking-[0.12em] text-ink-faint uppercase">
              {group.label}
            </p>
            <div className="flex flex-col gap-0.5">
              {group.items.map((item) => (
                <NavItem key={item.to} item={item} onNavigate={onNavigate} />
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="flex flex-col gap-3 border-t border-line p-3">
        <ExamCountdown />
        <div className="flex items-center gap-2">
          <NavLink
            to={SETTINGS_ITEM.to}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                'flex min-w-0 flex-1 items-center gap-2.5 rounded-full py-1.5 pr-3 pl-1.5 transition-colors',
                isActive ? 'bg-accent-soft' : 'hover:bg-raised',
              )
            }
          >
            <span className="grid size-8 shrink-0 place-items-center rounded-full bg-accent font-mono text-[11px] font-semibold text-accent-ink">
              {initials(profile.name || account?.name || 'Student')}
            </span>
            <span className="min-w-0">
              <span className="block truncate text-[13px] font-medium text-ink">
                {profile.name || 'Student'}
              </span>
              <span className="block truncate text-[11px] text-ink-faint">Settings</span>
            </span>
          </NavLink>
          <ThemeToggle />
        </div>
      </div>
    </div>
  );
}

export { ThemeToggle };
