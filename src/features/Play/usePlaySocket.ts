import { useEffect, useState } from 'react';
import { createPlaySocket, PlaySocketFactory, PlaySocketLike } from './playApi';

// Одно подключение к /play на вкладку (лобби и партия пользуются им вместе).
// Новый токен (другой пользователь) — новое подключение.

let factory: PlaySocketFactory = createPlaySocket;
let current: { token: string; socket: PlaySocketLike } | null = null;

/** Подменить фабрику сокета (тесты) */
export const setPlaySocketFactory = (f: PlaySocketFactory) => {
  factory = f;
  current?.socket.disconnect();
  current = null;
};

export const getPlaySocket = (token: string): PlaySocketLike => {
  if (current && current.token === token) return current.socket;
  current?.socket.disconnect();
  current = { token, socket: factory(token) };
  return current.socket;
};

const readToken = () => {
  try { return localStorage.getItem('token'); } catch { return null; }
};

/** Сокет /play текущего пользователя (null — не вошёл) и признак подключения */
export const usePlaySocket = () => {
  const token = readToken();
  const socket = token ? getPlaySocket(token) : null;
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
