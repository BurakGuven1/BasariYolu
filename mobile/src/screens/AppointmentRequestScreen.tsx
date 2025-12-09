import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  ActivityIndicator,
  Pressable,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import {
  getAvailableTimeSlots,
  requestAppointment,
  getDayName,
} from '../lib/coachingApi';
import { Ionicons } from '@expo/vector-icons';

type Props = NativeStackScreenProps<RootStackParamList, 'AppointmentRequest'>;

export function AppointmentRequestScreen({ navigation, route }: Props) {
  const { subscriptionId, coachId, studentId, coachName } = route.params;

  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState(false);
  const [timeSlots, setTimeSlots] = useState<
    { date: string; time: string; dayOfWeek: number; available: boolean }[]
  >([]);
  const [selectedSlot, setSelectedSlot] = useState<{
    date: string;
    time: string;
  } | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    loadAvailableSlots();
  }, []);

  const loadAvailableSlots = async () => {
    try {
      setLoading(true);
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 14); // Next 2 weeks

      const slots = await getAvailableTimeSlots(coachId, startDate, endDate);
      setTimeSlots(slots.filter((s) => s.available));
    } catch (error) {
      console.error('Error loading slots:', error);
      Alert.alert('Hata', 'Müsait saatler yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const handleRequest = async () => {
    if (!selectedSlot) {
      Alert.alert('Uyarı', 'Lütfen bir tarih ve saat seçin');
      return;
    }

    try {
      setRequesting(true);
      const appointmentDate = `${selectedSlot.date}T${selectedSlot.time}:00`;

      await requestAppointment(subscriptionId, coachId, studentId, {
        appointment_date: appointmentDate,
        duration_minutes: 60,
        title: title || undefined,
        description: description || undefined,
      });

      Alert.alert(
        '✅ Talep Gönderildi',
        'Randevu talebiniz koçunuza iletildi. Onay bekliyor.',
        [{ text: 'Tamam', onPress: () => navigation.goBack() }]
      );
    } catch (error: any) {
      console.error('Error requesting appointment:', error);
      Alert.alert('Hata', error.message || 'Randevu talebi gönderilemedi');
    } finally {
      setRequesting(false);
    }
  };

  // Group slots by date
  const slotsByDate = timeSlots.reduce((acc, slot) => {
    if (!acc[slot.date]) {
      acc[slot.date] = [];
    }
    acc[slot.date].push(slot);
    return acc;
  }, {} as Record<string, typeof timeSlots>);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#7C3AED" />
          <Text style={styles.loadingText}>Müsait saatler yükleniyor...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </Pressable>
        <Text style={styles.headerTitle}>Randevu Talebi</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scroll}>
        <View style={styles.section}>
          <Text style={styles.coachName}>Koç: {coachName}</Text>
          <Text style={styles.sectionTitle}>Müsait Tarih ve Saatler</Text>

          {Object.keys(slotsByDate).length === 0 && (
            <View style={styles.emptyState}>
              <Ionicons name="calendar-outline" size={60} color="#D1D5DB" />
              <Text style={styles.emptyText}>
                Koçunuzun önümüzdeki 2 hafta için müsait saati bulunmuyor
              </Text>
            </View>
          )}

          {Object.entries(slotsByDate).map(([date, slots]) => {
            const dateObj = new Date(date);
            const dayName = getDayName(slots[0].dayOfWeek);
            const formattedDate = dateObj.toLocaleDateString('tr-TR', {
              day: 'numeric',
              month: 'long',
            });

            return (
              <View key={date} style={styles.dateGroup}>
                <Text style={styles.dateHeader}>
                  {dayName}, {formattedDate}
                </Text>
                <View style={styles.timeSlots}>
                  {slots.map((slot) => {
                    const isSelected =
                      selectedSlot?.date === slot.date &&
                      selectedSlot?.time === slot.time;

                    return (
                      <Pressable
                        key={`${slot.date}-${slot.time}`}
                        style={[
                          styles.timeSlot,
                          isSelected && styles.timeSlotSelected,
                        ]}
                        onPress={() =>
                          setSelectedSlot({ date: slot.date, time: slot.time })
                        }
                      >
                        <Text
                          style={[
                            styles.timeSlotText,
                            isSelected && styles.timeSlotTextSelected,
                          ]}
                        >
                          {slot.time}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            );
          })}
        </View>

        {selectedSlot && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Randevu Detayları (Opsiyonel)</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Konu</Text>
              <TextInput
                style={styles.input}
                value={title}
                onChangeText={setTitle}
                placeholder="Örn: Matematik Analiz"
                placeholderTextColor="#9CA3AF"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Açıklama / Notunuz</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={description}
                onChangeText={setDescription}
                placeholder="Görüşmek istediğiniz konular..."
                placeholderTextColor="#9CA3AF"
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>
          </View>
        )}
      </ScrollView>

      {selectedSlot && (
        <View style={styles.footer}>
          <View style={styles.selectedInfo}>
            <Ionicons name="calendar" size={20} color="#7C3AED" />
            <Text style={styles.selectedText}>
              {new Date(selectedSlot.date).toLocaleDateString('tr-TR', {
                day: 'numeric',
                month: 'long',
              })}{' '}
              - {selectedSlot.time}
            </Text>
          </View>
          <Pressable
            style={[styles.requestButton, requesting && styles.requestButtonDisabled]}
            onPress={handleRequest}
            disabled={requesting}
          >
            {requesting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="send" size={20} color="#fff" />
                <Text style={styles.requestButtonText}>Talep Gönder</Text>
              </>
            )}
          </Pressable>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  scroll: {
    flex: 1,
  },
  section: {
    padding: 16,
  },
  coachName: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 16,
  },
  dateGroup: {
    marginBottom: 24,
  },
  dateHeader: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  timeSlots: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  timeSlot: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#fff',
  },
  timeSlotSelected: {
    backgroundColor: '#7C3AED',
    borderColor: '#7C3AED',
  },
  timeSlotText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  timeSlotTextSelected: {
    color: '#fff',
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 14,
    color: '#111827',
  },
  textArea: {
    height: 100,
    paddingTop: 12,
  },
  footer: {
    backgroundColor: '#fff',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  selectedInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
    padding: 12,
    backgroundColor: '#EEF2FF',
    borderRadius: 8,
  },
  selectedText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4F46E5',
    flex: 1,
  },
  requestButton: {
    backgroundColor: '#7C3AED',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 8,
    gap: 8,
  },
  requestButtonDisabled: {
    opacity: 0.6,
  },
  requestButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
