/**
 * Amplify Gen 2 client setup — the single place AWS configuration enters the frontend.
 *
 * Only public identifiers (user pool, app client, GraphQL endpoint, region) are read,
 * and they come from environment variables. There is no credential, secret key, or
 * service-role token anywhere in this file, and none may be added: every request is
 * authorized by the signed-in student's Cognito identity.
 *
 * The client is built lazily so a development build never initializes AWS code.
 */
import { Amplify } from 'aws-amplify';
import { generateClient } from 'aws-amplify/data';
import { AWS, isAwsAuthConfigured, isAwsDataConfigured } from '@/config/env';
import type { AmplifyDataClient } from '@/types/services';

let configured = false;
let dataClient: AmplifyDataClient | null = null;

export const isAmplifyConfigured = () => isAwsAuthConfigured() && isAwsDataConfigured();

export function configureAmplify(): void {
  if (configured) return;

  if (!isAmplifyConfigured()) {
    const error = new Error(
      'AWS is not configured. Set VITE_APPSYNC_ENDPOINT, VITE_AWS_REGION, VITE_COGNITO_USER_POOL_ID and VITE_COGNITO_CLIENT_ID — see docs/AWS_DEPLOYMENT.md.',
    ) as Error & { code?: string };
    error.code = 'not_configured';
    throw error;
  }

  Amplify.configure(
    {
      Auth: {
        Cognito: {
          userPoolId: AWS.cognitoUserPoolId,
          userPoolClientId: AWS.cognitoClientId,
          ...(AWS.cognitoIdentityPoolId ? { identityPoolId: AWS.cognitoIdentityPoolId } : {}),
        },
      },
      API: {
        GraphQL: {
          endpoint: AWS.graphqlEndpoint,
          region: AWS.amplifyRegion,
          // Every request carries the student's Cognito access token. There is no
          // API-key or public mode: the backend authorizes each record by owner.
          defaultAuthMode: 'userPool',
        },
      },
    },
    { ssr: false },
  );

  configured = true;
}

export function getDataClient(): AmplifyDataClient {
  if (!dataClient) {
    configureAmplify();
    dataClient = generateClient() as unknown as AmplifyDataClient;
  }
  return dataClient;
}