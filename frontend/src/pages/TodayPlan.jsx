import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'motion/react';
import {
  ArrowsClockwiseIcon,
  ClockIcon,
  ConfettiIcon,
  ListChecksIcon,
  MoonStarsIcon,
  PlusIcon,
  SlidersIcon,
} from '@phosphor-icons/react';

import { PageHeader } from '../components/layout/PageHeader.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Card, Panel, Stat } from '../components/ui/Card.jsx';
import { Badge } from '../components/ui/Badge.jsx';
import { ProgressBar, SegmentBar } from '../components/ui/Progress.jsx';
import { EmptyState } from '../components/ui/States.jsx';
import { SegmentedControl } from '../components/ui/Controls.jsx';
import { ConfirmDialog } from '../components/ui/Modal.jsx';
import { LegendItem } from '../components/charts/ChartFrame.jsx';
import { Reveal, AnimatedNumber, EXPO } from '../components/ui/Motion.jsx';
import { TaskRow } from '../components/plan/TaskRow.jsx';
import { useApp } from '../store/AppProvider.jsx';
import { formatLongDay, formatMinutes, todayKey } from '../lib/date.js';
import { plural } from '../lib/utils.js';

const FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'study', label: 'Study' },
  { value: 'revision', label: 'Revision' },
  { value: 'open', label: 'Not done' },
];

