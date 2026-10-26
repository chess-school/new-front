import React from 'react';
import { usePlaySocket } from '@/features/Play/usePlaySocket';
import { useConnection } from '@/features/Play/useConnection';
import { ConnectionBars } from '@/features/Play/components/ConnectionBars';

/**
 * Индикатор соединения с сервером в шапке сайта: та же «лесенка», что и в партии,
 * но меряет только собственный пинг (через общий /play сокет). Для гостя не рисуется.
 */
export const SitePing: React.FC = () => {
  const { socket, connected } = usePlaySocket();
  const conn = useConnection(socket, connected);
  if (!socket) return null;
  return <ConnectionBars connected={conn.connected} latency={conn.selfLatency} size={16} showMs />;
};
