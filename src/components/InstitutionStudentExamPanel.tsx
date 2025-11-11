import React, { useEffect, useMemo, useState } from 'react';
import { AlertCircle, BarChart3, FileText, RefreshCcw, Upload, Users } from 'lucide-react';
import {
  createStudentExamMetric,
  fetchStudentPerformanceSummary,
  listStudentExamArtifacts,
  listStudentExamMetrics,
  type StudentExamArtifactRecord,
  type StudentExamMetricRecord,
  type StudentExamSource,
  type StudentPerformanceSummary,
  uploadStudentExamArtifact,
} from '../lib/institutionApi';
import {
  listInstitutionStudentRequests,
  type InstitutionStudentRequest,
} from '../lib/institutionStudentApi';

interface InstitutionStudentExamPanelProps {
  institutionId: string;
  institutionName: string;
  teacherUserId?: string | null;
}

const sourceOptions: { value: StudentExamSource; label: string }[] = [
  { value: 'institution', label: 'Kurum Denemesi' },
  { value: 'school', label: 'Okul Sınavı' },
  { value: 'external', label: 'Harici Deneme' },
];

const numberOrNull = (value: string) => {
  const normalized = value.replace(',', '.').trim();
  if (!normalized) {
    return null;
  }
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
};

const getErrorMessage = (error: unknown, fallback: string) =>
  error instanceof Error ? error.message : fallback;

