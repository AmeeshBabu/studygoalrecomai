import { Link } from 'react-router-dom';
import {
  ArrowRightIcon,
  CalendarBlankIcon,
  CheckCircleIcon,
  ClockIcon,
  FlameIcon,
  ListChecksIcon,
  PlusIcon,
  BooksIcon,
  TrendUpIcon,
} from '@phosphor-icons/react';

import { PageHeader } from '../components/layout/PageHeader.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Card, Panel, SectionHeading, Stat } from '../components/ui/Card.jsx';
import { Badge, SubjectMark } from '../components/ui/Badge.jsx';
import { ProgressBar, Ring, SegmentBar } from '../components/ui/Progress.jsx';
import { EmptyState } from '../components/ui/States.jsx';
import { Reveal, Stagger, StaggerItem, AnimatedNumber } from '../components/ui/Motion.jsx';
import { ChartFrame, LegendItem } from '../components/charts/ChartFrame.jsx';
import { BarCompare } from '../components/charts/BarCompare.jsx';
import { Sparkline } from '../components/charts/Sparkline.jsx';
import { TaskRow } from '../components/plan/TaskRow.jsx';
import { useApp } from '../store/AppProvider.jsx';
import {
  addDays,
  formatDay,
  formatHours,
  formatMinutes,
  greeting,
  todayKey,
  weekdayOf,
  WEEKDAY_LABELS,
} from '../lib/date.js';
import { plural } from '../lib/utils.js';

const VERDICT_TONE = { critical: 'high', warn: 'mid', positive: 'low', info: 'neutral' };

