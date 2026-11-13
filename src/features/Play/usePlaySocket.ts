import { useEffect, useState } from 'react';
import { createPlaySocket, PlaySocketFactory, PlaySocketLike } from './playApi';
import { useAuth } from '@/context/AuthContext';

// Одно подключение к /play на вкладку (лобби и партия пользуются им вместе).
// Авторизация — по HttpOnly-cookie; ключ сессии (id пользователя) только для кэша:
// другой пользователь — новое подключение.

let factory: PlaySocketFactory = createPlaySocket;
let current: { key: string; socket: PlaySocketLike } | null = null;

/** Подменить фабрику сокета (тесты) */
export const setPlaySocketFactory = (f: PlaySocketFactory) => {
  factory = f;
  current?.socket.disconnect();
  current = null;
};

export const getPlaySocket = (key: string): PlaySocketLike => {
  if (current && current.key === key) return current.socket;
  current?.socket.disconnect();
  current = { key, socket: factory(key) };
  return current.socket;
};

/** Закрыть подключение (выход из системы) */
export const closePlaySocket = () => {
  current?.socket.disconnect();
  current = null;
};

/** Сокет /play текущего пользователя (null — не вошёл) и признак подключения */
export const usePlaySocket = () => {
  const { user } = useAuth();
  const key = user?._id ? String(user._id) : null;
  const socket = key ? getPlaySocket(key) : null;
  const [connected, setConnected] = useState(!!socket?.connected);

  useEffect(() => {
    if (!socket) {
      closePlaySocket();
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
