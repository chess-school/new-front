// Единый источник SEO-данных публичных маршрутов: используется и компонентом SEOHead (клиент),
// и build-плагином пререндера (инъекция <head> в статический HTML по маршрутам). БЕЗ импортов React!
import { organizationJsonLd, webSiteJsonLd, breadcrumbJsonLd, SITE_NAME, SITE_URL, canonicalUrl } from './jsonLd';

export interface SeoConfig {
  title: string;
  description: string;
  keywords?: string[];
  canonicalPath: string;
  ogType?: 'website' | 'article' | 'profile';
  jsonLd?: object[];
  noindex?: boolean;
}

const crumbs = (name: string, path: string) => [breadcrumbJsonLd([{ name: 'Главная', path: '/' }, { name, path }])];

export const SEO_ROUTES: Record<string, SeoConfig> = {
  '/': {
    title: 'Платформа для шахматных клубов и школ',
    description: 'debiut — всё для управления шахматным клубом: группы и тренеры, интерактивные курсы, онлайн-уроки на общей доске, электронный дневник успеваемости и уведомления в Telegram/WhatsApp. Создайте клуб бесплатно.',
    keywords: ['шахматный клуб', 'платформа для шахматной школы', 'управление клубом', 'онлайн-уроки шахмат', 'электронный дневник', 'шахматные задачи'],
    canonicalPath: '/',
    jsonLd: [organizationJsonLd(), webSiteJsonLd()],
  },
  '/about': {
    title: 'О школе debiut — онлайн-обучение шахматам',
    description: 'debiut — онлайн-школа шахмат: опытные тренеры, персональные занятия, интерактивный класс и тренажёры. Узнайте о нашем подходе к обучению.',
    canonicalPath: '/about',
    jsonLd: crumbs('О школе', '/about'),
  },
  '/achievements': {
    title: 'Достижения учеников шахматной школы',
    description: 'Результаты и достижения учеников онлайн-школы шахмат debiut: турниры, рейтинги, разряды.',
    canonicalPath: '/achievements',
    jsonLd: crumbs('Достижения', '/achievements'),
  },
  '/book': {
    title: 'База шахматных партий и дебютов онлайн',
    description: 'Интерактивная база шахматных партий и дебютов: просмотр, навигация по ходам и вариантам прямо в браузере.',
    canonicalPath: '/book',
    jsonLd: crumbs('База партий', '/book'),
  },
  '/analysis': {
    title: 'Шахматная доска и анализ с движком Stockfish онлайн',
    description: 'Бесплатный анализ шахматных позиций с движком Stockfish: оценка, лучшие ходы, варианты и стрелки прямо в браузере. Загрузите FEN или PGN.',
    keywords: ['анализ шахмат', 'stockfish онлайн', 'шахматный движок', 'оценка позиции', 'шахматная доска онлайн'],
    canonicalPath: '/analysis',
    jsonLd: crumbs('Анализ', '/analysis'),
  },
  '/rating': {
    title: 'Шахматный тренажёр — рейтинговый режим задач',
    description: 'Решайте шахматные задачи в рейтинговом режиме: сложность подстраивается под ваш уровень. Прокачайте тактику онлайн бесплатно.',
    canonicalPath: '/rating',
    jsonLd: crumbs('Рейтинг', '/rating'),
  },
  '/survival': {
    title: 'Шахматы на выживание — тактика на время',
    description: 'Режим «на выживание»: решайте тактические задачи на время, пока не закончатся жизни. Тренируйте скорость и точность расчёта.',
    canonicalPath: '/survival',
    jsonLd: crumbs('Выживание', '/survival'),
  },
  '/puzzles': {
    title: 'Шахматные задачи и тактика онлайн — решать бесплатно',
    description: 'Тысячи шахматных задач по темам (мат в 1-2-3, вилка, связка, эндшпиль) с подбором по рейтингу. Решайте тактику онлайн бесплатно.',
    keywords: ['шахматные задачи', 'тактика', 'мат в 2 хода', 'вилка', 'связка', 'решать шахматы онлайн'],
    canonicalPath: '/puzzles',
    jsonLd: crumbs('Задачи', '/puzzles'),
  },
  '/coaches': {
    title: 'Тренеры по шахматам онлайн — выбрать тренера',
    description: 'Выберите тренера по шахматам для персональных онлайн-занятий: профили, опыт и специализация. Запишитесь на урок в школе debiut.',
    keywords: ['тренер по шахматам', 'шахматный тренер онлайн', 'занятия с тренером'],
    canonicalPath: '/coaches',
    jsonLd: crumbs('Тренеры', '/coaches'),
  },
};

const OG_IMAGE = `${SITE_URL}/images/chess-cinematic-lg.jpg`;
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** Собрать теги <head> строкой — для build-пререндера статического HTML (без React/Helmet). */
export const renderSeoHead = (cfg: SeoConfig): string => {
  const fullTitle = cfg.title.includes(SITE_NAME) ? cfg.title : `${cfg.title} | debiut`;
  const canonical = canonicalUrl(cfg.canonicalPath);
  const kw = cfg.keywords?.join(', ');
  const tags = [
    `<title>${esc(fullTitle)}</title>`,
    `<meta name="description" content="${esc(cfg.description)}" />`,
    kw ? `<meta name="keywords" content="${esc(kw)}" />` : '',
    `<link rel="canonical" href="${canonical}" />`,
    cfg.noindex ? '<meta name="robots" content="noindex, nofollow" />' : '',
    `<meta property="og:site_name" content="${esc(SITE_NAME)}" />`,
    `<meta property="og:type" content="${cfg.ogType || 'website'}" />`,
    `<meta property="og:title" content="${esc(fullTitle)}" />`,
    `<meta property="og:description" content="${esc(cfg.description)}" />`,
    `<meta property="og:image" content="${OG_IMAGE}" />`,
    `<meta property="og:url" content="${canonical}" />`,
    '<meta property="og:locale" content="ru_RU" />',
    '<meta name="twitter:card" content="summary_large_image" />',
    `<meta name="twitter:image" content="${OG_IMAGE}" />`,
    ...(cfg.jsonLd || []).map((b) => `<script type="application/ld+json">${JSON.stringify(b)}</script>`),
  ];
  return tags.filter(Boolean).join('\n    ');
};
