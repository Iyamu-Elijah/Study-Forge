/**
 * Development-only authentication stub.
 *
 * It exists so the interface can run without AWS credentials: it reports
 * `isConfigured() === false`, issues no session, and every sign-in call explains what
 * to configure. It is never selected when VITE_AUTH_PROVIDER=cognito, and it is not a
 * second authentication system — it authenticates nobody.
 */
import type { AuthService } from '@/types/services';

const notConfigured = (action: string): Error & { code: 'not_configured' } => {
  const error = new Error(
    `Sign-in is not configured in this build (${action}). Set VITE_AUTH_PROVIDER=cognito and the Cognito variables to enable it.`,
  ) as Error & { code: 'not_configured' };
  error.code = 'not_configured';
  return error;
};

export const devAuth: AuthService = {
  providerName: 'dev',
  isConfigured: () => false,
  getSession: async () => null,
  currentUser: async () => null,
  signIn: async () => {
    throw notConfigured('signIn');
  },
  completeNewPassword: async () => {
    throw notConfigured('completeNewPassword');
  },
  signUp: async () => {
    throw notConfigured('signUp');
  },
  confirmSignUp: async () => {
    throw notConfigured('confirmSignUp');
  },
  resendConfirmationCode: async () => {
    throw notConfigured('resendConfirmationCode');
  },
  requestPasswordReset: async () => {
    throw notConfigured('requestPasswordReset');
  },
  confirmPasswordReset: async () => {
    throw notConfigured('confirmPasswordReset');
  },
  signOut: async () => {},
  subscribe: () => () => {},
};