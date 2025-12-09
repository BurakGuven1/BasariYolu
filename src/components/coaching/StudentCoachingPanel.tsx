import { useState, useEffect } from 'react';
import { Award, Calendar, Clock, Video, Package, TrendingUp, CalendarPlus } from 'lucide-react';
import {
  getActivePackages,
  getAllCoaches,
  getStudentSubscriptions,
  getStudentAppointments,
  createSubscription,
  getSubscriptionProgress,
  isSubscriptionActive,
  formatAppointmentDate,
  type CoachingPackage,
  type CoachProfile,
  type StudentCoachingSubscription,
  type CoachingAppointment,
} from '../../lib/coachingApi';
import AppointmentRequestModal from './AppointmentRequestModal';

interface StudentCoachingPanelProps {
  studentId: string;
}

export default function StudentCoachingPanel({ studentId }: StudentCoachingPanelProps) {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'my-coaching' | 'packages'>('my-coaching');
  const [packages, setPackages] = useState<CoachingPackage[]>([]);
  const [coaches, setCoaches] = useState<CoachProfile[]>([]);
  const [subscriptions, setSubscriptions] = useState<StudentCoachingSubscription[]>([]);
  const [appointments, setAppointments] = useState<CoachingAppointment[]>([]);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<CoachingPackage | null>(null);
  const [selectedCoach, setSelectedCoach] = useState<string>('');
  const [showAppointmentRequestModal, setShowAppointmentRequestModal] = useState(false);
  const [selectedSubscription, setSelectedSubscription] = useState<StudentCoachingSubscription | null>(null);

  useEffect(() => {
    loadData();
  }, [studentId]);

  const loadData = async () => {
    try {
      setLoading(true);

      const [packagesData, coachesData, subsData, appointmentsData] = await Promise.all([
        getActivePackages(),
        getAllCoaches(),
        getStudentSubscriptions(studentId),
        getStudentAppointments(studentId),
      ]);

      setPackages(packagesData);
      setCoaches(coachesData);
      setSubscriptions(subsData);
      setAppointments(appointmentsData);

      // Show packages tab if no active subscriptions
      const hasActive = subsData.some((s) => isSubscriptionActive(s));
      if (!hasActive) {
        setActiveTab('packages');
      }
    } catch (error) {
      console.error('Error loading coaching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePurchaseClick = (pkg: CoachingPackage) => {
    setSelectedPackage(pkg);
    setShowPurchaseModal(true);
  };

  const handlePurchase = async () => {
    if (!selectedPackage || !selectedCoach) {
      alert('Lütfen koç seçin');
      return;
    }

    try {
      setLoading(true);
      await createSubscription(studentId, selectedCoach, selectedPackage.id);
      setShowPurchaseModal(false);
      setSelectedPackage(null);
      setSelectedCoach('');
      await loadData();
      setActiveTab('my-coaching');
    } catch (error) {
      console.error('Error purchasing package:', error);
      alert('Paket satın alınırken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const activeSubscriptions = subscriptions.filter((s) => isSubscriptionActive(s));
  const upcomingAppointments = appointments.filter((a) => a.status === 'approved' || a.status === 'scheduled');
  const pendingAppointments = appointments.filter((a) => a.status === 'pending');

  const handleRequestAppointment = (subscription: StudentCoachingSubscription) => {
    setSelectedSubscription(subscription);
    setShowAppointmentRequestModal(true);
  };

  const handleAppointmentRequestSuccess = async () => {
    await loadData();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl shadow-lg p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">🎯 Koçluk Hizmetleri</h1>
        <p className="text-purple-100">
          Kişisel koçluk desteği ile hedeflerine daha hızlı ulaş!
        </p>
      </div>

      {/* Quick Stats */}
      {activeSubscriptions.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-lg shadow-md p-4 text-center">
            <div className="text-3xl font-bold text-indigo-600">
              {activeSubscriptions.reduce((sum, s) => sum + s.remaining_sessions, 0)}
            </div>
            <div className="text-sm text-gray-600 mt-1">Kalan Seans</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4 text-center">
            <div className="text-3xl font-bold text-green-600">{upcomingAppointments.length}</div>
            <div className="text-sm text-gray-600 mt-1">Yaklaşan Görüşme</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4 text-center">
            <div className="text-3xl font-bold text-purple-600">{activeSubscriptions.length}</div>
            <div className="text-sm text-gray-600 mt-1">Aktif Koç</div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setActiveTab('my-coaching')}
          className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors ${
            activeTab === 'my-coaching'
              ? 'bg-indigo-600 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-50 border-2 border-gray-200'
          }`}
        >
          <Calendar className="h-5 w-5" />
          Koçluğum
        </button>
        <button
          onClick={() => setActiveTab('packages')}
          className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors ${
            activeTab === 'packages'
              ? 'bg-indigo-600 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-50 border-2 border-gray-200'
          }`}
        >
          <Package className="h-5 w-5" />
          Paketler
        </button>
      </div>

      {/* My Coaching Tab */}
      {activeTab === 'my-coaching' && (
        <div className="space-y-6">
          {/* Active Subscriptions */}
          {activeSubscriptions.length > 0 ? (
            <>
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">📚 Aktif Koçluk Paketlerim</h3>
                <div className="space-y-4">
                  {activeSubscriptions.map((subscription) => (
                    <div
                      key={subscription.id}
                      className="border-2 border-indigo-200 rounded-lg p-4 bg-indigo-50"
                    >
                      <div className="flex items-start gap-4">
                        {subscription.coach?.avatar_url ? (
                          <img
                            src={subscription.coach.avatar_url}
                            alt={subscription.coach.full_name}
                            className="w-16 h-16 rounded-full"
                          />
                        ) : (
                          <div className="w-16 h-16 rounded-full bg-indigo-200 flex items-center justify-center text-2xl font-bold text-indigo-700">
                            {subscription.coach?.full_name?.[0] || '?'}
                          </div>
                        )}

                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h4 className="font-bold text-lg text-gray-900">
                                {subscription.coach?.full_name}
                              </h4>
                              <p className="text-sm text-gray-600">{subscription.package?.name}</p>
                            </div>
                            <div className="text-right">
                              <div className="text-2xl font-bold text-indigo-600">
                                {subscription.remaining_sessions}
                              </div>
                              <div className="text-xs text-gray-600">seans kaldı</div>
                            </div>
                          </div>

                          {subscription.coach?.coach_specializations && (
                            <div className="flex flex-wrap gap-1 mb-3">
                              {subscription.coach.coach_specializations.map((spec, idx) => (
                                <span
                                  key={idx}
                                  className="px-2 py-1 bg-white text-indigo-700 text-xs rounded-full border border-indigo-300"
                                >
                                  {spec}
                                </span>
                              ))}
                            </div>
                          )}

                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">İlerleme:</span>
                              <span className="font-semibold">
                                {subscription.total_sessions - subscription.remaining_sessions} /{' '}
                                {subscription.total_sessions} seans tamamlandı
                              </span>
                            </div>
                            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-indigo-600"
                                style={{ width: `${getSubscriptionProgress(subscription)}%` }}
                              />
                            </div>
                            <div className="flex justify-between text-xs text-gray-500">
                              <span>
                                Başlangıç: {new Date(subscription.start_date).toLocaleDateString('tr-TR')}
                              </span>
                              <span>
                                Bitiş: {new Date(subscription.end_date).toLocaleDateString('tr-TR')}
                              </span>
                            </div>
                          </div>

                          {/* Request Appointment Button */}
                          <div className="mt-4 pt-4 border-t border-indigo-200">
                            <button
                              onClick={() => handleRequestAppointment(subscription)}
                              disabled={subscription.remaining_sessions === 0}
                              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                            >
                              <CalendarPlus className="h-5 w-5" />
                              Randevu Talebi Oluştur
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pending Appointments */}
              {pendingAppointments.length > 0 && (
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Clock className="h-5 w-5 text-yellow-600" />
                    Onay Bekleyen Taleplerim
                  </h3>
                  <div className="space-y-3">
                    {pendingAppointments.map((appointment) => (
                      <div
                        key={appointment.id}
                        className="border-2 border-yellow-200 rounded-lg p-4 bg-yellow-50"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900 mb-2">
                              {appointment.title || 'Koçluk Görüşmesi'}
                            </h4>

                            <div className="flex items-center gap-4 text-sm mb-2">
                              <span className="flex items-center gap-1 text-gray-700">
                                <Clock className="h-4 w-4" />
                                {formatAppointmentDate(appointment.appointment_date)}
                              </span>
                              <span className="text-gray-600">{appointment.duration_minutes} dakika</span>
                            </div>

                            {appointment.coach && (
                              <div className="flex items-center gap-2 mb-2">
                                {appointment.coach.avatar_url ? (
                                  <img
                                    src={appointment.coach.avatar_url}
                                    alt={appointment.coach.full_name}
                                    className="w-6 h-6 rounded-full"
                                  />
                                ) : (
                                  <div className="w-6 h-6 rounded-full bg-gray-300 flex items-center justify-center text-xs">
                                    {appointment.coach.full_name[0]}
                                  </div>
                                )}
                                <span className="text-sm font-medium">{appointment.coach.full_name}</span>
                              </div>
                            )}

                            {appointment.description && (
                              <p className="text-sm text-gray-600 mt-2">{appointment.description}</p>
                            )}
                          </div>

                          <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm font-medium whitespace-nowrap">
                            ⏳ Onay Bekliyor
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Upcoming Appointments */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">📅 Onaylanmış Görüşmelerim</h3>
                {upcomingAppointments.length === 0 ? (
                  <div className="text-center py-8">
                    <Calendar className="mx-auto h-12 w-12 text-gray-400 mb-3" />
                    <p className="text-gray-500">Henüz onaylanmış görüşmeniz bulunmuyor</p>
                    <p className="text-sm text-gray-400 mt-1">
                      Koçunuz talebinizi onayladığında buradan görebilirsiniz
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {upcomingAppointments.map((appointment) => (
                      <div
                        key={appointment.id}
                        className="border-2 border-green-200 rounded-lg p-4 bg-green-50"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900 mb-2">
                              {appointment.title || 'Koçluk Görüşmesi'}
                            </h4>

                            <div className="flex items-center gap-4 text-sm mb-2">
                              <span className="flex items-center gap-1 text-gray-700">
                                <Clock className="h-4 w-4" />
                                {formatAppointmentDate(appointment.appointment_date)}
                              </span>
                              <span className="text-gray-600">{appointment.duration_minutes} dakika</span>
                            </div>

                            {appointment.coach && (
                              <div className="flex items-center gap-2">
                                {appointment.coach.avatar_url ? (
                                  <img
                                    src={appointment.coach.avatar_url}
                                    alt={appointment.coach.full_name}
                                    className="w-6 h-6 rounded-full"
                                  />
                                ) : (
                                  <div className="w-6 h-6 rounded-full bg-gray-300 flex items-center justify-center text-xs">
                                    {appointment.coach.full_name[0]}
                                  </div>
                                )}
                                <span className="text-sm font-medium">{appointment.coach.full_name}</span>
                              </div>
                            )}

                            {appointment.description && (
                              <p className="text-sm text-gray-600 mt-2">{appointment.description}</p>
                            )}
                          </div>

                          {appointment.google_meet_link && (
                            <a
                              href={appointment.google_meet_link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium whitespace-nowrap ml-4"
                            >
                              <Video className="h-5 w-5" />
                              Katıl
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Past Appointments */}
              {appointments.filter((a) => a.status !== 'scheduled').length > 0 && (
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">📝 Geçmiş Görüşmeler</h3>
                  <div className="space-y-2">
                    {appointments
                      .filter((a) => a.status !== 'scheduled')
                      .slice(0, 5)
                      .map((appointment) => (
                        <div key={appointment.id} className="flex items-center justify-between py-2 border-b border-gray-100">
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {appointment.title || 'Koçluk Görüşmesi'}
                            </p>
                            <p className="text-xs text-gray-500">
                              {formatAppointmentDate(appointment.appointment_date)} - {appointment.coach?.full_name}
                            </p>
                          </div>
                          <span
                            className={`text-xs px-2 py-1 rounded-full ${
                              appointment.status === 'completed'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-gray-100 text-gray-700'
                            }`}
                          >
                            {appointment.status === 'completed' ? '✓ Tamamlandı' : appointment.status}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="bg-white rounded-lg shadow-md p-12 text-center">
              <Award className="mx-auto h-20 w-20 text-gray-400 mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">Henüz koçluk paketiniz yok</h3>
              <p className="text-gray-600 mb-6">
                Kişisel gelişim ve hedeflerinize ulaşmak için bir koçluk paketi satın alın
              </p>
              <button
                onClick={() => setActiveTab('packages')}
                className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
              >
                Paketleri İncele
              </button>
            </div>
          )}
        </div>
      )}

      {/* Packages Tab */}
      {activeTab === 'packages' && (
        <div className="space-y-6">
          {/* Coaches Section */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">👨‍🏫 Koçlarımız</h3>
            {coaches.length === 0 ? (
              <p className="text-center text-gray-500 py-8">Henüz kayıtlı koç bulunmuyor</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {coaches.map((coach) => (
                  <div key={coach.id} className="border-2 border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-3 mb-3">
                      {coach.avatar_url ? (
                        <img src={coach.avatar_url} alt={coach.full_name} className="w-14 h-14 rounded-full" />
                      ) : (
                        <div className="w-14 h-14 rounded-full bg-indigo-100 flex items-center justify-center text-xl font-bold text-indigo-600">
                          {coach.full_name[0]}
                        </div>
                      )}
                      <div>
                        <h4 className="font-bold text-gray-900">{coach.full_name}</h4>
                        {coach.coach_hourly_rate && (
                          <p className="text-sm text-indigo-600 font-semibold">
                            {coach.coach_hourly_rate.toFixed(0)}₺/saat
                          </p>
                        )}
                      </div>
                    </div>

                    {coach.coach_specializations && coach.coach_specializations.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {coach.coach_specializations.map((spec, idx) => (
                          <span key={idx} className="px-2 py-1 bg-indigo-50 text-indigo-700 text-xs rounded-full">
                            {spec}
                          </span>
                        ))}
                      </div>
                    )}

                    {coach.coach_bio && (
                      <p className="text-sm text-gray-600 line-clamp-2">{coach.coach_bio}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Packages Section */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">📦 Koçluk Paketleri</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {packages.map((pkg) => (
                <div
                  key={pkg.id}
                  className="border-2 border-indigo-200 rounded-xl p-6 hover:shadow-lg transition-all hover:border-indigo-400"
                >
                  <div className="text-center mb-4">
                    <h4 className="text-xl font-bold text-gray-900 mb-2">{pkg.name}</h4>
                    <div className="text-4xl font-bold text-indigo-600 mb-1">{pkg.price.toFixed(0)}₺</div>
                    <p className="text-sm text-gray-600">{pkg.duration_days} gün geçerli</p>
                  </div>

                  <div className="space-y-3 mb-6">
                    <div className="flex items-center gap-2 text-sm">
                      <TrendingUp className="h-4 w-4 text-green-600" />
                      <span>{pkg.session_count} adet 1-1 görüşme</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4 text-blue-600" />
                      <span>Her görüşme 60 dakika</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Video className="h-4 w-4 text-purple-600" />
                      <span>Online görüşme</span>
                    </div>
                  </div>

                  {pkg.description && (
                    <p className="text-sm text-gray-600 mb-4 min-h-[40px]">{pkg.description}</p>
                  )}

                  <button
                    onClick={() => handlePurchaseClick(pkg)}
                    className="w-full py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
                  >
                    Satın Al
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Purchase Modal */}
      {showPurchaseModal && selectedPackage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              🎯 {selectedPackage.name} Paketi
            </h2>

            <div className="bg-indigo-50 rounded-lg p-4 mb-6">
              <div className="text-3xl font-bold text-indigo-600 text-center mb-2">
                {selectedPackage.price.toFixed(0)}₺
              </div>
              <div className="text-sm text-gray-600 text-center">
                {selectedPackage.session_count} seans • {selectedPackage.duration_days} gün geçerli
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Koçunuzu Seçin *
              </label>
              <select
                value={selectedCoach}
                onChange={(e) => setSelectedCoach(e.target.value)}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="">Koç seçin...</option>
                {coaches.map((coach) => (
                  <option key={coach.id} value={coach.id}>
                    {coach.full_name}
                    {coach.coach_hourly_rate ? ` - ${coach.coach_hourly_rate.toFixed(0)}₺/saat` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowPurchaseModal(false);
                  setSelectedPackage(null);
                  setSelectedCoach('');
                }}
                className="flex-1 px-4 py-2 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                İptal
              </button>
              <button
                onClick={handlePurchase}
                disabled={!selectedCoach || loading}
                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'İşleniyor...' : 'Satın Al'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Appointment Request Modal */}
      {showAppointmentRequestModal && selectedSubscription && (
        <AppointmentRequestModal
          subscription={selectedSubscription}
          studentId={studentId}
          onClose={() => {
            setShowAppointmentRequestModal(false);
            setSelectedSubscription(null);
          }}
          onSuccess={handleAppointmentRequestSuccess}
        />
      )}
    </div>
  );
}
