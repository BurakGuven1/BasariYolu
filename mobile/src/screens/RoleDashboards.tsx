import React, { useEffect, useState } from 'react';
import { SafeAreaView, StyleSheet, Text, View, ActivityIndicator, Pressable, Alert, ScrollView } from 'react-native';
import { Button } from '../components/ui/Button';
import { InputMini } from '../components/ui/InputMini';
import { useAuth } from '../contexts/AuthContext';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import { supabase } from '../lib/supabase';
import {
  addExamResult,
  addHomeworkItem,
  deleteExamResultById,
  fetchExamResults,
  fetchHomeworks,
  fetchQuestionPlan,
  fetchStudentProfile,
  fetchWeeklyGoal,
  toggleHomeworkStatus,
  upsertQuestionPlan,
  upsertWeeklyGoal,
} from '../lib/studentApi';

type DashboardProps = NativeStackScreenProps<RootStackParamList, 'Dashboard'>;

const BaseCard: React.FC<{
  title: string;
  subtitle: string;
  onLogout: () => void;
  children?: React.ReactNode;
}> = ({ title, subtitle, onLogout, children }) => (
  <SafeAreaView style={styles.container}>
    <View style={styles.card}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
      <View style={styles.section}>{children}</View>
      <Button title="Çıkış yap" onPress={onLogout} />
    </View>
  </SafeAreaView>
);

