import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  alpha, Alert, Box, Button, Chip, CircularProgress, IconButton, LinearProgress, Paper, Stack, TextField, Typography,
} from '@mui/material';
import AutoStoriesIcon from '@mui/icons-material/AutoStories';
import CloseIcon from '@mui/icons-material/Close';
import EditIcon from '@mui/icons-material/Edit';
import MenuBookRoundedIcon from '@mui/icons-material/MenuBookRounded';
import { useTranslation } from 'react-i18next';
import { AxiosError } from 'axios';

import { convertTaskToCourse, getDigitizeTask } from '@/api/digitizer';
import { DigitizeTask, ReadyChapter } from '@/types/PuzzleBook';

export interface StoredTask {
  taskId: string;
  title: string;
  createdAt: string;
  bookId?: string;
}

interface DigitizeTaskCardProps {
  stored: StoredTask;
  onChange: (patch: Partial<StoredTask>) => void;
  onRemove: () => void;
  onCourseCreated: () => void;
}

// 5 с: опрос статуса не считается в лимит бэкенда, но и чаще смысла нет — страница идёт ~0,5 с
const POLL_INTERVAL_MS = 5000;
const isFinal = (task: DigitizeTask | null) => task?.status === 'completed' || task?.status === 'failed';

type ChipColor = 'default' | 'primary' | 'success' | 'error' | 'warning' | 'info';
const STATUS_COLOR: Record<string, ChipColor> = {
  loading: 'default', pending: 'info', processing: 'primary', completed: 'success', failed: 'error', lost: 'warning',
};

