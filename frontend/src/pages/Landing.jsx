import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'motion/react';
import {
  ArrowRightIcon,
  BrainIcon,
  CalendarCheckIcon,
  ChartLineUpIcon,
  ShuffleIcon,
  ArrowsCounterClockwiseIcon,
  CheckIcon,
  ClockIcon,
} from '@phosphor-icons/react';

import { Logo } from '../components/brand/Logo.jsx';
import { Button } from '../components/ui/Button.jsx';
import { PriorityTag } from '../components/ui/Badge.jsx';
import { ProgressBar } from '../components/ui/Progress.jsx';
import { Reveal, EXPO } from '../components/ui/Motion.jsx';
import { WEIGHTS } from '../engine/scoring.js';
import { cn } from '../lib/utils.js';

/* Illustrative only. The real plan on /app/today is computed from the syllabus.
   Titles are kept short enough to survive the card's fixed width. */
const PREVIEW_TASKS = [
  { title: 'Normalisation up to BCNF', subject: 'DBMS', minutes: 55, priority: 'high' },
  { title: 'Deadlock detection and recovery', subject: 'Operating Systems', minutes: 45, priority: 'high' },
  { title: 'A* search and heuristics', subject: 'Artificial Intelligence', minutes: 40, priority: 'medium' },
  { title: 'Quick revision: TCP congestion', subject: 'Computer Networks', minutes: 20, priority: 'low' },
];

const FEATURES = [
  {
    icon: BrainIcon,
    title: 'Goals ranked, not guessed',
    body: 'Six weighted signals decide what you study next, and every recommendation shows the reasoning behind it.',
  },
  {
    /* Not a clockwise-arrows glyph: it reads as a near-duplicate of the
       revision icon two cells away. */
    icon: ShuffleIcon,
    title: 'A plan that survives a bad day',
    body: 'Miss a session and the schedule rebuilds itself. Skipped topics climb the ranking instead of quietly vanishing.',
  },
  {
    icon: ArrowsCounterClockwiseIcon,
    title: 'Revision on a spacing ladder',
    body: 'Finished topics come back at widening intervals, compressed automatically as the exam gets close.',
  },
  {
    icon: ChartLineUpIcon,
    title: 'An honest progress picture',
    body: 'Capacity forecasting tells you whether the hours you have left can actually cover the syllabus you have left.',
  },
];

const STEPS = [
  {
    n: '01',
    title: 'Add your syllabus',
    body: 'Enter subjects with their exam weight, then break each one into topics with a difficulty and a rough time estimate.',
  },
  {
    n: '02',
    title: 'Set the constraints',
    body: 'Your exam date and how many hours a day you can realistically give. Per-weekday budgets if your timetable varies.',
  },
  {
    n: '03',
    title: 'Study the day you are given',
    body: 'Open the app and the day is already planned, time-boxed, and ordered. Tick things off as you finish them.',
  },
];

const FACTOR_COPY = {
  importance: 'How much the subject is worth in the exam',
  difficulty: 'How hard the topic is, blended with its subject',
  urgency: 'How close the exam is, weighted toward the final fortnight',
  backlog: 'How much of that subject is still untouched',
  staleness: 'How often the topic has already been pushed back',
  neglect: 'How little of the subject you have completed so far',
};

function NavBar() {
  return (
    <header className="sticky top-0 z-40 border-b border-line/70 bg-paper/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 w-full max-w-[1180px] items-center justify-between gap-6 px-5 sm:px-8">
        <Link to="/" aria-label="Cadence home">
          <Logo />
        </Link>
        <nav className="hidden items-center gap-7 md:flex">
          <a href="#features" className="text-[13.5px] font-medium text-ink-muted transition-colors hover:text-ink">
            Features
          </a>
          <a href="#how" className="text-[13.5px] font-medium text-ink-muted transition-colors hover:text-ink">
            How it works
          </a>
          <a href="#engine" className="text-[13.5px] font-medium text-ink-muted transition-colors hover:text-ink">
            The engine
          </a>
        </nav>
        <div className="flex items-center gap-2">
          <Button as={Link} to="/signin" variant="ghost" size="sm" className="hidden sm:inline-flex">
            Sign in
          </Button>
          <Button as={Link} to="/onboarding" size="sm" iconRight={ArrowRightIcon}>
            Get started
          </Button>
        </div>
      </div>
    </header>
  );
}

