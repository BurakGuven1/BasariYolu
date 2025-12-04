import React, { useState, useEffect } from 'react';
import { School, Users, Plus, Edit2, UserPlus, UserMinus, AlertCircle } from 'lucide-react';
import {
  getInstitutionClasses,
  getClassStudents,
  getInstitutionStudentsWithClass,
  assignStudentToClass,
  removeStudentFromClass,
  type InstitutionClass,
  type ClassStudentWithProfile
} from '../lib/institutionClassApi';

interface InstitutionClassManagementPanelProps {
  institutionId: string;
}

export default function InstitutionClassManagementPanel({ institutionId }: InstitutionClassManagementPanelProps) {
  const [classes, setClasses] = useState<InstitutionClass[]>([]);
  const [selectedClass, setSelectedClass] = useState<InstitutionClass | null>(null);
  const [classStudents, setClassStudents] = useState<ClassStudentWithProfile[]>([]);
  const [allStudents, setAllStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAssignModal, setShowAssignModal] = useState(false);

  useEffect(() => {
    loadData();
  }, [institutionId]);

  useEffect(() => {
    if (selectedClass) {
      loadClassStudents(selectedClass.id);
    }
  }, [selectedClass]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [classesResult, studentsResult] = await Promise.all([
        getInstitutionClasses(institutionId),
        getInstitutionStudentsWithClass(institutionId)
      ]);

      if (classesResult.error) throw classesResult.error;
      if (studentsResult.error) throw studentsResult.error;

      setClasses(classesResult.data || []);
      setAllStudents(studentsResult.data || []);

      if (classesResult.data && classesResult.data.length > 0 && !selectedClass) {
        setSelectedClass(classesResult.data[0]);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadClassStudents = async (classId: string) => {
    try {
      const { data, error } = await getClassStudents(classId);
      if (error) throw error;
      setClassStudents(data || []);
    } catch (error) {
      console.error('Error loading class students:', error);
    }
  };

  const handleAssignStudent = async (studentId: string) => {
    if (!selectedClass) return;

    try {
      const { error } = await assignStudentToClass(institutionId, selectedClass.id, studentId);
      if (error) throw error;

      alert('Öğrenci sınıfa atandı');
      setShowAssignModal(false);
      await loadData();
      await loadClassStudents(selectedClass.id);
    } catch (error: any) {
      console.error('Error assigning student:', error);
      alert('Hata: ' + error.message);
    }
  };

  const handleRemoveStudent = async (enrollmentId: string) => {
    if (!confirm('Öğrenciyi sınıftan çıkarmak istediğinize emin misiniz?')) return;

    try {
      const { error } = await removeStudentFromClass(enrollmentId);
      if (error) throw error;

      alert('Öğrenci sınıftan çıkarıldı');
      if (selectedClass) {
        await loadClassStudents(selectedClass.id);
      }
      await loadData();
    } catch (error: any) {
      console.error('Error removing student:', error);
      alert('Hata: ' + error.message);
    }
  };

  // Get students not in selected class
  const availableStudents = allStudents.filter(student => {
    if (!selectedClass) return false;
    return !student.class || student.class.id !== selectedClass.id;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (classes.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-12 text-center">
        <School className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Henüz sınıf yok
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          Önce "Ders Programı Yönetimi" bölümünden sınıf oluşturun.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <School className="w-8 h-8 text-purple-600" />
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Sınıf Öğrencileri</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Öğrencileri sınıflara atayın ve yönetin
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Class List */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <h3 className="font-bold text-gray-900 dark:text-white mb-4">Sınıflar</h3>
          <div className="space-y-2">
            {classes.map((cls) => (
              <button
                key={cls.id}
                onClick={() => setSelectedClass(cls)}
                className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                  selectedClass?.id === cls.id
                    ? 'bg-purple-100 dark:bg-purple-900 border-2 border-purple-500'
                    : 'bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 border-2 border-transparent'
                }`}
              >
                <div className="font-medium text-gray-900 dark:text-white">{cls.class_name}</div>
                {cls.class_description && (
                  <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    {cls.class_description}
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Class Students */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          {selectedClass ? (
            <>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                    {selectedClass.class_name}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {classStudents.length} öğrenci
                  </p>
                </div>
                <button
                  onClick={() => setShowAssignModal(true)}
                  className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Öğrenci Ekle</span>
                </button>
              </div>

              {classStudents.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600 dark:text-gray-400">
                    Bu sınıfta henüz öğrenci yok
                  </p>
                  <button
                    onClick={() => setShowAssignModal(true)}
                    className="mt-4 text-purple-600 hover:text-purple-700 font-medium"
                  >
                    İlk öğrenciyi ekleyin
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {classStudents.map((student) => (
                    <div
                      key={student.id}
                      className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
                    >
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">
                          {student.student_name}
                        </div>
                        {student.student_email && (
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            {student.student_email}
                          </div>
                        )}
                        <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                          Kayıt: {new Date(student.enrollment_date).toLocaleDateString('tr-TR')}
                        </div>
                      </div>
                      <button
                        onClick={() => handleRemoveStudent(student.id)}
                        className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                        title="Sınıftan Çıkar"
                      >
                        <UserMinus className="w-5 h-5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12">
              <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600 dark:text-gray-400">
                Soldaki listeden bir sınıf seçin
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Assign Student Modal */}
      {showAssignModal && selectedClass && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              {selectedClass.class_name} - Öğrenci Ekle
            </h3>

            {availableStudents.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-600 dark:text-gray-400">
                  Tüm öğrenciler zaten bir sınıfa atanmış
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {availableStudents.map((student) => (
                  <button
                    key={student.user_id}
                    onClick={() => handleAssignStudent(student.user_id)}
                    className="w-full text-left p-3 bg-gray-50 dark:bg-gray-700 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-colors"
                  >
                    <div className="font-medium text-gray-900 dark:text-white">
                      {student.full_name}
                    </div>
                    {student.email && (
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {student.email}
                      </div>
                    )}
                    {student.class && (
                      <div className="text-xs text-orange-600 dark:text-orange-400 mt-1">
                        Şu an: {student.class.class_name}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowAssignModal(false)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
