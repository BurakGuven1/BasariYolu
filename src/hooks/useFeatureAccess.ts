import { useEffect, useState, useCallback } from 'react';
import { useAuth } from './useAuth';
import { getUserSubscription, getExamCountForPeriod } from '../lib/subscriptionApi';
import { UserSubscription } from '../types/subscription';

export function useFeatureAccess() {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [examStats, setExamStats] = useState<{ count: number; limit: number; remaining: number }>({ 
    count: 0, 
    limit: 0, 
    remaining: 0 
  });

  useEffect(() => {
    if (user?.id) {
      loadSubscription();
      loadExamStats();
    } else {
      setLoading(false);
    }
  }, [user?.id]);

  const loadSubscription = async () => {
    try {
      console.log('🔍 Loading subscription for user:', user?.id);
      const { data } = await getUserSubscription(user!.id);
      console.log('✅ Subscription loaded:', data);
      setSubscription(data);
    } catch (error) {
      console.error('❌ Error loading subscription:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadExamStats = async () => {
    try {
      const stats = await getExamCountForPeriod(user!.id);
      setExamStats(stats);
    } catch (error) {
      console.error('Error loading exam stats:', error);
    }
  };

  const hasFeature = useCallback((featureName: string): boolean => {
    if (!subscription?.plan?.features) return false;
    
    // Feature name mapping
    const featureMap: Record<string, string> = {
      'ai_analysis': 'ai_support',
      'exam_topics': 'limited_content',
      'advanced_reports': 'advanced_reports',
      'custom_goals': 'priority_support',
      'pomodoro_timer': 'pomodoro_timer',
      'formula_cards': 'formula_cards',
      'historical_maps': 'historical_maps',
      'student_notes': 'student_notes'
    };
    
    const mappedName = featureMap[featureName] || featureName;
    const featureValue = subscription.plan.features[mappedName];
    
    // exam_topics için ters mantık: limited_content = false ise tüm konular açık
    if (featureName === 'exam_topics') {
      return featureValue === false;
    }
    
    return featureValue === true;
  }, [subscription]);

  const canUseHistoricalMaps = useCallback((): boolean => {
    if (!subscription?.plan) return false;
    const planName = subscription.plan.name;
    // Gelişmiş ve Profesyonel paketlerde kullanılabilir
    return planName === 'advanced' || planName === 'gelismis' || 
          planName === 'professional' || planName === 'profesyonel';
  }, [subscription]);

  const canUseFormulaCards = useCallback((): boolean => {
  if (!subscription?.plan) return false;
  const planName = subscription.plan.name;
  // Sadece Profesyonel pakette kullanılabilir
  return planName === 'professional' || planName === 'profesyonel';
}, [subscription]);

  const canUsePomodoro = useCallback((): boolean => {
  if (!subscription?.plan) return false;
  const planName = subscription.plan.name;
  // Gelişmiş ve Profesyonel paketlerde kullanılabilir
  return planName === 'advanced' || planName === 'gelismis' || 
         planName === 'professional' || planName === 'profesyonel';
}, [subscription]);

const canUseStudentNotes = useCallback((): boolean => {
  if (!subscription?.plan) return false;
  const planName = subscription.plan.name;
  // Sadece Profesyonel pakette kullanılabilir
  return planName === 'professional' || planName === 'profesyonel';
}, [subscription]);

  const canAccessExamTopics = useCallback((year: string): boolean => {
    const freeYears = ['2018', '2019', '2020']; // Temel paket için ücretsiz yıllar
    
    // Ücretsiz yıllar herkese açık
    if (freeYears.includes(year)) return true;
    
    // Plan kontrolü
    const planName = subscription?.plan?.name;
    
    // Gelişmiş paket: 2021-2025 açık
    if (planName === 'advanced' || planName === 'gelismis') {
      const advancedYears = ['2021', '2022', '2023', '2024', '2025'];
      return advancedYears.includes(year);
    }
    
    // Profesyonel paket: Tüm yıllar açık
    if (planName === 'professional' || planName === 'profesyonel') {
      return true;
    }
    
    // Temel paket: Sadece ücretsiz yıllar
    return false;
  }, [subscription]);

  const canAddExam = useCallback((): boolean => {
    if (!subscription) return false;
    
    const planName = subscription.plan?.name;
    
    // Profesyonel paketler için sınırsız
    if (planName === 'professional' || planName === 'profesyonel') {
      return true;
    }
    
    const features = subscription.plan?.features as any;
    const maxExams = features?.max_exams || 0;
    
    if (maxExams === -1) return true;
    
    return examStats.count < maxExams;
  }, [subscription, examStats]);

  const getFeatureLimit = useCallback((featureName: string): number => {
    if (!subscription?.plan?.features) return 0;
    const value = subscription.plan.features[featureName];
    return typeof value === 'number' ? value : 0;
  }, [subscription]);

  const isTrialActive = useCallback((): boolean => {
    if (!subscription) return false;
    if (subscription.status !== 'trial') return false;
    if (!subscription.trial_end_date) return false;
    return new Date(subscription.trial_end_date) > new Date();
  }, [subscription]);

  const getDaysUntilExpiry = useCallback((): number => {
    if (!subscription?.current_period_end) return 0;
    const now = new Date();
    const end = new Date(subscription.current_period_end);
    const diff = end.getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }, [subscription]);

  const getPlanDisplayName = () => {
    if (!subscription?.plan) return 'Ücretsiz';
    const planNameMap: Record<string, string> = {
      'basic': 'Temel Paket',
      'advanced': 'Gelişmiş Paket',
      'professional': 'Profesyonel Paket'
    };
    return planNameMap[subscription.plan.name] || subscription.plan.display_name;
  };

  return {
    subscription,
    loading,
    hasFeature,
    canAccessExamTopics,
    canAddExam,
    canUsePomodoro,
    canUseFormulaCards,
    canUseHistoricalMaps,
    canUseStudentNotes,
    getFeatureLimit,
    isTrialActive,
    getDaysUntilExpiry,
    examStats,
    setExamStats,
    planName: subscription?.plan?.name || 'free',
    planDisplayName: getPlanDisplayName(),
    isFreeTier: !subscription || subscription.status !== 'active',
    isPremium: subscription?.status === 'active' && subscription?.plan?.name !== 'basic',
    refresh: () => {
      loadSubscription();
      loadExamStats();
    }
  };
}