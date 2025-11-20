import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
  TextInput,
  Modal,
} from 'react-native';
import {
  User,
  TrendingUp,
  Clock,
  Award,
  BookOpen,
  AlertTriangle,
  Plus,
  LogOut,
  UserPlus,
  X,
} from 'lucide-react-native';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import StatCard from '../components/StatCard';
import ExamCard from '../components/ExamCard';
import HomeworkCard from '../components/HomeworkCard';

export default function ParentDashboardScreen() {
  const { user, clearUser, setParentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedChild, setSelectedChild] = useState<string>('');
  const [showAddChild, setShowAddChild] = useState(false);
  const [inviteCode, setInviteCode] = useState('');
  const [addingChild, setAddingChild] = useState(false);

  const children = user?.connectedStudents || [];

  useEffect(() => {
    if (children.length > 0 && !selectedChild) {
      setSelectedChild(children[0].id);
    }
  }, [children.length, selectedChild]);

  const selectedChildData = children.find((child: any) => child.id === selectedChild);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  }, []);

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

  const handleAddChild = async () => {
    if (!inviteCode.trim()) {
      Alert.alert('Hata', 'Lütfen davet kodunu girin');
      return;
    }

    setAddingChild(true);
    try {
      const { data: student, error: studentError } = await supabase
        .from('students')
        .select(
          `
          *,
          profiles!inner(*)
        `
        )
        .eq('invite_code', inviteCode.trim())
        .single();

      if (studentError || !student) {
        Alert.alert('Hata', 'Geçersiz davet kodu');
        setAddingChild(false);
        return;
      }

      const [examResults, homeworks, studySessions, weeklyGoal] = await Promise.all([
        supabase
          .from('exam_results')
          .select('*')
          .eq('student_id', student.id)
          .order('exam_date', { ascending: false }),
        supabase
          .from('homeworks')
          .select('*')
          .eq('student_id', student.id)
          .order('due_date', { ascending: true }),
        supabase
          .from('study_sessions')
          .select('*')
          .eq('student_id', student.id)
          .order('session_date', { ascending: false }),
        supabase
          .from('weekly_study_goals')
          .select('*')
          .eq('student_id', student.id)
          .eq('is_active', true)
          .maybeSingle(),
      ]);

      const completeStudent = {
        ...student,
        exam_results: examResults.data || [],
        homeworks: homeworks.data || [],
        study_sessions: studySessions.data || [],
        weekly_study_goal: weeklyGoal.data,
      };

      const updatedParentData = {
        ...user,
        connectedStudents: [...(user?.connectedStudents || []), completeStudent],
      };

      setParentUser(updatedParentData);
      setInviteCode('');
      setShowAddChild(false);
      Alert.alert('Başarılı', 'Çocuk başarıyla eklendi!');
    } catch (error: any) {
      console.error('Add child error:', error);
      Alert.alert('Hata', 'Bir hata oluştu');
    } finally {
      setAddingChild(false);
    }
  };

  const calculateChildStats = () => {
    if (!selectedChildData)
      return {
        averageScore: 0,
        completedHomeworks: 0,
        totalHomeworks: 0,
        studyHours: 0,
        studyPercentage: 0,
        improvementPercent: 0,
      };

    const examResults = selectedChildData.exam_results || [];
    const homeworks = selectedChildData.homeworks || [];
    const studySessions = selectedChildData.study_sessions || [];

    const averageScore =
      examResults.length > 0
        ? examResults.reduce((sum: number, exam: any) => sum + (exam.total_score || 0), 0) /
          examResults.length
        : 0;

    const completedHomeworks = homeworks.filter((hw: any) => hw.completed).length;
    const totalHomeworks = homeworks.length;

    const studyHours = studySessions.reduce((total: number, session: any) => {
      return total + (session.duration_minutes || 0) / 60;
    }, 0);

    const targetHours = selectedChildData.weekly_study_goal?.weekly_hours_target || 0;
    const studyPercentage =
      targetHours > 0 ? Math.round((studyHours / targetHours) * 100) : 0;

    let improvementPercent = 0;
    if (examResults.length >= 2) {
      const sortedExams = examResults.sort(
        (a: any, b: any) => new Date(b.exam_date).getTime() - new Date(a.exam_date).getTime()
      );
      const lastExam = sortedExams[0];
      const previousExam = sortedExams[1];

      if (
        lastExam.total_score &&
        previousExam.total_score &&
        previousExam.total_score > 0
      ) {
        improvementPercent =
          ((lastExam.total_score - previousExam.total_score) / previousExam.total_score) *
          100;
      }
    }

    return {
      averageScore,
      completedHomeworks,
      totalHomeworks,
      studyHours,
      studyPercentage,
      improvementPercent,
    };
  };

  const stats = calculateChildStats();

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50">
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      <View className="bg-white p-4 border-b border-gray-200">
        <View className="flex-row items-center justify-between mb-4">
          <View>
            <Text className="text-2xl font-bold text-gray-900">Veli Paneli</Text>
            <Text className="text-gray-600 mt-1">
              Çocuğunuzun akademik gelişimini takip edin
            </Text>
          </View>
          <TouchableOpacity
            onPress={handleLogout}
            className="bg-red-100 p-3 rounded-lg"
          >
            <LogOut size={20} color="#DC2626" />
          </TouchableOpacity>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View className="flex-row gap-3">
            {children.map((child: any) => (
              <TouchableOpacity
                key={child.id}
                onPress={() => setSelectedChild(child.id)}
                className={`p-3 rounded-lg border-2 ${
                  selectedChild === child.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 bg-white'
                }`}
              >
                <View className="flex-row items-center gap-2">
                  <User size={24} color="#3B82F6" />
                  <View>
                    <Text className="font-semibold text-gray-900">
                      {child.profiles?.full_name}
                    </Text>
                    <Text className="text-xs text-gray-600">
                      {child.grade}. Sınıf
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              onPress={() => setShowAddChild(true)}
              className="p-3 rounded-lg border-2 border-dashed border-gray-300 bg-white"
            >
              <View className="flex-row items-center gap-2">
                <Plus size={24} color="#9CA3AF" />
                <View>
                  <Text className="font-semibold text-gray-600">Çocuk Ekle</Text>
                  <Text className="text-xs text-gray-500">Davet kodu ile</Text>
                </View>
              </View>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>

      {children.length === 0 ? (
        <View className="flex-1 items-center justify-center p-8">
          <UserPlus size={64} color="#D1D5DB" />
          <Text className="text-xl font-semibold text-gray-900 mt-4 text-center">
            Henüz çocuk eklenmemiş
          </Text>
          <Text className="text-gray-600 mt-2 text-center">
            Çocuğunuzdan davet kodunu alarak onu takip etmeye başlayabilirsiniz.
          </Text>
          <TouchableOpacity
            onPress={() => setShowAddChild(true)}
            className="bg-blue-600 px-6 py-3 rounded-lg mt-6"
          >
            <Text className="text-white font-semibold">İlk Çocuğu Ekle</Text>
          </TouchableOpacity>
        </View>
      ) : selectedChildData ? (
        <ScrollView
          className="flex-1"
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          <View className="p-4">
            <View className="bg-blue-50 rounded-lg p-4 mb-4">
              <View className="flex-row items-center gap-3">
                <User size={40} color="#3B82F6" />
                <View className="flex-1">
                  <Text className="text-lg font-semibold text-blue-900">
                    {selectedChildData.profiles?.full_name}
                  </Text>
                  <Text className="text-blue-700">
                    {selectedChildData.grade}. Sınıf • {selectedChildData.school_name}
                  </Text>
                  {selectedChildData.target_university && (
                    <Text className="text-sm text-blue-600 mt-1">
                      Hedef: {selectedChildData.target_university} -{' '}
                      {selectedChildData.target_department}
                    </Text>
                  )}
                </View>
              </View>
            </View>

            <View className="mb-4">
              <Text className="text-lg font-semibold text-gray-900 mb-3">
                İstatistikler
              </Text>
              <View className="gap-3">
                <StatCard
                  title="Ortalama Puan"
                  value={stats.averageScore > 0 ? stats.averageScore.toFixed(1) : '0'}
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
                  title="Bu Hafta Çalışma"
                  value={`${stats.studyHours.toFixed(1)} saat`}
                  subtitle={
                    selectedChildData?.weekly_study_goal?.weekly_hours_target
                      ? `Hedef: ${selectedChildData.weekly_study_goal.weekly_hours_target} saat (%${stats.studyPercentage})`
                      : 'Hedef belirlenmemiş'
                  }
                  icon={Clock}
                  iconColor="#8B5CF6"
                  valueColor="#8B5CF6"
                />
                <StatCard
                  title="Son Gelişim"
                  value={`${stats.improvementPercent > 0 ? '+' : ''}${stats.improvementPercent.toFixed(1)}%`}
                  subtitle="son denemeye göre"
                  icon={TrendingUp}
                  iconColor="#F59E0B"
                  valueColor={stats.improvementPercent >= 0 ? '#10B981' : '#EF4444'}
                />
              </View>
            </View>

            <View className="mb-4">
              <Text className="text-lg font-semibold text-gray-900 mb-3">
                AI Destekli Öneriler
              </Text>
              <View className="bg-white rounded-lg p-4">
                {selectedChildData.exam_results?.length > 0 ||
                selectedChildData.homeworks?.length > 0 ? (
                  <View className="gap-3">
                    {stats.averageScore > 0 && (
                      <View className="flex-row bg-blue-50 p-3 rounded-lg">
                        <View className="bg-blue-100 p-2 rounded-full mr-3">
                          <TrendingUp size={20} color="#3B82F6" />
                        </View>
                        <View className="flex-1">
                          <Text className="font-semibold text-blue-800 mb-1">
                            Akademik Performans
                          </Text>
                          <Text className="text-sm text-blue-700">
                            Ortalama puanı {stats.averageScore.toFixed(1)}.{' '}
                            {stats.improvementPercent > 0
                              ? `Son denemede %${stats.improvementPercent.toFixed(1)} artış var, tebrikler!`
                              : stats.improvementPercent < 0
                              ? `Son denemede %${Math.abs(stats.improvementPercent).toFixed(1)} düşüş var, motivasyon desteği verin.`
                              : 'Performans stabil, çalışmaya devam etsin.'}
                          </Text>
                        </View>
                      </View>
                    )}

                    {stats.totalHomeworks > 0 && (
                      <View className="flex-row bg-yellow-50 p-3 rounded-lg">
                        <View className="bg-yellow-100 p-2 rounded-full mr-3">
                          <AlertTriangle size={20} color="#F59E0B" />
                        </View>
                        <View className="flex-1">
                          <Text className="font-semibold text-yellow-800 mb-1">
                            Ödev Takibi
                          </Text>
                          <Text className="text-sm text-yellow-700">
                            {stats.totalHomeworks} ödevden {stats.completedHomeworks}{' '}
                            tanesi tamamlanmış (%
                            {Math.round((stats.completedHomeworks / stats.totalHomeworks) * 100)}{' '}
                            başarı oranı).{' '}
                            {stats.completedHomeworks === stats.totalHomeworks
                              ? 'Harika! Tüm ödevler tamamlanmış.'
                              : 'Kalan ödevleri tamamlaması için destek olun.'}
                          </Text>
                        </View>
                      </View>
                    )}

                    {stats.studyHours > 0 && (
                      <View className="flex-row bg-green-50 p-3 rounded-lg">
                        <View className="bg-green-100 p-2 rounded-full mr-3">
                          <Award size={20} color="#10B981" />
                        </View>
                        <View className="flex-1">
                          <Text className="font-semibold text-green-800 mb-1">
                            Çalışma Disiplini
                          </Text>
                          <Text className="text-sm text-green-700">
                            Bu hafta {stats.studyHours.toFixed(1)} saat çalışmış.{' '}
                            {selectedChildData?.weekly_study_goal?.weekly_hours_target
                              ? `Hedef: ${selectedChildData.weekly_study_goal.weekly_hours_target} saat (%${stats.studyPercentage}). ${
                                  stats.studyPercentage >= 80
                                    ? 'Mükemmel bir disiplin!'
                                    : 'Çalışma saatlerini artırması için teşvik edin.'
                                }`
                              : 'Haftalık çalışma hedefi belirlenmemiş.'}
                          </Text>
                        </View>
                      </View>
                    )}
                  </View>
                ) : (
                  <View className="items-center py-8">
                    <TrendingUp size={48} color="#D1D5DB" />
                    <Text className="text-gray-500 mt-2 text-center">
                      AI önerileri için deneme sonucu veya ödev verisi gerekli
                    </Text>
                  </View>
                )}
              </View>
            </View>

            <View className="mb-4">
              <Text className="text-lg font-semibold text-gray-900 mb-3">
                Son Sınavlar
              </Text>
              {selectedChildData.exam_results?.length > 0 ? (
                selectedChildData.exam_results.slice(0, 5).map((exam: any) => (
                  <ExamCard key={exam.id} exam={exam} />
                ))
              ) : (
                <View className="bg-white rounded-lg p-8 items-center">
                  <BookOpen size={48} color="#D1D5DB" />
                  <Text className="text-gray-500 mt-2">Henüz sınav bulunmuyor</Text>
                </View>
              )}
            </View>

            <View className="mb-4">
              <Text className="text-lg font-semibold text-gray-900 mb-3">
                Son Ödevler
              </Text>
              {selectedChildData.homeworks?.length > 0 ? (
                selectedChildData.homeworks.slice(0, 5).map((hw: any) => (
                  <HomeworkCard key={hw.id} homework={hw} />
                ))
              ) : (
                <View className="bg-white rounded-lg p-8 items-center">
                  <BookOpen size={48} color="#D1D5DB" />
                  <Text className="text-gray-500 mt-2">Henüz ödev bulunmuyor</Text>
                </View>
              )}
            </View>
          </View>
        </ScrollView>
      ) : (
        <View className="flex-1 items-center justify-center p-8">
          <User size={64} color="#D1D5DB" />
          <Text className="text-xl font-semibold text-gray-900 mt-4">
            Çocuk seçin
          </Text>
          <Text className="text-gray-600 mt-2 text-center">
            Yukarıdan bir çocuk seçerek detaylarını görüntüleyebilirsiniz.
          </Text>
        </View>
      )}

      <Modal
        visible={showAddChild}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAddChild(false)}
      >
        <View className="flex-1 bg-black/50 items-center justify-center p-4">
          <View className="bg-white rounded-xl w-full max-w-md p-6">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-lg font-semibold text-gray-900">
                Çocuk Ekle
              </Text>
              <TouchableOpacity
                onPress={() => setShowAddChild(false)}
                className="p-2"
              >
                <X size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <Text className="text-gray-600 mb-4">
              Çocuğunuzdan aldığınız davet kodunu girin.
            </Text>

            <TextInput
              value={inviteCode}
              onChangeText={setInviteCode}
              placeholder="Davet kodunu girin"
              className="w-full px-3 py-3 border border-gray-300 rounded-lg mb-4"
              autoCapitalize="characters"
            />

            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={() => setShowAddChild(false)}
                className="flex-1 bg-gray-100 py-3 rounded-lg items-center"
              >
                <Text className="text-gray-700 font-semibold">İptal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleAddChild}
                disabled={addingChild}
                className="flex-1 bg-blue-600 py-3 rounded-lg items-center"
              >
                {addingChild ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text className="text-white font-semibold">Ekle</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
