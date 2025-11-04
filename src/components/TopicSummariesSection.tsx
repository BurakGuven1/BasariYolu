import { useMemo, useState } from 'react';
import { FileText, Filter, Download, Clock, Sparkles, Tag } from 'lucide-react';
import clsx from 'clsx';
import { topicSummaries } from '../data/topicSummaries';

const examFilters = [
  { value: 'all', label: 'Tümü' },
  { value: 'TYT', label: 'TYT' },
  { value: 'AYT', label: 'AYT' },
  { value: 'LGS', label: 'LGS' }
] as const;

const difficultyColors: Record<string, string> = {
  Kolay: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  Orta: 'bg-amber-50 text-amber-700 border border-amber-200',
  Zor: 'bg-rose-50 text-rose-700 border border-rose-200'
};

export default function TopicSummariesSection() {
  const [selectedExam, setSelectedExam] = useState<typeof examFilters[number]['value']>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredSummaries = useMemo(() => {
    return topicSummaries.filter(summary => {
      const matchesExam = selectedExam === 'all' || summary.examType === selectedExam;
      const matchesSearch =
        summary.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        summary.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
        summary.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
      return matchesExam && matchesSearch;
    });
  }, [selectedExam, searchTerm]);

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50 to-slate-50 p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-4">
            <div className="rounded-2xl bg-white p-3 shadow-inner">
              <FileText className="h-7 w-7 text-indigo-600" />
            </div>
            <div>
              <p className="inline-flex items-center gap-2 rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-700">
                <Sparkles className="h-3.5 w-3.5" />
                Sınav Öncesi Hızlı Tekrar
              </p>
              <h2 className="mt-3 text-2xl font-bold text-gray-900">Konu Özetleri</h2>
              <p className="mt-2 text-sm text-gray-600">
                Problemler, paragraf ve diğer kritik konular için yapay zekâ destekli ekiplerimizin
                hazırladığı kısa PDF özetleri. En çok çıkan soru tiplerine odaklan, sınav öncesi son
                turunu hızlandır.
              </p>
            </div>
          </div>

          <div className="flex w-full flex-col gap-3 lg:w-auto">
            <div className="flex items-center gap-2 rounded-xl bg-white px-4 py-2 shadow-sm">
              <Filter className="h-4 w-4 text-indigo-500" />
              <p className="text-sm font-medium text-gray-700">
                {filteredSummaries.length} özet listeleniyor
              </p>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {examFilters.map(filter => (
                <button
                  key={filter.value}
                  type="button"
                  onClick={() => setSelectedExam(filter.value)}
                  className={clsx(
                    'rounded-xl border px-4 py-2 text-sm font-medium transition',
                    selectedExam === filter.value
                      ? 'border-indigo-500 bg-indigo-500 text-white shadow-lg shadow-indigo-200'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-indigo-200 hover:text-indigo-600'
                  )}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-sm">
          <input
            type="search"
            value={searchTerm}
            onChange={event => setSearchTerm(event.target.value)}
            placeholder="Konu, ders veya etiket ara..."
            className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 shadow-sm transition focus:border-indigo-500 focus:outline-none focus:ring focus:ring-indigo-200"
          />
          <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-gray-400">
            <span className="text-xs uppercase tracking-wide">Ara</span>
          </div>
        </div>
        <div className="rounded-xl bg-indigo-50 px-4 py-2 text-xs font-medium text-indigo-700 shadow-sm">
          PDF’ler düzenli olarak güncellenir. Öneri ve fikirler için destek@basariyolum.com – son güncelleme {filteredSummaries[0]?.updatedAt || '2025'}.
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {filteredSummaries.map(summary => (
          <article
            key={summary.id}
            className="group flex h-full flex-col justify-between rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <span className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-700">
                  {summary.examType}
                </span>
                <span
                  className={clsx(
                    'rounded-full px-3 py-1 text-xs font-semibold',
                    difficultyColors[summary.difficulty] || 'bg-slate-100 text-slate-600'
                  )}
                >
                  {summary.difficulty}
                </span>
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 group-hover:text-indigo-600">
                  {summary.title}
                </h3>
                <p className="mt-1 text-sm font-medium text-indigo-500">{summary.subject}</p>
              </div>
              <p className="text-sm text-gray-600">{summary.description}</p>

              <ul className="space-y-2">
                {summary.focusPoints.map(point => (
                  <li key={point} className="flex items-start gap-2 text-sm text-gray-600">
                    <Sparkles className="mt-0.5 h-3.5 w-3.5 text-amber-500" />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-6 space-y-3">
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span className="inline-flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  Önerilen: {summary.duration}
                </span>
                <span>Güncelleme: {summary.updatedAt}</span>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
                {summary.tags.map(tag => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-[11px] font-medium text-gray-600"
                  >
                    <Tag className="h-3 w-3" />
                    {tag}
                  </span>
                ))}
              </div>

              <a
                href={summary.pdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-200 transition hover:bg-indigo-700"
              >
                <Download className="h-4 w-4" />
                Özet PDF’i indir
              </a>
            </div>
          </article>
        ))}
      </div>

      {filteredSummaries.length === 0 && (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white py-16 text-center">
          <p className="text-sm font-semibold text-gray-700">Eşleşen konu özeti bulunamadı.</p>
          <p className="mt-2 text-xs text-gray-500">
            Farklı bir sınav türü seçebilir veya arama teriminizi güncelleyebilirsiniz.
          </p>
        </div>
      )}
    </div>
  );
}
