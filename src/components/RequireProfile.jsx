import { Navigate, Outlet } from 'react-router-dom';
import { ProfileProvider, useProfile } from '@/lib/profile-context';
import PageLoader from '@/components/common/PageLoader';
import ErrorState from '@/components/common/ErrorState';

/**
 * Sends a student who has not set up a profile to onboarding, and loads the profile
 * for every signed-in area of the app. This guards the onboarding flow — it is not a
 * substitute for server-side authorization.
 */
function Gate() {
  const { loading, error, profile, reload } = useProfile();

  if (loading) return <PageLoader />;
  if (error) {
    return (
      <div className="mx-auto mt-16 w-full max-w-md px-4">
        <ErrorState title="We could not load your profile" message={error} onRetry={reload} />
      </div>
    );
  }
  if (!profile) return <Navigate to="/onboarding" replace />;

  return <Outlet />;
}

export default function RequireProfile() {
  return (
    <ProfileProvider>
      <Gate />
    </ProfileProvider>
  );
}