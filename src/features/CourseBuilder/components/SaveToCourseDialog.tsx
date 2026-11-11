import React, { useEffect, useState } from 'react';
import {
  Button, Dialog, DialogTitle, DialogContent, DialogActions, Stack, TextField,
  MenuItem, CircularProgress, Alert, Box, Typography,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { notification } from 'antd';

import type { CourseSummary } from '@/types/Course';
import { getMyCourses, getCourse, updateCourse } from '@/api/courses';
import { makeBlock, makeChapter, emptyContent } from '../lib/courseDraft';
import type { GameBlock } from '@/features/Courses/types/courseBlocks';

/** Диалог «забрать партию с доски в курс»: добавляет новую главу с game-блоком текущего PGN. */
export const SaveToCourseDialog: React.FC<{
  open: boolean;
  onClose: () => void;
  pgn: string;
  orientation: 'white' | 'black';
}> = ({ open, onClose, pgn, orientation }) => {
  const { t } = useTranslation();
  const [courses, setCourses] = useState<CourseSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [courseId, setCourseId] = useState('');
  const [chapterTitle, setChapterTitle] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    getMyCourses()
      .then((list) => setCourses(list))
      .catch(() => { /* не тренер / интерсептор */ })
      .finally(() => setLoading(false));
  }, [open]);

  const save = async () => {
    if (!courseId || !pgn.trim()) return;
    setSaving(true);
    try {
      const course = await getCourse(courseId);
      const content = course.modules && Array.isArray(course.modules.chapters) ? course.modules : emptyContent();
      const block = { ...(makeBlock('game') as GameBlock), pgn, study: 'free' as const, orientation };
      const chapter = { ...makeChapter(chapterTitle.trim() || t('courses.saveToCourse.defaultChapter', 'From analysis')), blocks: [block] };
      const next = { ...content, chapters: [...content.chapters, chapter] };
      await updateCourse(courseId, { title: course.title, modules: next });
      notification.success({ message: t('courses.saveToCourse.done', 'Game added to the course') });
      setChapterTitle('');
      onClose();
    } catch { /* интерсептор */ } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>{t('courses.saveToCourse.title', 'Save game to a course')}</DialogTitle>
      <DialogContent>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}><CircularProgress size={24} /></Box>
        ) : courses.length === 0 ? (
          <Alert severity="info" sx={{ mt: 1 }}>{t('courses.saveToCourse.noCourses', 'No courses yet — create one first.')}</Alert>
        ) : (
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField select size="small" label={t('courses.saveToCourse.course', 'Course')} value={courseId} onChange={(e) => setCourseId(e.target.value)} fullWidth>
              {courses.map((c) => <MenuItem key={c._id} value={c._id}>{c.title || t('courses.untitled', 'Untitled course')}</MenuItem>)}
            </TextField>
            <TextField
              size="small"
              label={t('courses.saveToCourse.chapterTitle', 'New chapter title')}
              value={chapterTitle}
              onChange={(e) => setChapterTitle(e.target.value)}
              placeholder={t('courses.saveToCourse.defaultChapter', 'From analysis')}
              fullWidth
            />
            <Typography variant="caption" color="text.secondary">
              {t('courses.saveToCourse.hint', 'Adds a new chapter with this game (free analysis) to the selected course.')}
            </Typography>
          </Stack>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t('common.cancel', 'Cancel')}</Button>
        <Button variant="contained" onClick={save} disabled={saving || !courseId} startIcon={saving ? <CircularProgress size={16} color="inherit" /> : undefined}>
          {t('courses.saveToCourse.save', 'Save to course')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SaveToCourseDialog;
