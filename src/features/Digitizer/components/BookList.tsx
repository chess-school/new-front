import React, { useMemo } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  alpha, Box, Button, Card, CardActionArea, CardContent, Chip, LinearProgress, Paper, Stack, Table, TableBody, TableCell,
  TableHead, TableRow, Typography,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import ShuffleIcon from '@mui/icons-material/Shuffle';
import MenuBookRoundedIcon from '@mui/icons-material/MenuBookRounded';
import { useTranslation } from 'react-i18next';
import { PuzzleBookSummary } from '@/types/PuzzleBook';
import { tokens } from '@/theme/tokens';

interface BookListProps {
  books: PuzzleBookSummary[];
  canEdit: boolean;
  /** cards — витрина задачников (/books), table — библиотека оцифровщика */
  variant?: 'cards' | 'table';
}

/** Сколько заданий книги ученик решил в этом браузере (тот же ключ, что у страницы решения) */
const solvedCount = (bookId: string): number => {
  try {
    const parsed = JSON.parse(localStorage.getItem(`puzzleBook.solved.${bookId}`) || '[]');
    return Array.isArray(parsed) ? parsed.length : 0;
  } catch {
    return 0;
  }
};

/** Стабильный оттенок обложки по названию книги */
const hueOf = (text: string) => {
  let h = 0;
  for (let i = 0; i < text.length; i++) h = (h * 31 + text.charCodeAt(i)) % 360;
  return h;
};

/** Генеративная обложка: тёмный градиент оттенка книги, шахматная сетка и фигура */
const BookCover: React.FC<{ title: string }> = ({ title }) => {
  const hue = hueOf(title);
  return (
    <Box
      aria-hidden
      sx={{
        position: 'relative',
        aspectRatio: '16 / 9',
        overflow: 'hidden',
        background: `linear-gradient(135deg, hsl(${hue} 45% 26%) 0%, hsl(${(hue + 40) % 360} 35% 14%) 60%, ${tokens.bg.canvas} 100%)`,
      }}
    >
      {/* Уголок доски 4×4, уходящий в тень */}
      <Box sx={{
        position: 'absolute', right: -12, bottom: -12, width: '58%', aspectRatio: '1 / 1', opacity: 0.22,
        transform: 'rotate(-12deg)',
        backgroundImage: `repeating-conic-gradient(${tokens.board.light} 0 25%, transparent 0 50%)`,
        backgroundSize: '25% 25%',
        maskImage: 'linear-gradient(135deg, transparent 5%, black 70%)',
        WebkitMaskImage: 'linear-gradient(135deg, transparent 5%, black 70%)',
      }} />
      <Box sx={{ position: 'absolute', right: 18, top: 10, fontSize: 64, lineHeight: 1, color: alpha(tokens.text.primary, 0.85), textShadow: '0 6px 24px rgba(0,0,0,0.5)' }}>
        ♞
      </Box>
      <Typography sx={{
        position: 'absolute', left: 16, right: 96, bottom: 14, fontWeight: 800, fontSize: '1.05rem', lineHeight: 1.2,
        color: tokens.text.primary, letterSpacing: '-0.01em', textShadow: '0 2px 12px rgba(0,0,0,0.6)',
        display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
      }}>
        {title}
      </Typography>
    </Box>
  );
};

const StatusChip: React.FC<{ status: PuzzleBookSummary['status'] }> = ({ status }) => {
  const { t } = useTranslation();
  return (
    <Chip
      size="small"
      label={t(`digitizer.status.${status}`)}
      color={status === 'published' ? 'success' : 'default'}
      variant={status === 'published' ? 'filled' : 'outlined'}
      sx={{ fontWeight: 600 }}
    />
  );
};

// Бейдж области видимости для тренера (Module 1): 🔒 Приватный / 📝 Черновик / 🌐 Публичный / 👥 Групповой / 🗄 Архив.
// Для легаси-задачников (visibility не задана) падаем на старый StatusChip.
const VISIBILITY_BADGE: Record<string, { emoji: string; key: string; dflt: string; color: 'success' | 'warning' | 'info' | 'default' }> = {
  public: { emoji: '🌐', key: 'digitizer.visibility.public', dflt: 'Public', color: 'success' },
  private: { emoji: '🔒', key: 'digitizer.visibility.private', dflt: 'Private', color: 'warning' },
  group: { emoji: '👥', key: 'digitizer.visibility.group', dflt: 'Group', color: 'info' },
  draft: { emoji: '📝', key: 'digitizer.visibility.draft', dflt: 'Draft', color: 'default' },
};

const AccessBadges: React.FC<{ book: PuzzleBookSummary }> = ({ book }) => {
  const { t } = useTranslation();
  if (!book.visibility) return <StatusChip status={book.status} />;
  const b = VISIBILITY_BADGE[book.visibility] ?? VISIBILITY_BADGE.draft;
  let label = `${b.emoji} ${t(b.key, b.dflt)}`;
  if (book.visibility === 'private' && book.allowedUsersCount) label += ` · ${book.allowedUsersCount}`;
  if (book.visibility === 'group' && book.allowedGroupsCount) label += ` · ${book.allowedGroupsCount}`;
  return (
    <>
      <Chip size="small" label={label} color={b.color} variant={b.color === 'default' ? 'outlined' : 'filled'} sx={{ fontWeight: 600 }} />
      {book.isArchived && (
        <Chip size="small" label={`🗄 ${t('digitizer.visibility.archived', 'Archived')}`} color="default" variant="outlined" sx={{ fontWeight: 600 }} />
      )}
    </>
  );
};

