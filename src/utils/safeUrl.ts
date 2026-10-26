// Защита от javascript:/data: и прочих опасных схем в href из пользовательских данных.
// Возвращает исходный URL только если это http(s):// или mailto:, иначе undefined.
const SAFE_SCHEME = /^(https?:\/\/|mailto:)/i;

export const safeUrl = (url?: string | null): string | undefined => {
  if (!url) return undefined;
  const trimmed = url.trim();
  return SAFE_SCHEME.test(trimmed) ? trimmed : undefined;
};
