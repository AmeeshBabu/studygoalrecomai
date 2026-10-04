import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  BooksIcon,
  DotsThreeIcon,
  MagnifyingGlassIcon,
  NotePencilIcon,
  PlusIcon,
  StackPlusIcon,
  TrashIcon,
} from '@phosphor-icons/react';

import { PageHeader } from '../components/layout/PageHeader.jsx';
import { Button, IconButton } from '../components/ui/Button.jsx';
import { Card, Panel, Stat } from '../components/ui/Card.jsx';
import { Badge, DifficultyTag, ImportanceMeter, SubjectMark } from '../components/ui/Badge.jsx';
import { ProgressBar } from '../components/ui/Progress.jsx';
import { EmptyState } from '../components/ui/States.jsx';
import { Field, Input, Select } from '../components/ui/Field.jsx';
import { SegmentedControl } from '../components/ui/Controls.jsx';
import { Modal, ConfirmDialog } from '../components/ui/Modal.jsx';
import { Reveal, EXPO } from '../components/ui/Motion.jsx';
import { useApp } from '../store/AppProvider.jsx';
import { DIFFICULTY, IMPORTANCE_LABELS, minutesRemaining } from '../engine/scoring.js';
import { formatMinutes } from '../lib/date.js';
import { cn, plural, sum } from '../lib/utils.js';

const DIFFICULTY_OPTIONS = [
  { value: 'easy', label: 'Easy' },
  { value: 'medium', label: 'Medium' },
  { value: 'hard', label: 'Hard' },
];

