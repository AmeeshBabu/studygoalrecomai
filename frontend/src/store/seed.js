/**
 * Sample syllabus for a 6th-semester CSE student. Loaded only when the student
 * explicitly asks for it from onboarding or Settings, so it never masquerades
 * as their own data. A handful of topics are pre-completed with past dates so
 * the analytics, calendar and revision pages have real history to work from on
 * a fresh install.
 */

import { addDays, todayKey } from '../lib/date.js';
import { uid } from '../lib/utils.js';

const SYLLABUS = [
  {
    name: 'Database Management Systems',
    code: 'CS-601',
    importance: 5,
    difficulty: 'medium',
    topics: [
      ['ER Model and Extended ER', 'easy', 90, 'done', -14],
      ['Relational Algebra', 'medium', 105, 'done', -11],
      ['Functional Dependencies', 'medium', 90, 'done', -7],
      ['Normalisation up to BCNF', 'hard', 150, 'pending'],
      ['SQL Joins and Nested Queries', 'medium', 120, 'partial', null, 45],
      ['Transactions and Concurrency Control', 'hard', 165, 'pending'],
      ['Indexing and B+ Trees', 'hard', 135, 'pending'],
      ['Query Optimisation', 'medium', 90, 'pending'],
    ],
  },
  {
    name: 'Operating Systems',
    code: 'CS-602',
    importance: 4,
    difficulty: 'hard',
    topics: [
      ['Processes and Threads', 'easy', 75, 'done', -12],
      ['CPU Scheduling Algorithms', 'medium', 120, 'done', -6],
      ['Process Synchronisation', 'hard', 150, 'partial', null, 60],
      ['Deadlock Detection and Avoidance', 'hard', 135, 'pending'],
      ['Memory Management and Paging', 'hard', 150, 'pending'],
      ['Virtual Memory and Page Replacement', 'medium', 120, 'pending'],
      ['File Systems and Disk Scheduling', 'medium', 105, 'pending'],
    ],
  },
  {
    name: 'Artificial Intelligence',
    code: 'CS-611',
    importance: 5,
    difficulty: 'hard',
    topics: [
      ['Intelligent Agents and Environments', 'easy', 75, 'done', -9],
      ['Uninformed Search Strategies', 'medium', 105, 'done', -4],
      ['Informed Search and A*', 'hard', 150, 'pending'],
      ['Adversarial Search and Alpha-Beta', 'hard', 135, 'pending'],
      ['Constraint Satisfaction Problems', 'medium', 120, 'pending'],
      ['Propositional and First-Order Logic', 'hard', 165, 'pending'],
      ['Bayesian Networks', 'hard', 135, 'pending'],
    ],
  },
  {
    name: 'Computer Networks',
    code: 'CS-603',
    importance: 3,
    difficulty: 'medium',
    topics: [
      ['OSI and TCP/IP Reference Models', 'easy', 60, 'done', -13],
      ['Data Link Layer and Framing', 'medium', 90, 'done', -8],
      ['Error Detection and CRC', 'medium', 75, 'pending'],
      ['Routing Algorithms', 'hard', 135, 'pending'],
      ['TCP, UDP and Flow Control', 'medium', 120, 'pending'],
      ['Congestion Control', 'medium', 90, 'pending'],
      ['DNS, HTTP and Application Protocols', 'easy', 60, 'pending'],
    ],
  },
  {
    name: 'Theory of Computation',
    code: 'CS-604',
    importance: 3,
    difficulty: 'hard',
    topics: [
      ['Finite Automata: DFA and NFA', 'medium', 105, 'done', -10],
      ['Regular Expressions and Languages', 'medium', 90, 'pending'],
      ['Pumping Lemma', 'hard', 120, 'pending'],
      ['Context-Free Grammars', 'medium', 105, 'pending'],
      ['Pushdown Automata', 'hard', 135, 'pending'],
      ['Turing Machines and Decidability', 'hard', 150, 'pending'],
    ],
  },
  {
    name: 'Software Engineering',
    code: 'CS-605',
    importance: 2,
    difficulty: 'easy',
    topics: [
      ['SDLC Process Models', 'easy', 60, 'done', -15],
      ['Requirement Engineering', 'easy', 75, 'done', -5],
      ['UML and Design Patterns', 'medium', 105, 'pending'],
      ['Software Testing Strategies', 'medium', 90, 'pending'],
      ['Agile, Scrum and DevOps', 'easy', 60, 'pending'],
    ],
  },
];

export function buildSampleSyllabus() {
  const today = todayKey();
  const subjects = [];
  const topics = [];

  for (const entry of SYLLABUS) {
    const subjectId = uid('sub');
    subjects.push({
      id: subjectId,
      name: entry.name,
      code: entry.code,
      importance: entry.importance,
      difficulty: entry.difficulty,
      createdAt: new Date().toISOString(),
    });

    entry.topics.forEach(([name, difficulty, minutes, state, offset, partialMins]) => {
      const isDone = state === 'done';
      topics.push({
        id: uid('top'),
        subjectId,
        name,
        difficulty,
        estimatedMinutes: minutes,
        minutesDone: isDone ? minutes : partialMins || 0,
        status: isDone ? 'done' : partialMins ? 'in_progress' : 'pending',
        completedAt: isDone ? addDays(today, offset) : null,
        deferCount: 0,
        revisionCount: 0,
        lastRevisedAt: null,
        createdAt: new Date().toISOString(),
      });
    });
  }

  return { subjects, topics, dayLogs: buildSampleLogs(today) };
}

/**
 * Two weeks of plausible study history: mostly kept, two partial days and one
 * missed day, so the consistency and adaptive views have something honest to
 * show rather than a perfect 100% record.
 */
function buildSampleLogs(today) {
  const shape = [
    [15, 240, 240], [14, 240, 195], [13, 240, 240], [12, 210, 210],
    [11, 240, 150], [10, 240, 240], [9, 180, 180], [8, 240, 240],
    [7, 240, 0], [6, 240, 225], [5, 240, 240], [4, 240, 165],
    [3, 240, 240], [2, 210, 210], [1, 240, 195],
  ];

  const logs = {};
  for (const [ago, planned, completed] of shape) {
    const date = addDays(today, -ago);
    const status =
      completed === 0 ? 'missed' : completed >= planned ? 'complete' : 'partial';
    logs[date] = {
      date,
      plannedMinutes: planned,
      completedMinutes: completed,
      tasksTotal: Math.max(2, Math.round(planned / 75)),
      tasksDone:
        completed === 0
          ? 0
          : Math.max(1, Math.round((completed / planned) * Math.round(planned / 75))),
      status,
    };
  }
  return logs;
}
