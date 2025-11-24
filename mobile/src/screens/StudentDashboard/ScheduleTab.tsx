import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Pressable,
  Alert,
} from 'react-native';
import { Card } from '../../components/ui/Card';
import { supabase } from '../../lib/supabase';

interface ScheduleTabProps {
  studentId: string;
}

const DAYS_OF_WEEK = [
  { value: 0, label: 'Pazartesi', short: 'Pzt' },
  { value: 1, label: 'Salı', short: 'Sal' },
  { value: 2, label: 'Çarşamba', short: 'Çar' },
  { value: 3, label: 'Perşembe', short: 'Per' },
  { value: 4, label: 'Cuma', short: 'Cum' },
  { value: 5, label: 'Cumartesi', short: 'Cmt' },
  { value: 6, label: 'Pazar', short: 'Paz' },
];

export const ScheduleTab: React.FC<ScheduleTabProps> = ({ studentId }) => {
  const [loading, setLoading] = useState(true);
  const [schedule, setSchedule] = useState<any>(null);
  const [selectedDay, setSelectedDay] = useState<number>(
    new Date().getDay() === 0 ? 6 : new Date().getDay() - 1
  );

  useEffect(() => {
    loadSchedule();
  }, [studentId]);

  const loadSchedule = async () => {
    setLoading(true);
    try {
      const now = new Date();
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - (now.getDay() === 0 ? 6 : now.getDay() - 1));
      startOfWeek.setHours(0, 0, 0, 0);

      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      endOfWeek.setHours(23, 59, 59, 999);

      const { data, error } = await supabase
        .from('study_schedules')
        .select(`
          *,
          study_schedule_items (*),
          teacher:teacher_id (
            profiles:profiles!students_profile_id_fkey (
              full_name
            )
          )
        `)
        .eq('student_id', studentId)
        .lte('week_start_date', endOfWeek.toISOString())
        .gte('week_end_date', startOfWeek.toISOString())
        .maybeSingle();

      if (error) {
        console.error('Error loading schedule:', error);
      }

      if (data && endOfWeek >= now) {
        setSchedule(data);
      } else {
        setSchedule(null);
      }
    } catch (e: any) {
      console.error('Schedule load error:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleComplete = async (itemId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('study_schedule_items')
        .update({
          is_completed: !currentStatus,
          completed_at: !currentStatus ? new Date().toISOString() : null,
        })
        .eq('id', itemId);

      if (error) throw error;

      setSchedule((prev: any) => {
        if (!prev) return prev;
        return {
          ...prev,
          study_schedule_items: prev.study_schedule_items.map((item: any) =>
            item.id === itemId
              ? {
                  ...item,
                  is_completed: !currentStatus,
                  completed_at: !currentStatus ? new Date().toISOString() : null,
                }
              : item
          ),
        };
      });
    } catch (e: any) {
      Alert.alert('Hata', e?.message ?? 'Durum güncellenemedi');
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#6366F1" />
      </View>
    );
  }

  if (!schedule) {
    return (
      <View style={styles.container}>
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
          <Card style={styles.emptyCard}>
            <Text style={styles.emptyIcon}>📅</Text>
            <Text style={styles.emptyTitle}>Henüz Program Yok</Text>
            <Text style={styles.emptyText}>
              Öğretmeniniz bu hafta için henüz bir çalışma programı yayınlamadı.
            </Text>
          </Card>
        </ScrollView>
      </View>
    );
  }

  const itemsByDay = DAYS_OF_WEEK.map((day) => ({
    day,
    items: schedule.study_schedule_items
      .filter((item: any) => item.day_of_week === day.value)
      .sort((a: any, b: any) => a.start_time.localeCompare(b.start_time)),
  }));

  const selectedDayData = itemsByDay.find((d) => d.day.value === selectedDay);
  const totalItems = schedule.study_schedule_items?.length || 0;
  const completedItems = schedule.study_schedule_items?.filter((item: any) => item.is_completed).length || 0;
  const completionRate = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <Card style={styles.headerCard}>
          <Text style={styles.headerTitle}>Haftalık Çalışma Programım</Text>
          <Text style={styles.headerDate}>
            {new Date(schedule.week_start_date).toLocaleDateString('tr-TR')} -{' '}
            {new Date(schedule.week_end_date).toLocaleDateString('tr-TR')}
          </Text>

          {schedule.teacher?.profiles?.full_name && (
            <View style={styles.teacherInfo}>
              <Text style={styles.teacherLabel}>👨‍🏫 Öğretmen</Text>
              <Text style={styles.teacherName}>{schedule.teacher.profiles.full_name}</Text>
            </View>
          )}

          {schedule.description && (
            <View style={styles.descriptionBox}>
              <Text style={styles.descriptionText}>{schedule.description}</Text>
            </View>
          )}

          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{totalItems}</Text>
              <Text style={styles.statLabel}>Toplam Ders</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statValueGreen}>{completedItems}</Text>
              <Text style={styles.statLabel}>Tamamlanan</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statValueOrange}>{totalItems - completedItems}</Text>
              <Text style={styles.statLabel}>Kalan</Text>
            </View>
          </View>

          <View style={styles.progressContainer}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressLabel}>Haftalık İlerleme</Text>
              <Text style={styles.progressPercent}>{completionRate}%</Text>
            </View>
            <View style={styles.progressBar}>
              <View
                style={[styles.progressFill, { width: `${completionRate}%` }]}
              />
            </View>
          </View>
        </Card>

        <Card style={styles.daySelectorCard}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.daysContainer}
          >
            {DAYS_OF_WEEK.map((day) => {
              const dayItems = itemsByDay.find((d) => d.day.value === day.value)?.items || [];
              const dayCompleted = dayItems.filter((item: any) => item.is_completed).length;
              const dayTotal = dayItems.length;
              const isToday = day.value === (new Date().getDay() === 0 ? 6 : new Date().getDay() - 1);

              return (
                <Pressable
                  key={day.value}
                  style={[
                    styles.dayButton,
                    selectedDay === day.value && styles.dayButtonActive,
                  ]}
                  onPress={() => setSelectedDay(day.value)}
                >
                  <Text
                    style={[
                      styles.dayButtonShort,
                      selectedDay === day.value && styles.dayButtonTextActive,
                    ]}
                  >
                    {day.short}
                  </Text>
                  <Text
                    style={[
                      styles.dayButtonCount,
                      selectedDay === day.value && styles.dayButtonTextActive,
                    ]}
                  >
                    {dayTotal}
                  </Text>
                  {isToday && <View style={styles.todayIndicator} />}
                  {dayTotal > 0 && (
                    <Text
                      style={[
                        styles.dayButtonProgress,
                        selectedDay === day.value && styles.dayButtonTextActive,
                      ]}
                    >
                      {dayCompleted}/{dayTotal}
                    </Text>
                  )}
                </Pressable>
              );
            })}
          </ScrollView>
        </Card>

        <Card style={styles.dayScheduleCard}>
          <View style={styles.dayHeader}>
            <Text style={styles.dayHeaderTitle}>{selectedDayData?.day.label}</Text>
            <Text style={styles.dayHeaderSubtitle}>
              {selectedDayData?.items.length || 0} ders planlandı
            </Text>
          </View>

          {!selectedDayData?.items.length ? (
            <View style={styles.emptyDay}>
              <Text style={styles.emptyDayIcon}>📚</Text>
              <Text style={styles.emptyDayText}>Bu gün için ders planlanmamış</Text>
            </View>
          ) : (
            <View style={styles.scheduleItems}>
              {selectedDayData.items.map((item: any) => (
                <View
                  key={item.id}
                  style={[
                    styles.scheduleItem,
                    item.is_completed && styles.scheduleItemCompleted,
                  ]}
                >
                  <View style={styles.scheduleItemContent}>
                    <View style={styles.scheduleItemHeader}>
                      <View style={styles.scheduleItemTime}>
                        <Text style={styles.scheduleItemTimeText}>
                          ⏰ {item.start_time} - {item.end_time}
                        </Text>
                      </View>
                      <Pressable
                        onPress={() => handleToggleComplete(item.id, item.is_completed)}
                        style={[
                          styles.checkButton,
                          item.is_completed && styles.checkButtonActive,
                        ]}
                      >
                        {item.is_completed && <Text style={styles.checkIcon}>✓</Text>}
                      </Pressable>
                    </View>

                    <Text style={styles.scheduleItemSubject}>{item.subject}</Text>

                    {item.topic && (
                      <View style={styles.scheduleItemDetail}>
                        <Text style={styles.scheduleItemDetailIcon}>📖</Text>
                        <Text style={styles.scheduleItemDetailText}>{item.topic}</Text>
                      </View>
                    )}

                    {item.goal && (
                      <View style={styles.scheduleItemDetail}>
                        <Text style={styles.scheduleItemDetailIcon}>🎯</Text>
                        <Text style={styles.scheduleItemDetailText}>{item.goal}</Text>
                      </View>
                    )}

                    {item.description && (
                      <View style={styles.scheduleItemDescription}>
                        <Text style={styles.scheduleItemDescriptionText}>
                          {item.description}
                        </Text>
                      </View>
                    )}

                    {item.resources && (
                      <View style={styles.scheduleItemResources}>
                        <Text style={styles.scheduleItemResourcesText}>
                          📚 Kaynaklar: {item.resources}
                        </Text>
                      </View>
                    )}

                    {item.is_completed && item.completed_at && (
                      <View style={styles.completedBadge}>
                        <Text style={styles.completedBadgeText}>
                          ✓ Tamamlandı:{' '}
                          {new Date(item.completed_at).toLocaleString('tr-TR')}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              ))}
            </View>
          )}
        </Card>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyCard: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  headerCard: {
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#6366F1',
    marginBottom: 4,
  },
  headerDate: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 12,
  },
  teacherInfo: {
    backgroundColor: '#EEF2FF',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  teacherLabel: {
    fontSize: 12,
    color: '#6366F1',
    marginBottom: 4,
  },
  teacherName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#6366F1',
  },
  descriptionBox: {
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  descriptionText: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#6366F1',
    marginBottom: 4,
  },
  statValueGreen: {
    fontSize: 24,
    fontWeight: '800',
    color: '#10B981',
    marginBottom: 4,
  },
  statValueOrange: {
    fontSize: 24,
    fontWeight: '800',
    color: '#F97316',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    color: '#6B7280',
  },
  progressContainer: {
    gap: 8,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
  },
  progressPercent: {
    fontSize: 14,
    fontWeight: '800',
    color: '#6366F1',
  },
  progressBar: {
    height: 12,
    backgroundColor: '#E5E7EB',
    borderRadius: 6,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#6366F1',
    borderRadius: 6,
  },
  daySelectorCard: {
    marginBottom: 16,
    paddingVertical: 12,
  },
  daysContainer: {
    gap: 8,
    paddingHorizontal: 4,
  },
  dayButton: {
    width: 60,
    paddingVertical: 12,
    paddingHorizontal: 8,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    gap: 4,
  },
  dayButtonActive: {
    backgroundColor: '#6366F1',
    borderColor: '#6366F1',
  },
  dayButtonShort: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6B7280',
  },
  dayButtonCount: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  dayButtonProgress: {
    fontSize: 10,
    color: '#9CA3AF',
  },
  dayButtonTextActive: {
    color: '#FFFFFF',
  },
  todayIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FBBF24',
  },
  dayScheduleCard: {
    marginBottom: 16,
  },
  dayHeader: {
    paddingBottom: 16,
    borderBottomWidth: 2,
    borderBottomColor: '#6366F1',
    marginBottom: 16,
  },
  dayHeaderTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#6366F1',
    marginBottom: 4,
  },
  dayHeaderSubtitle: {
    fontSize: 13,
    color: '#6B7280',
  },
  emptyDay: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyDayIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyDayText: {
    fontSize: 14,
    color: '#6B7280',
  },
  scheduleItems: {
    gap: 12,
  },
  scheduleItem: {
    backgroundColor: '#F8FAFC',
    borderLeftWidth: 4,
    borderLeftColor: '#6366F1',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  scheduleItemCompleted: {
    backgroundColor: '#F0FDF4',
    borderLeftColor: '#10B981',
  },
  scheduleItemContent: {
    gap: 8,
  },
  scheduleItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  scheduleItemTime: {},
  scheduleItemTimeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  checkButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkButtonActive: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  checkIcon: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  scheduleItemSubject: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  scheduleItemDetail: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
  },
  scheduleItemDetailIcon: {
    fontSize: 14,
  },
  scheduleItemDetailText: {
    flex: 1,
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
  },
  scheduleItemDescription: {
    backgroundColor: '#FFFFFF',
    padding: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  scheduleItemDescriptionText: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
  },
  scheduleItemResources: {
    backgroundColor: '#FFFBEB',
    padding: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  scheduleItemResourcesText: {
    fontSize: 12,
    color: '#92400E',
    lineHeight: 16,
  },
  completedBadge: {
    marginTop: 4,
  },
  completedBadgeText: {
    fontSize: 11,
    color: '#10B981',
    fontWeight: '600',
  },
});
