import React from 'react';
import { Box, IconButton, Stack, Tooltip, Typography } from '@mui/material';
import MenuBookRoundedIcon from '@mui/icons-material/MenuBookRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import { useTranslation } from 'react-i18next';
import { LessonMaterial } from '../classroomApi';

/**
 * «Что сейчас разбираем»: задаёт тренер (загрузка задачи/книги), видит и ученик.
 * onClear — только у тренера (убрать плашку).
 */
export const MaterialCard: React.FC<{ material: LessonMaterial; onClear?: () => void }> = ({ material, onClear }) => {
  const { t } = useTranslation();
  return (
    <Box sx={{ p: 1.5, borderRadius: '10px', bgcolor: 'surface.raised', border: 1, borderColor: 'divider' }}>
      <Stack direction="row" spacing={1} alignItems="flex-start">
        <MenuBookRoundedIcon fontSize="small" color="primary" sx={{ mt: 0.25 }} />
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="caption" color="text.secondary" display="block">
            {t('classroom.material.now', { defaultValue: 'Сейчас разбираем' })}
          </Typography>
          <Typography variant="subtitle2" fontWeight={700} noWrap>{material.title}</Typography>
          {material.subtitle && (
            <Typography variant="body2" color="text.secondary" noWrap>{material.subtitle}</Typography>
          )}
        </Box>
        {onClear && (
          <Tooltip title={t('classroom.material.clear', { defaultValue: 'Убрать' })}>
            <IconButton size="small" onClick={onClear}><CloseRoundedIcon fontSize="small" /></IconButton>
          </Tooltip>
        )}
      </Stack>
    </Box>
  );
};

export default MaterialCard;
