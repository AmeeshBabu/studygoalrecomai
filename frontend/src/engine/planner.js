/**
 * DAILY PLAN GENERATOR
 * ────────────────────────────────────────────────────────────────────────────
 * Turns a ranked topic list plus the day's revision debt into an ordered,
 * time-boxed plan that fits the hours the student actually has.
 *
 * Constraints applied, in order:
 *   1. Revision due today is placed first and capped as a share of the day.
 *   2. Study time is filled from the priority ranking, highest score first.
 *   3. No single sitting exceeds one focus block, so long chapters split
 *      across days instead of eating a whole evening.
 *   4. No single subject may take more than 60% of the study time while other
 *      subjects still have work, which prevents tunnel vision.
 *   5. Tasks are interleaved across subjects, which beats blocked practice for
 *      retention, while keeping the highest-priority task in the first slot.
 */

import { rankTopics, bandFor, minutesRemaining } from './scoring.js';
import { revisionsOn, finalStretchLength, REVISION_KINDS } from './revision.js';
import { clamp, roundToBlock, sum } from '../lib/utils.js';
import { daysUntilExam, todayKey, weekdayOf } from '../lib/date.js';

/** Longest single sitting on one topic, in minutes. */
export const FOCUS_BLOCK = 90;
/** Shortest task worth putting on a plan. */
export const MIN_TASK = 15;

const REVISION_SHARE = { build: 0.3, stretch: 0.75 };
const MAX_SUBJECT_SHARE = 0.6;

/** Minutes available on a given date, honouring any per-weekday override. */
export function budgetFor(profile, date) {
  const perDay = profile?.weekdayHours?.[weekdayOf(date)];
  const hours = perDay == null || perDay === '' ? profile?.dailyHours ?? 4 : Number(perDay);
  return Math.round(clamp(hours, 0, 16) * 60);
}

export function planModeFor(daysLeft) {
  if (daysLeft == null) return 'build';
  if (daysLeft < 0) return 'past';
  if (daysLeft === 0) return 'exam-day';
  return daysLeft <= finalStretchLength(daysLeft) ? 'stretch' : 'build';
}

/**
 * Generates the plan for one date.
 *
 * `completions` is a map of taskId -> true for tasks already ticked off, so a
 * regenerated plan preserves what the student has already done today.
 */
export function generatePlan({
  subjects = [],
  topics = [],
  profile = {},
  revisionSchedule = [],
  date = todayKey(),
  completions = {},
}) {
  const budget = budgetFor(profile, date);
  const daysLeft = daysUntilExam(profile.examDate, date);
  const mode = planModeFor(daysLeft);

  const base = {
    date,
    generatedAt: new Date().toISOString(),
    budgetMinutes: budget,
    mode,
    daysLeft,
    tasks: [],
    meta: { studyMinutes: 0, revisionMinutes: 0, subjectsCovered: 0, unplannedMinutes: 0 },
  };

  if (mode === 'exam-day') {
    return { ...base, note: 'Exam day. Light recall only, then rest.' };
  }
  if (!subjects.length || !topics.length) {
    return { ...base, note: 'Add subjects and topics to generate a plan.' };
  }
  if (budget < MIN_TASK) {
    return { ...base, note: 'No study time set aside for this day.' };
  }

  /* ---- 1. Revision first -------------------------------------------------- */
  const share = REVISION_SHARE[mode] ?? REVISION_SHARE.build;
  let revisionBudget = Math.round(budget * share);
  const due = revisionsOn(revisionSchedule, date).sort((a, b) => b.weight - a.weight);

  const tasks = [];
  let spent = 0;

  for (const rev of due) {
    if (revisionBudget < MIN_TASK) break;
    const minutes = Math.min(rev.minutes, revisionBudget, budget - spent);
    if (minutes < MIN_TASK) continue;
    tasks.push({
      id: `${date}__${rev.id}`,
      kind: 'revision',
      revisionKind: rev.kind,
      topicId: rev.topicId,
      subjectId: rev.subjectId,
      title: rev.topicName ?? rev.subjectName,
      subtitle: rev.subjectName,
      label: REVISION_KINDS[rev.kind].label,
      blurb: REVISION_KINDS[rev.kind].blurb,
      minutes,
      score: null,
      priority: rev.kind === 'subject' ? 'high' : 'medium',
      reasons: [
        rev.kind === 'subject'
          ? 'Final sweep before the exam'
          : `Pass ${rev.pass} of ${rev.totalPasses} on the spacing ladder`,
      ],
      done: Boolean(completions[`${date}__${rev.id}`]),
    });
    revisionBudget -= minutes;
    spent += minutes;
  }

  /* ---- 2. Fill the rest with study ---------------------------------------- */
  const { ranked, context } = rankTopics(subjects, topics, {
    date,
    examDate: profile.examDate,
  });

  const studyBudget = budget - spent;
  const subjectsWithWork = new Set(ranked.map((r) => r.topic.subjectId)).size;
  const perSubjectCap =
    subjectsWithWork > 1 ? Math.round(studyBudget * MAX_SUBJECT_SHARE) : studyBudget;

  const bySubject = new Map();
  const picked = [];
  let studySpent = 0;
  let relaxed = false;

  // Two passes: the first honours the diversity cap, the second relaxes it only
  // if the day would otherwise go underfilled.
  for (let pass = 0; pass < 2; pass++) {
    if (pass === 1) {
      if (studyBudget - studySpent < MIN_TASK) break;
      relaxed = true;
    }
    for (const candidate of ranked) {
      const left = studyBudget - studySpent;
      if (left < MIN_TASK) break;
      if (picked.some((p) => p.topicId === candidate.topic.id)) continue;

      const used = bySubject.get(candidate.topic.subjectId) || 0;
      if (!relaxed && used >= perSubjectCap) continue;

      const headroom = relaxed ? left : Math.min(left, perSubjectCap - used);
      if (headroom < MIN_TASK) continue;

      const wanted = Math.min(candidate.minutesLeft, FOCUS_BLOCK, headroom);
      const minutes = roundToBlock(Math.min(wanted, left), 15);
      if (minutes < MIN_TASK) continue;

      picked.push({
        topicId: candidate.topic.id,
        subjectId: candidate.topic.subjectId,
        minutes: Math.min(minutes, left),
        score: candidate.score,
        reasons: candidate.reasons,
        title: candidate.topic.name,
        subtitle: candidate.subject?.name ?? '',
        difficulty: candidate.topic.difficulty,
        carriedOver: (candidate.topic.deferCount || 0) > 0,
        partial: candidate.minutesLeft > minutes,
        minutesLeft: candidate.minutesLeft,
      });
      bySubject.set(
        candidate.topic.subjectId,
        used + Math.min(minutes, left),
      );
      studySpent += Math.min(minutes, left);
    }
  }

  /* ---- 3. Interleave across subjects -------------------------------------- */
  const ordered = interleaveBySubject(picked);

  for (const p of ordered) {
    tasks.push({
      id: `${date}__topic_${p.topicId}`,
      kind: 'study',
      topicId: p.topicId,
      subjectId: p.subjectId,
      title: p.title,
      subtitle: p.subtitle,
      label: p.partial ? 'Part of topic' : 'Full topic',
      blurb: null,
      minutes: p.minutes,
      score: p.score,
      priority: bandFor(p.score).key,
      difficulty: p.difficulty,
      carriedOver: p.carriedOver,
      reasons: p.reasons,
      done: Boolean(completions[`${date}__topic_${p.topicId}`]),
    });
  }

  const studyMinutes = sum(tasks.filter((t) => t.kind === 'study'), (t) => t.minutes);
  const revisionMinutes = sum(tasks.filter((t) => t.kind === 'revision'), (t) => t.minutes);

  return {
    ...base,
    tasks,
    meta: {
      studyMinutes,
      revisionMinutes,
      plannedMinutes: studyMinutes + revisionMinutes,
      unplannedMinutes: Math.max(0, budget - studyMinutes - revisionMinutes),
      subjectsCovered: new Set(tasks.map((t) => t.subjectId)).size,
      totalRemaining: context.totalRemaining,
      relaxedDiversity: relaxed,
    },
    note:
      mode === 'stretch'
        ? 'Final stretch. The plan is weighted towards revision over new topics.'
        : null,
  };
}

