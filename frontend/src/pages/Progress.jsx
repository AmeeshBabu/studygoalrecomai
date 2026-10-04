import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  ChartLineUpIcon,
  ClockIcon,
  FlameIcon,
  PlusIcon,
  TargetIcon,
} from '@phosphor-icons/react';

import { PageHeader } from '../components/layout/PageHeader.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Card, Panel, SectionHeading, Stat } from '../components/ui/Card.jsx';
import { Badge, SubjectMark } from '../components/ui/Badge.jsx';
import { ProgressBar, Ring, SegmentBar } from '../components/ui/Progress.jsx';
import { EmptyState } from '../components/ui/States.jsx';
import { Reveal, AnimatedNumber } from '../components/ui/Motion.jsx';
import { ChartFrame, LegendItem } from '../components/charts/ChartFrame.jsx';
import { BarCompare } from '../components/charts/BarCompare.jsx';
import { Sparkline } from '../components/charts/Sparkline.jsx';
import { Heatmap, HeatmapLegend } from '../components/charts/Heatmap.jsx';
import { useApp } from '../store/AppProvider.jsx';
import {
  addDays,
  formatDay,
  formatHours,
  formatMinutes,
  todayKey,
  weekdayOf,
  weekOf,
  WEEKDAY_LABELS,
} from '../lib/date.js';
import { plural } from '../lib/utils.js';

const HISTORY_DAYS = 63; // nine whole weeks, so the heatmap grid stays square

const FORECAST = {
  'on-track': {
    tone: 'low',
    label: 'On track',
    line: 'At your current pace the syllabus is finished before the exam.',
  },
  ahead: {
    tone: 'low',
    label: 'Ahead',
    line: 'You have more time than the remaining syllabus needs. Revision will take up the slack.',
  },
  tight: {
    tone: 'mid',
    label: 'Tight',
    line: 'It fits, but with very little margin. A missed day starts to hurt here.',
  },
  behind: {
    tone: 'high',
    label: 'Behind',
    line: 'At the current pace the syllabus does not finish in time. Raise daily hours or trim scope.',
  },
  'out-of-time': {
    tone: 'high',
    label: 'Out of time',
    line: 'There are not enough hours left to cover everything. Prioritise the heaviest-weighted subjects.',
  },
  unknown: {
    tone: 'neutral',
    label: 'No exam date',
    line: 'Set an exam date and the forecast can tell you whether the plan lands in time.',
  },
};

