import React, { useEffect, useState } from 'react';
import {
  Button, Dialog, DialogTitle, DialogContent, DialogActions, Stack, TextField,
  MenuItem, Typography, CircularProgress, Alert, Box,
} from '@mui/material';
import TravelExploreRounded from '@mui/icons-material/TravelExploreRounded';
import MenuBookRounded from '@mui/icons-material/MenuBookRounded';
import { useTranslation } from 'react-i18next';
import { notification } from 'antd';

import type { CoursePuzzle } from '@/features/Courses/types/courseBlocks';
import type { Exercise } from '@/types/PuzzleBook';
import { pickPuzzlesFromBase } from '@/api/puzzles';
import { getPuzzleBooks, getPuzzleBook } from '@/api/digitizer';
import type { PuzzleBookSummary } from '@/types/PuzzleBook';
import { newId } from '../lib/courseDraft';

// Популярные темы базы Lichess (value = тег в базе, label — перевод с англ-фолбэком).
const THEMES: { value: string; label: string }[] = [
  { value: '', label: 'Any theme' },
  { value: 'fork', label: 'Fork' },
  { value: 'pin', label: 'Pin' },
  { value: 'skewer', label: 'Skewer' },
  { value: 'mateIn1', label: 'Mate in 1' },
  { value: 'mateIn2', label: 'Mate in 2' },
  { value: 'mateIn3', label: 'Mate in 3' },
  { value: 'backRankMate', label: 'Back-rank mate' },
  { value: 'discoveredAttack', label: 'Discovered attack' },
  { value: 'doubleCheck', label: 'Double check' },
  { value: 'sacrifice', label: 'Sacrifice' },
  { value: 'deflection', label: 'Deflection' },
  { value: 'attraction', label: 'Attraction' },
  { value: 'hangingPiece', label: 'Hanging piece' },
  { value: 'advancedPawn', label: 'Advanced pawn' },
  { value: 'promotion', label: 'Promotion' },
  { value: 'endgame', label: 'Endgame' },
  { value: 'rookEndgame', label: 'Rook endgame' },
  { value: 'pawnEndgame', label: 'Pawn endgame' },
  { value: 'zugzwang', label: 'Zugzwang' },
  { value: 'quietMove', label: 'Quiet move' },
];

const toInline = (ex: Exercise): CoursePuzzle => ({ kind: 'inline', ...ex, _id: newId() });

