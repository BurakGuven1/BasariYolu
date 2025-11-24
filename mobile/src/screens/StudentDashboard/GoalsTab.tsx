import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { CustomBarChart } from '../../components/ui/Chart';
import {
  fetchWeeklyGoal,
  upsertWeeklyGoal,
  fetchQuestionPlan,
  upsertQuestionPlan,
  getWeeklyStudySessions,
} from '../../lib/studentApi';

interface GoalsTabProps {
  studentId: string;
}

const getCurrentWeekRange = () => {
  const now = new Date();
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  const day = start.getDay();
  const offset = day === 0 ? -6 : 1 - day;
  start.setDate(start.getDate() + offset);

  const end = new Date(start);
  end.setDate(start.getDate() + 6);

  const toISODate = (date: Date) => date.toISOString().split('T')[0];

  return {
    startDate: toISODate(start),
    endDate: toISODate(end),
  };
};

export const GoalsTab: React.FC<GoalsTabProps> = ({ studentId }) => {
  const [loading, setLoading] = useState(true);
  const [weeklyGoal, setWeeklyGoal] = useState<any>(null);
  const [questionPlan, setQuestionPlan] = useState<any>(null);
  const [studyData, setStudyData] = useState<any>(null);
  const [goalInput, setGoalInput] = useState('');
  const [questionTargetInput, setQuestionTargetInput] = useState('');

  const loadGoalsData = async () => {
    setLoading(true);
    try {
      const { startDate, endDate } = getCurrentWeekRange();

      const [wg, qp, sessions] = await Promise.all([
        fetchWeeklyGoal(studentId),
        fetchQuestionPlan(studentId),
        getWeeklyStudySessions(studentId, startDate, endDate),
      ]);

      setWeeklyGoal(wg);
      setQuestionPlan(qp);
      setGoalInput(wg?.weekly_hours_target ? String(wg.weekly_hours_target) : '');
      setQuestionTargetInput(qp?.question_target ? String(qp.question_target) : '');

      // Prepare weekly study chart data
      const dayLabels = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];
      const dayData = new Array(7).fill(0);

      sessions.forEach((session: any) => {
        const sessionDate = new Date(session.session_date);
        const dayIndex = (sessionDate.getDay() + 6) % 7; // Monday = 0
        dayData[dayIndex] += session.duration_hours ?? 0;
      });

      setStudyData({
        labels: dayLabels,
        datasets: [{ data: dayData }],
      });
    } catch (e: any) {
      Alert.alert('Hata', e?.message ?? 'Hedefler yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGoalsData();
  }, [studentId]);

  const handleSaveWeeklyGoal = async () => {
    const value = Number(goalInput);
    if (!value || value <= 0) {
      Alert.alert('Uyarı', 'Geçerli bir saat değeri giriniz');
      return;
    }

    try {
      await upsertWeeklyGoal(studentId, value);
      loadGoalsData();
      Alert.alert('Başarılı', 'Haftalık hedef kaydedildi');
    } catch (e: any) {
      Alert.alert('Hata', e?.message ?? 'Hedef kaydedilemedi');
    }
  };

  const handleSaveQuestionTarget = async () => {
    const target = Number(questionTargetInput);
    if (!target || target <= 0) {
      Alert.alert('Uyarı', 'Geçerli bir hedef değeri giriniz');
      return;
    }

    try {
      await upsertQuestionPlan(studentId, target);
      loadGoalsData();
      Alert.alert('Başarılı', 'Soru hedefi kaydedildi');
    } catch (e: any) {
      Alert.alert('Hata', e?.message ?? 'Hedef kaydedilemedi');
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#6366F1" />
      </View>
    );
  }

  const totalStudyHours = studyData?.datasets[0].data.reduce(
    (sum: number, val: number) => sum + val,
    0
  );
  const goalProgress = weeklyGoal?.weekly_hours_target
    ? Math.round((totalStudyHours / weeklyGoal.weekly_hours_target) * 100)
    : 0;
  const questionProgress = questionPlan?.question_target
    ? Math.round(
        ((questionPlan.questions_completed ?? 0) / questionPlan.question_target) * 100
      )
    : 0;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Card title="Haftalık Çalışma Hedefi">
        <View style={styles.goalForm}>
          <Input
            placeholder="Hedef saat (örn: 25)"
            value={goalInput}
            onChangeText={setGoalInput}
            keyboardType="numeric"
          />
          <Button title="Hedef Kaydet" onPress={handleSaveWeeklyGoal} />
        </View>

        {weeklyGoal && (
          <>
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${Math.min(goalProgress, 100)}%` },
                  ]}
                />
              </View>
              <Text style={styles.progressText}>
                {totalStudyHours.toFixed(1)} / {weeklyGoal.weekly_hours_target} saat ({goalProgress}%)
              </Text>
            </View>
            <Text style={styles.dateRange}>
              {weeklyGoal.start_date} - {weeklyGoal.end_date}
            </Text>
          </>
        )}

        {studyData && studyData.datasets[0].data.some((val: number) => val > 0) && (
          <View style={styles.chartContainer}>
            <Text style={styles.chartTitle}>Haftalık Çalışma Dağılımı</Text>
            <CustomBarChart data={studyData} height={200} />
          </View>
        )}
      </Card>

      <Card title="Haftalık Soru Hedefi">
        <View style={styles.goalForm}>
          <Input
            placeholder="Hedef soru sayısı (örn: 100)"
            value={questionTargetInput}
            onChangeText={setQuestionTargetInput}
            keyboardType="numeric"
          />
          <Button title="Hedef Kaydet" onPress={handleSaveQuestionTarget} />
        </View>

        {questionPlan && (
          <>
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    styles.progressFillQuestion,
                    { width: `${Math.min(questionProgress, 100)}%` },
                  ]}
                />
              </View>
              <Text style={styles.progressText}>
                {questionPlan.questions_completed ?? 0} / {questionPlan.question_target} soru (
                {questionProgress}%)
              </Text>
            </View>
            <Text style={styles.dateRange}>
              {questionPlan.week_start_date} - {questionPlan.week_end_date}
            </Text>
          </>
        )}
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  content: {
    padding: 16,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  goalForm: {
    gap: 12,
    marginBottom: 16,
  },
  progressContainer: {
    marginTop: 16,
  },
  progressBar: {
    height: 12,
    backgroundColor: '#E5E7EB',
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#6366F1',
    borderRadius: 6,
  },
  progressFillQuestion: {
    backgroundColor: '#10B981',
  },
  progressText: {
    fontSize: 14,
    color: '#0F172A',
    fontWeight: '600',
    textAlign: 'center',
  },
  dateRange: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 8,
  },
  chartContainer: {
    marginTop: 20,
  },
  chartTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 8,
  },
});
