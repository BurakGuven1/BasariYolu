import React, { useState, useEffect } from 'react';
import { Users, Plus, BookOpen, Settings, LogOut, Copy, RefreshCw, Eye, EyeOff, CreditCard as Edit } from 'lucide-react';
import { getTeacherClasses, createClass, getClassData } from '../lib/teacherApi';
import { PACKAGE_OPTIONS, calculateClassPrice } from '../types/teacher';
import ClassManagementPanel from './ClassManagementPanel';

export default function TeacherDashboard() {
  const [teacher, setTeacher] = useState<any>(null);
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateClass, setShowCreateClass] = useState(false);
  const [showInviteCode, setShowInviteCode] = useState<string | null>(null);
  const [selectedClass, setSelectedClass] = useState<any>(null);
  const [showManagement, setShowManagement] = useState(false);
  const [classDetails, setClassDetails] = useState<any>({});
  const [classFormData, setClassFormData] = useState({
    class_name: '',
    description: '',
    student_capacity: 30,
    package_type: '9_months' as 'monthly' | '3_months' | '9_months'
  });
  const [createLoading, setCreateLoading] = useState(false);

  useEffect(() => {
    // Get teacher from localStorage
    const teacherSession = localStorage.getItem('teacherSession');
    console.log('TeacherDashboard - checking session:', !!teacherSession);
    if (teacherSession) {
      const teacherData = JSON.parse(teacherSession);
      console.log('TeacherDashboard - teacher data:', teacherData);
      setTeacher(teacherData);
      loadClasses(teacherData.id);
    } else {
      console.log('TeacherDashboard - no session, redirecting to home');
      // Don't redirect here, let App.tsx handle it
      setLoading(false);
    }
  }, []);

  const loadClasses = async (teacherId: string) => {
    try {
      const { data } = await getTeacherClasses(teacherId);
      const classesData = data || [];
      setClasses(classesData);
      
      // Load detailed data for each class
      const detailsPromises = classesData.map(async (cls: any) => {
        const { data: details } = await getClassData(cls.id);
        return { [cls.id]: details };
      });
      
      const detailsArray = await Promise.all(detailsPromises);
      const detailsObj = detailsArray.reduce((acc, curr) => ({ ...acc, ...curr }), {});
      setClassDetails(detailsObj);
    } catch (error) {
      console.error('Error loading classes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('teacherSession');
    window.location.href = '/';
  };

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teacher) return;
    
    // Check if teacher already has 2 classes
    if (classes.filter(cls => cls.status !== 'completed').length >= 2) {
      alert('Maksimum 2 aktif sınıf oluşturabilirsiniz');
      return;
    }

    setCreateLoading(true);
    try {
      await createClass({
        teacher_id: teacher.id,
        ...classFormData
      });
      
      alert('Sınıf başarıyla oluşturuldu!');
      setShowCreateClass(false);
      setClassFormData({
        class_name: '',
        description: '',
        student_capacity: 30,
        package_type: '9_months'
      });
      
      // Reload classes
      await loadClasses(teacher.id);
    } catch (error: any) {
      alert('Sınıf oluşturma hatası: ' + error.message);
    } finally {
      setCreateLoading(false);
    }
  };

  const copyInviteCode = (code: string) => {
    navigator.clipboard.writeText(code);
    alert('Davet kodu kopyalandı!');
  };
  
  const handleManageClass = (classData: any) => {
    // Pass the detailed class data with assignments, announcements, and exams
    const detailedClassData = {
      ...classData,
      ...classDetails[classData.id]
    };
    setSelectedClass(detailedClassData);
    setShowManagement(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'pending_payment': return 'bg-yellow-100 text-yellow-800';
      case 'payment_failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'Aktif';
      case 'pending_payment': return 'Ödeme Bekliyor';
      case 'payment_failed': return 'Ödeme Başarısız';
      case 'suspended': return 'Askıya Alındı';
      case 'completed': return 'Tamamlandı';
      default: return status;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Yükleniyor...</p>
        </div>
      </div>
    );
  }
  
  if (showManagement && selectedClass) {
    return (
      <ClassManagementPanel
        classData={selectedClass}
        onBack={() => {
          setShowManagement(false);
          setSelectedClass(null);
        }}
        onRefresh={() => {
          loadClasses(teacher.id);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Öğretmen Paneli</h1>
            <p className="text-gray-600">
              Hoş geldiniz, {teacher?.full_name}! Sınıflarınızı yönetin.
            </p>
            {teacher?.school_name && (
              <p className="text-sm text-gray-500">{teacher.school_name}</p>
            )}
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center space-x-2 bg-red-100 text-red-700 px-4 py-2 rounded-lg hover:bg-red-200 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            <span>Çıkış Yap</span>
          </button>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Toplam Sınıf</p>
                <p className="text-2xl font-bold text-blue-600">{classes.length}</p>
              </div>
              <BookOpen className="h-8 w-8 text-blue-600" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Toplam Öğrenci</p>
                <p className="text-2xl font-bold text-green-600">
                  {classes.reduce((sum, cls) => sum + (cls.current_students || 0), 0)}
                </p>
              </div>
              <Users className="h-8 w-8 text-green-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Aktif Sınıf</p>
                <p className="text-2xl font-bold text-purple-600">
                  {classes.filter(cls => cls.status === 'active').length}
                </p>
              </div>
              <Settings className="h-8 w-8 text-purple-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Aylık Tutar</p>
                <p className="text-2xl font-bold text-orange-600">
                  {classes
                    .filter(cls => cls.status === 'active')
                    .reduce((sum, cls) => {
                      const pricing = calculateClassPrice(cls.current_students || 0, cls.package_type);
                      return sum + pricing.monthlyPrice;
                    }, 0)
                    .toLocaleString()}₺
                </p>
              </div>
              <BookOpen className="h-8 w-8 text-orange-600" />
            </div>
          </div>
        </div>

        {/* Classes */}
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold">Sınıflarım</h3>
            <button
              onClick={() => setShowCreateClass(true)}
              className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-green-700"
            >
              <Plus className="h-4 w-4" />
              <span>Yeni Sınıf</span>
            </button>
          </div>

          {classes.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Henüz sınıf oluşturmadınız</h3>
              <p className="text-gray-600 mb-6">İlk sınıfınızı oluşturun ve öğrencilerinizi davet edin.</p>
              <button
                onClick={() => setShowCreateClass(true)}
                className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700"
              >
                İlk Sınıfı Oluştur
              </button>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {classes.map((cls) => (
                (() => {
                  const details = classDetails[cls.id];
                  const assignments = details?.class_assignments || [];
                  const announcements = details?.class_announcements || [];
                  const exams = details?.class_exams || [];
                  
                  return (
                <div key={cls.id} className="border rounded-lg p-6 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h4 className="font-semibold text-lg">{cls.class_name}</h4>
                      {cls.description && (
                        <p className="text-gray-600 text-sm mt-1">{cls.description}</p>
                      )}
                    </div>
                    
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(cls.status)}`}>
                      {getStatusText(cls.status)}
                    </span>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm">
                      <span>Öğrenci:</span>
                      <span className="font-medium">{cls.current_students || 0}/{cls.student_capacity}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Paket:</span>
                      <span className="font-medium">
                        {PACKAGE_OPTIONS.find(p => p.type === cls.package_type)?.name}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Aylık Tutar:</span>
                      <span className="font-medium text-green-600">
                        {calculateClassPrice(cls.current_students || 0, cls.package_type).monthlyPrice.toLocaleString()}₺
                      </span>
                    </div>
                  </div>

                  {/* Class Content Summary */}
                  <div className="border-t pt-3 mb-3">
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div className="text-center">
                        <div className="font-semibold text-blue-600">{assignments.length}</div>
                        <div className="text-gray-600">Ödev</div>
                      </div>
                      <div className="text-center">
                        <div className="font-semibold text-purple-600">{announcements.length}</div>
                        <div className="text-gray-600">Duyuru</div>
                      </div>
                      <div className="text-center">
                        <div className="font-semibold text-orange-600">{exams.length}</div>
                        <div className="text-gray-600">Sınav</div>
                      </div>
                    </div>
                  </div>

                  {/* Class Content Details */}
                  {(assignments.length > 0 || announcements.length > 0 || exams.length > 0) && (
                    <div className="border-t pt-3 mb-3 max-h-40 overflow-y-auto">
                      <div className="text-xs text-gray-600 mb-2">İçerikler:</div>
                      <div className="space-y-1">
                        {assignments.slice(0, 3).map((assignment: any) => (
                          <div key={assignment.id} className="text-xs bg-blue-50 p-2 rounded flex justify-between items-center">
                            <div>
                              <div className="font-medium text-blue-800">📝 {assignment.title}</div>
                              <div className="text-blue-600">{assignment.subject} - {new Date(assignment.due_date).toLocaleDateString('tr-TR')}</div>
                            </div>
                          </div>
                        ))}
                        {announcements.slice(0, 2).map((announcement: any) => (
                          <div key={announcement.id} className="text-xs bg-purple-50 p-2 rounded">
                            <div className="font-medium text-purple-800">📢 {announcement.title}</div>
                            <div className="text-purple-600">{announcement.content.substring(0, 40)}...</div>
                          </div>
                        ))}
                        {exams.slice(0, 2).map((exam: any) => (
                          <div key={exam.id} className="text-xs bg-orange-50 p-2 rounded">
                            <div className="font-medium text-orange-800">🏆 {exam.exam_name}</div>
                            <div className="text-orange-600">{exam.exam_type} - {new Date(exam.exam_date).toLocaleDateString('tr-TR')}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {/* Recent Activity */}
                  {(assignments.length > 0 || announcements.length > 0 || exams.length > 0) && (
                    <div className="border-t pt-3 mb-3">
                      <div className="text-xs text-gray-600 mb-2">Son Aktiviteler:</div>
                      <div className="space-y-1">
                        {assignments.slice(0, 2).map((assignment: any) => (
                          <div key={assignment.id} className="text-xs bg-blue-50 p-2 rounded">
                            <div className="font-medium text-blue-800">📝 {assignment.title}</div>
                            <div className="text-blue-600">Son teslim: {new Date(assignment.due_date).toLocaleDateString('tr-TR')}</div>
                          </div>
                        ))}
                        {announcements.slice(0, 1).map((announcement: any) => (
                          <div key={announcement.id} className="text-xs bg-purple-50 p-2 rounded">
                            <div className="font-medium text-purple-800">📢 {announcement.title}</div>
                            <div className="text-purple-600">{announcement.content.substring(0, 50)}...</div>
                          </div>
                        ))}
                        {exams.slice(0, 1).map((exam: any) => (
                          <div key={exam.id} className="text-xs bg-orange-50 p-2 rounded">
                            <div className="font-medium text-orange-800">🏆 {exam.exam_name}</div>
                            <div className="text-orange-600">{new Date(exam.exam_date).toLocaleDateString('tr-TR')}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="border-t pt-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600">Davet Kodu:</span>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => setShowInviteCode(showInviteCode === cls.id ? null : cls.id)}
                          className="text-blue-600 hover:text-blue-700"
                        >
                          {showInviteCode === cls.id ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                        <button
                          onClick={() => copyInviteCode(cls.invite_code)}
                          className="text-green-600 hover:text-green-700"
                        >
                          <Copy className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    {showInviteCode === cls.id && (
                      <div className="mb-3 p-2 bg-gray-100 rounded font-mono text-sm text-center">
                        {cls.invite_code}
                      </div>
                    )}
                    <div className="border-t pt-4 mt-4">
                      <button
                        onClick={() => handleManageClass(cls)}
                        className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 flex items-center justify-center space-x-2"
                      >
                        <Edit className="h-4 w-4" />
                        <span>Sınıfı Yönet</span>
                      </button>
                    </div>
                  </div>
                </div>
                  );
                })()
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Create Class Modal */}
      {showCreateClass && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold mb-4">Yeni Sınıf Oluştur</h3>
            <form onSubmit={handleCreateClass} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sınıf Adı *
                </label>
                <input
                  type="text"
                  value={classFormData.class_name}
                  onChange={(e) => setClassFormData(prev => ({ ...prev, class_name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  placeholder="Örn: 12-A TYT Hazırlık"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Açıklama
                </label>
                <textarea
                  value={classFormData.description}
                  onChange={(e) => setClassFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  rows={2}
                  placeholder="Sınıf hakkında kısa açıklama"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Öğrenci Kapasitesi: {classFormData.student_capacity}
                </label>
                <input
                  type="range"
                  min="5"
                  max="40"
                  value={classFormData.student_capacity}
                  onChange={(e) => setClassFormData(prev => ({ ...prev, student_capacity: parseInt(e.target.value) }))}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>5 öğrenci</span>
                  <span>40 öğrenci</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Paket Seçimi
                </label>
                <select
                  value={classFormData.package_type}
                  onChange={(e) => setClassFormData(prev => ({ ...prev, package_type: e.target.value as any }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                >
                  {PACKAGE_OPTIONS.map((pkg) => (
                    <option key={pkg.type} value={pkg.type}>
                      {pkg.name} - {pkg.price_per_student}₺/öğrenci/ay
                      {pkg.discount_percent > 0 && ` (%${pkg.discount_percent} indirim)`}
                    </option>
                  ))}
                </select>
              </div>

              <div className="bg-blue-50 p-3 rounded-lg">
                <div className="text-sm">
                  <div className="flex justify-between mb-2">
                    <span className="font-medium text-blue-800">Sınıf Limiti:</span>
                    <span className="text-blue-700">
                      {classes.filter(cls => cls.status !== 'completed').length}/2 aktif sınıf
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Aylık Toplam:</span>
                    <span className="font-semibold">
                      {calculateClassPrice(classFormData.student_capacity, classFormData.package_type).monthlyPrice.toLocaleString()}₺
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Toplam Tutar:</span>
                    <span className="font-semibold text-green-600">
                      {calculateClassPrice(classFormData.student_capacity, classFormData.package_type).totalPrice.toLocaleString()}₺
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => setShowCreateClass(false)}
                  className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg hover:bg-gray-200"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={createLoading || classes.filter(cls => cls.status !== 'completed').length >= 2}
                  className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  {createLoading ? 'Oluşturuluyor...' : 
                   classes.filter(cls => cls.status !== 'completed').length >= 2 ? 'Limit Doldu' : 'Oluştur'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}