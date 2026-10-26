import axiosInstance from '@/api';
import { io } from 'socket.io-client';
import { chatSocketOrigin } from '@/features/Chat/chatSocket';

// «Интерактивный класс»: REST (/api/v2/classrooms) + socket.io namespace /classroom.
// REST отвечает за вход из расписания, LiveKit-токен (видео) и завершение сессии;
// доска/руки/передача хода/жизненный цикл урока идут через сокет (см. useClassroom).

export type ClassroomRole = 'coach' | 'student';

/** Стрелка/кружок на доске, рисуется тренером (или владельцем хода), видна всем */
export interface Annotation {
  type: 'arrow' | 'square';
  from?: string;
  to?: string;
  square?: string;
  color?: string;
}

/** Один сыгранный на доске ход — для нотации партии */
export interface MoveEntry {
  san: string;
  from: string;
  to: string;
  fen: string;
}

/** Что сейчас разбираем — задаёт тренер, видит и ученик */
export interface LessonMaterial {
  title: string;
  subtitle?: string;
}

/** Сообщение в чате урока */
export interface ChatMessage {
  id: string;
  userId: string;
  name: string;
  text: string;
  at: string;
  /** userId адресата — если задан, сообщение личное (видят только отправитель и адресат) */
  to?: string;
  toName?: string;
}

/** Режим решения на общей доске (публичная часть — без строки решения) */
export interface SolveState {
  index: number;
  total: number;
  startFen: string;
  sideToMove: 'w' | 'b';
  status: 'solving' | 'solved' | 'failed';
  wrong: number;
  hintAt: string | null;
  title: string;
  startedAt: string;
}

/** Авторитетное состояние учебной доски (снапшот с сервера и широковещание board:update) */
export interface BoardState {
  status: 'idle' | 'live' | 'ended';
  startedAt: string | null;
  fen: string;
  lastMove: { from: string; to: string; san?: string } | null;
  annotations: Annotation[];
  moves: MoveEntry[];
  material: LessonMaterial | null;
  chat: ChatMessage[];
  solve: SolveState | null;
  note: string | null;
  /** Общее дерево ходов (сериализованный GameTree) для анализа/нотации */
  tree: unknown | null;
  cursor: string | null;
  /** Оценка движка, транслируемая классу */
  eval: { scoreCp?: number; mate?: number } | null;
  coachUserId: string | null;
  controllerId: string | null;
  hands: Record<string, string>; // { userId: displayName }
}

export interface Participant {
  userId: string;
  role: ClassroomRole;
  name: string;
}

export interface JoinResult {
  state: BoardState;
  role: ClassroomRole;
}

/** Ответ POST /from-schedule/:eventId — всё нужное, чтобы дальше взять токен и подключить сокет */
export interface EnterResult {
  sessionId: string;
  groupId: string;
  room: string;
  role: ClassroomRole;
  status: 'live' | 'ended';
  startedAt: string;
}

/** Ответ POST /:id/token — доступ к LiveKit-комнате */
export interface LivekitAccess {
  token: string;
  url: string;
  room: string;
  identity: string;
  role: ClassroomRole;
}

export interface SessionSummary {
  sessionId: string;
  status: 'live' | 'ended';
  startedAt: string;
  endedAt: string | null;
  scheduleId: string | null;
  attendanceCount: number;
}

// ---- REST /api/v2/classrooms

/** Войти в урок из события расписания: создаёт/возобновляет live-сессию, отмечает присутствие */
export const enterFromSchedule = async (eventId: string): Promise<EnterResult> =>
  (await axiosInstance.post(`/classrooms/from-schedule/${eventId}`, undefined, { silent: true })).data;

/** JWT доступа к LiveKit-комнате группы. 503 (LIVEKIT_NOT_CONFIGURED) — видео на сервере не настроено */
export const getLivekitAccess = async (groupId: string): Promise<LivekitAccess> =>
  (await axiosInstance.post(`/classrooms/${groupId}/token`, undefined, { silent: true })).data;

/** Завершить сессию урока (только тренер/админ) */
export const endSession = async (sessionId: string): Promise<void> => {
  await axiosInstance.post(`/classrooms/sessions/${sessionId}/end`, undefined, { silent: true });
};

/** История занятий группы */
export const getSessions = async (groupId: string): Promise<SessionSummary[]> =>
  (await axiosInstance.get(`/classrooms/${groupId}/sessions`)).data.data;

/** Код ошибки API (REST или ack сокета) */
export const errorCode = (e: unknown): string | undefined =>
  (e as { response?: { data?: { code?: string } } })?.response?.data?.code ?? (e as { code?: string })?.code;

// ---- socket.io /classroom

export interface ClassroomAck<T = unknown> {
  ok: boolean;
  data?: T;
  error?: { msg: string; code: string };
}

/** То, чем пользуется клиент — в тестах подставляется фейк */
export interface ClassroomSocketLike {
  connected: boolean;
  on(event: string, listener: (payload: never) => void): unknown;
  off(event: string, listener?: (payload: never) => void): unknown;
  emit(event: string, payload: unknown, ack?: (response: ClassroomAck<never>) => void): unknown;
  disconnect(): unknown;
}

export type ClassroomSocketFactory = (token: string) => ClassroomSocketLike;

export const createClassroomSocket: ClassroomSocketFactory = (token) =>
  io(`${chatSocketOrigin()}/classroom`, {
    auth: { token },
    transports: ['websocket', 'polling'],
    reconnectionDelay: 500,
    reconnectionDelayMax: 5000,
  }) as unknown as ClassroomSocketLike;

/** emit с ack как промис: ошибка сервера -> reject с { code, message } */
export const request = <T>(socket: ClassroomSocketLike, event: string, payload: unknown, timeoutMs = 10000): Promise<T> =>
  new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(Object.assign(new Error('Server did not respond'), { code: 'TIMEOUT' })), timeoutMs);
    socket.emit(event, payload, (res: ClassroomAck<never>) => {
      clearTimeout(timer);
      if (res?.ok) resolve(res.data as T);
      else reject(Object.assign(new Error(res?.error?.msg ?? 'Error'), { code: res?.error?.code ?? 'UNKNOWN' }));
    });
  });
