/**
 * ADAPTIVE RESCHEDULING
 * ────────────────────────────────────────────────────────────────────────────
 * The plan is never edited by hand when a goal is missed. Instead, every past
 * day is reconciled once: unfinished topics have their defer count raised,
 * which feeds the `staleness` factor in the scorer and pushes them up the
 * ranking. The next plan then rebuilds around them automatically.
 *
 * This is why the schedule self-corrects: the scorer is the single source of
 * ordering, so changing the inputs is enough to change every future day.
 */

import { sum } from '../lib/utils.js';
import { formatMinutes } from '../lib/date.js';

function statusFor(plan, doneCount) {
  if (!plan.tasks.length) return 'rest';
  if (doneCount === plan.tasks.length) return 'complete';
  if (doneCount === 0) return 'missed';
  return 'partial';
}

/**
 * Walks every stored plan older than `today` exactly once and folds its result
 * into topic state and the day log.
 *
 * Pure: returns new objects rather than mutating, so it is safe to call on
 * every app load. The `reconciled` flag on each plan makes it idempotent.
 */
export function reconcile({ plans = {}, topics = [], dayLogs = {}, today }) {
  const adjustments = [];
  const nextTopics = topics.map((t) => ({ ...t }));
  const topicIndex = new Map(nextTopics.map((t) => [t.id, t]));
  const nextPlans = { ...plans };
  const nextLogs = { ...dayLogs };
  let changed = false;

  for (const date of Object.keys(plans).sort()) {
    if (date >= today) continue;
    const plan = plans[date];
    if (!plan || plan.reconciled) continue;

    const doneTasks = plan.tasks.filter((t) => t.done);
    const missedTasks = plan.tasks.filter((t) => !t.done);

    for (const task of missedTasks) {
      if (task.kind === 'study' && task.topicId) {
        const topic = topicIndex.get(task.topicId);
        if (topic && topic.status !== 'done') {
          topic.deferCount = (topic.deferCount || 0) + 1;
          adjustments.push({
            date,
            type: 'deferred',
            title: task.title,
            subtitle: task.subtitle,
            minutes: task.minutes,
            detail: `${formatMinutes(task.minutes)} moved forward and re-prioritised`,
          });
        }
      } else if (task.kind === 'revision') {
        adjustments.push({
          date,
          type: 'revision-missed',
          title: task.title,
          subtitle: task.subtitle,
          minutes: task.minutes,
          detail: 'Revision pass rescheduled on the spacing ladder',
        });
      }
      changed = true;
    }

    nextPlans[date] = {
      ...plan,
      reconciled: true,
      status: statusFor(plan, doneTasks.length),
    };

    nextLogs[date] = {
      date,
      plannedMinutes: plan.meta?.plannedMinutes ?? sum(plan.tasks, (t) => t.minutes),
      completedMinutes: sum(doneTasks, (t) => t.minutes),
      tasksTotal: plan.tasks.length,
      tasksDone: doneTasks.length,
      status: statusFor(plan, doneTasks.length),
    };
    changed = true;
  }

  return { plans: nextPlans, topics: nextTopics, dayLogs: nextLogs, adjustments, changed };
}

/** Longest run of days ending today (or yesterday) with any completed work. */
export function streakFrom(dayLogs, today) {
  const keys = Object.keys(dayLogs).sort().reverse();
  if (!keys.length) return 0;
  let streak = 0;
  let cursor = today;
  const shift = (k, n) => {
    const [y, m, d] = k.split('-').map(Number);
    const dt = new Date(y, m - 1, d + n);
    return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(
      dt.getDate(),
    ).padStart(2, '0')}`;
  };
  // Today may legitimately be unfinished, so start counting from yesterday.
  cursor = shift(today, -1);
  for (let i = 0; i < 400; i++) {
    const log = dayLogs[cursor];
    if (!log) break;
    if (log.status === 'rest') {
      cursor = shift(cursor, -1);
      continue;
    }
    if (log.completedMinutes > 0) {
      streak += 1;
      cursor = shift(cursor, -1);
    } else break;
  }
  return streak;
}

/** Share of logged days where at least 60% of planned minutes were done. */
export function consistencyRate(dayLogs) {
  const logs = Object.values(dayLogs).filter((l) => l.status !== 'rest');
  if (!logs.length) return null;
  const kept = logs.filter(
    (l) => l.plannedMinutes > 0 && l.completedMinutes / l.plannedMinutes >= 0.6,
  ).length;
  return Math.round((kept / logs.length) * 100);
}
