import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useCallback,
} from 'react';

import { emptyState, load, save, clear } from './persist.js';
import { buildSampleSyllabus } from './seed.js';
import { generatePlan, forecastCapacity, budgetFor } from '../engine/planner.js';
import { buildRevisionSchedule } from '../engine/revision.js';
import { rankTopics } from '../engine/scoring.js';
import { reconcile } from '../engine/adaptive.js';
import {
  generateInsights,
  subjectStats,
  overallStats,
  headlineVerdict,
} from '../engine/insights.js';
import { todayKey } from '../lib/date.js';
import { uid } from '../lib/utils.js';

const AppContext = createContext(null);

/* ────────────────────────────── reducer ────────────────────────────── */

function reducer(state, action) {
  switch (action.type) {
    case 'hydrate':
      return action.state;

    case 'account/set':
      return { ...state, account: action.account };

    case 'profile/patch':
      return { ...state, profile: { ...state.profile, ...action.patch } };

    case 'subject/add':
      return { ...state, subjects: [...state.subjects, action.subject] };

    case 'subject/update':
      return {
        ...state,
        subjects: state.subjects.map((s) =>
          s.id === action.id ? { ...s, ...action.patch } : s,
        ),
      };

    case 'subject/remove':
      return {
        ...state,
        subjects: state.subjects.filter((s) => s.id !== action.id),
        topics: state.topics.filter((t) => t.subjectId !== action.id),
      };

    case 'topic/add':
      return { ...state, topics: [...state.topics, action.topic] };

    case 'topic/update':
      return {
        ...state,
        topics: state.topics.map((t) => (t.id === action.id ? { ...t, ...action.patch } : t)),
      };

    case 'topic/remove':
      return { ...state, topics: state.topics.filter((t) => t.id !== action.id) };

    case 'topics/replace':
      return { ...state, topics: action.topics };

    case 'plan/set':
      return { ...state, plans: { ...state.plans, [action.date]: action.plan } };

    case 'reconciled':
      return {
        ...state,
        plans: action.plans,
        topics: action.topics,
        dayLogs: action.dayLogs,
        adjustments: action.adjustments,
        adjustmentsSeen: action.adjustments.length === 0,
      };

    case 'adjustments/seen':
      return { ...state, adjustmentsSeen: true };

    case 'sample/load': {
      const { subjects, topics, dayLogs } = action.payload;
      return { ...state, subjects, topics, dayLogs, plans: {} };
    }

    case 'reset':
      return { ...emptyState, account: state.account };

    default:
      return state;
  }
}