export default function Progress() {
  const { subjects, dayLogs, stats, bySubject, forecast, todayPlan, actions } = useApp();
  const today = todayKey();

  /* Daily history, oldest first. Today counts what has been ticked so far. */
  const history = useMemo(() => {
    const doneToday = todayPlan.tasks.filter((t) => t.done).reduce((a, t) => a + t.minutes, 0);
    return Array.from({ length: HISTORY_DAYS }, (_, i) => {
      const key = addDays(today, -(HISTORY_DAYS - 1 - i));
      const minutes = key === today ? doneToday : (dayLogs[key]?.completedMinutes ?? 0);
      return { key, minutes };
    });
  }, [dayLogs, today, todayPlan]);

  const fortnight = useMemo(
    () =>
      history.slice(-14).map((d) => ({
        key: d.key,
        value: d.minutes,
        label: formatDay(d.key),
        short: WEEKDAY_LABELS[weekdayOf(d.key)][0],
      })),
    [history],
  );

  /* Weekly roll-up: the heatmap's table twin, and honest about partial weeks. */
  const weeks = useMemo(() => {
    const byWeek = new Map();
    for (const day of history) {
      const monday = weekOf(day.key)[0];
      const row = byWeek.get(monday) ?? { monday, minutes: 0, kept: 0, days: 0 };
      row.minutes += day.minutes;
      row.days += 1;
      if (day.minutes > 0) row.kept += 1;
      byWeek.set(monday, row);
    }
    return [...byWeek.values()].sort((a, b) => b.monday.localeCompare(a.monday));
  }, [history]);

  const studied = history.reduce((a, d) => a + d.minutes, 0);
  const activeDays = history.filter((d) => d.minutes > 0).length;
  const avgActive = activeDays ? Math.round(studied / activeDays) : 0;
  const best = history.reduce((a, d) => (d.minutes > a.minutes ? d : a), history[0]);
  const target = todayPlan.budgetMinutes || 240;

  const subjectBars = bySubject.map((s) => ({
    key: s.subject.id,
    label: s.subject.name,
    value: s.completion,
    hint: `${s.doneCount} of ${s.topicCount} topics`,
  }));

  const fc = FORECAST[forecast.status] ?? FORECAST.unknown;

  if (!subjects.length) {
    return (
      <>
        <PageHeader title="Progress" description="What you have actually done, over time." />
        <Panel>
          <EmptyState
            icon={ChartLineUpIcon}
            title="No progress to chart yet"
            description="Analytics are built from your logged study days. Add a syllabus and complete a day or two, or load the sample to see a populated view."
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
        title="Progress"
        description="What you have actually done, and whether it adds up to a finished syllabus."
      />

      {/* ── Headline numbers ─────────────────────────────────────────────── */}
      <Reveal>
        <Panel className="grid grid-cols-2 divide-line sm:grid-cols-4 sm:divide-x">
          <div className="p-5">
            <Stat
              icon={ClockIcon}
              label="Studied"
              value={formatHours(studied).replace('h', '')}
              unit="h"
              tone="accent"
              hint={`over ${plural(activeDays, 'active day')}`}
            />
          </div>
          <div className="p-5">
            <Stat
              icon={TargetIcon}
              label="Consistency"
              value={<AnimatedNumber value={stats.consistency ?? 0} />}
              unit="%"
              hint={`${stats.completeDays} full · ${stats.partialDays} partial`}
            />
          </div>
          <div className="border-t border-line p-5 sm:border-t-0">
            <Stat
              icon={FlameIcon}
              label="Streak"
              value={<AnimatedNumber value={stats.streak} />}
              unit={stats.streak === 1 ? 'day' : 'days'}
              hint={`${stats.missedDays} missed`}
            />
          </div>
          <div className="border-t border-line p-5 sm:border-t-0">
            <Stat
              label="Average session"
              value={formatMinutes(avgActive)}
              hint={best?.minutes ? `best ${formatMinutes(best.minutes)}` : 'no history'}
            />
          </div>
        </Panel>
      </Reveal>

      {/* ── Will it land in time? ────────────────────────────────────────── */}
      <Reveal delay={0.05} className="mt-6">
        <Card className="p-5">
          <SectionHeading
            level={2}
            title="Finishing forecast"
            description="Remaining syllabus and revision, measured against the hours actually left."
            action={<Badge tone={fc.tone}>{fc.label}</Badge>}
          />

          <p className="mt-4 text-[13.5px] leading-relaxed text-ink-soft">{fc.line}</p>

          {forecast.status !== 'unknown' && (
            <>
              <div className="mt-6">
                <SegmentBar
                  height={12}
                  segments={[
                    {
                      key: 'study',
                      label: 'Remaining syllabus',
                      value: forecast.requiredMinutes,
                      className: 'bg-accent',
                    },
                    {
                      key: 'revision',
                      label: 'Revision on top',
                      value: Math.max(0, forecast.withRevision - forecast.requiredMinutes),
                      className: 'bg-accent/40',
                    },
                    {
                      key: 'slack',
                      label: 'Slack',
                      value: Math.max(0, forecast.surplus),
                      className: 'bg-raised',
                    },
                  ]}
                />
                <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2">
                  <LegendItem
                    swatchClass="bg-accent"
                    label="Syllabus"
                    value={formatMinutes(forecast.requiredMinutes)}
                  />
                  <LegendItem
                    swatchClass="bg-accent/40"
                    label="Revision"
                    value={formatMinutes(
                      Math.max(0, forecast.withRevision - forecast.requiredMinutes),
                    )}
                  />
                  <LegendItem
                    swatchClass="bg-raised"
                    label={forecast.surplus >= 0 ? 'Slack' : 'Shortfall'}
                    value={formatMinutes(Math.abs(forecast.surplus))}
                  />
                </div>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-5 border-t border-line pt-5 sm:grid-cols-4">
                <Stat label="Days left" value={forecast.daysLeft ?? 0} />
                <Stat
                  label="Hours available"
                  value={formatHours(forecast.availableMinutes).replace('h', '')}
                  unit="h"
                />
                <Stat
                  label="Needed per day"
                  value={formatMinutes(forecast.neededPerDay)}
                  tone={forecast.neededPerDay > forecast.currentPerDay ? 'high' : 'low'}
                />
                <Stat label="Planned per day" value={formatMinutes(forecast.currentPerDay)} />
              </div>

              {forecast.extraPerDay > 0 && (
                <p className="mt-5 rounded-card border border-line bg-raised px-4 py-3 text-[13px] leading-relaxed text-ink-soft">
                  Adding{' '}
                  <span className="font-medium text-ink">
                    {formatMinutes(forecast.extraPerDay)} a day
                  </span>{' '}
                  closes the gap.{' '}
                  <Link to="/app/settings" className="font-medium text-accent hover:opacity-75">
                    Adjust your hours
                  </Link>
                  .
                </p>
              )}
            </>
          )}
        </Card>
      </Reveal>

      {/* ── Study history ────────────────────────────────────────────────── */}
      <Reveal delay={0.05} className="mt-6">
        <ChartFrame
          title="Study history"
          subtitle={`Minutes completed each day over the last ${HISTORY_DAYS} days.`}
          legend={<HeatmapLegend />}
          table={{
            columns: ['Week of', 'Studied', 'Days kept'],
            rows: weeks.map((w) => [
              formatDay(w.monday),
              formatMinutes(w.minutes),
              `${w.kept}/${w.days}`,
            ]),
          }}
        >
          <Heatmap days={history} target={target} />
        </ChartFrame>
      </Reveal>

      {/* ── Trend and subject comparison ─────────────────────────────────── */}
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Reveal delay={0.05}>
          <ChartFrame
            className="h-full"
            title="Last fortnight"
            subtitle="Daily completed minutes against the target you set."
            legend={<LegendItem shape="line" swatchClass="bg-line-strong" label="Daily target" />}
            table={{
              columns: ['Day', 'Studied'],
              rows: fortnight.map((d) => [d.label, formatMinutes(d.value)]),
            }}
          >
            <Sparkline data={fortnight} target={target} height={180} format={formatMinutes} />
          </ChartFrame>
        </Reveal>

        <Reveal delay={0.1}>
          <ChartFrame
            className="h-full"
            title="Subject completion"
            subtitle="Share of each subject's estimated time already behind you."
            table={{
              columns: ['Subject', 'Done', 'Remaining'],
              rows: bySubject.map((s) => [
                s.subject.name,
                `${s.completion}%`,
                formatMinutes(s.remainingMinutes),
              ]),
            }}
          >
            <BarCompare data={subjectBars} emptyLabel="No subjects yet" />
          </ChartFrame>
        </Reveal>
      </div>

      {/* ── Per-subject detail ───────────────────────────────────────────── */}
      <Reveal delay={0.05} className="mt-10">
        <SectionHeading
          title="Subject breakdown"
          description="Where the remaining work actually sits."
          action={
            <Button as={Link} to="/app/subjects" variant="ghost" size="sm">
              Manage syllabus
            </Button>
          }
        />
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          {bySubject.map((s) => (
            <Card key={s.subject.id} className="p-5">
              <div className="flex items-start gap-3.5">
                <SubjectMark name={s.subject.name} size="md" />
                <div className="min-w-0 flex-1">
                  {/* Subject names run long ("Database Management Systems") and a
                      ring sits beside them, so a single line clips the useful half. */}
                  <h3 className="line-clamp-2 text-[14.5px] leading-snug font-medium text-ink">
                    {s.subject.name}
                  </h3>
                  <p className="mt-0.5 text-[12px] text-ink-muted">
                    {s.doneCount} of {s.topicCount} topics · {formatMinutes(s.remainingMinutes)} left
                  </p>
                </div>
                <Ring value={s.completion} size={52} stroke={5}>
                  <span className="font-mono text-[11.5px] font-medium text-ink tabular-nums">
                    {s.completion}
                  </span>
                </Ring>
              </div>

              <ProgressBar className="mt-4" value={s.completion} size="sm" />

              <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-line pt-3.5 text-[11.5px] text-ink-muted">
                <span>{formatMinutes(s.doneMinutes)} done</span>
                {s.hardPending > 0 && (
                  <span className="text-high-700 dark:text-high-500">
                    {plural(s.hardPending, 'hard topic')} pending
                  </span>
                )}
                {s.untouched > 0 && <span>{s.untouched} not started</span>}
              </div>
            </Card>
          ))}
        </div>
      </Reveal>
    </>
  );
}
