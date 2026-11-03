import api from '@/api';

export type LeadStatus = 'new' | 'contacted' | 'trial_scheduled' | 'trial_done' | 'converted' | 'lost';

export interface Lead {
  _id: string;
  createdAt: string;
  who: 'self' | 'child';
  name: string;
  childAge?: number;
  email?: string;
  phone?: string;
  level?: string;
  format?: string;
  preferredTime?: string;
  coach?: string | null;
  status: LeadStatus;
  note?: string;
}

export interface TrialRequestInput {
  who: 'self' | 'child';
  name: string;
  childAge?: number;
  email?: string;
  phone?: string;
  level?: string;
  format?: string;
  preferredTime?: string;
  coachUuid?: string;
  consent: boolean;
  pagePath?: string;
  company?: string;   // honeypot — всегда пустое у людей
}

/** Публичная заявка на пробное с сайта клуба. */
export const submitTrialRequest = async (slug: string, input: TrialRequestInput): Promise<void> => {
  await api.post(`/clubs/by-slug/${encodeURIComponent(slug)}/leads`, input, { silent: true });
};

/** Заявки активного клуба (владелец). */
export const fetchLeads = async (status?: string): Promise<Lead[]> =>
  (await api.get('/leads', { params: status ? { status } : {} })).data.data;

/** Сменить статус/заметку заявки (владелец). */
export const updateLead = async (id: string, patch: { status?: LeadStatus; note?: string; lostReason?: string }): Promise<Lead> =>
  (await api.patch(`/leads/${id}`, patch)).data.data;
