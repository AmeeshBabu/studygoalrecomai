import { useMemo, useState } from 'react';
import {
  ArrowCounterClockwiseIcon,
  CheckIcon,
  DownloadSimpleIcon,
  MoonIcon,
  SignOutIcon,
  SparkleIcon,
  SunIcon,
} from '@phosphor-icons/react';

import { PageHeader } from '../components/layout/PageHeader.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Card, SectionHeading, Stat } from '../components/ui/Card.jsx';
import { Badge } from '../components/ui/Badge.jsx';
import { Field, Input, Stepper } from '../components/ui/Field.jsx';
import { SegmentedControl, Switch } from '../components/ui/Controls.jsx';
import { ConfirmDialog } from '../components/ui/Modal.jsx';
import { Reveal } from '../components/ui/Motion.jsx';
import { useApp } from '../store/AppProvider.jsx';
import { budgetFor } from '../engine/planner.js';
import { daysUntilExam, formatLongDay, formatMinutes, todayKey, WEEKDAY_LABELS } from '../lib/date.js';
import { cn, plural } from '../lib/utils.js';

const THEMES = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'system', label: 'System' },
];

/* Monday-first display order over a Sunday-first index. */
const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0];

export default function Settings() {
  const { profile, account, stats, actions } = useApp();
  const [confirm, setConfirm] = useState(null); // 'reset' | 'sample' | 'signout'
  const [saved, setSaved] = useState(false);

  const daysLeft = daysUntilExam(profile.examDate);

  /* Weekly capacity, straight from the same function the planner uses. */
  const weekMinutes = useMemo(
    () =>
      WEEK_ORDER.reduce((total, dow) => {
        const hours = profile.weekdayHours?.[dow];
        const value = hours == null || hours === '' ? profile.dailyHours : Number(hours);
        return total + Math.round(value * 60);
      }, 0),
    [profile.weekdayHours, profile.dailyHours],
  );

  const patch = (next) => {
    actions.updateProfile(next);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1600);
  };

  const setWeekday = (dow, value) =>
    patch({ weekdayHours: { ...(profile.weekdayHours ?? {}), [dow]: value } });

  const clearWeekday = (dow) => {
    const next = { ...(profile.weekdayHours ?? {}) };
    delete next[dow];
    patch({ weekdayHours: next });
  };

  return (
    <>
      <PageHeader
        title="Settings"
        description="Your exam, your hours, and how the planner behaves."
        meta={
          saved ? (
            <span className="flex items-center gap-1.5 text-[12.5px] text-low-700 dark:text-low-500">
              <CheckIcon size={13} weight="bold" />
              Saved
            </span>
          ) : undefined
        }
      />

      <div className="flex flex-col gap-6">
        {/* ── Exam ───────────────────────────────────────────────────────── */}
        <Reveal>
          <Card className="p-5 sm:p-6">
            <SectionHeading
              level={2}
              title="Your exam"
              description="The date the whole plan counts down to."
              action={
                daysLeft != null ? (
                  <Badge tone={daysLeft <= 7 ? 'high' : 'accent'}>
                    {plural(Math.max(daysLeft, 0), 'day')} left
                  </Badge>
                ) : undefined
              }
            />

            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              <Field label="Your name" htmlFor="set-name">
                <Input
                  id="set-name"
                  value={profile.name ?? ''}
                  onChange={(e) => patch({ name: e.target.value })}
                  placeholder="Ameesh"
                />
              </Field>

              <Field label="Exam name" htmlFor="set-exam">
                <Input
                  id="set-exam"
                  value={profile.examName ?? ''}
                  onChange={(e) => patch({ examName: e.target.value })}
                  placeholder="End Semester Examination"
                />
              </Field>

              <Field
                label="Exam date"
                htmlFor="set-date"
                hint={profile.examDate ? formatLongDay(profile.examDate) : 'Drives every priority score.'}
              >
                <Input
                  id="set-date"
                  type="date"
                  min={todayKey()}
                  value={profile.examDate ?? ''}
                  onChange={(e) => patch({ examDate: e.target.value })}
                />
              </Field>

              <div className="flex items-end">
                <div className="grid w-full grid-cols-2 gap-5 rounded-card border border-line bg-raised px-4 py-3.5">
                  <Stat label="Syllabus done" value={`${stats.completion}%`} tone="accent" />
                  <Stat label="Topics left" value={stats.pendingCount} />
                </div>
              </div>
            </div>
          </Card>
        </Reveal>

        {/* ── Hours ──────────────────────────────────────────────────────── */}
        <Reveal delay={0.05}>
          <Card className="p-5 sm:p-6">
            <SectionHeading
              level={2}
              title="Study hours"
              description="How much time the planner may fill. Set a default, then override the days that differ."
              action={<Badge>{formatMinutes(weekMinutes)} a week</Badge>}
            />

            <div className="mt-5 max-w-xs">
              <Field
                label="Default hours per day"
                htmlFor="set-hours"
                hint="Used for any day without its own override."
              >
                <Stepper
                  id="set-hours"
                  value={profile.dailyHours ?? 4}
                  onChange={(dailyHours) => patch({ dailyHours })}
                  min={0}
                  max={16}
                  step={0.5}
                  suffix="hours"
                />
              </Field>
            </div>

            <div className="mt-6 border-t border-line pt-5">
              <p className="text-[13px] font-medium text-ink">Per-day overrides</p>
              <p className="mt-1 text-[12.5px] text-ink-muted">
                Leave a day on its default, or set 0 to mark it a rest day.
              </p>

              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
                {WEEK_ORDER.map((dow) => {
                  const override = profile.weekdayHours?.[dow];
                  const isSet = override != null && override !== '';
                  const effective = isSet ? Number(override) : (profile.dailyHours ?? 4);
                  const rest = isSet && Number(override) === 0;

                  return (
                    <div
                      key={dow}
                      className={cn(
                        'rounded-input border p-3 transition-colors',
                        rest
                          ? 'border-line bg-raised'
                          : isSet
                            ? 'border-accent/45 bg-accent-soft'
                            : 'border-line bg-surface',
                      )}
                    >
                      <label
                        htmlFor={`wd-${dow}`}
                        className="text-[11.5px] font-medium tracking-[0.04em] text-ink-soft uppercase"
                      >
                        {WEEKDAY_LABELS[dow]}
                      </label>
                      <Input
                        id={`wd-${dow}`}
                        type="number"
                        min={0}
                        max={16}
                        step={0.5}
                        className="mt-2 h-9 px-2.5 text-center text-[13px]"
                        value={isSet ? override : ''}
                        placeholder={String(profile.dailyHours ?? 4)}
                        onChange={(e) =>
                          e.target.value === ''
                            ? clearWeekday(dow)
                            : setWeekday(dow, Number(e.target.value))
                        }
                      />
                      {/* An un-overridden day already shows the default as a
                          placeholder; repeating it as "4h" says it twice. */}
                      <p className="mt-1.5 text-center font-mono text-[11px] text-ink-faint tabular-nums">
                        {rest ? 'Rest' : isSet ? formatMinutes(effective * 60) : 'Default'}
                      </p>
                    </div>
                  );
                })}
              </div>

              <p className="mt-4 text-[12.5px] text-ink-muted">
                Today the planner has{' '}
                <span className="font-medium text-ink">
                  {formatMinutes(budgetFor(profile, todayKey()))}
                </span>{' '}
                to work with.
              </p>
            </div>
          </Card>
        </Reveal>

        {/* ── Appearance ─────────────────────────────────────────────────── */}
        <Reveal delay={0.05}>
          <Card className="p-5 sm:p-6">
            <SectionHeading
              level={2}
              title="Appearance"
              description="Both themes are designed separately rather than inverted, so pick whichever reads better for you."
            />

            <div className="mt-5 flex flex-col gap-5">
              <Field label="Theme">
                <div className="flex items-center gap-3">
                  <SegmentedControl
                    options={THEMES}
                    value={profile.theme ?? 'system'}
                    onChange={(theme) => patch({ theme })}
                  />
                  <span aria-hidden className="text-ink-faint">
                    {profile.theme === 'dark' ? <MoonIcon size={16} /> : <SunIcon size={16} />}
                  </span>
                </div>
              </Field>

              <Switch
                id="set-motion"
                checked={Boolean(profile.reduceMotion)}
                onChange={(reduceMotion) => patch({ reduceMotion })}
                label="Reduce motion"
                hint="Turns off entrance and layout animations. Your system setting is respected either way."
              />
            </div>
          </Card>
        </Reveal>

        {/* ── Data ───────────────────────────────────────────────────────── */}
        <Reveal delay={0.05}>
          <Card className="p-5 sm:p-6">
            <SectionHeading
              level={2}
              title="Data"
              description="Everything is stored in this browser. Nothing leaves your machine."
            />

            <div className="mt-5 flex flex-col divide-y divide-line">
              <SettingRow
                title="Load the sample syllabus"
                description="Five subjects, a full set of topics and two weeks of history. Replaces what is there now."
              >
                <Button
                  variant="secondary"
                  size="sm"
                  icon={SparkleIcon}
                  onClick={() => setConfirm('sample')}
                >
                  Load sample
                </Button>
              </SettingRow>

              <SettingRow
                title="Export your data"
                description="Download the whole planner as a JSON file you can keep or re-import later."
              >
                <Button
                  variant="secondary"
                  size="sm"
                  icon={DownloadSimpleIcon}
                  onClick={() => exportData()}
                >
                  Export
                </Button>
              </SettingRow>

              <SettingRow
                title="Reset everything"
                description="Deletes your syllabus, plans and history. This cannot be undone."
              >
                <Button
                  variant="outlineDanger"
                  size="sm"
                  icon={ArrowCounterClockwiseIcon}
                  onClick={() => setConfirm('reset')}
                >
                  Reset
                </Button>
              </SettingRow>

              {account?.signedIn && (
                <SettingRow
                  title="Sign out"
                  description={`Signed in as ${account.email || account.name}.`}
                >
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={SignOutIcon}
                    onClick={() => setConfirm('signout')}
                  >
                    Sign out
                  </Button>
                </SettingRow>
              )}
            </div>
          </Card>
        </Reveal>
      </div>

      <ConfirmDialog
        open={confirm === 'sample'}
        onClose={() => setConfirm(null)}
        onConfirm={() => {
          actions.loadSample();
          setConfirm(null);
        }}
        title="Load the sample syllabus?"
        description="Your current subjects, topics and history will be replaced by the sample data."
        confirmLabel="Load sample"
      />

      <ConfirmDialog
        open={confirm === 'reset'}
        onClose={() => setConfirm(null)}
        onConfirm={() => {
          actions.resetAll();
          setConfirm(null);
        }}
        title="Reset everything?"
        description="Your syllabus, every stored plan and all study history will be deleted. This cannot be undone."
        confirmLabel="Delete everything"
      />

      <ConfirmDialog
        open={confirm === 'signout'}
        onClose={() => setConfirm(null)}
        onConfirm={() => {
          actions.signOut();
          setConfirm(null);
        }}
        title="Sign out?"
        description="Your data stays in this browser. You can sign back in at any time."
        confirmLabel="Sign out"
      />
    </>
  );
}

function SettingRow({ title, description, children }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 py-4 first:pt-0 last:pb-0">
      <div className="min-w-0 max-w-md">
        <p className="text-[13.5px] font-medium text-ink">{title}</p>
        <p className="mt-1 text-[12.5px] leading-relaxed text-ink-muted">{description}</p>
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

/** Reads the persisted blob straight back out, so the export always matches disk. */
function exportData() {
  try {
    const raw = window.localStorage.getItem('cadence.state.v1');
    if (!raw) return;
    const blob = new Blob([raw], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cadence-${todayKey()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  } catch {
    /* Export is a convenience; a failure here must not break the page. */
  }
}
