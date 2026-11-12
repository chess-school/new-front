import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Stack, Paper, Typography, CircularProgress, Chip } from '@mui/material';
import SchoolRounded from '@mui/icons-material/SchoolRounded';
import PlayArrowRounded from '@mui/icons-material/PlayArrowRounded';
import { useTranslation } from 'react-i18next';

import { PageContainer, PageHeader } from '@/shared/components/ui/PageHeader';
import { getEnrolledCourses } from '@/api/courses';
import type { CourseSummary } from '@/types/Course';

/** Курсы ученика: карточки зачислений → открывают проигрыватель курса. */
export const MyCoursesPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [courses, setCourses] = useState<CourseSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    getEnrolledCourses()
      .then((list) => { if (alive) setCourses(list); })
      .catch(() => { /* интерсептор */ })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, []);

  return (
    <PageContainer maxWidth={1000}>
      <PageHeader
        eyebrow={t('nav.groups.study', 'Study')}
        title={t('nav.myCourses', 'My courses')}
        subtitle={t('myCourses.subtitle', 'Courses your coach assigned to you.')}
      />
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>
      ) : courses.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <SchoolRounded sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
          <Typography variant="h6" gutterBottom>{t('myCourses.emptyTitle', 'No courses yet')}</Typography>
          <Typography variant="body2" color="text.secondary">
            {t('myCourses.emptyHint', 'When your coach assigns a course, it appears here.')}
          </Typography>
        </Paper>
      ) : (
        <Stack spacing={1.5}>
          {courses.map((c) => (
            <Paper
              key={c._id}
              sx={{ p: 2, cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }}
              onClick={() => navigate(`/courses/${c._id}`)}
            >
              <Stack direction="row" spacing={2} alignItems="center">
                <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                  <Typography variant="subtitle1" noWrap sx={{ fontWeight: 600 }}>{c.title || t('courses.untitled', 'Untitled course')}</Typography>
                  {c.description && <Typography variant="body2" color="text.secondary" noWrap>{c.description}</Typography>}
                </Box>
                <Chip size="small" color="primary" icon={<PlayArrowRounded fontSize="small" />} label={t('myCourses.open', 'Open')} />
              </Stack>
            </Paper>
          ))}
        </Stack>
      )}
    </PageContainer>
  );
};

export default MyCoursesPage;
