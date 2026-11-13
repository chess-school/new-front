import { useEffect, useState } from 'react';
import { createClassroomSocket, ClassroomSocketFactory, ClassroomSocketLike } from './classroomApi';
import { useAuth } from '@/context/AuthContext';

// Одно подключение к /classroom на вкладку. Авторизация — по HttpOnly-cookie; ключ сессии
// (id пользователя) только для кэша: другой пользователь — новое подключение.

let factory: ClassroomSocketFactory = createClassroomSocket;
let current: { key: string; socket: ClassroomSocketLike } | null = null;

/** Подменить фабрику сокета (тесты) */
export const setClassroomSocketFactory = (f: ClassroomSocketFactory) => {
  factory = f;
  current?.socket.disconnect();
  current = null;
};

export const getClassroomSocket = (key: string): ClassroomSocketLike => {
  if (current && current.key === key) return current.socket;
  current?.socket.disconnect();
  current = { key, socket: factory(key) };
  return current.socket;
};

/** Закрыть подключение (выход из системы) */
export const closeClassroomSocket = () => {
  current?.socket.disconnect();
  current = null;
};

/** Сокет /classroom текущего пользователя (null — не вошёл) и признак подключения */
export const useClassroomSocket = () => {
  const { user } = useAuth();
  const key = user?._id ? String(user._id) : null;
  const socket = key ? getClassroomSocket(key) : null;
  const [connected, setConnected] = useState(!!socket?.connected);

  useEffect(() => {
    if (!socket) {
      closeClassroomSocket();
      return undefined;
    }
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