export default function TodayPlan() {
  const { todayPlan, subjects, actions } = useApp();
  const reduce = useReducedMotion();
  const [filter, setFilter] = useState('all');
  const [confirmReset, setConfirmReset] = useState(false);

  const tasks = todayPlan.tasks;
  const done = tasks.filter((t) => t.done);
  const doneMinutes = done.reduce((a, t) => a + t.minutes, 0);
  const planned = todayPlan.meta.plannedMinutes ?? 0;
  const unplanned = todayPlan.meta.unplannedMinutes ?? 0;
  const allDone = tasks.length > 0 && done.length === tasks.length;

  const visible = useMemo(() => {
    if (filter === 'all') return tasks;
    if (filter === 'open') return tasks.filter((t) => !t.done);
    return tasks.filter((t) => t.kind === filter);
  }, [tasks, filter]);

  const studyCount = tasks.filter((t) => t.kind === 'study').length;
  const revisionCount = tasks.length - studyCount;

  return (
    <>
      <PageHeader
        title="Today’s study plan"
        description={`${formatLongDay(todayKey())}. Ordered by priority, time-boxed to the hours you have.`}
        actions={
          <>
            <Button
              variant="secondary"
              icon={ArrowsClockwiseIcon}
              onClick={() => setConfirmReset(true)}
              disabled={!tasks.length}
            >
              Regenerate
            </Button>
            <Button as={Link} to="/app/settings" variant="ghost" icon={SlidersIcon}>
              Hours
            </Button>
          </>
        }
      />

      {/* ── The day's budget, spent and unspent ──────────────────────────── */}
      <Reveal>
        <Panel className="p-5">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-[auto_minmax(0,1fr)] sm:items-center sm:gap-8">
            <div className="grid grid-cols-3 gap-6 sm:gap-8">
              <Stat
                icon={ClockIcon}
                label="Available"
                value={(todayPlan.budgetMinutes / 60).toFixed(1)}
                unit="h"
              />
              <Stat
                label="Scheduled"
                value={formatMinutes(planned)}
                tone="accent"
                hint={`${plural(tasks.length, 'task')}`}
              />
              <Stat
                label="Completed"
                value={<AnimatedNumber value={doneMinutes} format={(v) => formatMinutes(v)} />}
                hint={`${done.length} of ${tasks.length}`}
              />
            </div>

            <div className="min-w-0">
              <SegmentBar
                height={12}
                segments={[
                  {
                    key: 'done',
                    label: 'Completed',
                    value: doneMinutes,
                    className: 'bg-accent',
                  },
                  {
                    key: 'left',
                    label: 'Scheduled, not yet done',
                    value: Math.max(0, planned - doneMinutes),
                    className: 'bg-accent/25',
                  },
                  {
                    key: 'free',
                    label: 'Unscheduled',
                    value: unplanned,
                    className: 'bg-raised',
                  },
                ]}
              />
              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
                <LegendItem swatchClass="bg-accent" label="Done" value={formatMinutes(doneMinutes)} />
                <LegendItem
                  swatchClass="bg-accent/25"
                  label="Remaining"
                  value={formatMinutes(Math.max(0, planned - doneMinutes))}
                />
                {unplanned > 0 && (
                  <LegendItem swatchClass="bg-raised" label="Free" value={formatMinutes(unplanned)} />
                )}
              </div>
            </div>
          </div>

          {todayPlan.note && (
            <p className="mt-5 border-t border-line pt-4 text-[13px] leading-relaxed text-ink-muted">
              {todayPlan.note}
            </p>
          )}
        </Panel>
      </Reveal>

      {/* ── Completion banner. Only when the whole day is genuinely done. ── */}
      {allDone && (
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: EXPO }}
          className="mt-6 flex items-center gap-3 rounded-card border border-low-200 bg-low-50 px-4 py-3.5 dark:border-low-900 dark:bg-low-900/25"
        >
          <ConfettiIcon size={20} weight="duotone" className="shrink-0 text-low-700 dark:text-low-500" />
          <p className="text-[13.5px] leading-snug text-low-700 dark:text-low-500">
            Every task for today is done. {formatMinutes(doneMinutes)} of focused work logged.
          </p>
        </motion.div>
      )}

      {/* ── The list ─────────────────────────────────────────────────────── */}
      <div className="mt-8">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <h2 className="font-display text-lg font-semibold tracking-[-0.02em] text-ink">
              The plan
            </h2>
            {revisionCount > 0 && (
              <Badge tone="accent">
                {studyCount} study · {revisionCount} revision
              </Badge>
            )}
          </div>
          {tasks.length > 1 && (
            <SegmentedControl options={FILTERS} value={filter} onChange={setFilter} size="sm" />
          )}
        </div>

        {tasks.length === 0 ? (
          <Card>
            <EmptyState
              icon={todayPlan.mode === 'exam-day' ? MoonStarsIcon : ListChecksIcon}
              title={
                todayPlan.mode === 'exam-day'
                  ? 'Exam day. No plan today.'
                  : subjects.length
                    ? 'Nothing scheduled for today'
                    : 'Add a subject to get a plan'
              }
              description={
                todayPlan.note ??
                'The planner had nothing to schedule. Check that your syllabus has pending topics and that today has study hours set aside.'
              }
              action={
                subjects.length ? (
                  <Button as={Link} to="/app/settings" size="sm" variant="secondary">
                    Adjust study hours
                  </Button>
                ) : (
                  <Button as={Link} to="/app/subjects" size="sm" icon={PlusIcon}>
                    Add a subject
                  </Button>
                )
              }
            />
          </Card>
        ) : visible.length === 0 ? (
          <Card>
            <EmptyState
              compact
              icon={ListChecksIcon}
              title="Nothing matches that filter"
              description="Every task in this group is already ticked off."
              action={
                <Button size="sm" variant="secondary" onClick={() => setFilter('all')}>
                  Show all tasks
                </Button>
              }
            />
          </Card>
        ) : (
          <ul className="flex flex-col gap-3">
            {visible.map((task, i) => (
              <TaskRow key={task.id} task={task} index={i} onToggle={actions.toggleTask} />
            ))}
          </ul>
        )}

        {tasks.length > 0 && (
          <div className="sticky bottom-4 mt-6">
            <Panel className="flex flex-wrap items-center gap-4 p-4 shadow-lift backdrop-blur-md">
              <ProgressBar
                className="min-w-[180px] flex-1"
                value={doneMinutes}
                max={planned || 1}
                label={`${done.length} of ${tasks.length} tasks done`}
                showValue
                size="sm"
              />
              <span className="font-mono text-[12.5px] text-ink-muted tabular-nums">
                {formatMinutes(Math.max(0, planned - doneMinutes))} left
              </span>
            </Panel>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={confirmReset}
        onClose={() => setConfirmReset(false)}
        onConfirm={() => {
          actions.regenerateToday();
          setConfirmReset(false);
        }}
        title="Regenerate today’s plan?"
        description="The plan will be rebuilt from the current ranking. Tasks you have already ticked off today will be cleared, though completed topics stay completed."
        confirmLabel="Regenerate"
      />
    </>
  );
}
