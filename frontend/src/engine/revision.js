/**
 * REVISION PLANNER
 * ────────────────────────────────────────────────────────────────────────────
 * Once a topic is completed it enters a spaced-repetition ladder. The interval
 * ladder is chosen by difficulty: hard topics are revisited sooner and more
 * often than easy ones, which is where the forgetting curve actually bites.
 *
 * Three session kinds, escalating in depth:
 *   quick   - skim notes and formulae, first pass after learning
 *   topic   - work through the topic properly a second time
 *   deep    - consolidation pass close to the exam
 *   subject - full subject sweep, only in the final stretch
 */

import { addDays, daysBetween, todayKey } from '../lib/date.js';
import { clamp, roundToBlock } from '../lib/utils.js';
import { DIFFICULTY } from './scoring.js';

/** Days after completion at which each revision falls. */
const LADDERS = {
  hard: [1, 3, 7, 14],
  medium: [2, 6, 14],
  easy: [3, 10],
};

export const REVISION_KINDS = {
  quick: { label: 'Quick revision', blurb: 'Skim notes, formulae and definitions' },
  topic: { label: 'Topic revision', blurb: 'Re-work the topic and solve problems' },
  deep: { label: 'Consolidation', blurb: 'Deep pass with past-paper questions' },
  subject: { label: 'Full subject revision', blurb: 'Sweep the whole subject end to end' },
};

function kindForIndex(i, total) {
  if (i === 0) return 'quick';
  if (i === total - 1 && total > 2) return 'deep';
  return 'topic';
}

/** Revision length scales with the topic's own size, then clamps to sane blocks. */
function minutesFor(kind, estimatedMinutes) {
  const est = estimatedMinutes || 60;
  const spec = {
    quick: [0.2, 10, 25],
    topic: [0.3, 20, 40],
    deep: [0.35, 25, 50],
  }[kind] ?? [0.3, 20, 40];
  const [ratio, min, max] = spec;
  return roundToBlock(clamp(est * ratio, min, max), 5);
}

/**
 * Builds every scheduled revision for the whole syllabus.
 *
 * When the exam is near, the ladder is compressed rather than truncated: a
 * topic finished four days before the exam still gets its passes, just packed
 * into the days that remain. Anything that cannot fit before the exam is
 * dropped instead of being scheduled into the past.
 */
export function buildRevisionSchedule(subjects, topics, { examDate, from = todayKey() } = {}) {
  const subjectById = Object.fromEntries(subjects.map((s) => [s.id, s]));
  const items = [];

  for (const topic of topics) {
    if (topic.status !== 'done' || !topic.completedAt) continue;
    const subject = subjectById[topic.subjectId];
    if (!subject) continue;

    const ladder = LADDERS[topic.difficulty] ?? LADDERS.medium;
    const windowLeft = examDate ? daysBetween(topic.completedAt, examDate) : null;

    // Compression factor: squeeze the ladder into the days actually available.
    let scale = 1;
    if (windowLeft != null && windowLeft > 0) {
      const span = ladder.at(-1);
      if (span > windowLeft) scale = windowLeft / span;
    }

    ladder.forEach((offset, i) => {
      const shifted = Math.max(1, Math.round(offset * scale));
      const date = addDays(topic.completedAt, shifted);

      // Never schedule on or after the exam, and never in the past.
      if (examDate && daysBetween(date, examDate) < 0) return;
      if (daysBetween(from, date) < -30) return;

      const kind = kindForIndex(i, ladder.length);
      items.push({
        id: `rev_${topic.id}_${i}`,
        kind,
        date,
        pass: i + 1,
        totalPasses: ladder.length,
        topicId: topic.id,
        subjectId: topic.subjectId,
        topicName: topic.name,
        subjectName: subject.name,
        difficulty: topic.difficulty,
        minutes: minutesFor(kind, topic.estimatedMinutes),
        // Hard topics revised late are the highest-value revision minutes.
        weight:
          (DIFFICULTY[topic.difficulty]?.weight ?? 2) *
          (subject.importance ?? 3) *
          (i + 1),
      });
    });
  }

  // Full-subject sweeps in the closing days, one per subject, most important last
  // so the student walks into the exam having just seen the heaviest paper.
  if (examDate) {
    const daysToExam = daysBetween(from, examDate);
    const stretch = finalStretchLength(daysToExam);
    if (daysToExam > 1 && stretch > 0) {
      const ready = subjects
        .filter((s) => topics.some((t) => t.subjectId === s.id && t.status === 'done'))
        .sort((a, b) => (a.importance ?? 3) - (b.importance ?? 3));

      ready.forEach((subject, i) => {
        // Spread sweeps across the stretch, ending the day before the exam.
        const offsetFromExam = Math.max(1, stretch - i);
        const date = addDays(examDate, -offsetFromExam);
        if (daysBetween(from, date) < 0) return;
        items.push({
          id: `sweep_${subject.id}`,
          kind: 'subject',
          date,
          pass: 1,
          totalPasses: 1,
          topicId: null,
          subjectId: subject.id,
          topicName: null,
          subjectName: subject.name,
          difficulty: subject.difficulty,
          minutes: 90,
          weight: 1000 + (subject.importance ?? 3) * 10,
        });
      });
    }
  }

  return items.sort((a, b) => a.date.localeCompare(b.date) || b.weight - a.weight);
}

/** How many closing days are handed over to revision-heavy planning. */
export function finalStretchLength(daysToExam) {
  if (daysToExam == null || daysToExam <= 0) return 0;
  if (daysToExam <= 3) return daysToExam;
  return clamp(Math.ceil(daysToExam * 0.18), 2, 7);
}

export function revisionsOn(schedule, date) {
  return schedule.filter((r) => r.date === date);
}

/** Groups the schedule by day for the Revision Planner timeline. */
export function groupRevisionsByDay(schedule) {
  const map = new Map();
  for (const item of schedule) {
    if (!map.has(item.date)) map.set(item.date, []);
    map.get(item.date).push(item);
  }
  return [...map.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, items]) => ({ date, items }));
}
