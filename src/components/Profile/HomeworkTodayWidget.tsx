import React, { useEffect, useState } from 'react';
import { Box, Button, Paper, Stack, Typography } from '@mui/material';
import ExtensionRoundedIcon from '@mui/icons-material/ExtensionRounded';
import { Link as RouterLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getMyAssignments } from '@/api/homework';
import { MyAssignment } from '@/types/Homework';

interface TodayItem { id: string; bookId: string; title: string; count: number; note: string; }

const sameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

/**
 * Виджет «домашка на сегодня» для ученика: задачи из задачников, которые нужно решить сегодня
 * (по плану тренера на этот день или к сроку). Ведёт прямо на решение. Пусто — виджет скрыт.
 */
export const HomeworkTodayWidget: React.FC = () => {
  const { t } = useTranslation();
  const [items, setItems] = useState<TodayItem[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const today = new Date();
    const endOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime() + 24 * 3600 * 1000;
    getMyAssignments().then((list) => {
      const result: TodayItem[] = [];
      list.forEach((a: MyAssignment) => {
        if (a.kind !== 'puzzles' || !a.puzzleBook) return;
        if (a.plan && a.plan.length) {
          const item = a.plan.find((p) => sameDay(new Date(p.date), today));
          if (item) result.push({ id: a._id, bookId: a.puzzleBook!._id, title: a.puzzleBook!.title, count: item.puzzleCount, note: item.note });
        } else {
          // Без плана: показываем, если срок сегодня/в прошлом или срока нет
          const due = a.dueDate ? new Date(a.dueDate).getTime() : null;
          if (due === null || due < endOfToday) {
            result.push({ id: a._id, bookId: a.puzzleBook!._id, title: a.puzzleBook!.title, count: a.puzzleTarget || 0, note: '' });
          }
        }
      });
      setItems(result);
    }).catch(() => setItems([])).finally(() => setLoaded(true));
  }, []);

  if (!loaded || items.length === 0) return null;

  return (
    <Paper sx={{ p: 2.5 }}>
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5 }}>
        <ExtensionRoundedIcon color="primary" />
        <Typography variant="h6">{t('homeworkToday.title', { defaultValue: 'Homework for today' })}</Typography>
      </Stack>
      <Stack spacing={1}>
        {items.map((it) => (
          <Stack key={it.id} direction="row" alignItems="center" justifyContent="space-between" spacing={1}
            sx={{ p: 1.25, borderRadius: 2, bgcolor: 'surface.raised' }}>
            <Box sx={{ minWidth: 0 }}>
              <Typography fontWeight={700} noWrap>{it.title}</Typography>
              <Typography variant="body2" color="text.secondary">
                {it.count
                  ? t('homeworkToday.solveCount', { count: it.count, defaultValue: 'Solve {{count}} puzzles' })
                  : t('homeworkToday.solve', { defaultValue: 'Solve puzzles' })}
                {it.note ? ` · ${it.note}` : ''}
              </Typography>
            </Box>
            <Button component={RouterLink} to={`/books/${it.bookId}/solve`} variant="contained" size="small" sx={{ flexShrink: 0 }}>
              {t('homeworkToday.start', { defaultValue: 'Start' })}
            </Button>
          </Stack>
        ))}
      </Stack>
    </Paper>
  );
};
