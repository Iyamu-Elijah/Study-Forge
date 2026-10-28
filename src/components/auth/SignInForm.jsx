import { useState } from 'react';
import { GraduationCap } from 'lucide-react';
import { authService } from '@/services/auth';
import { APP } from '@/config/env';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';

/**
 * Sign-in screen for the Cognito deployment.
 *
 * Handles the whole account lifecycle this build supports: signing in, choosing a
 * password when Cognito asks for one, confirming a new account by code, signing up, and
 * resetting a forgotten password. Every step reports its own loading, error and success
 * state, and no message reveals whether an email address is registered.
 */
export default function SignInForm() {
  const [mode, setMode] = useState('signin');
  const [form, setForm] = useState({ email: '', password: '', fullName: '', code: '', newPassword: '' });
  const [status, setStatus] = useState({ busy: false, error: null, notice: null });

  const set = (field) => (event) => setForm((prev) => ({ ...prev, [field]: event.target.value }));

  const run = async (work) => {
    setStatus({ busy: true, error: null, notice: null });
    try {
      await work();
    } catch (error) {
      setStatus({ busy: false, error: error?.message || 'Something went wrong. Please try again.', notice: null });
    }
  };

  const goTo = (nextMode, notice = null) => setStatus({ busy: false, error: null, notice });

  const submitSignIn = (event) => {
    event.preventDefault();
    run(async () => {
      const result = await authService.signIn(form.email, form.password);
      if (result.status === 'new_password_required') {
        goTo('newPassword', 'Your account needs a new password before you can continue.');
        return;
      }
      if (result.status === 'confirmation_required') {
        goTo('confirm', 'Confirm your email address to finish setting up your account.');
        return;
      }
      // A signed-in session opens the app through the auth gate's subscription.
    });
  };

  const submitNewPassword = (event) => {
    event.preventDefault();
    run(async () => {
      await authService.completeNewPassword(form.newPassword);
    });
  };

  const submitConfirm = (event) => {
    event.preventDefault();
    run(async () => {
      await authService.confirmSignUp(form.email, form.code);
      goTo('signin', 'Account confirmed. Sign in to continue.');
    });
  };

  const submitSignUp = (event) => {
    event.preventDefault();
    run(async () => {
      const result = await authService.signUp(form.email, form.password, form.fullName);
      if (result.needsConfirmation) {
        goTo('confirm', 'Check your email for a confirmation code.');
        return;
      }
      goTo('signin', 'Account created. Sign in to continue.');
    });
  };

  const submitResetRequest = (event) => {
    event.preventDefault();
    run(async () => {
      await authService.requestPasswordReset(form.email);
      goTo('resetConfirm', 'If that email has an account, a reset code is on its way.');
    });
  };

  const submitResetConfirm = (event) => {
    event.preventDefault();
    run(async () => {
      await authService.confirmPasswordReset(form.email, form.code, form.newPassword);
      goTo('signin', 'Password updated. Sign in with your new password.');
    });
  };

  const resend = () =>
    run(async () => {
      await authService.resendConfirmationCode(form.email);
      setStatus({ busy: false, error: null, notice: 'A new code is on its way.' });
    });

  const titles = {
    signin: 'Sign in to StudyForge',
    newPassword: 'Choose a new password',
    confirm: 'Confirm your email',
    signup: 'Create your account',
    resetRequest: 'Reset your password',
    resetConfirm: 'Enter your reset code',
  };

  const descriptions = {
    signin: 'Use the email address you registered with.',
    newPassword: 'Cognito requires a new password for this account.',
    confirm: 'Enter the code we emailed you.',
    signup: 'Your records stay private to your account.',
    resetRequest: 'We will email you a code to set a new password.',
    resetConfirm: 'Choose a new password for your account.',
  };

  const onSubmit = {
    signin: submitSignIn,
    newPassword: submitNewPassword,
    confirm: submitConfirm,
    signup: submitSignUp,
    resetRequest: submitResetRequest,
    resetConfirm: submitResetConfirm,
  }[mode];

  const needsEmail = mode !== 'newPassword';
  const needsPassword = mode === 'signin' || mode === 'signup';
  const needsNewPassword = mode === 'newPassword' || mode === 'resetConfirm';
  const needsCode = mode === 'confirm' || mode === 'resetConfirm';

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-4 py-10">
      <div className="mb-6 flex items-center gap-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <GraduationCap className="h-5 w-5" />
        </span>
        <span className="font-heading text-lg font-semibold">{APP.name}</span>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{titles[mode]}</CardTitle>
          <CardDescription>{descriptions[mode]}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            {status.error ? (
              <Alert variant="destructive">
                <AlertDescription>{status.error}</AlertDescription>
              </Alert>
            ) : null}
            {status.notice ? (
              <Alert>
                <AlertDescription>{status.notice}</AlertDescription>
              </Alert>
            ) : null}

            {mode === 'signup' ? (
              <div className="space-y-2">
                <Label htmlFor="fullName">Full name</Label>
                <Input id="fullName" value={form.fullName} onChange={set('fullName')} autoComplete="name" required />
              </div>
            ) : null}

            {needsEmail ? (
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={set('email')}
                  autoComplete="email"
                  required
                />
              </div>
            ) : null}

            {needsPassword ? (
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={form.password}
                  onChange={set('password')}
                  autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                  required
                />
              </div>
            ) : null}

            {needsCode ? (
              <div className="space-y-2">
                <Label htmlFor="code">Confirmation code</Label>
                <Input id="code" inputMode="numeric" value={form.code} onChange={set('code')} required />
              </div>
            ) : null}

            {needsNewPassword ? (
              <div className="space-y-2">
                <Label htmlFor="newPassword">New password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={form.newPassword}
                  onChange={set('newPassword')}
                  autoComplete="new-password"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  At least 8 characters, with upper and lower case and a number.
                </p>
              </div>
            ) : null}

            <Button type="submit" className="w-full" disabled={status.busy}>
              {status.busy ? 'Working…' : titles[mode]}
            </Button>
          </form>

          <div className="mt-4 flex flex-wrap justify-between gap-2 text-sm">
            {mode === 'signin' ? (
              <>
                <button type="button" className="text-primary underline-offset-4 hover:underline" onClick={() => goTo('signup')}>
                  Create an account
                </button>
                <button
                  type="button"
                  className="text-muted-foreground underline-offset-4 hover:underline"
                  onClick={() => goTo('resetRequest')}
                >
                  Forgot password?
                </button>
              </>
            ) : null}

            {mode === 'signup' || mode === 'resetRequest' ? (
              <button type="button" className="text-primary underline-offset-4 hover:underline" onClick={() => goTo('signin')}>
                Back to sign in
              </button>
            ) : null}

            {mode === 'confirm' ? (
              <button type="button" className="text-muted-foreground underline-offset-4 hover:underline" onClick={resend} disabled={status.busy}>
                Resend the code
              </button>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}