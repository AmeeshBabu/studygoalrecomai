/**
 * Persistence adapter.
 *
 * Everything the app writes goes through save()/load(). Today that is
 * localStorage; when the Flask API lands, only this file and services/api.js
 * change, and no component needs touching.
 */

const KEY = 'cadence.state.v1';

export const emptyState = {
  version: 1,
  account: null,
  profile: {
    name: '',
    examName: '',
    examDate: '',
    dailyHours: 4,
    weekdayHours: {}, // weekday index -> hours override
    onboarded: false,
    theme: 'system',
    reduceMotion: false,
  },
  subjects: [],
  topics: [],
  plans: {},
  dayLogs: {},
  adjustments: [],
  adjustmentsSeen: true,
};

export function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed?.version !== emptyState.version) return null;
    // Merge so a state saved by an older build still boots with new defaults.
    return {
      ...emptyState,
      ...parsed,
      profile: { ...emptyState.profile, ...(parsed.profile || {}) },
    };
  } catch {
    return null;
  }
}

export function save(state) {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // Quota or private-mode failures are non-fatal: the session still works,
    // it just will not survive a reload.
  }
}

export function clear() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}
