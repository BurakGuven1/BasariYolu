import React, { useState, useEffect } from 'react';
import { Users, BookOpen, Bell, Trophy, Calendar, LogOut, ArrowLeft } from 'lucide-react';
import { getClassData, getClassAssignments, getClassAnnouncements, getClassExams } from '../lib/teacherApi';

interface ClassDashboardProps {
  classData: any;
  onBack: () => void;
}

export default function ClassDashboard({ classData, onBack }: ClassDashboardProps) {
  const [assignments, setAssignments] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [exams, setExams] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadClassData();
  }, [classData.id]);

  const loadClassData = async () => {
    try {
      const [assignmentsRes, announcementsRes, examsRes, classRes] = await Promise.all([
        getClassAssignments(classData.id),
        getClassAnnouncements(classData.id),
        getClassExams(classData.id),
        getClassData(classData.id)
      ]);

      setAssignments(assignmentsRes.data || []);
      setAnnouncements(announcementsRes.data || []);
      setExams(examsRes.data || []);
      setStudents(classRes.data?.class_students || []);
    } catch (error) {
      console.error('Error loading class data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getAnnouncementColor = (type: string) => {
    switch (type) {
      case 'warning': return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'success': return 'bg-green-50 border-green-200 text-green-800';
      case 'error': return 'bg-red-50 border-red-200 text-red-800';
      default: return 'bg-blue-50 border-blue-200 text-blue-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Sınıf verileri yükleniyor...</p>
        </div>
      </div>
    );
  }

  // Check if this is accessed via hash (from teacher dashboard)
  const isTeacherView = window.location.hash.includes('class-');

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 flex justify-between items-start">
          <div className="flex items-center space-x-4">
            <button
              onClick={onBack}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="h-5 w-5" />
              <span>Geri</span>
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{classData.class_name}</h1>
              <p className="text-gray-600">
                {isTeacherView ? 'Sınıf Görünümü' : `Öğretmen: ${classData.teachers?.full_name}`}
              </p>
              {classData.description && (
                <p className="text-sm text-gray-500">{classData.description}</p>
              )}
            </div>
          </div>
          {isTeacherView && (
            <button
              onClick={() => {
                // Navigate to management panel
                window.location.hash = `#manage-${classData.id}`;
                window.location.reload();
              }}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center space-x-2"
            >
              <Settings className="h-4 w-4" />
              <span>Yönet</span>
            </button>
          )}
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Toplam Öğrenci</p>
                <p className="text-2xl font-bold text-blue-600">{students.length}</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Aktif Ödev</p>
                <p className="text-2xl font-bold text-green-600">{assignments.length}</p>
              </div>
              <BookOpen className="h-8 w-8 text-green-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Duyuru</p>
                <p className="text-2xl font-bold text-purple-600">{announcements.length}</p>
              </div>
              <Bell className="h-8 w-8 text-purple-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Sınav</p>
                <p className="text-2xl font-bold text-orange-600">{exams.length}</p>
              </div>
              <Trophy className="h-8 w-8 text-orange-600" />
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Announcements */}
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <Bell className="h-5 w-5 mr-2 text-purple-600" />
              Son Duyurular
            </h3>
            <div className="space-y-3">
              {announcements.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Bell className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>Henüz duyuru yok</p>
                </div>
              ) : (
                announcements.slice(0, 5).map((announcement) => (
                  <div key={announcement.id} className={`p-3 rounded-lg border ${getAnnouncementColor(announcement.type)}`}>
                    <h4 className="font-medium">{announcement.title}</h4>
                    <p className="text-sm mt-1">{announcement.content}</p>
                    <p className="text-xs mt-2 opacity-75">
                      {new Date(announcement.created_at).toLocaleDateString('tr-TR')}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Assignments */}
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <BookOpen className="h-5 w-5 mr-2 text-green-600" />
              Aktif Ödevler
            </h3>
            <div className="space-y-3">
              {assignments.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <BookOpen className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>Henüz ödev yok</p>
                </div>
              ) : (
                assignments.slice(0, 5).map((assignment) => (
                  <div key={assignment.id} className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium">{assignment.title}</h4>
                        <p className="text-sm text-gray-600">{assignment.subject}</p>
                        {assignment.description && (
                          <p className="text-xs text-gray-500 mt-1">{assignment.description}</p>
                        )}
                      </div>
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                        {new Date(assignment.due_date).toLocaleDateString('tr-TR')}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Exam Rankings */}
        {exams.length > 0 && (
          <div className="mt-6 bg-white rounded-lg p-6 shadow-sm">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <Trophy className="h-5 w-5 mr-2 text-orange-600" />
              Son Sınav Sıralaması
            </h3>
            {exams[0]?.class_exam_results && exams[0].class_exam_results.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">Sıra</th>
                      <th className="text-left py-2">Öğrenci</th>
                      <th className="text-left py-2">Puan</th>
                      <th className="text-left py-2">Doğru</th>
                      <th className="text-left py-2">Yanlış</th>
                      <th className="text-left py-2">Boş</th>
                    </tr>
                  </thead>
                  <tbody>
                    {exams[0].class_exam_results
                      .sort((a: any, b: any) => (b.score || 0) - (a.score || 0))
                      .slice(0, 10)
                      .map((result: any, index: number) => (
                        <tr key={result.id} className="border-b hover:bg-gray-50">
                          <td className="py-2">
                            <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                              index === 0 ? 'bg-yellow-100 text-yellow-800' :
                              index === 1 ? 'bg-gray-100 text-gray-800' :
                              index === 2 ? 'bg-orange-100 text-orange-800' :
                              'bg-blue-100 text-blue-800'
                            }`}>
                              {index + 1}
                            </span>
                          </td>
                          <td className="py-2 font-medium">
                            {result.students?.profiles?.full_name || 'Bilinmeyen'}
                          </td>
                          <td className="py-2 font-semibold text-blue-600">
                            {result.score ? result.score.toFixed(1) : '0'}
                          </td>
                          <td className="py-2 text-green-600">{result.correct_answers || 0}</td>
                          <td className="py-2 text-red-600">{result.wrong_answers || 0}</td>
                          <td className="py-2 text-gray-600">{result.empty_answers || 0}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Trophy className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>Henüz sınav sonucu yok</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}