export const DigitizeTaskCard: React.FC<DigitizeTaskCardProps> = ({ stored, onChange, onRemove, onCourseCreated }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [task, setTask] = useState<DigitizeTask | null>(null);
  const [lost, setLost] = useState(false);
  const [title, setTitle] = useState(stored.title);
  // Какую кнопку сейчас обрабатываем: имя главы или 'course' для кнопки всего курса
  const [syncing, setSyncing] = useState<string | null>(null);

  // Опрос статуса раз в 5 с, пока задача не завершится
  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;
    const poll = async () => {
      try {
        const next = await getDigitizeTask(stored.taskId);
        if (cancelled) return;
        setTask(next);
        if (!isFinal(next)) timer = setTimeout(poll, POLL_INTERVAL_MS);
      } catch (e) {
        if (cancelled) return;
        // 404 — микросервис уже удалил старую задачу; на прочие ошибки пробуем ещё раз
        if ((e as AxiosError).response?.status === 404) setLost(true);
        else timer = setTimeout(poll, POLL_INTERVAL_MS);
      }
    };
    poll();
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [stored.taskId]);

  /**
   * Создаёт задачник из готовых глав (или дописывает в него новые) и открывает редактор —
   * на первой задаче выбранной главы, если она указана.
   */
  const openCourse = async (chapter?: ReadyChapter) => {
    setSyncing(chapter?.filename ?? 'course');
    try {
      const result = await convertTaskToCourse(stored.taskId, title.trim() || stored.title);
      if (!stored.bookId) {
        onChange({ bookId: result._id, title: result.title });
        onCourseCreated();
      }
      const firstIndex = result.chapters.find((c) => c.filename === chapter?.filename)?.firstIndex ?? 0;
      navigate(`/digitizer/books/${result._id}/edit?exercise=${firstIndex}`);
    } catch {
      // ошибку уже показал перехватчик axios
    } finally {
      setSyncing(null);
    }
  };

  const status = task?.status;
  const percent = Math.round(status === 'completed' ? 100 : task?.progress_percent ?? 0);
  const positions = task?.processed_positions_count ?? task?.positions ?? 0;
  const chapters = task?.ready_chapters ?? [];
  const needsTitle = !stored.bookId && (chapters.length > 0 || status === 'completed');
  const statusKey = lost ? 'lost' : status ?? 'loading';
  const tone = status === 'completed' ? 'success' : status === 'failed' ? 'error' : 'primary';
  // Этапы: очередь -> распознавание -> готово (курс создан — все этапы пройдены)
  const stage = status === 'completed' ? (stored.bookId ? 3 : 2) : status === 'processing' ? 1 : 0;
  const stages = [
    t('digitizer.task.stages.queue', 'Queue'),
    t('digitizer.task.stages.recognition', 'Recognition'),
    t('digitizer.task.stages.ready', 'Ready'),
  ];

  return (
    <Paper sx={{ p: { xs: 2, sm: 2.5 } }} data-testid="digitize-task">
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ minWidth: 0 }}>
          <Box sx={{
            width: 40, height: 40, borderRadius: 2, display: 'grid', placeItems: 'center', flexShrink: 0,
            bgcolor: (th) => alpha(th.palette[tone].main, 0.14), color: `${tone}.main`,
          }}>
            <MenuBookRoundedIcon fontSize="small" />
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="subtitle1" fontWeight={700} noWrap title={stored.title} sx={{ color: 'text.primary' }}>{stored.title}</Typography>
            <Typography variant="caption" color="text.secondary">{new Date(stored.createdAt).toLocaleString()}</Typography>
          </Box>
        </Stack>
        <Stack direction="row" spacing={0.5} alignItems="center" sx={{ flexShrink: 0 }}>
          <Chip
            size="small"
            label={t(`digitizer.task.status.${statusKey}`)}
            color={STATUS_COLOR[statusKey]}
            variant={statusKey === 'completed' || statusKey === 'processing' ? 'filled' : 'outlined'}
            sx={{ fontWeight: 600 }}
          />
          {(isFinal(task) || lost) && (
            <IconButton size="small" onClick={onRemove} aria-label="remove">
              <CloseIcon fontSize="small" />
            </IconButton>
          )}
        </Stack>
      </Stack>

      {!lost && status !== 'failed' && (
        <Box sx={{ mt: 2 }}>
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <LinearProgress
              variant={task && status !== 'pending' ? 'determinate' : 'indeterminate'}
              value={percent}
              color={status === 'completed' ? 'success' : 'primary'}
              sx={{ flex: 1 }}
            />
            <Typography variant="body2" fontWeight={700} sx={{ minWidth: 44, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{percent}%</Typography>
          </Stack>
          <Stack direction="row" spacing={0.75} sx={{ mt: 1.25 }} aria-hidden>
            {stages.map((label, i) => (
              <Stack key={label} direction="row" spacing={0.75} alignItems="center" sx={{ flex: 1, minWidth: 0 }}>
                <Box sx={{
                  width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                  bgcolor: i < stage ? 'success.main' : i === stage ? 'primary.main' : 'action.disabledBackground',
                  boxShadow: (th) => (i === stage ? `0 0 0 3px ${alpha(th.palette.primary.main, 0.25)}` : 'none'),
                }} />
                <Typography variant="caption" noWrap sx={{ color: i <= stage ? 'text.primary' : 'text.disabled' }}>{label}</Typography>
              </Stack>
            ))}
          </Stack>
          {task && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1.25, px: 1.25, py: 0.75, borderRadius: 1, bgcolor: 'surface.raised' }}>
              {status === 'pending'
                ? t('digitizer.task.queued')
                : t('digitizer.task.progressInfo', { current: task.current_page, total: task.total_pages, count: positions })}
            </Typography>
          )}
        </Box>
      )}

      {status === 'failed' && <Alert severity="error" sx={{ mt: 2 }}>{task?.error || t('digitizer.task.failed')}</Alert>}
      {lost && <Alert severity="warning" sx={{ mt: 2 }}>{t('digitizer.task.lostHelp')}</Alert>}

      {chapters.length > 0 && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="overline" color="text.secondary" component="p">
            {status === 'completed' ? t('digitizer.task.chapters') : t('digitizer.task.readyChapters')}
          </Typography>
          <Stack spacing={0.75} sx={{ maxHeight: 260, overflowY: 'auto', mt: 0.5 }}>
            {chapters.map((chapter, i) => (
              <Stack
                key={chapter.filename}
                direction={{ xs: 'column', sm: 'row' }}
                alignItems={{ xs: 'stretch', sm: 'center' }}
                justifyContent="space-between"
                spacing={1}
                sx={{ px: 1.5, py: 1, borderRadius: 2, bgcolor: 'surface.raised', border: 1, borderColor: 'divider' }}
              >
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="body2" fontWeight={600}>{t('digitizer.task.chapterTitle', { number: i + 1 })}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {t('digitizer.task.chapterInfo', { from: chapter.first_page ?? '?', to: chapter.last_page ?? '?', count: chapter.positions })}
                  </Typography>
                </Box>
                <Button
                  size="small"
                  variant="outlined"
                  color="inherit"
                  startIcon={syncing === chapter.filename ? <CircularProgress size={14} color="inherit" /> : <EditIcon />}
                  disabled={!!syncing || (needsTitle && !title.trim())}
                  onClick={() => openCourse(chapter)}
                  sx={{ flexShrink: 0 }}
                >
                  {t('digitizer.task.openChapter')}
                </Button>
              </Stack>
            ))}
          </Stack>
        </Box>
      )}

      {needsTitle && (
        <TextField
          size="small"
          fullWidth
          label={t('digitizer.form.courseTitle')}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          sx={{ mt: 2 }}
        />
      )}

      {(status === 'completed' || (stored.bookId && chapters.length > 0)) && (
        <Button
          sx={{ mt: 2 }}
          fullWidth
          variant="contained"
          color="success"
          startIcon={syncing === 'course' ? <CircularProgress size={18} color="inherit" /> : <AutoStoriesIcon />}
          disabled={!!syncing || (needsTitle && !title.trim()) || (status === 'completed' && positions === 0)}
          onClick={() => openCourse()}
        >
          {stored.bookId ? t('digitizer.task.openCourse') : t('digitizer.task.convert')}
        </Button>
      )}
    </Paper>
  );
};
