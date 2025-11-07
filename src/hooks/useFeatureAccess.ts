import { useEffect, useState, useCallback, useRef } from 'react';
import { useAuth } from './useAuth';
import { getUserSubscription, getExamCountForPeriod } from '../lib/subscriptionApi';
import { supabase } from '../lib/supabase';
import type { UserSubscription, SubscriptionPlan } from '../types/subscription';

let cachedAdvancedPlan: SubscriptionPlan | null = null;

const ADVANCED_PLAN_NAMES = ['advanced', 'gelismis'];

async function getAdvancedPlanInfo(): Promise<SubscriptionPlan | null> {
  if (cachedAdvancedPlan) return cachedAdvancedPlan;

  try {
    const { data, error } = await supabase
      .from('subscription_plans')
      .select('*')
      .in('name', ADVANCED_PLAN_NAMES)
      .limit(1);

    if (error) {
      console.error('Failed to load advanced plan info:', error);
      return null;
    }

    if (data && data.length > 0) {
      cachedAdvancedPlan = data[0] as SubscriptionPlan;
      return cachedAdvancedPlan;
    }
  } catch (err) {
    console.error('Failed to load advanced plan info:', err);
  }

  return null;
}

export function useFeatureAccess() {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [institutionSubscription, setInstitutionSubscription] = useState<UserSubscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [examStats, setExamStats] = useState<{ count: number; limit: number; remaining: number }>({
    count: 0,
    limit: 0,
    remaining: 0,
  });

  const activeSubscription = subscription ?? institutionSubscription;
  const activeRef = useRef<UserSubscription | null>(activeSubscription);
  activeRef.current = activeSubscription;

  useEffect(() => {
    let cancelled = false;

    const loadAll = async () => {
      if (!user?.id) {
        setSubscription(null);
        setInstitutionSubscription(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        await Promise.all([
          loadSubscription(user.id),
          loadExamStats(user.id),
          loadInstitutionAccess(user.id),
        ]);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadAll();
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  const loadSubscription = async (userId: string) => {
    try {
      const { data } = await getUserSubscription(userId);
      setSubscription(data);
    } catch (error) {
      console.error('Error loading subscription:', error);
      setSubscription(null);
    }
  };

  const loadExamStats = async (userId: string) => {
    try {
      const stats = await getExamCountForPeriod(userId);
      setExamStats(stats);
    } catch (error) {
      console.error('Error loading exam stats:', error);
    }
  };

  const loadInstitutionAccess = async (userId: string) => {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('institution_student, institution_subscription_expires_at, institution_id')
        .eq('id', userId)
        .maybeSingle();

      if (error) throw error;

      if (
        profile?.institution_student &&
        profile.institution_subscription_expires_at &&
        new Date(profile.institution_subscription_expires_at) > new Date()
      ) {
        const planInfo = await getAdvancedPlanInfo();
        const end = new Date(profile.institution_subscription_expires_at);
        const start = new Date(end);
        start.setFullYear(start.getFullYear() - 1);

        const plan: SubscriptionPlan =
          planInfo ??
          ({
            id: 'institution-advanced',
            name: 'advanced',
            display_name: 'Kurum (Gelişmiş)',
            monthly_price: 0,
            yearly_price: 0,
            features: {
              ai_support: true,
              limited_content: false,
              advanced_reports: true,
              priority_support: true,
              pomodoro_timer: true,
              formula_cards: false,
              historical_maps: true,
              student_notes: false,
              max_exams: -1,
            },
            created_at: start.toISOString(),
          } as SubscriptionPlan);

        const syntheticSubscription: UserSubscription = {
          id: `institution-${userId}`,
          user_id: userId,
          plan_id: plan.id,
          status: 'active',
          billing_cycle: 'yearly',
          trial_end_date: null,
          current_period_start: start.toISOString(),
          current_period_end: end.toISOString(),
          cancel_at_period_end: false,
          payment_provider: 'institution',
          payment_id: profile.institution_id ?? 'institution',
          created_at: start.toISOString(),
          updated_at: new Date().toISOString(),
          plan,
        };

        setInstitutionSubscription(syntheticSubscription);
      } else {
        setInstitutionSubscription(null);
      }
    } catch (err) {
      console.error('Error loading institution access:', err);
      setInstitutionSubscription(null);
    }
  };

  const hasFeature = useCallback((featureName: string): boolean => {
    const active = activeRef.current;
    if (!active?.plan?.features) return false;

    const featureMap: Record<string, string> = {
      ai_analysis: 'ai_support',
      exam_topics: 'limited_content',
      advanced_reports: 'advanced_reports',
      custom_goals: 'priority_support',
      pomodoro_timer: 'pomodoro_timer',
      formula_cards: 'formula_cards',
      historical_maps: 'historical_maps',
      student_notes: 'student_notes',
    };

    const mappedName = featureMap[featureName] || featureName;
    const featureValue = active.plan.features[mappedName];

    if (featureName === 'exam_topics') {
      return featureValue === false;
    }

    return featureValue === true;
  }, []);

  const canUseHistoricalMaps = useCallback((): boolean => {
    const planName = activeRef.current?.plan?.name;
    if (!planName) return false;
    return ['advanced', 'gelismis', 'professional', 'profesyonel'].includes(planName);
  }, []);

  const canUseFormulaCards = useCallback((): boolean => {
    const planName = activeRef.current?.plan?.name;
    if (!planName) return false;
    return planName === 'professional' || planName === 'profesyonel';
  }, []);

  const canUsePomodoro = useCallback((): boolean => {
    const planName = activeRef.current?.plan?.name;
    if (!planName) return false;
    return ['advanced', 'gelismis', 'professional', 'profesyonel'].includes(planName);
  }, []);

  const canUseStudentNotes = useCallback((): boolean => {
    const planName = activeRef.current?.plan?.name;
    if (!planName) return false;
    return planName === 'professional' || planName === 'profesyonel';
  }, []);

  const canViewTopicSummaries = useCallback((): boolean => {
    const planName = activeRef.current?.plan?.name;
    if (!planName) return false;
    return planName === 'professional' || planName === 'profesyonel';
  }, []);

  const canAccessExamTopics = useCallback(
    (year: string): boolean => {
      const freeYears = ['2018', '2019', '2020'];
      if (freeYears.includes(year)) return true;

      const planName = activeRef.current?.plan?.name;
      if (!planName) return false;

      if (planName === 'advanced' || planName === 'gelismis') {
        return ['2021', '2022', '2023', '2024', '2025'].includes(year);
      }

      if (planName === 'professional' || planName === 'profesyonel') {
        return true;
      }

      return false;
    },
    []
  );

  const canAddExam = useCallback((): boolean => {
    const active = activeRef.current;
    if (!active) return false;

    const planName = active.plan?.name;
    if (planName === 'professional' || planName === 'profesyonel') {
      return true;
    }

    const features = active.plan?.features as any;
    const maxExams = features?.max_exams || 0;

    if (maxExams === -1) return true;

    return examStats.count < maxExams;
  }, [examStats]);

  const getFeatureLimit = useCallback((featureName: string): number => {
    const active = activeRef.current;
    if (!active?.plan?.features) return 0;
    const value = active.plan.features[featureName];
    return typeof value === 'number' ? value : 0;
  }, []);

  const isTrialActive = useCallback((): boolean => {
    const active = activeRef.current;
    if (!active) return false;
    if (active.status !== 'trial') return false;
    if (!active.trial_end_date) return false;
    return new Date(active.trial_end_date) > new Date();
  }, []);

  const getDaysUntilExpiry = useCallback((): number => {
    const active = activeRef.current;
    if (!active?.current_period_end) return 0;
    const now = new Date();
    const end = new Date(active.current_period_end);
    const diff = end.getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }, []);

  const getPlanDisplayName = (active?: UserSubscription | null) => {
    if (!active?.plan) return 'Ücretsiz';
    const planNameMap: Record<string, string> = {
      basic: 'Temel Paket',
      advanced: 'Gelişmiş Paket',
      professional: 'Profesyonel Paket',
    };
    return planNameMap[active.plan.name] || active.plan.display_name;
  };

  return {
    subscription: activeSubscription,
    loading,
    hasFeature,
    canAccessExamTopics,
    canAddExam,
    canUsePomodoro,
    canUseFormulaCards,
    canUseHistoricalMaps,
    canUseStudentNotes,
    canViewTopicSummaries,
    getFeatureLimit,
    isTrialActive,
    getDaysUntilExpiry,
    examStats,
    setExamStats,
    planName: activeSubscription?.plan?.name || 'free',
    planDisplayName: getPlanDisplayName(activeSubscription),
    isFreeTier: !activeSubscription || activeSubscription.status !== 'active',
    isPremium: Boolean(
      activeSubscription &&
      activeSubscription.status === 'active' &&
      activeSubscription.plan?.name !== 'basic'
    ),
    refresh: () => {
      if (user?.id) {
        loadSubscription(user.id);
        loadExamStats(user.id);
        loadInstitutionAccess(user.id);
      }
    },
  };
}
