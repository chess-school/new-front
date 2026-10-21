import { io } from 'socket.io-client';

// Подключение к socket.io namespace /chat бэкенда (тот же хост, что у REST API).
// Токен — в handshake (auth.token); при отзыве сессии сервер отвечает connect_error с data.code.

export interface ChatAck<T = unknown> {
  ok: boolean;
  data?: T;
  error?: { msg: string; code: string };
}

/** То, чем провайдер пользуется у сокета — в тестах подставляется фейк */
export interface ChatSocketLike {
  connected: boolean;
  on(event: string, listener: (payload: never) => void): unknown;
  off(event: string, listener?: (payload: never) => void): unknown;
  emit(event: string, payload: unknown, ack?: (response: ChatAck<never>) => void): unknown;
  disconnect(): unknown;
}

export type ChatSocketFactory = (token: string) => ChatSocketLike;

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export const chatSocketOrigin = (apiUrl: string = API_URL) => {
  try {
    return new URL(apiUrl).origin;
  } catch {
    return window.location.origin; // относительный VITE_API_URL ('/api') — тот же хост
  }
};

export const createChatSocket: ChatSocketFactory = (token) =>
  io(`${chatSocketOrigin()}/chat`, {
    auth: { token },
    transports: ['websocket', 'polling'],
    reconnectionDelay: 1000,
    reconnectionDelayMax: 10000,
  }) as unknown as ChatSocketLike;
