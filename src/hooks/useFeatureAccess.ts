import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';

export function useFeatureAccess() {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadSubscription();
    }
  }, [user]);

  const loadSubscription = async () => {
    try {
      const { data, error } = await supabase
        .from('user_subscriptions')
        .select(`
          *,
          plan:subscription_plans(*)
        `)
        .eq('user_id', user?.id)
        .eq('status', 'active')
        .single();

      if (error) throw error;
      setSubscription(data);
    } catch (error) {
      console.error('Error loading subscription:', error);
    } finally {
      setLoading(false);
    }
  };

  const hasFeature = (featureName: string): boolean => {
    if (!subscription?.plan?.features) return false;
    return subscription.plan.features[featureName] === true;
  };

  const canAccessExamTopics = (year: string): boolean => {
    const freeYears = ['2018', '2019', '2020'];
    if (freeYears.includes(year)) return true;
    return hasFeature('exam_topics');
  };

  const getRemainingExams = async (): Promise<number> => {
    if (!subscription) return 0;
    
    const maxExams = subscription.plan.features.max_exams;
    if (maxExams === -1) return -1; // Unlimited

    // Count user's exams in current period
    const { count } = await supabase
      .from('exams')
      .select('*', { count: 'exact', head: true })
      .eq('student_id', user?.id)
      .gte('created_at', subscription.current_period_start)
      .lte('created_at', subscription.current_period_end);

    return Math.max(0, maxExams - (count || 0));
  };

  return {
    subscription,
    loading,
    hasFeature,
    canAccessExamTopics,
    getRemainingExams,
    planName: subscription?.plan?.name || 'free',
    isFreeTier: !subscription || subscription.status !== 'active'
  };
}