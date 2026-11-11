import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Stack, Paper, Typography, Button, Chip, CircularProgress, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField,
} from '@mui/material';
import AddRounded from '@mui/icons-material/AddRounded';
import SchoolRounded from '@mui/icons-material/SchoolRounded';
import { useTranslation } from 'react-i18next';
import { notification } from 'antd';

import { PageContainer, PageHeader } from '@/shared/components/ui/PageHeader';
import type { CourseSummary } from '@/types/Course';
import { getMyCourses, createCourse } from '@/api/courses';

export const CoursesListPage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState<CourseSummary[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const list = await getMyCourses();
        if (alive) setCourses(list);
      } catch { /* интерсептор */ } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  const handleCreate = async () => {
    const title = newTitle.trim();
    if (!title) return;
    setCreating(true);
    try {
      const course = await createCourse({ title, description: '' });
      notification.success({ message: t('courses.created', 'Course created') });
      navigate(`/club/courses/${course._id}/edit`);
    } catch { /* интерсептор */ } finally {
      setCreating(false);
    }
  };

  return (
    <PageContainer maxWidth={1100}>
      <PageHeader
        eyebrow={t('nav.groups.teaching', 'Teaching')}
        title={t('nav.courses', 'Courses')}
        subtitle={t('courses.listSubtitle', 'Build courses from chapters: text, puzzles and games.')}
        actions={(
          <Button variant="contained" startIcon={<AddRounded />} onClick={() => { setNewTitle(''); setDialogOpen(true); }}>
            {t('courses.new', 'New course')}
          </Button>
        )}
      />

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>
      ) : courses.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <SchoolRounded sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
          <Typography variant="h6" gutterBottom>{t('courses.emptyTitle', 'No courses yet')}</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {t('courses.emptyHint', 'Create your first course — add chapters with text, puzzles and games.')}
          </Typography>
          <Button variant="contained" startIcon={<AddRounded />} onClick={() => { setNewTitle(''); setDialogOpen(true); }}>
            {t('courses.new', 'New course')}
          </Button>
        </Paper>
      ) : (
        <Stack spacing={1.5}>
          {courses.map((c) => (
            <Paper
              key={c._id}
              sx={{ p: 2, cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }}
              onClick={() => navigate(`/club/courses/${c._id}/edit`)}
            >
              <Stack direction="row" spacing={2} alignItems="center">
                <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                  <Typography variant="subtitle1" noWrap sx={{ fontWeight: 600 }}>{c.title || t('courses.untitled', 'Untitled course')}</Typography>
                  {c.description && <Typography variant="body2" color="text.secondary" noWrap>{c.description}</Typography>}
                </Box>
                <Chip
                  size="small"
                  color={c.status === 'published' ? 'success' : 'default'}
                  label={c.status === 'published' ? t('courses.statusPublished', 'Published') : t('courses.statusDraft', 'Draft')}
                />
              </Stack>
            </Paper>
          ))}
        </Stack>
      )}

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>{t('courses.new', 'New course')}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label={t('courses.courseTitle', 'Course title')}
            fullWidth
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleCreate(); }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>{t('common.cancel', 'Cancel')}</Button>
          <Button variant="contained" onClick={handleCreate} disabled={creating || !newTitle.trim()}>
            {t('courses.create', 'Create')}
          </Button>
        </DialogActions>
      </Dialog>
    </PageContainer>
  );
};

export default CoursesListPage;
