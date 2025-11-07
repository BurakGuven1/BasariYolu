import { useMemo, useState } from 'react';
import { Clock, Calendar, Tag, ArrowRight } from 'lucide-react';
import { blogPosts, categories } from '../data/blogPosts';

interface BlogListProps {
  onNavigateToDetail: (slug: string) => void;
}

const normalize = (value: string) =>
  value
    .toLocaleLowerCase('tr-TR')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ğ/g, 'g')
    .replace(/ı/g, 'i')
    .replace(/ç/g, 'c')
    .replace(/ö/g, 'o')
    .replace(/ş/g, 's')
    .replace(/ü/g, 'u');

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
      blogPosts
        .filter((post) => post.featured)
        .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt)),
    [],
  );

  const handleNavigate = (
    event: React.MouseEvent<HTMLAnchorElement>,
    slug: string,
  ) => {
    event.preventDefault();
    onNavigateToDetail(slug);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-12">
      <div className="mx-auto max-w-7xl px-4">
        <div className="mb-12 text-center">
          <h1 className="mb-4 text-4xl font-bold text-gray-900">
            BaşarıYolu Blog
          </h1>
          <p className="mx-auto max-w-2xl text-xl text-gray-600">
            Doğru çalışma teknikleri, sınav stratejileri ve motivasyon için bilimsel
            temelli içerikler. YKS ve LGS hedeflerine giden yolu birlikte planlayalım.
          </p>
        </div>

        <div className="mx-auto mb-8 max-w-2xl">
          <label htmlFor="blog-search" className="sr-only">
            Blog yazılarında ara
          </label>
          <input
            id="blog-search"
            type="text"
            placeholder="Blog yazılarında ara..."
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="mb-12 flex flex-wrap justify-center gap-4">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`rounded-full px-6 py-2 font-medium transition-colors ${
              selectedCategory === 'all'
                ? 'bg-blue-600 text-white'
                : 'border border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            Tüm Yazılar
          </button>
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`rounded-full px-6 py-2 font-medium transition-colors ${
                selectedCategory === category.id
                  ? 'bg-blue-600 text-white'
                  : 'border border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              <span className="mr-2" aria-hidden="true">
                {category.icon}
              </span>
              {category.name}
            </button>
          ))}
        </div>

        {selectedCategory === 'all' && !searchQuery && featuredPosts.length > 0 && (
          <div className="mb-16">
            <h2 className="mb-6 text-2xl font-bold text-gray-900">
              Öne Çıkan Yazılar
            </h2>
            <div className="grid gap-8 md:grid-cols-2">
              {featuredPosts.map((post) => (
                <a
                  key={post.id}
                  href={`/blog/${post.slug}`}
                  onClick={(event) => handleNavigate(event, post.slug)}
                  className="group overflow-hidden rounded-xl border border-gray-100 bg-white shadow-lg transition-shadow hover:shadow-2xl"
                >
                  <div className="relative h-64 overflow-hidden">
                    <img
                      src={post.coverImage}
                      alt={post.title}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    <div className="absolute right-4 top-4 rounded-full bg-blue-600 px-3 py-1 text-sm font-semibold text-white">
                      Öne Çıkan
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="mb-3 flex items-center gap-4 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {new Date(post.publishedAt).toLocaleDateString('tr-TR')}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {post.readTime} dk okuma
                      </span>
                    </div>
                    <h3 className="mb-2 text-xl font-bold text-gray-900 transition-colors group-hover:text-blue-600">
                      {post.title}
                    </h3>
                    <p className="mb-4 text-gray-600">{post.excerpt}</p>
                    <div className="flex items-center justify-between">
                      <div className="text-sm">
                        <p className="font-semibold text-gray-900">{post.author}</p>
                        <p className="text-gray-500">{post.authorRole}</p>
                      </div>
                      <ArrowRight className="h-5 w-5 text-blue-600 transition-transform group-hover:translate-x-1" />
                    </div>
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}

        <div>
          <h2 className="mb-6 text-2xl font-bold text-gray-900">
            {selectedCategory === 'all'
              ? 'Tüm Yazılar'
              : categories.find((category) => category.id === selectedCategory)?.name}
          </h2>
          <div className="grid gap-8 md:grid-cols-3">
            {filteredPosts.map((post) => (
              <a
                key={post.id}
                href={`/blog/${post.slug}`}
                onClick={(event) => handleNavigate(event, post.slug)}
                className="group overflow-hidden rounded-xl border border-gray-100 bg-white shadow-md transition-shadow hover:shadow-xl"
              >
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={post.coverImage}
                    alt={post.title}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                </div>
                <div className="p-5">
                  <div className="mb-2 flex items-center gap-3 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(post.publishedAt).toLocaleDateString('tr-TR')}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {post.readTime} dk
                    </span>
                  </div>
                  <h3 className="mb-2 line-clamp-2 text-lg font-bold text-gray-900 transition-colors group-hover:text-blue-600">
                    {post.title}
                  </h3>
                  <p className="mb-3 line-clamp-3 text-sm text-gray-600">{post.excerpt}</p>
                  <div className="mb-3 flex flex-wrap gap-2">
                    {post.tags.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1 rounded border border-gray-200 bg-gray-100 px-2 py-1 text-xs text-gray-700"
                      >
                        <Tag className="h-3 w-3" />
                        {tag}
                      </span>
                    ))}
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-gray-700">{post.author}</span>
                    <ArrowRight className="h-4 w-4 text-blue-600 transition-transform group-hover:translate-x-1" />
                  </div>
                </div>
              </a>
            ))}
          </div>
        </div>

        {filteredPosts.length === 0 && (
          <div className="py-16 text-center">
            <p className="text-xl text-gray-600">
              Aradığın kriterlere uygun blog yazısı bulunamadı. Farklı bir anahtar kelime dene
              veya tüm kategorileri görüntüle.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
