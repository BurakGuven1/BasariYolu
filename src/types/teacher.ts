export interface Teacher {
  id: string;
  email: string;
  full_name: string;
  phone: string;
  school_name?: string;
  email_confirmed: boolean;
  created_at: string;
  updated_at: string;
}

export interface Class {
  id: string;
  teacher_id: string;
  class_name: string;
  description?: string;
  student_capacity: number;
  current_students: number;
  package_type: 'monthly' | '3_months' | '9_months';
  price_per_student: number;
  total_price: number;
  invite_code: string;
  invite_code_updated_at: string;
  status: 'pending_payment' | 'active' | 'payment_failed' | 'suspended' | 'completed';
  start_date?: string;
  end_date?: string;
  created_at: string;
  updated_at: string;
  teacher?: Teacher;
  students?: ClassStudent[];
}

export interface ClassStudent {
  id: string;
  class_id: string;
  student_id: string;
  joined_at: string;
  status: 'active' | 'left' | 'removed';
  student?: any; // Reference to student data
}

export interface ClassPayment {
  id: string;
  class_id: string;
  teacher_id: string;
  amount: number;
  payment_method?: string;
  transaction_id?: string;
  payment_status: 'pending' | 'completed' | 'failed' | 'refunded';
  payment_date?: string;
  created_at: string;
}

export interface PackageOption {
  type: 'monthly' | '3_months' | '9_months';
  name: string;
  duration_months: number;
  price_per_student: number;
  discount_percent: number;
  popular?: boolean;
}

export const PACKAGE_OPTIONS: PackageOption[] = [
  {
    type: 'monthly',
    name: 'Aylık Paket',
    duration_months: 1,
    price_per_student: 40,
    discount_percent: 0
  },
  {
    type: '3_months',
    name: '3 Aylık Paket',
    duration_months: 3,
    price_per_student: 36,
    discount_percent: 10
  },
  {
    type: '9_months',
    name: 'Dönemlik Paket (9 Ay)',
    duration_months: 9,
    price_per_student: 34,
    discount_percent: 15,
    popular: true
  }
];

export const MAX_CLASS_CAPACITY = 40;
export const MIN_CLASS_CAPACITY = 5;
export const MAX_CLASSES_PER_STUDENT = 3;

export const calculateClassPrice = (studentCount: number, packageType: 'monthly' | '3_months' | '9_months') => {
  const packageOption = PACKAGE_OPTIONS.find(p => p.type === packageType);
  if (!packageOption) return { monthlyPrice: 0, totalPrice: 0, originalPrice: 0, savings: 0, pricePerStudent: 0, duration: 0 };

  const monthlyPrice = packageOption.price_per_student * studentCount;
  const totalPrice = monthlyPrice * packageOption.duration_months;
  const originalPrice = 40 * studentCount * packageOption.duration_months;
  const savings = originalPrice - totalPrice;

  return {
    monthlyPrice,
    totalPrice,
    originalPrice,
    savings,
    pricePerStudent: packageOption.price_per_student,
    duration: packageOption.duration_months
  };
};