export default function Dashboard() {
  const { profile, subjects, topics, dayLogs, todayPlan, stats, bySubject, ranking, verdict, actions } =
    useApp();

  const firstName = (profile.name || 'there').split(' ')[0];
  const budget = todayPlan.budgetMinutes;
  const doneToday = todayPlan.tasks.filter((t) => t.done);
  const doneMinutes = doneToday.reduce((a, t) => a + t.minutes, 0);
  const plannedMinutes = todayPlan.meta.plannedMinutes ?? 0;

  /* Last seven days of logged study, for the trend line. */
  const week = Array.from({ length: 7 }, (_, i) => {
    const key = addDays(todayKey(), -(6 - i));
    const log = dayLogs[key];
    return {
      key,
      value: key === todayKey() ? doneMinutes : (log?.completedMinutes ?? 0),
      label: formatDay(key),
      short: WEEKDAY_LABELS[weekdayOf(key)][0],
    };
  });

  /* One topic per subject. Ranking ties within a subject are common (four
     hard AI topics score identically), and three cards repeating the same
     subject, score and reason look broken rather than confident. The full
     ordering is still on /app/insights. */
  const nextUp = [];
  const seenSubjects = new Set();
  for (const item of ranking.ranked) {
    if (seenSubjects.has(item.subject?.id)) continue;
    seenSubjects.add(item.subject?.id);
    nextUp.push(item);
    if (nextUp.length === 3) break;
  }

  const subjectBars = bySubject.map((s) => ({
    key: s.subject.id,
    label: s.subject.name,
    value: s.completion,
    hint: `${s.doneCount} of ${s.topicCount} topics`,
  }));

  if (!subjects.length) {
    return (
      <>
        <PageHeader
          title={`${greeting()}, ${firstName} 👋`}
          description="Your planner is ready. It needs a syllabus before it can rank anything."
        />
        <Panel>
          <EmptyState
            icon={BooksIcon}
            title="No subjects yet"
            description="Add the subjects you are preparing for, break them into topics, and the engine will start scheduling from the first one."
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
        title={`${greeting()}, ${firstName} 👋`}
        description={verdict.text}
        actions={
          <Button as={Link} to="/app/today" iconRight={ArrowRightIcon}>
            Open today’s plan
          </Button>
        }
      />

      {/* ── Stat strip. Hairline dividers rather than five floating cards. ── */}
      <Reveal>
        <Panel className="grid grid-cols-2 divide-line sm:grid-cols-3 lg:grid-cols-5 lg:divide-x">
          <StatCell>
            <Stat
              icon={CalendarBlankIcon}
              label="Until exam"
              value={<AnimatedNumber value={stats.daysLeft ?? 0} />}
              unit={stats.daysLeft === 1 ? 'day' : 'days'}
              tone={stats.daysLeft != null && stats.daysLeft <= 7 ? 'high' : 'default'}
              hint={profile.examDate ? formatDay(profile.examDate, { weekday: 'short' }) : 'Not set'}
            />
          </StatCell>
          <StatCell>
            <Stat
              icon={CheckCircleIcon}
              label="Syllabus"
              value={<AnimatedNumber value={stats.completion} />}
              unit="%"
              tone="accent"
              hint={`${formatMinutes(stats.doneMinutes)} of ${formatMinutes(stats.totalMinutes)}`}
            />
          </StatCell>
          <StatCell>
            <Stat
              icon={ListChecksIcon}
              label="Topics"
              value={
                <>
                  <AnimatedNumber value={stats.doneCount} />
                  <span className="text-ink-faint">/{stats.topicCount}</span>
                </>
              }
              hint={`${plural(stats.pendingCount, 'topic')} still open`}
            />
          </StatCell>
          <StatCell>
            <Stat
              icon={ClockIcon}
              label="Studied"
              value={formatHours(doneMinutes).replace('h', '')}
              unit="h"
              hint={`of ${formatMinutes(budget)} today`}
            />
          </StatCell>
          {/* Odd one out on a two-column phone grid, so it takes the whole
              row: a half-width rule above it reads as a stray line. */}
          <StatCell className="col-span-2 border-t border-line sm:col-span-1 sm:border-t-0">
            <Stat
              icon={FlameIcon}
              label="Streak"
              value={<AnimatedNumber value={stats.streak} />}
              unit={stats.streak === 1 ? 'day' : 'days'}
              hint={
                stats.consistency != null
                  ? `${stats.consistency}% of days kept`
                  : 'No history yet'
              }
            />
          </StatCell>
        </Panel>
      </Reveal>

      {/* ── Today, and the whole-syllabus picture beside it ───────────────── */}
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.45fr)_minmax(0,1fr)]">
        <Reveal delay={0.05}>
          <Card className="flex h-full flex-col p-5">
            <SectionHeading
              title="Today at a glance"
              description={
                todayPlan.tasks.length
                  ? `${plural(todayPlan.tasks.length, 'task')} queued, ${formatMinutes(
                      plannedMinutes,
                    )} of work.`
                  : 'Nothing scheduled for today.'
              }
              action={
                <Badge tone={VERDICT_TONE[verdict.tone]}>
                  {todayPlan.mode === 'stretch' ? 'Final stretch' : 'Build phase'}
                </Badge>
              }
            />

            {todayPlan.tasks.length ? (
              <>
                <ul className="mt-5 flex flex-col gap-2.5">
                  {todayPlan.tasks.slice(0, 3).map((task, i) => (
                    <TaskRow key={task.id} task={task} index={i} onToggle={actions.toggleTask} />
                  ))}
                </ul>

                <div className="mt-auto pt-5">
                  <ProgressBar
                    value={doneMinutes}
                    max={plannedMinutes || 1}
                    label={`${doneToday.length} of ${todayPlan.tasks.length} done`}
                    showValue
                    size="sm"
                  />
                  {todayPlan.tasks.length > 3 && (
                    <Button
                      as={Link}
                      to="/app/today"
                      variant="ghost"
                      size="sm"
                      className="mt-3 -ml-3"
                      iconRight={ArrowRightIcon}
                    >
                      {plural(todayPlan.tasks.length - 3, 'more task')}
                    </Button>
                  )}
                </div>
              </>
            ) : (
              <EmptyState
                compact
                icon={ListChecksIcon}
                title="Nothing planned for today"
                description={todayPlan.note ?? 'Set your daily hours to have the planner fill the day.'}
                action={
                  <Button as={Link} to="/app/settings" size="sm" variant="secondary">
                    Adjust study hours
                  </Button>
                }
              />
            )}
          </Card>
        </Reveal>

        <Reveal delay={0.1}>
          <Card className="flex h-full flex-col items-center p-5 text-center">
            <SectionHeading title="Overall completion" className="w-full text-left" />
            <Ring value={stats.completion} size={168} stroke={13} className="my-6">
              <div>
                <p className="font-mono text-[34px] leading-none font-semibold tracking-[-0.03em] text-ink">
                  <AnimatedNumber value={stats.completion} />
                  <span className="text-[18px] text-ink-faint">%</span>
                </p>
                <p className="mt-1.5 text-[12px] text-ink-muted">of the syllabus</p>
              </div>
            </Ring>

            <div className="mt-auto w-full">
              <SegmentBar
                className="mb-3"
                segments={[
                  { key: 'done', label: 'Completed', value: stats.doneMinutes, className: 'bg-accent' },
                  {
                    key: 'left',
                    label: 'Remaining',
                    value: stats.remainingMinutes,
                    className: 'bg-accent/20',
                  },
                ]}
              />
              <div className="flex items-center justify-between gap-3">
                <LegendItem
                  swatchClass="bg-accent"
                  label="Done"
                  value={formatMinutes(stats.doneMinutes)}
                />
                <LegendItem
                  swatchClass="bg-accent/20"
                  label="Left"
                  value={formatMinutes(stats.remainingMinutes)}
                />
              </div>
            </div>
          </Card>
        </Reveal>
      </div>

      {/* ── Charts ───────────────────────────────────────────────────────── */}
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Reveal delay={0.05}>
          <ChartFrame
            className="h-full"
            title="Subject completion"
            subtitle="Share of each subject's estimated time already behind you."
            table={{
              columns: ['Subject', 'Done', 'Topics'],
              rows: bySubject.map((s) => [
                s.subject.name,
                `${s.completion}%`,
                `${s.doneCount}/${s.topicCount}`,
              ]),
            }}
          >
            <BarCompare data={subjectBars} emptyLabel="No subjects yet" />
          </ChartFrame>
        </Reveal>

        <Reveal delay={0.1}>
          <ChartFrame
            className="h-full"
            title="This week"
            subtitle="Minutes of the plan you actually completed each day."
            table={{
              columns: ['Day', 'Studied'],
              rows: week.map((d) => [d.label, formatMinutes(d.value)]),
            }}
            legend={
              <LegendItem shape="line" swatchClass="bg-line-strong" label="Daily target" />
            }
          >
            <Sparkline
              data={week}
              target={budget}
              height={160}
              format={(v) => formatMinutes(v)}
            />
          </ChartFrame>
        </Reveal>
      </div>

      {/* ── What the engine wants you on next ────────────────────────────── */}
      <Reveal delay={0.05} className="mt-6">
        <SectionHeading
          title="Next in the ranking"
          description="The highest-scoring pending topic in each of your top subjects."
          action={
            <Button as={Link} to="/app/insights" variant="ghost" size="sm" iconRight={ArrowRightIcon}>
              See why
            </Button>
          }
        />
        <Stagger className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {nextUp.map((item) => (
            <StaggerItem key={item.topicId}>
              <Card interactive as={Link} to="/app/subjects" className="block h-full p-4">
                <div className="flex items-center justify-between gap-3">
                  <SubjectMark name={item.subject?.name} size="sm" />
                  <span className="font-mono text-[12px] font-medium text-accent tabular-nums">
                    {item.score}
                  </span>
                </div>
                <h3 className="mt-3 text-[14px] leading-snug font-medium text-ink">
                  {item.topic.name}
                </h3>
                <p className="mt-1 truncate text-[12px] text-ink-muted">{item.subject?.name}</p>
                <p className="mt-3 border-t border-line pt-3 text-[12px] leading-snug text-ink-faint">
                  {item.reasons[0]}
                </p>
              </Card>
            </StaggerItem>
          ))}
          {!ranking.ranked.length && (
            <Card className="col-span-full p-6">
              <p className="flex items-center justify-center gap-2 text-[13.5px] text-ink-muted">
                <TrendUpIcon size={16} weight="bold" className="text-accent" />
                Every topic is complete. Revision is all that is left.
              </p>
            </Card>
          )}
        </Stagger>
      </Reveal>
    </>
  );
}

function StatCell({ children, className = '' }) {
  return <div className={`p-5 ${className}`}>{children}</div>;
}
