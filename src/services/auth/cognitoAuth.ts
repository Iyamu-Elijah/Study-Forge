/**
 * Amazon Cognito authentication — the production implementation of AuthService.
 *
 * Wraps Amplify Auth. Nothing here stores a token by hand, logs a token, a password or
 * a confirmation code, or treats a user id supplied by the browser as proof of identity:
 * the session is always resolved from Cognito itself.
 */
import {
  confirmResetPassword,
  confirmSignIn,
  confirmSignUp as cognitoConfirmSignUp,
  fetchAuthSession,
  getCurrentUser,
  resendSignUpCode,
  resetPassword,
  signIn as cognitoSignIn,
  signOut as cognitoSignOut,
  signUp as cognitoSignUp,
} from 'aws-amplify/auth';
import { configureAmplify, isAmplifyConfigured } from '@/services/aws/amplifyClient';
import type { AppErrorCode, AuthService, AuthSession, AuthUser, SignInResult, SignUpResult } from '@/types/services';

type Listener = (session: AuthSession | null) => void;
const listeners = new Set<Listener>();

const notify = (session: AuthSession | null) => {
  listeners.forEach((listener) => listener(session));
};

/** Turns a Cognito failure into a user-safe message plus a code the UI can branch on. */
function toAuthError(error: unknown, fallback: string): Error & { code: AppErrorCode } {
  const name = String((error as { name?: string })?.name ?? '');
  const map: Record<string, { message: string; code: AppErrorCode }> = {
    // The same message for both, so the form never reveals whether an email is registered.
    NotAuthorizedException: { message: 'Email or password is incorrect.', code: 'unauthorized' },
    UserNotFoundException: { message: 'Email or password is incorrect.', code: 'unauthorized' },
    UserNotConfirmedException: { message: 'Confirm your email address before signing in.', code: 'unauthorized' },
    CodeMismatchException: { message: 'That code is not correct.', code: 'validation' },
    ExpiredCodeException: { message: 'That code has expired — request a new one.', code: 'validation' },
    InvalidPasswordException: {
      message: 'Choose a stronger password: at least 8 characters, with upper and lower case and a number.',
      code: 'validation',
    },
    InvalidParameterException: { message: 'Check the details you entered and try again.', code: 'validation' },
    UsernameExistsException: { message: 'An account with that email already exists — sign in instead.', code: 'conflict' },
    LimitExceededException: { message: 'Too many attempts. Please wait a moment and try again.', code: 'network' },
    TooManyRequestsException: { message: 'Too many attempts. Please wait a moment and try again.', code: 'network' },
    CodeDeliveryFailureException: { message: 'We could not send that email. Please try again.', code: 'network' },
    NetworkError: { message: 'We could not reach the sign-in service. Check your connection.', code: 'network' },
  };
  const mapped = map[name];
  const result = new Error(mapped?.message ?? fallback) as Error & { code: AppErrorCode };
  result.code = mapped?.code ?? 'unknown';
  return result;
}

const toAuthUser = (
  user: { userId: string; username?: string; signInDetails?: { loginId?: string } },
  payload: Record<string, unknown>,
): AuthUser => ({
  id: user.userId,
  email: String(payload.email ?? user.signInDetails?.loginId ?? user.username ?? ''),
  fullName: payload.name ? String(payload.name) : undefined,
  emailVerified: typeof payload.email_verified === 'boolean' ? payload.email_verified : undefined,
});

/** Resolves the current session from Cognito. Returns null when nobody is signed in. */
async function getSession(): Promise<AuthSession | null> {
  if (!isAmplifyConfigured()) return null;
  configureAmplify();
  try {
    const user = await getCurrentUser();
    const session = await fetchAuthSession();
    const payload = (session.tokens?.idToken?.payload ?? {}) as Record<string, unknown>;
    const expiration = session.tokens?.idToken?.expiration;
    return {
      user: toAuthUser(user, payload),
      expiresAt: expiration ? expiration.getTime() : undefined,
    };
  } catch {
    // No valid session — an expected outcome, not an error.
    return null;
  }
}

