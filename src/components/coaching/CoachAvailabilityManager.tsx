import { useState, useEffect } from 'react';
import { Clock, Plus, Trash2, Save, Calendar } from 'lucide-react';
import {
  getCoachAvailability,
  saveCoachAvailability,
  deleteCoachAvailability,
  type CoachAvailability,
  DAY_NAMES,
} from '../../lib/coachingApi';

interface CoachAvailabilityManagerProps {
  coachId: string;
}

interface AvailabilitySlot {
  id?: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_available: boolean;
}

export default function CoachAvailabilityManager({ coachId }: CoachAvailabilityManagerProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [availability, setAvailability] = useState<CoachAvailability[]>([]);
  const [editingSlots, setEditingSlots] = useState<AvailabilitySlot[]>([]);

  useEffect(() => {
    loadAvailability();
  }, [coachId]);

  const loadAvailability = async () => {
    try {
      setLoading(true);
      const data = await getCoachAvailability(coachId);
      setAvailability(data);
      setEditingSlots(
        data.map((av) => ({
          id: av.id,
          day_of_week: av.day_of_week,
          start_time: av.start_time,
          end_time: av.end_time,
          is_available: av.is_available,
        }))
      );
    } catch (error) {
      console.error('Error loading availability:', error);
      alert('Müsaitlik bilgileri yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleAddSlot = () => {
    setEditingSlots([
      ...editingSlots,
      {
        day_of_week: 1, // Monday
        start_time: '09:00',
        end_time: '17:00',
        is_available: true,
      },
    ]);
  };

  const handleRemoveSlot = (index: number) => {
    setEditingSlots(editingSlots.filter((_, i) => i !== index));
  };

  const handleUpdateSlot = (index: number, field: keyof AvailabilitySlot, value: any) => {
    const updated = [...editingSlots];
    updated[index] = { ...updated[index], [field]: value };
    setEditingSlots(updated);
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      // Validate slots
      for (const slot of editingSlots) {
        if (slot.start_time >= slot.end_time) {
          alert('Bitiş saati başlangıç saatinden sonra olmalıdır');
          return;
        }
      }

      // Delete old availability slots
      for (const av of availability) {
        await deleteCoachAvailability(av.id);
      }

      // Save new slots
      for (const slot of editingSlots) {
        await saveCoachAvailability(coachId, {
          day_of_week: slot.day_of_week,
          start_time: slot.start_time,
          end_time: slot.end_time,
          is_available: slot.is_available,
        });
      }

      alert('✅ Müsaitlik bilgileriniz kaydedildi!');
      await loadAvailability();
    } catch (error) {
      console.error('Error saving availability:', error);
      alert('Müsaitlik bilgileri kaydedilirken bir hata oluştu');
    } finally {
      setSaving(false);
    }
  };

  // Group slots by day
  const slotsByDay = editingSlots.reduce((acc, slot, index) => {
    if (!acc[slot.day_of_week]) {
      acc[slot.day_of_week] = [];
    }
    acc[slot.day_of_week].push({ ...slot, originalIndex: index });
    return acc;
  }, {} as Record<number, (AvailabilitySlot & { originalIndex: number })[]>);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Calendar className="h-6 w-6 text-indigo-600" />
            Müsaitlik Takvimi
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            Öğrencilerinizin randevu alabilmesi için çalışabileceğiniz saatleri belirleyin
          </p>
        </div>
        <button
          onClick={handleAddSlot}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <Plus className="h-5 w-5" />
          Saat Ekle
        </button>
      </div>

      {editingSlots.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
          <Clock className="mx-auto h-16 w-16 text-gray-400 mb-4" />
          <p className="text-gray-500 mb-4">Henüz müsait saatiniz bulunmuyor</p>
          <button
            onClick={handleAddSlot}
            className="text-indigo-600 hover:text-indigo-700 font-medium"
          >
            İlk müsaitlik slotunu ekleyin
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Group by day */}
          {Object.keys(slotsByDay)
            .map(Number)
            .sort((a, b) => a - b)
            .map((dayOfWeek) => (
              <div key={dayOfWeek} className="border-2 border-gray-200 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-3">{DAY_NAMES[dayOfWeek]}</h4>
                <div className="space-y-3">
                  {slotsByDay[dayOfWeek].map((slot) => (
                    <div
                      key={slot.originalIndex}
                      className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg"
                    >
                      <div className="flex-1 grid grid-cols-3 gap-3">
                        <div>
                          <label className="text-xs text-gray-600 mb-1 block">Gün</label>
                          <select
                            value={slot.day_of_week}
                            onChange={(e) =>
                              handleUpdateSlot(
                                slot.originalIndex,
                                'day_of_week',
                                parseInt(e.target.value)
                              )
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                          >
                            {DAY_NAMES.map((day, idx) => (
                              <option key={idx} value={idx}>
                                {day}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="text-xs text-gray-600 mb-1 block">Başlangıç</label>
                          <input
                            type="time"
                            value={slot.start_time}
                            onChange={(e) =>
                              handleUpdateSlot(slot.originalIndex, 'start_time', e.target.value)
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                          />
                        </div>

                        <div>
                          <label className="text-xs text-gray-600 mb-1 block">Bitiş</label>
                          <input
                            type="time"
                            value={slot.end_time}
                            onChange={(e) =>
                              handleUpdateSlot(slot.originalIndex, 'end_time', e.target.value)
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                          />
                        </div>
                      </div>

                      <button
                        onClick={() => handleRemoveSlot(slot.originalIndex)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Sil"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
        </div>
      )}

      {editingSlots.length > 0 && (
        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={loadAvailability}
            disabled={saving}
            className="px-6 py-2 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            İptal
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
          >
            <Save className="h-5 w-5" />
            {saving ? 'Kaydediliyor...' : 'Kaydet'}
          </button>
        </div>
      )}

      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h4 className="font-semibold text-blue-900 mb-2">💡 Nasıl Çalışır?</h4>
        <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
          <li>Belirlediğiniz saatler öğrencileriniz tarafından görülebilecektir</li>
          <li>Öğrenciler müsait saatlerden birini seçerek randevu talebi gönderebilir</li>
          <li>Size email bildirimi gelecek ve talebi onaylayabilir veya reddedebilirsiniz</li>
          <li>Onayladığınız randevular takvimde görünecektir</li>
        </ul>
      </div>
    </div>
  );
}