export default function InstitutionStudentExamPanel({
  institutionId,
  institutionName,
  teacherUserId,
}: InstitutionStudentExamPanelProps) {
  const [students, setStudents] = useState<InstitutionStudentRequest[]>([]);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [panelError, setPanelError] = useState<string | null>(null);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);

  const [artifactForm, setArtifactForm] = useState({
    examName: '',
    examType: 'TYT',
    source: 'institution' as StudentExamSource,
    score: '',
  });
  const [artifactFile, setArtifactFile] = useState<File | null>(null);
  const [artifactInputKey, setArtifactInputKey] = useState(0);
  const [uploadingArtifact, setUploadingArtifact] = useState(false);

  const [metricForm, setMetricForm] = useState({
    examName: '',
    examType: 'TYT',
    source: 'institution' as StudentExamSource,
    correctCount: '',
    wrongCount: '',
    blankCount: '',
    score: '',
    percentile: '',
    ranking: '',
    notes: '',
  });
  const [savingMetric, setSavingMetric] = useState(false);

  const [artifacts, setArtifacts] = useState<StudentExamArtifactRecord[]>([]);
  const [metrics, setMetrics] = useState<StudentExamMetricRecord[]>([]);
  const [summary, setSummary] = useState<StudentPerformanceSummary | null>(null);
  const [dataLoading, setDataLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; tone: 'success' | 'error' } | null>(null);

  useEffect(() => {
    const loadStudents = async () => {
      setStudentsLoading(true);
      setPanelError(null);
      try {
        const rows = await listInstitutionStudentRequests(institutionId, 'approved');
        setStudents(rows);
        setSelectedStudentId((current) => current ?? rows[0]?.user_id ?? null);
      } catch (error) {
        console.error('InstitutionStudentExamPanel list error:', error);
        setPanelError(getErrorMessage(error, 'Öğrenci listesi alınamadı.'));
      } finally {
        setStudentsLoading(false);
      }
    };

    loadStudents();
  }, [institutionId]);

  useEffect(() => {
    if (!selectedStudentId) {
      setArtifacts([]);
      setMetrics([]);
      setSummary(null);
      return;
    }

    const loadStudentData = async () => {
      setDataLoading(true);
      setPanelError(null);
      try {
        const [artifactRows, metricRows, summaryPayload] = await Promise.all([
          listStudentExamArtifacts({ studentUserId: selectedStudentId, institutionId, limit: 20 }),
          listStudentExamMetrics({ studentUserId: selectedStudentId, institutionId, limit: 20 }),
          fetchStudentPerformanceSummary(selectedStudentId),
        ]);
        setArtifacts(artifactRows);
        setMetrics(metricRows);
        setSummary(summaryPayload);
      } catch (error) {
        console.error('InstitutionStudentExamPanel load error:', error);
        setPanelError(getErrorMessage(error, 'Öğrenci verileri yüklenemedi.'));
      } finally {
        setDataLoading(false);
      }
    };

    loadStudentData();
  }, [selectedStudentId, institutionId]);

  const selectedStudent = useMemo(
    () => students.find((student) => student.user_id === selectedStudentId) ?? null,
    [students, selectedStudentId],
  );

  const showToast = (message: string, tone: 'success' | 'error' = 'success') => {
    setToast({ message, tone });
    window.setTimeout(() => setToast(null), 3200);
  };

  const handleArtifactSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!selectedStudentId) {
      showToast('Lütfen bir öğrenci seçin.', 'error');
      return;
    }

    if (!artifactFile) {
      showToast('PDF veya görsel dosya seçmelisiniz.', 'error');
      return;
    }

    setUploadingArtifact(true);
    try {
      await uploadStudentExamArtifact({
        institutionId,
        studentUserId: selectedStudentId,
        teacherUserId,
        examName: artifactForm.examName.trim() || 'İsimsiz Deneme',
        examType: artifactForm.examType.trim() || 'Genel',
        source: artifactForm.source,
        score: numberOrNull(artifactForm.score),
        file: artifactFile,
        metadata: {
          submittedFrom: 'teacher-dashboard',
        },
      });
      showToast('Dosya başarıyla yüklendi.');
      setArtifactForm((prev) => ({ ...prev, examName: '', score: '' }));
      setArtifactFile(null);
      setArtifactInputKey((key) => key + 1);
      if (selectedStudentId) {
        const [artifactRows, summaryPayload] = await Promise.all([
          listStudentExamArtifacts({ studentUserId: selectedStudentId, institutionId, limit: 20 }),
          fetchStudentPerformanceSummary(selectedStudentId),
        ]);
        setArtifacts(artifactRows);
        setSummary(summaryPayload);
      }
    } catch (error) {
      console.error('Artifact upload error:', error);
      showToast(getErrorMessage(error, 'Dosya yüklenemedi.'), 'error');
    } finally {
      setUploadingArtifact(false);
    }
  };

  const handleMetricSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!selectedStudentId) {
      showToast('Lütfen bir öğrenci seçin.', 'error');
      return;
    }

    setSavingMetric(true);
    try {
      await createStudentExamMetric({
        institutionId,
        studentUserId: selectedStudentId,
        recordedBy: teacherUserId,
        examName: metricForm.examName.trim() || 'Kayıtlı Sınav',
        examType: metricForm.examType.trim() || 'Genel',
        source: metricForm.source,
        correctCount: numberOrNull(metricForm.correctCount),
        wrongCount: numberOrNull(metricForm.wrongCount),
        blankCount: numberOrNull(metricForm.blankCount),
        score: numberOrNull(metricForm.score),
        percentile: numberOrNull(metricForm.percentile),
        ranking: numberOrNull(metricForm.ranking),
        notes: metricForm.notes.trim() || null,
      });
      showToast('Performans metrikleri kaydedildi.');
      setMetricForm((prev) => ({
        ...prev,
        examName: '',
        correctCount: '',
        wrongCount: '',
        blankCount: '',
        score: '',
        percentile: '',
        ranking: '',
        notes: '',
      }));
      if (selectedStudentId) {
        const [metricRows, summaryPayload] = await Promise.all([
          listStudentExamMetrics({ studentUserId: selectedStudentId, institutionId, limit: 20 }),
          fetchStudentPerformanceSummary(selectedStudentId),
        ]);
        setMetrics(metricRows);
        setSummary(summaryPayload);
      }
    } catch (error) {
      console.error('Metric save error:', error);
      showToast(getErrorMessage(error, 'Dosya yüklenemedi.'), 'error');
    } finally {
      setSavingMetric(false);
    }
  };

  const noApprovedStudents = !studentsLoading && students.length === 0;

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-gray-500">Öğrenci Deneme Sonuçları</p>
          <h3 className="text-lg font-semibold text-gray-900">{institutionName} - Performans Kayıtları</h3>
          <p className="text-xs text-gray-500">
            Öğrenciler için PDF/görsel deneme sonuçlarını yükleyin, metrik girin ve performans trendlerini takip edin.
          </p>
        </div>
        <button
          type="button"
          onClick={async () => {
            setStudentsLoading(true);
            try {
              const rows = await listInstitutionStudentRequests(institutionId, 'approved');
              setStudents(rows);
              if (!rows.some((student) => student.user_id === selectedStudentId)) {
                setSelectedStudentId(rows[0]?.user_id ?? null);
              }
            } catch (error) {
              console.error('InstitutionStudentExamPanel manual refresh error:', error);
              setPanelError(getErrorMessage(error, 'Öğrenci listesi alınamadı.'));
            } finally {
              setStudentsLoading(false);
            }
          }}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:border-blue-300 hover:text-blue-600"
        >
          <RefreshCcw className="h-4 w-4" />
          Yenile
        </button>
      </div>

      {toast && (
        <div
          className={`mt-4 rounded-lg border px-3 py-2 text-sm ${
            toast.tone === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
              : 'border-red-200 bg-red-50 text-red-700'
          }`}
        >
          {toast.message}
        </div>
      )}

      {panelError && (
        <div className="mt-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          <AlertCircle className="h-4 w-4" />
          <span>{panelError}</span>
        </div>
      )}

      {noApprovedStudents ? (
        <div className="mt-4 rounded-xl border border-dashed border-gray-300 bg-gray-50 p-6 text-center text-sm text-gray-500">
          <Users className="mx-auto mb-3 h-8 w-8 text-gray-400" />
          Henüz onaylanmış öğrenci bulunamadı. Öğrenciler kod ile başvuru yapıp onaylandığında bu panel otomatik
          dolacak.
        </div>
      ) : (
        <div className="mt-6 space-y-6">
          <div className="grid gap-3 md:grid-cols-[3fr,2fr]">
            <div>
              <label className="text-xs font-semibold uppercase text-gray-500">Öğrenci Seç</label>
              <select
                value={selectedStudentId ?? ''}
                onChange={(event) => setSelectedStudentId(event.target.value || null)}
                disabled={studentsLoading}
                className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:border-blue-300 focus:outline-none"
              >
                {students.map((student) => (
                  <option key={student.user_id} value={student.user_id}>
                    {student.full_name || student.email}
                  </option>
                ))}
              </select>
            </div>
            {selectedStudent && (
              <div className="rounded-xl border border-gray-100 bg-gray-50 p-3 text-xs text-gray-600">
                <p className="font-semibold text-gray-800">{selectedStudent.full_name}</p>
                <p>{selectedStudent.email}</p>
                {selectedStudent.phone && <p>{selectedStudent.phone}</p>}
                <p className="text-[11px] text-gray-500">Başvuru: {new Date(selectedStudent.created_at).toLocaleDateString('tr-TR')}</p>
              </div>
            )}
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <form onSubmit={handleArtifactSubmit} className="rounded-2xl border border-indigo-100 bg-indigo-50/60 p-5">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-white/70 p-3 text-indigo-600">
                  <Upload className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-indigo-500">Dosya yükle</p>
                  <h4 className="text-base font-semibold text-indigo-900">Deneme sonucu belgesi</h4>
                </div>
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <div>
                  <label className="text-xs font-semibold text-indigo-700">Sınav adı</label>
                  <input
                    type="text"
                    value={artifactForm.examName}
                    onChange={(event) => setArtifactForm((prev) => ({ ...prev, examName: event.target.value }))}
                    className="mt-1 w-full rounded-lg border border-indigo-100 bg-white px-3 py-2 text-sm text-gray-800 focus:border-indigo-300 focus:outline-none"
                    placeholder="Örn. TYT 12"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-indigo-700">Sınav türü</label>
                  <input
                    type="text"
                    value={artifactForm.examType}
                    onChange={(event) => setArtifactForm((prev) => ({ ...prev, examType: event.target.value }))}
                    className="mt-1 w-full rounded-lg border border-indigo-100 bg-white px-3 py-2 text-sm text-gray-800 focus:border-indigo-300 focus:outline-none"
                    placeholder="TYT / AYT / LGS"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-indigo-700">Kaynak</label>
                  <select
                    value={artifactForm.source}
                    onChange={(event) =>
                      setArtifactForm((prev) => ({ ...prev, source: event.target.value as StudentExamSource }))
                    }
                    className="mt-1 w-full rounded-lg border border-indigo-100 bg-white px-3 py-2 text-sm text-gray-800 focus:border-indigo-300 focus:outline-none"
                  >
                    {sourceOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-indigo-700">Puan (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={artifactForm.score}
                    onChange={(event) => setArtifactForm((prev) => ({ ...prev, score: event.target.value }))}
                    className="mt-1 w-full rounded-lg border border-indigo-100 bg-white px-3 py-2 text-sm text-gray-800 focus:border-indigo-300 focus:outline-none"
                    placeholder="83"
                  />
                </div>
              </div>
              <div className="mt-3">
                <input
                  key={artifactInputKey}
                  type="file"
                  accept="application/pdf,image/*"
                  onChange={(event) => setArtifactFile(event.target.files?.[0] ?? null)}
                  className="w-full text-xs text-indigo-700"
                />
                <p className="mt-1 text-[11px] text-indigo-600">PDF veya görsel yükleyebilirsiniz.</p>
              </div>
              <button
                type="submit"
                disabled={uploadingArtifact || !selectedStudentId}
                className="mt-4 w-full rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-indigo-300"
              >
                {uploadingArtifact ? 'Yükleniyor...' : 'Dosyayı Kaydet'}
              </button>
            </form>

            <form onSubmit={handleMetricSubmit} className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-5">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-white/70 p-3 text-emerald-600">
                  <BarChart3 className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-emerald-500">Performans verileri</p>
                  <h4 className="text-base font-semibold text-emerald-900">Detaylı sınav metrikleri</h4>
                </div>
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <div>
                  <label className="text-xs font-semibold text-emerald-700">Sınav adı</label>
                  <input
                    type="text"
                    value={metricForm.examName}
                    onChange={(event) => setMetricForm((prev) => ({ ...prev, examName: event.target.value }))}
                    className="mt-1 w-full rounded-lg border border-emerald-100 bg-white px-3 py-2 text-sm text-gray-800 focus:border-emerald-300 focus:outline-none"
                    placeholder="Deneme Adı"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-emerald-700">Sınav türü</label>
                  <input
                    type="text"
                    value={metricForm.examType}
                    onChange={(event) => setMetricForm((prev) => ({ ...prev, examType: event.target.value }))}
                    className="mt-1 w-full rounded-lg border border-emerald-100 bg-white px-3 py-2 text-sm text-gray-800 focus:border-emerald-300 focus:outline-none"
                    placeholder="TYT / Okul"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-emerald-700">Kaynak</label>
                  <select
                    value={metricForm.source}
                    onChange={(event) =>
                      setMetricForm((prev) => ({ ...prev, source: event.target.value as StudentExamSource }))
                    }
                    className="mt-1 w-full rounded-lg border border-emerald-100 bg-white px-3 py-2 text-sm text-gray-800 focus:border-emerald-300 focus:outline-none"
                  >
                    {sourceOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-emerald-700">Skor (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={metricForm.score}
                    onChange={(event) => setMetricForm((prev) => ({ ...prev, score: event.target.value }))}
                    className="mt-1 w-full rounded-lg border border-emerald-100 bg-white px-3 py-2 text-sm text-gray-800 focus:border-emerald-300 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-emerald-700">Doğru / Yanlış / Boş</label>
                  <div className="mt-1 grid grid-cols-3 gap-2">
                    {(['correctCount', 'wrongCount', 'blankCount'] as const).map((field) => (
                      <input
                        key={field}
                        type="number"
                        min="0"
                        value={metricForm[field]}
                        onChange={(event) =>
                          setMetricForm((prev) => ({ ...prev, [field]: event.target.value }))
                        }
                        className="w-full rounded-lg border border-emerald-100 bg-white px-2 py-2 text-center text-sm text-gray-800 focus:border-emerald-300 focus:outline-none"
                      />
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-emerald-700">Yüzdelik / Sıralama</label>
                  <div className="mt-1 grid grid-cols-2 gap-2">
                    {(['percentile', 'ranking'] as const).map((field) => (
                      <input
                        key={field}
                        type="number"
                        value={metricForm[field]}
                        onChange={(event) =>
                          setMetricForm((prev) => ({ ...prev, [field]: event.target.value }))
                        }
                        className="w-full rounded-lg border border-emerald-100 bg-white px-2 py-2 text-center text-sm text-gray-800 focus:border-emerald-300 focus:outline-none"
                      />
                    ))}
                  </div>
                </div>
              </div>
              <div className="mt-3">
                <textarea
                  value={metricForm.notes}
                  onChange={(event) => setMetricForm((prev) => ({ ...prev, notes: event.target.value }))}
                  rows={3}
                  className="w-full rounded-lg border border-emerald-100 bg-white px-3 py-2 text-sm text-gray-800 focus:border-emerald-300 focus:outline-none"
                  placeholder="Notlar, özel bilgiler..."
                />
              </div>
              <button
                type="submit"
                disabled={savingMetric || !selectedStudentId}
                className="mt-4 w-full rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-300"
              >
                {savingMetric ? 'Kaydediliyor...' : 'Performans Kaydet'}
              </button>
            </form>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border border-gray-100 bg-gray-50 p-5">
              <p className="text-xs uppercase tracking-wide text-gray-500">Özet</p>
              {summary && summary.total_exams > 0 ? (
                <>
                  <div className="mt-3 grid grid-cols-3 gap-3 text-center">
                    <div className="rounded-xl bg-white p-3">
                      <p className="text-[11px] uppercase text-gray-500">Toplam</p>
                      <p className="text-2xl font-bold text-gray-900">{summary.total_exams}</p>
                    </div>
                    <div className="rounded-xl bg-white p-3">
                      <p className="text-[11px] uppercase text-gray-500">Ortalama</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {summary.average_score ? Math.round(summary.average_score) : '–'}
                      </p>
                    </div>
                    <div className="rounded-xl bg-white p-3">
                      <p className="text-[11px] uppercase text-gray-500">En iyi</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {summary.best_score ? Math.round(summary.best_score) : '–'}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4">
                    <p className="text-xs font-semibold text-gray-600">Kaynak dağılımı</p>
                    <div className="mt-2 flex flex-wrap gap-2 text-xs">
                      {summary.source_breakdown?.map((item) => (
                        <span
                          key={`${item.source}-${item.count}`}
                          className="rounded-full bg-white px-3 py-1 text-gray-700 shadow"
                        >
                          {item.source || 'Belirsiz'} – {item.count} sınav –
                          {item.average ? ` %${Math.round(item.average)}` : ' skor yok'}
                        </span>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <p className="mt-3 text-sm text-gray-500">Bu öğrenci için henüz performans özeti yok.</p>
              )}
            </div>

            <div className="rounded-2xl border border-gray-100 bg-white p-5">
              <p className="text-xs uppercase tracking-wide text-gray-500">Son metrikler</p>
              {dataLoading ? (
                <p className="mt-3 text-sm text-gray-500">Yükleniyor...</p>
              ) : metrics.length === 0 ? (
                <p className="mt-3 text-sm text-gray-500">Henüz metrik kaydı yok.</p>
              ) : (
                <ul className="mt-3 space-y-3 text-sm text-gray-700">
                  {metrics.slice(0, 4).map((metric) => (
                    <li key={metric.id} className="rounded-xl border border-gray-100 p-3">
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>{metric.exam_name}</span>
                        <span>{new Date(metric.created_at).toLocaleDateString('tr-TR')}</span>
                      </div>
                      <p className="text-lg font-semibold text-gray-900">
                        {metric.score ? `%${metric.score}` : 'Skor yok'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {metric.correct_count ?? '-'} D – {metric.wrong_count ?? '-'} Y – {metric.blank_count ?? '-'} B
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-gray-100 bg-white p-5">
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-wide text-gray-500">Son yüklenen belgeler</p>
              <span className="text-xs text-gray-400">PDF & Görsel kayıtlar</span>
            </div>
            {dataLoading ? (
              <p className="mt-3 text-sm text-gray-500">Yükleniyor...</p>
            ) : artifacts.length === 0 ? (
              <p className="mt-3 text-sm text-gray-500">Henüz bir belge yüklenmemiş.</p>
            ) : (
              <ul className="mt-3 space-y-3 text-sm text-gray-700">
                {artifacts.slice(0, 5).map((artifact) => (
                  <li
                    key={artifact.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-100 p-3"
                  >
                    <div>
                      <p className="font-semibold text-gray-900">{artifact.exam_name}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(artifact.created_at).toLocaleString('tr-TR')} – {artifact.file_type === 'pdf' ? 'PDF' : 'Görsel'}
                      </p>
                    </div>
                    <a
                      href={artifact.file_url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700"
                    >
                      <FileText className="h-3.5 w-3.5" />
                      Gör
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </section>
  );
}










