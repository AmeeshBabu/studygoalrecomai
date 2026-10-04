import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowRightIcon, ArrowLeftIcon } from '@phosphor-icons/react';

import { Logo } from '../components/brand/Logo.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Field, Input } from '../components/ui/Field.jsx';
import { EXPO } from '../components/ui/Motion.jsx';
import { useApp } from '../store/AppProvider.jsx';

export default function SignIn() {
  const { profile, actions } = useApp();
  const navigate = useNavigate();

  const [mode, setMode] = useState('signup');
  const [values, setValues] = useState({ name: profile.name || '', email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);

  const isSignUp = mode === 'signup';
  const set = (key) => (e) => setValues((v) => ({ ...v, [key]: e.target.value }));

  function validate() {
    const next = {};
    if (isSignUp && !values.name.trim()) next.name = 'We need something to call you';
    if (!values.email.trim()) next.email = 'Enter your email';
    else if (!/^\S+@\S+\.\S+$/.test(values.email.trim())) next.email = 'That does not look like an email';
    if (values.password.length < 6) next.password = 'At least 6 characters';
    return next;
  }

  function onSubmit(e) {
    e.preventDefault();
    const found = validate();
    setErrors(found);
    if (Object.keys(found).length) return;

    setBusy(true);
    const name = isSignUp ? values.name.trim() : profile.name || values.email.split('@')[0];
    actions.signIn(name, values.email.trim());

    // Brief hold so the state change is legible rather than a jump cut.
    setTimeout(() => {
      setBusy(false);
      navigate(profile.onboarded ? '/app' : '/onboarding');
    }, 450);
  }

  return (
    <div className="grid min-h-dvh grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      {/* Form side */}
      <div className="flex flex-col px-5 py-8 sm:px-10">
        <div className="flex items-center justify-between">
          <Link to="/" aria-label="Cadence home">
            <Logo />
          </Link>
          <Button as={Link} to="/" variant="ghost" size="sm" icon={ArrowLeftIcon}>
            Back
          </Button>
        </div>

        <div className="flex flex-1 items-center justify-center py-12">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: EXPO }}
            className="w-full max-w-[380px]"
          >
            <h1 className="text-display text-[32px] font-semibold text-ink">
              {isSignUp ? 'Create your plan' : 'Welcome back'}
            </h1>
            <p className="mt-2 text-[14px] leading-relaxed text-ink-muted">
              {isSignUp
                ? 'Everything stays on this device. The account is just a name for your plan.'
                : 'Pick up where your schedule left off.'}
            </p>

            <form onSubmit={onSubmit} noValidate className="mt-8 flex flex-col gap-4">
              {isSignUp && (
                <Field label="Your name" htmlFor="name" error={errors.name} required>
                  <Input
                    id="name"
                    value={values.name}
                    onChange={set('name')}
                    invalid={!!errors.name}
                    autoComplete="name"
                    placeholder="Ameesh Kumar"
                  />
                </Field>
              )}

              <Field label="Email" htmlFor="email" error={errors.email} required>
                <Input
                  id="email"
                  type="email"
                  value={values.email}
                  onChange={set('email')}
                  invalid={!!errors.email}
                  autoComplete="email"
                  placeholder="you@college.edu"
                />
              </Field>

              <Field
                label="Password"
                htmlFor="password"
                error={errors.password}
                hint={isSignUp ? 'Six characters or more' : undefined}
                required
              >
                <Input
                  id="password"
                  type="password"
                  value={values.password}
                  onChange={set('password')}
                  invalid={!!errors.password}
                  autoComplete={isSignUp ? 'new-password' : 'current-password'}
                  placeholder="••••••••"
                />
              </Field>

              <Button type="submit" size="lg" loading={busy} className="mt-2 w-full" iconRight={ArrowRightIcon}>
                {isSignUp ? 'Create account' : 'Sign in'}
              </Button>
            </form>

            <p className="mt-6 text-center text-[13px] text-ink-muted">
              {isSignUp ? 'Already set up?' : 'New here?'}{' '}
              <button
                type="button"
                onClick={() => {
                  setMode(isSignUp ? 'signin' : 'signup');
                  setErrors({});
                }}
                className="font-medium text-accent transition-opacity hover:opacity-75"
              >
                {isSignUp ? 'Sign in' : 'Create an account'}
              </button>
            </p>
          </motion.div>
        </div>
      </div>

      {/* Quiet brand side. Hidden where it would only steal height. */}
      <div className="relative hidden overflow-hidden border-l border-line bg-surface lg:block">
        <div className="bg-grid pointer-events-none absolute inset-0 opacity-50" />
        <div className="relative flex h-full flex-col justify-center px-14">
          <blockquote className="max-w-[34ch]">
            <p className="text-display text-[34px] font-semibold text-ink">
              The plan is not the point. Finishing the syllabus is.
            </p>
            <p className="mt-6 max-w-[44ch] text-[14.5px] leading-relaxed text-ink-muted">
              Cadence keeps score of what is left, how long you have, and which topic earns the next
              hour of your attention.
            </p>
          </blockquote>
        </div>
      </div>
    </div>
  );
}