export const BookList: React.FC<BookListProps> = ({ books, canEdit, variant = 'cards' }) => {
  const { t } = useTranslation();
  const progress = useMemo(() => new Map(books.map((b) => [b._id, solvedCount(b._id)])), [books]);

  if (books.length === 0) {
    return (
      <Paper sx={{ p: 4, textAlign: 'center' }}>
        <MenuBookRoundedIcon sx={{ fontSize: 40, color: 'text.disabled' }} />
        <Typography color="text.secondary" sx={{ mt: 1 }}>{t('digitizer.books.empty')}</Typography>
      </Paper>
    );
  }

  if (variant === 'table') {
    return (
      <Paper sx={{ overflowX: 'auto' }}>
        <Table size="small" sx={{ minWidth: 640 }}>
          <TableHead>
            <TableRow>
              <TableCell>{t('digitizer.books.title')}</TableCell>
              <TableCell align="right">{t('digitizer.books.exercises')}</TableCell>
              {canEdit && <TableCell>{t('digitizer.books.status')}</TableCell>}
              <TableCell>{t('digitizer.books.updated', 'Updated')}</TableCell>
              <TableCell />
            </TableRow>
          </TableHead>
          <TableBody>
            {books.map((book) => (
              <TableRow key={book._id} hover>
                <TableCell sx={{ py: 1.5 }}>
                  <Typography fontWeight={600}>{book.title}</Typography>
                  {book.description && <Typography variant="body2" color="text.secondary">{book.description}</Typography>}
                </TableCell>
                <TableCell align="right" sx={{ fontVariantNumeric: 'tabular-nums' }}>{book.exercisesCount}</TableCell>
                {canEdit && <TableCell><Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap><AccessBadges book={book} /></Stack></TableCell>}
                <TableCell sx={{ color: 'text.secondary', whiteSpace: 'nowrap' }}>{new Date(book.updatedAt).toLocaleDateString()}</TableCell>
                <TableCell align="right">
                  <Stack direction="row" spacing={1} justifyContent="flex-end">
                    {canEdit && (
                      <Button size="small" variant="outlined" color="inherit" startIcon={<EditIcon />} component={RouterLink} to={`/digitizer/books/${book._id}/edit`}>
                        {t('digitizer.books.edit')}
                      </Button>
                    )}
                    <Button size="small" variant="contained" startIcon={<PlayArrowIcon />} component={RouterLink} to={`/books/${book._id}/solve`}>
                      {t('digitizer.books.solve')}
                    </Button>
                    {/* Задачи книги в общем потоке «Задачи» — по одной, вперемешку */}
                    {book.status === 'published' && (
                      <Button size="small" variant="outlined" color="inherit" startIcon={<ShuffleIcon />} component={RouterLink} to={`/puzzles?bookId=${book._id}`}>
                        {t('digitizer.books.puzzleStream')}
                      </Button>
                    )}
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>
    );
  }

  return (
    <Box sx={{ display: 'grid', gap: { xs: 2, md: 2.5 }, gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 270px), 1fr))' }}>
      {books.map((book) => {
        const solved = Math.min(progress.get(book._id) ?? 0, book.exercisesCount);
        const percent = book.exercisesCount ? Math.round((solved / book.exercisesCount) * 100) : 0;
        return (
          <Card
            key={book._id}
            data-testid="book-card"
            sx={{
              display: 'flex', flexDirection: 'column', overflow: 'hidden',
              '&:hover': { borderColor: 'primary.main', transform: 'translateY(-2px)', boxShadow: '0 14px 30px rgba(0,0,0,0.35)' },
            }}
          >
            <CardActionArea component={RouterLink} to={`/books/${book._id}/solve`} aria-label={book.title}>
              <BookCover title={book.title} />
            </CardActionArea>
            <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 1.25, pb: '16px !important' }}>
              <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
                <Chip size="small" variant="outlined" label={t('digitizer.books.exercisesCount', { count: book.exercisesCount, defaultValue: '{{count}} exercises' })} />
                {canEdit && <AccessBadges book={book} />}
              </Stack>
              {book.description && (
                <Typography variant="body2" color="text.secondary" sx={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {book.description}
                </Typography>
              )}
              <Box sx={{ mt: 'auto' }}>
                <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
                  <Typography variant="caption" color="text.secondary">
                    {t('digitizer.solve.progress', { solved, total: book.exercisesCount })}
                  </Typography>
                  <Typography variant="caption" fontWeight={700} sx={{ color: percent === 100 ? 'success.main' : 'text.primary' }}>{percent}%</Typography>
                </Stack>
                <LinearProgress variant="determinate" value={percent} color={percent === 100 ? 'success' : 'primary'} sx={{ height: 6 }} />
              </Box>
              <Stack direction="row" spacing={1} sx={{ pt: 0.5 }}>
                <Button size="small" variant="contained" startIcon={<PlayArrowIcon />} component={RouterLink} to={`/books/${book._id}/solve`} sx={{ flex: 1 }}>
                  {t('digitizer.books.solve')}
                </Button>
                {book.status === 'published' && (
                  <Button size="small" variant="outlined" color="inherit" aria-label={t('digitizer.books.puzzleStream')} title={t('digitizer.books.puzzleStream')}
                    component={RouterLink} to={`/puzzles?bookId=${book._id}`} sx={{ minWidth: 40, px: 1 }}>
                    <ShuffleIcon fontSize="small" />
                  </Button>
                )}
                {canEdit && (
                  <Button size="small" variant="outlined" color="inherit" aria-label={t('digitizer.books.edit')} title={t('digitizer.books.edit')}
                    component={RouterLink} to={`/digitizer/books/${book._id}/edit`} sx={{ minWidth: 40, px: 1 }}>
                    <EditIcon fontSize="small" />
                  </Button>
                )}
              </Stack>
            </CardContent>
          </Card>
        );
      })}
    </Box>
  );
};
