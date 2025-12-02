import React, { useState, useEffect } from 'react';
import { Calendar, Users, CheckCircle, XCircle, Clock, FileText, Save, AlertCircle } from 'lucide-react';
import {
  recordBulkAttendance,
  getClassAttendance,
  getClassAttendanceSummary,
  AttendanceStatus,
  Attendance
} from '../lib/attendanceApi';
import { supabase } from '../lib/supabase';
import { sendAttendanceNotification } from '../lib/notificationApi';

interface TeacherAttendancePanelProps {
  teacherId: string;
  institutionId: string;
}

interface ClassOption {
  id: string;
  class_name: string;
  grade: number;
}

interface StudentRow {
  student_id: string;
  student_name: string;
  status: AttendanceStatus;
  notes: string;
  existing_record?: Attendance;
}

export default function TeacherAttendancePanel({ teacherId, institutionId }: TeacherAttendancePanelProps) {
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [lessonTime, setLessonTime] = useState<string>('');
  const [subject, setSubject] = useState<string>('');

  const [students, setStudents] = useState<StudentRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [summary, setSummary] = useState<any>(null);

  useEffect(() => {
    loadTeacherClasses();
  }, [teacherId]);

  useEffect(() => {
    if (selectedClassId) {
      loadClassStudents();
      loadAttendanceSummary();
    }
  }, [selectedClassId, selectedDate]);

  const loadTeacherClasses = async () => {
    try {
      const { data, error } = await supabase
        .from('classes')
        .select('id, class_name, grade')
        .eq('teacher_id', teacherId)
        .eq('status', 'active')
        .order('class_name');

      if (error) throw error;
      setClasses(data || []);

      if (data && data.length > 0) {
        setSelectedClassId(data[0].id);
      }
    } catch (error) {
      console.error('Error loading classes:', error);
    }
  };

  const loadClassStudents = async () => {
    setLoading(true);
    try {
      // Önce mevcut yoklama kayıtlarını kontrol et
      const { data: existingAttendance } = await getClassAttendance(selectedClassId, selectedDate);
      const attendanceMap = new Map(existingAttendance?.map(a => [a.student_id, a]) || []);

      // Sınıf öğrencilerini al
      const { data: classStudents, error } = await supabase
        .from('class_students')
        .select(`
          student_id,
          student:students!class_students_student_id_fkey(
            id,
            profile:profiles!students_profile_id_fkey(
              full_name
            )
          )
        `)
        .eq('class_id', selectedClassId)
        .eq('status', 'active');

      if (error) throw error;

      const studentRows: StudentRow[] = (classStudents || []).map(cs => {
        const existing = attendanceMap.get(cs.student_id);
        return {
          student_id: cs.student_id,
          student_name: cs.student?.profile?.full_name || 'İsimsiz',
          status: existing?.status || 'present',
          notes: existing?.notes || '',
          existing_record: existing
        };
      });

      setStudents(studentRows);
    } catch (error) {
      console.error('Error loading students:', error);
      alert('Öğrenci listesi yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const loadAttendanceSummary = async () => {
    try {
      const { data } = await getClassAttendanceSummary(selectedClassId, selectedDate);
      setSummary(data);
    } catch (error) {
      console.error('Error loading summary:', error);
    }
  };

  const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
    setStudents(prev => prev.map(s =>
      s.student_id === studentId ? { ...s, status } : s
    ));
  };

  const handleNotesChange = (studentId: string, notes: string) => {
    setStudents(prev => prev.map(s =>
      s.student_id === studentId ? { ...s, notes } : s
    ));
  };

  const handleSaveAttendance = async () => {
    if (!selectedClassId || !selectedDate) {
      alert('Lütfen sınıf ve tarih seçin');
      return;
    }

    setSaving(true);
    try {
      const attendanceRecords = students.map(student => ({
        institution_id: institutionId,
        class_id: selectedClassId,
        student_id: student.student_id,
        teacher_id: teacherId,
        attendance_date: selectedDate,
        lesson_time: lessonTime || null,
        subject: subject || null,
        status: student.status,
        notes: student.notes || null,
        excuse_reason: student.status === 'excused' ? student.notes : null
      }));

      const { error } = await recordBulkAttendance(attendanceRecords);
      if (error) throw error;

      // Devamsız öğrencilere bildirim gönder (opsiyonel)
      const absences = students.filter(s => s.status === 'absent' || s.status === 'late');

      if (absences.length > 0) {
        const sendNotifications = confirm(
          `${absences.length} öğrenci devamsız/geç. Velilere bildirim gönderilsin mi?`
        );

        if (sendNotifications) {
          for (const absence of absences) {
            await sendAttendanceNotification(institutionId, absence.student_id, {
              date: selectedDate,
              status: absence.status,
              lesson: subject,
              notes: absence.notes
            });
          }
        }
      }

      alert('Yoklama başarıyla kaydedildi');
      loadClassStudents();
      loadAttendanceSummary();
    } catch (error: any) {
      console.error('Error saving attendance:', error);
      alert('Yoklama kaydedilirken hata: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const setAllStatus = (status: AttendanceStatus) => {
    setStudents(prev => prev.map(s => ({ ...s, status })));
  };

  const selectedClass = classes.find(c => c.id === selectedClassId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Users className="w-8 h-8 text-blue-600" />
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Yoklama Al</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Günlük devamsızlık kaydı
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Sınıf *
            </label>
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
            >
              {classes.map(cls => (
                <option key={cls.id} value={cls.id}>
                  {cls.class_name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Tarih *
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              max={new Date().toISOString().split('T')[0]}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Ders Saati
            </label>
            <input
              type="text"
              value={lessonTime}
              onChange={(e) => setLessonTime(e.target.value)}
              placeholder="1. Ders, Sabah, vb."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Ders
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Matematik, Fizik, vb."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
            />
          </div>
        </div>

        {/* Summary */}
        {summary && (
          <div className="mt-4 grid grid-cols-5 gap-4">
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{summary.total_students}</div>
              <div className="text-xs text-gray-600 dark:text-gray-400">Toplam Öğrenci</div>
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-green-600">{summary.present}</div>
              <div className="text-xs text-green-700 dark:text-green-400">Geldi</div>
            </div>
            <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-red-600">{summary.absent}</div>
              <div className="text-xs text-red-700 dark:text-red-400">Gelmedi</div>
            </div>
            <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-yellow-600">{summary.late}</div>
              <div className="text-xs text-yellow-700 dark:text-yellow-400">Geç Geldi</div>
            </div>
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-blue-600">{summary.excused}</div>
              <div className="text-xs text-blue-700 dark:text-blue-400">Mazeretli</div>
            </div>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="flex items-center space-x-3">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Hızlı İşlem:</span>
        <button
          onClick={() => setAllStatus('present')}
          className="px-3 py-1 text-sm bg-green-100 text-green-800 rounded-lg hover:bg-green-200"
        >
          Tümünü Geldi Yap
        </button>
        <button
          onClick={() => setAllStatus('absent')}
          className="px-3 py-1 text-sm bg-red-100 text-red-800 rounded-lg hover:bg-red-200"
        >
          Tümünü Gelmedi Yap
        </button>
      </div>

      {/* Student List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : students.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg">
          <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Sınıfta öğrenci bulunamadı</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    #
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Öğrenci Adı
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Durum
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Not / Mazeret
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {students.map((student, index) => (
                  <tr key={student.student_id} className={`
                    ${student.existing_record ? 'bg-blue-50 dark:bg-blue-900/10' : ''}
                    hover:bg-gray-50 dark:hover:bg-gray-700
                  `}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {index + 1}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="font-medium text-gray-900 dark:text-white">
                          {student.student_name}
                        </div>
                        {student.existing_record && (
                          <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                            Kayıtlı
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center space-x-2">
                        <button
                          onClick={() => handleStatusChange(student.student_id, 'present')}
                          className={`p-2 rounded-lg transition-colors ${
                            student.status === 'present'
                              ? 'bg-green-600 text-white'
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-green-100'
                          }`}
                          title="Geldi"
                        >
                          <CheckCircle className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleStatusChange(student.student_id, 'absent')}
                          className={`p-2 rounded-lg transition-colors ${
                            student.status === 'absent'
                              ? 'bg-red-600 text-white'
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-red-100'
                          }`}
                          title="Gelmedi"
                        >
                          <XCircle className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleStatusChange(student.student_id, 'late')}
                          className={`p-2 rounded-lg transition-colors ${
                            student.status === 'late'
                              ? 'bg-yellow-600 text-white'
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-yellow-100'
                          }`}
                          title="Geç Geldi"
                        >
                          <Clock className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleStatusChange(student.student_id, 'excused')}
                          className={`p-2 rounded-lg transition-colors ${
                            student.status === 'excused'
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-blue-100'
                          }`}
                          title="Mazeretli"
                        >
                          <FileText className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <input
                        type="text"
                        value={student.notes}
                        onChange={(e) => handleNotesChange(student.student_id, e.target.value)}
                        placeholder={student.status === 'excused' ? 'Mazeret nedeni...' : 'Not...'}
                        className="w-full px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Save Button */}
      {students.length > 0 && (
        <div className="flex justify-end">
          <button
            onClick={handleSaveAttendance}
            disabled={saving}
            className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-5 h-5" />
            <span>{saving ? 'Kaydediliyor...' : 'Yoklamayı Kaydet'}</span>
          </button>
        </div>
      )}
    </div>
  );
}
