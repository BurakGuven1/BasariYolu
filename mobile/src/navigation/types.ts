import { NavigatorScreenParams } from '@react-navigation/native';
import { AuthUser } from '../types/auth';

export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  Main: NavigatorScreenParams<MainTabParamList>;
};

export type AuthStackParamList = {
  Welcome: undefined;
  Login: { userType?: 'student' | 'parent' | 'teacher' | 'institution' };
  StudentLogin: undefined;
  ParentLogin: undefined;
  TeacherLogin: undefined;
  InstitutionLogin: undefined;
  SignUp: { userType: 'student' | 'parent' };
};

export type MainTabParamList = {
  Dashboard: undefined;
  Exams: undefined;
  Study: undefined;
  Profile: undefined;
};

export type DashboardStackParamList = {
  DashboardHome: undefined;
  ExamForm: undefined;
  HomeworkForm: undefined;
  WeeklyPlan: undefined;
  AIChat: undefined;
  QuestionBank: undefined;
};
