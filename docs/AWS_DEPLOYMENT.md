# StudyForge — AWS deployment guide

StudyForge's frontend is a portable React single-page application. This guide covers the
AWS-native backend it targets: **Amplify Gen 2** with **Amazon Cognito** for identity and
an **AppSync/DynamoDB** data API, with per-student authorization enforced by the backend.

> **Status: nothing in this repository has been provisioned.** The infrastructure is
> defined in code under `amplify/`, but no Cognito user pool, data API, DynamoDB table or
> bucket exists yet, and no resource identifier is stored in this repo. Authentication,
> persistence, authorization and deployment are **not** claimed to work until you complete
> the steps below and verify them with the checklist at the end.

---

## 1. Architecture

```
Browser (React SPA)
  │
  ├── src/services/auth      → Amazon Cognito (email + password, code confirmation)
  └── src/services/provider  → Amplify data API (AppSync) → DynamoDB
                                   │
                                   └── authorization: allow.owner() per model
```

- **One identity provider.** Cognito is the only authentication system. The development
  stub (`src/services/auth/devAuth.ts`) authenticates nobody and is selected only when no
  identity provider is configured.
- **Ownership is decided by the backend.** Each model grants `allow.owner()`, so AppSync
  records the Cognito identity on the record and refuses access from anyone else. A user
  id supplied by the browser is never treated as proof of ownership: on create, the
  provider stamps `profile_id` from the verified session and discards any value the caller
  sent, and queries have their `profile_id` rewritten the same way.
- **No public access.** `authorizationModes.defaultAuthorizationMode` is `userPool`, with
  no API key and no guest mode, so there is no unrestricted path to the database.
- **No credentials in the browser.** Only public identifiers (user pool id, app client id,
  GraphQL endpoint, region) are read from environment variables.

### Repository layout

| Path | Purpose |
| --- | --- |
| `amplify/backend.ts` | Backend entry point (`defineBackend`) |
| `amplify/auth/resource.ts` | Cognito user pool definition |
| `amplify/data/resource.ts` | Data models + per-owner authorization |
| `amplify.yml` | Amplify Hosting build spec (backend + frontend phases) |
| `netlify.toml` | Optional Netlify frontend hosting + SPA fallback |
| `src/types/models.ts` | Typed domain interfaces |
| `src/types/services.ts` | Typed auth + data service contracts |
| `src/services/auth/` | Cognito implementation, development stub, selection |
| `src/services/aws/` | Amplify client + AWS data provider |
| `src/services/provider.ts` | The single provider binding point |
| `src/components/auth/` | Sign-in screen and the sign-in gate |
| `.env.example` | Every public variable, with no values |

---

## 2. Prerequisites

- An AWS account with permission to create Cognito user pools, AppSync APIs and DynamoDB
  tables (or an Amplify Gen 2 sandbox).
- Node.js 20+ and npm.
- The AWS CLI configured locally (`aws configure`) for sandbox use. Amplify Hosting uses
  its own service role — do not put AWS keys in the app's environment variables.
- `@aws-amplify/backend` and `@aws-amplify/backend-cli` are **not installed yet**. They are
  needed to deploy the backend, not to build the frontend:

  ```bash
  npm install --save-dev @aws-amplify/backend @aws-amplify/backend-cli
  ```

---

## 3. Deploy the backend

### Option A — personal sandbox (development)

```bash
npx ampx sandbox
```

This creates the Cognito user pool and the data API in your own account and writes
`amplify_outputs.json` at the repository root. Keep the command running while you develop;
it re-deploys on change. **`amplify_outputs.json` is generated and must not be committed**
(it is already covered by `.gitignore` — verify that before your first commit).

### Option B — Amplify Hosting pipeline (production)

1. Push this repository to GitHub/GitLab/Bitbucket.
2. In the Amplify console, create a new app from the repository. Amplify detects
   `amplify.yml` and runs the backend phase (`npx ampx pipeline-deploy`) followed by the
   frontend build.
3. Amplify creates the Cognito pool, AppSync API and DynamoDB tables in your account.

---

## 4. Configure the frontend

Take the values from `amplify_outputs.json` (or the sandbox output) and set them as
environment variables — in the Amplify console under **App settings → Environment
variables**, or in `.env.local` for local development. **No values are invented here.**

| Variable | Required | Where the value comes from |
| --- | --- | --- |
| `VITE_DATA_PROVIDER` | yes (`aws`) | You set this literal |
| `VITE_AUTH_PROVIDER` | yes (`cognito`) | You set this literal |
| `VITE_AWS_REGION` | yes | `amplify_outputs.json` → `data.aws_region` |
| `VITE_AMPLIFY_REGION` | yes | `amplify_outputs.json` → `auth.aws_region` |
| `VITE_APPSYNC_ENDPOINT` | yes | `amplify_outputs.json` → `data.url` |
| `VITE_COGNITO_USER_POOL_ID` | yes | `amplify_outputs.json` → `auth.user_pool_id` |
| `VITE_COGNITO_CLIENT_ID` | yes | `amplify_outputs.json` → `auth.user_pool_client_id` |
| `VITE_COGNITO_IDENTITY_POOL_ID` | no | Only needed once S3 uploads are added |
| `VITE_S3_BUCKET` | no | Only needed once attachments are added |
| `VITE_APP_NAME` / `VITE_APP_TAGLINE` / `VITE_SUPPORT_EMAIL` | no | Your own branding |

