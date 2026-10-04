import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import {
  ArrowsCounterClockwiseIcon,
  CaretLeftIcon,
  CaretRightIcon,
  ExamIcon,
  ListChecksIcon,
  MoonStarsIcon,
  PlusIcon,
} from '@phosphor-icons/react';

import { PageHeader } from '../components/layout/PageHeader.jsx';
import { Button, IconButton } from '../components/ui/Button.jsx';
import { Card, Panel, SectionHeading, Stat } from '../components/ui/Card.jsx';
import { Badge } from '../components/ui/Badge.jsx';
import { EmptyState } from '../components/ui/States.jsx';
import { Reveal, EXPO } from '../components/ui/Motion.jsx';
import { TaskRow } from '../components/plan/TaskRow.jsx';
import { useApp } from '../store/AppProvider.jsx';
import {
  daysBetween,
  formatLongDay,
  formatMinutes,
  fromKey,
  monthGrid,
  todayKey,
} from '../lib/date.js';
import { cn } from '../lib/utils.js';

/* Monday-first headers. WEEKDAY_LABELS in lib/date is Sunday-first. */
const DOW = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const STATUS = {
  complete: { label: 'Goal met', tone: 'low', bar: 'bg-low-600', chip: 'bg-low-500' },
  partial: { label: 'Partly done', tone: 'mid', bar: 'bg-mid-600', chip: 'bg-mid-500' },
  missed: { label: 'Missed', tone: 'high', bar: 'bg-high-600', chip: 'bg-high-500' },
  rest: { label: 'Rest day', tone: 'neutral', bar: 'bg-line-strong', chip: 'bg-line-strong' },
};

export default function CalendarPage() {
  const { profile, subjects, dayLogs, revisionSchedule, planFor, actions } = useApp();

  const today = todayKey();
  const [selected, setSelected] = useState(today);
  const [cursor, setCursor] = useState(() => {
    const d = fromKey(today);
    return { year: d.getFullYear(), month: d.getMonth() };
  });

  const cells = useMemo(() => monthGrid(cursor.year, cursor.month), [cursor]);

  /* Revision counts per day, so a cell lookup stays O(1). */
  const revisionsByDay = useMemo(() => {
    const map = {};
    for (const r of revisionSchedule) map[r.date] = (map[r.date] ?? 0) + 1;
    return map;
  }, [revisionSchedule]);

  const monthLabel = new Date(cursor.year, cursor.month, 1).toLocaleDateString(undefined, {
    month: 'long',
    year: 'numeric',
  });

  const step = (delta) =>
    setCursor(({ year, month }) => {
      const d = new Date(year, month + delta, 1);
      return { year: d.getFullYear(), month: d.getMonth() };
    });

  const jumpToToday = () => {
    const d = fromKey(today);
    setCursor({ year: d.getFullYear(), month: d.getMonth() });
    setSelected(today);
  };

  const monthKeys = cells.filter((c) => c.inMonth).map((c) => c.key);
  const monthLogged = monthKeys.reduce((a, k) => a + (dayLogs[k]?.completedMinutes ?? 0), 0);
  const monthComplete = monthKeys.filter((k) => dayLogs[k]?.status === 'complete').length;

  if (!subjects.length) {
    return (
      <>
        <PageHeader
          title="Study calendar"
          description="Every planned, completed and missed day in one view."
        />
        <Panel>
          <EmptyState
            icon={ListChecksIcon}
            title="Nothing on the calendar yet"
            description="The calendar fills in as soon as there is a syllabus to schedule. Add a subject, or load the sample to see a month of history."
            action={
              <>
                <Button as={Link} to="/app/subjects" icon={PlusIcon}>
                  Add a subject
                </Button>
                <Button variant="secondary" onClick={actions.loadSample}>
                  Load the sample syllabus
                </Button>
              </>
            }
          />
        </Panel>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Study calendar"
        description="Every planned, completed and missed day. Pick any date to see its plan."
        actions={
          <Button variant="secondary" onClick={jumpToToday}>
            Today
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_370px]">
        {/* ── Month ────────────────────────────────────────────────────────── */}
        <Reveal>
          <Panel className="p-4 sm:p-5">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <h2 className="font-display text-lg font-semibold tracking-[-0.02em] text-ink">
                  {monthLabel}
                </h2>
                <p className="mt-1 text-[12.5px] text-ink-muted">
                  {formatMinutes(monthLogged)} logged · {monthComplete} full days
                </p>
              </div>
              <div className="flex items-center gap-1">
                <IconButton icon={CaretLeftIcon} label="Previous month" onClick={() => step(-1)} />
                <IconButton icon={CaretRightIcon} label="Next month" onClick={() => step(1)} />
              </div>
            </div>

            <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
              {DOW.map((d) => (
                <div
                  key={d}
                  className="pb-1 text-center text-[11px] font-medium tracking-[0.06em] text-ink-faint uppercase"
                >
                  <span className="hidden sm:inline">{d}</span>
                  <span className="sm:hidden">{d[0]}</span>
                </div>
              ))}

              {cells.map((cell, i) => (
                <DayCell
                  key={cell.key}
                  cell={cell}
                  index={i}
                  today={today}
                  examDate={profile.examDate}
                  log={dayLogs[cell.key]}
                  revisions={revisionsByDay[cell.key] ?? 0}
                  selected={cell.key === selected}
                  onSelect={() => setSelected(cell.key)}
                />
              ))}
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-line pt-4">
              {Object.entries(STATUS).map(([key, s]) => (
                <span key={key} className="flex items-center gap-2 text-[11.5px] text-ink-muted">
                  <span aria-hidden className={cn('h-[3px] w-5 rounded-full', s.chip)} />
                  {s.label}
                </span>
              ))}
              <span className="flex items-center gap-2 text-[11.5px] text-ink-muted">
                <ArrowsCounterClockwiseIcon size={12} weight="bold" className="text-accent" />
                Revision scheduled
              </span>
            </div>
          </Panel>
        </Reveal>

        {/* ── Selected day ─────────────────────────────────────────────────── */}
        <Reveal delay={0.05}>
          <div className="lg:sticky lg:top-24">
            <AnimatePresence mode="wait">
              <motion.div
                key={selected}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.25, ease: EXPO }}
              >
                <DayDetail
                  dateKey={selected}
                  today={today}
                  examDate={profile.examDate}
                  log={dayLogs[selected]}
                  plan={planFor(selected)}
                />
              </motion.div>
            </AnimatePresence>
          </div>
        </Reveal>
      </div>
    </>
  );
}

