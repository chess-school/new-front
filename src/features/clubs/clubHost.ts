// clubHost.ts — определение клуба по поддомену (<slug>.chess.motorcycles).
// Чистая функция без побочных эффектов: на apex-домене, localhost и любом не-нашем
// хосте возвращает null, поэтому безопасна к включению ДО раскатки wildcard-DNS/сертификата
// (пока субдоменов нет — просто всегда null). Включение в бутстрап приложения — см.
// project-documentation/SUBDOMAINS-RUNBOOK.md (шаг «фронт: автовыбор клуба по хосту»).

const ROOT_DOMAIN = 'chess.motorcycles';

// Служебные поддомены, которые НЕ являются клубами.
const RESERVED = new Set([
  'www', 'api', 'app', 'admin', 'static', 'assets', 'cdn', 'mail', 'rtc', 'live', 'media', '',
]);

/**
 * Возвращает slug клуба, если текущий хост — это <slug>.chess.motorcycles (один уровень,
 * не зарезервированный), иначе null. Безопасно вызывать на любом окружении.
 */
export const clubSlugFromHost = (hostname?: string): string | null => {
  try {
    const host = (hostname ?? window.location.hostname).toLowerCase();
    const suffix = `.${ROOT_DOMAIN}`;
    if (!host.endsWith(suffix)) return null;        // apex / localhost / иной домен
    const sub = host.slice(0, host.length - suffix.length);
    if (!sub || sub.includes('.')) return null;     // только одноуровневый поддомен
    if (RESERVED.has(sub)) return null;
    return sub;
  } catch {
    return null;
  }
};

/** URL публичного сайта клуба: субдомен, если это наш корневой домен, иначе путь /c/<slug>. */
export const clubSiteUrl = (slug: string): string => {
  try {
    const host = window.location.hostname.toLowerCase();
    if (host === ROOT_DOMAIN || host.endsWith(`.${ROOT_DOMAIN}`)) {
      return `https://${slug}.${ROOT_DOMAIN}`;
    }
  } catch { /* ignore */ }
  return `/c/${slug}`;
};