`src/config/env.js` is the only place these are read. If any required variable is missing,
`src/services/aws/amplifyClient.ts` raises a `not_configured` error naming what to set —
it never silently falls back to another backend.

---

## 5. Single-page application routing

Client-side routes (`/dashboard`, `/courses/:courseId`, `/assignments`, `/calendar`,
`/study`, `/notes`, `/analytics`, `/settings`) must be served by `index.html`, or a refresh
and a shared link will 404.

- **Amplify Hosting:** add a rewrite in **App settings → Rewrites and redirects**:

  | Source | Target | Type |
  | --- | --- | --- |
  | `</^[^.]+$\|\.(?!(css\|gif\|ico\|jpg\|js\|png\|txt\|svg\|woff\|woff2\|ttf\|map\|json)$)([^.]+$)/>` | `/index.html` | 200 (Rewrite) |

- **Netlify:** already configured in `netlify.toml` (`/*` → `/index.html`, 200).

---

## 6. Logging and monitoring

- Cognito, AppSync and DynamoDB publish logs and metrics to **CloudWatch** automatically.
  Enable AppSync field-level logging in the API settings if you need per-request detail.
- Set a **CloudWatch Logs retention policy** on every log group (for example 30 days) —
  without one they are retained indefinitely.
- Add CloudWatch alarms for AppSync 4xx/5xx rates and Cognito sign-in failures.
- **Never log** access tokens, ID tokens, passwords, confirmation codes, or student record
  content. The frontend already follows this: `src/services/auth/cognitoAuth.ts` reports
  user-safe messages and never prints a token, and errors carry a code instead of payloads.
  If you add client-side error reporting, scrub it the same way.
- Optional: enable Cognito **advanced security** (compromised-credential detection) on the
  user pool.

---

## 7. Removing the development provider

`src/services/provider.ts` statically imports the development provider so the preview build
keeps working. For a production-only repository, drop it — in `src/services/provider.ts`:

```ts
// Delete the base44 import, the developmentProvider object, and the isAwsProvider branch:
import { createAwsProvider } from '@/services/aws/provider';
import type { DataProvider } from '@/types/services';

export const provider: DataProvider = createAwsProvider();
export const entities = provider.entities;
export const providerName: DataProvider['name'] = provider.name;
```

Then remove `@base44/sdk` and `@base44/vite-plugin` from `package.json`, and delete
`src/api/base44Client.js`, `src/lib/AuthContext.jsx`'s platform branch, and the Base44 auth
pages (`src/pages/Login.jsx`, `Register.jsx`, `ForgotPassword.jsx`, `ResetPassword.jsx`).
`src/lib/AuthContext.jsx` already skips the platform session whenever `VITE_AUTH_PROVIDER=cognito`
or `VITE_DATA_PROVIDER=aws`, so an AWS deployment never calls it at runtime — removing the
files is about keeping the production bundle free of the dependency, not about behaviour.

---

## 8. Known gaps and next steps

| Area | Status | What is left |
| --- | --- | --- |
| Cognito sign-in, sign-up, confirmation, password reset | Implemented, **not deployed or tested** | Deploy, then run the verification checklist |
| Per-owner authorization | Implemented in the schema | Verify with two accounts (§9, step 5) |
| Data reads and writes | Implemented | Verify each screen against the deployed API |
| Sign-out control | `authService.signOut()` and `logout()` are wired | No button in the UI yet — add one to Settings |
| `count` / `aggregate` | Bounded client-side scan of the student's own records | For large accounts, replace with a Lambda-backed custom query (`amplify/data/resource.ts`) and call it from `src/services/aws/provider.ts` |
| Attachments (S3) | Not implemented | Add `defineStorage` to `amplify/backend.ts`, upload via Amplify Storage, store the key on the record. Decide public vs private access before writing the upload code |
| `amplify_outputs.json` type generation | Not generated | Run `npx ampx generate graphql-client-code` and pass the generated `Schema` type to `generateClient<Schema>()` in `src/services/aws/amplifyClient.ts` |
| Automated tests | None | Add unit tests for the provider's query translation and an end-to-end sign-in/sign-out test |

---

## 9. Verification checklist

Run each step against a deployed backend. Until every one passes, treat the corresponding
claim as unverified.

1. **Build:** `npm run build` succeeds with `VITE_DATA_PROVIDER=aws` set.
2. **Sign-up:** create an account, receive a code, confirm, sign in. The sign-in wall
   appears instead of the app.
3. **Onboarding and persistence:** complete onboarding, create a course and an assignment,
   then reload — the records are still there and come from the API, not local state.
4. **Empty, loading and error states:** sign in with a brand-new account (empty dashboard),
   and point `VITE_APPSYNC_ENDPOINT` at a bad host to confirm the error state renders.
5. **Authorization (the critical one):** create two accounts, A and B. In account A, open
   dev tools and call the data API for a record id that belongs to B (for example
   `client.models.Course.get({ id: '<B course id>' })`). It must be refused — never
   returned. Then check DynamoDB directly: every record has an `owner` matching its
   creator's Cognito `sub`.
6. **No secrets in the bundle:** grep the built `dist/` output for `aws_secret`,
   `client_secret`, `service_role` — nothing should match.
7. **Deep links:** open `/analytics` in a fresh tab and refresh — the app loads, not a 404.
8. **CloudWatch:** confirm log groups exist for Cognito and AppSync, with a retention
   policy set.