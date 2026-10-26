import React from 'react';
import { Box, Tooltip } from '@mui/material';
import { useTranslation } from 'react-i18next';

interface Props {
  connected: boolean;
  /** RTT в мс; null — ещё не измерено */
  latency: number | null;
  /** Высота полосок в px */
  size?: number;
  /** Показать число мс рядом с полосками */
  showMs?: boolean;
}

// Пороги качества связи по RTT (мс) → сколько полосок из 4 и каким цветом
const quality = (connected: boolean, ms: number | null): { bars: number; color: string } => {
  if (!connected) return { bars: 0, color: '#f85149' }; // нет связи
  if (ms == null) return { bars: 1, color: '#8b949e' }; // измеряем
  if (ms <= 150) return { bars: 4, color: '#3fb950' }; // отличное
  if (ms <= 350) return { bars: 3, color: '#3fb950' }; // хорошее
  if (ms <= 700) return { bars: 2, color: '#d29922' }; // среднее
  return { bars: 1, color: '#f85149' }; // плохое
};

/** Индикатор качества соединения «лесенкой» из 4 полосок (как на Lichess) */
export const ConnectionBars: React.FC<Props> = ({ connected, latency, size = 16, showMs = false }) => {
  const { t } = useTranslation();
  const { bars, color } = quality(connected, latency);

  const label = !connected
    ? t('play.conn.offline', 'No connection')
    : latency == null
      ? t('play.conn.measuring', 'Measuring…')
      : `${latency} ${t('play.conn.ms', 'ms')}`;

  return (
    <Tooltip title={label} arrow>
      <Box
        role="img"
        aria-label={`${t('play.conn.label', 'Connection')}: ${label}`}
        sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75 }}
      >
        <Box sx={{ display: 'inline-flex', alignItems: 'flex-end', gap: '2px', height: size }}>
          {[1, 2, 3, 4].map((i) => (
            <Box
              key={i}
              sx={{
                width: Math.max(2, size * 0.18),
                height: `${(i / 4) * 100}%`,
                borderRadius: '1px',
                bgcolor: i <= bars ? color : 'action.disabledBackground',
                transition: 'background-color .3s ease',
              }}
            />
          ))}
        </Box>
        {showMs && (
          <Box
            component="span"
            sx={{ fontSize: '0.72rem', fontVariantNumeric: 'tabular-nums', color: 'text.secondary', minWidth: 34 }}
          >
            {connected && latency != null ? `${latency}ms` : connected ? '…' : '—'}
          </Box>
        )}
      </Box>
    </Tooltip>
  );
};
