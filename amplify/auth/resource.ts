import { defineAuth } from '@aws-amplify/backend';

/**
 * Amazon Cognito user pool — the single identity provider for StudyForge.
 *
 * Email is the sign-in identifier and the recovery channel, and new accounts confirm by
 * code. There is no social provider, no second user directory, and no unauthenticated
 * mode: every identity in the data layer comes from this pool.
 *
 * Deploy with `npx ampx sandbox` (personal sandbox) or through the Amplify pipeline.
 */
export const auth = defineAuth({
  loginWith: {
    email: {
      verificationEmailStyle: 'CODE',
      verificationEmailSubject: 'Your StudyForge confirmation code',
      verificationEmailBody: (createCode) => `Your StudyForge confirmation code is ${createCode()}.`,
    },
  },
  accountRecovery: 'EMAIL_ONLY',
});