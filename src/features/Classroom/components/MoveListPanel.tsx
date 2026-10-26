import React, { useEffect, useRef } from 'react';
import { Box, Stack, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { MoveEntry } from '../classroomApi';

/**
 * Нотация сыгранной на общей доске партии (как на Lichess справа): пары «белые — чёрные».
 * Только для чтения — отражает ходы, сделанные на доске в классе.
 */
export const MoveListPanel: React.FC<{ moves: MoveEntry[] }> = ({ moves }) => {
  const { t } = useTranslation();
  const boxRef = useRef<HTMLDivElement | null>(null);

  // Скроллим СТРОГО внутри контейнера нотации (а не scrollIntoView — он утягивает всё окно браузера)
  useEffect(() => {
    const el = boxRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [moves.length]);

  if (!moves.length) {
    return <Typography variant="body2" color="text.secondary">{t('classroom.moves.empty', { defaultValue: 'Ходов пока нет' })}</Typography>;
  }

  // Группируем по номерам ходов: [{ no, white, black }]
  const rows: { no: number; white?: string; black?: string }[] = [];
  moves.forEach((m, i) => {
    const no = Math.floor(i / 2) + 1;
    if (i % 2 === 0) rows.push({ no, white: m.san });
    else rows[rows.length - 1].black = m.san;
  });

  return (
    <Box ref={boxRef} sx={{ height: '100%', maxHeight: '100%', overflowY: 'auto', pr: 0.5 }}>
      <Stack spacing={0}>
        {rows.map((r) => (
          <Stack key={r.no} direction="row" spacing={1} sx={{ py: 0.25, fontVariantNumeric: 'tabular-nums' }}>
            <Typography variant="body2" color="text.secondary" sx={{ width: 28, textAlign: 'right', flexShrink: 0 }}>{r.no}.</Typography>
            <Typography variant="body2" sx={{ width: 64 }}>{r.white}</Typography>
            <Typography variant="body2" sx={{ width: 64 }}>{r.black ?? ''}</Typography>
          </Stack>
        ))}
      </Stack>
    </Box>
  );
};

export default MoveListPanel;
