import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  FlatList,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import {
  Home,
  BookOpen,
  FileText,
  User,
  Award,
  Clock,
  TrendingUp,
  Plus,
  LogOut,
  Calendar,
} from 'lucide-react-native';
import { useAuth } from '../hooks/useAuth';
import { RootStackParamList } from '../types';
import {
  getStudentData,
  getExamResults,
  getHomeworks,
  getWeeklyStudyGoal,
  getWeeklyStudySessions,
  deleteExamResult,
  updateHomework,
  deleteHomework,
  getStudentInviteCode,
} from '../lib/supabase';
import StatCard from '../components/StatCard';
import ExamCard from '../components/ExamCard';
import HomeworkCard from '../components/HomeworkCard';

const Tab = createBottomTabNavigator();

function HomeTab() {
  const { user, clearUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [studentData, setStudentData] = useState<any>(null);
  const [examResults, setExamResults] = useState<any[]>([]);
  const [homeworks, setHomeworks] = useState<any[]>([]);
  const [weeklyGoal, setWeeklyGoal] = useState<any>(null);
  const [weeklyStudyHours, setWeeklyStudyHours] = useState(0);

  const loadData = useCallback(async () => {
    if (!user?.id) return;

    try {
      const [studentRes, examsRes, homeworksRes, goalRes] = await Promise.all([
        getStudentData(user.id),
        getExamResults(user.id),
        getHomeworks(user.id),
        getWeeklyStudyGoal(user.id),
      ]);

      if (studentRes.data) {
        setStudentData(studentRes.data);
      }

      if (examsRes.data) {
        setExamResults(examsRes.data);
      }

      if (homeworksRes.data) {
        setHomeworks(homeworksRes.data);
      }

      if (goalRes.data) {
        setWeeklyGoal(goalRes.data);

        const now = new Date();
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay() + 1);
        startOfWeek.setHours(0, 0, 0, 0);
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);

        const sessionsRes = await getWeeklyStudySessions(
          studentRes.data?.id || '',
          startOfWeek.toISOString().split('T')[0],
          endOfWeek.toISOString().split('T')[0]
        );

        if (sessionsRes.data) {
          const totalHours = sessionsRes.data.reduce(
            (sum: number, session: any) => sum + (session.duration_minutes || 0) / 60,
            0
          );
          setWeeklyStudyHours(totalHours);
        }
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
  }, [loadData]);

  const calculateStats = () => {
    const avgScore =
      examResults.length > 0
        ? examResults.reduce((sum, exam) => sum + (exam.total_score || 0), 0) /
          examResults.length
        : 0;

    const completedHomeworks = homeworks.filter((hw) => hw.completed).length;
    const totalHomeworks = homeworks.length;

    const upcomingHomeworks = homeworks.filter(
      (hw) => !hw.completed && new Date(hw.due_date) >= new Date(new Date().toDateString())
    ).length;

    const studyPercentage = weeklyGoal?.weekly_hours_target
      ? Math.min(
          100,
          Math.round((weeklyStudyHours / weeklyGoal.weekly_hours_target) * 100)
        )
      : 0;

    return { avgScore, completedHomeworks, totalHomeworks, upcomingHomeworks, studyPercentage };
  };

  const stats = calculateStats();

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50">
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  return (
    <ScrollView
      className="flex-1 bg-gray-50"
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View className="p-4">
        <View className="mb-6">
          <Text className="text-2xl font-bold text-gray-900">
            Merhaba, {studentData?.profile?.full_name || 'Öğrenci'}
          </Text>
          <Text className="text-gray-600 mt-1">
            {studentData?.grade}. Sınıf • {studentData?.school_name}
          </Text>
        </View>

        <View className="mb-6">
          <Text className="text-lg font-semibold text-gray-900 mb-3">
            İstatistikler
          </Text>
          <View className="gap-3">
            <StatCard
              title="Ortalama Puan"
              value={stats.avgScore > 0 ? stats.avgScore.toFixed(1) : '0'}
              subtitle="/ 500"
              icon={Award}
              iconColor="#3B82F6"
              valueColor="#3B82F6"
            />
            <StatCard
              title="Tamamlanan Ödev"
              value={`${stats.completedHomeworks}/${stats.totalHomeworks}`}
              subtitle={
                stats.totalHomeworks > 0
                  ? `%${Math.round((stats.completedHomeworks / stats.totalHomeworks) * 100)} başarı`
                  : 'Ödev yok'
              }
              icon={BookOpen}
              iconColor="#10B981"
              valueColor="#10B981"
            />
            <StatCard
              title="Yaklaşan Ödev"
              value={stats.upcomingHomeworks}
              subtitle="görev"
              icon={Calendar}
              iconColor="#F59E0B"
              valueColor="#F59E0B"
            />
            {weeklyGoal && (
              <StatCard
                title="Haftalık Çalışma"
                value={`${weeklyStudyHours.toFixed(1)}s`}
                subtitle={`Hedef: ${weeklyGoal.weekly_hours_target}s (%${stats.studyPercentage})`}
                icon={Clock}
                iconColor="#8B5CF6"
                valueColor="#8B5CF6"
              />
            )}
          </View>
        </View>

        <View className="mb-6">
          <Text className="text-lg font-semibold text-gray-900 mb-3">
            Son Sınavlar
          </Text>
          {examResults.length > 0 ? (
            examResults.slice(0, 3).map((exam) => (
              <ExamCard key={exam.id} exam={exam} />
            ))
          ) : (
            <View className="bg-white rounded-lg p-8 items-center">
              <BookOpen size={48} color="#D1D5DB" />
              <Text className="text-gray-500 mt-2">Henüz sınav eklenmemiş</Text>
            </View>
          )}
        </View>

        <View className="mb-6">
          <Text className="text-lg font-semibold text-gray-900 mb-3">
            Yaklaşan Ödevler
          </Text>
          {homeworks.filter((hw) => !hw.completed).length > 0 ? (
            homeworks
              .filter((hw) => !hw.completed)
              .slice(0, 3)
              .map((hw) => <HomeworkCard key={hw.id} homework={hw} />)
          ) : (
            <View className="bg-white rounded-lg p-8 items-center">
              <FileText size={48} color="#D1D5DB" />
              <Text className="text-gray-500 mt-2">Tüm ödevler tamamlanmış!</Text>
            </View>
          )}
        </View>
      </View>
    </ScrollView>
  );
}

function ExamsTab() {
  const { user } = useAuth();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [examResults, setExamResults] = useState<any[]>([]);
  const [filter, setFilter] = useState<'all' | 'TYT' | 'AYT' | 'LGS'>('all');
  const [studentData, setStudentData] = useState<any>(null);

  useEffect(() => {
    const loadStudent = async () => {
      if (!user?.id) return;
      const { data } = await getStudentData(user.id);
      if (data) setStudentData(data);
    };
    loadStudent();
  }, [user?.id]);

  const loadExams = useCallback(async () => {
    if (!user?.id) return;

    try {
      const { data } = await getExamResults(user.id);
      if (data) {
        setExamResults(data);
      }
    } catch (error) {
      console.error('Error loading exams:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadExams();
  }, [loadExams]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadExams();
  }, [loadExams]);

  const handleDeleteExam = async (examId: string) => {
    try {
      await deleteExamResult(examId);
      setExamResults((prev) => prev.filter((exam) => exam.id !== examId));
      Alert.alert('Başarılı', 'Sınav silindi');
    } catch (error) {
      Alert.alert('Hata', 'Sınav silinemedi');
    }
  };

  const filteredExams =
    filter === 'all'
      ? examResults
      : examResults.filter((exam) => exam.exam_type === filter);

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50">
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      <View className="p-4 bg-white border-b border-gray-200">
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View className="flex-row gap-2">
            {['all', 'TYT', 'AYT', 'LGS'].map((f) => (
              <TouchableOpacity
                key={f}
                onPress={() => setFilter(f as any)}
                className={`px-4 py-2 rounded-full ${
                  filter === f ? 'bg-blue-600' : 'bg-gray-100'
                }`}
              >
                <Text
                  className={`font-semibold ${
                    filter === f ? 'text-white' : 'text-gray-700'
                  }`}
                >
                  {f === 'all' ? 'Tümü' : f}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      <FlatList
        data={filteredExams}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        renderItem={({ item }) => (
          <ExamCard exam={item} onDelete={handleDeleteExam} />
        )}
        ListEmptyComponent={
          <View className="bg-white rounded-lg p-12 items-center">
            <BookOpen size={64} color="#D1D5DB" />
            <Text className="text-gray-500 mt-4 text-center">
              Henüz sınav eklenmemiş
            </Text>
          </View>
        }
      />

      <TouchableOpacity
        className="absolute bottom-6 right-6 bg-blue-600 rounded-full p-4 shadow-lg"
        onPress={() => {
          if (studentData?.id) {
            navigation.navigate('ExamForm', { studentId: studentData.id });
          } else {
            Alert.alert('Hata', 'Öğrenci bilgisi yüklenemedi');
          }
        }}
      >
        <Plus size={28} color="white" />
      </TouchableOpacity>
    </View>
  );
}

function HomeworksTab() {
  const { user } = useAuth();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [homeworks, setHomeworks] = useState<any[]>([]);
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const [studentData, setStudentData] = useState<any>(null);

  useEffect(() => {
    const loadStudent = async () => {
      if (!user?.id) return;
      const { data } = await getStudentData(user.id);
      if (data) setStudentData(data);
    };
    loadStudent();
  }, [user?.id]);

  const loadHomeworks = useCallback(async () => {
    if (!user?.id) return;

    try {
      const { data } = await getHomeworks(user.id);
      if (data) {
        setHomeworks(data);
      }
    } catch (error) {
      console.error('Error loading homeworks:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadHomeworks();
  }, [loadHomeworks]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadHomeworks();
  }, [loadHomeworks]);

  const handleToggleComplete = async (homeworkId: string, completed: boolean) => {
    try {
      await updateHomework(homeworkId, { completed });
      setHomeworks((prev) =>
        prev.map((hw) => (hw.id === homeworkId ? { ...hw, completed } : hw))
      );
    } catch (error) {
      Alert.alert('Hata', 'Ödev güncellenemedi');
    }
  };

  const handleDeleteHomework = async (homeworkId: string) => {
    try {
      await deleteHomework(homeworkId);
      setHomeworks((prev) => prev.filter((hw) => hw.id !== homeworkId));
      Alert.alert('Başarılı', 'Ödev silindi');
    } catch (error) {
      Alert.alert('Hata', 'Ödev silinemedi');
    }
  };

  const filteredHomeworks =
    filter === 'all'
      ? homeworks
      : filter === 'completed'
      ? homeworks.filter((hw) => hw.completed)
      : homeworks.filter((hw) => !hw.completed);

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50">
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      <View className="p-4 bg-white border-b border-gray-200">
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View className="flex-row gap-2">
            {[
              { key: 'all', label: 'Tümü' },
              { key: 'pending', label: 'Bekleyen' },
              { key: 'completed', label: 'Tamamlanan' },
            ].map((f) => (
              <TouchableOpacity
                key={f.key}
                onPress={() => setFilter(f.key as any)}
                className={`px-4 py-2 rounded-full ${
                  filter === f.key ? 'bg-blue-600' : 'bg-gray-100'
                }`}
              >
                <Text
                  className={`font-semibold ${
                    filter === f.key ? 'text-white' : 'text-gray-700'
                  }`}
                >
                  {f.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      <FlatList
        data={filteredHomeworks}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        renderItem={({ item }) => (
          <HomeworkCard
            homework={item}
            onToggleComplete={handleToggleComplete}
            onDelete={handleDeleteHomework}
          />
        )}
        ListEmptyComponent={
          <View className="bg-white rounded-lg p-12 items-center">
            <FileText size={64} color="#D1D5DB" />
            <Text className="text-gray-500 mt-4 text-center">
              {filter === 'completed'
                ? 'Tamamlanmış ödev bulunmuyor'
                : filter === 'pending'
                ? 'Bekleyen ödev bulunmuyor'
                : 'Henüz ödev eklenmemiş'}
            </Text>
          </View>
        }
      />

      <TouchableOpacity
        className="absolute bottom-6 right-6 bg-blue-600 rounded-full p-4 shadow-lg"
        onPress={() => {
          if (studentData?.id) {
            navigation.navigate('HomeworkForm', { studentId: studentData.id });
          } else {
            Alert.alert('Hata', 'Öğrenci bilgisi yüklenemedi');
          }
        }}
      >
        <Plus size={28} color="white" />
      </TouchableOpacity>
    </View>
  );
}

function ProfileTab() {
  const { user, clearUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [studentData, setStudentData] = useState<any>(null);
  const [inviteCode, setInviteCode] = useState('');

  useEffect(() => {
    const loadProfile = async () => {
      if (!user?.id) return;

      try {
        const { data } = await getStudentData(user.id);
        if (data) {
          setStudentData(data);
          const codeRes = await getStudentInviteCode(data.id);
          if (codeRes.data) {
            setInviteCode(codeRes.data.invite_code);
          }
        }
      } catch (error) {
        console.error('Error loading profile:', error);
      }
    };

    loadProfile();
  }, [user?.id]);

  const handleLogout = async () => {
    Alert.alert(
      'Çıkış Yap',
      'Çıkış yapmak istediğinize emin misiniz?',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Çıkış Yap',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            await clearUser();
          },
        },
      ]
    );
  };

  return (
    <ScrollView className="flex-1 bg-gray-50">
      <View className="p-4">
        <View className="bg-white rounded-lg p-6 mb-4">
          <View className="items-center mb-6">
            <View className="w-20 h-20 bg-blue-100 rounded-full items-center justify-center mb-3">
              <User size={40} color="#3B82F6" />
            </View>
            <Text className="text-2xl font-bold text-gray-900">
              {studentData?.profile?.full_name || 'Öğrenci'}
            </Text>
            <Text className="text-gray-600 mt-1">{user?.email}</Text>
          </View>

          <View className="space-y-3">
            <View className="border-t border-gray-100 pt-3">
              <Text className="text-sm text-gray-600">Sınıf</Text>
              <Text className="text-base font-semibold text-gray-900 mt-1">
                {studentData?.grade}. Sınıf
              </Text>
            </View>
            <View className="border-t border-gray-100 pt-3">
              <Text className="text-sm text-gray-600">Okul</Text>
              <Text className="text-base font-semibold text-gray-900 mt-1">
                {studentData?.school_name}
              </Text>
            </View>
            {studentData?.target_university && (
              <View className="border-t border-gray-100 pt-3">
                <Text className="text-sm text-gray-600">Hedef</Text>
                <Text className="text-base font-semibold text-gray-900 mt-1">
                  {studentData.target_university} - {studentData.target_department}
                </Text>
              </View>
            )}
            {inviteCode && (
              <View className="border-t border-gray-100 pt-3">
                <Text className="text-sm text-gray-600">Davet Kodu (Veli için)</Text>
                <Text className="text-xl font-bold text-blue-600 mt-1">
                  {inviteCode}
                </Text>
              </View>
            )}
          </View>
        </View>

        <TouchableOpacity
          onPress={handleLogout}
          disabled={loading}
          className="bg-red-100 rounded-lg p-4 flex-row items-center justify-center"
        >
          {loading ? (
            <ActivityIndicator color="#DC2626" />
          ) : (
            <>
              <LogOut size={20} color="#DC2626" />
              <Text className="text-red-600 font-semibold ml-2">Çıkış Yap</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

export default function StudentDashboardScreen() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: '#ffffff',
        },
        headerTitleStyle: {
          fontWeight: 'bold',
        },
        tabBarActiveTintColor: '#3B82F6',
        tabBarInactiveTintColor: '#6B7280',
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopWidth: 1,
          borderTopColor: '#E5E7EB',
        },
      }}
    >
      <Tab.Screen
        name="Anasayfa"
        component={HomeTab}
        options={{
          tabBarIcon: ({ color, size }) => <Home size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="Sınavlar"
        component={ExamsTab}
        options={{
          tabBarIcon: ({ color, size }) => <BookOpen size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="Ödevler"
        component={HomeworksTab}
        options={{
          tabBarIcon: ({ color, size }) => <FileText size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="Profil"
        component={ProfileTab}
        options={{
          tabBarIcon: ({ color, size }) => <User size={size} color={color} />,
        }}
      />
    </Tab.Navigator>
  );
}