/** Built from the product's own components, so it is a real preview. */
function PlanPreview() {
  const reduce = useReducedMotion();
  const total = PREVIEW_TASKS.reduce((a, t) => a + t.minutes, 0);

  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.75, delay: 0.15, ease: EXPO }}
      className="rounded-panel border border-line bg-surface p-5 shadow-lift sm:p-6"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-display text-[15px] font-semibold tracking-[-0.01em] text-ink">
            Tuesday, 14 October
          </p>
          <p className="mt-0.5 text-[12.5px] text-ink-muted">4 topics queued for today</p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-raised px-2.5 py-1 font-mono text-[11.5px] font-medium text-ink-soft">
          <ClockIcon size={13} weight="bold" />
          2h 40m
        </span>
      </div>

      <div className="mt-5 flex flex-col gap-2">
        {PREVIEW_TASKS.map((task, i) => (
          <motion.div
            key={task.title}
            initial={reduce ? false : { opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.35 + i * 0.09, ease: EXPO }}
            className="flex items-center gap-3 rounded-card border border-line bg-raised px-3.5 py-3"
          >
            <span
              className={cn(
                'grid size-5 shrink-0 place-items-center rounded-full border transition-colors',
                i === 0 ? 'border-transparent bg-accent text-accent-ink' : 'border-line-strong',
              )}
            >
              {i === 0 && <CheckIcon size={12} weight="bold" />}
            </span>
            <span className="min-w-0 flex-1">
              <span
                className={cn(
                  'block truncate text-[13.5px] font-medium',
                  i === 0 ? 'text-ink-faint line-through' : 'text-ink',
                )}
              >
                {task.title}
              </span>
              <span className="block truncate text-[11.5px] text-ink-muted">{task.subject}</span>
            </span>
            <PriorityTag priority={task.priority} className="hidden sm:inline-flex" />
            <span className="shrink-0 font-mono text-[12px] text-ink-muted">{task.minutes}m</span>
          </motion.div>
        ))}
      </div>

      <div className="mt-5 border-t border-line pt-4">
        <ProgressBar
          value={55}
          max={total}
          label="Today's progress"
          showValue
          size="sm"
        />
      </div>
    </motion.div>
  );
}