/** Кнопки «из базы» и «из книги» + их диалоги. onAdd получает новые inline-задачи для добавления в блок. */
export const PuzzleSourceDialogs: React.FC<{ onAdd: (puzzles: CoursePuzzle[]) => void }> = ({ onAdd }) => {
  const { t } = useTranslation();
  const [baseOpen, setBaseOpen] = useState(false);
  const [bookOpen, setBookOpen] = useState(false);

  // --- из базы ---
  const [theme, setTheme] = useState('');
  const [minR, setMinR] = useState('1200');
  const [maxR, setMaxR] = useState('1800');
  const [count, setCount] = useState('6');
  const [picking, setPicking] = useState(false);

  const pickBase = async () => {
    setPicking(true);
    try {
      const min = parseInt(minR, 10);
      const max = parseInt(maxR, 10);
      const ex = await pickPuzzlesFromBase({
        theme: theme || undefined,
        minRating: Number.isFinite(min) ? min : undefined,
        maxRating: Number.isFinite(max) ? max : undefined,
        count: Math.max(1, Math.min(30, parseInt(count, 10) || 6)),
      });
      if (ex.length === 0) {
        notification.info({ message: t('courses.pick.none', 'No puzzles matched — widen the rating or theme.') });
        return;
      }
      onAdd(ex.map(toInline));
      notification.success({ message: t('courses.pick.added', 'Added {{n}} puzzles', { n: ex.length }) });
      setBaseOpen(false);
    } catch { /* интерсептор */ } finally {
      setPicking(false);
    }
  };

  // --- из книги ---
  const [books, setBooks] = useState<PuzzleBookSummary[]>([]);
  const [booksLoading, setBooksLoading] = useState(false);
  const [bookId, setBookId] = useState('');
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    if (!bookOpen || books.length) return;
    setBooksLoading(true);
    getPuzzleBooks()
      .then((list) => setBooks(list))
      .catch(() => { /* интерсептор */ })
      .finally(() => setBooksLoading(false));
  }, [bookOpen, books.length]);

  const importBook = async () => {
    if (!bookId) return;
    setImporting(true);
    try {
      const book = await getPuzzleBook(bookId);
      const ex = (book.exercises || []).filter((e) => e.fen && e.solution);
      if (ex.length === 0) {
        notification.info({ message: t('courses.pick.bookEmpty', 'This book has no solvable exercises.') });
        return;
      }
      onAdd(ex.map(toInline));
      notification.success({ message: t('courses.pick.added', 'Added {{n}} puzzles', { n: ex.length }) });
      setBookOpen(false);
    } catch { /* интерсептор */ } finally {
      setImporting(false);
    }
  };

  const selectedBook = books.find((b) => b._id === bookId);

  return (
    <>
      <Button size="small" variant="outlined" startIcon={<TravelExploreRounded />} onClick={() => setBaseOpen(true)}>
        {t('courses.pick.fromBase', 'From base')}
      </Button>
      <Button size="small" variant="outlined" startIcon={<MenuBookRounded />} onClick={() => setBookOpen(true)}>
        {t('courses.pick.fromBook', 'From book')}
      </Button>

      {/* База по теме/рейтингу */}
      <Dialog open={baseOpen} onClose={() => setBaseOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>{t('courses.pick.baseTitle', 'Add puzzles from the base')}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField select size="small" label={t('courses.pick.theme', 'Theme')} value={theme} onChange={(e) => setTheme(e.target.value)} fullWidth>
              {THEMES.map((th) => <MenuItem key={th.value || 'any'} value={th.value}>{t(`courses.pick.themeOpt.${th.value || 'any'}`, th.label)}</MenuItem>)}
            </TextField>
            <Stack direction="row" spacing={2}>
              <TextField size="small" type="number" label={t('courses.pick.minRating', 'Min rating')} value={minR} onChange={(e) => setMinR(e.target.value)} fullWidth />
              <TextField size="small" type="number" label={t('courses.pick.maxRating', 'Max rating')} value={maxR} onChange={(e) => setMaxR(e.target.value)} fullWidth />
            </Stack>
            <TextField size="small" type="number" label={t('courses.pick.count', 'How many')} value={count} onChange={(e) => setCount(e.target.value)} inputProps={{ min: 1, max: 30 }} fullWidth />
            <Typography variant="caption" color="text.secondary">{t('courses.pick.baseHint', 'Random puzzles from 6M+ Lichess positions, copied into the course.')}</Typography>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBaseOpen(false)}>{t('common.cancel', 'Cancel')}</Button>
          <Button variant="contained" onClick={pickBase} disabled={picking} startIcon={picking ? <CircularProgress size={16} color="inherit" /> : undefined}>
            {t('courses.pick.add', 'Add')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Из задачника (дижитайзер) */}
      <Dialog open={bookOpen} onClose={() => setBookOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>{t('courses.pick.bookTitle', 'Import puzzles from a book')}</DialogTitle>
        <DialogContent>
          {booksLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}><CircularProgress size={24} /></Box>
          ) : books.length === 0 ? (
            <Alert severity="info" sx={{ mt: 1 }}>{t('courses.pick.noBooks', 'No puzzle books yet — digitize one first.')}</Alert>
          ) : (
            <Stack spacing={2} sx={{ mt: 1 }}>
              <TextField select size="small" label={t('courses.pick.book', 'Book')} value={bookId} onChange={(e) => setBookId(e.target.value)} fullWidth>
                {books.map((b) => <MenuItem key={b._id} value={b._id}>{b.title} ({b.exercisesCount})</MenuItem>)}
              </TextField>
              {selectedBook && (
                <Typography variant="caption" color="text.secondary">
                  {t('courses.pick.bookHint', 'All {{n}} exercises are copied into the course as puzzles.', { n: selectedBook.exercisesCount })}
                </Typography>
              )}
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBookOpen(false)}>{t('common.cancel', 'Cancel')}</Button>
          <Button variant="contained" onClick={importBook} disabled={importing || !bookId} startIcon={importing ? <CircularProgress size={16} color="inherit" /> : undefined}>
            {t('courses.pick.import', 'Import')}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default PuzzleSourceDialogs;