/* ──────────────────────────────── day cell ─────────────────────────────── */

function DayCell({ cell, index, today, examDate, log, revisions, selected, onSelect }) {
  const { key, inMonth } = cell;
  const isToday = key === today;
  const isExam = examDate && key === examDate;
  const isPast = daysBetween(key, today) > 0;
  const dayNum = fromKey(key).getDate();
  const status = log?.status;
  const spec = status ? STATUS[status] : null;

  const ratio =
    log && log.plannedMinutes > 0
      ? Math.min(1, (log.completedMinutes ?? 0) / log.plannedMinutes)
      : status === 'complete'
        ? 1
        : 0;

  return (
    <motion.button
      type="button"
      onClick={onSelect}
      aria-current={isToday ? 'date' : undefined}
      aria-label={`${formatLongDay(key)}${spec ? `, ${spec.label}` : ''}`}
      initial={{ opacity: 0, scale: 0.94 }}
      animate={{ opacity: inMonth ? 1 : 0.4, scale: 1 }}
      transition={{ duration: 0.3, delay: Math.min(index * 0.008, 0.25), ease: EXPO }}
      whileHover={{ y: -2 }}
      className={cn(
        'relative flex aspect-square flex-col rounded-input border p-1.5 text-left transition-colors duration-200 sm:p-2',
        selected
          ? 'border-accent bg-accent-soft'
          : isToday
            ? 'border-accent/45 bg-surface'
            : 'border-line bg-surface hover:border-line-strong',
        !inMonth && 'pointer-events-auto',
      )}
    >
      <span
        className={cn(
          'font-mono text-[12px] leading-none tabular-nums sm:text-[13px]',
          isToday ? 'font-semibold text-accent' : selected ? 'text-accent' : 'text-ink-soft',
        )}
      >
        {dayNum}
      </span>

      {isExam && (
        <ExamIcon
          size={13}
          weight="fill"
          aria-hidden
          className="absolute top-1.5 right-1.5 text-high-600 dark:text-high-500"
        />
      )}

      {/* Revision count sits on its own line: beside the date it reads as
          extra digits once the cells get small. */}
      {!isExam && revisions > 0 && (
        <span className="mt-auto self-end font-mono text-[10px] leading-none text-accent tabular-nums">
          {revisions}
          <ArrowsCounterClockwiseIcon size={9} weight="bold" className="ml-px inline align-middle" />
        </span>
      )}

      {/* Past days carry the day's outcome as a fill ratio, not a dot. */}
      {isPast && spec && (
        <span
          className={cn(
            'block h-[3px] w-full overflow-hidden rounded-full bg-line',
            revisions > 0 && !isExam ? 'mt-1' : 'mt-auto',
          )}
        >
          <span
            className={cn('block h-full rounded-full', spec.bar)}
            style={{ width: `${Math.max(ratio * 100, status === 'missed' ? 100 : 8)}%` }}
          />
        </span>
      )}
    </motion.button>
  );
}

