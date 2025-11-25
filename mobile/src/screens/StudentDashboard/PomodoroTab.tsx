import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Alert } from 'react-native';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import {
  savePomodoroSession,
  getTodayPomodoroStats,
  getPomodoroSessions,
} from '../../lib/studentApi';

interface PomodoroTabProps {
  studentId: string;
}

type PomodoroType = 'short' | 'long';

export const PomodoroTab: React.FC<PomodoroTabProps> = ({ studentId }) => {
  const [pomodoroType, setPomodoroType] = useState<PomodoroType>('short');
  const [totalSessions, setTotalSessions] = useState(4);
  const [currentSession, setCurrentSession] = useState(1);
  const [completedSessions, setCompletedSessions] = useState(0);

  const DURATIONS = {
    short: { focus: 25, break: 5 },
    long: { focus: 50, break: 10 },
  };

  const [timer, setTimer] = useState(DURATIONS[pomodoroType].focus * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [isBreak, setIsBreak] = useState(false);
  const [subject, setSubject] = useState('');
  const [notes, setNotes] = useState('');
  const [todayStats, setTodayStats] = useState({
    totalSessions: 0,
    completedSessions: 0,
    totalMinutes: 0,
  });
  const [recentSessions, setRecentSessions] = useState<any[]>([]);

  useEffect(() => {
    loadStats();
    loadRecentSessions();
  }, [studentId]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRunning && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else if (timer === 0) {
      handleTimerComplete();
    }
    return () => clearInterval(interval);
  }, [isRunning, timer]);

  const loadStats = async () => {
    try {
      const stats = await getTodayPomodoroStats(studentId);
      setTodayStats(stats);
    } catch (e: any) {
      console.error('Pomodoro stats load error:', e);
    }
  };

  const loadRecentSessions = async () => {
    try {
      const now = new Date();
      const weekAgo = new Date(now);
      weekAgo.setDate(now.getDate() - 7);
      const sessions = await getPomodoroSessions(
        studentId,
        weekAgo.toISOString(),
        now.toISOString()
      );
      setRecentSessions(sessions.slice(0, 10));
    } catch (e: any) {
      console.error('Recent sessions load error:', e);
    }
  };

  const handleTimerComplete = async () => {
    setIsRunning(false);
    const durations = DURATIONS[pomodoroType];
    const durationMinutes = isBreak ? durations.break : durations.focus;

    if (!isBreak) {
      // Save work session
      try {
        await savePomodoroSession({
          student_id: studentId,
          started_at: new Date().toISOString(),
          duration_minutes: durationMinutes,
          subject: subject || undefined,
          notes: notes || undefined,
          completed: true,
          session_type: 'focus',
        });

        const newCompleted = completedSessions + 1;
        setCompletedSessions(newCompleted);

        if (newCompleted >= totalSessions) {
          // All sessions completed
          Alert.alert(
            '🎉 Tebrikler!',
            `Tüm ${totalSessions} pomodoro seansını tamamladın!`,
            [
              {
                text: 'Yeni Başlat',
                onPress: () => {
                  setCompletedSessions(0);
                  setCurrentSession(1);
                  setSubject('');
                  setNotes('');
                  setIsBreak(false);
                  setTimer(durations.focus * 60);
                },
              },
            ]
          );
        } else {
          Alert.alert(
            '✅ Seans Tamamlandı!',
            `${durations.break} dakika mola verin.\n${newCompleted}/${totalSessions} seans tamamlandı.`,
            [{ text: 'Tamam' }]
          );
          setCurrentSession(currentSession + 1);
        }

        loadStats();
        loadRecentSessions();
      } catch (e: any) {
        Alert.alert('Hata', 'Seans kaydedilemedi');
      }
    } else {
      Alert.alert('Mola Bitti', 'Yeni pomodoro seansına başlayabilirsin!', [
        { text: 'Tamam' },
      ]);
    }

    setIsBreak(!isBreak);
    setTimer(isBreak ? durations.focus * 60 : durations.break * 60);
  };

  const handleStart = () => {
    setIsRunning(true);
  };

  const handlePause = () => {
    setIsRunning(false);
  };

  const handleReset = () => {
    Alert.alert(
      'Sıfırla',
      'Pomodoro seansını sıfırlamak istediğine emin misin?',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Sıfırla',
          style: 'destructive',
          onPress: () => {
            setIsRunning(false);
            setIsBreak(false);
            setCompletedSessions(0);
            setCurrentSession(1);
            setTimer(DURATIONS[pomodoroType].focus * 60);
            setSubject('');
            setNotes('');
          },
        },
      ]
    );
  };

  const handlePomodoroTypeChange = (type: PomodoroType) => {
    if (isRunning) {
      Alert.alert('Uyarı', 'Çalışan bir pomodoro varken tip değiştiremezsiniz');
      return;
    }
    setPomodoroType(type);
    setTimer(DURATIONS[type].focus * 60);
    setIsBreak(false);
  };

  const handleSessionCountChange = (count: number) => {
    if (isRunning) {
      Alert.alert('Uyarı', 'Çalışan bir pomodoro varken session sayısı değiştiremezsiniz');
      return;
    }
    setTotalSessions(count);
    setCompletedSessions(0);
    setCurrentSession(1);
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = ((DURATIONS[pomodoroType][isBreak ? 'break' : 'focus'] * 60 - timer) / (DURATIONS[pomodoroType][isBreak ? 'break' : 'focus'] * 60)) * 100;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Settings Card - Only show when not running */}
      {!isRunning && !isBreak && (
        <Card style={styles.settingsCard}>
          <Text style={styles.settingsTitle}>⚙️ Pomodoro Ayarları</Text>

          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Pomodoro Tipi</Text>
            <View style={styles.typeButtons}>
              <Pressable
                style={[
                  styles.typeButton,
                  pomodoroType === 'short' && styles.typeButtonActive,
                ]}
                onPress={() => handlePomodoroTypeChange('short')}
              >
                <Text
                  style={[
                    styles.typeButtonText,
                    pomodoroType === 'short' && styles.typeButtonTextActive,
                  ]}
                >
                  Kısa (25/5)
                </Text>
              </Pressable>
              <Pressable
                style={[
                  styles.typeButton,
                  pomodoroType === 'long' && styles.typeButtonActive,
                ]}
                onPress={() => handlePomodoroTypeChange('long')}
              >
                <Text
                  style={[
                    styles.typeButtonText,
                    pomodoroType === 'long' && styles.typeButtonTextActive,
                  ]}
                >
                  Uzun (50/10)
                </Text>
              </Pressable>
            </View>
          </View>

          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Session Sayısı: {totalSessions}</Text>
            <View style={styles.sessionButtons}>
              {[1, 2, 3, 4, 5, 6, 8, 10].map((count) => (
                <Pressable
                  key={count}
                  style={[
                    styles.sessionButton,
                    totalSessions === count && styles.sessionButtonActive,
                  ]}
                  onPress={() => handleSessionCountChange(count)}
                >
                  <Text
                    style={[
                      styles.sessionButtonText,
                      totalSessions === count && styles.sessionButtonTextActive,
                    ]}
                  >
                    {count}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        </Card>
      )}

      {/* Timer Card */}
      <Card style={styles.timerCard}>
        <View style={styles.sessionInfo}>
          <Text style={styles.sessionText}>
            Session {currentSession} / {totalSessions}
          </Text>
          <Text style={styles.sessionCompleted}>
            ✅ {completedSessions} tamamlandı
          </Text>
        </View>

        <View style={styles.timerContainer}>
          <Text style={styles.timerLabel}>
            {isBreak ? '☕ Mola Zamanı' : '🎯 Odaklan'}
          </Text>
          <Text style={styles.timerText}>{formatTime(timer)}</Text>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progress}%` }]} />
          </View>
          <Text style={styles.pomodoroTypeLabel}>
            {pomodoroType === 'short' ? 'Kısa Pomodoro (25/5)' : 'Uzun Pomodoro (50/10)'}
          </Text>
        </View>

        <View style={styles.controlButtons}>
          {!isRunning ? (
            <Button title="Başlat" onPress={handleStart} />
          ) : (
            <Button title="Duraklat" onPress={handlePause} variant="secondary" />
          )}
          <Button title="Sıfırla" onPress={handleReset} variant="secondary" />
        </View>
      </Card>

      {/* Inputs - Only show when timer not running and not on break */}
      {!isRunning && !isBreak && (
        <Card title="Çalışma Detayları (Opsiyonel)">
          <View style={styles.inputsContainer}>
            <Text style={styles.inputLabel}>Ders/Konu</Text>
            <Input
              placeholder="Örn: Matematik"
              value={subject}
              onChangeText={setSubject}
            />
            <Text style={styles.inputLabel}>Notlar</Text>
            <Input
              placeholder="Bu seansla ilgili notlar..."
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={2}
            />
          </View>
        </Card>
      )}

      {/* Today's Stats */}
      <Card title="Bugünün İstatistikleri">
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{todayStats.totalSessions}</Text>
            <Text style={styles.statLabel}>Toplam Seans</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{todayStats.completedSessions}</Text>
            <Text style={styles.statLabel}>Tamamlanan</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{todayStats.totalMinutes}</Text>
            <Text style={styles.statLabel}>Toplam Dakika</Text>
          </View>
        </View>
      </Card>

      {/* Recent Sessions */}
      {recentSessions.length > 0 && (
        <Card title="Son Seanslar (7 Gün)">
          {recentSessions.map((session, index) => (
            <View key={index} style={styles.sessionRow}>
              <Text style={styles.sessionDate}>
                {new Date(session.started_at).toLocaleDateString('tr-TR', {
                  day: 'numeric',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </Text>
              <Text style={styles.sessionDuration}>{session.duration_minutes} dk</Text>
              {session.completed && <Text style={styles.sessionCompleted}>✓</Text>}
            </View>
          ))}
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
    paddingBottom: 32,
  },
  settingsCard: {
    marginBottom: 16,
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  settingsTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#92400E',
    marginBottom: 16,
  },
  settingRow: {
    marginBottom: 16,
  },
  settingLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#78350F',
    marginBottom: 8,
  },
  typeButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  typeButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#FDE68A',
    alignItems: 'center',
  },
  typeButtonActive: {
    backgroundColor: '#6366F1',
    borderColor: '#6366F1',
  },
  typeButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#92400E',
  },
  typeButtonTextActive: {
    color: '#FFFFFF',
  },
  sessionButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  sessionButton: {
    width: 45,
    height: 45,
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#FDE68A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sessionButtonActive: {
    backgroundColor: '#6366F1',
    borderColor: '#6366F1',
  },
  sessionButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#92400E',
  },
  sessionButtonTextActive: {
    color: '#FFFFFF',
  },
  timerCard: {
    marginBottom: 16,
    alignItems: 'center',
  },
  sessionInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  sessionText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#6366F1',
  },
  sessionCompleted: {
    fontSize: 13,
    fontWeight: '600',
    color: '#10B981',
  },
  timerContainer: {
    alignItems: 'center',
    marginBottom: 24,
    width: '100%',
  },
  timerLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 8,
  },
  timerText: {
    fontSize: 64,
    fontWeight: '800',
    color: '#6366F1',
    marginBottom: 16,
  },
  progressBar: {
    width: '100%',
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#6366F1',
    borderRadius: 4,
  },
  pomodoroTypeLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  controlButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  inputsContainer: {
    gap: 12,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 4,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#6366F1',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6B7280',
    textAlign: 'center',
  },
  sessionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  sessionDate: {
    fontSize: 12,
    color: '#6B7280',
    flex: 1,
  },
  sessionDuration: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    marginRight: 8,
  },
});
