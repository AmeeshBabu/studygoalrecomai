import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import {
  ArrowRightIcon,
  ArrowsCounterClockwiseIcon,
  CalendarXIcon,
  CaretDownIcon,
  CheckCircleIcon,
  ClockIcon,
  CompassIcon,
  FlameIcon,
  GaugeIcon,
  LightbulbIcon,
  MountainsIcon,
  PlusIcon,
  SparkleIcon,
  TargetIcon,
  TrendDownIcon,
  TrendUpIcon,
  WarningIcon,
} from '@phosphor-icons/react';

import { PageHeader } from '../components/layout/PageHeader.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Card, Panel, SectionHeading } from '../components/ui/Card.jsx';
import { Badge, PriorityTag, SubjectMark } from '../components/ui/Badge.jsx';
import { EmptyState } from '../components/ui/States.jsx';
import { Reveal, Stagger, StaggerItem, EXPO } from '../components/ui/Motion.jsx';
import { useApp } from '../store/AppProvider.jsx';
import { WEIGHTS } from '../engine/scoring.js';
import { formatMinutes } from '../lib/date.js';
import { cn } from '../lib/utils.js';

/** The engine emits icon *names*; the page owns the mapping to real glyphs. */
const ICONS = {
  compass: CompassIcon,
  clock: ClockIcon,
  warning: WarningIcon,
  trend: TrendUpIcon,
  gauge: GaugeIcon,
  target: TargetIcon,
  mountain: MountainsIcon,
  repeat: ArrowsCounterClockwiseIcon,
  flame: FlameIcon,
  calendarX: CalendarXIcon,
  trendDown: TrendDownIcon,
  check: CheckCircleIcon,
};

const TONES = {
  critical: {
    badge: 'high',
    icon: 'text-high-700 dark:text-high-500',
    wash: 'bg-high-50 dark:bg-high-900/25',
    label: 'Needs attention',
  },
  warn: {
    badge: 'mid',
    icon: 'text-mid-700 dark:text-mid-500',
    wash: 'bg-mid-50 dark:bg-mid-900/25',
    label: 'Worth a look',
  },
  positive: {
    badge: 'low',
    icon: 'text-low-700 dark:text-low-500',
    wash: 'bg-low-50 dark:bg-low-900/25',
    label: 'Going well',
  },
  info: {
    badge: 'neutral',
    icon: 'text-accent',
    wash: 'bg-accent-soft',
    label: 'For information',
  },
};

/** Plain-English names for the six scoring factors. */
const FACTORS = {
  importance: { label: 'Exam weight', note: 'How much the subject is worth' },
  difficulty: { label: 'Difficulty', note: 'Topic rating, blended with its subject' },
  urgency: { label: 'Exam proximity', note: 'Climbs sharply in the final fortnight' },
  backlog: { label: 'Subject backlog', note: 'Share of all remaining work' },
  staleness: { label: 'Deferred before', note: 'Missed days push a topic up' },
  neglect: { label: 'Barely started', note: 'Stops a subject being orphaned' },
};

