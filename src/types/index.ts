export interface User {
  id: string;
  name: string;
  email: string;
  role: 'student' | 'parent';
  packageType: 'basic' | 'advanced' | 'professional';
  createdAt: Date;
}

export interface Student extends User {
  grade: number;
  school: string;
  parentIds: string[];
}

export interface Parent extends User {
  children: string[];
}

export interface ExamResult {
  id: string;
  studentId: string;
  examName: string;
  subject: string;
  score: number;
  maxScore: number;
  date: Date;
  topics: TopicScore[];
}

export interface TopicScore {
  topic: string;
  correct: number;
  total: number;
  percentage: number;
}

export interface Homework {
  id: string;
  studentId: string;
  title: string;
  description: string;
  dueDate: Date;
  completed: boolean;
  completedAt?: Date;
}

export interface Package {
  id: string;
  name: string;
  monthlyPrice: number;
  yearlyPrice: number;
  features: string[];
  maxParents: number;
  aiSupport: boolean;
}

export interface WeeklyStudyGoal {
  id: string;
  student_id: string;
  weekly_hours_target: number;
  start_date: string;
  end_date: string;
  is_active: boolean;
  created_at: string;
}