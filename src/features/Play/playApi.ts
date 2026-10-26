import axiosInstance from '@/api';
import { io } from 'socket.io-client';
import { Ack, Challenge, MyGame, PlayGame, PlayOverview, Preset } from './playTypes';
import { chatSocketOrigin } from '@/features/Chat/chatSocket';

// ---- REST /api/v2/play

export const getPresets = async (): Promise<{ presets: Preset[]; limits: { minMinutes: number; maxMinutes: number; maxIncrement: number } }> =>
  (await axiosInstance.get('/play/presets')).data.data;

export const getPlayOverview = async (): Promise<PlayOverview> => (await axiosInstance.get('/play/me')).data.data;

export const getOpenChallenges = async (): Promise<Challenge[]> => (await axiosInstance.get('/play/challenges')).data.data;

export interface ChallengeInput {
  minutes: number;
  increment: number;
  rated: boolean;
  color: 'white' | 'black' | 'random';
  isPrivate: boolean;
  ratingRange?: number | null;
}

export const createChallenge = async (input: ChallengeInput): Promise<Challenge> =>
  (await axiosInstance.post('/play/challenges', input, { silent: true })).data.data;

/** Принять вызов -> id начавшейся партии */
export const acceptChallenge = async (id: string): Promise<string> =>
  (await axiosInstance.post(`/play/challenges/${id}/accept`, undefined, { silent: true })).data.data.gameId;

export const cancelChallenge = async (id: string): Promise<void> => {
  await axiosInstance.delete(`/play/challenges/${id}`, { silent: true });
};

export const getGame = async (id: string): Promise<PlayGame> => (await axiosInstance.get(`/play/games/${id}`, { silent: true })).data.data;

/** Мои завершённые партии (новые сверху) */
export const getMyGames = async (limit = 30): Promise<MyGame[]> =>
  (await axiosInstance.get('/play/games', { params: { limit } })).data.data;

/** Код ошибки API (REST или ack) */
export const errorCode = (e: unknown): string | undefined =>
  (e as { response?: { data?: { code?: string } } })?.response?.data?.code ?? (e as { code?: string })?.code;

// ---- socket.io /play

/** То, чем пользуется клиент — в тестах подставляется фейк */
export interface PlaySocketLike {
  connected: boolean;
  on(event: string, listener: (payload: never) => void): unknown;
  off(event: string, listener?: (payload: never) => void): unknown;
  emit(event: string, payload: unknown, ack?: (response: Ack<never>) => void): unknown;
  disconnect(): unknown;
}

export type PlaySocketFactory = (token: string) => PlaySocketLike;

export const createPlaySocket: PlaySocketFactory = (token) =>
  io(`${chatSocketOrigin()}/play`, {
    auth: { token },
    transports: ['websocket', 'polling'],
    reconnectionDelay: 500,
    reconnectionDelayMax: 5000,
  }) as unknown as PlaySocketLike;

/** emit с ack как промис: ошибка сервера -> reject с { code, message } */
export const request = <T>(socket: PlaySocketLike, event: string, payload: unknown, timeoutMs = 10000): Promise<T> =>
  new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(Object.assign(new Error('Server did not respond'), { code: 'TIMEOUT' })), timeoutMs);
    socket.emit(event, payload, (res: Ack<never>) => {
      clearTimeout(timer);
      if (res?.ok) resolve(res.data as T);
      else reject(Object.assign(new Error(res?.error?.msg ?? 'Error'), { code: res?.error?.code ?? 'UNKNOWN' }));
    });
  });
