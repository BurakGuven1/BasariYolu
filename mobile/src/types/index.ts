export interface User {
  id: string;
  email?: string | null;
  profile: any;
  isParentLogin?: boolean;
  connectedStudents?: any[];
}

export interface Profile {
  id: string;
  user_id: string;
  full_name: string;
  user_type: 'student' | 'parent';
  created_at: string;
}

export interface Student {
  id: string;
  user_id: string;
  profile_id: string;
  grade: number;
  school_name: string;
  target_university?: string;
  target_department?: string;
  invite_code: string;
  created_at: string;
  profile?: Profile;
}

export interface Parent {
  id: string;
  user_id: string;
  profile_id: string;
  created_at: string;
  profile?: Profile;
}

export interface ExamResult {
  id: string;
  student_id: string;
  exam_name: string;
  exam_type: 'TYT' | 'AYT' | 'LGS' | 'custom';
  exam_date: string;
  total_score: number;
  notes?: string;
  exam_details?: string;
  created_at: string;
}

export interface Homework {
  id: string;
  student_id: string;
  title: string;
  description?: string;
  subject: string;
  due_date: string;
  completed: boolean;
  notes?: string;
  created_at: string;
}

export interface WeakTopic {
  subject: string;
  topic: string;
  wrongCount: number;
  totalCount: number;
}

export type RootStackParamList = {
  Home: undefined;
  Login: undefined;
  Register: undefined;
  MainApp: undefined;
  StudentDashboard: undefined;
  ParentDashboard: undefined;
  ExamForm: {
    editData?: ExamResult;
    studentId: string;
  };
  HomeworkForm: {
    editData?: Homework;
    studentId: string;
  };
};
