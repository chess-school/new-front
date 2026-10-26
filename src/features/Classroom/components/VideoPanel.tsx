import React from 'react';
import {
  LiveKitRoom,
  GridLayout,
  ParticipantTile,
  RoomAudioRenderer,
  ControlBar,
  useTracks,
} from '@livekit/components-react';
import { Track } from 'livekit-client';
import { Box } from '@mui/material';
import '@livekit/components-styles';
import { ClassroomRole } from '../classroomApi';

interface VideoPanelProps {
  token: string;
  serverUrl: string;
  role: ClassroomRole;
  /** Пользователь вышел из видео (отключился) — вернуть к списку занятий */
  onDisconnected?: () => void;
}

// Сетка плиток: камеры всех + демонстрация экрана (если кто-то её ведёт)
const VideoGrid: React.FC = () => {
  const tracks = useTracks(
    [
      { source: Track.Source.Camera, withPlaceholder: true },
      { source: Track.Source.ScreenShare, withPlaceholder: false },
    ],
    { onlySubscribed: false },
  );
  return (
    <GridLayout tracks={tracks} style={{ height: '100%' }}>
      <ParticipantTile />
    </GridLayout>
  );
};

/**
 * Видео/аудио/демонстрация экрана урока через LiveKit. Демонстрацию экрана в панели управления
 * показываем только тренеру — у ученика сервер её всё равно не разрешит публиковать.
 */
export const VideoPanel: React.FC<VideoPanelProps> = ({ token, serverUrl, role, onDisconnected }) => (
  <LiveKitRoom
    token={token}
    serverUrl={serverUrl}
    connect
    audio
    video
    onDisconnected={onDisconnected}
    data-lk-theme="default"
    style={{ display: 'flex', flexDirection: 'column', height: '100%', borderRadius: 10, overflow: 'hidden' }}
  >
    <Box sx={{ flex: 1, minHeight: 0 }}>
      <VideoGrid />
    </Box>
    <RoomAudioRenderer />
    <ControlBar
      variation="minimal"
      controls={{ camera: true, microphone: true, screenShare: role === 'coach', chat: false, leave: true }}
    />
  </LiveKitRoom>
);
