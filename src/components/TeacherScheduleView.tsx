import { useState, useEffect } from 'react';
import { Clock, MapPin, Plus, Trash2, X, Save } from 'lucide-react';
import {
  getTeacherWeeklySchedule,
  getTeacherPersonalSchedules,
  createTeacherPersonalSchedule,
  updateTeacherPersonalSchedule,
  deleteTeacherPersonalSchedule,
  getDayName,
  formatTime,
  checkScheduleConflict,
  type FullScheduleEntry,
  type TeacherPersonalSchedule
} from '../lib/institutionScheduleApi';

interface TeacherScheduleViewProps {
  teacherId: string;
  institutionId: string;
}

export default function TeacherScheduleView({ teacherId, institutionId }: TeacherScheduleViewProps) {
  const [fullSchedule, setFullSchedule] = useState<FullScheduleEntry[]>([]);
  const [personalSchedules, setPersonalSchedules] = useState<TeacherPersonalSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<TeacherPersonalSchedule | null>(null);

  const [formData, setFormData] = useState<Partial<TeacherPersonalSchedule>>({
    title: '',
    description: '',
    day_of_week: 1,
    start_time: '08:00',
    end_time: '09:00',
    location: '',
    category: 'personal',
    color: '#10B981'
  });

  useEffect(() => {
    loadSchedules();
  }, [teacherId, institutionId]);

  const loadSchedules = async () => {
    setLoading(true);
    try {
      const [fullData, personalData] = await Promise.all([
        getTeacherWeeklySchedule(teacherId, institutionId),
        getTeacherPersonalSchedules(teacherId, institutionId)
      ]);
      setFullSchedule(fullData);
      setPersonalSchedules(personalData);
    } catch (err) {
      console.error('Error loading schedules:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    try {
      const conflictPayload = {
        day_of_week: formData.day_of_week ?? 1,
        start_time: formData.start_time ?? '08:00',
        end_time: formData.end_time ?? '09:00',
        teacher_id: teacherId
      };

      if (checkScheduleConflict(fullSchedule, conflictPayload)) {
        alert('Bu zaman diliminde çakışan bir etkinlik var!');
        return;
      }

      await createTeacherPersonalSchedule({
        ...formData,
        teacher_id: teacherId,
        institution_id: institutionId
      } as any);

      await loadSchedules();
      setShowAddModal(false);
      resetForm();
    } catch (err: any) {
      alert('Etkinlik eklenirken hata: ' + err.message);
    }
  };

  const handleUpdate = async () => {
    if (!editingSchedule?.id) return;

    try {
      await updateTeacherPersonalSchedule(editingSchedule.id, formData);
      await loadSchedules();
      setShowEditModal(false);
      setEditingSchedule(null);
      resetForm();
    } catch (err: any) {
      alert('Etkinlik güncellenirken hata: ' + err.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bu etkinliği silmek istediğinize emin misiniz?')) return;

    try {
      await deleteTeacherPersonalSchedule(id);
      await loadSchedules();
    } catch (err: any) {
      alert('Etkinlik silinirken hata: ' + err.message);
    }
  };

  const openEditModal = (schedule: TeacherPersonalSchedule) => {
    setEditingSchedule(schedule);
    setFormData({
      title: schedule.title,
      description: schedule.description,
      day_of_week: schedule.day_of_week,
      start_time: formatTime(schedule.start_time),
      end_time: formatTime(schedule.end_time),
      location: schedule.location,
      category: schedule.category,
      color: schedule.color
    });
    setShowEditModal(true);
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      day_of_week: 1,
      start_time: '08:00',
      end_time: '09:00',
      location: '',
      category: 'personal',
      color: '#10B981'
    });
  };

  const getScheduleByDay = () => {
    const byDay: Record<number, FullScheduleEntry[]> = {
      1: [], 2: [], 3: [], 4: [], 5: [], 6: [], 7: []
    };

    fullSchedule.forEach(entry => {
      byDay[entry.day_of_week].push(entry);
    });

    return byDay;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const scheduleByDay = getScheduleByDay();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Haftalık Ders Programım</h2>
          <p className="text-gray-600">Dersleriniz ve kişisel programınız</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowAddModal(true);
          }}
          className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
        >
          <Plus className="h-4 w-4" />
          Kişisel Etkinlik Ekle
        </button>
      </div>

      {/* Weekly Grid */}
      <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
        {[1, 2, 3, 4, 5, 6, 7].map(day => (
          <div key={day} className="bg-white rounded-lg border border-gray-200 p-4">
            <h3 className="font-semibold text-gray-900 mb-3 text-center">{getDayName(day)}</h3>
            <div className="space-y-2">
              {scheduleByDay[day].map(entry => (
                <div
                  key={entry.id}
                  className="p-3 rounded-lg text-white text-sm cursor-pointer hover:opacity-90"
                  style={{ backgroundColor: entry.color }}
                  onClick={() => {
                    if (entry.type === 'teacher_personal') {
                      const personalEntry = personalSchedules.find(ps => ps.id === entry.id);
                      if (personalEntry) openEditModal(personalEntry);
                    }
                  }}
                >
                  <div className="font-semibold">{entry.title}</div>
                  {entry.class_name && <div className="text-xs opacity-90">{entry.class_name}</div>}
                  {entry.classroom && (
                    <div className="text-xs opacity-80 flex items-center gap-1 mt-1">
                      <MapPin className="h-3 w-3" />
                      {entry.classroom}
                    </div>
                  )}
                  <div className="text-xs opacity-80 flex items-center gap-1 mt-1">
                    <Clock className="h-3 w-3" />
                    {formatTime(entry.start_time)} - {formatTime(entry.end_time)}
                  </div>
                  {entry.type === 'teacher_personal' && (
                    <div className="text-xs opacity-70 mt-1 italic">Kişisel</div>
                  )}
                </div>
              ))}
              {scheduleByDay[day].length === 0 && (
                <p className="text-gray-400 text-xs text-center py-4">Boş gün</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">Kişisel Etkinlik Ekle</h3>
              <button onClick={() => setShowAddModal(false)}>
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Başlık *</label>
                <input
                  type="text"
                  value={formData.title ?? ''}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  placeholder="Ders Hazırlığı, Toplantı vs"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Açıklama</label>
                <textarea
                  value={formData.description ?? ''}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Kategori</label>
                  <select
                    value={formData.category ?? 'personal'}
                    onChange={e => setFormData({ ...formData, category: e.target.value as any })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  >
                    <option value="personal">Kişisel</option>
                    <option value="meeting">Toplantı</option>
                    <option value="preparation">Hazırlık</option>
                    <option value="tutoring">Özel Ders</option>
                    <option value="other">Diğer</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Gün</label>
                  <select
                    value={formData.day_of_week ?? 1}
                    onChange={e => setFormData({ ...formData, day_of_week: parseInt(e.target.value) })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  >
                    {[1, 2, 3, 4, 5, 6, 7].map(day => (
                      <option key={day} value={day}>{getDayName(day)}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Konum</label>
                <input
                  type="text"
                  value={formData.location ?? ''}
                  onChange={e => setFormData({ ...formData, location: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  placeholder="Öğretmenler Odası, Müdür Odası vs"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Başlangıç</label>
                  <input
                    type="time"
                    value={formData.start_time ?? '08:00'}
                    onChange={e => setFormData({ ...formData, start_time: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bitiş</label>
                  <input
                    type="time"
                    value={formData.end_time ?? '09:00'}
                    onChange={e => setFormData({ ...formData, end_time: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Renk</label>
                <input
                  type="color"
                  value={formData.color ?? '#10B981'}
                  onChange={e => setFormData({ ...formData, color: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 h-10"
                />
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <button
                onClick={handleAdd}
                className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
              >
                <Save className="h-4 w-4 inline mr-2" />
                Kaydet
              </button>
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                İptal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal - similar structure */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">Etkinliği Düzenle</h3>
              <button onClick={() => setShowEditModal(false)}>
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Same form fields as add modal */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Başlık *</label>
                <input type="text" value={formData.title ?? ''} onChange={e => setFormData({ ...formData, title: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Açıklama</label>
                <textarea value={formData.description ?? ''} onChange={e => setFormData({ ...formData, description: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2" rows={2} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Kategori</label>
                  <select value={formData.category ?? 'personal'} onChange={e => setFormData({ ...formData, category: e.target.value as any })} className="w-full border border-gray-300 rounded-lg px-3 py-2">
                    <option value="personal">Kişisel</option>
                    <option value="meeting">Toplantı</option>
                    <option value="preparation">Hazırlık</option>
                    <option value="tutoring">Özel Ders</option>
                    <option value="other">Diğer</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Gün</label>
                  <select value={formData.day_of_week ?? 1} onChange={e => setFormData({ ...formData, day_of_week: parseInt(e.target.value) })} className="w-full border border-gray-300 rounded-lg px-3 py-2">
                    {[1, 2, 3, 4, 5, 6, 7].map(day => <option key={day} value={day}>{getDayName(day)}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Konum</label>
                <input type="text" value={formData.location ?? ''} onChange={e => setFormData({ ...formData, location: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Başlangıç</label>
                  <input type="time" value={formData.start_time ?? '08:00'} onChange={e => setFormData({ ...formData, start_time: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bitiş</label>
                  <input type="time" value={formData.end_time ?? '09:00'} onChange={e => setFormData({ ...formData, end_time: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Renk</label>
                <input type="color" value={formData.color ?? '#10B981'} onChange={e => setFormData({ ...formData, color: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 h-10" />
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <button onClick={handleUpdate} className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                Güncelle
              </button>
              <button onClick={() => editingSchedule?.id && handleDelete(editingSchedule.id)} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
                <Trash2 className="h-4 w-4" />
              </button>
              <button onClick={() => setShowEditModal(false)} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                İptal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
