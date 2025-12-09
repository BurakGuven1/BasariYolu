export type BillingCycle = 'monthly' | 'yearly';
export type SubscriptionStatus = 'active' | 'cancelled' | 'expired' | 'trial';
export type PaymentStatus = 'success' | 'failed' | 'pending' | 'refunded';

export type PlanName = 'basic' | 'advanced' | 'professional' | 'temel' | 'gelismis' | 'profesyonel';

export interface SubscriptionPlan {
  id: string;
  name: PlanName;
  display_name: string;
  monthly_price: number;
  yearly_price: number;
  features: PlanFeatures;
  created_at: string;
}

export interface PlanFeatures {
  max_exams?: number; // -1 = unlimited
  ai_support?: boolean;
  email_support?: boolean;
  basic_features?: boolean;
  limited_content?: boolean;
  advanced_reports?: boolean;
  priority_support?: boolean;
  question_analysis?: boolean;
  ai_analysis?: boolean; // Alias
  exam_topics?: boolean; // Alias
  custom_goals?: boolean; // Alias
  [key: string]: any; // Index signature
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
  plan?: SubscriptionPlan;
  upgrade_credit?: number;
  original_price?: number;
  discount_applied?: number;
  proration_date?: string;
  scheduled_plan_id?: string;
  scheduled_billing_cycle?: string;
  scheduled_change_date?: string;
}

export interface TeacherBilling {
  id: string;
  teacher_id: string;
  class_id: string;
  billing_cycle: 'monthly' | '6_months' | '9_months';
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