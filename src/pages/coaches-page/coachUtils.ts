import { CoachDto, CoachUser } from '@/api/coaches';

export const fullName = (u?: Pick<CoachUser, 'firstName' | 'lastName'> | null) => `${u?.firstName ?? ''} ${u?.lastName ?? ''}`.trim();
export const initials = (u?: Pick<CoachUser, 'firstName' | 'lastName'> | null) =>
  `${u?.firstName?.[0] ?? ''}${u?.lastName?.[0] ?? ''}`.toUpperCase() || '?';

/** Звание FIDE для бейджа ('None' и пустое не показываем) */
export const fideTitle = (coach: CoachDto) => {
  const title = coach.fideProfile?.title;
  return title && title !== 'None' ? title : null;
};

/** Лучший рейтинг FIDE (классика -> рапид -> блиц) с подписью контроля */
export const bestFideRating = (coach: CoachDto): { value: number; kind: 'standard' | 'rapid' | 'blitz' } | null => {
  const rating = coach.fideProfile?.rating;
  for (const kind of ['standard', 'rapid', 'blitz'] as const) {
    const value = rating?.[kind];
    if (typeof value === 'number' && value > 0) return { value, kind };
  }
  return null;
};

/** Оценка на платформе, если есть отзывы */
export const platformRating = (coach: CoachDto) =>
  coach.platformRating && coach.platformRating.count > 0 ? coach.platformRating : null;

/** Код ошибки API заявки -> ключ перевода */
export const requestErrorKey = (code?: string) => {
  switch (code) {
    case 'REQUEST_PENDING': return 'coachesPage.errors.requestPending';
    case 'ALREADY_STUDENT': return 'coachesPage.errors.alreadyStudent';
    case 'SELF_REQUEST': return 'coachesPage.errors.selfRequest';
    case 'COACH_NOT_FOUND': return 'coachesPage.errors.coachNotFound';
    default: return 'coaches.submitError';
  }
};

export const apiErrorCode = (e: unknown): string | undefined =>
  (e as { response?: { data?: { code?: string } } })?.response?.data?.code;
