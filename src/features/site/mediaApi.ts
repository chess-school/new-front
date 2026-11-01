import api from '@/api';

/** Один размер изображения. */
export interface MediaVariant { url: string; width: number; height: number; size: number }

/** Элемент медиатеки клуба (шаг 2 плана сайтов клубов). */
export interface MediaItem {
  id: string;
  kind: 'image';
  url: string;              // основная ссылка (самый большой вариант)
  alt: string;
  mimeType: string;
  originalName: string;
  width: number;
  height: number;
  size: number;             // суммарный вес всех вариантов, байт
  variants: { thumb?: MediaVariant; medium?: MediaVariant; large?: MediaVariant };
  createdAt: string;
}

export interface MediaListMeta { total: number; page: number; limit: number }

// Бэк отдаёт относительную ссылку вида /api/v2/site/media/file/... (одинаковый домен в проде).
// Для dev (SPA :5173, API :3000) и абсолютных ссылок R2 приводим к пригодному для <img src>.
const API_ROOT = (import.meta.env.VITE_API_URL || 'http://localhost:3000/api').replace(/\/api$/, '');
export const mediaUrl = (url: string): string => (url && url.startsWith('/') ? `${API_ROOT}${url}` : url);

/** Список медиа активного клуба (свежие сверху). */
export const fetchMedia = async (page = 1, limit = 60): Promise<{ items: MediaItem[]; meta: MediaListMeta }> => {
  const res = await api.get('/site/media', { params: { page, limit } });
  return { items: res.data.data, meta: res.data.meta };
};

/** Загрузить изображение. Прогресс — через onProgress (0..100). */
export const uploadMedia = async (file: File, alt = '', onProgress?: (percent: number) => void): Promise<MediaItem> => {
  const form = new FormData();
  form.append('file', file);
  if (alt) form.append('alt', alt);
  const res = await api.post('/site/media', form, {
    onUploadProgress: (e) => {
      if (onProgress && e.total) onProgress(Math.round((e.loaded / e.total) * 100));
    },
  });
  return res.data.data;
};

/** Удалить медиа. */
export const deleteMedia = async (id: string): Promise<void> => {
  await api.delete(`/site/media/${id}`);
};
