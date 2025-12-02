import React, { useState, useEffect } from 'react';
import { Calendar, Clock, MapPin, Users, Book } from 'lucide-react';
import { getInstitutionScheduleEntries, type ScheduleEntry, getDayName, formatTime } from '../lib/institutionScheduleApi';
import TeacherAttendanceModal from './TeacherAttendanceModal';

interface TeacherSchedulePanelProps {
  teacherId: string;
  institutionId: string;
}

export default function TeacherSchedulePanel({ teacherId, institutionId }: TeacherSchedulePanelProps) {
  const [scheduleEntries, setScheduleEntries] = useState<ScheduleEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLesson, setSelectedLesson] = useState<ScheduleEntry | null>(null);
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);

  useEffect(() => {
    loadSchedule();
  }, [institutionId]);

  const loadSchedule = async () => {
    setLoading(true);
    try {
      const data = await getInstitutionScheduleEntries(institutionId);
      // Sadece bu öğretmenin derslerini filtrele
      const teacherSchedule = data.filter(entry => entry.teacher_id === teacherId);
      setScheduleEntries(teacherSchedule);
    } catch (error) {
      console.error('Error loading schedule:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLessonClick = (lesson: ScheduleEntry) => {
    setSelectedLesson(lesson);
    setShowAttendanceModal(true);
  };

  const groupByDay = () => {
    const grouped: Record<number, ScheduleEntry[]> = {};
    scheduleEntries.forEach(entry => {
      if (!grouped[entry.day_of_week]) {
        grouped[entry.day_of_week] = [];
      }
      grouped[entry.day_of_week].push(entry);
    });

    // Günlere göre sırala
    Object.keys(grouped).forEach(day => {
      grouped[parseInt(day)].sort((a, b) => a.start_time.localeCompare(b.start_time));
    });

    return grouped;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  const groupedSchedule = groupByDay();
  const days = [1, 2, 3, 4, 5, 6, 7]; // Pazartesi - Pazar

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Calendar className="w-8 h-8 text-purple-600" />
          <div>
            <h2 className="text-2xl font-bold text-gray-900 ">Ders Programım</h2>
            <p className="text-sm text-gray-600 ">
              Kurumunuzun oluşturduğu haftalık ders programı - Yoklama almak için derse tıklayın
            </p>
          </div>
        </div>
      </div>

      {scheduleEntries.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Henüz ders programınız yok
          </h3>
          <p className="text-gray-600 ">
            Kurumunuz henüz size ders programı atamamış. Lütfen kurum yöneticinizle iletişime geçin.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-7 gap-4">
          {days.map(day => (
            <div key={day} className="bg-white rounded-lg shadow overflow-hidden">
              {/* Gün Başlığı */}
              <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-4 py-3">
                <h3 className="text-white font-bold text-center">{getDayName(day)}</h3>
              </div>

              {/* Dersler */}
              <div className="p-3 space-y-2">
                {groupedSchedule[day] && groupedSchedule[day].length > 0 ? (
                  groupedSchedule[day].map((entry) => (
                    <button
                      key={entry.id}
                      onClick={() => handleLessonClick(entry)}
                      className="w-full text-left p-3 rounded-lg border-2 border-gray-200 hover:border-purple-500 transition-all hover:shadow-md cursor-pointer group"
                      style={{
                        borderLeftWidth: '4px',
                        borderLeftColor: entry.color || '#8B5CF6'
                      }}
                    >
                      <div className="space-y-1">
                        {/* Ders Adı */}
                        <div className="font-bold text-gray-900 group-hover:text-purple-600 flex items-center space-x-2">
                          <Book className="w-4 h-4" />
                          <span className="text-sm">{entry.subject}</span>
                        </div>

                        {/* Sınıf */}
                        <div className="flex items-center space-x-2 text-xs text-gray-600 ">
                          <Users className="w-3 h-3" />
                          <span>{entry.class_name}</span>
                        </div>

                        {/* Saat */}
                        <div className="flex items-center space-x-2 text-xs text-gray-600 ">
                          <Clock className="w-3 h-3" />
                          <span>{formatTime(entry.start_time)} - {formatTime(entry.end_time)}</span>
                        </div>

                        {/* Sınıf */}
                        {entry.classroom && (
                          <div className="flex items-center space-x-2 text-xs text-gray-600 ">
                            <MapPin className="w-3 h-3" />
                            <span>{entry.classroom}</span>
                          </div>
                        )}
                      </div>

                      {/* Hover Hint */}
                      <div className="mt-2 text-xs text-purple-600 opacity-0 group-hover:opacity-100 transition-opacity">
                        Yoklama almak için tıklayın →
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-400 text-sm">
                    Ders yok
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Attendance Modal */}
      {showAttendanceModal && selectedLesson && (
        <TeacherAttendanceModal
          teacherId={teacherId}
          institutionId={institutionId}
          lesson={selectedLesson}
          onClose={() => {
            setShowAttendanceModal(false);
            setSelectedLesson(null);
          }}
          onSuccess={() => {
            setShowAttendanceModal(false);
            setSelectedLesson(null);
          }}
        />
      )}
    </div>
  );
}
