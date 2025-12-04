import React, { useState, useEffect } from 'react';
import { X, CheckCircle, XCircle, Clock, AlertCircle, Save } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { recordBulkAttendance, AttendanceStatus } from '../lib/attendanceApi';
import { sendAttendanceNotification } from '../lib/notificationApi';
import type { ScheduleEntry } from '../lib/institutionScheduleApi';

interface TeacherAttendanceModalProps {
  teacherId: string;
  institutionId: string;
  lesson: ScheduleEntry;
  onClose: () => void;
  onSuccess: () => void;
}

interface StudentRow {
  student_id: string;
  student_name: string;
  status: AttendanceStatus;
  notes: string;
}

export default function TeacherAttendanceModal({
  teacherId,
  institutionId,
  lesson,
  onClose,
  onSuccess
}: TeacherAttendanceModalProps) {
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [notifyParents, setNotifyParents] = useState(true);

  useEffect(() => {
    loadClassStudents();
  }, []);

  const loadClassStudents = async () => {
    setLoading(true);
    try {
      // First, find the class by class_name
      const { data: institutionClass, error: classError } = await supabase
        .from('institution_classes')
        .select('id')
        .eq('institution_id', institutionId)
        .eq('class_name', lesson.class_name)
        .maybeSingle();

      if (classError) throw classError;

      if (!institutionClass) {
        console.warn('Class not found for:', lesson.class_name);
        // Fallback: show all approved students
        const { data: allStudents } = await supabase
          .from('institution_student_requests')
          .select('user_id, full_name')
          .eq('institution_id', institutionId)
          .eq('status', 'approved')
          .order('full_name');

        const studentRows: StudentRow[] = (allStudents || []).map((student: any) => ({
          student_id: student.user_id,
          student_name: student.full_name || 'İsimsiz Öğrenci',
          status: 'present' as AttendanceStatus,
          notes: ''
        }));

        setStudents(studentRows);
        setLoading(false);
        return;
      }

      // Get students enrolled in this specific class
      const { data: classEnrollments, error: enrollmentError } = await supabase
        .from('institution_class_students')
        .select('student_id')
        .eq('class_id', institutionClass.id)
        .eq('is_active', true);

      if (enrollmentError) throw enrollmentError;

      if (!classEnrollments || classEnrollments.length === 0) {
        setStudents([]);
        setLoading(false);
        return;
      }

      // Get student profiles
      const studentIds = classEnrollments.map(e => e.student_id);
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', studentIds)
        .order('full_name');

      if (profileError) throw profileError;

      // Get today's attendance records for these students
      const { data: todayAttendance } = await supabase
        .from('attendance')
        .select('student_id, status, notes')
        .eq('institution_id', institutionId)
        .eq('attendance_date', selectedDate)
        .eq('subject', lesson.subject)
        .in('student_id', studentIds);

      // Create a map of existing attendance
      const attendanceMap = new Map(
        todayAttendance?.map(a => [a.student_id, { status: a.status, notes: a.notes }]) || []
      );

      const studentRows: StudentRow[] = (profiles || []).map((profile: any) => {
        const existingAttendance = attendanceMap.get(profile.id);
        return {
          student_id: profile.id,
          student_name: profile.full_name || 'İsimsiz Öğrenci',
          status: (existingAttendance?.status as AttendanceStatus) || 'present',
          notes: existingAttendance?.notes || ''
        };
      });

      setStudents(studentRows);
    } catch (error) {
      console.error('Error loading students:', error);
      alert('Öğrenciler yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
    setStudents(prev =>
      prev.map(s =>
        s.student_id === studentId ? { ...s, status } : s
      )
    );
  };

  const handleNotesChange = (studentId: string, notes: string) => {
    setStudents(prev =>
      prev.map(s =>
        s.student_id === studentId ? { ...s, notes } : s
      )
    );
  };

  const handleBulkStatus = (status: AttendanceStatus) => {
    setStudents(prev => prev.map(s => ({ ...s, status })));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Yoklama kayıtlarını oluştur
      const attendanceRecords = students.map(student => ({
        institution_id: institutionId,
        class_id: lesson.id,
        student_id: student.student_id,
        teacher_id: teacherId,
        attendance_date: selectedDate,
        lesson_time: `${lesson.start_time}-${lesson.end_time}`,
        subject: lesson.subject,
        status: student.status,
        notes: student.notes || undefined,
        excuse_reason: undefined,
        notified_parent: false
      }));

      const { error } = await recordBulkAttendance(attendanceRecords);
      if (error) throw error;

      // Velilere bildirim gönder (sadece absent olan öğrenciler için)
      if (notifyParents) {
        const absentStudents = students.filter(s => s.status === 'absent');
        console.log('🔔 Bildirim gönderilecek öğrenci sayısı:', absentStudents.length);

        for (const student of absentStudents) {
          try {
            console.log('📤 Bildirim gönderiliyor:', student.student_name, student.student_id);

            // Email her zaman gönder, günlük kısıtlama sadece WhatsApp için
            console.log('✅ Mesaj gönderimi başlatılıyor...');
            const result = await sendAttendanceNotification(institutionId, student.student_id, {
              date: selectedDate,
              status: 'absent',
              lesson: lesson.subject,
              notes: student.notes
            });
            console.log('📊 Bildirim sonucu:', result);
          } catch (notifError) {
            console.error(`❌ Failed to send notification for student ${student.student_id}:`, notifError);
          }
        }
      }

      alert('Yoklama kaydedildi');
      onSuccess();
    } catch (error: any) {
      console.error('Error saving attendance:', error);
      alert('Yoklama kaydedilirken hata: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const stats = {
    total: students.length,
    present: students.filter(s => s.status === 'present').length,
    absent: students.filter(s => s.status === 'absent').length,
    late: students.filter(s => s.status === 'late').length,
    excused: students.filter(s => s.status === 'excused').length
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                Yoklama Al - {lesson.subject}
              </h3>
              <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                <p>Sınıf: {lesson.class_name}</p>
                <p>Saat: {lesson.start_time} - {lesson.end_time}</p>
                <p>Tarih: {new Date(selectedDate).toLocaleDateString('tr-TR')}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Stats */}
          <div className="mt-4 grid grid-cols-5 gap-3">
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-2 text-center">
              <div className="text-lg font-bold text-gray-900 dark:text-white">{stats.total}</div>
              <div className="text-xs text-gray-600 dark:text-gray-400">Toplam</div>
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-2 text-center">
              <div className="text-lg font-bold text-green-600">{stats.present}</div>
              <div className="text-xs text-green-700 dark:text-green-400">Geldi</div>
            </div>
            <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-2 text-center">
              <div className="text-lg font-bold text-red-600">{stats.absent}</div>
              <div className="text-xs text-red-700 dark:text-red-400">Gelmedi</div>
            </div>
            <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-2 text-center">
              <div className="text-lg font-bold text-yellow-600">{stats.late}</div>
              <div className="text-xs text-yellow-700 dark:text-yellow-400">Geç</div>
            </div>
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-2 text-center">
              <div className="text-lg font-bold text-blue-600">{stats.excused}</div>
              <div className="text-xs text-blue-700 dark:text-blue-400">Mazeretli</div>
            </div>
          </div>

          {/* Bulk Actions */}
          <div className="mt-4 flex items-center space-x-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Toplu İşlem:</span>
            <button
              onClick={() => handleBulkStatus('present')}
              className="px-3 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200 text-sm"
            >
              Hepsi Geldi
            </button>
            <button
              onClick={() => handleBulkStatus('absent')}
              className="px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 text-sm"
            >
              Hepsi Gelmedi
            </button>
          </div>
        </div>

        {/* Student List */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            </div>
          ) : (
            <div className="space-y-3">
              {students.map((student) => (
                <div
                  key={student.student_id}
                  className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4"
                >
                  <div className="flex items-start space-x-4">
                    {/* Student Name */}
                    <div className="flex-1">
                      <div className="font-medium text-gray-900 dark:text-white">
                        {student.student_name}
                      </div>
                    </div>

                    {/* Status Buttons */}
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleStatusChange(student.student_id, 'present')}
                        className={`p-2 rounded-lg transition-colors ${
                          student.status === 'present'
                            ? 'bg-green-500 text-white'
                            : 'bg-white dark:bg-gray-600 text-gray-400 hover:text-green-500'
                        }`}
                        title="Geldi"
                      >
                        <CheckCircle className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleStatusChange(student.student_id, 'absent')}
                        className={`p-2 rounded-lg transition-colors ${
                          student.status === 'absent'
                            ? 'bg-red-500 text-white'
                            : 'bg-white dark:bg-gray-600 text-gray-400 hover:text-red-500'
                        }`}
                        title="Gelmedi"
                      >
                        <XCircle className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleStatusChange(student.student_id, 'late')}
                        className={`p-2 rounded-lg transition-colors ${
                          student.status === 'late'
                            ? 'bg-yellow-500 text-white'
                            : 'bg-white dark:bg-gray-600 text-gray-400 hover:text-yellow-500'
                        }`}
                        title="Geç Geldi"
                      >
                        <Clock className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleStatusChange(student.student_id, 'excused')}
                        className={`p-2 rounded-lg transition-colors ${
                          student.status === 'excused'
                            ? 'bg-blue-500 text-white'
                            : 'bg-white dark:bg-gray-600 text-gray-400 hover:text-blue-500'
                        }`}
                        title="Mazeretli"
                      >
                        <AlertCircle className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  {/* Notes */}
                  {student.status !== 'present' && (
                    <div className="mt-2">
                      <input
                        type="text"
                        value={student.notes}
                        onChange={(e) => handleNotesChange(student.student_id, e.target.value)}
                        placeholder="Not ekleyin (opsiyonel)"
                        className="w-full px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-600 dark:text-white"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={notifyParents}
                onChange={(e) => setNotifyParents(e.target.checked)}
                className="rounded border-gray-300"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Gelmeyenlerin velilerine WhatsApp ile bildir (günde 1 mesaj)
              </span>
            </label>

            <div className="flex space-x-3">
              <button
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                İptal
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? 'Kaydediliyor...' : 'Kaydet'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
