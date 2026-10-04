/**
 * PRIORITY SCORING
 * ────────────────────────────────────────────────────────────────────────────
 * Every pending topic is scored 0-100 from six weighted factors. All factors
 * are normalised to 0-1 and the weights sum to exactly 1.0, so the score is
 * directly readable as a percentage of maximum urgency.
 *
 * The function returns the individual factor contributions alongside the total.
 * That is what makes the recommendation explainable rather than a black box:
 * the UI renders the same numbers back to the student as the reason a topic
 * was picked.
 */

import { clamp } from '../lib/utils.js';
import { daysUntilExam, todayKey } from '../lib/date.js';

export const DIFFICULTY = {
  easy: { label: 'Easy', weight: 1, spread: 1.0 },
  medium: { label: 'Medium', weight: 2, spread: 1.15 },
  hard: { label: 'Hard', weight: 3, spread: 1.35 },
};

export const IMPORTANCE_LABELS = {
  1: 'Minor',
  2: 'Low',
  3: 'Normal',
  4: 'Major',
  5: 'Critical',
};

/** Weights are exported so the Settings page can show them and the project
 *  report can cite them. They must keep summing to 1. */
export const WEIGHTS = {
  importance: 0.26,
  difficulty: 0.24,
  urgency: 0.2,
  backlog: 0.14,
  staleness: 0.1,
  neglect: 0.06,
};

/** Horizon in days over which exam urgency ramps from 0 to 1. */
const URGENCY_HORIZON = 45;

export const PRIORITY_BANDS = [
  { key: 'high', label: 'High', min: 66 },
  { key: 'medium', label: 'Medium', min: 40 },
  { key: 'low', label: 'Low', min: 0 },
];

export function bandFor(score) {
  return PRIORITY_BANDS.find((b) => score >= b.min) ?? PRIORITY_BANDS.at(-1);
}

/**
 * Difficulty blends the topic's own rating with its subject's, because a
 * "medium" topic inside a hard subject is harder than the same topic in an
 * easy one. Topic weight dominates at 65%.
 */
function difficultyFactor(topic, subject) {
  const t = DIFFICULTY[topic.difficulty]?.weight ?? 2;
  const s = DIFFICULTY[subject?.difficulty]?.weight ?? 2;
  const blended = 0.65 * t + 0.35 * s; // 1 .. 3
  return (blended - 1) / 2;
}

/** Subject exam importance, 1-5 stars, normalised. */
function importanceFactor(subject) {
  const i = clamp(subject?.importance ?? 3, 1, 5);
  return (i - 1) / 4;
}

/**
 * Exam proximity. Squared so the curve is gentle when the exam is distant and
 * climbs sharply in the final fortnight, which is how real revision pressure
 * behaves.
 */
function urgencyFactor(daysLeft) {
  if (daysLeft == null) return 0.35; // no exam date set yet
  if (daysLeft <= 0) return 1;
  const nearness = clamp(1 - daysLeft / URGENCY_HORIZON, 0, 1);
  return nearness * nearness;
}

/**
 * Backlog pressure: how much of the *total* remaining workload sits in this
 * topic's subject. A subject with 8 untouched chapters outranks one with a
 * single chapter left, independent of importance.
 */
function backlogFactor(subjectRemainingMins, totalRemainingMins) {
  if (!totalRemainingMins) return 0;
  const share = subjectRemainingMins / totalRemainingMins;
  // A subject holding 40%+ of everything left is treated as maximum pressure.
  return clamp(share / 0.4, 0, 1);
}

/** Deferred topics climb the ranking so nothing can be silently avoided. */
function stalenessFactor(topic) {
  return clamp((topic.deferCount || 0) / 3, 0, 1);
}

/** Subjects that have barely been started get a nudge so nothing is orphaned. */
function neglectFactor(subjectCompletionRatio) {
  return clamp(1 - subjectCompletionRatio, 0, 1);
}

export function minutesRemaining(topic) {
  if (topic.status === 'done') return 0;
  return Math.max(0, (topic.estimatedMinutes || 0) - (topic.minutesDone || 0));
}

/**
 * Scores one topic. `context` carries the aggregates that depend on the whole
 * syllabus, computed once per run by buildScoringContext().
 */
