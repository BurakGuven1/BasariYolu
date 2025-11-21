export type UserType = 'student' | 'parent' | 'teacher' | 'institution';

export interface InstitutionSession {
  institutionId: string;
  institutionName: string;
  accessToken: string;
  expiresAt: number;
}

export interface AuthUser {
  id: string;
  email: string;
  userType: UserType;
  profile?: any;
  metadata?: any;
  // For parent login
  isParentLogin?: boolean;
  connectedStudents?: any[];
  // For teacher
  teacherData?: any;
  // For institution
  institutionSession?: InstitutionSession;
}

export interface LogoutOptions {
  redirectTo?: string;
}

export interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  login: (user: AuthUser) => void;
  logout: (options?: LogoutOptions) => Promise<void>;
  refreshSession: () => Promise<void>;
}