export default function Insights() {
  const { subjects, insights, ranking, verdict, actions } = useApp();

  if (!subjects.length) {
    return (
      <>
        <PageHeader
          title="Study insights"
          description="What the planner has noticed, and why it ranks what it ranks."
        />
        <Panel>
          <EmptyState
            icon={LightbulbIcon}
            title="No insights yet"
            description="Insights are generated from your syllabus and your study history. Once there is a subject to plan around, this page explains every decision the engine makes."
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
        title="Study insights"
        description="What the planner has noticed, and the arithmetic behind every recommendation."
      />

      {/* ── The one-line read on where you stand ─────────────────────────── */}
      <Reveal>
        <Panel className="p-6 sm:p-7">
          <div className="flex items-start gap-4">
            <span
              className={cn(
                'grid size-10 shrink-0 place-items-center rounded-full',
                TONES[verdict.tone]?.wash ?? TONES.info.wash,
              )}
            >
              <SparkleIcon
                size={19}
                weight="fill"
                className={TONES[verdict.tone]?.icon ?? TONES.info.icon}
              />
            </span>
            <div className="min-w-0">
              <p className="text-[11px] font-medium tracking-[0.08em] text-ink-faint uppercase">
                Where you stand
              </p>
              <p className="mt-2 font-display text-[19px] leading-snug font-medium tracking-[-0.02em] text-ink sm:text-[22px]">
                {verdict.text}
              </p>
            </div>
          </div>
        </Panel>
      </Reveal>

      {/* ── Generated insights ───────────────────────────────────────────── */}
      <div className="mt-8">
        <SectionHeading
          title="What the planner noticed"
          description="Regenerated from your syllabus and history every time this page loads."
        />
        {insights.length ? (
          <Stagger className="mt-5 grid gap-4 md:grid-cols-2">
            {insights.map((insight) => (
              <StaggerItem key={insight.id}>
                <InsightCard insight={insight} />
              </StaggerItem>
            ))}
          </Stagger>
        ) : (
          <Card className="mt-5">
            <EmptyState
              compact
              icon={CheckCircleIcon}
              title="Nothing to flag"
              description="No risks, gaps or slipping subjects right now. Keep going."
            />
          </Card>
        )}
      </div>

      {/* ── Explainability: the actual score, broken open ─────────────────── */}
      <div className="mt-10">
        <SectionHeading
          title="Why these topics rank first"
          description="Every score is six weighted factors, each normalised to 0-1. Open a topic to see its arithmetic."
          action={
            <Button as={Link} to="/app/today" variant="ghost" size="sm" iconRight={ArrowRightIcon}>
              Today's plan
            </Button>
          }
        />

        {ranking.ranked.length ? (
          <ul className="mt-5 flex flex-col gap-3">
            {ranking.ranked.slice(0, 6).map((item, i) => (
              <RankedTopic key={item.topicId} item={item} index={i} />
            ))}
          </ul>
        ) : (
          <Card className="mt-5">
            <EmptyState
              compact
              icon={CheckCircleIcon}
              title="Every topic is complete"
              description="There is nothing left to rank. From here the planner only schedules revision."
              action={
                <Button as={Link} to="/app/revision" size="sm" variant="secondary">
                  Open revision planner
                </Button>
              }
            />
          </Card>
        )}
      </div>

      {/* ── The model itself ─────────────────────────────────────────────── */}
      <Reveal delay={0.05} className="mt-10">
        <Card className="p-5 sm:p-6">
          <SectionHeading
            level={2}
            title="The scoring model"
            description="Fixed weights, summing to exactly 1.0, so a score reads directly as a percentage of maximum urgency."
          />
          <div className="mt-5 grid gap-x-8 gap-y-4 sm:grid-cols-2">
            {Object.entries(WEIGHTS).map(([key, weight]) => (
              <div key={key}>
                <div className="flex items-baseline justify-between gap-3">
                  <span className="text-[13.5px] font-medium text-ink">{FACTORS[key].label}</span>
                  <span className="font-mono text-[12.5px] text-ink-soft tabular-nums">
                    {Math.round(weight * 100)}%
                  </span>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-raised">
                  <motion.div
                    initial={{ scaleX: 0 }}
                    whileInView={{ scaleX: weight / 0.26 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.7, ease: EXPO }}
                    style={{ transformOrigin: 'left' }}
                    className="h-full rounded-full bg-accent"
                  />
                </div>
                <p className="mt-1.5 text-[11.5px] text-ink-muted">{FACTORS[key].note}</p>
              </div>
            ))}
          </div>
          <p className="mt-6 border-t border-line pt-4 text-[12.5px] leading-relaxed text-ink-muted">
            Bars are drawn relative to the largest weight so the smaller factors stay legible. The
            weights themselves are the percentages on the right.
          </p>
        </Card>
      </Reveal>
    </>
  );
}

/* ────────────────────────────── insight card ───────────────────────────── */

function InsightCard({ insight }) {
  const tone = TONES[insight.tone] ?? TONES.info;
  const Icon = ICONS[insight.icon] ?? LightbulbIcon;

  return (
    <Card className="flex h-full flex-col p-5">
      <div className="flex items-start gap-3.5">
        <span className={cn('grid size-9 shrink-0 place-items-center rounded-full', tone.wash)}>
          <Icon size={17} weight="bold" className={tone.icon} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-[14.5px] leading-snug font-medium text-ink">{insight.title}</h3>
            {insight.metric && <Badge tone={tone.badge}>{insight.metric}</Badge>}
          </div>
          <p className="mt-2 text-[13px] leading-relaxed text-ink-muted">{insight.body}</p>
        </div>
      </div>

      {insight.action && (
        <div className="mt-auto pt-4">
          <Button
            as={Link}
            to={insight.action.to}
            variant="ghost"
            size="sm"
            className="-ml-3"
            iconRight={ArrowRightIcon}
          >
            {insight.action.label}
          </Button>
        </div>
      )}
    </Card>
  );
}

/* ───────────────────────── ranked topic, openable ──────────────────────── */

function RankedTopic({ item, index }) {
  const [open, setOpen] = useState(index === 0);

  /* Contributions are shares of this topic's own score, so they sum to 1. */
  const total = Object.values(item.contributions).reduce((a, b) => a + b, 0) || 1;
  const parts = Object.entries(item.contributions)
    .map(([key, value]) => ({ key, value, share: value / total }))
    .sort((a, b) => b.value - a.value);

  return (
    <motion.li
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: Math.min(index * 0.05, 0.3), ease: EXPO }}
      className="overflow-hidden rounded-card border border-line bg-surface"
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center gap-3.5 p-4 text-left transition-colors hover:bg-raised/60"
      >
        <span className="grid size-7 shrink-0 place-items-center rounded-full bg-raised font-mono text-[12px] font-medium text-ink-soft tabular-nums">
          {index + 1}
        </span>
        {/* The subject mark repeats what the subtitle says; on phones that
            duplication costs the topic name the width it needs. */}
        <span className="hidden shrink-0 sm:block">
          <SubjectMark name={item.subject?.name} size="sm" />
        </span>

        <div className="min-w-0 flex-1">
          <p className="line-clamp-2 text-[14px] leading-snug font-medium text-ink">
            {item.topic.name}
          </p>
          <p className="mt-0.5 truncate text-[11.5px] text-ink-muted">
            {item.subject?.name} · {formatMinutes(item.minutesLeft)} left
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2.5">
          <PriorityTag priority={item.band} score={item.score} showScore />
          <motion.span
            animate={{ rotate: open ? 180 : 0 }}
            transition={{ duration: 0.2 }}
            className="grid place-items-center text-ink-faint"
          >
            <CaretDownIcon size={13} weight="bold" />
          </motion.span>
        </div>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: EXPO }}
            className="overflow-hidden"
          >
            <div className="border-t border-line px-4 pt-4 pb-5">
              <p className="text-[11px] font-medium tracking-[0.08em] text-ink-faint uppercase">
                Score breakdown
              </p>

              {/* One hue throughout: these are nominal factors, and length
                  already carries the magnitude. */}
              <div className="mt-3.5 flex flex-col gap-2.5">
                {parts.map((part) => (
                  <div key={part.key} className="grid grid-cols-[132px_minmax(0,1fr)_44px] items-center gap-3">
                    <span className="truncate text-[12.5px] text-ink-soft">
                      {FACTORS[part.key].label}
                    </span>
                    <span className="h-1.5 overflow-hidden rounded-full bg-raised">
                      <motion.span
                        initial={{ scaleX: 0 }}
                        animate={{ scaleX: Math.max(part.share, 0.005) }}
                        transition={{ duration: 0.6, ease: EXPO }}
                        style={{ transformOrigin: 'left' }}
                        className={cn(
                          'block h-full rounded-full',
                          part.value > 0 ? 'bg-accent' : 'bg-line-strong',
                        )}
                      />
                    </span>
                    <span className="text-right font-mono text-[11.5px] text-ink-muted tabular-nums">
                      {Math.round(part.share * 100)}%
                    </span>
                  </div>
                ))}
              </div>

              {item.reasons.length > 0 && (
                <ul className="mt-5 flex flex-col gap-1.5 border-t border-line pt-4">
                  {item.reasons.map((reason) => (
                    <li
                      key={reason}
                      className="flex items-start gap-2 text-[12.5px] leading-snug text-ink-soft"
                    >
                      <span aria-hidden className="mt-[6px] h-px w-2.5 shrink-0 bg-line-strong" />
                      {reason}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.li>
  );
}
