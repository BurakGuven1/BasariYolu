import { useEffect, useMemo, useRef, useState } from 'react';
import { Calendar, Download, Eraser, Palette, Plus, Sparkles, Trash2 } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

type PlannerBlock = {
  id: string;
  day: number;
  subject: string;
  startTime: string;
  endTime: string;
  notes?: string;
  color: string;
};

interface SelfStudyPlannerProps {
  studentId: string;
  studentName?: string;
}

const DAYS: { value: number; label: string; short: string }[] = [
  { value: 0, label: 'Pazartesi', short: 'Pzt' },
  { value: 1, label: 'Salı', short: 'Sal' },
  { value: 2, label: 'Çarşamba', short: 'Car' },
  { value: 3, label: 'Perşembe', short: 'Per' },
  { value: 4, label: 'Cuma', short: 'Cum' },
  { value: 5, label: 'Cumartesi', short: 'Cmt' },
  { value: 6, label: 'Pazar', short: 'Paz' }
];

const COLOR_OPTIONS = [
  { value: '#6366f1', label: 'İndigo' },
  { value: '#10b981', label: 'Zümrüt' },
  { value: '#f59e0b', label: 'Amber' },
  { value: '#ec4899', label: 'Pembe' },
  { value: '#ef4444', label: 'Kırmızı' },
  { value: '#14b8a6', label: 'Teal' },
  { value: '#8b5cf6', label: 'Viyole' }
];

const QUICK_TEMPLATE: Omit<PlannerBlock, 'id'>[] = [
  { day: 0, subject: 'TYT Türkçe', startTime: '09:00', endTime: '10:30', notes: 'Paragraf ve dil bilgisi çalışması', color: '#6366f1' },
  { day: 0, subject: 'TYT Matematik', startTime: '11:00', endTime: '12:30', notes: 'Problem çözümü', color: '#10b981' },
  { day: 1, subject: 'AYT Fizik', startTime: '09:30', endTime: '11:00', notes: 'Elektrik ve manyetizma tekrar', color: '#14b8a6' },
  { day: 1, subject: 'TYT Sosyal', startTime: '11:30', endTime: '12:30', notes: 'Tarih soru çözümü', color: '#f59e0b' },
  { day: 2, subject: 'TYT Matematik', startTime: '09:00', endTime: '10:30', notes: 'Temel kavramlar tekrar', color: '#10b981' },
  { day: 2, subject: 'AYT Kimya', startTime: '11:00', endTime: '12:30', notes: 'Organik kimya özet', color: '#ec4899' },
  { day: 3, subject: 'TYT Türkçe', startTime: '09:00', endTime: '10:00', notes: 'Hızlı okuma pratiği', color: '#6366f1' },
  { day: 3, subject: 'AYT Matematik', startTime: '10:30', endTime: '12:00', notes: 'Integral ve limit', color: '#8b5cf6' },
  { day: 4, subject: 'TYT Fen', startTime: '09:00', endTime: '10:30', notes: 'Biyoloji konu tekrar', color: '#14b8a6' },
  { day: 4, subject: 'Deneme', startTime: '11:00', endTime: '13:00', notes: 'TYT deneme tam uygulama', color: '#ef4444' },
  { day: 5, subject: 'Genel Tekrar', startTime: '10:00', endTime: '12:00', notes: 'Haftanın özetini çıkar', color: '#f59e0b' },
  { day: 6, subject: 'Motivasyon', startTime: '11:00', endTime: '12:00', notes: 'Dinlenme, hedef ve planlama', color: '#6366f1' }
];

const createId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

