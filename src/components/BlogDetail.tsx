import { useEffect, useMemo, useState } from 'react';
import {
  Clock,
  Calendar,
  Tag,
  ArrowLeft,
  Share2,
  Facebook,
  Twitter,
  Linkedin,
  BookmarkPlus,
  Sparkles,
  Target,
} from 'lucide-react';
import { blogPosts, BlogPost } from '../data/blogPosts';
import ReactMarkdown from 'react-markdown';

interface BlogDetailProps {
  slug: string;
  onNavigateBack: () => void;
}

export default function BlogDetail({ slug, onNavigateBack }: BlogDetailProps) {
  const [post, setPost] = useState<BlogPost | null>(null);

  useEffect(() => {
    const foundPost = blogPosts.find((candidate) => candidate.slug === slug);
    if (foundPost) {
      setPost(foundPost);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      onNavigateBack();
    }
  }, [slug, onNavigateBack]);

  const relatedPosts = useMemo(() => {
    if (!post) {
      return [];
    }
    return blogPosts
      .filter((candidate) => candidate.id !== post.id && candidate.category === post.category)
      .slice(0, 3);
  }, [post]);

  const handleShare = async (platform: 'twitter' | 'facebook' | 'linkedin' | 'copy') => {
    if (!post) {
      return;
    }
    const url = window.location.href;
    const title = post.title;

    switch (platform) {
      case 'twitter':
        window.open(
          `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`,
          '_blank',
        );
        break;
      case 'facebook':
        window.open(
          `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
          '_blank',
        );
        break;
      case 'linkedin':
        window.open(
          `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
          '_blank',
        );
        break;
      case 'copy':
        await navigator.clipboard.writeText(url);
        alert('Bağlantı panoya kopyalandı!');
        break;
    }
  };

  if (!post) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="relative h-96 bg-gradient-to-br from-blue-600 to-purple-600">
        <img
          src={post.coverImage}
          alt={post.title}
          className="w-full h-full object-cover opacity-30"
          loading="eager"
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <button
              onClick={onNavigateBack}
              className="inline-flex items-center gap-2 text-white mb-6 hover:gap-3 transition-all"
            >
              <ArrowLeft className="h-5 w-5" />
              Blog'a Dön
            </button>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">{post.title}</h1>
            <div className="flex items-center justify-center gap-6 text-white/90 flex-wrap">
              <span className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                {new Date(post.publishedAt).toLocaleDateString('tr-TR', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </span>
              <span className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                {post.readTime} dakika okuma
              </span>
              <span className="flex items-center gap-2">
                <BookmarkPlus className="h-5 w-5" />
                {post.tags.join(', ')}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-12 grid lg:grid-cols-[1fr_320px] gap-8">
        <article className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8">
          <div className="flex items-center gap-4 border-b border-gray-100 dark:border-gray-700 pb-6 mb-6">
            <div className="h-16 w-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 text-white flex items-center justify-center text-2xl font-bold">
              {post.author.charAt(0)}
            </div>
            <div>
              <p className="font-semibold text-gray-900 dark:text-white">{post.author}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">{post.authorRole}</p>
            </div>
          </div>

          <div className="prose dark:prose-invert prose-lg max-w-none prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline">
            <ReactMarkdown>{post.content}</ReactMarkdown>
          </div>

          <div className="mt-10 flex flex-wrap gap-3">
            {post.tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-2 rounded-full bg-blue-50 dark:bg-blue-500/10 px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-300"
              >
                <Tag className="h-4 w-4" />
                {tag}
              </span>
            ))}
          </div>
        </article>

        <aside className="space-y-8">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 sticky top-28">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Share2 className="h-5 w-5" />
              Yazıyı Paylaş
            </h2>
            <div className="space-y-2">
              <button
                onClick={() => handleShare('twitter')}
                className="w-full inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 dark:border-gray-700 px-4 py-2.5 text-sm font-semibold text-gray-700 dark:text-gray-200 transition-colors hover:border-blue-600 hover:text-blue-600"
              >
                <Twitter className="h-4 w-4" />
                Twitter'da Paylaş
              </button>
              <button
                onClick={() => handleShare('facebook')}
                className="w-full inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 dark:border-gray-700 px-4 py-2.5 text-sm font-semibold text-gray-700 dark:text-gray-200 transition-colors hover:border-blue-600 hover:text-blue-600"
              >
                <Facebook className="h-4 w-4" />
                Facebook'ta Paylaş
              </button>
              <button
                onClick={() => handleShare('linkedin')}
                className="w-full inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 dark:border-gray-700 px-4 py-2.5 text-sm font-semibold text-gray-700 dark:text-gray-200 transition-colors hover:border-blue-600 hover:text-blue-600"
              >
                <Linkedin className="h-4 w-4" />
                LinkedIn'de Paylaş
              </button>
              <button
                onClick={() => handleShare('copy')}
                className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
              >
                Bağlantıyı Kopyala
              </button>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              Blog bültenine katıl
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
              Haftalık canlı etkinlikler, deneme analiz şablonları ve yeni blog yazılarımızı
              ilk öğrenen olmak için e-posta listemize katıl.
            </p>
            <a
              href="mailto:destek@basariyolum.com?subject=Blog%20B%C3%BClteni%20Kayd%C4%B1"
              className="inline-flex items-center justify-center gap-2 w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
            >
              <Sparkles className="h-4 w-4" />
              Ücretsiz Kaydol
            </a>
          </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <Target className="h-5 w-5" />
                BaşarıYolu ile tanış
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                Yapay zekâ destekli ders planları, pomodoro takip sistemi ve koçluk görüşmeleriyle
                sınav hazırlığını tek platformda yönet.
              </p>
              <div className="flex flex-col gap-3">
                <a
                  href="/#pricing"
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
                >
                  Planları İncele
                </a>
                <a
                  href="/#teacher"
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 dark:border-gray-700 px-4 py-2.5 text-sm font-semibold text-gray-700 dark:text-gray-200 transition-colors hover:border-blue-600 hover:text-blue-600"
                >
                  Demo Talep Et
                </a>
              </div>
            </div>
        </aside>
      </div>

      <div className="max-w-6xl mx-auto px-4 pb-16">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Diğer önerilen içerikler
          </h2>
          {relatedPosts.length === 0 ? (
            <p className="text-gray-600 dark:text-gray-300">
              Bu kategori için başka içerik ekleniyor. Yakında yeni yazılarla güncellenecek.
            </p>
          ) : (
            <div className="grid md:grid-cols-3 gap-6">
              {relatedPosts.map((related) => (
                <a
                  key={related.id}
                  href={`/blog/${related.slug}`}
                  onClick={(event) => {
                    event.preventDefault();
                    window.history.pushState({}, '', `/blog/${related.slug}`);
                    window.dispatchEvent(new PopStateEvent('popstate'));
                  }}
                  className="group bg-gray-50 dark:bg-gray-900 rounded-xl p-6 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors"
                >
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                    {new Date(related.publishedAt).toLocaleDateString('tr-TR')}
                  </p>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2">
                    {related.title}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-3">
                    {related.excerpt}
                  </p>
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
