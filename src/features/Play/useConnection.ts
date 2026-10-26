import { useEffect, useRef, useState } from 'react';
import { PlaySocketLike } from './playApi';

export interface ConnectionInfo {
  connected: boolean;
  /** RTT в миллисекундах; null — ещё не измерено */
  latency: number | null;
}

const PING_INTERVAL_MS = 2000;
// Экспоненциальное сглаживание, чтобы полоски не дёргались от разовых всплесков
const SMOOTHING = 0.4;

interface Opts {
  /** Задан — в партии: отправляем свою задержку сопернику и слушаем его */
  gameId?: string;
  selfId?: string;
  whiteId?: string;
  blackId?: string;
}

/**
 * Меряет задержку до сервера через /play сокет (RTT по ack события latency_ping).
 * В партии дополнительно обменивается задержкой с соперником (latency_report / peer_lag).
 */
export const useConnection = (socket: PlaySocketLike | null, connected: boolean, opts: Opts = {}) => {
  const { gameId, selfId, whiteId, blackId } = opts;
  const [selfLatency, setSelfLatency] = useState<number | null>(null);
  const [peerLatency, setPeerLatency] = useState<number | null>(null);
  const emaRef = useRef<number | null>(null);

  // Замер собственного пинга
  useEffect(() => {
    if (!socket || !connected) {
      emaRef.current = null;
      setSelfLatency(null);
      return undefined;
    }
    let cancelled = false;

    const ping = () => {
      const start = Date.now();
      socket.emit('latency_ping', null, () => {
        if (cancelled) return;
        const rtt = Date.now() - start;
        const prev = emaRef.current;
        const next = prev == null ? rtt : Math.round(prev * (1 - SMOOTHING) + rtt * SMOOTHING);
        emaRef.current = next;
        setSelfLatency(next);
        if (gameId) socket.emit('latency_report', { gameId, ms: next });
      });
    };

    ping();
    const timer = setInterval(ping, PING_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [socket, connected, gameId]);

  // Приём задержки соперника
  useEffect(() => {
    if (!socket || !gameId) {
      setPeerLatency(null);
      return undefined;
    }
    const onPeerLag = (p: { userId: string; ms: number }) => {
      if (p.userId === selfId) return; // своё эхо игнорируем
      // Если знаем обоих игроков — принимаем только их задержку (не зрителей)
      if (whiteId && blackId && p.userId !== whiteId && p.userId !== blackId) return;
      setPeerLatency(p.ms);
    };
    socket.on('peer_lag', onPeerLag as (payload: never) => void);
    return () => {
      socket.off('peer_lag', onPeerLag as (payload: never) => void);
    };
  }, [socket, gameId, selfId, whiteId, blackId]);

  return { connected, selfLatency, peerLatency };
};