export default function SelfStudyPlanner({ studentId, studentName }: SelfStudyPlannerProps) {
  const storageKey = `self-study-planner-${studentId}`;
  const plannerRef = useRef<HTMLDivElement | null>(null);
  const [blocks, setBlocks] = useState<PlannerBlock[]>([]);
  const [form, setForm] = useState<Omit<PlannerBlock, 'id'>>({
    day: new Date().getDay() === 0 ? 6 : new Date().getDay() - 1,
    subject: '',
    startTime: '09:00',
    endTime: '10:00',
    notes: '',
    color: COLOR_OPTIONS[0].value
  });

  useEffect(() => {
    if (!studentId) return;

    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw) as PlannerBlock[];
        setBlocks(parsed);
      }
    } catch (error) {
      console.error('Unable to load study planner from storage', error);
    }
  }, [storageKey, studentId]);

  useEffect(() => {
    if (!studentId) return;
    try {
      localStorage.setItem(storageKey, JSON.stringify(blocks));
    } catch (error) {
      console.error('Unable to persist study planner', error);
    }
  }, [blocks, storageKey, studentId]);

  const groupedBlocks = useMemo(() => {
    const initial: Record<number, PlannerBlock[]> = {
      0: [],
      1: [],
      2: [],
      3: [],
      4: [],
      5: [],
      6: []
    };

    blocks.forEach(block => {
      if (!initial[block.day]) {
        initial[block.day] = [];
      }
      initial[block.day].push(block);
    });

    Object.values(initial).forEach(list => {
      list.sort((a, b) => a.startTime.localeCompare(b.startTime));
    });

    return initial;
  }, [blocks]);

  const handleAddBlock = () => {
    if (!form.subject.trim()) {
      alert('Ders alanini doldurun.');
      return;
    }

    if (form.endTime <= form.startTime) {
      alert('Bitis saati baslangictan sonra olmalidir.');
      return;
    }

    const newBlock: PlannerBlock = {
      id: createId(),
      ...form,
      subject: form.subject.trim(),
      notes: form.notes?.trim()
    };

    setBlocks(prev => [...prev, newBlock]);
    setForm(prev => ({
      ...prev,
      subject: '',
      notes: ''
    }));
  };

  const handleRemoveBlock = (id: string) => {
    setBlocks(prev => prev.filter(block => block.id !== id));
  };

  const handleClearAll = () => {
    if (blocks.length === 0) return;
    if (confirm('Tüm çalışma bloklarını silmek istiyor musun?')) {
      setBlocks([]);
    }
  };

  const handleQuickTemplate = () => {
    const generated = QUICK_TEMPLATE.map(template => ({
      ...template,
      id: createId()
    }));
    setBlocks(generated);
  };

  const handleExportPdf = async () => {
    if (!plannerRef.current) return;
    const element = plannerRef.current;

    const canvas = await html2canvas(element, {
      scale: window.devicePixelRatio < 2 ? 2 : window.devicePixelRatio,
      backgroundColor: '#ffffff'
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    const imgWidth = pageWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    let position = 0;
    let remainingHeight = imgHeight;

    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, Math.min(imgHeight, pageHeight));
    remainingHeight -= pageHeight;
    position -= pageHeight;

    while (remainingHeight > 0) {
      position = position + pageHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, Math.min(imgHeight, pageHeight));
      remainingHeight -= pageHeight;
    }

    const filename = studentName
      ? `${studentName.replace(/\s+/g, '-').toLowerCase()}-calisma-plani.pdf`
      : 'calisma-plani.pdf';

    pdf.save(filename);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
      <div className="border-b border-gray-200 bg-gray-50 px-6 py-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600">
            <Calendar className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Kişisel Çalışma Planı
            </h2>
            <p className="text-sm text-gray-600">
              Haftalık hedeflerini renkli bloklar ile düzenle ve pdf olarak indir.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleQuickTemplate}
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
          >
            <Sparkles className="h-4 w-4" />
            Tek Tıkla Plan
          </button>
          <button
            type="button"
            onClick={handleExportPdf}
            className="inline-flex items-center gap-2 rounded-lg border border-indigo-200 bg-white px-4 py-2 text-sm font-semibold text-indigo-600 hover:bg-indigo-50"
          >
            <Download className="h-4 w-4" />
            PDF Oluştur
          </button>
          <button
            type="button"
            onClick={handleClearAll}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50"
          >
            <Eraser className="h-4 w-4" />
            Hepsini Temizle
          </button>
        </div>
      </div>

      <div className="px-6 py-6 space-y-6">
        <div className="grid gap-4 lg:grid-cols-[2fr,3fr]">
          <div className="space-y-4">
            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Hizli Blok Ekle</h3>
              <div className="grid gap-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Gun</label>
                    <select
                      value={form.day}
                      onChange={e => setForm(prev => ({ ...prev, day: Number(e.target.value) }))}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring focus:ring-indigo-200"
                    >
                      {DAYS.map(day => (
                        <option key={day.value} value={day.value}>
                          {day.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex flex-col">
                    <label className="block text-xs font-medium text-gray-600 mb-1">Renk</label>
                    <div className="flex items-center gap-2">
                      <select
                        value={form.color}
                        onChange={e => setForm(prev => ({ ...prev, color: e.target.value }))}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring focus:ring-indigo-200"
                      >
                        {COLOR_OPTIONS.map(color => (
                          <option key={color.value} value={color.value}>
                            {color.label}
                          </option>
                        ))}
                      </select>
                      <span
                        className="h-10 w-10 rounded-lg border border-gray-200"
                        style={{ backgroundColor: form.color }}
                        aria-hidden="true"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Ders ya da odak</label>
                  <input
                    type="text"
                    value={form.subject}
                    onChange={e => setForm(prev => ({ ...prev, subject: e.target.value }))}
                    placeholder="Orn: TYT Matematik"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring focus:ring-indigo-200"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Baslangic</label>
                    <input
                      type="time"
                      value={form.startTime}
                      onChange={e => setForm(prev => ({ ...prev, startTime: e.target.value }))}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring focus:ring-indigo-200"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Bitiş</label>
                    <input
                      type="time"
                      value={form.endTime}
                      onChange={e => setForm(prev => ({ ...prev, endTime: e.target.value }))}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring focus:ring-indigo-200"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Not (opsiyonel)</label>
                  <textarea
                    value={form.notes}
                    onChange={e => setForm(prev => ({ ...prev, notes: e.target.value }))}
                    rows={2}
                    placeholder="Hedefini kısa olarak yaz"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring focus:ring-indigo-200"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleAddBlock}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
                >
                  <Plus className="h-4 w-4" />
                  Blok Ekle
                </button>
              </div>
            </div>
          </div>

          <div
            ref={plannerRef}
            className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
          >
            <div className="flex items-center gap-2 mb-4">
              <Palette className="h-4 w-4 text-indigo-500" />
              <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
                Haftalık Plan
              </h3>
            </div>

            {blocks.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-gray-300 bg-gray-50 py-12 text-center">
                <Sparkles className="h-8 w-8 text-indigo-400" />
                <div>
                  <p className="text-sm font-semibold text-gray-700">Planın hazır değil.</p>
                  <p className="text-sm text-gray-500">
                    Tek tıkla plan oluştur ya da blok eklemeye başla.
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {DAYS.map(day => (
                  <div key={day.value} className="rounded-lg border border-gray-100 bg-gray-50 p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-gray-800">{day.label}</h4>
                      <span className="text-xs text-gray-500 uppercase tracking-wide">
                        {day.short}
                      </span>
                    </div>
                    <div className="space-y-3">
                      {groupedBlocks[day.value]?.length ? (
                        groupedBlocks[day.value].map(block => (
                          <div
                            key={block.id}
                            className="relative rounded-lg p-4 text-white shadow-md"
                            style={{ backgroundColor: block.color }}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="text-sm font-semibold">{block.subject}</p>
                                <p className="text-xs font-medium opacity-90">
                                  {block.startTime} - {block.endTime}
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleRemoveBlock(block.id)}
                                className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-black bg-opacity-10 text-white hover:bg-opacity-20"
                                aria-label="Sil"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                            {block.notes && (
                              <p className="mt-3 text-xs leading-relaxed opacity-90">
                                {block.notes}
                              </p>
                            )}
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-gray-500 italic">
                          Henüz blok eklenmedi.
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
