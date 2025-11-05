const SITE_NAME = 'BaşarıYolu';
const DEFAULT_DESCRIPTION =
  'BaşarıYolu ile YKS ve LGS hazırlığını yapay zeka destekli çalışma planları, zengin kaynaklar ve uzman rehberliğiyle güçlendir.';
const DEFAULT_IMAGE = '/logo.svg';

type StructuredData = Record<string, unknown> | Record<string, unknown>[];

export interface SeoConfig {
  title: string;
  description?: string;
  path?: string;
  type?: 'website' | 'article' | 'blog' | 'product';
  image?: string;
  keywords?: string[];
  publishedTime?: string;
  modifiedTime?: string;
  noIndex?: boolean;
  structuredData?: StructuredData;
}

const getBaseUrl = () => {
  if (typeof window !== 'undefined' && window.location.origin) {
    return window.location.origin;
  }

  const envUrl = (import.meta as any)?.env?.VITE_SITE_URL;
  if (envUrl) {
    return String(envUrl).replace(/\/+$/, '');
  }

  return 'https://www.basariyolum.com';
};

const ensureMetaTag = (selector: string, attributes: Record<string, string>) => {
  const head = document.head || document.getElementsByTagName('head')[0];
  let element = head.querySelector<HTMLMetaElement>(selector);

  if (!element) {
    element = document.createElement('meta');
    Object.entries(attributes).forEach(([key, value]) => {
      element!.setAttribute(key, value);
    });
    element.setAttribute('data-dynamic-seo', 'true');
    head.appendChild(element);
    return element;
  }

  element.setAttribute('data-dynamic-seo', 'true');
  return element;
};

const setMetaContent = (selector: string, attributes: Record<string, string>, content?: string) => {
  if (!content) {
    return;
  }

  const element = ensureMetaTag(selector, attributes);
  element.setAttribute('content', content);
};

const setCanonicalLink = (url: string) => {
  const head = document.head || document.getElementsByTagName('head')[0];
  let link = head.querySelector<HTMLLinkElement>('link[rel="canonical"]');

  if (!link) {
    link = document.createElement('link');
    link.setAttribute('rel', 'canonical');
    link.setAttribute('data-dynamic-seo', 'true');
    head.appendChild(link);
  }

  link.setAttribute('href', url);
  link.setAttribute('data-dynamic-seo', 'true');
};

const clearPreviousDynamicSeo = () => {
  const previous = document.head.querySelectorAll('[data-dynamic-seo="true"]');
  previous.forEach((node) => {
    node.parentNode?.removeChild(node);
  });
};

const injectStructuredData = (data: StructuredData) => {
  if (!data) {
    return;
  }

  const head = document.head || document.getElementsByTagName('head')[0];
  const script = document.createElement('script');
  script.type = 'application/ld+json';
  script.setAttribute('data-dynamic-seo', 'true');
  script.text = JSON.stringify(data);
  head.appendChild(script);
};

export const applySeo = (config: SeoConfig) => {
  if (typeof document === 'undefined') {
    return;
  }

  clearPreviousDynamicSeo();

  const {
    title,
    description = DEFAULT_DESCRIPTION,
    path = window.location.pathname,
    type = 'website',
    image = DEFAULT_IMAGE,
    keywords,
    publishedTime,
    modifiedTime,
    noIndex,
    structuredData,
  } = config;

  const baseUrl = getBaseUrl();
  const canonicalUrl = `${baseUrl}${path.startsWith('/') ? '' : '/'}${path}`;

  document.title = title;

  setMetaContent('meta[name="description"]', { name: 'description' }, description);
  setMetaContent('meta[property="og:title"]', { property: 'og:title' }, title);
  setMetaContent('meta[property="og:description"]', { property: 'og:description' }, description);
  setMetaContent('meta[property="og:type"]', { property: 'og:type' }, type);
  setMetaContent('meta[property="og:url"]', { property: 'og:url' }, canonicalUrl);
  setMetaContent('meta[property="og:site_name"]', { property: 'og:site_name' }, SITE_NAME);
  setMetaContent('meta[property="og:locale"]', { property: 'og:locale' }, 'tr_TR');
  setMetaContent('meta[property="og:image"]', { property: 'og:image' }, image.startsWith('http') ? image : `${baseUrl}${image}`);

  setMetaContent('meta[name="twitter:card"]', { name: 'twitter:card' }, 'summary_large_image');
  setMetaContent('meta[name="twitter:title"]', { name: 'twitter:title' }, title);
  setMetaContent('meta[name="twitter:description"]', { name: 'twitter:description' }, description);
  setMetaContent('meta[name="twitter:image"]', { name: 'twitter:image' }, image.startsWith('http') ? image : `${baseUrl}${image}`);

  if (keywords?.length) {
    setMetaContent('meta[name="keywords"]', { name: 'keywords' }, keywords.join(', '));
  }

  const robotsContent = noIndex ? 'noindex, nofollow' : 'index, follow';
  setMetaContent('meta[name="robots"]', { name: 'robots' }, robotsContent);

  if (publishedTime) {
    setMetaContent('meta[property="article:published_time"]', { property: 'article:published_time' }, publishedTime);
  }

  if (modifiedTime) {
    setMetaContent('meta[property="article:modified_time"]', { property: 'article:modified_time' }, modifiedTime);
  }

  setCanonicalLink(canonicalUrl);
  injectStructuredData(structuredData ?? getDefaultStructuredData(baseUrl));
};

const getDefaultStructuredData = (baseUrl: string) => ({
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: SITE_NAME,
  url: baseUrl,
  logo: `${baseUrl}/logo.svg`,
  sameAs: [
    'https://www.instagram.com/basari_yolumm',
  ],
  description: DEFAULT_DESCRIPTION,
});

export const getOrganizationStructuredData = (baseUrl?: string) => {
  const origin = baseUrl ?? getBaseUrl();
  return getDefaultStructuredData(origin);
};

export const getBlogListingStructuredData = (posts: { title: string; slug: string; excerpt: string }[], baseUrl?: string) => {
  const origin = baseUrl ?? getBaseUrl();
  return {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    name: `${SITE_NAME} Blog`,
    description:
      'YKS ve LGS hazırlığı için çalışma planları, sınav stratejileri ve motivasyon ipuçları.',
    url: `${origin}/blog`,
    blogPost: posts.map((post) => ({
      '@type': 'BlogPosting',
      headline: post.title,
      url: `${origin}/blog/${post.slug}`,
      description: post.excerpt,
    })),
  };
};

export const getBlogPostStructuredData = (post: {
  title: string;
  slug: string;
  excerpt: string;
  author: string;
  publishedAt: string;
  updatedAt?: string;
  coverImage?: string;
}) => {
  const baseUrl = getBaseUrl();
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.excerpt,
    image: post.coverImage && post.coverImage.startsWith('http')
      ? post.coverImage
      : `${baseUrl}${post.coverImage ?? DEFAULT_IMAGE}`,
    author: {
      '@type': 'Person',
      name: post.author,
    },
    publisher: {
      '@type': 'Organization',
      name: SITE_NAME,
      logo: {
      '@type': 'ImageObject',
      url: `${baseUrl}/logo.svg`,
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${baseUrl}/blog/${post.slug}`,
    },
    datePublished: post.publishedAt,
    dateModified: post.updatedAt ?? post.publishedAt,
  };
};
