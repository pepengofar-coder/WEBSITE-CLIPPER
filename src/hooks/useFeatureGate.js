import { useAuth } from '../context/AuthContext';

/**
 * Hook that checks if the current user has access to a feature.
 * Returns { allowed, package, loading } where:
 *   - allowed: boolean — whether the feature is enabled for the user's package
 *   - package: string — the user's current package tier
 *   - loading: boolean — whether auth state is still loading
 *
 * If user is not logged in, defaults to 'basic' package.
 */
export function useFeatureGate(featureKey) {
  const { hasFeature, profile, loading } = useAuth();

  return {
    allowed: hasFeature(featureKey),
    package: profile?.package || 'basic',
    loading,
  };
}

/**
 * Imperatively check a feature and throw if not allowed.
 * Use this inside async handlers where you need to block execution.
 */
export function requireFeature(hasFeature, featureKey, packageName) {
  if (!hasFeature(featureKey)) {
    throw new Error(
      `Fitur "${featureKey}" tidak tersedia untuk paket ${packageName || 'Anda'}. Silakan upgrade paket Anda.`
    );
  }
}
