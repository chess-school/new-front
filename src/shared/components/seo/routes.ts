// Single source of SEO data for public routes: used both by the SEOHead component (client)
// and by the build prerender plugin (injecting <head> into static HTML per route). NO React imports!
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

const crumbs = (name: string, path: string) => [breadcrumbJsonLd([{ name: 'Home', path: '/' }, { name, path }])];

export const SEO_ROUTES: Record<string, SeoConfig> = {
  '/': {
    title: 'Platform for chess clubs and schools',
    description: 'debiut — everything to run a chess club: groups and coaches, interactive courses, online lessons on a shared board, a digital progress journal and Telegram/WhatsApp notifications. Create your club for free.',
    keywords: ['chess club', 'chess school platform', 'club management', 'online chess lessons', 'digital journal', 'chess puzzles'],
    canonicalPath: '/',
    jsonLd: [organizationJsonLd(), webSiteJsonLd()],
  },
  '/about': {
    title: 'About debiut — online chess learning',
    description: 'debiut — an online chess school: experienced coaches, personal lessons, an interactive classroom and trainers. Learn about our approach to teaching.',
    canonicalPath: '/about',
    jsonLd: crumbs('About', '/about'),
  },
  '/achievements': {
    title: 'Chess school student achievements',
    description: 'Results and achievements of debiut online chess school students: tournaments, ratings, titles.',
    canonicalPath: '/achievements',
    jsonLd: crumbs('Achievements', '/achievements'),
  },
  '/book': {
    title: 'Chess games and openings database online',
    description: 'Interactive database of chess games and openings: browse and navigate moves and variations right in your browser.',
    canonicalPath: '/book',
    jsonLd: crumbs('Games database', '/book'),
  },
  '/analysis': {
    title: 'Chess board and analysis with the Stockfish engine online',
    description: 'Free analysis of chess positions with the Stockfish engine: evaluation, best moves, variations and arrows right in your browser. Load a FEN or PGN.',
    keywords: ['chess analysis', 'stockfish online', 'chess engine', 'position evaluation', 'online chess board'],
    canonicalPath: '/analysis',
    jsonLd: crumbs('Analysis', '/analysis'),
  },
  '/rating': {
    title: 'Chess trainer — rated puzzle mode',
    description: 'Solve chess puzzles in rated mode: difficulty adapts to your level. Sharpen your tactics online for free.',
    canonicalPath: '/rating',
    jsonLd: crumbs('Rating', '/rating'),
  },
  '/survival': {
    title: 'Chess survival — tactics against the clock',
    description: 'Survival mode: solve tactical puzzles against the clock until you run out of lives. Train your speed and calculation accuracy.',
    canonicalPath: '/survival',
    jsonLd: crumbs('Survival', '/survival'),
  },
  '/puzzles': {
    title: 'Chess puzzles and tactics online — solve for free',
    description: 'Thousands of chess puzzles by theme (mate in 1-2-3, fork, pin, endgame) matched to your rating. Solve tactics online for free.',
    keywords: ['chess puzzles', 'tactics', 'mate in 2', 'fork', 'pin', 'solve chess online'],
    canonicalPath: '/puzzles',
    jsonLd: crumbs('Puzzles', '/puzzles'),
  },
  '/coaches': {
    title: 'Chess coaches online — pick a coach',
    description: 'Choose a chess coach for personal online lessons: profiles, experience and specialization. Book a lesson at the debiut school.',
    keywords: ['chess coach', 'online chess coach', 'lessons with a coach'],
    canonicalPath: '/coaches',
    jsonLd: crumbs('Coaches', '/coaches'),
  },
};

const OG_IMAGE = `${SITE_URL}/images/chess-cinematic-lg.jpg`;
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** Build <head> tags as a string — for the build prerender of static HTML (no React/Helmet). */
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
    '<meta property="og:locale" content="en" />',
    '<meta name="twitter:card" content="summary_large_image" />',
    `<meta name="twitter:image" content="${OG_IMAGE}" />`,
    ...(cfg.jsonLd || []).map((b) => `<script type="application/ld+json">${JSON.stringify(b)}</script>`),
  ];
  return tags.filter(Boolean).join('\n    ');
};
