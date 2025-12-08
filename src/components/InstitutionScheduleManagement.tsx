import { useState, useEffect } from 'react';
import { Calendar, Plus, Edit2, Trash2, Save, X, Clock, MapPin, Users, BookOpen, AlertCircle, Download, Filter } from 'lucide-react';
import { supabase } from '../lib/supabase';
import {
  getInstitutionScheduleEntries,
  createScheduleEntry,
  updateScheduleEntry,
  deleteScheduleEntry,
  getInstitutionClasses,
  createInstitutionClass,
  getDayName,
  formatTime,
  checkScheduleConflict,
  getTimeSlots,
  getSubjectColors,
  type ScheduleEntry,
  type InstitutionClass
} from '../lib/institutionScheduleApi';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface InstitutionScheduleManagementProps {
  institutionId: string;
  teachers?: any[]; // Optional - will fetch if not provided
}

export default function InstitutionScheduleManagement({ institutionId, teachers: teachersProp }: InstitutionScheduleManagementProps) {
  const [scheduleEntries, setScheduleEntries] = useState<ScheduleEntry[]>([]);
  const [classes, setClasses] = useState<InstitutionClass[]>([]);
  const [teachers, setTeachers] = useState<any[]>(teachersProp || []);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>('all');

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showClassModal, setShowClassModal] = useState(false);
  const [editingEntry, setEditingEntry] = useState<ScheduleEntry | null>(null);

  const [formData, setFormData] = useState<Partial<ScheduleEntry>>({
    class_name: '',
    subject: '',
    teacher_id: '',
    classroom: '',
    day_of_week: 1,
    start_time: '08:00',
    end_time: '08:40',
    notes: '',
    color: '#3B82F6'
  });

  const [classFormData, setClassFormData] = useState<Partial<InstitutionClass>>({
    class_name: '',
    class_description: '',
    grade_level: '',
    branch: ''
  });

  useEffect(() => {
    loadData();
  }, [institutionId]);

  useEffect(() => {
    if (!teachersProp) {
      loadTeachers();
    }
  }, [institutionId, teachersProp]);

  const loadTeachers = async () => {
    try {
      const { data, error } = await supabase
        .from('institution_members')
        .select('user_id, profiles(id, full_name)')
        .eq('institution_id', institutionId)
        .eq('role', 'teacher');

      if (error) throw error;

      const teacherList = data?.map(member => ({
        id: member.profiles?.id,
        full_name: member.profiles?.full_name || 'İsimsiz Öğretmen'
      })).filter(t => t.id) || [];

      setTeachers(teacherList);
    } catch (err) {
      console.error('Error loading teachers:', err);
    }
  };

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [entriesData, classesData] = await Promise.all([
        getInstitutionScheduleEntries(institutionId),
        getInstitutionClasses(institutionId)
      ]);
      setScheduleEntries(entriesData);
      setClasses(classesData);
    } catch (err: any) {
      setError(err.message);
      console.error('Error loading schedule data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddEntry = async () => {
    try {
      // Çakışma kontrolü
      if (checkScheduleConflict(scheduleEntries, formData as any)) {
        alert('Bu zaman diliminde çakışan bir ders var!');
        return;
      }

      await createScheduleEntry({
        ...formData,
        institution_id: institutionId
      } as any);

      await loadData();
      setShowAddModal(false);
      resetForm();
    } catch (err: any) {
      alert('Ders eklenirken hata: ' + err.message);
    }
  };

  const handleUpdateEntry = async () => {
    if (!editingEntry?.id) return;

    try {
      // Çakışma kontrolü (kendisi hariç)
      if (checkScheduleConflict(scheduleEntries, formData as any, editingEntry.id)) {
        alert('Bu zaman diliminde çakışan bir ders var!');
        return;
      }

      await updateScheduleEntry(editingEntry.id, formData);
      await loadData();
      setShowEditModal(false);
      setEditingEntry(null);
      resetForm();
    } catch (err: any) {
      alert('Ders güncellenirken hata: ' + err.message);
    }
  };

  const handleDeleteEntry = async (id: string) => {
    if (!confirm('Bu dersi silmek istediğinize emin misiniz?')) return;

    try {
      await deleteScheduleEntry(id);
      await loadData();
    } catch (err: any) {
      alert('Ders silinirken hata: ' + err.message);
    }
  };

  const handleAddClass = async () => {
    try {
      await createInstitutionClass({
        ...classFormData,
        institution_id: institutionId
      } as any);

      await loadData();
      setShowClassModal(false);
      setClassFormData({ class_name: '', class_description: '', grade_level: '', branch: '' });
    } catch (err: any) {
      alert('Sınıf eklenirken hata: ' + err.message);
    }
  };

  const openEditModal = (entry: ScheduleEntry) => {
    setEditingEntry(entry);
    setFormData({
      class_name: entry.class_name,
      subject: entry.subject,
      teacher_id: entry.teacher_id || '',
      classroom: entry.classroom || '',
      day_of_week: entry.day_of_week,
      start_time: formatTime(entry.start_time),
      end_time: formatTime(entry.end_time),
      notes: entry.notes || '',
      color: entry.color || '#3B82F6'
    });
    setShowEditModal(true);
  };

  const resetForm = () => {
    setFormData({
      class_name: '',
      subject: '',
      teacher_id: '',
      classroom: '',
      day_of_week: 1,
      start_time: '08:00',
      end_time: '08:40',
      notes: '',
      color: '#3B82F6'
    });
  };

  const exportScheduleToPDF = () => {
    const doc = new jsPDF('l', 'mm', 'a4'); // Landscape orientation
    const filteredEntries = selectedClassFilter === 'all'
      ? scheduleEntries
      : scheduleEntries.filter(e => e.class_name === selectedClassFilter);

    // Turkish character support - use default fonts
    doc.setFont('helvetica');

    // Title
    const title = selectedClassFilter === 'all'
      ? 'Haftalik Ders Programi - Tum Siniflar'
      : `Haftalik Ders Programi - ${selectedClassFilter}`;
    doc.setFontSize(16);
    doc.text(title, 148, 15, { align: 'center' });

    // Prepare table data
    const timeSlots = getTimeSlots();
    const days = [1, 2, 3, 4, 5, 6, 7];
    const dayNames = days.map(d => getDayName(d));

    const tableData = timeSlots.map(slot => {
      const row = [slot];
      days.forEach(day => {
        const dayEntries = filteredEntries
          .filter(e => e.day_of_week === day && e.start_time.startsWith(slot.substring(0, 2)))
          .map(e => {
            const teacher = teachers.find(t => t.id === e.teacher_id);
            return `${e.subject}\n${e.class_name}\n${teacher?.full_name || ''}\n${e.classroom || ''}`;
          });
        row.push(dayEntries.join('\n---\n') || '-');
      });
      return row;
    });

    autoTable(doc, {
      head: [['Saat', ...dayNames]],
      body: tableData,
      startY: 25,
      styles: {
        fontSize: 8,
        cellPadding: 2,
        overflow: 'linebreak',
        halign: 'center',
        valign: 'middle'
      },
      headStyles: {
        fillColor: [79, 70, 229],
        textColor: 255,
        fontSize: 9,
        fontStyle: 'bold'
      },
      columnStyles: {
        0: { cellWidth: 20, fontStyle: 'bold' }
      }
    });

    const filename = selectedClassFilter === 'all'
      ? 'ders-programi-tum-siniflar.pdf'
      : `ders-programi-${selectedClassFilter.replace(/\s+/g, '-').toLowerCase()}.pdf`;
    doc.save(filename);
  };

  const getScheduleGrid = () => {
    const grid: Record<number, ScheduleEntry[]> = {
      1: [], 2: [], 3: [], 4: [], 5: [], 6: [], 7: []
    };

    const filteredEntries = selectedClassFilter === 'all'
      ? scheduleEntries
      : scheduleEntries.filter(e => e.class_name === selectedClassFilter);

    filteredEntries.forEach(entry => {
      grid[entry.day_of_week].push(entry);
    });

    // Sort by start_time
    Object.keys(grid).forEach(day => {
      grid[parseInt(day)].sort((a, b) => a.start_time.localeCompare(b.start_time));
    });

    return grid;
  };

  const subjectColors = getSubjectColors();
  const timeSlots = getTimeSlots();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Ders programı yükleniyor...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 rounded-lg p-6 border border-red-200">
        <div className="flex items-center gap-2 text-red-800">
          <AlertCircle className="h-5 w-5" />
          <span>Hata: {error}</span>
        </div>
      </div>
    );
  }

  const scheduleGrid = getScheduleGrid();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Ders Programı Yönetimi</h2>
            <p className="text-gray-600">Kurum genel ders programını yönetin</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowClassModal(true)}
              className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
            >
              <Users className="h-4 w-4" />
              Sınıf Ekle
            </button>
            <button
              onClick={() => {
                resetForm();
                setShowAddModal(true);
              }}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              <Plus className="h-4 w-4" />
              Ders Ekle
            </button>
          </div>
        </div>

        {/* Filters and Actions */}
        <div className="flex items-center justify-between bg-white rounded-lg p-4 border border-gray-200">
          <div className="flex items-center gap-3">
            <Filter className="h-5 w-5 text-gray-500" />
            <select
              value={selectedClassFilter}
              onChange={(e) => setSelectedClassFilter(e.target.value)}
              className="px-4 py-2 rounded-lg border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">Tüm Sınıflar</option>
              {classes.map((cls) => (
                <option key={cls.id} value={cls.class_name}>
                  {cls.class_name}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={exportScheduleToPDF}
            className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
          >
            <Download className="h-4 w-4" />
            PDF İndir
          </button>
        </div>
      </div>

      {/* Classes Summary */}
      <div className="bg-white rounded-lg p-4 border border-gray-200">
        <h3 className="font-semibold text-gray-900 mb-3">Sınıflar ({classes.length})</h3>
        <div className="flex flex-wrap gap-2">
          {classes.map(cls => (
            <div
              key={cls.id}
              className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium border border-blue-200"
            >
              {cls.class_name}
              {cls.grade_level && ` • ${cls.grade_level}`}
              {cls.branch && ` • ${cls.branch}`}
            </div>
          ))}
          {classes.length === 0 && (
            <p className="text-gray-500 text-sm">Henüz sınıf eklenmemiş. "Sınıf Ekle" butonuna tıklayın.</p>
          )}
        </div>
      </div>

      {/* Weekly Schedule Grid */}
      <div className="bg-white rounded-lg p-6 border border-gray-200 overflow-x-auto">
        <div className="grid grid-cols-8 gap-2 min-w-[1200px]">
          {/* Header */}
          <div className="font-semibold text-gray-700 p-2">Saat</div>
          {[1, 2, 3, 4, 5, 6, 7].map(day => (
            <div key={day} className="font-semibold text-gray-700 p-2 text-center">
              {getDayName(day)}
            </div>
          ))}

          {/* Time slots */}
          {timeSlots.map(slot => (
            <>
              <div key={`slot-${slot}`} className="text-sm text-gray-600 p-2 border-t">
                {slot}
              </div>
              {[1, 2, 3, 4, 5, 6, 7].map(day => (
                <div key={`${day}-${slot}`} className="border-t p-1">
                  {scheduleGrid[day]
                    .filter(entry => entry.start_time.startsWith(slot.substring(0, 2)))
                    .map(entry => {
                      const teacher = teachers.find(t => t.id === entry.teacher_id);
                      return (
                        <div
                          key={entry.id}
                          className="mb-1 p-2 rounded text-white text-xs cursor-pointer hover:opacity-90 transition-opacity"
                          style={{ backgroundColor: entry.color || subjectColors[entry.subject] || subjectColors.Default }}
                          onClick={() => openEditModal(entry)}
                        >
                          <div className="font-semibold">{entry.subject}</div>
                          <div className="text-xs opacity-90">{entry.class_name}</div>
                          {teacher && <div className="text-xs opacity-80">{teacher.full_name}</div>}
                          {entry.classroom && <div className="text-xs opacity-80">📍 {entry.classroom}</div>}
                          <div className="text-xs opacity-80">
                            {formatTime(entry.start_time)} - {formatTime(entry.end_time)}
                          </div>
                        </div>
                      );
                    })}
                </div>
              ))}
            </>
          ))}
        </div>
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">Yeni Ders Ekle</h3>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sınıf</label>
                <select
                  value={formData.class_name}
                  onChange={e => setFormData({ ...formData, class_name: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                >
                  <option value="">Sınıf seçin</option>
                  {classes.map(cls => (
                    <option key={cls.id} value={cls.class_name}>{cls.class_name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ders</label>
                <input
                  type="text"
                  value={formData.subject}
                  onChange={e => setFormData({ ...formData, subject: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  placeholder="Matematik, Fizik, Türkçe vs"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Öğretmen</label>
                <select
                  value={formData.teacher_id}
                  onChange={e => setFormData({ ...formData, teacher_id: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                >
                  <option value="">Öğretmen seçin (opsiyonel)</option>
                  {teachers.map(teacher => (
                    <option key={teacher.id} value={teacher.id}>{teacher.full_name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Derslik</label>
                <input
                  type="text"
                  value={formData.classroom}
                  onChange={e => setFormData({ ...formData, classroom: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  placeholder="A-101, B-205, Lab-1 vs"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Gün</label>
                  <select
                    value={formData.day_of_week}
                    onChange={e => setFormData({ ...formData, day_of_week: parseInt(e.target.value) })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  >
                    {[1, 2, 3, 4, 5, 6, 7].map(day => (
                      <option key={day} value={day}>{getDayName(day)}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Renk</label>
                  <input
                    type="color"
                    value={formData.color}
                    onChange={e => setFormData({ ...formData, color: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 h-10"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Başlangıç</label>
                  <input
                    type="time"
                    value={formData.start_time}
                    onChange={e => setFormData({ ...formData, start_time: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bitiş</label>
                  <input
                    type="time"
                    value={formData.end_time}
                    onChange={e => setFormData({ ...formData, end_time: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notlar</label>
                <textarea
                  value={formData.notes}
                  onChange={e => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  rows={2}
                  placeholder="Ek notlar (opsiyonel)"
                />
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <button
                onClick={handleAddEntry}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
              >
                <Save className="h-4 w-4" />
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

      {/* Edit Modal (aynı formData ile) */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">Dersi Düzenle</h3>
              <button onClick={() => setShowEditModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Aynı form alanları... (tekrar etmemek için kısaltıldı) */}
            <div className="space-y-4">
              {/* ... aynı form alanları ... */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sınıf</label>
                <select value={formData.class_name} onChange={e => setFormData({ ...formData, class_name: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2">
                  <option value="">Sınıf seçin</option>
                  {classes.map(cls => <option key={cls.id} value={cls.class_name}>{cls.class_name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ders</label>
                <input type="text" value={formData.subject} onChange={e => setFormData({ ...formData, subject: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Öğretmen</label>
                <select value={formData.teacher_id} onChange={e => setFormData({ ...formData, teacher_id: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2">
                  <option value="">Öğretmen seçin</option>
                  {teachers.map(teacher => <option key={teacher.id} value={teacher.id}>{teacher.full_name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Derslik</label>
                <input type="text" value={formData.classroom} onChange={e => setFormData({ ...formData, classroom: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Gün</label>
                  <select value={formData.day_of_week} onChange={e => setFormData({ ...formData, day_of_week: parseInt(e.target.value) })} className="w-full border border-gray-300 rounded-lg px-3 py-2">
                    {[1, 2, 3, 4, 5, 6, 7].map(day => <option key={day} value={day}>{getDayName(day)}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Renk</label>
                  <input type="color" value={formData.color} onChange={e => setFormData({ ...formData, color: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 h-10" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Başlangıç</label>
                  <input type="time" value={formData.start_time} onChange={e => setFormData({ ...formData, start_time: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bitiş</label>
                  <input type="time" value={formData.end_time} onChange={e => setFormData({ ...formData, end_time: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2" />
                </div>
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <button onClick={handleUpdateEntry} className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2">
                <Save className="h-4 w-4" />
                Güncelle
              </button>
              <button onClick={() => handleDeleteEntry(editingEntry?.id!)} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
                <Trash2 className="h-4 w-4" />
              </button>
              <button onClick={() => setShowEditModal(false)} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                İptal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Class Add Modal */}
      {showClassModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">Yeni Sınıf Ekle</h3>
              <button onClick={() => setShowClassModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sınıf Adı *</label>
                <input
                  type="text"
                  value={classFormData.class_name}
                  onChange={e => setClassFormData({ ...classFormData, class_name: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  placeholder="12-A, 12-Say-1, Mezun vs"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Açıklama</label>
                <input
                  type="text"
                  value={classFormData.class_description}
                  onChange={e => setClassFormData({ ...classFormData, class_description: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  placeholder="Sayısal 12. Sınıf, TYT Mezun Grubu vs"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Seviye</label>
                  <input
                    type="text"
                    value={classFormData.grade_level}
                    onChange={e => setClassFormData({ ...classFormData, grade_level: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    placeholder="12, 11, Mezun vs"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Dal</label>
                  <input
                    type="text"
                    value={classFormData.branch}
                    onChange={e => setClassFormData({ ...classFormData, branch: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    placeholder="Sayısal, Sözel, EA vs"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <button
                onClick={handleAddClass}
                className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
              >
                Sınıf Ekle
              </button>
              <button
                onClick={() => setShowClassModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                İptal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
