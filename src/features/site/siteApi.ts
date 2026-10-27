import api from '@/api';

export interface SiteFact { value: string; label: string }
export interface SiteLink { label: string; url: string }
export interface SiteMenuItem { key: string; label: string; path: string }

/** Публичные настройки сайта активного клуба (или платформенные дефолты debiut). */
export interface SiteSettings {
  clubId: string | null;
  slug: string | null;
  isClub: boolean;
  siteName: string;
  logoUrl: string;
  tagline: string;
  city: string;
  primaryColor: string;
  auth: {
    promoTitle: string;
    promoSubtitle: string;
    backgroundUrl: string;
    buttonColor: string;
    facts: SiteFact[];
  };
  footer: { text: string; legalName: string; links: SiteLink[] };
  socials: Partial<Record<'facebook' | 'instagram' | 'twitter' | 'youtube' | 'telegram', string>>;
  menu: SiteMenuItem[];
}

/** Нейтральные дефолты платформы — пока бэк не ответил (и как fallback при ошибке). */
export const PLATFORM_SITE: SiteSettings = {
  clubId: null,
  slug: null,
  isClub: false,
  siteName: 'debiut',
  logoUrl: '',
  tagline: '',
  city: '',
  primaryColor: '#2B50E0',
  auth: { promoTitle: '', promoSubtitle: '', backgroundUrl: '', buttonColor: '', facts: [] },
  footer: { text: '', legalName: 'debiut', links: [] },
  socials: {},
  menu: [],
};

/** Загрузить настройки сайта. slug — для публичного сайта клуба /c/<slug> и окна входа /login?club=<slug>.
 *  Без slug бэк берёт активный клуб залогиненного пользователя (заголовок X-Club-Id) или дефолты. */
export const fetchSiteSettings = async (slug?: string): Promise<SiteSettings> =>
  (await api.get('/site/settings', { params: slug ? { slug } : {}, silent: true })).data.data;
