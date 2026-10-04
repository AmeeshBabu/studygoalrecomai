import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  ArrowsCounterClockwiseIcon,
  BrainIcon,
  CheckCircleIcon,
  PlusIcon,
  StackIcon,
} from '@phosphor-icons/react';

import { PageHeader } from '../components/layout/PageHeader.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Card, Panel, SectionHeading, Stat } from '../components/ui/Card.jsx';
import { Badge, DifficultyTag, SubjectMark } from '../components/ui/Badge.jsx';
import { ProgressBar } from '../components/ui/Progress.jsx';
import { EmptyState } from '../components/ui/States.jsx';
import { SegmentedControl } from '../components/ui/Controls.jsx';
import { Reveal, Stagger, StaggerItem, AnimatedNumber, EXPO } from '../components/ui/Motion.jsx';
import { useApp } from '../store/AppProvider.jsx';
import { REVISION_KINDS, groupRevisionsByDay } from '../engine/revision.js';
import { daysBetween, formatDay, formatMinutes, todayKey } from '../lib/date.js';
import { cn, plural } from '../lib/utils.js';

const KIND_FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'quick', label: 'Quick' },
  { value: 'topic', label: 'Topic' },
  { value: 'deep', label: 'Deep' },
  { value: 'subject', label: 'Subject' },
];

