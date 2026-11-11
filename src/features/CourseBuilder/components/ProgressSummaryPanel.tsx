import React, { useEffect, useState } from 'react';
import { Paper, Stack, Typography, LinearProgress, Box, CircularProgress, Alert, Avatar, Divider } from '@mui/material';
import GroupsRounded from '@mui/icons-material/GroupsRounded';
import { useTranslation } from 'react-i18next';
import { getCourseProgressSummary, type CourseProgressSummary } from '@/api/courses';

/** Сводка прогресса учеников по курсу (для тренера). Грузится при монтировании. */
export const ProgressSummaryPanel: React.FC<{ courseId: string }> = ({ courseId }) => {
  const { t } = useTranslation();
  const [data, setData] = useState<CourseProgressSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const s = await getCourseProgressSummary(courseId);
        if (alive) setData(s);
      } catch {
        if (alive) setError(true);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [courseId]);

  const fmtDate = (iso: string | null): string => {
    if (!iso) return '—';
    try { return new Date(iso).toLocaleDateString(); } catch { return '—'; }
  };

  return (
    <Paper sx={{ p: { xs: 2, sm: 2.5 } }}>
      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
        <GroupsRounded fontSize="small" color="action" />
        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
          {t('courses.progress.title', 'Student progress')}
        </Typography>
      </Stack>

      {loading && <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}><CircularProgress size={22} /></Box>}
      {!loading && error && <Alert severity="info">{t('courses.progress.unavailable', 'Progress is not available yet.')}</Alert>}
      {!loading && !error && data && data.students.length === 0 && (
        <Typography variant="body2" color="text.secondary">{t('courses.progress.noStudents', 'No students enrolled yet.')}</Typography>
      )}

      {!loading && !error && data && data.students.length > 0 && (
        <Stack spacing={1.5} divider={<Divider flexItem />}>
          {data.students.map((s) => (
            <Stack key={s.studentId} direction="row" spacing={1.5} alignItems="center">
              <Avatar src={s.avatarUrl} sx={{ width: 32, height: 32, fontSize: 14 }}>
                {s.name?.charAt(0)?.toUpperCase()}
              </Avatar>
              <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>{s.name}</Typography>
                <LinearProgress variant="determinate" value={s.percent} sx={{ mt: 0.5, borderRadius: 1, height: 6 }} />
              </Box>
              <Box sx={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                <Typography variant="body2" sx={{ fontWeight: 700 }}>{s.completed}/{s.total}</Typography>
                <Typography variant="caption" color="text.secondary">{fmtDate(s.lastAt)}</Typography>
              </Box>
            </Stack>
          ))}
        </Stack>
      )}
    </Paper>
  );
};

export default ProgressSummaryPanel;
