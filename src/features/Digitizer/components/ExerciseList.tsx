import React, { useEffect, useRef } from 'react';
import { Box, List, ListItemButton, ListItemText, ListItemIcon, Paper, Stack, Typography } from '@mui/material';
import { Exercise } from '@/types/PuzzleBook';

interface ExerciseListProps {
  exercises: Exercise[];
  selectedIndex: number;
  onSelect: (index: number) => void;
  /** Значок слева от задания (решено, нет решения, ошибка и т.п.) */
  renderBadge?: (exercise: Exercise) => React.ReactNode;
  title?: string;
  /** Без своей карточки — когда список уже внутри панели (вкладка арены) */
  bare?: boolean;
  /** Справа от заголовка: например, «5 / 40» */
  summary?: React.ReactNode;
  maxHeight?: { xs?: number | string; md?: number | string } | number | string;
}

export const ExerciseList: React.FC<ExerciseListProps> = ({
  exercises, selectedIndex, onSelect, renderBadge, title, bare = false, summary, maxHeight = { xs: 280, md: '70vh' },
}) => {
  const selectedRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    selectedRef.current?.scrollIntoView?.({ block: 'nearest' });
  }, [selectedIndex]);

  const body = (
    <>
      {(title || summary) && (
        <Stack direction="row" alignItems="baseline" justifyContent="space-between" sx={{ px: bare ? 0.5 : 2, pt: bare ? 0 : 1.75, pb: 1 }}>
          {title && <Typography variant="subtitle1" fontWeight={700}>{title}</Typography>}
          {summary && <Typography variant="caption" color="text.secondary">{summary}</Typography>}
        </Stack>
      )}
      <List dense sx={{ overflowY: 'auto', flex: 1, maxHeight, px: bare ? 0 : 1, pb: 1 }}>
        {exercises.map((exercise, index) => (
          <ListItemButton
            key={exercise._id}
            ref={index === selectedIndex ? selectedRef : undefined}
            selected={index === selectedIndex}
            onClick={() => onSelect(index)}
            sx={{ mb: 0.25 }}
          >
            {renderBadge && <ListItemIcon sx={{ minWidth: 32 }}>{renderBadge(exercise)}</ListItemIcon>}
            <ListItemText
              primary={exercise.title}
              secondary={exercise.meta?.source}
              primaryTypographyProps={{ fontWeight: index === selectedIndex ? 600 : 500, noWrap: true }}
              secondaryTypographyProps={{ noWrap: true }}
            />
            <Box component="span" sx={{ ml: 1, color: 'text.disabled', fontSize: '0.75rem', fontVariantNumeric: 'tabular-nums' }}>{index + 1}</Box>
          </ListItemButton>
        ))}
      </List>
    </>
  );

  if (bare) return <Box sx={{ display: 'flex', flexDirection: 'column' }}>{body}</Box>;
  return <Paper sx={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>{body}</Paper>;
};