export default function Subjects() {
  const { subjects, topics, bySubject, actions } = useApp();

  const [selectedId, setSelectedId] = useState(subjects[0]?.id ?? null);
  const [query, setQuery] = useState('');
  const [subjectForm, setSubjectForm] = useState(null); // null | {} | subject
  const [topicForm, setTopicForm] = useState(null);
  const [confirm, setConfirm] = useState(null); // {kind, id, name}

  /* Keep the selection valid as subjects come and go. */
  useEffect(() => {
    if (!subjects.length) setSelectedId(null);
    else if (!subjects.some((s) => s.id === selectedId)) setSelectedId(subjects[0].id);
  }, [subjects, selectedId]);

  const selected = subjects.find((s) => s.id === selectedId) ?? null;
  const selectedStats = bySubject.find((s) => s.subject.id === selectedId) ?? null;

  const ownTopics = useMemo(() => {
    const own = topics.filter((t) => t.subjectId === selectedId);
    const q = query.trim().toLowerCase();
    return q ? own.filter((t) => t.name.toLowerCase().includes(q)) : own;
  }, [topics, selectedId, query]);

  if (!subjects.length) {
    return (
      <>
        <PageHeader
          title="Subjects and topics"
          description="Your syllabus. Everything the planner ranks comes from here."
        />
        <Panel>
          <EmptyState
            icon={BooksIcon}
            title="Your syllabus is empty"
            description="Add a subject, give it an exam weight, then break it into topics. The engine starts ranking as soon as the first topic exists."
            action={
              <>
                <Button icon={PlusIcon} onClick={() => setSubjectForm({})}>
                  Add a subject
                </Button>
                <Button variant="secondary" onClick={actions.loadSample}>
                  Load the sample syllabus
                </Button>
              </>
            }
          />
        </Panel>
        <SubjectModal
          state={subjectForm}
          onClose={() => setSubjectForm(null)}
          onSave={(values) => {
            const created = actions.addSubject(values);
            setSelectedId(created.id);
            setSubjectForm(null);
          }}
        />
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Subjects and topics"
        description="Your syllabus. Exam weight and difficulty here are what drive the priority score."
        actions={
          <Button icon={PlusIcon} onClick={() => setSubjectForm({})}>
            Add subject
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[292px_minmax(0,1fr)]">
        {/* ── Subject rail ───────────────────────────────────────────────── */}
        <Reveal>
          <nav aria-label="Subjects" className="flex flex-col gap-2">
            {bySubject.map((s) => {
              const active = s.subject.id === selectedId;
              return (
                <button
                  key={s.subject.id}
                  type="button"
                  onClick={() => setSelectedId(s.subject.id)}
                  aria-current={active ? 'true' : undefined}
                  className={cn(
                    'group relative rounded-card border p-3.5 text-left transition-colors duration-200',
                    active
                      ? 'border-accent/45 bg-accent-soft'
                      : 'border-line bg-surface hover:border-line-strong',
                  )}
                >
                  <div className="flex items-center gap-3">
                    <SubjectMark name={s.subject.name} size="sm" active={active} />
                    <div className="min-w-0 flex-1">
                      <p
                        className={cn(
                          'truncate text-[13.5px] font-medium',
                          active ? 'text-accent' : 'text-ink',
                        )}
                      >
                        {s.subject.name}
                      </p>
                      <p className="mt-0.5 truncate text-[11.5px] text-ink-muted">
                        {s.doneCount}/{s.topicCount} topics · {formatMinutes(s.remainingMinutes)} left
                      </p>
                    </div>
                    <span className="shrink-0 font-mono text-[12px] font-medium text-ink-soft tabular-nums">
                      {s.completion}%
                    </span>
                  </div>
                  <ProgressBar
                    className="mt-3"
                    value={s.completion}
                    size="xs"
                    animate={false}
                    tone="accent"
                  />
                </button>
              );
            })}
          </nav>
        </Reveal>

        {/* ── Detail ─────────────────────────────────────────────────────── */}
        <Reveal delay={0.05}>
          <AnimatePresence mode="wait">
            <motion.div
              key={selectedId ?? 'none'}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.25, ease: EXPO }}
            >
              {selected && selectedStats && (
                <>
                  <Panel className="p-5">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="flex min-w-0 items-start gap-3.5">
                        <SubjectMark name={selected.name} size="lg" />
                        <div className="min-w-0">
                          <h2 className="font-display text-[19px] leading-tight font-semibold tracking-[-0.02em] text-ink">
                            {selected.name}
                          </h2>
                          <div className="mt-2 flex flex-wrap items-center gap-2.5">
                            {selected.code && <Badge>{selected.code}</Badge>}
                            <DifficultyTag difficulty={selected.difficulty} />
                            <ImportanceMeter value={selected.importance} />
                          </div>
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-1">
                        <IconButton
                          icon={NotePencilIcon}
                          label="Edit subject"
                          onClick={() => setSubjectForm(selected)}
                        />
                        <IconButton
                          icon={TrashIcon}
                          label="Delete subject"
                          onClick={() =>
                            setConfirm({ kind: 'subject', id: selected.id, name: selected.name })
                          }
                        />
                      </div>
                    </div>

                    <div className="mt-6 grid grid-cols-2 gap-5 border-t border-line pt-5 sm:grid-cols-4">
                      <Stat label="Completed" value={`${selectedStats.completion}%`} tone="accent" />
                      <Stat
                        label="Topics done"
                        value={`${selectedStats.doneCount}/${selectedStats.topicCount}`}
                      />
                      <Stat label="Time left" value={formatMinutes(selectedStats.remainingMinutes)} />
                      <Stat
                        label="Hard pending"
                        value={selectedStats.hardPending}
                        tone={selectedStats.hardPending > 0 ? 'high' : 'default'}
                      />
                    </div>
                  </Panel>

                  {/* Topic list */}
                  <div className="mt-6 mb-4 flex flex-wrap items-center justify-between gap-3">
                    <h3 className="font-display text-lg font-semibold tracking-[-0.02em] text-ink">
                      Topics
                      <span className="ml-2 font-mono text-[13px] font-normal text-ink-faint">
                        {selectedStats.topicCount}
                      </span>
                    </h3>
                    <div className="flex items-center gap-2">
                      {selectedStats.topicCount > 4 && (
                        <label className="relative">
                          <MagnifyingGlassIcon
                            size={15}
                            className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-ink-faint"
                          />
                          <Input
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Find a topic"
                            className="h-9 w-[190px] pl-9 text-[13px]"
                            aria-label="Search topics"
                          />
                        </label>
                      )}
                      <Button
                        size="sm"
                        icon={StackPlusIcon}
                        onClick={() => setTopicForm({ subjectId: selected.id })}
                      >
                        Add topic
                      </Button>
                    </div>
                  </div>

                  {ownTopics.length === 0 ? (
                    <Card>
                      <EmptyState
                        compact
                        icon={StackPlusIcon}
                        title={query ? 'No topic matches that search' : 'No topics in this subject'}
                        description={
                          query
                            ? 'Try a shorter search, or clear it to see everything.'
                            : 'Break the subject into chapters. Each one needs a difficulty and a rough time estimate so the planner can box it into a day.'
                        }
                        action={
                          query ? (
                            <Button size="sm" variant="secondary" onClick={() => setQuery('')}>
                              Clear search
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              icon={PlusIcon}
                              onClick={() => setTopicForm({ subjectId: selected.id })}
                            >
                              Add the first topic
                            </Button>
                          )
                        }
                      />
                    </Card>
                  ) : (
                    <ul className="flex flex-col gap-2.5">
                      {ownTopics.map((topic, i) => (
                        <TopicRow
                          key={topic.id}
                          topic={topic}
                          index={i}
                          onToggle={() => actions.setTopicDone(topic.id, topic.status !== 'done')}
                          onEdit={() => setTopicForm(topic)}
                          onDelete={() =>
                            setConfirm({ kind: 'topic', id: topic.id, name: topic.name })
                          }
                        />
                      ))}
                    </ul>
                  )}
                </>
              )}
            </motion.div>
          </AnimatePresence>
        </Reveal>
      </div>

      <SubjectModal
        state={subjectForm}
        onClose={() => setSubjectForm(null)}
        onSave={(values) => {
          if (subjectForm?.id) actions.updateSubject(subjectForm.id, values);
          else {
            const created = actions.addSubject(values);
            setSelectedId(created.id);
          }
          setSubjectForm(null);
        }}
      />

      <TopicModal
        state={topicForm}
        onClose={() => setTopicForm(null)}
        onSave={(values) => {
          if (topicForm?.id) actions.updateTopic(topicForm.id, values);
          else actions.addTopic(topicForm.subjectId, values);
          setTopicForm(null);
        }}
      />

      <ConfirmDialog
        open={!!confirm}
        onClose={() => setConfirm(null)}
        onConfirm={() => {
          if (confirm.kind === 'subject') actions.removeSubject(confirm.id);
          else actions.removeTopic(confirm.id);
          setConfirm(null);
        }}
        title={confirm?.kind === 'subject' ? 'Delete this subject?' : 'Delete this topic?'}
        description={
          confirm?.kind === 'subject'
            ? `"${confirm?.name}" and every topic inside it will be removed from the syllabus. Plans already logged keep their history.`
            : `"${confirm?.name}" will be removed from the syllabus and from any future plan.`
        }
      />
    </>
  );
}