export default function Landing() {
  const reduce = useReducedMotion();
  const weightEntries = Object.entries(WEIGHTS).sort((a, b) => b[1] - a[1]);
  const topWeight = weightEntries[0][1];

  return (
    <div className="min-h-dvh bg-paper">
      <NavBar />

      {/* ───────────────────────────── hero ───────────────────────────── */}
      <section className="relative overflow-hidden">
        <div className="bg-grid mask-fade-b pointer-events-none absolute inset-0 opacity-[0.55]" />
        <div className="relative mx-auto grid w-full max-w-[1180px] grid-cols-1 items-center gap-12 px-5 pt-14 pb-20 sm:px-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] lg:gap-16 lg:pt-20 lg:pb-28">
          <div>
            <motion.h1
              initial={reduce ? false : { opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: EXPO }}
              className="text-display text-[42px] font-semibold text-ink sm:text-[56px] lg:text-[62px]"
            >
              Study smarter.
              <br />
              Reach your goals.
            </motion.h1>

            <motion.p
              initial={reduce ? false : { opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1, ease: EXPO }}
              className="mt-5 max-w-[54ch] text-[16px] leading-relaxed text-ink-muted sm:text-[17px]"
            >
              An AI-powered personalized study planner that helps you organize your syllabus,
              achieve daily goals, and prepare effectively for exams.
            </motion.p>

            <motion.div
              initial={reduce ? false : { opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.18, ease: EXPO }}
              className="mt-8 flex flex-wrap items-center gap-3"
            >
              <Button as={Link} to="/onboarding" size="lg" iconRight={ArrowRightIcon}>
                Get started
              </Button>
              <Button as={Link} to="/signin" size="lg" variant="secondary">
                I already have a plan
              </Button>
            </motion.div>

            <motion.ul
              initial={reduce ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.7, delay: 0.3 }}
              className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-[12.5px] text-ink-faint"
            >
              <li className="flex items-center gap-1.5">
                <CheckIcon size={13} weight="bold" className="text-accent" />
                Runs entirely on your machine
              </li>
              <li className="flex items-center gap-1.5">
                <CheckIcon size={13} weight="bold" className="text-accent" />
                No account required to try it
              </li>
            </motion.ul>
          </div>

          <PlanPreview />
        </div>
      </section>

      {/* ─────────────────────────── features ─────────────────────────── */}
      <section id="features" className="mx-auto w-full max-w-[1180px] px-5 py-16 sm:px-8 lg:py-24">
        <Reveal>
          <h2 className="text-display max-w-[20ch] text-[30px] font-semibold text-ink sm:text-[38px]">
            Most planners hand you a timetable. This one keeps thinking.
          </h2>
        </Reveal>

        {/* Hairline grid rather than four floating cards. */}
        <div className="mt-12 grid border-t border-line sm:grid-cols-2">
          {FEATURES.map((f, i) => (
            <Reveal
              key={f.title}
              delay={i * 0.07}
              className={cn(
                'border-b border-line px-1 py-8 sm:px-8',
                i % 2 === 0 && 'sm:border-r sm:pl-0',
              )}
            >
              <f.icon size={22} weight="duotone" className="text-accent" />
              <h3 className="mt-4 font-display text-[17px] font-semibold tracking-[-0.015em] text-ink">
                {f.title}
              </h3>
              <p className="mt-2 max-w-[46ch] text-[14px] leading-relaxed text-ink-muted">{f.body}</p>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ─────────────────────── how it works ─────────────────────────── */}
      <section id="how" className="border-y border-line bg-surface">
        <div className="mx-auto w-full max-w-[1180px] px-5 py-16 sm:px-8 lg:py-24">
          <Reveal>
            <h2 className="text-display text-[30px] font-semibold text-ink sm:text-[38px]">
              Three steps to a working plan
            </h2>
          </Reveal>

          <div className="mt-12 grid gap-10 md:grid-cols-3 md:gap-8">
            {STEPS.map((s, i) => (
              <Reveal key={s.n} delay={i * 0.09} className="relative">
                <span className="font-mono text-[12px] font-semibold tracking-[0.1em] text-accent">
                  {s.n}
                </span>
                <div className="mt-3 h-px w-full bg-line" />
                <h3 className="mt-4 font-display text-[18px] font-semibold tracking-[-0.015em] text-ink">
                  {s.title}
                </h3>
                <p className="mt-2 text-[14px] leading-relaxed text-ink-muted">{s.body}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ───────────────────────── the engine ─────────────────────────── */}
      <section id="engine" className="mx-auto w-full max-w-[1180px] px-5 py-16 sm:px-8 lg:py-24">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:gap-20">
          <Reveal>
            <p className="text-eyebrow text-ink-faint">Inside the recommendation</p>
            <h2 className="text-display mt-4 text-[30px] font-semibold text-ink sm:text-[38px]">
              Nothing here is random
            </h2>
            <p className="mt-5 max-w-[50ch] text-[15px] leading-relaxed text-ink-muted">
              Every pending topic gets a priority score out of 100. Six factors feed it, each with a
              fixed weight, and the weights add up to exactly one so the score reads as a share of
              maximum urgency.
            </p>
            <p className="mt-4 max-w-[50ch] text-[15px] leading-relaxed text-ink-muted">
              Because the weights are fixed and visible, you can always ask why a topic surfaced
              today, and the app will tell you in plain words instead of pointing at a black box.
            </p>
            <Button as={Link} to="/onboarding" className="mt-8" iconRight={ArrowRightIcon}>
              Build my plan
            </Button>
          </Reveal>

          <Reveal delay={0.1}>
            <div className="rounded-panel border border-line bg-surface p-6 sm:p-7">
              <h3 className="font-display text-[15px] font-semibold text-ink">
                Scoring weights
              </h3>
              <p className="mt-1 text-[12.5px] text-ink-muted">
                The live values the planner uses, read straight from the engine.
              </p>

              <ul className="mt-6 flex flex-col gap-5">
                {weightEntries.map(([key, weight], i) => (
                  <li key={key}>
                    <div className="flex items-baseline justify-between gap-4">
                      <span className="text-[13.5px] font-medium text-ink capitalize">{key}</span>
                      <span className="font-mono text-[12.5px] text-ink-muted tabular-nums">
                        {Math.round(weight * 100)}%
                      </span>
                    </div>
                    <div className="mt-2 h-2 w-full rounded-[4px] bg-raised">
                      <motion.div
                        className="h-full rounded-r-[4px] bg-accent"
                        initial={reduce ? false : { width: 0 }}
                        whileInView={{ width: `${(weight / topWeight) * 100}%` }}
                        viewport={{ once: true, margin: '-40px' }}
                        transition={{ duration: 0.8, delay: i * 0.06, ease: EXPO }}
                      />
                    </div>
                    <p className="mt-1.5 text-[12px] leading-snug text-ink-faint">
                      {FACTOR_COPY[key]}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ──────────────────────────── cta ─────────────────────────────── */}
      <section className="border-t border-line bg-surface">
        <div className="mx-auto w-full max-w-[1180px] px-5 py-20 text-center sm:px-8">
          <Reveal>
            <CalendarCheckIcon size={30} weight="duotone" className="mx-auto text-accent" />
            <h2 className="text-display mx-auto mt-6 max-w-[18ch] text-[32px] font-semibold text-ink sm:text-[42px]">
              Your syllabus is finite. Your time is too.
            </h2>
            <p className="mx-auto mt-4 max-w-[50ch] text-[15px] leading-relaxed text-ink-muted">
              Put both into the planner and find out, today, whether the two actually meet.
            </p>
            <Button as={Link} to="/onboarding" size="lg" className="mt-8" iconRight={ArrowRightIcon}>
              Get started
            </Button>
          </Reveal>
        </div>
      </section>

      <footer className="border-t border-line">
        <div className="mx-auto flex w-full max-w-[1180px] flex-col items-center justify-between gap-4 px-5 py-8 sm:flex-row sm:px-8">
          <Logo size={22} />
          <p className="text-[12.5px] text-ink-faint">
            Built as a final-year project. Runs locally, no paid services.
          </p>
        </div>
      </footer>
    </div>
  );
}
