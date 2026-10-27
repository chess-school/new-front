import { createContext, useContext, useEffect, useMemo, useRef, useState, ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { fetchSiteSettings, PLATFORM_SITE, SiteSettings } from './siteApi';

interface SiteCtx { settings: SiteSettings; loading: boolean }
const Ctx = createContext<SiteCtx>({ settings: PLATFORM_SITE, loading: false });

/** Из текущего URL понимаем, настройки какого клуба грузить:
 *  - /c/<slug>              → публичный сайт клуба
 *  - /login, /register      → ?club=<slug> (окно входа в бренде клуба)
 *  - всё остальное          → undefined (бэк возьмёт активный клуб по X-Club-Id или дефолты) */
const slugFromLocation = (pathname: string, search: string): string | undefined => {
  if (pathname.startsWith('/c/')) return decodeURIComponent(pathname.split('/')[2] || '') || undefined;
  if (pathname === '/login' || pathname === '/register') {
    return new URLSearchParams(search).get('club')?.toLowerCase() || undefined;
  }
  return undefined;
};

export const SiteSettingsProvider = ({ children }: { children: ReactNode }) => {
  const location = useLocation();
  const slug = slugFromLocation(location.pathname, location.search);
  // Ключ запроса: конкретный slug, либо 'active' (клуб вошедшего пользователя / дефолты).
  const key = slug ?? 'active';
  const [settings, setSettings] = useState<SiteSettings>(PLATFORM_SITE);
  const [loading, setLoading] = useState(false);
  const lastKey = useRef<string | null>(null);

  useEffect(() => {
    if (lastKey.current === key) return; // тот же контекст — не перезапрашиваем
    lastKey.current = key;
    let alive = true;
    setLoading(true);
    fetchSiteSettings(slug)
      .then((s) => { if (alive) setSettings(s); })
      .catch(() => { if (alive) setSettings(PLATFORM_SITE); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [key, slug]);

  const value = useMemo(() => ({ settings, loading }), [settings, loading]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
};

/** Доступ к настройкам сайта активного клуба (бренд/тексты/соцсети). */
export const useSiteSettings = (): SiteSettings => useContext(Ctx).settings;
export const useSiteSettingsState = (): SiteCtx => useContext(Ctx);
