import { supabase } from './supabase';
import { SubscriptionPlan, UserSubscription, FeatureFlag } from '../types/subscription';

// Get all available plans
export async function getSubscriptionPlans() {
  const { data, error } = await supabase
    .from('subscription_plans')
    .select('*')
    .order('monthly_price', { ascending: true });

  if (error) throw error;
  return { data: data as SubscriptionPlan[] };
}

// Get user's current subscription
export async function getUserSubscription(userId: string) {
  console.log('📡 Fetching subscription for user:', userId);
  
  const { data, error } = await supabase
    .from('user_subscriptions')
    .select(`
      *,
      plan:subscription_plans!user_subscriptions_plan_id_fkey(*)
    `)
    .eq('user_id', userId)
    .eq('status', 'active')
    .maybeSingle();

  if (error) {
    console.error('❌ Subscription fetch error:', error);
    throw error;
  }

  console.log('✅ Subscription data:', data);
  
  return { data: data as UserSubscription | null };
}

// Create a new subscription (after payment)
export async function createSubscription(params: {
  user_id: string;
  plan_id: string;
  billing_cycle: 'monthly' | 'yearly';
  payment_provider: string;
  payment_id: string;
}) {
  const now = new Date();
  const periodEnd = new Date();
  
  if (params.billing_cycle === 'monthly') {
    periodEnd.setMonth(periodEnd.getMonth() + 1);
  } else {
    periodEnd.setFullYear(periodEnd.getFullYear() + 1);
  }

  const { data, error } = await supabase
    .from('user_subscriptions')
    .insert({
      user_id: params.user_id,
      plan_id: params.plan_id,
      status: 'active',
      billing_cycle: params.billing_cycle,
      current_period_start: now.toISOString(),
      current_period_end: periodEnd.toISOString(),
      payment_provider: params.payment_provider,
      payment_id: params.payment_id
    })
    .select()
    .single();

  if (error) throw error;
  return { data };
}

// Start trial subscription
export async function startTrialSubscription(userId: string, planId: string) {
  const now = new Date();
  const trialEnd = new Date();
  trialEnd.setDate(trialEnd.getDate() + 7); // 7 days trial

  const { data, error } = await supabase
    .from('user_subscriptions')
    .insert({
      user_id: userId,
      plan_id: planId,
      status: 'trial',
      billing_cycle: 'monthly',
      trial_end_date: trialEnd.toISOString(),
      current_period_start: now.toISOString(),
      current_period_end: trialEnd.toISOString()
    })
    .select()
    .single();

  if (error) throw error;
  return { data };
}

// Cancel subscription
export async function cancelSubscription(subscriptionId: string) {
  const { data, error } = await supabase
    .from('user_subscriptions')
    .update({ 
      cancel_at_period_end: true,
      updated_at: new Date().toISOString()
    })
    .eq('id', subscriptionId)
    .select()
    .single();

  if (error) throw error;
  return { data };
}

// Get all feature flags
export async function getFeatureFlags() {
  const { data, error } = await supabase
    .from('feature_flags')
    .select('*')
    .eq('is_active', true);

  if (error) throw error;
  return { data: data as FeatureFlag[] };
}

// Check if user has access to a feature
export async function checkFeatureAccess(userId: string, featureName: string) {
  // Get user subscription with plan
  const { data: subscription } = await getUserSubscription(userId);
  
  if (!subscription || subscription.status !== 'active') {
    return { hasAccess: false, reason: 'no_active_subscription' };
  }

  // Check if feature exists in plan
  const hasFeature = subscription.plan?.features?.[featureName] === true;
  
  return { 
    hasAccess: hasFeature, 
    reason: hasFeature ? 'granted' : 'feature_not_in_plan',
    planName: subscription.plan?.name
  };
}

// Get exam count for current period
export async function getExamCountForPeriod(userId: string) {
  try {
    // Get subscription with explicit FK relationship
    const { data: subscription, error: subError } = await supabase
      .from('user_subscriptions')
      .select(`
        *,
        plan:subscription_plans!user_subscriptions_plan_id_fkey(*)
      `)
      .eq('user_id', userId)
      .eq('status', 'active')
      .maybeSingle();

    if (subError) {
      console.error('Error fetching subscription:', subError);
      return { count: 0, limit: 0, remaining: 0 };
    }

    if (!subscription) {
      return { count: 0, limit: 0, remaining: 0 };
    }

    // Get student_id from students table
    const { data: student } = await supabase
      .from('students')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (!student) {
      return { count: 0, limit: 0, remaining: 0 };
    }

    // Get exam count using student_id
    const { count, error: countError } = await supabase
      .from('exam_results')
      .select('*', { count: 'exact', head: true })
      .eq('student_id', student.id)
      .gte('created_at', subscription.current_period_start)
      .lte('created_at', subscription.current_period_end);

    if (countError) {
      console.error('Error counting exams:', countError);
      return { count: 0, limit: 0, remaining: 0 };
    }

    const features = subscription.plan?.features as any;
    const maxExams = features?.max_exams || 0;
    const limit = maxExams === -1 ? Infinity : maxExams;
    const examCount = count || 0;
    const remaining = limit === Infinity ? Infinity : Math.max(0, limit - examCount);

    return { 
      count: examCount, 
      limit: limit === Infinity ? -1 : limit,
      remaining: remaining === Infinity ? -1 : remaining
    };
  } catch (error) {
    console.error('Error in getExamCountForPeriod:', error);
    return { count: 0, limit: 0, remaining: 0 };
  }
}