/* ─────────────────────────────── day detail ────────────────────────────── */

function DayDetail({ dateKey, today, examDate, log, plan }) {
  const isToday = dateKey === today;
  const isPast = daysBetween(dateKey, today) > 0;
  const isExam = examDate && dateKey === examDate;
  const spec = log?.status ? STATUS[log.status] : null;
  const tasks = plan?.tasks ?? [];
  const doneCount = tasks.filter((t) => t.done).length;

  return (
    <Card className="p-5">
      <SectionHeading
        level={2}
        title={isToday ? 'Today' : formatLongDay(dateKey)}
        description={isToday ? formatLongDay(dateKey) : undefined}
        action={spec ? <Badge tone={spec.tone}>{spec.label}</Badge> : undefined}
      />

      {isExam ? (
        <EmptyState
          compact
          icon={ExamIcon}
          title="Exam day"
          description="Nothing is scheduled. Everything up to here has been building toward it."
        />
      ) : log?.status === 'rest' ? (
        <EmptyState
          compact
          icon={MoonStarsIcon}
          title="Rest day"
          description="No study hours were set aside for this day."
        />
      ) : (
        <>
          <div className="mt-5 grid grid-cols-3 gap-4 border-y border-line py-4">
            <Stat
              label="Planned"
              value={formatMinutes(log?.plannedMinutes ?? plan?.meta?.plannedMinutes ?? 0)}
            />
            <Stat
              label={isPast ? 'Studied' : 'Tasks'}
              value={
                isPast
                  ? formatMinutes(log?.completedMinutes ?? 0)
                  : String(tasks.length)
              }
              tone={isPast ? 'accent' : 'default'}
            />
            <Stat
              label="Done"
              value={
                log ? `${log.tasksDone}/${log.tasksTotal}` : `${doneCount}/${tasks.length}`
              }
            />
          </div>

          {tasks.length ? (
            <ul className="mt-5 flex flex-col gap-2.5">
              {tasks.map((task, i) => (
                <TaskRow key={task.id} task={task} index={i} readOnly={!isToday} />
              ))}
            </ul>
          ) : (
            <EmptyState
              compact
              icon={ListChecksIcon}
              title={isPast ? 'No plan was stored for this day' : 'Nothing scheduled yet'}
              description={
                isPast
                  ? 'Only days you studied through the planner keep a task-level record.'
                  : 'This is a projection. It will firm up as the days before it are completed.'
              }
            />
          )}

          {!isPast && !isToday && tasks.length > 0 && (
            <p className="mt-4 text-[12px] leading-relaxed text-ink-faint">
              Projected from today's ranking. Missing a day between now and then will reshuffle it.
            </p>
          )}

          {isToday && (
            <Button as={Link} to="/app/today" variant="secondary" size="sm" className="mt-5 w-full">
              Open today's plan
            </Button>
          )}
        </>
      )}
    </Card>
  );
}