export function scoreTopic(topic, subject, context) {
  const factors = {
    importance: importanceFactor(subject),
    difficulty: difficultyFactor(topic, subject),
    urgency: urgencyFactor(context.daysLeft),
    backlog: backlogFactor(
      context.subjectRemaining[topic.subjectId] || 0,
      context.totalRemaining,
    ),
    staleness: stalenessFactor(topic),
    neglect: neglectFactor(context.subjectCompletion[topic.subjectId] ?? 0),
  };

  let total = 0;
  const contributions = {};
  for (const [key, weight] of Object.entries(WEIGHTS)) {
    const contribution = factors[key] * weight;
    contributions[key] = contribution;
    total += contribution;
  }

  const score = Math.round(clamp(total, 0, 1) * 100);
  return {
    topicId: topic.id,
    score,
    band: bandFor(score).key,
    factors,
    contributions,
    reasons: explain(factors, context, topic, subject),
  };
}

/**
 * Turns the factor vector into at most three plain-English clauses, strongest
 * first. These render as the "why this topic" chips in the UI.
 */
function explain(factors, context, topic, subject) {
  const candidates = [];

  if (factors.staleness > 0) {
    candidates.push({
      weight: factors.staleness * WEIGHTS.staleness + 0.5, // always surface a miss
      text:
        topic.deferCount === 1
          ? 'Carried over from a missed day'
          : `Deferred ${topic.deferCount} times`,
    });
  }
  if (factors.urgency > 0.55) {
    candidates.push({
      weight: factors.urgency * WEIGHTS.urgency,
      text: `Only ${context.daysLeft} days to the exam`,
    });
  }
  if (factors.importance >= 0.75) {
    candidates.push({
      weight: factors.importance * WEIGHTS.importance,
      text: `${subject?.name ?? 'Subject'} is high-weight`,
    });
  }
  if (factors.difficulty >= 0.6) {
    candidates.push({
      weight: factors.difficulty * WEIGHTS.difficulty,
      text: 'Hard topic, needs a fresh mind',
    });
  }
  if (factors.backlog >= 0.5) {
    candidates.push({
      weight: factors.backlog * WEIGHTS.backlog,
      text: 'Largest remaining backlog',
    });
  }
  if (factors.neglect >= 0.8) {
    candidates.push({
      weight: factors.neglect * WEIGHTS.neglect,
      text: 'Barely started this subject',
    });
  }

  if (!candidates.length) {
    candidates.push({ weight: 0, text: 'Keeps the syllabus moving evenly' });
  }

  return candidates
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 3)
    .map((c) => c.text);
}

/**
 * Pre-computes the syllabus-wide aggregates the scorer needs. Doing this once
 * per run keeps scoring O(n) instead of O(n²).
 */
export function buildScoringContext(subjects, topics, { date = todayKey(), examDate } = {}) {
  const subjectRemaining = {};
  const subjectTotal = {};
  const subjectDone = {};

  for (const s of subjects) {
    subjectRemaining[s.id] = 0;
    subjectTotal[s.id] = 0;
    subjectDone[s.id] = 0;
  }

  for (const t of topics) {
    if (!(t.subjectId in subjectTotal)) continue;
    const est = t.estimatedMinutes || 0;
    subjectTotal[t.subjectId] += est;
    if (t.status === 'done') {
      subjectDone[t.subjectId] += est;
    } else {
      subjectRemaining[t.subjectId] += minutesRemaining(t);
      subjectDone[t.subjectId] += t.minutesDone || 0;
    }
  }

  const subjectCompletion = {};
  for (const s of subjects) {
    subjectCompletion[s.id] = subjectTotal[s.id]
      ? subjectDone[s.id] / subjectTotal[s.id]
      : 0;
  }

  const totalRemaining = Object.values(subjectRemaining).reduce((a, b) => a + b, 0);

  return {
    date,
    daysLeft: daysUntilExam(examDate, date),
    subjectRemaining,
    subjectTotal,
    subjectDone,
    subjectCompletion,
    totalRemaining,
  };
}

/** Scores every pending topic and returns them ranked, highest first. */
export function rankTopics(subjects, topics, options = {}) {
  const context = buildScoringContext(subjects, topics, options);
  const byId = Object.fromEntries(subjects.map((s) => [s.id, s]));

  const ranked = topics
    .filter((t) => t.status !== 'done' && minutesRemaining(t) > 0)
    .map((t) => ({
      ...scoreTopic(t, byId[t.subjectId], context),
      topic: t,
      subject: byId[t.subjectId],
      minutesLeft: minutesRemaining(t),
    }))
    .sort((a, b) => b.score - a.score || a.topic.name.localeCompare(b.topic.name));

  return { ranked, context };
}
