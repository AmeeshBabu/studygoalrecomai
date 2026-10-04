/**
 * STUDY INSIGHTS
 * ────────────────────────────────────────────────────────────────────────────
 * Every insight is derived from the student's own numbers and carries the
 * figure it was derived from, so nothing here is a canned motivational string.
 * Rules are evaluated independently, then ranked by severity and trimmed, so
 * the page shows the few things that actually matter today.
 */

import { minutesRemaining, DIFFICULTY } from './scoring.js';
import { forecastCapacity } from './planner.js';
import { streakFrom, consistencyRate } from './adaptive.js';
import { daysUntilExam, formatMinutes, todayKey, addDays } from '../lib/date.js';
import { pct, sum, plural } from '../lib/utils.js';

const TONE_RANK = { critical: 0, warn: 1, info: 2, positive: 3 };

/** Per-subject rollup used by both the insights and the analytics page. */
export function subjectStats(subjects, topics) {
  return subjects
    .map((subject) => {
      const own = topics.filter((t) => t.subjectId === subject.id);
      const totalMinutes = sum(own, (t) => t.estimatedMinutes);
      const doneTopics = own.filter((t) => t.status === 'done');
      const doneMinutes =
        sum(doneTopics, (t) => t.estimatedMinutes) +
        sum(
          own.filter((t) => t.status !== 'done'),
          (t) => t.minutesDone || 0,
        );
      const remainingMinutes = sum(own, minutesRemaining);
      return {
        subject,
        topics: own,
        topicCount: own.length,
        doneCount: doneTopics.length,
        pendingCount: own.length - doneTopics.length,
        totalMinutes,
        doneMinutes,
        remainingMinutes,
        completion: pct(doneMinutes, totalMinutes),
        hardPending: own.filter((t) => t.difficulty === 'hard' && t.status !== 'done').length,
        untouched: own.filter((t) => t.status === 'pending' && !(t.minutesDone > 0)).length,
      };
    })
    .sort((a, b) => b.subject.importance - a.subject.importance || a.completion - b.completion);
}

export function overallStats(subjects, topics, dayLogs = {}, profile = {}) {
  const totalMinutes = sum(topics, (t) => t.estimatedMinutes);
  const doneTopics = topics.filter((t) => t.status === 'done');
  const doneMinutes =
    sum(doneTopics, (t) => t.estimatedMinutes) +
    sum(
      topics.filter((t) => t.status !== 'done'),
      (t) => t.minutesDone || 0,
    );
  const logs = Object.values(dayLogs);

  return {
    subjectCount: subjects.length,
    topicCount: topics.length,
    doneCount: doneTopics.length,
    pendingCount: topics.length - doneTopics.length,
    totalMinutes,
    doneMinutes,
    remainingMinutes: sum(topics, minutesRemaining),
    completion: pct(doneMinutes, totalMinutes),
    daysLeft: daysUntilExam(profile.examDate),
    streak: streakFrom(dayLogs, todayKey()),
    consistency: consistencyRate(dayLogs),
    minutesStudied: sum(logs, (l) => l.completedMinutes),
    missedDays: logs.filter((l) => l.status === 'missed').length,
    partialDays: logs.filter((l) => l.status === 'partial').length,
    completeDays: logs.filter((l) => l.status === 'complete').length,
  };
}

