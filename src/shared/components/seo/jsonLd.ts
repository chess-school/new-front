// Хелперы Schema.org (JSON-LD) для расширенных сниппетов в Google/Yandex.
export const SITE_URL = 'https://chess.motorcycles';
export const SITE_NAME = 'debiut — платформа для шахматных клубов';

// nginx отдаёт вложенные маршруты как директории (301 /puzzles → /puzzles/), поэтому канонический
// URL для подстраниц — со слэшем на конце; корень остаётся '/'.
export const canonicalUrl = (path: string): string =>
  `${SITE_URL}${path === '/' ? '/' : path.replace(/\/+$/, '') + '/'}`;

/** Организация-школа: название, логотип, описание, контакты — для главной. */
export const organizationJsonLd = () => ({
  '@context': 'https://schema.org',
  '@type': 'EducationalOrganization',
  name: SITE_NAME,
  alternateName: 'debiut',
  url: SITE_URL,
  logo: `${SITE_URL}/images/chess-cinematic-lg.jpg`,
  description: 'Платформа для управления шахматным клубом: группы и тренеры, интерактивные курсы, онлайн-уроки на общей доске, электронный дневник и боты Telegram/WhatsApp.',
  sameAs: [] as string[],
});

/** Сайт с поисковым действием (sitelinks searchbox). */
export const webSiteJsonLd = () => ({
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: SITE_NAME,
  url: SITE_URL,
});

/** Курс/книга: название, автор, уровень, рейтинг, цена. */
export const courseJsonLd = (opts: {
  name: string;
  description?: string;
  url?: string;
  author?: string;
  level?: string;
  ratingValue?: number;
  ratingCount?: number;
  price?: number;
}) => ({
  '@context': 'https://schema.org',
  '@type': 'Course',
  name: opts.name,
  ...(opts.description ? { description: opts.description } : {}),
  ...(opts.url ? { url: opts.url } : {}),
  provider: { '@type': 'EducationalOrganization', name: SITE_NAME, sameAs: SITE_URL },
  ...(opts.author ? { author: { '@type': 'Person', name: opts.author } } : {}),
  ...(opts.level ? { educationalLevel: opts.level } : {}),
  ...(typeof opts.ratingValue === 'number' && opts.ratingCount
    ? { aggregateRating: { '@type': 'AggregateRating', ratingValue: opts.ratingValue, ratingCount: opts.ratingCount } }
    : {}),
  ...(typeof opts.price === 'number'
    ? { offers: { '@type': 'Offer', price: opts.price, priceCurrency: 'RUB', availability: 'https://schema.org/InStock' } }
    : {}),
});

/** Хлебные крошки для навигационной цепочки в поиске. items: [{name, path}] (path относительный) */
export const breadcrumbJsonLd = (items: { name: string; path: string }[]) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: items.map((it, i) => ({
    '@type': 'ListItem',
    position: i + 1,
    name: it.name,
    item: `${SITE_URL}${it.path}`,
  })),
});
