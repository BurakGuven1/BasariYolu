import { useMemo, useState } from 'react';
import { FileText, Filter, Download, Clock, Sparkles, Tag } from 'lucide-react';
import clsx from 'clsx';
import type { GradeLevel, SubjectTopicGroup } from '../data/topicSummaries';
import { gradeTopicSummaries } from '../data/topicSummaries';

const difficultyColors: Record<string, string> = {
  Kolay: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  Orta: 'bg-amber-50 text-amber-700 border border-amber-200',
  Zor: 'bg-rose-50 text-rose-700 border border-rose-200'
};

const gradeOptions = gradeTopicSummaries.map(grade => ({
  value: grade.grade,
  label: grade.label
}));

const initialGrade = (gradeOptions[0]?.value ?? 5) as GradeLevel;

export default function TopicSummariesSection() {
  const [selectedGrade, setSelectedGrade] = useState<GradeLevel>(initialGrade);
  const [searchTerm, setSearchTerm] = useState('');

  const currentGrade = useMemo(
    () => gradeTopicSummaries.find(grade => grade.grade === selectedGrade),
    [selectedGrade]
  );

  const filteredSubjects = useMemo(() => {
    if (!currentGrade) {
      return [] as SubjectTopicGroup[];
    }

    const normalizedSearch = searchTerm.trim().toLowerCase();

    if (!normalizedSearch) {
      return currentGrade.subjects;
    }

    return currentGrade.subjects
      .map(subject => {
        const matchesSubjectMeta =
          subject.name.toLowerCase().includes(normalizedSearch) ||
          subject.description.toLowerCase().includes(normalizedSearch);

        const filteredTopics = matchesSubjectMeta
          ? subject.topics
          : subject.topics.filter(topic => {
              return (
                topic.title.toLowerCase().includes(normalizedSearch) ||
                topic.description.toLowerCase().includes(normalizedSearch) ||
                topic.tags.some(tag => tag.toLowerCase().includes(normalizedSearch))
              );
            });

        return {
          ...subject,
          topics: filteredTopics
        };
      })
      .filter(subject => subject.topics.length > 0);
  }, [currentGrade, searchTerm]);

  const totalTopics = filteredSubjects.reduce((count, subject) => count + subject.topics.length, 0);

  const lastUpdated = useMemo(() => {
    if (!currentGrade) {
      return '';
    }

    const allTopics = currentGrade.subjects.flatMap(subject => subject.topics);
    if (allTopics.length === 0) {
      return '';
    }

    return allTopics.reduce(
      (latest, topic) => (topic.updatedAt > latest ? topic.updatedAt : latest),
      allTopics[0].updatedAt
    );
  }, [currentGrade]);

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
                Sınıfa göre PDF kütüphanesi
              </p>
              <h2 className="mt-3 text-2xl font-bold text-gray-900">Konu özetleri</h2>
              <p className="mt-2 text-sm text-gray-600">
                {currentGrade?.info ||
                  '5. sınıftan 12. sınıfa kadar her ders için pdf özetleri burada listelenir.'}
              </p>
            </div>
          </div>

          <div className="flex w-full flex-col gap-3 lg:w-auto">
            <div className="flex items-center gap-2 rounded-xl bg-white px-4 py-2 shadow-sm">
              <Filter className="h-4 w-4 text-indigo-500" />
              <p className="text-sm font-medium text-gray-700">
                {totalTopics} özet listeleniyor
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-8">
              {gradeOptions.map(filter => (
                <button
                  key={filter.value}
                  type="button"
                  onClick={() => setSelectedGrade(filter.value)}
                  className={clsx(
                    'rounded-xl border px-4 py-2 text-sm font-medium transition',
                    selectedGrade === filter.value
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
          PDF'ler düzenli olarak güncellenir. Öneri ve fikirler için destek@basariyolum.com — son
          güncelleme {lastUpdated || '2025'}.
        </div>
      </div>

      <div className="space-y-5">
        {filteredSubjects.map(subject => (
          <section
            key={`${selectedGrade}-${subject.id}`}
            className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm"
          >
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-indigo-500">
                  {currentGrade?.label} • {subject.name}
                </p>
                <h3 className="text-lg font-bold text-gray-900">{subject.name}</h3>
                <p className="text-sm text-gray-600">{subject.description}</p>
              </div>
              <span className="text-xs font-semibold text-gray-500">
                {subject.topics.length} konu
              </span>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              {subject.topics.map(topic => (
                <article
                  key={topic.id}
                  className="group flex h-full flex-col justify-between rounded-2xl border border-gray-100 bg-slate-50/80 p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-200 hover:bg-white"
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between gap-3">
                      <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
                        {subject.name}
                      </span>
                      <span
                        className={clsx(
                          'rounded-full px-3 py-1 text-xs font-semibold',
                          difficultyColors[topic.difficulty] || 'bg-slate-100 text-slate-600'
                        )}
                      >
                        {topic.difficulty}
                      </span>
                    </div>
                    <div>
                      <h4 className="text-base font-bold text-gray-900 group-hover:text-indigo-600">
                        {topic.title}
                      </h4>
                      <p className="mt-1 text-sm text-gray-600">{topic.description}</p>
                    </div>

                    <ul className="space-y-2">
                      {topic.focusPoints.map(point => (
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
                        Önerilen: {topic.duration}
                      </span>
                      <span>Güncelleme: {topic.updatedAt}</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
                      {topic.tags.map(tag => (
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
                      href={topic.pdfUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-200 transition hover:bg-indigo-700"
                    >
                      <Download className="h-4 w-4" />
                      PDF'yi indir
                    </a>
                  </div>
                </article>
              ))}
            </div>
          </section>
        ))}
      </div>

      {filteredSubjects.length === 0 && (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white py-16 text-center">
          <p className="text-sm font-semibold text-gray-700">
            {currentGrade?.label} için eşleşen konu özeti bulunamadı.
          </p>
          <p className="mt-2 text-xs text-gray-500">
            Farklı bir sınıf seçebilir veya arama teriminizi güncelleyebilirsiniz.
          </p>
        </div>
      )}
    </div>
  );
}
