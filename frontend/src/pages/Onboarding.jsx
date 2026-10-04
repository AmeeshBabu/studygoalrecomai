import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import {
  ArrowRightIcon,
  ArrowLeftIcon,
  CheckIcon,
  StackIcon,
  PlusIcon,
} from '@phosphor-icons/react';

import { Logo } from '../components/brand/Logo.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Field, Input, Stepper } from '../components/ui/Field.jsx';
import { Slider, Switch } from '../components/ui/Controls.jsx';
import { EXPO } from '../components/ui/Motion.jsx';
import { useApp } from '../store/AppProvider.jsx';
import { todayKey, addDays, daysBetween, WEEKDAY_LABELS, formatMinutes } from '../lib/date.js';
import { cn } from '../lib/utils.js';

const STEPS = [
  { title: 'Who is studying', blurb: 'So the plan can address you by name.' },
  { title: 'How much time you have', blurb: 'The two numbers every recommendation depends on.' },
  { title: 'Where to start', blurb: 'Begin from a sample syllabus or a blank one.' },
];

export default function Onboarding() {
  const { profile, actions } = useApp();
  const navigate = useNavigate();

  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [errors, setErrors] = useState({});
  const [start, setStart] = useState('sample');
  const [varies, setVaries] = useState(Object.keys(profile.weekdayHours || {}).length > 0);

  const [form, setForm] = useState({
    name: profile.name || '',
    examName: profile.examName || '',
    examDate: profile.examDate || addDays(todayKey(), 45),
    dailyHours: profile.dailyHours || 4,
    weekdayHours: profile.weekdayHours || {},
  });

  const patch = (p) => setForm((f) => ({ ...f, ...p }));

  function validate(index) {
    const next = {};
    if (index === 0) {
      if (!form.name.trim()) next.name = 'Enter your name';
    }
    if (index === 1) {
      if (!form.examDate) next.examDate = 'Pick your exam date';
      else if (daysBetween(todayKey(), form.examDate) < 0)
        next.examDate = 'That date has already passed';
      if (!form.dailyHours || form.dailyHours <= 0) next.dailyHours = 'Give yourself at least half an hour';
    }
    return next;
  }

  function go(delta) {
    if (delta > 0) {
      const found = validate(step);
      setErrors(found);
      if (Object.keys(found).length) return;
    }
    setDirection(delta);
    setStep((s) => Math.min(STEPS.length - 1, Math.max(0, s + delta)));
  }

  function finish() {
    actions.completeOnboarding({
      name: form.name.trim(),
      examName: form.examName.trim(),
      examDate: form.examDate,
      dailyHours: Number(form.dailyHours),
      weekdayHours: varies ? form.weekdayHours : {},
    });
    if (start === 'sample') actions.loadSample();
    navigate('/app');
  }

  const daysLeft = form.examDate ? daysBetween(todayKey(), form.examDate) : null;

  return (
    <div className="min-h-dvh bg-paper">
      <header className="mx-auto flex w-full max-w-[720px] items-center justify-between px-5 py-6 sm:px-8">
        <Link to="/" aria-label="Cadence home">
          <Logo />
        </Link>
        <span className="font-mono text-[12px] text-ink-faint">
          Step {step + 1} of {STEPS.length}
        </span>
      </header>

      {/* Progress rail. Segments rather than a single bar, so the shape of the
          flow is visible before you are in it. */}
      <div className="mx-auto flex w-full max-w-[720px] gap-1.5 px-5 sm:px-8">
        {STEPS.map((s, i) => (
          <div key={s.title} className="h-1 flex-1 overflow-hidden rounded-full bg-raised">
            <motion.div
              className="h-full rounded-full bg-accent"
              initial={false}
              animate={{ width: i <= step ? '100%' : '0%' }}
              transition={{ duration: 0.45, ease: EXPO }}
            />
          </div>
        ))}
      </div>

      <main className="mx-auto w-full max-w-[720px] px-5 py-10 sm:px-8 sm:py-14">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={step}
            custom={direction}
            initial={{ opacity: 0, x: direction * 28 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: direction * -28 }}
            transition={{ duration: 0.35, ease: EXPO }}
          >
            <h1 className="text-display text-[30px] font-semibold text-ink sm:text-[36px]">
              {STEPS[step].title}
            </h1>
            <p className="mt-2 text-[14.5px] leading-relaxed text-ink-muted">{STEPS[step].blurb}</p>

            <div className="mt-9">
              {step === 0 && (
                <div className="flex flex-col gap-5">
                  <Field label="Your name" htmlFor="ob-name" error={errors.name} required>
                    <Input
                      id="ob-name"
                      value={form.name}
                      onChange={(e) => patch({ name: e.target.value })}
                      invalid={!!errors.name}
                      placeholder="Ameesh Kumar"
                      autoFocus
                    />
                  </Field>
                  <Field
                    label="What are you preparing for"
                    htmlFor="ob-exam"
                    hint="Optional. Shown on your dashboard and in the countdown."
                  >
                    <Input
                      id="ob-exam"
                      value={form.examName}
                      onChange={(e) => patch({ examName: e.target.value })}
                      placeholder="End semester examinations"
                    />
                  </Field>
                </div>
              )}

              {step === 1 && (
                <div className="flex flex-col gap-7">
                  <Field
                    label="Exam date"
                    htmlFor="ob-date"
                    error={errors.examDate}
                    hint={
                      daysLeft != null && daysLeft >= 0
                        ? `${daysLeft} days of preparation from today.`
                        : undefined
                    }
                    required
                  >
                    <Input
                      id="ob-date"
                      type="date"
                      min={todayKey()}
                      value={form.examDate}
                      onChange={(e) => patch({ examDate: e.target.value })}
                      invalid={!!errors.examDate}
                    />
                  </Field>

                  <div className="rounded-card border border-line bg-surface p-5">
                    <Slider
                      label="Hours you can study per day"
                      value={form.dailyHours}
                      onChange={(v) => patch({ dailyHours: v })}
                      min={0.5}
                      max={12}
                      step={0.5}
                      format={(v) => formatMinutes(v * 60)}
                    />
                    <p className="mt-3 text-[12.5px] leading-relaxed text-ink-faint">
                      Be honest rather than ambitious. The planner uses this to decide how much fits
                      in a day, and an inflated number just produces a plan you cannot keep.
                    </p>
                  </div>

                  <div className="rounded-card border border-line bg-surface p-5">
                    <Switch
                      label="My hours vary by weekday"
                      hint="Set a different budget for the days you have classes or work."
                      checked={varies}
                      onChange={setVaries}
                    />
                    <AnimatePresence initial={false}>
                      {varies && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3, ease: EXPO }}
                          className="overflow-hidden"
                        >
                          <div className="mt-5 grid grid-cols-2 gap-3 border-t border-line pt-5 sm:grid-cols-4">
                            {WEEKDAY_LABELS.map((label, i) => (
                              <div key={label}>
                                <p className="mb-1.5 text-[12px] font-medium text-ink-muted">
                                  {label}
                                </p>
                                <Stepper
                                  value={form.weekdayHours[i] ?? form.dailyHours}
                                  onChange={(v) =>
                                    patch({ weekdayHours: { ...form.weekdayHours, [i]: v } })
                                  }
                                  min={0}
                                  max={16}
                                  step={0.5}
                                  suffix="h"
                                />
                              </div>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <StartOption
                    active={start === 'sample'}
                    onSelect={() => setStart('sample')}
                    icon={StackIcon}
                    title="Use a sample syllabus"
                    body="Six computer science subjects with around forty topics, plus two weeks of study history so every chart has something real in it."
                  />
                  <StartOption
                    active={start === 'blank'}
                    onSelect={() => setStart('blank')}
                    icon={PlusIcon}
                    title="Start from scratch"
                    body="An empty syllabus. You add your own subjects and topics, and the planner starts ranking as soon as the first one is in."
                  />
                </div>
              )}
            </div>

            <div className="mt-10 flex items-center justify-between gap-3">
              <Button
                variant="ghost"
                icon={ArrowLeftIcon}
                onClick={() => go(-1)}
                className={cn(step === 0 && 'invisible')}
              >
                Back
              </Button>

              {step < STEPS.length - 1 ? (
                <Button size="lg" iconRight={ArrowRightIcon} onClick={() => go(1)}>
                  Continue
                </Button>
              ) : (
                <Button size="lg" iconRight={CheckIcon} onClick={finish}>
                  Start planning
                </Button>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}

function StartOption({ active, onSelect, icon: Icon, title, body }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={active}
      className={cn(
        'rounded-card border p-5 text-left transition-[border-color,background-color,transform] duration-200',
        'hover:-translate-y-0.5',
        active ? 'border-accent bg-accent-soft' : 'border-line bg-surface hover:border-line-strong',
      )}
    >
      <span className="flex items-center justify-between">
        <Icon size={20} weight="duotone" className={active ? 'text-accent' : 'text-ink-faint'} />
        <span
          className={cn(
            'grid size-5 place-items-center rounded-full border transition-colors',
            active ? 'border-transparent bg-accent text-accent-ink' : 'border-line-strong',
          )}
        >
          {active && <CheckIcon size={12} weight="bold" />}
        </span>
      </span>
      <span className="mt-4 block font-display text-[15px] font-semibold text-ink">{title}</span>
      <span className="mt-1.5 block text-[13px] leading-relaxed text-ink-muted">{body}</span>
    </button>
  );
}