/* ─────────────────────────────── topic row ─────────────────────────────── */

function TopicRow({ topic, index, onToggle, onEdit, onDelete }) {
  const [menu, setMenu] = useState(false);
  const done = topic.status === 'done';
  const progress = topic.estimatedMinutes
    ? Math.round(((topic.minutesDone || 0) / topic.estimatedMinutes) * 100)
    : 0;

  return (
    <motion.li
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: Math.min(index * 0.03, 0.25), ease: EXPO }}
      className={cn(
        'group rounded-card border bg-surface px-4 py-3.5 transition-colors duration-200',
        done ? 'border-line/60' : 'border-line hover:border-line-strong',
      )}
    >
      <div className="flex items-center gap-3.5">
        <button
          type="button"
          role="checkbox"
          aria-checked={done}
          aria-label={`Mark ${topic.name} as ${done ? 'not done' : 'done'}`}
          onClick={onToggle}
          className={cn(
            'grid size-[22px] shrink-0 place-items-center rounded-full border text-[11px] transition-colors',
            done
              ? 'border-transparent bg-accent text-accent-ink'
              : 'border-line-strong text-transparent hover:border-accent hover:bg-accent-soft',
          )}
        >
          ✓
        </button>

        <div className="min-w-0 flex-1">
          <p
            className={cn(
              'truncate text-[14px] font-medium',
              done ? 'text-ink-faint line-through' : 'text-ink',
            )}
          >
            {topic.name}
          </p>
          <p className="mt-0.5 text-[11.5px] text-ink-muted">
            {done
              ? `Completed · ${formatMinutes(topic.estimatedMinutes)}`
              : topic.minutesDone > 0
                ? `${formatMinutes(topic.minutesDone)} of ${formatMinutes(topic.estimatedMinutes)} done`
                : `${formatMinutes(topic.estimatedMinutes)} estimated`}
            {topic.deferCount > 0 && ` · deferred ${topic.deferCount}×`}
          </p>
        </div>

        <div className="hidden shrink-0 items-center gap-2 sm:flex">
          {topic.revisionCount > 0 && (
            <Badge tone="accent">{plural(topic.revisionCount, 'revision')}</Badge>
          )}
          <DifficultyTag difficulty={topic.difficulty} />
        </div>

        <div className="relative shrink-0">
          <IconButton
            icon={DotsThreeIcon}
            label={`Actions for ${topic.name}`}
            onClick={() => setMenu((v) => !v)}
          />
          <AnimatePresence>
            {menu && (
              <>
                <button
                  type="button"
                  aria-hidden
                  tabIndex={-1}
                  className="fixed inset-0 z-10 cursor-default"
                  onClick={() => setMenu(false)}
                />
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -4 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -4 }}
                  transition={{ duration: 0.15, ease: EXPO }}
                  className="absolute top-full right-0 z-20 mt-1 w-40 origin-top-right overflow-hidden rounded-card border border-line bg-surface p-1 shadow-lift"
                >
                  <MenuItem
                    icon={NotePencilIcon}
                    label="Edit topic"
                    onClick={() => {
                      setMenu(false);
                      onEdit();
                    }}
                  />
                  <MenuItem
                    icon={TrashIcon}
                    label="Delete"
                    danger
                    onClick={() => {
                      setMenu(false);
                      onDelete();
                    }}
                  />
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>

      {!done && topic.minutesDone > 0 && (
        <ProgressBar className="mt-3" value={progress} size="xs" animate={false} />
      )}
    </motion.li>
  );
}

