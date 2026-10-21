import axiosInstance from '@/api';

// Публичный профиль тренера — ответ GET /api/v2/coaches (поля headline/bio/specializations
// уже локализованы бэкендом по Accept-Language)
export interface CoachUser {
  _id: string;
  uuid: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string | null;
}

export type FideTitle = 'GM' | 'IM' | 'FM' | 'CM' | 'WGM' | 'WIM' | 'WFM' | 'WCM' | 'NM' | 'None';

export interface CoachDto {
  _id: string;
  user: CoachUser;
  headline?: string | null;
  bio?: string | null;
  specializations?: string[] | null;
  fideProfile?: {
    fideId?: string;
    title?: FideTitle;
    rating?: { standard?: number; rapid?: number; blitz?: number };
    profileUrl?: string;
  } | null;
  platformRating?: { average: number; count: number } | null;
}

export interface CoachesPage {
  data: CoachDto[];
  pagination: { currentPage: number; totalPages: number; totalCoaches: number };
}

export const getCoaches = async (params: { page?: number; limit?: number; q?: string } = {}): Promise<CoachesPage> => {
  const response = await axiosInstance.get('/coaches', { params: { ...params, q: params.q?.trim() || undefined } });
  const body = response.data;
  // Защита от старого формата (массив) — страница не должна падать на неожиданном ответе
  if (Array.isArray(body)) return { data: body, pagination: { currentPage: 1, totalPages: 1, totalCoaches: body.length } };
  return {
    data: Array.isArray(body?.data) ? body.data : [],
    pagination: body?.pagination ?? { currentPage: 1, totalPages: 1, totalCoaches: 0 },
  };
};
