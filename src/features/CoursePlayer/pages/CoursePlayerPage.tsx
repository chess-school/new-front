import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Stack, Paper, Typography, Button, Chip, CircularProgress, Alert, LinearProgress, Divider } from '@mui/material';
import ArrowBackRounded from '@mui/icons-material/ArrowBackRounded';
import CheckRounded from '@mui/icons-material/CheckRounded';
import MenuBookRounded from '@mui/icons-material/MenuBookRounded';
import ExtensionRounded from '@mui/icons-material/ExtensionRounded';
import SportsEsportsRounded from '@mui/icons-material/SportsEsportsRounded';
import { useTranslation } from 'react-i18next';

import { PageContainer, PageHeader } from '@/shared/components/ui/PageHeader';
import { getCourse, getMyCourseProgress, markCourseBlockComplete } from '@/api/courses';
import type { CourseDetail } from '@/types/Course';
import type { CourseBlock } from '@/features/Courses/types/courseBlocks';
import { courseProgressStats } from '../lib/progress';
import { MarkdownView } from '../components/MarkdownView';
import { PuzzleBlockPlayer } from '../components/PuzzleBlockPlayer';
import { GameBlockPlayer } from '../components/GameBlockPlayer';

const blockMeta = (type: CourseBlock['type']) => ({
  text: { icon: <MenuBookRounded fontSize="small" />, key: 'coursePlayer.type.text', fallback: 'Theory' },
  puzzle: { icon: <ExtensionRounded fontSize="small" />, key: 'coursePlayer.type.puzzle', fallback: 'Puzzles' },
  game: { icon: <SportsEsportsRounded fontSize="small" />, key: 'coursePlayer.type.game', fallback: 'Game' },
  blindfold: { icon: <ExtensionRounded fontSize="small" />, key: 'coursePlayer.type.blindfold', fallback: 'Blindfold' },
  solveMode: { icon: <ExtensionRounded fontSize="small" />, key: 'coursePlayer.type.solveMode', fallback: 'Solve mode' },
}[type]);

/** Один блок: шапка (тип+заголовок+галочка) + проигрыватель по типу. */
const BlockView: React.FC<{ block: CourseBlock; done: boolean; onDone: () => void }> = ({ block, done, onDone }) => {
  const { t } = useTranslation();
  const m = blockMeta(block.type);

  // Текстовый блок засчитывается прочитанным сразу (нет интерактива).
  useEffect(() => {
    if (block.type === 'text') onDone();
    // onDone стабильна; реагируем на появление блока
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [block.id]);

  return (
    <Paper sx={{ p: { xs: 2, sm: 2.5 } }}>
      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
        <Chip size="small" icon={m.icon} label={t(m.key, m.fallback)} />
        {block.title && <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>{block.title}</Typography>}
        <Box sx={{ flexGrow: 1 }} />
        {done && <Chip size="small" color="success" icon={<CheckRounded fontSize="small" />} label={t('coursePlayer.done', 'Done')} />}
      </Stack>
      {block.type === 'text' && <MarkdownView body={block.body} />}
      {block.type === 'puzzle' && <PuzzleBlockPlayer block={block} onComplete={onDone} />}
      {block.type === 'game' && <GameBlockPlayer block={block} onComplete={onDone} />}
    </Paper>
  );
};

export const CoursePlayerPage: React.FC = () => {
  const { courseId = '' } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [done, setDone] = useState<Set<string>>(new Set());
  const posted = useRef<Set<string>>(new Set()); // блоки, уже отправленные на бэк (гард от повторов)

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const c = await getCourse(courseId);
        if (!alive) return;
        setCourse(c);
        // Гидратация прогресса (не блокируем показ курса, если прогресс не пришёл)
        try {
          const completed = await getMyCourseProgress(courseId);
          if (!alive) return;
          setDone(new Set(completed));
          completed.forEach((id) => posted.current.add(id)); // уже на бэке — не слать повторно
        } catch { /* нет доступа к прогрессу — не критично */ }
      } catch {
        if (alive) setNotFound(true);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [courseId]);

  const markDone = useCallback((blockId: string, chapterId?: string) => {
    setDone((prev) => (prev.has(blockId) ? prev : new Set(prev).add(blockId)));
    if (!posted.current.has(blockId)) {
      posted.current.add(blockId);
      markCourseBlockComplete(courseId, blockId, chapterId).catch(() => { /* фоновая отметка — молча */ });
    }
  }, [courseId]);

  const chapters = useMemo(() => course?.modules?.chapters ?? [], [course]);
  // Прогресс — через чистый courseProgressStats (учитывает только существующие блоки, ≤100%;
  // покрыт юнит-тестом progress.test.ts против регресса бага E3 «150%»).
  const { completed: completedCount, total: totalBlocks, percent: progress } = useMemo(
    () => courseProgressStats(chapters, done),
    [chapters, done],
  );

  if (loading) {
    return <PageContainer><Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box></PageContainer>;
  }
  if (notFound || !course) {
    return (
      <PageContainer>
        <Alert severity="error">{t('coursePlayer.notFound', 'Course not found')}</Alert>
        <Button sx={{ mt: 2 }} startIcon={<ArrowBackRounded />} onClick={() => navigate(-1)}>{t('common.back', 'Back')}</Button>
      </PageContainer>
    );
  }

  return (
    <PageContainer maxWidth={1000}>
      <PageHeader
        eyebrow={t('nav.courses', 'Courses')}
        title={course.title}
        subtitle={course.description || undefined}
        actions={<Button variant="outlined" startIcon={<ArrowBackRounded />} onClick={() => navigate(-1)}>{t('common.back', 'Back')}</Button>}
      />

      {totalBlocks > 0 && (
        <Paper sx={{ p: 2, mb: 3 }}>
          <Stack direction="row" spacing={2} alignItems="center">
            <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>
              {t('coursePlayer.progress', 'Progress')}: {completedCount} / {totalBlocks}
            </Typography>
            <LinearProgress variant="determinate" value={progress} aria-label={t('coursePlayer.progress', 'Progress')} sx={{ flexGrow: 1, borderRadius: 1, height: 8 }} />
            <Typography variant="body2" sx={{ fontWeight: 700 }}>{progress}%</Typography>
          </Stack>
        </Paper>
      )}

      {chapters.length === 0 && (
        <Alert severity="info">{t('coursePlayer.empty', 'This course has no content yet.')}</Alert>
      )}

      <Stack spacing={4}>
        {chapters.map((ch, ci) => (
          <Box key={ch.id}>
            <Stack spacing={0.5} sx={{ mb: 2 }}>
              <Typography variant="overline" color="text.secondary">{t('courses.chapter', 'Chapter')} {ci + 1}</Typography>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>{ch.title}</Typography>
              {ch.description && <Typography variant="body2" color="text.secondary">{ch.description}</Typography>}
            </Stack>
            <Divider sx={{ mb: 2 }} />
            <Stack spacing={2.5}>
              {ch.blocks.map((b) => (
                <BlockView key={b.id} block={b} done={done.has(b.id)} onDone={() => markDone(b.id, ch.id)} />
              ))}
              {ch.blocks.length === 0 && (
                <Typography variant="body2" color="text.secondary">{t('coursePlayer.noBlocks', 'No blocks in this chapter.')}</Typography>
              )}
            </Stack>
          </Box>
        ))}
      </Stack>
    </PageContainer>
  );
};

export default CoursePlayerPage;
