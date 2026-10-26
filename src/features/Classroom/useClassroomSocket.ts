import { useEffect, useState } from 'react';
import { createClassroomSocket, ClassroomSocketFactory, ClassroomSocketLike } from './classroomApi';

// Одно подключение к /classroom на вкладку. Новый токен (другой пользователь) — новое подключение.

let factory: ClassroomSocketFactory = createClassroomSocket;
let current: { token: string; socket: ClassroomSocketLike } | null = null;

/** Подменить фабрику сокета (тесты) */
export const setClassroomSocketFactory = (f: ClassroomSocketFactory) => {
  factory = f;
  current?.socket.disconnect();
  current = null;
};

export const getClassroomSocket = (token: string): ClassroomSocketLike => {
  if (current && current.token === token) return current.socket;
  current?.socket.disconnect();
  current = { token, socket: factory(token) };
  return current.socket;
};

const readToken = () => {
  try { return localStorage.getItem('token'); } catch { return null; }
};

/** Сокет /classroom текущего пользователя (null — не вошёл) и признак подключения */
export const useClassroomSocket = () => {
  const token = readToken();
  const socket = token ? getClassroomSocket(token) : null;
  const [connected, setConnected] = useState(!!socket?.connected);

  useEffect(() => {
    if (!socket) return undefined;
    const on = () => setConnected(true);
    const off = () => setConnected(false);
    socket.on('connect', on);
    socket.on('disconnect', off);
    setConnected(socket.connected);
    return () => {
      socket.off('connect', on);
      socket.off('disconnect', off);
    };
  }, [socket]);

  return { socket, connected };
};