export default function Revision() {
  const { revisionSchedule, topics, stats, profile } = useApp();
  const today = todayKey();
  const [kind, setKind] = useState('all');

  const upcoming = useMemo(
    () => revisionSchedule.filter((r) => daysBetween(today, r.date) >= 0),
    [revisionSchedule, today],
  );

  const filtered = useMemo(
    () => (kind === 'all' ? upcoming : upcoming.filter((r) => r.kind === kind)),
    [upcoming, kind],
  );

  const days = useMemo(() => groupRevisionsByDay(filtered), [filtered]);

  const totalMinutes = upcoming.reduce((a, r) => a + r.minutes, 0);
  const topicsInRotation = new Set(upcoming.filter((r) => r.topicId).map((r) => r.topicId)).size;
  const doneTopics = topics.filter((t) => t.status === 'done').length;

  const thisWeek = upcoming.filter((r) => {
    const d = daysBetween(today, r.date);
    return d >= 0 && d < 7;
  });

  const byKind = useMemo(() => {
    const counts = {};
    for (const r of upcoming) counts[r.kind] = (counts[r.kind] ?? 0) + 1;
    return counts;
  }, [upcoming]);

  if (!doneTopics) {
    return (
      <>
        <PageHeader
          title="Revision planner"
          description="Spaced repetition over everything you have finished."
        />
        <Panel>
          <EmptyState
            icon={BrainIcon}
            title="Nothing to revise yet"
            description="Revision is scheduled from completed topics. Tick your first topic off and it enters a spaced-repetition ladder: hard topics come back sooner and more often than easy ones."
            action={
              <>
                <Button as={Link} to="/app/today" icon={CheckCircleIcon}>
                  Go to today's plan
                </Button>
                <Button as={Link} to="/app/subjects" variant="secondary" icon={PlusIcon}>
                  Manage syllabus
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
        title="Revision planner"
        description="Completed topics come back on a spaced ladder. Harder material returns sooner, and more often."
        actions={
          <Button as={Link} to="/app/calendar" variant="secondary">
            See on calendar
          </Button>
        }
      />

      {/* ── The shape of the revision load ───────────────────────────────── */}
      <Reveal>
        <Panel className="grid grid-cols-2 divide-line p-0 sm:grid-cols-4 sm:divide-x">
          <div className="p-5">
            <Stat
              icon={ArrowsCounterClockwiseIcon}
              label="Sessions ahead"
              value={<AnimatedNumber value={upcoming.length} />}
              hint={formatMinutes(totalMinutes)}
            />
          </div>
          <div className="p-5">
            <Stat
              label="Next 7 days"
              value={<AnimatedNumber value={thisWeek.length} />}
              tone="accent"
              hint={formatMinutes(thisWeek.reduce((a, r) => a + r.minutes, 0))}
            />
          </div>
          <div className="border-t border-line p-5 sm:border-t-0">
            <Stat
              icon={StackIcon}
              label="Topics in rotation"
              value={<AnimatedNumber value={topicsInRotation} />}
              hint={`${doneTopics} completed`}
            />
          </div>
          <div className="border-t border-line p-5 sm:border-t-0">
            <Stat
              label="Exam in"
              value={<AnimatedNumber value={stats.daysLeft ?? 0} />}
              unit={stats.daysLeft === 1 ? 'day' : 'days'}
              tone={stats.daysLeft != null && stats.daysLeft <= 7 ? 'high' : 'default'}
              hint={profile.examDate ? formatDay(profile.examDate) : 'No date set'}
            />
          </div>
        </Panel>
      </Reveal>

      {/* ── The four session kinds ───────────────────────────────────────── */}
      <Reveal delay={0.05} className="mt-6">
        <SectionHeading
          title="Session types"
          description="Each pass goes deeper than the last. The ladder is chosen by the topic's difficulty."
        />
        <Stagger className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Object.entries(REVISION_KINDS).map(([key, spec]) => (
            <StaggerItem key={key}>
              <Card className="h-full p-4">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-[13.5px] leading-snug font-medium text-ink">{spec.label}</h3>
                  <span className="shrink-0 font-mono text-[12px] font-medium text-accent tabular-nums">
                    {byKind[key] ?? 0}
                  </span>
                </div>
                <p className="mt-2 text-[12px] leading-relaxed text-ink-muted">{spec.blurb}</p>
              </Card>
            </StaggerItem>
          ))}
        </Stagger>
      </Reveal>

      {/* ── Timeline ─────────────────────────────────────────────────────── */}
      <div className="mt-10">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-lg font-semibold tracking-[-0.02em] text-ink">
            Upcoming schedule
          </h2>
          <SegmentedControl options={KIND_FILTERS} value={kind} onChange={setKind} size="sm" />
        </div>

        {days.length === 0 ? (
          <Card>
            <EmptyState
              compact
              icon={ArrowsCounterClockwiseIcon}
              title="No sessions of that type"
              description="Try another filter. Deep passes and full-subject sweeps only appear closer to the exam."
              action={
                <Button size="sm" variant="secondary" onClick={() => setKind('all')}>
                  Show all types
                </Button>
              }
            />
          </Card>
        ) : (
          <ol className="flex flex-col gap-5">
            {days.map((day, di) => (
              <DayGroup key={day.date} day={day} index={di} today={today} />
            ))}
          </ol>
        )}
      </div>
    </>
  );
}

function DayGroup({ day, index, today }) {
  const offset = daysBetween(today, day.date);
  const isToday = offset === 0;
  const minutes = day.items.reduce((a, r) => a + r.minutes, 0);

  return (
    <motion.li
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: Math.min(index * 0.05, 0.4), ease: EXPO }}
      /* Both tracks are minmax(0,…): an implicit auto track sizes to the
         widest session card and pushes the row past the viewport. */
      className="grid grid-cols-1 gap-4 sm:grid-cols-[132px_minmax(0,1fr)]"
    >
      {/* Day marker. One line on phones, a stacked rail head from sm up. */}
      <div className="flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-0.5 sm:block sm:pt-1">
        <p
          className={cn(
            'text-[13.5px] font-medium',
            isToday ? 'text-accent' : 'text-ink',
          )}
        >
          {isToday ? 'Today' : formatDay(day.date, { weekday: 'short' })}
        </p>
        <p className="text-[11.5px] text-ink-muted sm:mt-0.5">
          {isToday ? formatDay(day.date) : offset === 1 ? 'Tomorrow' : `in ${plural(offset, 'day')}`}
        </p>
        <p className="ml-auto font-mono text-[11.5px] text-ink-faint tabular-nums sm:mt-1.5 sm:ml-0">
          {formatMinutes(minutes)}
        </p>
      </div>

      {/* Sessions, hung off a hairline rail */}
      <ul className="flex flex-col gap-2.5 border-line sm:border-l sm:pl-5">
        {day.items.map((item) => (
          <li
            key={item.id}
            className="rounded-card border border-line bg-surface px-4 py-3.5 transition-colors duration-200 hover:border-line-strong"
          >
            <div className="flex items-start gap-3.5">
              <SubjectMark name={item.subjectName} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[14px] font-medium text-ink">
                  {item.topicName ?? `${item.subjectName}: full sweep`}
                </p>
                <p className="mt-0.5 truncate text-[11.5px] text-ink-muted">
                  {REVISION_KINDS[item.kind]?.label}
                  {item.totalPasses > 1 && ` · pass ${item.pass} of ${item.totalPasses}`}
                  {item.topicName && ` · ${item.subjectName}`}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {item.kind === 'subject' ? (
                  <Badge tone="accent">Full sweep</Badge>
                ) : (
                  <DifficultyTag difficulty={item.difficulty} />
                )}
                <span className="font-mono text-[12.5px] font-medium text-ink-soft tabular-nums">
                  {formatMinutes(item.minutes)}
                </span>
              </div>
            </div>

            {item.totalPasses > 1 && (
              <ProgressBar
                className="mt-3"
                value={item.pass}
                max={item.totalPasses}
                size="xs"
                animate={false}
              />
            )}
          </li>
        ))}
      </ul>
    </motion.li>
  );
}