/* ───────────────────────────── provider ───────────────────────────── */

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, emptyState, (initial) => load() ?? initial);
  const bootstrapped = useRef(false);

  /* Persist on every change. */
  useEffect(() => {
    save(state);
  }, [state]);

  /* Apply the theme choice to <html>. */
  useEffect(() => {
    const root = document.documentElement;
    const apply = () => {
      const wantsDark =
        state.profile.theme === 'dark' ||
        (state.profile.theme === 'system' &&
          window.matchMedia('(prefers-color-scheme: dark)').matches);
      root.classList.toggle('dark', wantsDark);
    };
    apply();
    if (state.profile.theme !== 'system') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, [state.profile.theme]);

  /* Fold every past day into topic state exactly once per load. */
  useEffect(() => {
    if (bootstrapped.current) return;
    bootstrapped.current = true;
    const result = reconcile({
      plans: state.plans,
      topics: state.topics,
      dayLogs: state.dayLogs,
      today: todayKey(),
    });
    if (result.changed) {
      dispatch({
        type: 'reconciled',
        plans: result.plans,
        topics: result.topics,
        dayLogs: result.dayLogs,
        adjustments: result.adjustments,
      });
    }
    // Intentionally runs once: reconciliation is idempotent but only needs to
    // happen at boot, and re-running on every state change would loop.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ─────────────────────────── derived data ─────────────────────────── */

  const revisionSchedule = useMemo(
    () =>
      buildRevisionSchedule(state.subjects, state.topics, {
        examDate: state.profile.examDate,
      }),
    [state.subjects, state.topics, state.profile.examDate],
  );

  const today = todayKey();

  /**
   * Today's plan is derived, not stored, so it always reflects the current
   * syllabus. Completions from the stored plan are carried across, which is
   * what lets a student edit a subject mid-day without losing their ticks.
   */
  const todayPlan = useMemo(() => {
    const stored = state.plans[today];
    const completions = {};
    for (const task of stored?.tasks ?? []) {
      if (task.done) completions[task.id] = true;
    }
    return generatePlan({
      subjects: state.subjects,
      topics: state.topics,
      profile: state.profile,
      revisionSchedule,
      date: today,
      completions,
    });
  }, [state.subjects, state.topics, state.profile, state.plans, revisionSchedule, today]);

  const ranking = useMemo(
    () =>
      rankTopics(state.subjects, state.topics, {
        date: today,
        examDate: state.profile.examDate,
      }),
    [state.subjects, state.topics, state.profile.examDate, today],
  );

  const stats = useMemo(
    () => overallStats(state.subjects, state.topics, state.dayLogs, state.profile),
    [state.subjects, state.topics, state.dayLogs, state.profile],
  );

  const bySubject = useMemo(
    () => subjectStats(state.subjects, state.topics),
    [state.subjects, state.topics],
  );

  const forecast = useMemo(
    () => forecastCapacity({ subjects: state.subjects, topics: state.topics, profile: state.profile }),
    [state.subjects, state.topics, state.profile],
  );

  const insights = useMemo(
    () =>
      generateInsights({
        subjects: state.subjects,
        topics: state.topics,
        profile: state.profile,
        dayLogs: state.dayLogs,
      }),
    [state.subjects, state.topics, state.profile, state.dayLogs],
  );

  const verdict = useMemo(
    () =>
      headlineVerdict({
        subjects: state.subjects,
        topics: state.topics,
        profile: state.profile,
        dayLogs: state.dayLogs,
      }),
    [state.subjects, state.topics, state.profile, state.dayLogs],
  );

  /* ───────────────────────────── actions ───────────────────────────── */

  const planFor = useCallback(
    (date) => {
      if (date === today) return todayPlan;
      const stored = state.plans[date];
      if (stored) return stored;
      // Future days are projected on demand so the calendar can preview them.
      if (date > today) {
        return generatePlan({
          subjects: state.subjects,
          topics: state.topics,
          profile: state.profile,
          revisionSchedule,
          date,
        });
      }
      return null;
    },
    [today, todayPlan, state.plans, state.subjects, state.topics, state.profile, revisionSchedule],
  );

  const actions = useMemo(() => {
    /** Persists today's derived plan so ticks survive a reload. */
    const commitPlan = (plan) => dispatch({ type: 'plan/set', date: plan.date, plan });

    return {
      signIn(name, email) {
        dispatch({
          type: 'account/set',
          account: { id: uid('acc'), name, email, createdAt: new Date().toISOString() },
        });
        dispatch({ type: 'profile/patch', patch: { name } });
      },

      signOut() {
        dispatch({ type: 'account/set', account: null });
      },

      completeOnboarding(patch) {
        dispatch({ type: 'profile/patch', patch: { ...patch, onboarded: true } });
      },

      updateProfile(patch) {
        dispatch({ type: 'profile/patch', patch });
      },

      addSubject({ name, code = '', importance = 3, difficulty = 'medium' }) {
        const subject = {
          id: uid('sub'),
          name: name.trim(),
          code: code.trim(),
          importance: Number(importance),
          difficulty,
          createdAt: new Date().toISOString(),
        };
        dispatch({ type: 'subject/add', subject });
        return subject;
      },

      updateSubject(id, patch) {
        dispatch({ type: 'subject/update', id, patch });
      },

      removeSubject(id) {
        dispatch({ type: 'subject/remove', id });
      },

      addTopic(subjectId, { name, difficulty = 'medium', estimatedMinutes = 60 }) {
        const topic = {
          id: uid('top'),
          subjectId,
          name: name.trim(),
          difficulty,
          estimatedMinutes: Number(estimatedMinutes),
          minutesDone: 0,
          status: 'pending',
          completedAt: null,
          deferCount: 0,
          revisionCount: 0,
          lastRevisedAt: null,
          createdAt: new Date().toISOString(),
        };
        dispatch({ type: 'topic/add', topic });
        return topic;
      },

      updateTopic(id, patch) {
        dispatch({ type: 'topic/update', id, patch });
      },

      removeTopic(id) {
        dispatch({ type: 'topic/remove', id });
      },

      /** Manual completion toggle from the Subjects page. */
      setTopicDone(id, done) {
        const topic = state.topics.find((t) => t.id === id);
        if (!topic) return;
        dispatch({
          type: 'topic/update',
          id,
          patch: done
            ? {
                status: 'done',
                minutesDone: topic.estimatedMinutes,
                completedAt: todayKey(),
              }
            : { status: 'pending', minutesDone: 0, completedAt: null },
        });
      },

      /**
       * Ticking a task credits its minutes to the topic. Crossing the estimate
       * completes the topic, which in turn puts it on the revision ladder.
       */
      toggleTask(taskId) {
        const plan = todayPlan;
        const task = plan.tasks.find((t) => t.id === taskId);
        if (!task) return;
        const nowDone = !task.done;

        commitPlan({
          ...plan,
          tasks: plan.tasks.map((t) => (t.id === taskId ? { ...t, done: nowDone } : t)),
        });

        if (!task.topicId) return;
        const topic = state.topics.find((t) => t.id === task.topicId);
        if (!topic) return;

        if (task.kind === 'study') {
          const delta = nowDone ? task.minutes : -task.minutes;
          const minutesDone = Math.max(0, (topic.minutesDone || 0) + delta);
          const complete = minutesDone >= topic.estimatedMinutes;
          dispatch({
            type: 'topic/update',
            id: topic.id,
            patch: {
              minutesDone,
              status: complete ? 'done' : minutesDone > 0 ? 'in_progress' : 'pending',
              completedAt: complete ? todayKey() : null,
            },
          });
        } else {
          dispatch({
            type: 'topic/update',
            id: topic.id,
            patch: {
              revisionCount: Math.max(0, (topic.revisionCount || 0) + (nowDone ? 1 : -1)),
              lastRevisedAt: nowDone ? todayKey() : topic.lastRevisedAt,
            },
          });
        }
      },

      /** Drops stored ticks for today and rebuilds from the current ranking. */
      regenerateToday() {
        dispatch({
          type: 'plan/set',
          date: todayKey(),
          plan: generatePlan({
            subjects: state.subjects,
            topics: state.topics,
            profile: state.profile,
            revisionSchedule,
            date: todayKey(),
          }),
        });
      },

      dismissAdjustments() {
        dispatch({ type: 'adjustments/seen' });
      },

      loadSample() {
        dispatch({ type: 'sample/load', payload: buildSampleSyllabus() });
      },

      resetAll() {
        clear();
        dispatch({ type: 'reset' });
      },
    };
  }, [state.topics, state.subjects, state.profile, todayPlan, revisionSchedule]);

  const value = useMemo(
    () => ({
      ...state,
      today,
      todayPlan,
      revisionSchedule,
      ranking,
      stats,
      bySubject,
      forecast,
      insights,
      verdict,
      planFor,
      budgetFor: (date) => budgetFor(state.profile, date),
      actions,
    }),
    [
      state,
      today,
      todayPlan,
      revisionSchedule,
      ranking,
      stats,
      bySubject,
      forecast,
      insights,
      verdict,
      planFor,
      actions,
    ],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside <AppProvider>');
  return ctx;
}
