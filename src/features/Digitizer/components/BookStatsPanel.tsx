import React, { useEffect, useState } from 'react';
import {
  Alert, Box, CircularProgress, LinearProgress, Paper, Stack,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import moment from 'moment';
import { getBookStats } from '@/api/digitizer';
import { BookStats } from '@/types/PuzzleBook';

const fmtTime = (s: number) => {
  const m = Math.floor(s / 60);
  const h = Math.floor(m / 60);
  if (h) return `${h}ч ${m % 60}м`;
  return m ? `${m}м` : `${s}с`;
};

/** Модуль статистики задачника: прогресс каждого ученика (решено, ошибки, подсказки, время). */
export const BookStatsPanel: React.FC<{ bookId: string }> = ({ bookId }) => {
  const { t } = useTranslation();
  const [data, setData] = useState<BookStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError(false);
    getBookStats(bookId).then(setData).catch(() => setError(true)).finally(() => setLoading(false));
  }, [bookId]);

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', p: 6 }}><CircularProgress /></Box>;
  if (error || !data) return <Alert severity="error">{t('bookStats.error', { defaultValue: 'Could not load statistics.' })}</Alert>;
  if (data.students.length === 0) {
    return <Alert severity="info">{t('bookStats.empty', { defaultValue: 'No one has solved exercises from this set yet.' })}</Alert>;
  }

  return (
    <Paper sx={{ p: { xs: 1.5, sm: 2.5 } }}>
      <Typography variant="h6" sx={{ mb: 2 }}>{t('bookStats.title', { defaultValue: 'Student progress' })}</Typography>
      <TableContainer sx={{ overflowX: 'auto' }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>{t('bookStats.student', { defaultValue: 'Student' })}</TableCell>
              <TableCell sx={{ minWidth: 160 }}>{t('bookStats.solved', { defaultValue: 'Solved' })}</TableCell>
              <TableCell align="right">{t('bookStats.mistakes', { defaultValue: 'Mistakes' })}</TableCell>
              <TableCell align="right">{t('bookStats.hints', { defaultValue: 'Hints' })}</TableCell>
              <TableCell align="right">{t('bookStats.time', { defaultValue: 'Time' })}</TableCell>
              <TableCell align="right">{t('bookStats.last', { defaultValue: 'Last activity' })}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.students.map((row) => {
              const name = `${row.student.firstName || ''} ${row.student.lastName || ''}`.trim() || row.student.email || '—';
              const pct = data.totalExercises ? Math.round((row.solvedCount / data.totalExercises) * 100) : 0;
              return (
                <TableRow key={row.student._id} hover>
                  <TableCell>{name}</TableCell>
                  <TableCell>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <Box sx={{ flex: 1, minWidth: 80 }}>
                        <LinearProgress variant="determinate" value={pct} color="success" sx={{ height: 6, borderRadius: 3 }} />
                      </Box>
                      <Typography variant="caption" sx={{ fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
                        {row.solvedCount}/{data.totalExercises}
                      </Typography>
                    </Stack>
                  </TableCell>
                  <TableCell align="right" sx={{ fontVariantNumeric: 'tabular-nums' }}>{row.totalMistakes}</TableCell>
                  <TableCell align="right" sx={{ fontVariantNumeric: 'tabular-nums' }}>{row.hintsUsed}</TableCell>
                  <TableCell align="right" sx={{ fontVariantNumeric: 'tabular-nums' }}>{fmtTime(row.totalTimeSeconds)}</TableCell>
                  <TableCell align="right">{row.lastActivity ? moment(row.lastActivity).fromNow() : '—'}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
};
