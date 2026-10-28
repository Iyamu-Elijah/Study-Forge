/**
 * The authentication seam.
 *
 * Amazon Cognito is the one and only production identity provider. The development
 * stub is selected only when no identity provider is configured, and it authenticates
 * nobody — so there is never a second, incompatible authentication system in play.
 */
import { isCognitoAuth } from '@/config/env';
import { cognitoAuth } from './cognitoAuth';
import { devAuth } from './devAuth';
import type { AuthService } from '@/types/services';

export const authService: AuthService = isCognitoAuth() ? cognitoAuth : devAuth;

export const authProviderName = authService.providerName;

export type { AuthService, AuthSession, AuthUser, SignInResult } from '@/types/services';