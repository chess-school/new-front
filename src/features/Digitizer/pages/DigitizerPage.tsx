import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Box, CircularProgress, Paper, Stack, Typography } from '@mui/material';
import HourglassEmptyRoundedIcon from '@mui/icons-material/HourglassEmptyRounded';
import { useTranslation } from 'react-i18next';

import { getPuzzleBooks } from '@/api/digitizer';
import { PuzzleBookSummary } from '@/types/PuzzleBook';
import { BookList } from '../components/BookList';
import { DigitizeTaskCard, StoredTask } from '../components/DigitizeTaskCard';
import { DigitizeUploadForm } from '../components/DigitizeUploadForm';
import { PageContainer, PageHeader } from '@/shared/components/ui/PageHeader';

// У микросервиса нет списка задач пользователя — запоминаем свои задачи в браузере
const TASKS_KEY = 'digitizer.tasks';
const MAX_TASKS = 10;

const loadTasks = (): StoredTask[] => {
  try {
    const parsed = JSON.parse(localStorage.getItem(TASKS_KEY) || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const saveTasks = (tasks: StoredTask[]) => {
  try {
    localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
  } catch {
    // хранилище недоступно — список задач проживёт до перезагрузки
  }
};

export const DigitizerPage: React.FC = () => {
  const { t } = useTranslation();
  const [tasks, setTasks] = useState<StoredTask[]>(loadTasks);
  const [books, setBooks] = useState<PuzzleBookSummary[] | null>(null);

  const updateTasks = useCallback((change: (tasks: StoredTask[]) => StoredTask[]) => {
    setTasks((current) => {
      const next = change(current).slice(0, MAX_TASKS);
      saveTasks(next);
      return next;
    });
  }, []);

  const fetchBooks = useCallback(() => {
    getPuzzleBooks().then(setBooks).catch(() => setBooks([]));
  }, []);

  useEffect(fetchBooks, [fetchBooks]);

  // #library — прокрутка к списку книг (в том числе повторный клик по пункту меню)
  const { hash, key } = useLocation();
  const libraryRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (hash === '#library') libraryRef.current?.scrollIntoView?.({ behavior: 'smooth', block: 'start' });
  }, [hash, key, books]);

  const handleStarted = (taskId: string, title: string) => {
    updateTasks((current) => [{ taskId, title, createdAt: new Date().toISOString() }, ...current]);
  };

  return (
    <PageContainer>
      <PageHeader eyebrow={t('nav.groups.coach', 'Coaching')} title={t('digitizer.title')} subtitle={t('digitizer.subtitle')} />

      <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 1fr) minmax(0, 1fr)' }, alignItems: 'start' }}>
        <DigitizeUploadForm onStarted={handleStarted} />
        <Stack spacing={2}>
          <Stack direction="row" alignItems="baseline" justifyContent="space-between">
            <Typography variant="h6">{t('digitizer.task.heading', 'Digitizing tasks')}</Typography>
            {tasks.length > 0 && <Typography variant="caption" color="text.secondary">{tasks.length} / {MAX_TASKS}</Typography>}
          </Stack>
          {tasks.length === 0 && (
            <Paper sx={{ p: 3, textAlign: 'center', borderStyle: 'dashed' }}>
              <HourglassEmptyRoundedIcon sx={{ color: 'text.disabled' }} />
              <Typography color="text.secondary" sx={{ mt: 1 }}>{t('digitizer.task.empty')}</Typography>
            </Paper>
          )}
          {tasks.map((task) => (
            <DigitizeTaskCard
              key={task.taskId}
              stored={task}
              onChange={(patch) => updateTasks((current) => current.map((x) => (x.taskId === task.taskId ? { ...x, ...patch } : x)))}
              onRemove={() => updateTasks((current) => current.filter((x) => x.taskId !== task.taskId))}
              onCourseCreated={fetchBooks}
            />
          ))}
        </Stack>
      </Box>

      {/* Библиотека книг — сюда ведёт пункт меню «Конструктор курсов» (/digitizer#library) */}
      <Box id="library" ref={libraryRef} sx={{ mt: { xs: 5, md: 7 }, scrollMarginTop: 80 }}>
        <Stack direction="row" alignItems="baseline" justifyContent="space-between" sx={{ mb: 2 }}>
          <Typography variant="h5" component="h2">{t('digitizer.books.heading')}</Typography>
          {books && books.length > 0 && <Typography variant="body2" color="text.secondary">{books.length}</Typography>}
        </Stack>
        {books === null ? <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress /></Box> : <BookList books={books} canEdit variant="table" />}
      </Box>
    </PageContainer>
  );
};
