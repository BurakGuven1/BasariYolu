import { useState, useEffect } from 'react';
import { Clock, User, Calendar, CheckCircle, XCircle, Video, FileText } from 'lucide-react';
import {
  getCoachAppointments,
  approveAppointment,
  rejectAppointment,
  formatAppointmentDate,
  type CoachingAppointment,
} from '../../lib/coachingApi';

interface PendingAppointmentRequestsPanelProps {
  coachId: string;
  onUpdate: () => void;
}

export default function PendingAppointmentRequestsPanel({
  coachId,
  onUpdate,
}: PendingAppointmentRequestsPanelProps) {
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState<CoachingAppointment[]>([]);
  const [processing, setProcessing] = useState<string | null>(null);
  const [showApproveModal, setShowApproveModal] = useState<CoachingAppointment | null>(null);
  const [showRejectModal, setShowRejectModal] = useState<CoachingAppointment | null>(null);

  useEffect(() => {
    loadPendingRequests();
  }, [coachId]);

  const loadPendingRequests = async () => {
    try {
      setLoading(true);
      const data = await getCoachAppointments(coachId, { status: ['pending'] });
      // Sort by appointment_date ascending
      setPending(data.sort((a, b) =>
        new Date(a.appointment_date).getTime() - new Date(b.appointment_date).getTime()
      ));
    } catch (error) {
      console.error('Error loading pending requests:', error);
      alert('Bekleyen talepler yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (appointmentId: string, meetLink: string, notes: string) => {
    try {
      setProcessing(appointmentId);
      await approveAppointment(appointmentId, meetLink || undefined, notes || undefined);
      alert('✅ Randevu onaylandı! Öğrenciye email gönderildi.');
      setShowApproveModal(null);
      await loadPendingRequests();
      onUpdate();
    } catch (error) {
      console.error('Error approving appointment:', error);
      alert('Randevu onaylanırken bir hata oluştu');
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (appointmentId: string, notes: string) => {
    try {
      setProcessing(appointmentId);
      await rejectAppointment(appointmentId, notes || undefined);
      alert('Randevu reddedildi.');
      setShowRejectModal(null);
      await loadPendingRequests();
      onUpdate();
    } catch (error) {
      console.error('Error rejecting appointment:', error);
      alert('Randevu reddedilirken bir hata oluştu');
    } finally {
      setProcessing(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Clock className="h-6 w-6 text-yellow-600" />
          Bekleyen Randevu Talepleri
        </h3>

        {pending.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
            <CheckCircle className="mx-auto h-16 w-16 text-gray-400 mb-4" />
            <p className="text-gray-500 text-lg font-medium">Bekleyen randevu talebi yok</p>
            <p className="text-gray-400 text-sm mt-2">
              Öğrencileriniz randevu talebi gönderdiğinde burada görünecektir
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {pending.map((appointment) => (
              <div
                key={appointment.id}
                className="border-2 border-yellow-200 bg-yellow-50 rounded-lg p-5 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    {/* Student Info */}
                    <div className="flex items-center gap-3 mb-3">
                      {appointment.student?.avatar_url ? (
                        <img
                          src={appointment.student.avatar_url}
                          alt={appointment.student.full_name}
                          className="w-12 h-12 rounded-full"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-xl font-bold text-indigo-600">
                          {appointment.student?.full_name?.[0] || '?'}
                        </div>
                      )}
                      <div>
                        <h4 className="font-semibold text-gray-900 text-lg">
                          {appointment.student?.full_name}
                        </h4>
                        <p className="text-sm text-gray-600">
                          {appointment.title || 'Koçluk Görüşmesi'}
                        </p>
                      </div>
                    </div>

                    {/* Appointment Details */}
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2 text-gray-700">
                        <Calendar className="h-4 w-4 text-indigo-600" />
                        <span className="font-medium">{formatAppointmentDate(appointment.appointment_date)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-700">
                        <Clock className="h-4 w-4 text-indigo-600" />
                        <span>{appointment.duration_minutes} dakika</span>
                      </div>
                    </div>

                    {/* Student's Description/Notes */}
                    {appointment.description && (
                      <div className="bg-white p-3 rounded-lg border border-gray-200 mb-3">
                        <p className="text-sm text-gray-600 font-medium mb-1">Öğrenci Notu:</p>
                        <p className="text-sm text-gray-800">{appointment.description}</p>
                      </div>
                    )}

                    {/* Subscription Info */}
                    {appointment.subscription && (
                      <div className="text-sm text-gray-600">
                        <span className="font-medium">Paket:</span> {appointment.subscription.package?.name}
                        {' '}({appointment.subscription.remaining_sessions} seans kaldı)
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => setShowApproveModal(appointment)}
                      disabled={processing === appointment.id}
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 whitespace-nowrap"
                    >
                      <CheckCircle className="h-5 w-5" />
                      Onayla
                    </button>
                    <button
                      onClick={() => setShowRejectModal(appointment)}
                      disabled={processing === appointment.id}
                      className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 whitespace-nowrap"
                    >
                      <XCircle className="h-5 w-5" />
                      Reddet
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Approve Modal */}
      {showApproveModal && (
        <ApproveModal
          appointment={showApproveModal}
          onApprove={handleApprove}
          onClose={() => setShowApproveModal(null)}
          processing={processing === showApproveModal.id}
        />
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <RejectModal
          appointment={showRejectModal}
          onReject={handleReject}
          onClose={() => setShowRejectModal(null)}
          processing={processing === showRejectModal.id}
        />
      )}
    </div>
  );
}

// Approve Modal Component
interface ApproveModalProps {
  appointment: CoachingAppointment;
  onApprove: (appointmentId: string, meetLink: string, notes: string) => void;
  onClose: () => void;
  processing: boolean;
}

function ApproveModal({ appointment, onApprove, onClose, processing }: ApproveModalProps) {
  const [meetLink, setMeetLink] = useState('');
  const [notes, setNotes] = useState('');

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">Randevuyu Onayla</h3>
              <p className="text-sm text-gray-500">
                {appointment.student?.full_name} ile randevu
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-sm text-gray-600">
                <strong>Tarih:</strong> {formatAppointmentDate(appointment.appointment_date)}
              </p>
              <p className="text-sm text-gray-600">
                <strong>Süre:</strong> {appointment.duration_minutes} dakika
              </p>
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <Video className="h-4 w-4" />
                Google Meet / Toplantı Linki (Opsiyonel)
              </label>
              <input
                type="url"
                value={meetLink}
                onChange={(e) => setMeetLink(e.target.value)}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="https://meet.google.com/xxx-xxxx-xxx"
              />
              <p className="text-xs text-gray-500 mt-1">
                💡 Öğrenciye email ile gönderilecektir
              </p>
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <FileText className="h-4 w-4" />
                Notunuz (Opsiyonel)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                placeholder="Öğrenciye iletmek istediğiniz notlar..."
              />
            </div>
          </div>

          <div className="mt-6 flex gap-3">
            <button
              onClick={onClose}
              disabled={processing}
              className="flex-1 px-6 py-2 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              İptal
            </button>
            <button
              onClick={() => onApprove(appointment.id, meetLink, notes)}
              disabled={processing}
              className="flex-1 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 font-medium"
            >
              {processing ? 'Onaylanıyor...' : '✓ Onayla'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Reject Modal Component
interface RejectModalProps {
  appointment: CoachingAppointment;
  onReject: (appointmentId: string, notes: string) => void;
  onClose: () => void;
  processing: boolean;
}

function RejectModal({ appointment, onReject, onClose, processing }: RejectModalProps) {
  const [notes, setNotes] = useState('');

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-red-100 rounded-lg">
              <XCircle className="h-8 w-8 text-red-600" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">Randevuyu Reddet</h3>
              <p className="text-sm text-gray-500">
                {appointment.student?.full_name} ile randevu
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-sm text-gray-600">
                <strong>Tarih:</strong> {formatAppointmentDate(appointment.appointment_date)}
              </p>
              <p className="text-sm text-gray-600">
                <strong>Süre:</strong> {appointment.duration_minutes} dakika
              </p>
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <FileText className="h-4 w-4" />
                Ret Sebebi (Opsiyonel)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                placeholder="Örn: Bu saatte başka randevum var, başka bir saat önerebilir misiniz?"
              />
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-sm text-yellow-800">
                ⚠️ Reddettiğiniz randevu öğrenciye bildirilecektir. Mümkünse bir açıklama ekleyin.
              </p>
            </div>
          </div>

          <div className="mt-6 flex gap-3">
            <button
              onClick={onClose}
              disabled={processing}
              className="flex-1 px-6 py-2 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              İptal
            </button>
            <button
              onClick={() => onReject(appointment.id, notes)}
              disabled={processing}
              className="flex-1 px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 font-medium"
            >
              {processing ? 'Reddediliyor...' : '✗ Reddet'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