function MenuItem({ icon: Icon, label, onClick, danger }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex w-full items-center gap-2.5 rounded-[10px] px-2.5 py-2 text-left text-[13px] transition-colors',
        danger
          ? 'text-high-700 hover:bg-high-50 dark:text-high-500 dark:hover:bg-high-900/30'
          : 'text-ink-soft hover:bg-raised hover:text-ink',
      )}
    >
      <Icon size={15} weight="bold" />
      {label}
    </button>
  );
}

/* ──────────────────────────────── modals ───────────────────────────────── */

function SubjectModal({ state, onClose, onSave }) {
  const editing = Boolean(state?.id);
  const [values, setValues] = useState({ name: '', code: '', importance: 3, difficulty: 'medium' });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!state) return;
    setValues({
      name: state.name ?? '',
      code: state.code ?? '',
      importance: state.importance ?? 3,
      difficulty: state.difficulty ?? 'medium',
    });
    setErrors({});
  }, [state]);

  const submit = (e) => {
    e.preventDefault();
    if (!values.name.trim()) return setErrors({ name: 'Give the subject a name' });
    onSave({ ...values, importance: Number(values.importance) });
  };

  return (
    <Modal
      open={!!state}
      onClose={onClose}
      title={editing ? 'Edit subject' : 'Add a subject'}
      description="Exam weight and difficulty feed directly into the priority score, so they are worth getting roughly right."
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button form="subject-form" type="submit">
            {editing ? 'Save changes' : 'Add subject'}
          </Button>
        </>
      }
    >
      <form id="subject-form" onSubmit={submit} noValidate className="flex flex-col gap-5">
        <Field label="Subject name" htmlFor="sub-name" error={errors.name} required>
          <Input
            id="sub-name"
            autoFocus
            value={values.name}
            invalid={!!errors.name}
            onChange={(e) => setValues((v) => ({ ...v, name: e.target.value }))}
            placeholder="Database Management Systems"
          />
        </Field>

        <Field label="Course code" htmlFor="sub-code" hint="Optional.">
          <Input
            id="sub-code"
            value={values.code}
            onChange={(e) => setValues((v) => ({ ...v, code: e.target.value }))}
            placeholder="CS301"
          />
        </Field>

        <Field
          label="Exam weight"
          htmlFor="sub-importance"
          hint="How much this subject is worth relative to the others."
        >
          <Select
            id="sub-importance"
            value={values.importance}
            onChange={(e) => setValues((v) => ({ ...v, importance: e.target.value }))}
          >
            {[5, 4, 3, 2, 1].map((n) => (
              <option key={n} value={n}>
                {IMPORTANCE_LABELS[n]}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Overall difficulty" hint="Blended with each topic's own rating when scoring.">
          <SegmentedControl
            options={DIFFICULTY_OPTIONS}
            value={values.difficulty}
            onChange={(difficulty) => setValues((v) => ({ ...v, difficulty }))}
          />
        </Field>
      </form>
    </Modal>
  );
}

function TopicModal({ state, onClose, onSave }) {
  const editing = Boolean(state?.id);
  const [values, setValues] = useState({ name: '', difficulty: 'medium', estimatedMinutes: 60 });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!state) return;
    setValues({
      name: state.name ?? '',
      difficulty: state.difficulty ?? 'medium',
      estimatedMinutes: state.estimatedMinutes ?? 60,
    });
    setErrors({});
  }, [state]);

  const submit = (e) => {
    e.preventDefault();
    const next = {};
    if (!values.name.trim()) next.name = 'Give the topic a name';
    if (!values.estimatedMinutes || values.estimatedMinutes < 10)
      next.estimatedMinutes = 'At least 10 minutes';
    setErrors(next);
    if (Object.keys(next).length) return;
    onSave({ ...values, estimatedMinutes: Number(values.estimatedMinutes) });
  };

  return (
    <Modal
      open={!!state}
      onClose={onClose}
      title={editing ? 'Edit topic' : 'Add a topic'}
      description="Estimates do not need to be perfect. They set how much of a day the topic can claim."
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button form="topic-form" type="submit">
            {editing ? 'Save changes' : 'Add topic'}
          </Button>
        </>
      }
    >
      <form id="topic-form" onSubmit={submit} noValidate className="flex flex-col gap-5">
        <Field label="Topic name" htmlFor="top-name" error={errors.name} required>
          <Input
            id="top-name"
            autoFocus
            value={values.name}
            invalid={!!errors.name}
            onChange={(e) => setValues((v) => ({ ...v, name: e.target.value }))}
            placeholder="Normalization and functional dependencies"
          />
        </Field>

        <Field label="Difficulty" hint="Hard topics are scheduled earlier and revised more often.">
          <SegmentedControl
            options={DIFFICULTY_OPTIONS}
            value={values.difficulty}
            onChange={(difficulty) => setValues((v) => ({ ...v, difficulty }))}
          />
        </Field>

        <Field
          label="Estimated study time"
          htmlFor="top-mins"
          error={errors.estimatedMinutes}
          hint={`Sittings are capped at 90 minutes, so anything longer is split across days.`}
          required
        >
          <div className="flex items-center gap-3">
            <Input
              id="top-mins"
              type="number"
              min={10}
              max={600}
              step={15}
              className="w-28"
              value={values.estimatedMinutes}
              invalid={!!errors.estimatedMinutes}
              onChange={(e) => setValues((v) => ({ ...v, estimatedMinutes: e.target.value }))}
            />
            <span className="font-mono text-[12.5px] text-ink-muted">
              {formatMinutes(Number(values.estimatedMinutes) || 0)}
            </span>
          </div>
        </Field>
      </form>
    </Modal>
  );
}
