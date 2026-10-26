import axiosInstance from '@/api';
import { CoachUser, FideTitle } from './getCoaches';

export type CoachApplicationStatus = 'pending' | 'approved' | 'rejected';

export interface CoachApplicationFide {
  fideId?: string;
  title?: FideTitle;
  rating?: { standard?: number; rapid?: number; blitz?: number };
  profileUrl?: string;
}

export interface CoachApplicationDto {
  _id: string;
  status: CoachApplicationStatus;
  headline: string;
  motivation: string;
  experience: string;
  specializations: string[];
  contact: string;
  fideProfile: CoachApplicationFide | null;
  adminNote: string;
  createdAt: string;
  decidedAt: string | null;
  applicant: CoachUser & { email?: string; phone?: string | null };
}

export interface CoachApplicationInput {
  motivation: string;
  headline?: string;
  experience?: string;
  specializations?: string[];
  contact?: string;
  fideProfile?: CoachApplicationFide;
  sourceLang?: string;
}

/** Пользователь: подать заявку на роль тренера */
export const submitCoachApplication = async (payload: CoachApplicationInput): Promise<CoachApplicationDto> => {
  const response = await axiosInstance.post('/coaches/applications', payload, { silent: true });
  return response.data.data;
};

/** Пользователь: моя последняя заявка (null — ещё не подавал) */
export const getMyCoachApplication = async (): Promise<CoachApplicationDto | null> => {
  const response = await axiosInstance.get('/coaches/applications/me');
  return response.data.data;
};

/** Админ: список заявок на роль тренера */
export const getCoachApplications = async (status?: CoachApplicationStatus): Promise<CoachApplicationDto[]> => {
  const response = await axiosInstance.get('/coaches/applications', { params: { status } });
  return response.data.data;
};

/** Админ: решение по заявке */
export const decideCoachApplication = async (
  applicationId: string,
  decision: { status: CoachApplicationStatus; adminNote?: string },
): Promise<CoachApplicationDto> => {
  const response = await axiosInstance.patch(`/coaches/applications/${applicationId}`, decision, { silent: true });
  return response.data.data;
};