async function signIn(email: string, password: string): Promise<SignInResult> {
  configureAmplify();
  try {
    const result = await cognitoSignIn({ username: email.trim(), password });
    const step = result.nextStep?.signInStep;

    if (result.isSignedIn) {
      const session = await getSession();
      if (!session) throw new Error('Sign-in did not produce a session. Please try again.');
      notify(session);
      return { status: 'signed_in', session };
    }
    if (step === 'CONFIRM_SIGN_IN_WITH_NEW_PASSWORD_REQUIRED') return { status: 'new_password_required' };
    if (step === 'CONFIRM_SIGN_UP') return { status: 'confirmation_required' };

    // MFA/TOTP and other challenges are intentionally not part of this build.
    throw new Error('This account needs an extra verification step that StudyForge does not support yet.');
  } catch (error) {
    throw toAuthError(error, 'We could not sign you in. Please try again.');
  }
}

async function completeNewPassword(newPassword: string): Promise<AuthSession> {
  configureAmplify();
  try {
    const result = await confirmSignIn({ challengeResponse: newPassword });
    if (!result.isSignedIn) throw new Error('The new password was accepted, but the session could not be started.');
    const session = await getSession();
    if (!session) throw new Error('Sign-in did not produce a session. Please try again.');
    notify(session);
    return session;
  } catch (error) {
    throw toAuthError(error, 'We could not set that password. Please try again.');
  }
}

async function signUp(email: string, password: string, fullName?: string): Promise<SignUpResult> {
  configureAmplify();
  try {
    const result = await cognitoSignUp({
      username: email.trim(),
      password,
      options: {
        userAttributes: {
          email: email.trim(),
          ...(fullName ? { name: fullName } : {}),
        },
      },
    });
    return { needsConfirmation: !result.isSignUpComplete };
  } catch (error) {
    throw toAuthError(error, 'We could not create that account. Please try again.');
  }
}

async function confirmSignUp(email: string, code: string): Promise<void> {
  configureAmplify();
  try {
    await cognitoConfirmSignUp({ username: email.trim(), confirmationCode: code.trim() });
  } catch (error) {
    throw toAuthError(error, 'We could not confirm that account. Please try again.');
  }
}

async function resendConfirmationCode(email: string): Promise<void> {
  configureAmplify();
  try {
    await resendSignUpCode({ username: email.trim() });
  } catch (error) {
    throw toAuthError(error, 'We could not resend that code. Please try again.');
  }
}

async function requestPasswordReset(email: string): Promise<void> {
  configureAmplify();
  try {
    await resetPassword({ username: email.trim() });
  } catch (error) {
    // Never reveal whether an address is registered.
    if ((error as { name?: string })?.name === 'UserNotFoundException') return;
    throw toAuthError(error, 'We could not start a password reset. Please try again.');
  }
}

async function confirmPasswordReset(email: string, code: string, newPassword: string): Promise<void> {
  configureAmplify();
  try {
    await confirmResetPassword({
      username: email.trim(),
      confirmationCode: code.trim(),
      newPassword,
    });
  } catch (error) {
    throw toAuthError(error, 'We could not reset that password. Please try again.');
  }
}

async function signOut(): Promise<void> {
  configureAmplify();
  await cognitoSignOut();
  notify(null);
}

export const cognitoAuth: AuthService = {
  providerName: 'cognito',
  isConfigured: () => isAmplifyConfigured(),
  getSession,
  currentUser: async () => (await getSession())?.user ?? null,
  signIn,
  completeNewPassword,
  signUp,
  confirmSignUp,
  resendConfirmationCode,
  requestPasswordReset,
  confirmPasswordReset,
  signOut,
  subscribe: (listener: Listener) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
};