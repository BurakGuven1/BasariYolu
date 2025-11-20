import { useState, useEffect } from 'react';
import { Calendar, Clock, MapPin, User, BookOpen } from 'lucide-react';
import {
  getInstitutionFullSchedule,
  getDayName,
  formatTime,
  type FullScheduleEntry
} from '../lib/institutionScheduleApi';

interface StudentScheduleViewProps {
  institutionId: string;
  studentClassName?: string; // Öğrencinin sınıfı (opsiyonel - filtreleme için)
}

export default function StudentScheduleView({ institutionId, studentClassName }: StudentScheduleViewProps) {
  const [fullSchedule, setFullSchedule] = useState<FullScheduleEntry[]>([]);
  const [filteredSchedule, setFilteredSchedule] = useState<FullScheduleEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [availableClasses, setAvailableClasses] = useState<string[]>([]);

  useEffect(() => {
    loadSchedule();
  }, [institutionId]);

  useEffect(() => {
    // Filtrele
    if (selectedClass === 'all') {
      setFilteredSchedule(fullSchedule);
    } else {
      setFilteredSchedule(fullSchedule.filter(entry => entry.class_name === selectedClass));
    }
  }, [selectedClass, fullSchedule]);

  const loadSchedule = async () => {
    setLoading(true);
    try {
      const data = await getInstitutionFullSchedule(institutionId);
      setFullSchedule(data.filter(e => e.type === 'class_schedule')); // Sadece kurum dersleri

      // Mevcut sınıfları al
      const classes = Array.from(new Set(data.filter(e => e.class_name).map(e => e.class_name!)));
      setAvailableClasses(classes);

      // Eğer öğrencinin sınıfı verilmişse otomatik filtrele
      if (studentClassName && classes.includes(studentClassName)) {
        setSelectedClass(studentClassName);
      }
    } catch (err) {
      console.error('Error loading schedule:', err);
    } finally {
      setLoading(false);
    }
  };

  const getScheduleByDay = () => {
    const byDay: Record<number, FullScheduleEntry[]> = {
      1: [], 2: [], 3: [], 4: [], 5: [], 6: [], 7: []
    };

    filteredSchedule.forEach(entry => {
      byDay[entry.day_of_week].push(entry);
    });

    // Sort by time
    Object.keys(byDay).forEach(day => {
      byDay[parseInt(day)].sort((a, b) => a.start_time.localeCompare(b.start_time));
    });

    return byDay;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Ders programı yükleniyor...</span>
      </div>
    );
  }

  const scheduleByDay = getScheduleByDay();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 text-white">
        <div className="flex items-center gap-3 mb-2">
          <Calendar className="h-8 w-8" />
          <h2 className="text-2xl font-bold">Kurum Ders Programı</h2>
        </div>
        <p className="text-blue-100">Kurumunuzun haftalık ders programı</p>
      </div>

      {/* Class Filter */}
      {availableClasses.length > 1 && (
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <label className="block text-sm font-medium text-gray-700 mb-2">Sınıf Seç</label>
          <select
            value={selectedClass}
            onChange={e => setSelectedClass(e.target.value)}
            className="w-full md:w-auto border border-gray-300 rounded-lg px-4 py-2 text-gray-900"
          >
            <option value="all">Tüm Sınıflar</option>
            {availableClasses.map(className => (
              <option key={className} value={className}>{className}</option>
            ))}
          </select>
        </div>
      )}

      {/* Weekly Grid */}
      <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
        {[1, 2, 3, 4, 5, 6, 7].map(day => (
          <div key={day} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-500 to-purple-500 text-white p-3 text-center">
              <h3 className="font-semibold">{getDayName(day)}</h3>
            </div>
            <div className="p-3 space-y-2">
              {scheduleByDay[day].map(entry => (
                <div
                  key={entry.id}
                  className="p-3 rounded-lg text-white text-sm shadow-sm hover:shadow-md transition-shadow"
                  style={{ backgroundColor: entry.color }}
                >
                  <div className="font-semibold text-base mb-1">{entry.subject}</div>

                  {entry.class_name && selectedClass === 'all' && (
                    <div className="text-xs opacity-90 flex items-center gap-1 mb-1">
                      <BookOpen className="h-3 w-3" />
                      {entry.class_name}
                    </div>
                  )}

                  {entry.teacher_name && (
                    <div className="text-xs opacity-90 flex items-center gap-1 mb-1">
                      <User className="h-3 w-3" />
                      {entry.teacher_name}
                    </div>
                  )}

                  {entry.classroom && (
                    <div className="text-xs opacity-80 flex items-center gap-1 mb-1">
                      <MapPin className="h-3 w-3" />
                      {entry.classroom}
                    </div>
                  )}

                  <div className="text-xs opacity-80 flex items-center gap-1 mt-2 pt-2 border-t border-white/20">
                    <Clock className="h-3 w-3" />
                    {formatTime(entry.start_time)} - {formatTime(entry.end_time)}
                  </div>

                  {entry.notes && (
                    <div className="text-xs opacity-70 mt-2 italic">
                      {entry.notes}
                    </div>
                  )}
                </div>
              ))}
              {scheduleByDay[day].length === 0 && (
                <p className="text-gray-400 text-xs text-center py-8">Bu gün ders yok</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {filteredSchedule.length === 0 && (
        <div className="bg-yellow-50 rounded-lg p-6 border border-yellow-200 text-center">
          <p className="text-yellow-800">
            {selectedClass === 'all'
              ? 'Henüz ders programı eklenmemiş.'
              : `${selectedClass} sınıfı için ders programı bulunamadı.`}
          </p>
        </div>
      )}

      {/* Legend */}
      {filteredSchedule.length > 0 && (
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <h3 className="font-semibold text-gray-900 mb-3">Bilgi</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-blue-600" />
              <span>Sınıf</span>
            </div>
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-purple-600" />
              <span>Öğretmen</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-green-600" />
              <span>Derslik</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-orange-600" />
              <span>Saat</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
