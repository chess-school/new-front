import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Button, Chip, Grid, Paper, Skeleton, Stack, Typography,
} from '@mui/material';
import moment from 'moment';
import { notification } from 'antd';
import { useTranslation } from 'react-i18next';

import { getMyLessons, Lesson } from '@/api/lessons';
import { getMyAssignments } from '@/api/homework';
import { MyAssignment } from '@/types/Homework';
import ScheduleCalendar from '@/shared/components/Calendar/SheduleCalendar';
import { PageContainer, PageHeader } from '@/shared/components/ui/PageHeader';
import { AssignmentDialog } from './AssignmentDialog';
import { LessonDialog } from './LessonDialog';
import { assignmentState, STATE_COLORS, STATE_ORDER } from './assignmentState';

/**
 * «Моё расписание»: занятия (индивидуальные и групповые) и домашние задания ученика — API v2.
 * ДЗ сдаётся прямо отсюда: текст и/или скриншот, с пересдачей до принятия тренером.
 */
const StudentSchedulePage: React.FC = () => {
  const { t } = useTranslation();
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [assignments, setAssignments] = useState<MyAssignment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [selectedAssignment, setSelectedAssignment] = useState<MyAssignment | null>(null);

  const load = useCallback(async () => {
    setLoadError(false);
    try {
      const [l, a] = await Promise.all([getMyLessons(), getMyAssignments()]);
      setLessons(l);
      setAssignments(a);
    } catch {
      notification.error({ message: t('schedule.fetchError'), description: undefined });
      setLoadError(true);
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  useEffect(() => { load(); }, [load]);

  const homeworkByLesson = useMemo(
    () => new Map(assignments.filter((a) => a.lesson).map((a) => [a.lesson!._id, a])),
    [assignments],
  );
  const sortedAssignments = useMemo(
    () => [...assignments].sort((a, b) => STATE_ORDER.indexOf(assignmentState(a)) - STATE_ORDER.indexOf(assignmentState(b))),
    [assignments],
  );
  const upcoming = useMemo(() => {
    const now = Date.now();
    return lessons
      .filter((l) => l.status === 'scheduled' && new Date(l.date).getTime() >= now)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, 5);
  }, [lessons]);

  const openHomework = (assignment: MyAssignment) => {
    setSelectedLesson(null);
    setSelectedAssignment(assignment);
  };

  return (
    <PageContainer>
        <PageHeader
          eyebrow={t('nav.groups.my', 'My learning')}
          title={t('studentSchedule.myScheduleTitle')}
          subtitle={t('studentSchedule.pageSubtitle', 'Lessons with your coach and homework to hand in.')}
        />

        {loadError && (
          <Paper sx={{ p: 3, mb: 3, textAlign: 'center' }}>
            <Typography color="error" gutterBottom>{t('schedule.fetchError')}</Typography>
            <Button onClick={() => { setIsLoading(true); load(); }}>{t('studentsPage.retry')}</Button>
          </Paper>
        )}

        <Grid container spacing={3}>
          <Grid item xs={12} lg={8}>
            <Paper sx={{ p: { xs: 1.5, sm: 2.5 }, overflow: 'hidden' }}>
              {isLoading ? <Skeleton variant="rectangular" height={500} /> : (
                <ScheduleCalendar lessons={lessons} onSelectLesson={setSelectedLesson} />
              )}
            </Paper>
          </Grid>

          <Grid item xs={12} lg={4}>
            <Paper sx={{ p: 2.5, mb: 3 }}>
              <Typography variant="h6" gutterBottom>{t('homework.listTitle')}</Typography>
              {isLoading ? <Skeleton height={120} /> : sortedAssignments.length === 0 ? (
                <Typography color="text.secondary">{t('homework.empty')}</Typography>
              ) : (
                <Stack spacing={1}>
                  {sortedAssignments.map((a) => {
                    const state = assignmentState(a);
                    return (
                      <Paper
                        key={a._id}
                        variant="outlined"
                        onClick={() => setSelectedAssignment(a)}
                        sx={{ p: 1.5, cursor: 'pointer', bgcolor: 'surface.raised', transition: 'border-color .15s ease', '&:hover': { borderColor: 'rgba(227,179,65,0.4)' } }}
                      >
                        <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1}>
                          <Typography fontWeight="bold" noWrap>{a.title}</Typography>
                          <Chip size="small" color={STATE_COLORS[state]} label={t(`homework.state.${state}`)} />
                        </Stack>
                        {a.dueDate && (
                          <Typography variant="body2" color={state === 'overdue' ? 'error' : 'text.secondary'}>
                            {t('homework.due', { date: moment(a.dueDate).format('LL') })}
                          </Typography>
                        )}
                      </Paper>
                    );
                  })}
                </Stack>
              )}
            </Paper>

            <Paper sx={{ p: 2.5 }}>
              <Typography variant="h6" gutterBottom>{t('studentSchedule.upcoming')}</Typography>
              {isLoading ? <Skeleton height={120} /> : upcoming.length === 0 ? (
                <Typography color="text.secondary">{t('studentSchedule.noUpcoming')}</Typography>
              ) : (
                <Stack spacing={1}>
                  {upcoming.map((lesson) => (
                    <Paper
                      key={lesson._id}
                      variant="outlined"
                      onClick={() => setSelectedLesson(lesson)}
                      sx={{ p: 1.5, cursor: 'pointer', bgcolor: 'surface.raised', transition: 'border-color .15s ease', '&:hover': { borderColor: 'rgba(227,179,65,0.4)' } }}
                    >
                      <Typography fontWeight="bold">{lesson.title}</Typography>
                      <Typography variant="body2" color="text.secondary">{moment(lesson.date).format('LLL')}</Typography>
                      {homeworkByLesson.has(lesson._id) && <Chip size="small" sx={{ mt: 0.5 }} label={t('studentSchedule.hasHomework')} />}
                    </Paper>
                  ))}
                </Stack>
              )}
            </Paper>
          </Grid>
        </Grid>

      <LessonDialog
        lesson={selectedLesson}
        homework={selectedLesson ? homeworkByLesson.get(selectedLesson._id) : undefined}
        onClose={() => setSelectedLesson(null)}
        onOpenHomework={openHomework}
      />
      <AssignmentDialog
        assignment={selectedAssignment}
        onClose={() => setSelectedAssignment(null)}
        onSubmitted={load}
      />
    </PageContainer>
  );
};

export default StudentSchedulePage;
