import api from '@/api';

export interface ClubSummary {
  _id: string;
  name: string;
  slug: string;
  logoUrl?: string;
  brand?: { primaryColor?: string };
  plan?: 'start' | 'club' | 'academy';
  status?: 'active' | 'suspended';
  city?: string;
}

export type ClubRole = 'owner' | 'trainer' | 'student' | 'parent';

export interface MyClubEntry {
  role: ClubRole;
  club: ClubSummary;
}

export interface CreateClubPayload {
  name: string;
  slug?: string;
  city?: string;
  plan?: 'start' | 'club' | 'academy';
  brand?: { primaryColor?: string };
}

/** Клубы текущего пользователя (переключатель клуба) */
export const fetchMyClubs = async (): Promise<MyClubEntry[]> =>
  (await api.get('/clubs/mine')).data.data;

/** Создать клуб (онбординг) — создатель становится владельцем */
export const createClub = async (payload: CreateClubPayload): Promise<ClubSummary> =>
  (await api.post('/clubs', payload)).data;

export interface ClubOverview {
  club: { name: string; plan: 'start' | 'club' | 'academy'; slug: string; limits: { maxStudents: number | null; maxTrainers: number | null; maxLessonSize: number | null } };
  counts: { students: number; trainers: number; groups: number };
  payments: { byCurrency: Record<string, number>; pending: number };
  todayLessons: { time: string; title: string; trainer: string; type: string | null; online: boolean; status: string }[];
  groups: { id: string; name: string; description: string; trainer: string; students: number; nextLesson: { title: string; date: string } | null; attendance: number | null; courseProgress: number | null }[];
  bots: { telegram: boolean; whatsapp: boolean };
  metrics: { attendance: number | null; puzzlesSolved7d: number | null; solvedChart: number[] | null; leaders: unknown[] | null };
}

/** Реальная сводка активного клуба (консоль владельца) */
export const fetchOverview = async (): Promise<ClubOverview | null> =>
  (await api.get('/clubs/overview')).data.data;

export interface ClubPublic {
  club: { _id: string; name: string; slug: string; city?: string; logoUrl?: string; brand?: { primaryColor?: string }; plan?: string };
  coaches: { name: string; headline: string; title: string | null }[];
  groupsCount: number;
  membership: { role: string; status: string } | null;
}

/** Публичная витрина клуба для сайта /c/<slug> */
export const fetchClubBySlug = async (slug: string): Promise<ClubPublic> =>
  (await api.get(`/clubs/by-slug/${encodeURIComponent(slug)}`, { silent: true })).data.data;
