/**
 * Environment configuration for StudyForge.
 *
 * Every environment-specific value lives here — never in component code — so the same
 * source can be built for AWS Amplify Hosting (or Netlify) by setting variables in the
 * host's console.
 *
 * Only public, browser-safe values are read here. No AWS secret key, access key, or
 * service credential may ever appear in a `VITE_` variable: anything with that prefix
 * ships to the browser. See docs/AWS_DEPLOYMENT.md.
 */

const read = (key, fallback = '') => {
  try {
    const value = import.meta.env?.[key];
    return value === undefined || value === '' ? fallback : value;
  } catch {
    return fallback;
  }
};

export const APP = {
  name: read('VITE_APP_NAME', 'StudyForge'),
  tagline: read('VITE_APP_TAGLINE', 'Your academic life, organised.'),
  supportEmail: read('VITE_SUPPORT_EMAIL', ''),
};

/**
 * 'base44' — the development provider that powers the preview build.
 * 'aws'    — AWS Amplify Gen 2 (Cognito identity + AppSync/DynamoDB data).
 */
export const DATA_PROVIDER = read('VITE_DATA_PROVIDER', 'base44');

/**
 * 'none'    — no sign-in wall (development only).
 * 'cognito' — Amazon Cognito user pool; the production identity provider.
 */
export const AUTH_PROVIDER = read('VITE_AUTH_PROVIDER', 'none');

/** Public identifiers only. These are safe in the browser; credentials are not. */
export const AWS = {
  region: read('VITE_AWS_REGION'),
  amplifyRegion: read('VITE_AMPLIFY_REGION', read('VITE_AWS_REGION')),
  graphqlEndpoint: read('VITE_APPSYNC_ENDPOINT'),
  cognitoRegion: read('VITE_COGNITO_REGION', read('VITE_AWS_REGION')),
  cognitoUserPoolId: read('VITE_COGNITO_USER_POOL_ID'),
  cognitoClientId: read('VITE_COGNITO_CLIENT_ID'),
  cognitoIdentityPoolId: read('VITE_COGNITO_IDENTITY_POOL_ID'),
  storageBucket: read('VITE_S3_BUCKET'),
};

export const isAwsProvider = () => DATA_PROVIDER === 'aws';
export const isCognitoAuth = () => AUTH_PROVIDER === 'cognito';

/** True once the Cognito user pool identifiers are present. */
export const isAwsAuthConfigured = () => Boolean(AWS.cognitoUserPoolId && AWS.cognitoClientId);

/** True once the data API endpoint and region are present. */
export const isAwsDataConfigured = () => Boolean(AWS.graphqlEndpoint && AWS.amplifyRegion);

/**
 * The variables a production build needs, with what each one is for. Documented in
 * docs/AWS_DEPLOYMENT.md; no values are invented here.
 */
export const REQUIRED_ENV_VARS = [
  { key: 'VITE_DATA_PROVIDER', purpose: "Set to 'aws' to use the AWS data layer." },
  { key: 'VITE_AUTH_PROVIDER', purpose: "Set to 'cognito' to require sign-in." },
  { key: 'VITE_AWS_REGION', purpose: 'Region holding the AppSync API and user pool.' },
  { key: 'VITE_APPSYNC_ENDPOINT', purpose: 'GraphQL endpoint of the Amplify data API.' },
  { key: 'VITE_COGNITO_USER_POOL_ID', purpose: 'Cognito user pool that issues student identities.' },
  { key: 'VITE_COGNITO_CLIENT_ID', purpose: 'Cognito app client used by this frontend.' },
  { key: 'VITE_COGNITO_IDENTITY_POOL_ID', purpose: 'Optional — only needed for S3 uploads.' },
  { key: 'VITE_S3_BUCKET', purpose: 'Optional bucket for attachments (not used yet).' },
  { key: 'VITE_APP_NAME', purpose: 'Product name shown in the UI and emails.' },
  { key: 'VITE_SUPPORT_EMAIL', purpose: 'Support address shown on the landing page.' },
];