import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
  Box, Button, Chip, CircularProgress, Grid, Paper, Stack, Typography,
} from '@mui/material';
import VideoCameraFrontIcon from '@mui/icons-material/VideoCameraFront';
import GroupsRoundedIcon from '@mui/icons-material/GroupsRounded';
import EventNoteRoundedIcon from '@mui/icons-material/EventNoteRounded';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import moment from 'moment';
import { notification } from 'antd';
import { getMyLessons, Lesson } from '@/api/lessons';
import { getMyGroups, CoachGroup } from '@/api/students';
import { useAuth } from '@/context/AuthContext';
import { PageContainer, PageHeader } from '@/shared/components/ui/PageHeader';
import { CreateLessonDialog } from '@/components/Schedule/CreateLessonDialog';

/**
 * «Мои занятия» — хаб входа в интерактивный класс. Показывает ближайшие занятия из расписания
 * (групповые и индивидуальные 1-на-1, вход с отметкой присутствия) и, для тренера, его активные
 * группы (вход «по требованию»). Живой класс доступен и для групп, и для индивидуальных уроков.
 */
export const MyClassesPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isCoach = !!user?.roles?.some((r) => r === 'COACH' || r === 'ADMIN');

  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [groups, setGroups] = useState<CoachGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);

  const load = useCallback(async () => {
    try {
      const [l, g] = await Promise.all([
        getMyLessons().catch(() => [] as Lesson[]),
        isCoach ? getMyGroups().catch(() => [] as CoachGroup[]) : Promise.resolve([] as CoachGroup[]),
      ]);
      setLessons(l);
      setGroups(g);
    } catch {
      notification.error({ message: t('myClasses.loadFailed'), description: undefined });
    } finally {
      setLoading(false);
    }
  }, [isCoach, t]);

  useEffect(() => { void load(); }, [load]);

  // Ближайшие занятия с живым классом (групповые и индивидуальные, не отменённые), сверху — ближайшее
  const upcomingLessons = useMemo(() => {
    const now = Date.now();
    return lessons
      .filter((l) => (l.context?.type === 'group' || l.context?.type === 'individual') && l.status !== 'cancelled')
      .filter((l) => new Date(l.date).getTime() >= now - 2 * 60 * 60 * 1000) // показываем и начавшиеся < 2ч назад
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, 20);
  }, [lessons]);

  const activeGroups = useMemo(() => groups.filter((g) => g.status === 'active'), [groups]);

  if (loading) {
    return <Box sx={{ display: 'grid', placeItems: 'center', minHeight: '50vh' }}><CircularProgress /></Box>;
  }

  const empty = upcomingLessons.length === 0 && activeGroups.length === 0;

  return (
    <PageContainer>
      <PageHeader
        eyebrow={t('myClasses.eyebrow')}
        title={t('myClasses.title')}
        subtitle={t('myClasses.subtitle')}
        actions={isCoach ? (
          <Button variant="contained" startIcon={<AddRoundedIcon />} onClick={() => setCreateOpen(true)}>
            {t('myClasses.createLesson')}
          </Button>
        ) : undefined}
      />

      {empty && (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography color="text.secondary" gutterBottom>
            {t('myClasses.empty')}
          </Typography>
          {isCoach && (
            <Button variant="outlined" startIcon={<GroupsRoundedIcon />} onClick={() => navigate('/groups')} sx={{ mt: 1 }}>
              {t('myClasses.createGroup')}
            </Button>
          )}
        </Paper>
      )}

      {upcomingLessons.length > 0 && (
        <Box sx={{ mb: 4 }}>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
            <EventNoteRoundedIcon color="action" />
            <Typography variant="h6">{t('myClasses.upcoming')}</Typography>
          </Stack>
          <Grid container spacing={2}>
            {upcomingLessons.map((lesson) => {
              const started = new Date(lesson.date).getTime() <= Date.now();
              const isIndividual = lesson.context?.type === 'individual';
              return (
                <Grid item xs={12} sm={6} md={4} key={lesson._id}>
                  <Paper sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
                      <Typography fontWeight={600} sx={{ minWidth: 0 }} noWrap>{lesson.title}</Typography>
                      {started && <Chip size="small" color="success" label={t('myClasses.live')} />}
                    </Stack>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Chip size="small" variant="outlined"
                        label={isIndividual ? t('myClasses.individual', { defaultValue: '1-на-1' }) : t('myClasses.group', { defaultValue: 'Группа' })} />
                    </Stack>
                    <Typography variant="body2" color="text.secondary">{moment(lesson.date).format('LLL')}</Typography>
                    <Box sx={{ flex: 1 }} />
                    <Button
                      variant="contained"
                      color="success"
                      startIcon={<VideoCameraFrontIcon />}
                      onClick={() => navigate(`/classroom/${lesson._id}`)}
                    >
                      {t('myClasses.enterClass')}
                    </Button>
                  </Paper>
                </Grid>
              );
            })}
          </Grid>
        </Box>
      )}

      {activeGroups.length > 0 && (
        <Box>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
            <GroupsRoundedIcon color="action" />
            <Typography variant="h6">{t('myClasses.myGroups')}</Typography>
            <Typography variant="body2" color="text.secondary">{t('myClasses.myGroupsHint')}</Typography>
            <Box sx={{ flex: 1 }} />
            <Button size="small" onClick={() => navigate('/groups')}>{t('myClasses.manage')}</Button>
          </Stack>
          <Grid container spacing={2}>
            {activeGroups.map((group) => (
              <Grid item xs={12} sm={6} md={4} key={group._id}>
                <Paper sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Typography fontWeight={600} noWrap>{group.name}</Typography>
                  <Box sx={{ flex: 1 }} />
                  <Button
                    variant="outlined"
                    color="success"
                    startIcon={<VideoCameraFrontIcon />}
                    onClick={() => navigate(`/classroom/group/${group._id}`)}
                  >
                    {t('myClasses.enterClass')}
                  </Button>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      <CreateLessonDialog open={createOpen} onClose={() => setCreateOpen(false)} onCreated={load} />
    </PageContainer>
  );
};

export default MyClassesPage;
