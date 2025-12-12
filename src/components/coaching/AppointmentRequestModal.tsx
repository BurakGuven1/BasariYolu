import { useState, useEffect } from 'react';
import { X, Calendar, Clock, Send, Loader } from 'lucide-react';
import {
  getAvailableTimeSlots,
  requestAppointment,
  getDayName,
  type StudentCoachingSubscription,
} from '../../lib/coachingApi';

interface AppointmentRequestModalProps {
  subscription: StudentCoachingSubscription;
  studentId: string;
  onClose: () => void;
  onSuccess: () => void;
}

interface TimeSlot {
  date: string;
  time: string;
  dayOfWeek?: number;
  available: boolean;
}

export default function AppointmentRequestModal({
  subscription,
  studentId,
  onClose,
  onSuccess,
}: AppointmentRequestModalProps) {
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState(false);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<{ date: string; time: string } | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    loadAvailableSlots();
  }, [subscription.coach_id]);

  const loadAvailableSlots = async () => {
    try {
      setLoading(true);
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 14); // Next 2 weeks

      const slots = await getAvailableTimeSlots(subscription.coach_id, startDate, endDate);
      setTimeSlots(slots.filter((s) => s.available));
    } catch (error) {
      console.error('Error loading slots:', error);
      alert('Müsait saatler yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleRequest = async () => {
    if (!selectedSlot) {
      alert('Lütfen bir tarih ve saat seçin');
      return;
    }

    try {
      setRequesting(true);

      // Create date in local timezone (Turkey/Istanbul)
      const localDateTime = new Date(`${selectedSlot.date}T${selectedSlot.time}:00`);

      // Convert to ISO string for database
      const appointmentDate = localDateTime.toISOString();

      await requestAppointment(subscription.id, subscription.coach_id, studentId, {
        appointment_date: appointmentDate,
        duration_minutes: 45,
        title: title || undefined,
        description: description || undefined,
      });

      alert('✅ Talep Gönderildi! Koçunuz talebi değerlendirip size dönüş yapacaktır.');
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error requesting appointment:', error);
      alert(error.message || 'Randevu talebi gönderilemedi');
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
  }, {} as Record<string, TimeSlot[]>);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto my-8">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 z-10">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">📅 Randevu Talebi Oluştur</h2>
              <p className="text-sm text-gray-600 mt-1">
                Koç: {subscription.coach?.full_name} • Kalan Seans: {subscription.remaining_sessions}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader className="h-12 w-12 text-indigo-600 animate-spin mb-4" />
              <p className="text-gray-600">Müsait saatler yükleniyor...</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Available Time Slots */}
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-4">Müsait Tarih ve Saatler</h3>

                {Object.keys(slotsByDate).length === 0 ? (
                  <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
                    <Calendar className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                    <p className="text-gray-600 font-medium">
                      Koçunuzun önümüzdeki 2 hafta için müsait saati bulunmuyor
                    </p>
                    <p className="text-gray-500 text-sm mt-2">
                      Lütfen daha sonra tekrar deneyin veya koçunuzla iletişime geçin
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {Object.entries(slotsByDate).map(([date, slots]) => {
                      const dateObj = new Date(date);
                      const dayName = slots[0].dayOfWeek !== undefined ? getDayName(slots[0].dayOfWeek) : '';
                      const formattedDate = dateObj.toLocaleDateString('tr-TR', {
                        day: 'numeric',
                        month: 'long',
                        weekday: 'long',
                      });

                      return (
                        <div key={date} className="border-2 border-gray-200 rounded-lg p-4">
                          <h4 className="font-semibold text-gray-900 mb-3">{formattedDate}</h4>
                          <div className="flex flex-wrap gap-2">
                            {slots.map((slot) => {
                              const isSelected =
                                selectedSlot?.date === slot.date && selectedSlot?.time === slot.time;

                              return (
                                <button
                                  key={`${slot.date}-${slot.time}`}
                                  onClick={() => setSelectedSlot({ date: slot.date, time: slot.time })}
                                  className={`px-4 py-2 rounded-lg border-2 font-medium transition-all ${
                                    isSelected
                                      ? 'bg-indigo-600 text-white border-indigo-600'
                                      : 'bg-white text-gray-700 border-gray-300 hover:border-indigo-400 hover:bg-indigo-50'
                                  }`}
                                >
                                  {slot.time}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Appointment Details */}
              {selectedSlot && (
                <div className="border-2 border-indigo-200 rounded-lg p-6 bg-indigo-50">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Randevu Detayları (Opsiyonel)</h3>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Konu</label>
                      <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        placeholder="Örn: Matematik Sınav Hazırlığı"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Açıklama / Notunuz
                      </label>
                      <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={3}
                        className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                        placeholder="Görüşmek istediğiniz konular..."
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {selectedSlot && !loading && (
          <div className="sticky bottom-0 bg-white border-t border-gray-200 p-6">
            <div className="flex items-center gap-4">
              <div className="flex-1 flex items-center gap-3 p-4 bg-indigo-50 rounded-lg">
                <Calendar className="h-6 w-6 text-indigo-600" />
                <div>
                  <p className="font-semibold text-gray-900">Seçili Randevu</p>
                  <p className="text-sm text-gray-600">
                    {new Date(selectedSlot.date).toLocaleDateString('tr-TR', {
                      day: 'numeric',
                      month: 'long',
                      weekday: 'long',
                    })}{' '}
                    - {selectedSlot.time}
                  </p>
                </div>
              </div>

              <button
                onClick={handleRequest}
                disabled={requesting}
                className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium whitespace-nowrap"
              >
                {requesting ? (
                  <>
                    <Loader className="h-5 w-5 animate-spin" />
                    Gönderiliyor...
                  </>
                ) : (
                  <>
                    <Send className="h-5 w-5" />
                    Talep Gönder
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