export function generateInsights({ subjects = [], topics = [], profile = {}, dayLogs = {} }) {
  const out = [];
  const stats = subjectStats(subjects, topics);
  const overall = overallStats(subjects, topics, dayLogs, profile);
  const forecast = forecastCapacity({ subjects, topics, profile });
  const daysLeft = overall.daysLeft;

  if (!subjects.length) {
    return [
      {
        id: 'empty',
        tone: 'info',
        icon: 'compass',
        title: 'Add your first subject to unlock recommendations',
        body: 'The engine needs a syllabus before it can rank anything. Start with the subject you are most worried about.',
        action: { label: 'Add a subject', to: '/app/subjects' },
      },
    ];
  }

  /* ---- Time pressure ------------------------------------------------------ */
  if (daysLeft != null && daysLeft >= 0 && daysLeft <= 10) {
    out.push({
      id: 'exam-near',
      tone: daysLeft <= 3 ? 'critical' : 'warn',
      icon: 'clock',
      metric: daysLeft === 0 ? 'Today' : plural(daysLeft, 'day'),
      title:
        daysLeft === 0
          ? 'Your exam is today'
          : `${plural(daysLeft, 'day')} until ${profile.examName || 'your exam'}`,
      body:
        daysLeft <= 3
          ? 'New topics rarely pay off this late. The plan has shifted almost entirely to revision.'
          : `${formatMinutes(overall.remainingMinutes)} of syllabus is still open. Revision now takes priority over breadth.`,
      action: { label: "Open today's plan", to: '/app/today' },
    });
  }

  /* ---- Capacity verdict --------------------------------------------------- */
  if (forecast.status === 'behind' && forecast.extraPerDay > 5) {
    out.push({
      id: 'behind',
      tone: 'critical',
      icon: 'warning',
      metric: `+${formatMinutes(forecast.extraPerDay)}/day`,
      title: 'Your current hours will not cover the syllabus',
      body: `Finishing everything plus revision needs about ${formatMinutes(
        forecast.neededPerDay,
      )} a day, but you have set aside ${formatMinutes(
        forecast.currentPerDay,
      )}. Raise your daily hours or drop a low-importance subject.`,
      action: { label: 'Adjust study hours', to: '/app/settings' },
    });
  } else if (forecast.status === 'ahead' && overall.completion > 15) {
    out.push({
      id: 'ahead',
      tone: 'positive',
      icon: 'trend',
      metric: `${formatMinutes(forecast.surplus)} spare`,
      title: 'You have more time than the syllabus needs',
      body: 'Comfortable margin. Spend the slack on past papers and extra revision passes for your hard topics rather than adding hours.',
    });
  } else if (forecast.status === 'tight') {
    out.push({
      id: 'tight',
      tone: 'warn',
      icon: 'gauge',
      metric: 'No slack',
      title: 'The schedule fits with almost nothing to spare',
      body: `A single missed day now pushes work into your revision window. Protect the next ${plural(
        Math.min(7, daysLeft ?? 7),
        'day',
      )}.`,
    });
  }

  /* ---- Weakest high-stakes subject ---------------------------------------- */
  const atRisk = stats
    .filter((s) => s.topicCount > 0 && s.completion < 50)
    .sort(
      (a, b) =>
        b.subject.importance - a.subject.importance ||
        a.completion - b.completion,
    )[0];

  if (atRisk) {
    const pending = 100 - atRisk.completion;
    out.push({
      id: `risk-${atRisk.subject.id}`,
      tone: atRisk.subject.importance >= 4 ? 'critical' : 'warn',
      icon: 'target',
      metric: `${pending}% pending`,
      title: `${atRisk.subject.name} needs the most attention`,
      body: `${pending}% of the syllabus is still open across ${plural(
        atRisk.pendingCount,
        'topic',
      )}, and it is marked ${
        ['', 'minor', 'low', 'normal', 'major', 'critical'][atRisk.subject.importance]
      } weight. It leads the priority ranking until that gap closes.`,
      action: { label: `Open ${atRisk.subject.name}`, to: '/app/subjects' },
    });
  }

  /* ---- Untouched hard topics --------------------------------------------- */
  const hardUntouched = topics.filter(
    (t) => t.difficulty === 'hard' && t.status === 'pending' && !(t.minutesDone > 0),
  );
  if (hardUntouched.length >= 2 && daysLeft != null && daysLeft < 21) {
    out.push({
      id: 'hard-untouched',
      tone: 'warn',
      icon: 'mountain',
      metric: plural(hardUntouched.length, 'topic'),
      title: 'Your hardest topics are still untouched',
      body: `${hardUntouched
        .slice(0, 3)
        .map((t) => t.name)
        .join(', ')}${
        hardUntouched.length > 3 ? ` and ${hardUntouched.length - 3} more` : ''
      }. Hard topics need a second pass to stick, so starting them late costs double.`,
      action: { label: 'See the ranking', to: '/app/insights' },
    });
  }

  /* ---- Repeatedly deferred ------------------------------------------------ */
  const slipping = topics
    .filter((t) => (t.deferCount || 0) >= 2 && t.status !== 'done')
    .sort((a, b) => b.deferCount - a.deferCount);
  if (slipping.length) {
    const worst = slipping[0];
    const owner = subjects.find((s) => s.id === worst.subjectId);
    out.push({
      id: 'slipping',
      tone: 'warn',
      icon: 'repeat',
      metric: `${worst.deferCount}× deferred`,
      title: `${worst.name} keeps getting pushed back`,
      body: `You have rescheduled it ${worst.deferCount} times. It now sits at the top of the ${
        owner?.name ?? 'subject'
      } queue. If it is genuinely too big, split it into smaller topics.`,
      action: { label: 'Split or reschedule', to: '/app/subjects' },
    });
  }

  /* ---- Momentum and consistency ------------------------------------------ */
  if (overall.streak >= 3) {
    out.push({
      id: 'streak',
      tone: 'positive',
      icon: 'flame',
      metric: `${overall.streak} days`,
      title: `${overall.streak}-day streak`,
      body: 'You have hit some of your plan every day this run. Consistency is worth more than any single long session.',
    });
  } else if (overall.missedDays >= 2) {
    out.push({
      id: 'missed',
      tone: 'warn',
      icon: 'calendarX',
      metric: plural(overall.missedDays, 'day'),
      title: `${plural(overall.missedDays, 'day')} went by with nothing logged`,
      body: 'Those topics were carried forward automatically, but the hours were not. Consider a smaller daily target you can actually hit.',
      action: { label: 'Review the calendar', to: '/app/calendar' },
    });
  }

  const last7 = recentMinutes(dayLogs, 7, 0);
  const prev7 = recentMinutes(dayLogs, 7, 7);
  if (prev7 > 30 && last7 > 0) {
    const delta = Math.round(((last7 - prev7) / prev7) * 100);
    if (delta <= -25) {
      out.push({
        id: 'slowing',
        tone: 'warn',
        icon: 'trendDown',
        metric: `${delta}%`,
        title: 'Your study time dropped this week',
        body: `${formatMinutes(last7)} in the last seven days against ${formatMinutes(
          prev7,
        )} the week before. Worth checking whether the daily target is realistic.`,
      });
    } else if (delta >= 30) {
      out.push({
        id: 'accelerating',
        tone: 'positive',
        icon: 'trend',
        metric: `+${delta}%`,
        title: 'You picked up the pace this week',
        body: `${formatMinutes(last7)} logged against ${formatMinutes(
          prev7,
        )} the week before. At this rate the remaining syllabus lands comfortably.`,
      });
    }
  }

  /* ---- A subject going well ---------------------------------------------- */
  const strong = stats.filter((s) => s.completion >= 75 && s.topicCount >= 3)[0];
  if (strong) {
    out.push({
      id: `strong-${strong.subject.id}`,
      tone: 'positive',
      icon: 'check',
      metric: `${strong.completion}%`,
      title: `${strong.subject.name} is in good shape`,
      body: `${strong.doneCount} of ${strong.topicCount} topics done. It has dropped down the ranking so the engine can push time towards weaker subjects.`,
    });
  }

  /* ---- Revision debt ----------------------------------------------------- */
  const readyForRevision = topics.filter(
    (t) => t.status === 'done' && t.difficulty === 'hard',
  );
  if (readyForRevision.length >= 3 && daysLeft != null && daysLeft > 3) {
    out.push({
      id: 'revision-ready',
      tone: 'info',
      icon: 'repeat',
      metric: plural(readyForRevision.length, 'topic'),
      title: 'Hard topics are queued for spaced revision',
      body: `${readyForRevision.length} completed hard topics are on the four-pass ladder. Those passes are already reserved in your daily budget.`,
      action: { label: 'See revision plan', to: '/app/revision' },
    });
  }

  return out
    .sort((a, b) => TONE_RANK[a.tone] - TONE_RANK[b.tone])
    .slice(0, 7);
}

