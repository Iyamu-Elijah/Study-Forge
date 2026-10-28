import { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { authService } from '@/services/auth';
import PageLoader from '@/components/common/PageLoader';
import ErrorState from '@/components/common/ErrorState';
import SignInForm from './SignInForm';

/**
 * The sign-in wall for AWS deployments.
 *
 * With Amazon Cognito configured (VITE_AUTH_PROVIDER=cognito) this resolves the session
 * before the student's own area renders, and shows the sign-in screen when there is none.
 * In a development build no identity provider is configured, so it renders straight
 * through and the app keeps its current onboarding-led flow.
 */
export default function AuthGate() {
  const [state, setState] = useState({ status: 'loading', error: null });

  useEffect(() => {
    if (!authService.isConfigured()) {
      setState({ status: 'open', error: null });
      return undefined;
    }

    let active = true;
    const resolve = async () => {
      try {
        const session = await authService.getSession();
        if (active) setState({ status: session ? 'open' : 'signed_out', error: null });
      } catch (error) {
        if (active) setState({ status: 'error', error: error?.message || 'We could not check your session.' });
      }
    };

    resolve();
    const unsubscribe = authService.subscribe((session) => {
      if (active) setState({ status: session ? 'open' : 'signed_out', error: null });
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  if (!authService.isConfigured()) return <Outlet />;
  if (state.status === 'loading') return <PageLoader />;
  if (state.status === 'error') {
    return (
      <div className="mx-auto mt-16 w-full max-w-md px-4">
        <ErrorState
          title="We could not check your session"
          message={state.error}
          onRetry={() => window.location.reload()}
        />
      </div>
    );
  }
  if (state.status === 'signed_out') return <SignInForm />;

  return <Outlet />;
}