/**
 * Round-robins picks across subjects so the same subject rarely runs twice in
 * a row. The subject holding the single highest-scoring task still leads.
 */
function interleaveBySubject(picked) {
  if (picked.length < 3) return picked;

  const groups = new Map();
  for (const p of picked) {
    if (!groups.has(p.subjectId)) groups.set(p.subjectId, []);
    groups.get(p.subjectId).push(p);
  }
  for (const list of groups.values()) list.sort((a, b) => b.score - a.score);

  const queues = [...groups.values()].sort((a, b) => b[0].score - a[0].score);
  const out = [];
  while (out.length < picked.length) {
    let placedThisRound = false;
    for (const q of queues) {
      if (q.length) {
        out.push(q.shift());
        placedThisRound = true;
      }
    }
    if (!placedThisRound) break;
  }
  return out;
}

/**
 * CAPACITY FORECAST
 * Compares what the syllabus still needs against the hours left before the
 * exam. This is what drives the "you are behind / on track" verdict and the
 * suggested daily-hours correction.
 */
export function forecastCapacity({ subjects, topics, profile, from = todayKey() }) {
  const daysLeft = daysUntilExam(profile?.examDate, from);
  const requiredMinutes = sum(
    topics.filter((t) => t.status !== 'done'),
    minutesRemaining,
  );

  if (daysLeft == null) {
    return { status: 'unknown', requiredMinutes, daysLeft: null };
  }

  // Revision needs roughly a third on top of first-pass learning.
  const withRevision = Math.round(requiredMinutes * 1.33);
  const studyDays = Math.max(0, daysLeft);
  let availableMinutes = 0;
  for (let i = 0; i < studyDays; i++) {
    availableMinutes += budgetFor(profile, isoShift(from, i));
  }

  const surplus = availableMinutes - withRevision;
  const neededPerDay = studyDays ? withRevision / studyDays : withRevision;
  const currentPerDay = studyDays ? availableMinutes / studyDays : 0;

  let status = 'on-track';
  if (studyDays === 0) status = 'out-of-time';
  else if (surplus < 0) status = 'behind';
  else if (surplus < withRevision * 0.1) status = 'tight';
  else if (surplus > withRevision * 0.6) status = 'ahead';

  return {
    status,
    daysLeft,
    requiredMinutes,
    withRevision,
    availableMinutes,
    surplus,
    neededPerDay,
    currentPerDay,
    extraPerDay: Math.max(0, neededPerDay - currentPerDay),
  };
}

function isoShift(key, days) {
  const [y, m, d] = key.split('-').map(Number);
  const dt = new Date(y, m - 1, d + days);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(
    dt.getDate(),
  ).padStart(2, '0')}`;
}
