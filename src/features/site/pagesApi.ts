import api from '@/api';

// Страницы сайта клуба из блоков (шаг 3 плана сайтов клубов). Блок — это строго типизированные
// ДАННЫЕ { id, type, props }; сырого HTML в них нет (бэк чистит при сохранении), фронт рендерит их
// как данные через PageRenderer. Текстовые поля многоязычны ({ pl, uk, en }).

export type Lang = 'pl' | 'uk' | 'en';
export type I18nText = Partial<Record<Lang, string>>;

export interface BlockImage { assetId?: string; url?: string; alt?: string }

export interface SiteBlock {
  id?: string;
  type: 'heading' | 'text' | 'quote' | 'divider' | 'photo' | 'gallery' | 'banner' | 'video' | 'slider' | 'coaches';
  // props зависят от type; описываем объединением известных полей (все опциональны).
  props: {
    text?: I18nText;
    level?: number;
    align?: 'left' | 'center' | 'right';
    author?: string;
    caption?: I18nText;
    // photo
    assetId?: string;
    url?: string;
    alt?: string;
    // gallery / slider
    items?: BlockImage[];
    interval?: number;   // slider: секунд между слайдами
    // banner
    bg?: BlockImage;
    bgColor?: string;
    title?: I18nText;
    subtitle?: I18nText;
    buttonLabel?: I18nText;
    buttonUrl?: string;
    // video
    provider?: 'youtube' | 'vimeo';
    videoId?: string;
    // coaches
    layout?: 'grid' | 'list';
    limit?: number;
  };
}

export interface SitePage {
  slug: string;
  title: string;
  blocks: SiteBlock[];
  version: number;
}

/** Мета страницы в списке консоли (без тел блоков). */
export interface SitePageMeta {
  slug: string;
  title: string;
  status: 'draft' | 'published';
  version: number;
  updatedAt: string;
}

/** Выбрать текст поля для текущего языка с фолбэком (lng → en → первый непустой). */
export const pickText = (text: I18nText | undefined, lng: string): string => {
  if (!text) return '';
  const key = (lng || 'en').slice(0, 2) as Lang;
  return text[key] || text.en || text.pl || text.uk || '';
};

/** ПУБЛИЧНАЯ опубликованная страница клуба. Нет страницы → null (показываем статичный фолбэк). */
export const fetchPublicPage = async (pageSlug: string, clubSlug?: string): Promise<SitePage | null> => {
  try {
    const res = await api.get(`/site/pages/${pageSlug}`, { params: clubSlug ? { slug: clubSlug } : {}, silent: true });
    return res.data.data as SitePage;
  } catch {
    return null;
  }
};

// --- Консоль владельца (задел под редактор шага 4) ------------------------------------------------

/** Список страниц активного клуба. */
export const fetchPagesList = async (): Promise<SitePageMeta[]> =>
  (await api.get('/site/pages')).data.data;

/** Черновик для редактора (нет своего — бэк отдаёт стартовый шаблон, isNew=true). */
export const fetchAdminPage = async (pageSlug: string): Promise<{ page: SitePage & { status: string }; isNew: boolean }> =>
  (await api.get(`/site/pages/admin/${pageSlug}`)).data.data;

/** Сохранить черновик (блоки санитайзятся на бэке). */
export const savePage = async (pageSlug: string, payload: { title?: string; blocks: SiteBlock[] }): Promise<SitePage> =>
  (await api.put(`/site/pages/${pageSlug}`, payload)).data.data.page;

/** Опубликовать страницу. */
export const publishPage = async (pageSlug: string): Promise<void> => {
  await api.post(`/site/pages/${pageSlug}/publish`);
};

/** Удалить страницу. */
export const deletePage = async (pageSlug: string): Promise<void> => {
  await api.delete(`/site/pages/${pageSlug}`);
};

/** Автогенерация черновиков 4 страниц из текста/документа/ссылок (ИИ на бэке). Возвращает сводку. */
export const generatePages = async (input: { text?: string; urls?: string; document?: File }): Promise<Array<{ slug: string; blocks: number }>> => {
  const fd = new FormData();
  if (input.text) fd.append('text', input.text);
  if (input.urls) fd.append('urls', input.urls);
  if (input.document) fd.append('document', input.document);
  // Долгий вызов (claude -p ходит в сеть) — поднимаем таймаут axios до 4 минут.
  return (await api.post('/site/pages/generate', fd, { timeout: 240000 })).data.data.pages;
};
