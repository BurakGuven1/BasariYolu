import { useMemo, useState } from 'react';
import {
  Clock,
  Calendar,
  Tag,
  ArrowRight,
  Rocket,
  Trophy,
  Sparkles,
} from 'lucide-react';
import { blogPosts, categories } from '../data/blogPosts';

interface BlogListProps {
  onNavigateToDetail: (slug: string) => void;
}

const normalize = (value: string) =>
  value
    .toLocaleLowerCase('tr-TR')
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ı/g, 'i')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c');

export default function BlogList({ onNavigateToDetail }: BlogListProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredPosts = useMemo(() => {
    const query = normalize(searchQuery.trim());
    return blogPosts.filter((post) => {
      const matchesCategory =
        selectedCategory === 'all' || post.category === selectedCategory;
      const haystack = `${post.title} ${post.excerpt} ${post.tags.join(' ')}`;
      const matchesSearch = normalize(haystack).includes(query);
      return matchesCategory && matchesSearch;
    });
  }, [searchQuery, selectedCategory]);

  const featuredPosts = useMemo(
    () =>
      blogPosts.filter((post) => post.featured).sort((a, b) =>
        b.publishedAt.localeCompare(a.publishedAt),
      ),
    [],
  );

  const handleNavigate = (event: React.MouseEvent<HTMLAnchorElement>, slug: string) => {
    event.preventDefault();
    onNavigateToDetail(slug);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            BaşarıYolu Blog
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Doğru çalışma teknikleri, sınav stratejileri ve motivasyon için bilimsel
            temelli içerikler. YKS ve LGS hedeflerine giden yolu birlikte planlayalım.
          </p>
        </div>

        <div className="grid md:grid-cols-[2fr,3fr] gap-6 mb-10">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 text-left">
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 rounded-full bg-blue-600/10 text-blue-600 flex items-center justify-center">
                <Rocket className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-semibold uppercase tracking-wide text-blue-600 mb-2">
                  Ücretsiz Başlangıç Planı
                </p>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white leading-snug mb-3">
                  Yapay zekâ destekli çalışma planını 7 gün ücretsiz dene
                </h2>
                <p className="text-gray-600 dark:text-gray-300 text-sm">
                  Blog içeriklerimizden ilham aldıysan, BaşarıYolu öğrenci paneliyle
                  kişiselleştirilmiş ders programları, canlı pomodoro seansları ve
                  detaylı raporlarla hedeflerine daha hızlı ulaş.
                </p>
              </div>
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <a
                href="/#pricing"
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
              >
                <Sparkles className="h-4 w-4" />
                Paketleri Keşfet
              </a>
              <a
                href="/#teacher"
                className="inline-flex items-center gap-2 rounded-lg border border-gray-200 dark:border-gray-700 px-5 py-2 text-sm font-semibold text-gray-700 dark:text-gray-200 transition-colors hover:border-blue-600 hover:text-blue-600"
              >
                <Trophy className="h-4 w-4" />
                Demo Talep Et
              </a>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
            <p className="text-sm font-semibold uppercase tracking-wide text-blue-600 mb-3">
              Sınav Takvimi Hatırlatmaları
            </p>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Haftalık motivasyon e-postalarına abone ol
            </h2>
            <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">
              Yeni blog içeriklerimiz, deneme analiz şablonları ve canlı etkinlik
              duyurularını içeren kısa e-postalar gönderiyoruz. Spam yok, sadece işe
              yarar içerik.
            </p>
            <form
              className="flex flex-col sm:flex-row gap-3"
              onSubmit={(event) => {
                event.preventDefault();
                const form = event.currentTarget;
                const email = (form.elements.namedItem('email') as HTMLInputElement)?.value;
                if (!email) {
                  return;
                }
                const subscribeUrl = `mailto:destek@basariyolum.com?subject=Blog%20B%C3%BClteni%20Kayd%C4%B1&body=E-posta:%20${encodeURIComponent(
                  email,
                )}`;
                window.open(subscribeUrl, '_blank');
              }}
            >
              <input
                type="email"
                name="email"
                required
                placeholder="E-posta adresin"
                aria-label="E-posta adresin"
                className="flex-1 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-3 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                className="rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
              >
                Abone Ol
              </button>
            </form>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              Dilediğin zaman tek tıkla abonelikten çıkabilirsin.
            </p>
          </div>
        </div>

        <div className="mb-8 max-w-2xl mx-auto">
          <label htmlFor="blog-search" className="sr-only">
            Blog yazılarında ara
          </label>
          <input
            id="blog-search"
            type="text"
            placeholder="Blog yazılarında ara..."
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex flex-wrap justify-center gap-4 mb-12">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-6 py-2 rounded-full font-medium transition-colors ${
              selectedCategory === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            Tümü
          </button>
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`px-6 py-2 rounded-full font-medium transition-colors ${
                selectedCategory === category.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <span className="mr-2" aria-hidden>
                {category.icon}
              </span>
              {category.name}
            </button>
          ))}
        </div>

        {selectedCategory === 'all' && !searchQuery && featuredPosts.length > 0 && (
          <div className="mb-16">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              Öne Çıkan Yazılar
            </h2>
            <div className="grid md:grid-cols-2 gap-8">
              {featuredPosts.map((post) => (
                <a
                  key={post.id}
                  href={`/blog/${post.slug}`}
                  onClick={(event) => handleNavigate(event, post.slug)}
                  className="group bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-shadow"
                >
                  <div className="relative h-64 overflow-hidden">
                    <img
                      src={post.coverImage}
                      alt={post.title}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-4 right-4 bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
                      Öne Çıkan
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mb-3">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {new Date(post.publishedAt).toLocaleDateString('tr-TR')}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {post.readTime} dk okuma
                      </span>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {post.title}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300 mb-4">
                      {post.excerpt}
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="text-sm">
                        <p className="font-semibold text-gray-900 dark:text-white">
                          {post.author}
                        </p>
                        <p className="text-gray-500 dark:text-gray-400">{post.authorRole}</p>
                      </div>
                      <ArrowRight className="h-5 w-5 text-blue-600 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}

        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            {selectedCategory === 'all'
              ? 'Tüm Yazılar'
              : categories.find((category) => category.id === selectedCategory)?.name}
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {filteredPosts.map((post) => (
              <a
                key={post.id}
                href={`/blog/${post.slug}`}
                onClick={(event) => handleNavigate(event, post.slug)}
                className="group bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-shadow"
              >
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={post.coverImage}
                    alt={post.title}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <div className="p-5">
                  <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 mb-2">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(post.publishedAt).toLocaleDateString('tr-TR')}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {post.readTime} dk
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2">
                    {post.title}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-3 line-clamp-3">
                    {post.excerpt}
                  </p>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {post.tags.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-700 text-xs text-gray-600 dark:text-gray-300 rounded"
                      >
                        <Tag className="h-3 w-3" />
                        {tag}
                      </span>
                    ))}
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-gray-700 dark:text-gray-300">
                      {post.author}
                    </span>
                    <ArrowRight className="h-4 w-4 text-blue-600 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </a>
            ))}
          </div>
        </div>

        {filteredPosts.length === 0 && (
          <div className="text-center py-16">
            <p className="text-xl text-gray-500 dark:text-gray-400">
              Aradığın kriterlere uygun blog yazısı bulunamadı. Farklı bir anahtar kelime dene
              veya tüm kategorileri görüntüle.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
