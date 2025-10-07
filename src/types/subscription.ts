export type BillingCycle = 'monthly' | 'yearly';
export type SubscriptionStatus = 'active' | 'cancelled' | 'expired' | 'trial';
export type PaymentStatus = 'success' | 'failed' | 'pending' | 'refunded';

export interface SubscriptionPlan {
  id: string;
  name: 'temel' | 'gelismis' | 'profesyonel';
  display_name: string;
  monthly_price: number;
  yearly_price: number;
  features: PlanFeatures;
  created_at: string;
}

export interface PlanFeatures {
  max_exams: number; // -1 = unlimited
  ai_analysis: boolean;
  exam_topics: boolean;
  advanced_reports: boolean;
  parent_dashboard: boolean;
  homework_tracking: boolean;
  study_recommendations?: boolean;
  priority_support?: boolean;
  custom_goals?: boolean;
}

export interface UserSubscription {
  id: string;
  user_id: string;
  plan_id: string;
  status: SubscriptionStatus;
  billing_cycle: BillingCycle;
  trial_end_date: string | null;
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  payment_provider: string | null;
  payment_id: string | null;
  created_at: string;
  updated_at: string;
  plan?: SubscriptionPlan; // Joined data
}

export interface TeacherBilling {
  id: string;
  teacher_id: string;
  class_id: string;
  billing_cycle: 'monthly' | '3_months' | '9_months';
  price_per_student: number;
  current_students: number;
  student_capacity: number;
  total_amount: number;
  status: 'active' | 'pending' | 'cancelled';
  next_billing_date: string;
  payment_provider: string | null;
  payment_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface FeatureFlag {
  id: string;
  name: string;
  display_name: string;
  description: string | null;
  plans: string[];
  is_active: boolean;
  created_at: string;
}