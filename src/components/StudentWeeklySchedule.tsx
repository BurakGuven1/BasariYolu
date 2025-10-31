import { useState, useEffect } from 'react';
import { Calendar, Clock, BookOpen, CheckCircle, Target, User, AlertCircle } from 'lucide-react';
import { getCurrentWeekSchedule, markScheduleItemComplete } from '../lib/studyScheduleApi';

interface StudentWeeklyScheduleProps {
  studentId: string;
  studentName?: string;
}

const DAYS_OF_WEEK = [
  { value: 0, label: 'Pazartesi', short: 'Pzt' },
  { value: 1, label: 'Salı', short: 'Sal' },
  { value: 2, label: 'Çarşamba', short: 'Çar' },
  { value: 3, label: 'Perşembe', short: 'Per' },
  { value: 4, label: 'Cuma', short: 'Cum' },
  { value: 5, label: 'Cumartesi', short: 'Cmt' },
  { value: 6, label: 'Pazar', short: 'Paz' }
];

export default function StudentWeeklySchedule({ studentId }: StudentWeeklyScheduleProps) {
  const [schedule, setSchedule] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<number>(new Date().getDay() === 0 ? 6 : new Date().getDay() - 1);
  const [expandedItem, setExpandedItem] = useState<string | null>(null);

  useEffect(() => {
    loadSchedule();
  }, [studentId]);

  const loadSchedule = async () => {
    setLoading(true);
    try {
      const { data, error } = await getCurrentWeekSchedule(studentId);
      
      if (error) throw error;
      
      setSchedule(data);
    } catch (error) {
      console.error('Error loading schedule:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleComplete = async (itemId: string, currentStatus: boolean) => {
    try {
      const { error } = await markScheduleItemComplete(itemId, !currentStatus);
      
      if (error) throw error;
      
      // UI'ı güncelle
      setSchedule((prev: any) => {
        if (!prev) return prev;
        
        return {
          ...prev,
          study_schedule_items: prev.study_schedule_items.map((item: any) =>
            item.id === itemId
              ? { ...item, is_completed: !currentStatus, completed_at: !currentStatus ? new Date().toISOString() : null }
              : item
          )
        };
      });
    } catch (error) {
      console.error('Error toggling complete:', error);
      alert('Durum güncellenirken hata oluştu');
    }
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600 dark:text-gray-400">Yükleniyor...</span>
        </div>
      </div>
    );
  }

  if (!schedule) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Henüz Program Yok
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Öğretmeniniz bu hafta için henüz bir çalışma programı yayınlamadı.
          </p>
        </div>
      </div>
    );
  }

  // Items'ları güne göre grupla
  const itemsByDay = DAYS_OF_WEEK.map(day => ({
    day,
    items: schedule.study_schedule_items
      .filter((item: any) => item.day_of_week === day.value)
      .sort((a: any, b: any) => a.start_time.localeCompare(b.start_time))
  }));

  const selectedDayData = itemsByDay.find(d => d.day.value === selectedDay);
  const totalItems = schedule.study_schedule_items?.length || 0;
  const completedItems = schedule.study_schedule_items?.filter((item: any) => item.is_completed).length || 0;
  const completionRate = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center space-x-2 mb-2">
              <Calendar className="w-6 h-6" />
              <h2 className="text-2xl font-bold">Haftalık Çalışma Programım</h2>
            </div>
            <p className="text-blue-100 text-sm">
              {new Date(schedule.week_start_date).toLocaleDateString('tr-TR')} - {' '}
              {new Date(schedule.week_end_date).toLocaleDateString('tr-TR')}
            </p>
          </div>
          
          {/* Progress Circle */}
          <div className="flex flex-col items-center">
            <div className="relative w-20 h-20">
              <svg className="transform -rotate-90 w-20 h-20">
                <circle
                  cx="40"
                  cy="40"
                  r="36"
                  stroke="currentColor"
                  strokeWidth="6"
                  fill="transparent"
                  className="text-white/30"
                />
                <circle
                  cx="40"
                  cy="40"
                  r="36"
                  stroke="currentColor"
                  strokeWidth="6"
                  fill="transparent"
                  strokeDasharray={`${2 * Math.PI * 36}`}
                  strokeDashoffset={`${2 * Math.PI * 36 * (1 - completionRate / 100)}`}
                  className="text-white transition-all duration-500"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xl font-bold">{completionRate}%</span>
              </div>
            </div>
            <span className="text-xs text-blue-100 mt-1">Tamamlandı</span>
          </div>
        </div>

        {/* Teacher Info */}
        <div className="bg-white/20 backdrop-blur-sm rounded-lg p-3 flex items-center space-x-3">
          <User className="w-5 h-5" />
          <div>
            <p className="text-sm opacity-90">Öğretmen</p>
            <p className="font-semibold">{schedule.teacher?.full_name || 'Bilinmiyor'}</p>
          </div>
        </div>

        {schedule.description && (
          <div className="mt-3 bg-white/10 backdrop-blur-sm rounded-lg p-3">
            <p className="text-sm">{schedule.description}</p>
          </div>
        )}
      </div>

      {/* Day Selector */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4">
        <div className="grid grid-cols-7 gap-2">
          {DAYS_OF_WEEK.map(day => {
            const dayItems = itemsByDay.find(d => d.day.value === day.value)?.items || [];
            const dayCompleted = dayItems.filter((item: any) => item.is_completed).length;
            const dayTotal = dayItems.length;
            const isToday = day.value === (new Date().getDay() === 0 ? 6 : new Date().getDay() - 1);

            return (
              <button
                key={day.value}
                onClick={() => setSelectedDay(day.value)}
                className={`p-3 rounded-lg transition-all ${
                  selectedDay === day.value
                    ? 'bg-blue-600 text-white shadow-lg scale-105'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                <div className="text-xs font-semibold mb-1">
                  {day.short}
                </div>
                <div className="text-lg font-bold">
                  {dayTotal}
                </div>
                {isToday && (
                  <div className="mt-1 w-1.5 h-1.5 bg-yellow-400 rounded-full mx-auto"></div>
                )}
                {dayTotal > 0 && (
                  <div className="mt-1 text-xs opacity-75">
                    {dayCompleted}/{dayTotal}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Day Schedule */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 px-6 py-4 text-white">
          <h3 className="text-xl font-bold">
            {selectedDayData?.day.label}
          </h3>
          <p className="text-sm text-blue-100">
            {selectedDayData?.items.length || 0} ders planlandı
          </p>
        </div>

        <div className="p-6">
          {!selectedDayData?.items.length ? (
            <div className="text-center py-12">
              <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600 dark:text-gray-400">
                Bu gün için ders planlanmamış
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {selectedDayData.items.map((item: any) => (
                <div
                  key={item.id}
                  className={`border-l-4 rounded-lg p-4 transition-all ${
                    item.is_completed
                      ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                      : 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 hover:shadow-md'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      {/* Time & Subject */}
                      <div className="flex items-center space-x-3 mb-2">
                        <div className="flex items-center space-x-2 text-sm font-medium text-gray-600 dark:text-gray-400">
                          <Clock className="w-4 h-4" />
                          <span>{item.start_time} - {item.end_time}</span>
                        </div>
                        <div className="flex-1">
                          <span className="font-bold text-lg text-gray-900 dark:text-white">
                            {item.subject}
                          </span>
                        </div>
                      </div>

                      {/* Topic */}
                      {item.topic && (
                        <div className="flex items-start space-x-2 mb-2">
                          <BookOpen className="w-4 h-4 text-purple-600 mt-0.5 flex-shrink-0" />
                          <p className="text-sm text-gray-700 dark:text-gray-300 font-medium">
                            {item.topic}
                          </p>
                        </div>
                      )}

                      {/* Goal */}
                      {item.goal && (
                        <div className="flex items-start space-x-2 mb-2">
                          <Target className="w-4 h-4 text-orange-600 mt-0.5 flex-shrink-0" />
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {item.goal}
                          </p>
                        </div>
                      )}

                      {/* Description */}
                      {item.description && expandedItem === item.id && (
                        <div className="mt-3 p-3 bg-white dark:bg-gray-700 rounded-lg">
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {item.description}
                          </p>
                        </div>
                      )}

                      {/* Resources */}
                      {item.resources && expandedItem === item.id && (
                        <div className="mt-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            <span className="font-semibold">📚 Kaynaklar:</span> {item.resources}
                          </p>
                        </div>
                      )}

                      {/* Expand Button */}
                      {(item.description || item.resources) && (
                        <button
                          onClick={() => setExpandedItem(expandedItem === item.id ? null : item.id)}
                          className="mt-2 text-xs text-blue-600 hover:text-blue-700 font-medium"
                        >
                          {expandedItem === item.id ? '▲ Daha Az' : '▼ Detayları Gör'}
                        </button>
                      )}
                    </div>

                    {/* Complete Checkbox */}
                    <button
                      onClick={() => handleToggleComplete(item.id, item.is_completed)}
                      className={`flex-shrink-0 ml-4 w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                        item.is_completed
                          ? 'bg-green-500 text-white'
                          : 'border-2 border-gray-300 dark:border-gray-600 text-gray-400 hover:border-green-500 hover:text-green-500'
                      }`}
                    >
                      {item.is_completed && <CheckCircle className="w-5 h-5" />}
                    </button>
                  </div>

                  {/* Completion Time */}
                  {item.is_completed && item.completed_at && (
                    <div className="mt-2 text-xs text-green-600 dark:text-green-400">
                      ✓ Tamamlandı: {new Date(item.completed_at).toLocaleString('tr-TR')}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Weekly Summary */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
          Haftalık Özet
        </h3>
        
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <div className="text-3xl font-bold text-blue-600 mb-1">
              {totalItems}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Toplam Ders
            </div>
          </div>

          <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <div className="text-3xl font-bold text-green-600 mb-1">
              {completedItems}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Tamamlanan
            </div>
          </div>

          <div className="text-center p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
            <div className="text-3xl font-bold text-orange-600 mb-1">
              {totalItems - completedItems}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Kalan
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Haftalık İlerleme
            </span>
            <span className="text-sm font-bold text-blue-600">
              {completionRate}%
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
            <div
              className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full transition-all duration-500"
              style={{ width: `${completionRate}%` }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
}