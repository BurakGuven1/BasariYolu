import { useState, useEffect } from 'react';
import { X, Calendar, Clock, Video, User, FileText, Save } from 'lucide-react';
import {
  createAppointment,
  updateAppointment,
  deleteAppointment,
  type StudentCoachingSubscription,
  type CoachingAppointment,
} from '../../lib/coachingApi';

interface AppointmentModalProps {
  coachId: string;
  subscriptions: StudentCoachingSubscription[];
  editingAppointment: CoachingAppointment | null;
  onClose: () => void;
}

export default function AppointmentModal({
  coachId,
  subscriptions,
  editingAppointment,
  onClose,
}: AppointmentModalProps) {
  const [loading, setLoading] = useState(false);
  const [selectedSubscription, setSelectedSubscription] = useState<string>('');
  const [appointmentDate, setAppointmentDate] = useState('');
  const [appointmentTime, setAppointmentTime] = useState('');
  const [duration, setDuration] = useState('60');
  const [googleMeetLink, setGoogleMeetLink] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (editingAppointment) {
      // Parse existing appointment
      const date = new Date(editingAppointment.appointment_date);
      setAppointmentDate(date.toISOString().split('T')[0]);
      setAppointmentTime(
        `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
      );
      setDuration(editingAppointment.duration_minutes.toString());
      setGoogleMeetLink(editingAppointment.google_meet_link || '');
      setTitle(editingAppointment.title || '');
      setDescription(editingAppointment.description || '');
      setSelectedSubscription(editingAppointment.subscription_id);
    } else {
      // Set defaults for new appointment
      const now = new Date();
      const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      setAppointmentDate(tomorrow.toISOString().split('T')[0]);
      setAppointmentTime('10:00');
      setDuration('60');
      setTitle('Koçluk Görüşmesi');
    }
  }, [editingAppointment]);

  const handleSave = async () => {
    if (!appointmentDate || !appointmentTime) {
      alert('Lütfen tarih ve saat seçin');
      return;
    }

    if (!editingAppointment && !selectedSubscription) {
      alert('Lütfen öğrenci seçin');
      return;
    }

    try {
      setLoading(true);

      // Combine date and time
      const appointmentDateTime = new Date(`${appointmentDate}T${appointmentTime}`);

      if (editingAppointment) {
        // Update existing appointment
        await updateAppointment(editingAppointment.id, {
          appointment_date: appointmentDateTime.toISOString(),
          duration_minutes: parseInt(duration),
          google_meet_link: googleMeetLink || undefined,
          title: title || undefined,
          description: description || undefined,
        });
      } else {
        // Create new appointment
        const subscription = subscriptions.find((s) => s.id === selectedSubscription);
        if (!subscription) {
          throw new Error('Subscription not found');
        }

        await createAppointment(selectedSubscription, coachId, subscription.student_id, {
          appointment_date: appointmentDateTime.toISOString(),
          duration_minutes: parseInt(duration),
          google_meet_link: googleMeetLink || undefined,
          title: title || undefined,
          description: description || undefined,
        });
      }

      onClose();
    } catch (error) {
      console.error('Error saving appointment:', error);
      alert('Randevu kaydedilirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!editingAppointment) return;

    if (!confirm('Bu randevuyu silmek istediğinizden emin misiniz?')) return;

    try {
      setLoading(true);
      await deleteAppointment(editingAppointment.id);
      onClose();
    } catch (error) {
      console.error('Error deleting appointment:', error);
      alert('Randevu silinirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsCompleted = async () => {
    if (!editingAppointment) return;

    if (!confirm('Bu görüşmeyi tamamlandı olarak işaretlemek istiyor musunuz?')) return;

    try {
      setLoading(true);
      await updateAppointment(editingAppointment.id, {
        status: 'completed',
      });
      onClose();
    } catch (error) {
      console.error('Error updating appointment:', error);
      alert('Randevu güncellenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!editingAppointment) return;

    const reason = prompt('İptal sebebini belirtin (opsiyonel):');

    try {
      setLoading(true);
      await updateAppointment(editingAppointment.id, {
        status: 'cancelled',
        cancellation_reason: reason || undefined,
      });
      onClose();
    } catch (error) {
      console.error('Error cancelling appointment:', error);
      alert('Randevu iptal edilirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {editingAppointment ? '✏️ Randevuyu Düzenle' : '➕ Yeni Randevu Oluştur'}
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Koçluk görüşmesi için randevu detaylarını girin
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Form */}
          <div className="space-y-4">
            {/* Student Selection (only for new appointments) */}
            {!editingAppointment && (
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <User className="h-4 w-4" />
                  Öğrenci Seçin *
                </label>
                <select
                  value={selectedSubscription}
                  onChange={(e) => setSelectedSubscription(e.target.value)}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  required
                >
                  <option value="">Öğrenci seçin...</option>
                  {subscriptions.map((sub) => (
                    <option key={sub.id} value={sub.id}>
                      {sub.student?.full_name} - {sub.remaining_sessions} seans kaldı
                    </option>
                  ))}
                </select>
                {subscriptions.length === 0 && (
                  <p className="text-sm text-red-600 mt-1">
                    Aktif koçluk aboneliğiniz olan öğrenci bulunmuyor
                  </p>
                )}
              </div>
            )}

            {/* Title */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <FileText className="h-4 w-4" />
                Randevu Başlığı
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="Örn: Matematik Sınav Hazırlığı"
              />
            </div>

            {/* Date and Time */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="h-4 w-4" />
                  Tarih *
                </label>
                <input
                  type="date"
                  value={appointmentDate}
                  onChange={(e) => setAppointmentDate(e.target.value)}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <Clock className="h-4 w-4" />
                  Saat *
                </label>
                <input
                  type="time"
                  value={appointmentTime}
                  onChange={(e) => setAppointmentTime(e.target.value)}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  required
                />
              </div>
            </div>

            {/* Duration */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <Clock className="h-4 w-4" />
                Süre (dakika)
              </label>
              <select
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="30">30 dakika</option>
                <option value="45">45 dakika</option>
                <option value="60">60 dakika (1 saat)</option>
                <option value="90">90 dakika (1.5 saat)</option>
                <option value="120">120 dakika (2 saat)</option>
              </select>
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <Video className="h-4 w-4" />
                Toplantı Linkiniz
              </label>
              <input
                type="url"
                value={googleMeetLink}
                onChange={(e) => setGoogleMeetLink(e.target.value)}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="https://meet.google.com/xxx-xxxx-xxx"
              />
              <p className="text-xs text-gray-500 mt-1">
                💡 Yeni bir toplantı oluşturup linkini buraya yapıştırın
              </p>
            </div>

            {/* Description */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <FileText className="h-4 w-4" />
                Açıklama / Notlar
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                placeholder="Görüşmede ele alınacak konular, öğrenciye özel notlar..."
              />
            </div>
          </div>

          {/* Actions */}
          <div className="mt-6 flex gap-3">
            {editingAppointment && (
              <>
                {(editingAppointment.status === 'scheduled' || editingAppointment.status === 'approved') && (
                  <>
                    <button
                      onClick={handleMarkAsCompleted}
                      disabled={loading}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                    >
                      ✓ Tamamlandı
                    </button>
                    <button
                      onClick={handleCancel}
                      disabled={loading}
                      className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50"
                    >
                      İptal Et
                    </button>
                  </>
                )}
                <button
                  onClick={handleDelete}
                  disabled={loading}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  🗑️ Sil
                </button>
              </>
            )}

            <div className="flex-1" />

            <button
              onClick={onClose}
              disabled={loading}
              className="px-6 py-2 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Vazgeç
            </button>
            <button
              onClick={handleSave}
              disabled={loading || (!editingAppointment && !selectedSubscription)}
              className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="h-5 w-5" />
              {loading ? 'Kaydediliyor...' : 'Kaydet'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
