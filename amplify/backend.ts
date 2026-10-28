import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { data } from './data/resource';

/**
 * StudyForge's AWS backend, defined in code (Amplify Gen 2).
 *
 * `defineBackend` provisions the Cognito user pool in amplify/auth and the AppSync data
 * API with its DynamoDB tables in amplify/data, and writes the frontend's public
 * configuration to `amplify_outputs.json` (which is generated at deploy time — never
 * committed, and never hand-edited).
 *
 * Nothing here has been provisioned: run `npx ampx sandbox` or the Amplify pipeline to
 * create these resources in your own account. See docs/AWS_DEPLOYMENT.md.
 *
 * Logging: Cognito, AppSync and any future Lambda function log to CloudWatch
 * automatically. The frontend must never log tokens or student content — see the
 * "Logging and monitoring" section of the deployment guide.
 */
export const backend = defineBackend({ auth, data });