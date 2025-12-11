import React from 'react';
import { AuthProvider, useAuthContext } from './AuthContext';
import { StudentProvider } from './StudentContext';
import { InstitutionProvider } from './InstitutionContext';
import { ExamProvider } from './ExamContext';
import { NotificationProvider } from './NotificationContext';
import { ThemeProvider } from './ThemeContext';
import { PomodoroProvider } from './PomodoroContext';
import { ParentSessionProvider } from './ParentSessionContext';
import { ToastProvider } from './ToastContext';

/**
 * PomodoroProvider wrapper that injects studentId from AuthContext
 */
function PomodoroProviderWrapper({ children }: { children: React.ReactNode }) {
  const { user } = useAuthContext();
  const studentId = user?.userType === 'student' ? user.id : undefined;

  return <PomodoroProvider studentId={studentId}>{children}</PomodoroProvider>;
}

/**
 * AppProviders - Tüm global context provider'ları tek bir yerde toplar
 *
 * Sıralama önemlidir:
 * 1. ThemeProvider - En dıştaki provider (tema tüm uygulamayı etkiler)
 * 2. NotificationProvider - Bildirimler her yerde kullanılabilir
 * 3. AuthProvider - Auth durumu diğer provider'lar için gerekli
 * 4. ParentSessionProvider - Auth'a bağımlı
 * 5. StudentProvider - Auth'a bağımlı
 * 6. InstitutionProvider - Auth'a bağımlı
 * 7. ExamProvider - Auth'a bağımlı
 * 8. PomodoroProviderWrapper - Auth ve Student bilgisine bağımlı
 */
export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <ToastProvider>
        <NotificationProvider>
          <AuthProvider>
            <ParentSessionProvider>
              <StudentProvider>
                <InstitutionProvider>
                  <ExamProvider>
                    <PomodoroProviderWrapper>
                      {children}
                    </PomodoroProviderWrapper>
                  </ExamProvider>
                </InstitutionProvider>
              </StudentProvider>
            </ParentSessionProvider>
          </AuthProvider>
        </NotificationProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}

/**
 * Export all hooks for easy access
 */
export { useAuthContext as useAuth } from './AuthContext';
export { useStudent } from './StudentContext';
export { useInstitution } from './InstitutionContext';
export { useExam } from './ExamContext';
export { useNotification } from './NotificationContext';
export { useTheme } from './ThemeContext';
export { usePomodoro } from './PomodoroContext';
export { useParentSession } from './ParentSessionContext';

/**
 * Export all types
 */
export type { UserType, AuthUser } from './AuthContext';
export type { StudentProfile, StudentSubscription, StudentPoints } from './StudentContext';
export type { InstitutionData, InstitutionStudent, InstitutionTeacher } from './InstitutionContext';
export type { ExamTemplate, ExamResult } from './ExamContext';
export type { Notification, NotificationType } from './NotificationContext';
export type { ParentUser } from './ParentSessionContext';
