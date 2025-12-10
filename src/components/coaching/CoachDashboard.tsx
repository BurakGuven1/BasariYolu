import React, { useState, useEffect } from 'react';
import { Calendar, Users, Clock, Video, Plus, CheckCircle, XCircle, AlertCircle, Settings, Bell } from 'lucide-react';
import {
  getCoachSubscriptions,
  getCoachAppointments,
  getCoachStats,
  formatAppointmentDate,
  type StudentCoachingSubscription,
  type CoachingAppointment,
  type CoachStats,
} from '../../lib/coachingApi';
import AppointmentModal from './AppointmentModal';
import CoachAvailabilityManager from './CoachAvailabilityManager';
import PendingAppointmentRequestsPanel from './PendingAppointmentRequestsPanel';

interface CoachDashboardProps {
  coachId: string;
}

export default function CoachDashboard({ coachId }: CoachDashboardProps) {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'calendar' | 'students' | 'availability' | 'requests'>('requests');
  const [subscriptions, setSubscriptions] = useState<StudentCoachingSubscription[]>([]);
  const [appointments, setAppointments] = useState<CoachingAppointment[]>([]);
  const [stats, setStats] = useState<CoachStats | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<CoachingAppointment | null>(null);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    loadData();
  }, [coachId]);

  const loadData = async () => {
    try {
      setLoading(true);

      // Get current week range
      const startOfWeek = new Date(selectedDate);
      startOfWeek.setDate(selectedDate.getDate() - selectedDate.getDay());
      startOfWeek.setHours(0, 0, 0, 0);

      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 7);

      const [subsData, appointmentsData, statsData, pendingAppointments] = await Promise.all([
        getCoachSubscriptions(coachId),
        getCoachAppointments(coachId, {
          startDate: startOfWeek.toISOString(),
          endDate: endOfWeek.toISOString(),
        }),
        getCoachStats(coachId),
        getCoachAppointments(coachId, { status: ['pending'] }),
      ]);

      setSubscriptions(subsData);
      setAppointments(appointmentsData);
      setStats(statsData);
      setPendingCount(pendingAppointments.length);
    } catch (error) {
      console.error('Error loading coach data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAppointment = () => {
    setEditingAppointment(null);
    setShowAppointmentModal(true);
  };

  const handleEditAppointment = (appointment: CoachingAppointment) => {
    setEditingAppointment(appointment);
    setShowAppointmentModal(true);
  };

  const handleModalClose = () => {
    setShowAppointmentModal(false);
    setEditingAppointment(null);
    loadData();
  };

  const getAppointmentStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'approved':
      case 'scheduled':
        return <Clock className="h-4 w-4 text-blue-600" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'no_show':
        return <AlertCircle className="h-4 w-4 text-orange-600" />;
      default:
        return null;
    }
  };

  const getAppointmentStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'approved':
      case 'scheduled':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'rejected':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'completed':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'cancelled':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'no_show':
        return 'bg-orange-50 text-orange-700 border-orange-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getAppointmentStatusLabel = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Onay Bekliyor';
      case 'approved':
        return 'Onaylandı';
      case 'rejected':
        return 'Reddedildi';
      case 'scheduled':
        return 'Planlandı';
      case 'completed':
        return 'Tamamlandı';
      case 'cancelled':
        return 'İptal Edildi';
      case 'no_show':
        return 'Katılmadı';
      default:
        return status;
    }
  };

  const activeStudents = subscriptions.filter((s) => s.status === 'active');
  const upcomingAppointments = appointments.filter((a) => a.status === 'approved' || a.status === 'scheduled');

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl shadow-lg p-6 text-white">
        <h1 className="text-2xl font-bold mb-4">👨‍🏫 Koçluk Paneli</h1>
        <div className="grid grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-3xl font-bold">{stats?.total_students || 0}</div>
            <div className="text-sm text-indigo-100 mt-1">Aktif Öğrenci</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold">{stats?.upcoming_sessions || 0}</div>
            <div className="text-sm text-indigo-100 mt-1">Yaklaşan Görüşme</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold">{stats?.completed_sessions || 0}</div>
            <div className="text-sm text-indigo-100 mt-1">Tamamlanan</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold">{stats?.coach_hourly_rate?.toFixed(0) || '0'}₺</div>
            <div className="text-sm text-indigo-100 mt-1">Saatlik Ücret</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setActiveTab('requests')}
          className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors relative ${
            activeTab === 'requests'
              ? 'bg-indigo-600 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-50 border-2 border-gray-200'
          }`}
        >
          <Bell className="h-5 w-5" />
          Randevu Talepleri
          {pendingCount > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center">
              {pendingCount}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('calendar')}
          className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors ${
            activeTab === 'calendar'
              ? 'bg-indigo-600 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-50 border-2 border-gray-200'
          }`}
        >
          <Calendar className="h-5 w-5" />
          Takvim & Randevular
        </button>
        <button
          onClick={() => setActiveTab('availability')}
          className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors ${
            activeTab === 'availability'
              ? 'bg-indigo-600 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-50 border-2 border-gray-200'
          }`}
        >
          <Settings className="h-5 w-5" />
          Müsaitlik Ayarları
        </button>
        <button
          onClick={() => setActiveTab('students')}
          className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors ${
            activeTab === 'students'
              ? 'bg-indigo-600 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-50 border-2 border-gray-200'
          }`}
        >
          <Users className="h-5 w-5" />
          Öğrencilerim
        </button>
      </div>

      {/* Calendar Tab */}
      {activeTab === 'calendar' && (
        <div className="space-y-4">
          {/* Create Appointment Button */}
          <div className="flex justify-end">
            <button
              onClick={handleCreateAppointment}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <Plus className="h-5 w-5" />
              Yeni Randevu Oluştur
            </button>
          </div>

          {/* Week View */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">📅 Bu Haftanın Randevuları</h3>

            {appointments.filter((a) => a.status !== 'pending').length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                <p className="text-gray-500">Bu hafta randevu bulunmuyor</p>
                <button
                  onClick={handleCreateAppointment}
                  className="mt-4 text-indigo-600 hover:text-indigo-700 font-medium"
                >
                  İlk randevuyu oluştur
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {appointments.filter((a) => a.status !== 'pending').map((appointment) => (
                  <div
                    key={appointment.id}
                    onClick={() => handleEditAppointment(appointment)}
                    className={`border-2 rounded-lg p-4 hover:shadow-md transition-all cursor-pointer ${getAppointmentStatusColor(
                      appointment.status
                    )}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {getAppointmentStatusIcon(appointment.status)}
                          <h4 className="font-semibold">
                            {appointment.title || 'Koçluk Görüşmesi'}
                          </h4>
                          <span className="text-xs px-2 py-1 rounded-full bg-white border">
                            {getAppointmentStatusLabel(appointment.status)}
                          </span>
                        </div>

                        <div className="flex items-center gap-4 text-sm mb-2">
                          <span className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {formatAppointmentDate(appointment.appointment_date)}
                          </span>
                          <span>{appointment.duration_minutes} dakika</span>
                        </div>

                        {appointment.student && (
                          <div className="flex items-center gap-2 mb-2">
                            {appointment.student.avatar_url ? (
                              <img
                                src={appointment.student.avatar_url}
                                alt={appointment.student.full_name}
                                className="w-6 h-6 rounded-full"
                              />
                            ) : (
                              <div className="w-6 h-6 rounded-full bg-gray-300 flex items-center justify-center text-xs">
                                {appointment.student.full_name[0]}
                              </div>
                            )}
                            <span className="text-sm font-medium">{appointment.student.full_name}</span>
                          </div>
                        )}

                        {appointment.description && (
                          <p className="text-sm text-gray-600 mt-2">{appointment.description}</p>
                        )}
                      </div>

                      {appointment.google_meet_link && appointment.status === 'scheduled' && (
                        <a
                          href={appointment.google_meet_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="flex items-center gap-1 px-3 py-2 bg-white text-indigo-600 rounded-lg hover:bg-indigo-50 transition-colors text-sm font-medium border-2 border-indigo-600"
                        >
                          <Video className="h-4 w-4" />
                          Katıl
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Students Tab */}
      {activeTab === 'students' && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">👥 Öğrencilerim</h3>

          {activeStudents.length === 0 ? (
            <div className="text-center py-12">
              <Users className="mx-auto h-16 w-16 text-gray-400 mb-4" />
              <p className="text-gray-500">Henüz aktif öğrenciniz bulunmuyor</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeStudents.map((subscription) => (
                <div key={subscription.id} className="border-2 border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-3 mb-3">
                    {subscription.student?.avatar_url ? (
                      <img
                        src={subscription.student.avatar_url}
                        alt={subscription.student.full_name}
                        className="w-12 h-12 rounded-full"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-xl font-bold text-indigo-600">
                        {subscription.student?.full_name?.[0] || '?'}
                      </div>
                    )}
                    <div>
                      <h4 className="font-semibold text-gray-900">{subscription.student?.full_name}</h4>
                      <p className="text-sm text-gray-500">{subscription.package?.name}</p>
                    </div>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Kalan Seans:</span>
                      <span className="font-semibold text-indigo-600">
                        {subscription.remaining_sessions} / {subscription.total_sessions}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Bitiş:</span>
                      <span className="font-medium">
                        {new Date(subscription.end_date).toLocaleDateString('tr-TR')}
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-indigo-600"
                        style={{
                          width: `${
                            ((subscription.total_sessions - subscription.remaining_sessions) /
                              subscription.total_sessions) *
                            100
                          }%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Pending Requests Tab */}
      {activeTab === 'requests' && (
        <PendingAppointmentRequestsPanel coachId={coachId} onUpdate={loadData} />
      )}

      {/* Availability Tab */}
      {activeTab === 'availability' && <CoachAvailabilityManager coachId={coachId} />}

      {/* Appointment Modal */}
      {showAppointmentModal && (
        <AppointmentModal
          coachId={coachId}
          subscriptions={activeStudents}
          editingAppointment={editingAppointment}
          onClose={handleModalClose}
        />
      )}
    </div>
  );
}
