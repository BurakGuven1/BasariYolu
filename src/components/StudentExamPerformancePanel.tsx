import React, { useEffect, useMemo, useState } from 'react';
import { Activity, Download, FileText, Image as ImageIcon, TrendingUp } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, Tooltip, CartesianGrid } from 'recharts';
import {
  fetchStudentPerformanceSummary,
  listStudentExamArtifacts,
  listStudentExamMetrics,
  type StudentExamArtifactRecord,
  type StudentExamMetricRecord,
  type StudentPerformanceSummary,
} from '../lib/institutionApi';

interface StudentExamPerformancePanelProps {
  userId?: string | null;
}
const getErrorMessage = (error: unknown, fallback: string) => {
  if (error instanceof Error) {
    return error.message;
  }
  if (error && typeof error === 'object' && 'message' in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === 'string' && message.trim()) {
      return message;
    }
  }
  return fallback;
};

const isValidUuid = (value: string | null | undefined) =>
  !!value && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);

const formatScore = (value: number | null | undefined) =>
  typeof value === 'number' && Number.isFinite(value) ? Math.round(value) : null;

export default function StudentExamPerformancePanel({ userId }: StudentExamPerformancePanelProps) {
  const [artifacts, setArtifacts] = useState<StudentExamArtifactRecord[]>([]);
  const [metrics, setMetrics] = useState<StudentExamMetricRecord[]>([]);
  const [summary, setSummary] = useState<StudentPerformanceSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setArtifacts([]);
      setMetrics([]);
      setSummary(null);
      setError(null);
      setLoading(false);
      return;
    }

    if (!isValidUuid(userId)) {
      setArtifacts([]);
      setMetrics([]);
      setSummary(null);
      setLoading(false);
      setError('Geçerli bir öðrenci bilgisi bulunamadý. Lütfen tekrar giriþ yapýn.');
      return;
    }

    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [artifactRows, metricRows, summaryPayload] = await Promise.all([
          listStudentExamArtifacts({ studentUserId: userId, limit: 12 }),
          listStudentExamMetrics({ studentUserId: userId, limit: 12 }),
          fetchStudentPerformanceSummary(userId),
        ]);
        setArtifacts(artifactRows);
        setMetrics(metricRows);
        setSummary(summaryPayload);
      } catch (error) {
        console.error('StudentExamPerformancePanel error:', error);
        setError(getErrorMessage(error, 'Performans verileri alýnamadý.'));
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [userId]);

  const chartData = useMemo(() => {
    if (!summary?.last_scores?.length) {
      return [];
    }
    return [...summary.last_scores]
      .slice(0, 10)
      .reverse()
      .map((item, index) => ({
        label: item.examName || `Sýnav ${index + 1}`,
        score: item.score ?? null,
      }));
  }, [summary?.last_scores]);

  const handleDownloadReport = () => {
    if (!summary) {
      return;
    }

    const safeScore = (score: number | null | undefined) => (score ? `${Math.round(score)}%` : '—');
    const chartBars = chartData
      .map((entry) => {
        const width = entry.score ? Math.min(Math.max(entry.score, 0), 100) : 0;
        return `
          <div class="chart-row">
            <span>${entry.label}</span>
            <div class="track"><div class="fill" style="width:${width}%"></div></div>
            <span>${entry.score ? Math.round(entry.score) : '–'}%</span>
          </div>
        `;
      })
      .join('');

    const metricRows = metrics
      .slice(0, 8)
      .map(
        (metric) => `
        <tr>
          <td>${metric.exam_name}</td>
          <td>${metric.source}</td>
          <td>${safeScore(metric.score)}</td>
          <td>${metric.correct_count ?? '–'}/${metric.wrong_count ?? '–'}/${metric.blank_count ?? '–'}</td>
        </tr>
      `,
      )
      .join('');

    const artifactRows = artifacts
      .slice(0, 6)
      .map(
        (artifact) => `
        <li>
          <strong>${artifact.exam_name}</strong>
          <span>${new Date(artifact.created_at).toLocaleDateString('tr-TR')} · ${artifact.file_type.toUpperCase()}</span>
        </li>
      `,
      )
      .join('');

    const breakdownItems = summary.source_breakdown
      ?.map(
        (item) => `
        <li>
          <span>${item.source || 'Belirsiz'}</span>
          <strong>${item.count} kayýt</strong>
          <em>${item.average ? `%${Math.round(item.average)}` : 'Skor yok'}</em>
        </li>
      `,
      )
      .join('');

    const html = `<!doctype html>
<html lang="tr">
<head>
  <meta charset="utf-8" />
  <title>Performans Raporu</title>
  <style>
    body { font-family: 'Inter', Arial, sans-serif; margin: 0; padding: 32px; background: #f7f8fc; color: #111827; }
    h1 { font-size: 24px; margin-bottom: 4px; }
    section { background: #fff; border-radius: 16px; padding: 24px; margin-bottom: 16px; box-shadow: 0 10px 30px rgba(15,23,42,0.08); }
    .stats { display: flex; gap: 16px; }
    .card { flex: 1; background: #f9fafb; border-radius: 12px; padding: 16px; text-align: center; }
    .card span { display: block; font-size: 12px; text-transform: uppercase; color: #6b7280; margin-bottom: 6px; }
    .card strong { font-size: 28px; color: #111827; }
    .chart-row { display: grid; grid-template-columns: 120px 1fr 60px; align-items: center; gap: 10px; margin-bottom: 8px; font-size: 13px; }
    .track { height: 8px; border-radius: 999px; background: #e5e7eb; overflow: hidden; }
    .fill { height: 100%; background: linear-gradient(90deg,#34d399,#10b981); }
    table { width: 100%; border-collapse: collapse; font-size: 13px; }
    th { text-align: left; font-size: 12px; text-transform: uppercase; color: #6b7280; padding-bottom: 8px; }
    td { padding: 6px 0; border-top: 1px solid #f3f4f6; }
    ul { list-style: none; padding: 0; margin: 0; }
    ul li { padding: 8px 0; border-bottom: 1px solid #f3f4f6; font-size: 13px; }
    ul li strong { display: block; font-size: 14px; }
    ul li span { color: #6b7280; font-size: 12px; }
  </style>
</head>
<body>
  <section>
    <h1>Öðrenci Performans Raporu</h1>
    <p>${new Date().toLocaleString('tr-TR')}</p>
    <div class="stats">
      <div class="card"><span>Toplam Sýnav</span><strong>${summary.total_exams}</strong></div>
      <div class="card"><span>Ortalama Skor</span><strong>${safeScore(summary.average_score)}</strong></div>
      <div class="card"><span>En Ýyi Skor</span><strong>${safeScore(summary.best_score)}</strong></div>
    </div>
  </section>
  <section>
    <h2>Skor Trendi</h2>
    ${chartBars || '<p>Grafik verisi bulunamadý.</p>'}
  </section>
  <section>
    <h2>Kaynak Daðýlýmý</h2>
    <ul>${breakdownItems || '<li>Veri bulunamadý.</li>'}</ul>
  </section>
  <section>
    <h2>Öne Çýkan Metrikler</h2>
    <table>
      <thead>
        <tr><th>Sýnav</th><th>Kaynak</th><th>Skor</th><th>D/Y/B</th></tr>
      </thead>
      <tbody>${metricRows || '<tr><td colspan="4">Veri yok</td></tr>'}</tbody>
    </table>
  </section>
  <section>
    <h2>Yüklenen Belgeler</h2>
    <ul>${artifactRows || '<li>Henüz belge yüklenmemiþ.</li>'}</ul>
  </section>
</body>
</html>`;

    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'performans-raporu.html';
    anchor.click();
    URL.revokeObjectURL(url);
  };

  if (!userId) {
    return null;
  }

  if (loading) {
    return (
      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <p className="text-sm text-gray-500">Performans verileri yükleniyor...</p>
      </section>
    );
  }

  if (error) {
    return (
      <section className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
        {error}
      </section>
    );
  }

  return (
    <section className="space-y-6 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-gray-500">Kurum Deneme Performansý</p>
          <h3 className="text-lg font-semibold text-gray-900">Sonuçlarým ve Belgelerim</h3>
        </div>
        <button
          type="button"
          onClick={handleDownloadReport}
          disabled={!summary}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:border-blue-300 hover:text-blue-600 disabled:cursor-not-allowed disabled:border-gray-200"
        >
          <Download className="h-4 w-4" />
          Performans Raporu
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Toplam Sýnav" value={summary?.total_exams ? String(summary.total_exams) : '0'} icon={Activity} />
        <StatCard label="Ortalama Skor" value={formatScore(summary?.average_score) ? `%${formatScore(summary?.average_score)}` : '–'} icon={TrendingUp} />
        <StatCard label="En Ýyi Skor" value={formatScore(summary?.best_score) ? `%${formatScore(summary?.best_score)}` : '–'} icon={FileText} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
        <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
          <p className="text-xs uppercase tracking-wide text-gray-500">Skor grafiði</p>
          {chartData.length === 0 ? (
            <p className="mt-3 text-sm text-gray-500">Henüz skor kaydý bulunmuyor.</p>
          ) : (
            <div className="mt-3 h-48">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ left: 8, right: 16, top: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="4 4" stroke="#e5e7eb" />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} stroke="#9ca3af" />
                  <Tooltip formatter={(value) => `${value}%`} />
                  <Line type="monotone" dataKey="score" stroke="#2563eb" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-4">
          <p className="text-xs uppercase tracking-wide text-gray-500">Kaynak daðýlýmý</p>
          {summary?.source_breakdown?.length ? (
            <ul className="mt-3 space-y-2 text-sm text-gray-700">
              {summary.source_breakdown.map((item) => (
                <li key={`${item.source}-${item.count}`} className="flex items-center justify-between text-xs">
                  <span>{item.source || 'Bilinmiyor'}</span>
                  <span>
                    {item.count} sýnav · {item.average ? `%${Math.round(item.average)}` : 'skor yok'}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-gray-500">Kaynak detaylarý henüz yok.</p>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-gray-100 bg-white p-4">
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-wide text-gray-500">Son belgeler</p>
            <ImageIcon className="h-4 w-4 text-gray-400" />
          </div>
          {artifacts.length === 0 ? (
            <p className="mt-2 text-sm text-gray-500">Henüz kurum tarafýndan paylaþýlmýþ belge yok.</p>
          ) : (
            <ul className="mt-3 space-y-3 text-sm text-gray-700">
              {artifacts.slice(0, 4).map((artifact) => (
                <li key={artifact.id} className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-gray-900">{artifact.exam_name}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(artifact.created_at).toLocaleString('tr-TR')} · {artifact.file_type === 'pdf' ? 'PDF' : 'Görsel'}
                    </p>
                  </div>
                  <a
                    href={artifact.file_url}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700"
                  >
                    Görüntüle
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-4">
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-wide text-gray-500">Performans metrikleri</p>
            <TrendingUp className="h-4 w-4 text-gray-400" />
          </div>
          {metrics.length === 0 ? (
            <p className="mt-2 text-sm text-gray-500">Henüz metrik kaydý bulunmuyor.</p>
          ) : (
            <table className="mt-3 w-full text-xs text-gray-600">
              <thead>
                <tr>
                  <th className="pb-2 text-left font-semibold">Sýnav</th>
                  <th className="pb-2 text-left font-semibold">Kaynak</th>
                  <th className="pb-2 text-left font-semibold">Skor</th>
                  <th className="pb-2 text-left font-semibold">D/Y/B</th>
                </tr>
              </thead>
              <tbody>
                {metrics.slice(0, 5).map((metric) => (
                  <tr key={metric.id} className="border-t border-gray-100">
                    <td className="py-2 font-semibold text-gray-900">{metric.exam_name}</td>
                    <td className="py-2">{metric.source}</td>
                    <td className="py-2">{formatScore(metric.score) ? `%${formatScore(metric.score)}` : '–'}</td>
                    <td className="py-2">
                      {metric.correct_count ?? '-'} / {metric.wrong_count ?? '-'} / {metric.blank_count ?? '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </section>
  );
}

interface StatCardProps {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
}

function StatCard({ label, value, icon: Icon }: StatCardProps) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-gray-50 p-4">
      <div className="rounded-2xl bg-white p-3 text-blue-500">
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-xs uppercase tracking-wide text-gray-500">{label}</p>
        <p className="text-xl font-semibold text-gray-900">{value}</p>
      </div>
    </div>
  );
}





