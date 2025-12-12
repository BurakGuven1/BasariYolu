import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ActivityIndicator, Pressable } from 'react-native';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { useAuth } from '../../contexts/AuthContext';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/navigation';
import { fetchStudentProfile } from '../../lib/studentApi';

// Tab Screens
import { OverviewTab } from './OverviewTab';
import { ExamsTab } from './ExamsTab';
import { HomeworksTab } from './HomeworksTab';
import { PomodoroTab } from './PomodoroTab';
import { GoalsTab } from './GoalsTab';
import { ScheduleTab } from './ScheduleTab';
import { BigFiveTab } from './BigFiveTab';
import { TopicTrackingTab } from './TopicTrackingTab';
import { AIChatScreen } from '../AIChatScreen';
import { QuestionListScreen } from '../QuestionPortal/QuestionListScreen';

type DashboardProps = NativeStackScreenProps<RootStackParamList, 'Dashboard'>;

const Tab = createMaterialTopTabNavigator();

export const StudentDashboard: React.FC<DashboardProps> = ({ navigation }) => {
  const { user, signOut } = useAuth();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [student, setStudent] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadProfile = async () => {
      if (!user?.id) return;
      setLoading(true);
      try {
        const { profile: profileData, student: studentData } = await fetchStudentProfile(user.id);
        setProfile(profileData);
        setStudent(studentData);
      } catch (e: any) {
        setError(e?.message ?? 'Profil yüklenemedi');
      } finally {
        setLoading(false);
      }
    };
    loadProfile();
  }, [user?.id]);

  const handleLogout = async () => {
    await signOut();
    navigation.replace('Home');
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#6366F1" />
        </View>
      </SafeAreaView>
    );
  }

  if (error || !student) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <Text style={styles.errorText}>{error ?? 'Öğrenci verisi bulunamadı'}</Text>
          <Pressable style={styles.button} onPress={handleLogout}>
            <Text style={styles.buttonText}>Çıkış Yap</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Öğrenci Paneli</Text>
          <Text style={styles.headerSubtitle}>{profile?.full_name ?? user?.email}</Text>
        </View>
        <Pressable style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Çıkış</Text>
        </Pressable>
      </View>

      <Tab.Navigator
        screenOptions={{
          tabBarActiveTintColor: '#6366F1',
          tabBarInactiveTintColor: '#6B7280',
          tabBarLabelStyle: { fontSize: 12, fontWeight: '600', textTransform: 'none' },
          tabBarIndicatorStyle: { backgroundColor: '#6366F1', height: 3 },
          tabBarStyle: { backgroundColor: '#FFFFFF' },
          tabBarScrollEnabled: true,
        }}
      >
        <Tab.Screen name="Overview" options={{ title: 'Özet' }}>
          {() => <OverviewTab student={student} profile={profile} />}
        </Tab.Screen>
        <Tab.Screen name="TopicTracking" options={{ title: 'Konu Takibi' }}>
          {() => <TopicTrackingTab studentId={student.id} gradeLevel={student.grade_level || profile?.grade || 9} />}
        </Tab.Screen>
        <Tab.Screen name="AIChatTab" options={{ title: 'Yapay Zeka' }}>
          {() => <AIChatScreen />}
        </Tab.Screen>
        <Tab.Screen name="QuestionPortalTab" options={{ title: 'Soru Portalı' }}>
          {() => <QuestionListScreen />}
        </Tab.Screen>
        <Tab.Screen name="Exams" options={{ title: 'Denemeler' }}>
          {() => <ExamsTab studentId={student.id} />}
        </Tab.Screen>
        <Tab.Screen name="Homeworks" options={{ title: 'Ödevler' }}>
          {() => <HomeworksTab studentId={student.id} />}
        </Tab.Screen>
        <Tab.Screen name="Pomodoro" options={{ title: 'Pomodoro' }}>
          {() => <PomodoroTab studentId={student.id} />}
        </Tab.Screen>
        <Tab.Screen name="Goals" options={{ title: 'Hedefler' }}>
          {() => <GoalsTab studentId={student.id} />}
        </Tab.Screen>
        <Tab.Screen name="BigFive" options={{ title: 'Big Five' }}>
          {() => <BigFiveTab studentId={user?.id || ''} gradeLevel={profile?.grade || 9} />}
        </Tab.Screen>
        <Tab.Screen name="Schedule" options={{ title: 'Program' }}>
          {() => <ScheduleTab studentId={student.id} />}
        </Tab.Screen>
      </Tab.Navigator>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  header: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#047857',
    marginTop: 2,
  },
  logoutButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#FEE2E2',
    borderRadius: 8,
  },
  logoutText: {
    color: '#DC2626',
    fontWeight: '600',
    fontSize: 14,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 16,
    marginBottom: 16,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#6366F1',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
  },
});