export const StudentDashboard: React.FC<DashboardProps> = ({ navigation }) => {
  const { user, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'exams' | 'homeworks' | 'goals'>('overview');
  const [loadingData, setLoadingData] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [student, setStudent] = useState<any>(null);
  const [exams, setExams] = useState<any[]>([]);
  const [homeworks, setHomeworks] = useState<any[]>([]);
  const [questionPlan, setQuestionPlan] = useState<any>(null);
  const [weeklyGoal, setWeeklyGoal] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [formExam, setFormExam] = useState({ exam_name: '', exam_date: '', score: '', total_score: '' });
  const [formHomework, setFormHomework] = useState({ title: '', due_date: '' });
  const [formGoalHours, setFormGoalHours] = useState('10');
  const [formQuestionTarget, setFormQuestionTarget] = useState('');

  useEffect(() => {
    const load = async () => {
      if (!user?.id) return;
      setLoadingData(true);
      setError(null);
      try {
        const { profile: profileData, student: studentData } = await fetchStudentProfile(user.id);
        setProfile(profileData);
        setStudent(studentData);

        if (studentData?.id) {
          const [examRes, hwRes, qp, wg] = await Promise.all([
            fetchExamResults(studentData.id),
            fetchHomeworks(studentData.id),
            fetchQuestionPlan(studentData.id),
            fetchWeeklyGoal(studentData.id),
          ]);
          setExams(examRes ?? []);
          setHomeworks(hwRes ?? []);
          setQuestionPlan(qp);
          setWeeklyGoal(wg);
          setFormQuestionTarget(qp?.question_target ? String(qp.question_target) : '');
          if (wg?.weekly_hours_target) setFormGoalHours(String(wg.weekly_hours_target));
        }
      } catch (e: any) {
        setError(e?.message ?? 'Veri alınırken hata oluştu');
      } finally {
        setLoadingData(false);
      }
    };
    load();
  }, [user?.id]);

  return (
    <BaseCard
      title="Öğrenci Paneli"
      subtitle={user?.email ?? ''}
      onLogout={() => {
        signOut();
        navigation.replace('Home');
      }}
    >
      {loadingData ? (
        <View style={styles.sectionCentered}>
          <ActivityIndicator color="#6366F1" />
        </View>
      ) : (
        <>
          {error ? <Text style={styles.error}>{error}</Text> : null}

          <ScrollView contentContainerStyle={{ gap: 12 }}>
            <View style={styles.tabs}>
              {(['overview', 'exams', 'homeworks', 'goals'] as const).map((t) => (
                <Pressable
                  key={t}
                  style={[styles.tab, activeTab === t && styles.tabActive]}
                  onPress={() => setActiveTab(t)}
                >
                  <Text style={activeTab === t ? styles.tabActiveText : styles.tabText}>
                    {t === 'overview'
                      ? 'Özet'
                      : t === 'exams'
                        ? 'Denemeler'
                        : t === 'homeworks'
                          ? 'Ödevler'
                          : 'Hedefler'}
                  </Text>
                </Pressable>
              ))}
            </View>

            {activeTab === 'overview' && (
              <>
                <View style={styles.infoBox}>
                  <Text style={styles.infoTitle}>{profile?.full_name ?? 'Öğrenci'}</Text>
                  <Text style={styles.infoText}>
                    {profile?.school_name ? `${profile.school_name}` : 'Okul bilgisi yok'}
                    {profile?.grade ? ` • ${profile.grade}. sınıf` : ''}
                  </Text>
                  {student?.invite_code ? (
                    <Text style={styles.infoMeta}>Davet Kodu: {student.invite_code}</Text>
                  ) : null}
                  {profile?.package_type ? (
                    <Text style={styles.infoMeta}>Paket: {profile.package_type}</Text>
                  ) : null}
                </View>
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Özet</Text>
                  <Text style={styles.helper}>
                    Son deneme sayısı: {exams.length} • Bekleyen ödev: {homeworks.filter((h) => !h.completed).length}
                  </Text>
                </View>
              </>
            )}

            {activeTab === 'exams' && (
              <>
                <View style={styles.formRow}>
                  <InputMini
                    placeholder="Deneme adı"
                    value={formExam.exam_name}
                    onChangeText={(v) => setFormExam((p) => ({ ...p, exam_name: v }))}
                  />
                  <InputMini
                    placeholder="Tarih (YYYY-MM-DD)"
                    value={formExam.exam_date}
                    onChangeText={(v) => setFormExam((p) => ({ ...p, exam_date: v }))}
                  />
                  <InputMini
                    placeholder="Puan"
                    value={formExam.score}
                    onChangeText={(v) => setFormExam((p) => ({ ...p, score: v }))}
                    keyboardType="numeric"
                  />
                  <Button
                    title="Ekle"
                    onPress={async () => {
                      if (!student?.id || !formExam.exam_name || !formExam.exam_date) return;
                      try {
                        await addExamResult(student.id, {
                          exam_name: formExam.exam_name,
                          exam_date: formExam.exam_date,
                          score: formExam.score ? Number(formExam.score) : undefined,
                          total_score: formExam.total_score ? Number(formExam.total_score) : undefined,
                        });
                        const data = await fetchExamResults(student.id);
                        setExams(data);
                        setFormExam({ exam_name: '', exam_date: '', score: '', total_score: '' });
                      } catch (e: any) {
                        Alert.alert('Hata', e?.message ?? 'Deneme eklenemedi');
                      }
                    }}
                  />
                </View>
                {exams.length === 0 ? (
                  <Text style={styles.helper}>Deneme kaydı yok.</Text>
                ) : (
                  exams.map((ex) => (
                    <Pressable key={ex.id} style={styles.itemRow} onLongPress={async () => {
                      try {
                        await deleteExamResultById(ex.id);
                        setExams((prev) => prev.filter((i) => i.id !== ex.id));
                      } catch (err: any) {
                        Alert.alert('Hata', err?.message ?? 'Silinemedi');
                      }
                    }}>
                      <Text style={styles.itemTitle}>{ex.exam_name ?? 'Deneme'}</Text>
                      <Text style={styles.itemMeta}>
                        {ex.exam_date} • {ex.score ?? '-'} / {ex.total_score ?? '-'}
                      </Text>
                    </Pressable>
                  ))
                )}
              </>
            )}

            {activeTab === 'homeworks' && (
              <>
                <View style={styles.formRow}>
                  <InputMini
                    placeholder="Ödev başlığı"
                    value={formHomework.title}
                    onChangeText={(v) => setFormHomework((p) => ({ ...p, title: v }))}
                  />
                  <InputMini
                    placeholder="Son tarih (YYYY-MM-DD)"
                    value={formHomework.due_date}
                    onChangeText={(v) => setFormHomework((p) => ({ ...p, due_date: v }))}
                  />
                  <Button
                    title="Ekle"
                    onPress={async () => {
                      if (!student?.id || !formHomework.title || !formHomework.due_date) return;
                      try {
                        await addHomeworkItem(student.id, formHomework);
                        const data = await fetchHomeworks(student.id);
                        setHomeworks(data);
                        setFormHomework({ title: '', due_date: '' });
                      } catch (e: any) {
                        Alert.alert('Hata', e?.message ?? 'Ödev eklenemedi');
                      }
                    }}
                  />
                </View>
                {homeworks.length === 0 ? (
                  <Text style={styles.helper}>Ödev bulunamadı.</Text>
                ) : (
                  homeworks.map((hw) => (
                    <Pressable
                      key={hw.id}
                      style={styles.itemRow}
                      onPress={async () => {
                        try {
                          await toggleHomeworkStatus(hw.id, !hw.completed);
                          const data = await fetchHomeworks(student.id);
                          setHomeworks(data);
                        } catch (err: any) {
                          Alert.alert('Hata', err?.message ?? 'Güncellenemedi');
                        }
                      }}
                    >
                      <Text style={styles.itemTitle}>{hw.title}</Text>
                      <Text style={styles.itemMeta}>
                        {hw.due_date} • {hw.completed ? 'Tamamlandı' : 'Bekliyor'}
                      </Text>
                    </Pressable>
                  ))
                )}
              </>
            )}

            {activeTab === 'goals' && (
              <>
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Haftalık Çalışma Hedefi (saat)</Text>
                  <View style={styles.formRow}>
                    <InputMini
                      placeholder="Örn: 20"
                      value={formGoalHours}
                      onChangeText={setFormGoalHours}
                      keyboardType="numeric"
                    />
                    <Button
                      title="Kaydet"
                      onPress={async () => {
                        if (!student?.id) return;
                        const val = Number(formGoalHours);
                        if (!val || val <= 0) return;
                        try {
                          await upsertWeeklyGoal(student.id, val);
                          const wg = await fetchWeeklyGoal(student.id);
                          setWeeklyGoal(wg);
                        } catch (e: any) {
                          Alert.alert('Hata', e?.message ?? 'Hedef kaydedilemedi');
                        }
                      }}
                    />
                  </View>
                  {weeklyGoal ? (
                    <Text style={styles.helper}>
                      Mevcut hedef: {weeklyGoal.weekly_hours_target} saat ({weeklyGoal.start_date} - {weeklyGoal.end_date})
                    </Text>
                  ) : (
                    <Text style={styles.helper}>Henüz hedef belirlenmedi.</Text>
                  )}
                </View>

                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Haftalık Soru Planı</Text>
                  <View style={styles.formRow}>
                    <InputMini
                      placeholder="Haftalık hedef"
                      value={formQuestionTarget}
                      onChangeText={setFormQuestionTarget}
                      keyboardType="numeric"
                    />
                    <Button
                      title="Kaydet"
                      onPress={async () => {
                        if (!student?.id) return;
                        const target = Number(formQuestionTarget);
                        if (!target || target <= 0) return;
                        try {
                          const qp = await upsertQuestionPlan(student.id, target);
                          setQuestionPlan(qp);
                          setFormQuestionTarget(String(qp?.question_target ?? target));
                        } catch (e: any) {
                          Alert.alert('Hata', e?.message ?? 'Plan kaydedilemedi');
                        }
                      }}
                    />
                  </View>
                  {questionPlan ? (
                    <Text style={styles.helper}>
                      Hedef: {questionPlan.question_target} • Çözülen: {questionPlan.questions_completed ?? 0}
                    </Text>
                  ) : (
                    <Text style={styles.helper}>Henüz soru hedefi yok.</Text>
                  )}
                </View>
              </>
            )}
          </ScrollView>
        </>
      )}
    </BaseCard>
  );
};

export const ParentDashboard: React.FC<DashboardProps> = ({ navigation }) => {
  const { user, signOut } = useAuth();
  return (
    <BaseCard
      title="Veli Paneli"
      subtitle={user?.email ?? ''}
      onLogout={() => {
        signOut();
        navigation.replace('Home');
      }}
    >
      <Text style={styles.helper}>Çocuklarınızın ilerlemesi ve bildirimler burada listelenecek.</Text>
    </BaseCard>
  );
};

export const TeacherDashboard: React.FC<DashboardProps> = ({ navigation }) => {
  const { user, signOut } = useAuth();
  return (
    <BaseCard
      title="Öğretmen Paneli"
      subtitle={user?.email ?? ''}
      onLogout={() => {
        signOut();
        navigation.replace('Home');
      }}
    >
      <Text style={styles.helper}>Sınıflar, ödev atamaları ve analizler burada olacak.</Text>
    </BaseCard>
  );
};

export const InstitutionDashboard: React.FC<DashboardProps> = ({ navigation }) => {
  const { user, signOut } = useAuth();
  return (
    <BaseCard
      title="Kurum Paneli"
      subtitle={user?.email ?? ''}
      onLogout={() => {
        signOut();
        navigation.replace('Home');
      }}
    >
      <Text style={styles.helper}>Kurum yöneticisi işlemleri burada gösterilecek.</Text>
    </BaseCard>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 20,
  },
  tabs: {
    flexDirection: 'row',
    gap: 8,
  },
  tab: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#F8FAFC',
  },
  tabActive: {
    backgroundColor: '#EEF2FF',
    borderColor: '#C7D2FE',
  },
  tabText: {
    color: '#475569',
    fontWeight: '600',
  },
  tabActiveText: {
    color: '#4338CA',
    fontWeight: '700',
  },
  formRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  title: {
    color: '#0F172A',
    fontSize: 22,
    fontWeight: '800',
  },
  subtitle: {
    color: '#047857',
    fontSize: 14,
  },
  helper: {
    color: '#475569',
    fontSize: 14,
    lineHeight: 20,
  },
  section: {
    gap: 8,
  },
  sectionCentered: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    color: '#0F172A',
    fontWeight: '700',
    fontSize: 16,
  },
  itemRow: {
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  itemTitle: {
    color: '#0F172A',
    fontWeight: '600',
  },
  itemMeta: {
    color: '#6B7280',
    fontSize: 12,
  },
  infoBox: {
    padding: 10,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 4,
  },
  infoTitle: {
    color: '#0F172A',
    fontWeight: '700',
    fontSize: 16,
  },
  infoText: {
    color: '#475569',
  },
  infoMeta: {
    color: '#6B7280',
    fontSize: 12,
  },
  error: {
    color: '#DC2626',
  },
});
