import React, { useEffect, useState } from 'react';
import { Box, CircularProgress } from '@mui/material';
import { PageContainer, PageHeader } from '@/shared/components/ui/PageHeader';
import { useTranslation } from 'react-i18next';

import { getPuzzleBooks } from '@/api/digitizer';
import { useAuth } from '@/context/AuthContext';
import { PuzzleBookSummary } from '@/types/PuzzleBook';
import { BookList } from '../components/BookList';

// Задачники для решения: ученики видят опубликованные, тренеры и админы — все
export const PuzzleBooksPage: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const canEdit = !!user?.roles?.some((role) => role === 'COACH' || role === 'ADMIN');
  const [books, setBooks] = useState<PuzzleBookSummary[] | null>(null);

  useEffect(() => {
    getPuzzleBooks().then(setBooks).catch(() => setBooks([]));
  }, []);

  const total = books?.reduce((sum, b) => sum + b.exercisesCount, 0) ?? 0;

  return (
    <PageContainer>
      <PageHeader
        eyebrow={t('nav.groups.training', 'Training')}
        title={t('digitizer.books.heading')}
        subtitle={books && books.length > 0
          ? t('digitizer.books.summary', { books: books.length, exercises: total, defaultValue: '{{books}} books · {{exercises}} exercises' })
          : undefined}
      />
      {books === null ? <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box> : <BookList books={books} canEdit={canEdit} />}
    </PageContainer>
  );
};
