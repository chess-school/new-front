import React from 'react';
import { Box, IconButton, Stack, Tooltip, Typography } from '@mui/material';
import TipsAndUpdatesRoundedIcon from '@mui/icons-material/TipsAndUpdatesRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import { useTranslation } from 'react-i18next';

/** Комментарий тренера / оценка движка для всего класса (режим анализа). */
export const NoteCard: React.FC<{ note: string; onClear?: () => void }> = ({ note, onClear }) => {
  const { t } = useTranslation();
  return (
    <Box sx={{ p: 1.25, borderRadius: '10px', bgcolor: 'rgba(229,184,73,0.10)', border: '1px solid rgba(229,184,73,0.4)' }}>
      <Stack direction="row" spacing={1} alignItems="flex-start">
        <TipsAndUpdatesRoundedIcon fontSize="small" sx={{ color: '#E5B849', mt: 0.25 }} />
        <Typography variant="body2" sx={{ flex: 1, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{note}</Typography>
        {onClear && (
          <Tooltip title={t('classroom.note.clear', { defaultValue: 'Убрать' })}>
            <IconButton size="small" onClick={onClear}><CloseRoundedIcon fontSize="small" /></IconButton>
          </Tooltip>
        )}
      </Stack>
    </Box>
  );
};

export default NoteCard;
