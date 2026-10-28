/**
 * The single binding point between StudyForge's service layer and its data provider.
 *
 * Pages and components talk to src/services/* only — never to a provider directly —
 * so the provider is the one thing a deployment swaps. `VITE_DATA_PROVIDER` selects it:
 *
 *   'base44' — development provider, used by the preview build.
 *   'aws'    — AWS Amplify Gen 2 (Cognito identity + AppSync/DynamoDB).
 *
 * Ownership is never decided here. The AWS provider relies on the backend's per-owner
 * authorization; the `profile_id` it stamps comes from the verified session, never from
 * a value supplied by the browser.
 *
 * Production note: the development provider is imported statically, so an AWS build
 * should drop it — see "Removing the development provider" in docs/AWS_DEPLOYMENT.md.
 */
import { base44 } from '@/api/base44Client';
import { isAwsProvider } from '@/config/env';
import { createAwsProvider } from '@/services/aws/provider';
import type { DataProvider } from '@/types/services';

const developmentProvider = {
  name: 'base44',
  entities: base44.entities,
} as unknown as DataProvider;

export const provider: DataProvider = isAwsProvider() ? createAwsProvider() : developmentProvider;

export const entities = provider.entities;

export const providerName: DataProvider['name'] = provider.name;