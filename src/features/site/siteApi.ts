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

// --- Редактирование в консоли владельца -----------------------------------------------------------

/** Редактируемые поля формы «Настройки клуба». */
export interface SiteSettingsInput {
  siteName?: string;
  logoUrl?: string;
  tagline?: string;
  primaryColor?: string;
  auth?: { promoTitle?: string; promoSubtitle?: string; backgroundUrl?: string; buttonColor?: string; facts?: SiteFact[] };
  footer?: { text?: string; legalName?: string };
  socials?: Partial<Record<'facebook' | 'instagram' | 'twitter' | 'youtube' | 'telegram', string>>;
}

export interface AdminSiteData {
  club: { name: string; slug: string; primaryColor: string; logoUrl: string; city: string };
  settings: (SiteSettingsInput & { _id?: string }) | null;
}

/** Сырые сохранённые настройки активного клуба (для предзаполнения формы). */
export const fetchAdminSiteSettings = async (): Promise<AdminSiteData> =>
  (await api.get('/site/settings/admin')).data.data;

/** Сохранить настройки сайта активного клуба (только владелец). Возвращает обновлённый публичный вид. */
export const saveSiteSettings = async (payload: SiteSettingsInput): Promise<{ public: SiteSettings }> =>
  (await api.patch('/site/settings', payload)).data.data;
