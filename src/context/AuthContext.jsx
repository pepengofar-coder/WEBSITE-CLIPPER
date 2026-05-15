import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [features, setFeatures] = useState([]); // enabled feature_keys for user's package
  const [allPackageFeatures, setAllPackageFeatures] = useState([]); // all rows from package_features
  const [loading, setLoading] = useState(true);

  // Fetch profile from profiles table
  const fetchProfile = useCallback(async (userId) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    if (error) {
      console.error('Failed to fetch profile:', error);
      return null;
    }
    return data;
  }, []);

  // Fetch enabled features for a package
  const fetchFeatures = useCallback(async (pkg) => {
    const { data, error } = await supabase
      .from('package_features')
      .select('*')
      .eq('package', pkg)
      .eq('enabled', true);
    if (error) {
      console.error('Failed to fetch features:', error);
      return [];
    }
    return data.map(f => f.feature_key);
  }, []);

  // Fetch ALL package_features (for pricing page / admin)
  const fetchAllPackageFeatures = useCallback(async () => {
    const { data, error } = await supabase
      .from('package_features')
      .select('*')
      .order('package')
      .order('feature_key');
    if (error) {
      console.error('Failed to fetch all package features:', error);
      return [];
    }
    return data;
  }, []);

  // Load user session + profile + features
  const loadUserData = useCallback(async (session) => {
    if (!session?.user) {
      setUser(null);
      setProfile(null);
      setFeatures([]);
      setLoading(false);
      return;
    }

    setUser(session.user);
    const prof = await fetchProfile(session.user.id);
    setProfile(prof);

    if (prof) {
      const feats = await fetchFeatures(prof.package);
      setFeatures(feats);
    }

    const allFeats = await fetchAllPackageFeatures();
    setAllPackageFeatures(allFeats);
    setLoading(false);
  }, [fetchProfile, fetchFeatures, fetchAllPackageFeatures]);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      loadUserData(session);
    });

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        loadUserData(session);
      }
    );

    return () => subscription.unsubscribe();
  }, [loadUserData]);

  // ── Auth actions ──

  const signUp = async (email, password) => {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
    return data;
  };

  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setFeatures([]);
  };

  // ── Feature gate check ──
  const hasFeature = useCallback((featureKey) => {
    return features.includes(featureKey);
  }, [features]);

  // ── Admin check ──
  const isAdmin = profile?.role === 'admin';

  // ── Admin actions ──

  const updateUserPackage = async (userId, newPackage) => {
    const { error } = await supabase
      .from('profiles')
      .update({ package: newPackage })
      .eq('id', userId);
    if (error) throw error;
    // Refresh if it's the current user
    if (userId === user?.id) {
      const prof = await fetchProfile(userId);
      setProfile(prof);
      if (prof) {
        const feats = await fetchFeatures(prof.package);
        setFeatures(feats);
      }
    }
  };

  const updateFeatureEnabled = async (featureId, enabled) => {
    const { error } = await supabase
      .from('package_features')
      .update({ enabled })
      .eq('id', featureId);
    if (error) throw error;
    // Refresh all features
    const allFeats = await fetchAllPackageFeatures();
    setAllPackageFeatures(allFeats);
    // Refresh current user features if logged in
    if (profile) {
      const feats = await fetchFeatures(profile.package);
      setFeatures(feats);
    }
  };

  const fetchAllUsers = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  };

  const fetchAllRenderJobs = async () => {
    const { data, error } = await supabase
      .from('render_jobs')
      .select(`
        *,
        profiles (email)
      `)
      .order('created_at', { ascending: false })
      .limit(50);
    if (error) throw error;
    return data;
  };

  const value = {
    user,
    profile,
    features,
    allPackageFeatures,
    loading,
    isAdmin,
    // Auth
    signUp,
    signIn,
    signOut,
    // Feature gating
    hasFeature,
    // Admin
    updateUserPackage,
    updateFeatureEnabled,
    fetchAllUsers,
    fetchAllRenderJobs,
    // Refresh
    refreshFeatures: () => fetchAllPackageFeatures().then(setAllPackageFeatures),
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