function recentMinutes(dayLogs, span, offset) {
  const today = todayKey();
  let total = 0;
  for (let i = offset; i < offset + span; i++) {
    const log = dayLogs[addDays(today, -i - 1)];
    if (log) total += log.completedMinutes || 0;
  }
  return total;
}

/** One-line verdict for the dashboard header. */
export function headlineVerdict({ subjects, topics, profile, dayLogs }) {
  const overall = overallStats(subjects, topics, dayLogs, profile);
  const forecast = forecastCapacity({ subjects, topics, profile });

  if (!subjects.length) return { tone: 'info', text: 'Set up your syllabus to get started.' };
  if (overall.daysLeft != null && overall.daysLeft < 0)
    return { tone: 'info', text: 'Exam date has passed. Set a new one in Settings.' };
  if (forecast.status === 'behind')
    return {
      tone: 'critical',
      text: `Behind schedule. You need about ${formatMinutes(
        forecast.neededPerDay,
      )} a day to finish in time.`,
    };
  if (forecast.status === 'tight')
    return { tone: 'warn', text: 'On track, but with no slack. Try not to skip a day.' };
  if (overall.completion >= 90)
    return { tone: 'positive', text: 'Syllabus nearly done. Revision is now the priority.' };
  return {
    tone: 'positive',
    text: `On track. ${overall.completion}% of the syllabus is behind you.`,
  };
}
