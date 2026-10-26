import axiosInstance from '@/api';
import { CoachUser, FideTitle } from './getCoaches';

export type ExperienceLevel = 'Beginner' | 'Intermediate' | 'Advanced';
export type CoachRequestStatus = 'pending' | 'approved' | 'rejected';

export interface CoachRequestDto {
  _id: string;
  status: CoachRequestStatus;
  experience: ExperienceLevel;
  goals: string;
  createdAt: string;
  decidedAt: string | null;
  enrollment: string | null;
  student: CoachUser & { email?: string };
  /** В «моих заявках» — тренер с пользователем */
  coach: string | { _id: string; user: CoachUser };
}

/** Ученик: заявка тренеру (coachId — id профиля тренера) */
export const sendCoachRequest = async (coachId: string, payload: { experience: ExperienceLevel; goals: string }): Promise<CoachRequestDto> => {
  const response = await axiosInstance.post(`/coaches/${coachId}/requests`, payload, { silent: true });
  return response.data.data;
};

/** Ученик: мои заявки — статус на карточках тренеров */
export const getSentCoachRequests = async (): Promise<CoachRequestDto[]> => {
  const response = await axiosInstance.get('/coaches/requests/sent');
  return response.data.data;
};

/** Тренер: заявки мне */
export const getCoachRequests = async (status?: CoachRequestStatus): Promise<CoachRequestDto[]> => {
  const response = await axiosInstance.get('/coaches/me/requests', { params: { status } });
  return response.data.data;
};

/** Тренер: одобрить (с записью на курс) или отклонить */
export const decideCoachRequest = async (requestId: string, decision: { status: 'approved'; courseId: string } | { status: 'rejected' }): Promise<CoachRequestDto> => {
  const response = await axiosInstance.patch(`/coaches/me/requests/${requestId}`, decision, { silent: true });
  return response.data.data;
};

// ---- Свой профиль тренера (PUT /coaches/me переводит тексты на остальные языки)

export interface MyCoachProfileInput {
  headline?: string;
  bio?: string;
  specializations?: string[];
  fideProfile?: { fideId?: string; title?: FideTitle; rating?: { standard?: number; rapid?: number; blitz?: number }; profileUrl?: string };
  sourceLang?: string;
}

/** Профиль с текстами на всех языках; null — профиль ещё не создан */
export interface MyCoachProfile {
  _id: string;
  isVerified: boolean;
  headline?: Record<string, string>;
  bio?: Record<string, string>;
  specializations?: Record<string, string[]>;
  fideProfile?: MyCoachProfileInput['fideProfile'];
}

export const getMyCoachProfile = async (): Promise<MyCoachProfile | null> => {
  try {
    const response = await axiosInstance.get('/coaches/me', { silent: true });
    return response.data;
  } catch (e) {
    if ((e as { response?: { status?: number } }).response?.status === 404) return null;
    throw e;
  }
};

export const updateMyCoachProfile = async (payload: MyCoachProfileInput): Promise<MyCoachProfile> => {
  const response = await axiosInstance.put('/coaches/me', payload);
  return response.data;
};

/** Верифицировать тренера по uuid (только ADMIN). Пускает и профиль админа. */
export const verifyCoach = async (uuid: string): Promise<void> => {
  await axiosInstance.patch('/admin/users/verify-coach', undefined, { params: { uuid }, silent: true });
};

/** Админ верифицирует СВОЙ профиль тренера (по текущему пользователю, без uuid) */
export const verifyMyCoachProfile = async (): Promise<MyCoachProfile> => {
  const response = await axiosInstance.patch('/coaches/me/verify', undefined, { silent: true });
  return response.data;
};
