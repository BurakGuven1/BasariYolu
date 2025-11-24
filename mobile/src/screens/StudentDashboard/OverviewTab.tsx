import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { Card } from '../../components/ui/Card';
import { CustomLineChart } from '../../components/ui/Chart';
import {
  fetchExamResults,
  fetchHomeworks,
  fetchWeeklyGoal,
  fetchQuestionPlan,
  getWeeklyStudySessions,
} from '../../lib/studentApi';

interface OverviewTabProps {
  student: any;
  profile: any;
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

export const OverviewTab: React.FC<OverviewTabProps> = ({ student, profile }) => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalExams: 0,
    pendingHomeworks: 0,
    weeklyStudyHours: 0,
    weeklyGoalHours: 0,
    questionTarget: 0,
    questionsCompleted: 0,
    lastExamScore: null as number | null,
  });
  const [weeklyData, setWeeklyData] = useState<any>(null);

  useEffect(() => {
    const loadOverviewData = async () => {
      if (!student?.id) return;
      setLoading(true);
      try {
        const { startDate, endDate } = getCurrentWeekRange();

        const [exams, homeworks, weeklyGoal, questionPlan, studySessions] = await Promise.all([
          fetchExamResults(student.id),
          fetchHomeworks(student.id),
          fetchWeeklyGoal(student.id),
          fetchQuestionPlan(student.id),
          getWeeklyStudySessions(student.id, startDate, endDate),
        ]);

        const totalStudyHours = studySessions.reduce((sum, session) => sum + (session.duration_hours ?? 0), 0);
        const lastExam = exams.length > 0 ? exams[0] : null;

        setStats({
          totalExams: exams.length,
          pendingHomeworks: homeworks.filter((h: any) => !h.completed).length,
          weeklyStudyHours: totalStudyHours,
          weeklyGoalHours: weeklyGoal?.weekly_hours_target ?? 0,
          questionTarget: questionPlan?.question_target ?? 0,
          questionsCompleted: questionPlan?.questions_completed ?? 0,
          lastExamScore: lastExam?.score ?? null,
        });

        // Prepare chart data for last 7 exams
        if (exams.length > 0) {
          const recentExams = exams.slice(0, 7).reverse();
          setWeeklyData({
            labels: recentExams.map((e: any) => e.exam_name?.substring(0, 8) ?? 'Deneme'),
            datasets: [
              {
                data: recentExams.map((e: any) => e.score ?? 0),
                color: (opacity = 1) => `rgba(99, 102, 241, ${opacity})`,
                strokeWidth: 2,
              },
            ],
          });
        }
      } catch (e: any) {
        console.error('Overview data load error:', e);
      } finally {
        setLoading(false);
      }
    };
    loadOverviewData();
  }, [student?.id]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#6366F1" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Card title="Profil Bilgileri">
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Ad Soyad:</Text>
          <Text style={styles.infoValue}>{profile?.full_name ?? 'Belirtilmemiş'}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Okul:</Text>
          <Text style={styles.infoValue}>{profile?.school_name ?? 'Belirtilmemiş'}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Sınıf:</Text>
          <Text style={styles.infoValue}>{profile?.grade ? `${profile.grade}. Sınıf` : 'Belirtilmemiş'}</Text>
        </View>
        {student?.invite_code && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Davet Kodu:</Text>
            <Text style={[styles.infoValue, styles.inviteCode]}>{student.invite_code}</Text>
          </View>
        )}
        {profile?.package_type && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Paket:</Text>
            <Text style={styles.infoValue}>{profile.package_type}</Text>
          </View>
        )}
      </Card>

      <Card title="İstatistikler">
        <View style={styles.statsGrid}>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{stats.totalExams}</Text>
            <Text style={styles.statLabel}>Toplam Deneme</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{stats.pendingHomeworks}</Text>
            <Text style={styles.statLabel}>Bekleyen Ödev</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>
              {stats.weeklyStudyHours.toFixed(1)} / {stats.weeklyGoalHours}
            </Text>
            <Text style={styles.statLabel}>Haftalık Saat</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>
              {stats.questionsCompleted} / {stats.questionTarget}
            </Text>
            <Text style={styles.statLabel}>Soru Hedefi</Text>
          </View>
        </View>
      </Card>

      {stats.lastExamScore !== null && (
        <Card title="Son Deneme Puanı">
          <View style={styles.scoreBox}>
            <Text style={styles.scoreValue}>{stats.lastExamScore}</Text>
            <Text style={styles.scoreLabel}>Puan</Text>
          </View>
        </Card>
      )}

      {weeklyData && (
        <Card title="Deneme Performansı (Son 7)">
          <CustomLineChart data={weeklyData} height={200} />
        </Card>
      )}
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
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  infoLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 14,
    color: '#0F172A',
    fontWeight: '600',
  },
  inviteCode: {
    color: '#6366F1',
    fontFamily: 'monospace',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statBox: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#F8FAFC',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#6366F1',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  scoreBox: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#EEF2FF',
    borderRadius: 12,
  },
  scoreValue: {
    fontSize: 48,
    fontWeight: '800',
    color: '#6366F1',
  },
  scoreLabel: {
    fontSize: 16,
    color: '#4338CA',
    marginTop: 8,
  },
});
