import React, { useState } from 'react';
import { Accordion, AccordionSummary, AccordionDetails, Typography, Stack, Box } from '@mui/material';
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded';
import LockRoundedIcon from '@mui/icons-material/LockRounded';
import { useTranslation } from 'react-i18next';

export interface SolutionBlockProps {
  /** Текст решения задачи (HTML/plain). Отдаётся только тренеру с сервера (board.solve.solution). */
  solution?: string | null;
  /** Ходы решения в SAN (запасной вариант, если нет текста) */
  lineSan?: string[];
  /** Раскрыто ли решение всему классу */
  revealedToClass?: boolean;
}

/** Блок «Решение» — виден только тренеру. По макету группового урока: сворачиваемый, с пометкой о скрытности. */
export const SolutionBlock: React.FC<SolutionBlockProps> = ({ solution, lineSan, revealedToClass }) => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  const hasContent = !!(solution && solution.trim()) || (lineSan && lineSan.length > 0);

  return (
    <Accordion expanded={open} onChange={() => setOpen((o) => !o)} disableGutters elevation={0}
      sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', bgcolor: 'rgba(43,80,224,0.04)', '&:before': { display: 'none' }, overflow: 'hidden' }}>
      <AccordionSummary expandIcon={<ExpandMoreRoundedIcon />} sx={{ px: 2 }}>
        <Stack direction="row" spacing={1} alignItems="center">
          <LockRoundedIcon sx={{ fontSize: 18, color: 'primary.main' }} />
          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{t('classroom.solution.title', 'Solution')}</Typography>
        </Stack>
      </AccordionSummary>
      <AccordionDetails sx={{ px: 2, pt: 0 }}>
        {hasContent ? (
          <>
            {solution && solution.trim()
              ? <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{solution}</Typography>
              : (
                <Box sx={{ fontFamily: '"JetBrains Mono"', fontSize: 13, lineHeight: 1.8 }}>
                  {(lineSan ?? []).map((m, i) => (
                    <Box component="span" key={i} sx={{ mr: 1 }}>
                      {i % 2 === 0 ? `${Math.floor(i / 2) + 1}. ` : ''}{m}
                    </Box>
                  ))}
                </Box>
              )}
          </>
        ) : (
          <Typography variant="body2" color="text.secondary">
            {t('classroom.solution.empty', 'Load a task with a solution to show it here.')}
          </Typography>
        )}
        <Typography variant="caption" color="text.disabled" sx={{ display: 'block', mt: 1.5 }}>
          {revealedToClass
            ? t('classroom.solution.revealed', 'The solution is visible to the whole class.')
            : t('classroom.solution.hidden', 'Visible only to the trainer until revealed.')}
        </Typography>
      </AccordionDetails>
    </Accordion>
  );
};
