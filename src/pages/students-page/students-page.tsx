import React, { useCallback, useEffect, useState } from 'react';
import {
  Box, Button, CircularProgress, LinearProgress, MenuItem, Paper, Stack, Table, TableBody, TableCell,
  TableHead, TablePagination, TableRow, TextField, Typography,
} from '@mui/material';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import { useTranslation } from 'react-i18next';
import { notification } from 'antd';

import { getCatalogCourses, getMyCourses, getMyGroups, getStudents, CoachCourse, CoachGroup } from '@/api/students';
import { useAuth } from '@/context/AuthContext';
import { ENROLLMENT_STATUSES, EnrollmentStatus, Student, StudentsPage as StudentsPageData } from '@/types/Student';
import EditScheduleModal from '../../components/Schedule/EditScheduleModal';
import { EnrollStudentDialog } from '@/components/Students/EnrollStudentDialog';
import { EnrollmentRow } from '@/components/Students/EnrollmentRow';
import { PageContainer, PageHeader } from '@/shared/components/ui/PageHeader';

const SEARCH_DEBOUNCE_MS = 400;

/**
 * «Мои ученики»: тренер видит своих студентов (по записям на свои курсы), админ — всех.
 * Данные — одним запросом GET /api/v2/students с серверной пагинацией и фильтрами.
 */
export const StudentsPage: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const isAdmin = !!user?.roles?.includes('ADMIN');
  const isCoach = !!user?.roles?.includes('COACH');

  const [result, setResult] = useState<StudentsPageData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [courses, setCourses] = useState<CoachCourse[]>([]);
  const [groups, setGroups] = useState<CoachGroup[]>([]);

  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<EnrollmentStatus | ''>('');
  const [courseId, setCourseId] = useState('');
  const [page, setPage] = useState(0); // TablePagination считает с 0, API — с 1
  const [limit, setLimit] = useState(20);

  const [scheduleStudent, setScheduleStudent] = useState<Student | null>(null);
  const [enrollOpen, setEnrollOpen] = useState(false);

  // Поиск — с задержкой, чтобы не слать запрос на каждую букву
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(0);
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Курсы и группы тренера — для фильтра и форм. /coaches/me/* доступны только COACH,
  // администратору без этой роли показываем каталог курсов (групп у него нет)
  useEffect(() => {
    const load = isCoach
      ? Promise.all([getMyCourses(), getMyGroups()])
      : Promise.all([getCatalogCourses(), Promise.resolve([] as CoachGroup[])]);
    load
      .then(([c, g]) => { setCourses(c); setGroups(g); })
      .catch(() => { /* ошибку показал перехватчик; формы останутся без справочников */ });
  }, [isCoach]);

  const fetchStudents = useCallback(async () => {
    setIsLoading(true);
    setLoadError(false);
    try {
      setResult(await getStudents({
        search: search || undefined,
        status: status || undefined,
        courseId: courseId || undefined,
        page: page + 1,
        limit,
      }));
    } catch {
      notification.error({ message: t('studentsPage.fetchError'), description: undefined });
      setResult(null);
      setLoadError(true);
    } finally {
      setIsLoading(false);
    }
  }, [search, status, courseId, page, limit, t]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  const students = result?.data ?? [];

  return (
    <PageContainer>
      <PageHeader
        eyebrow={t('nav.groups.coach', 'Coaching')}
        title={t('studentsPage.studentsListTitle')}
        actions={(
          <Button variant="contained" startIcon={<PersonAddIcon />} onClick={() => setEnrollOpen(true)}>
            {t('studentsPage.enroll.title')}
          </Button>
        )}
      />

      <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} sx={{ mb: 2 }}>
        <TextField
          size="small"
          label={t('studentsPage.search')}
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          inputProps={{ maxLength: 100 }}
          sx={{ flex: 2, minWidth: 0 }}
        />
        <TextField
          select
          size="small"
          label={t('studentsPage.status')}
          value={status}
          onChange={(e) => { setStatus(e.target.value as EnrollmentStatus | ''); setPage(0); }}
          sx={{ flex: 1, minWidth: 180 }}
        >
          <MenuItem value="">{t('studentsPage.allStatuses')}</MenuItem>
          {ENROLLMENT_STATUSES.map((s) => (
            <MenuItem key={s} value={s}>{t(`studentsPage.enrollmentStatus.${s}`)}</MenuItem>
          ))}
        </TextField>
        <TextField
          select
          size="small"
          label={t('studentsPage.course')}
          value={courseId}
          onChange={(e) => { setCourseId(e.target.value); setPage(0); }}
          sx={{ flex: 1, minWidth: 180 }}
        >
          <MenuItem value="">{t('studentsPage.allCourses')}</MenuItem>
          {courses.map((c) => <MenuItem key={c._id} value={c._id}>{c.title}</MenuItem>)}
        </TextField>
      </Stack>

      <Paper sx={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
        <LinearProgress sx={{ visibility: isLoading && result ? 'visible' : 'hidden' }} />
        <Table sx={{ minWidth: 680 }}>
          <TableHead>
            <TableRow>
              <TableCell>{t('studentsPage.student')}</TableCell>
              <TableCell>{t('studentsPage.email')}</TableCell>
              <TableCell>{t('studentsPage.enrollments')}</TableCell>
              <TableCell align="right">{t('studentsPage.actions')}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {/* Спиннер — только при первой загрузке: при обновлении строки остаются на месте,
                иначе вместе с ними размонтировались бы открытые меню и диалоги */}
            {isLoading && !result ? (
              <TableRow>
                <TableCell colSpan={4} align="center">
                  <CircularProgress />
                  <Typography sx={{ mt: 1 }}>{t('common.loading')}</Typography>
                </TableCell>
              </TableRow>
            ) : students.length > 0 ? (
              students.map((student) => (
                <TableRow key={student.uuid} hover sx={{ verticalAlign: 'top' }}>
                  <TableCell>
                    <Typography fontWeight="bold">{student.firstName} {student.lastName}</Typography>
                    {student.phone && <Typography variant="body2" color="text.secondary">{student.phone}</Typography>}
                  </TableCell>
                  <TableCell>{student.email}</TableCell>
                  <TableCell>
                    {student.enrollments.map((enrollment) => (
                      <EnrollmentRow
                        key={enrollment._id}
                        studentUuid={student.uuid}
                        enrollment={enrollment}
                        groups={groups}
                        isAdmin={isAdmin}
                        onChanged={fetchStudents}
                      />
                    ))}
                  </TableCell>
                  <TableCell align="right">
                    <Button variant="outlined" size="small" onClick={() => setScheduleStudent(student)}>
                      {t('studentsPage.editSchedule')}
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} align="center">
                  <Box sx={{ py: 3 }}>
                    {loadError ? (
                      <Stack alignItems="center" spacing={1}>
                        <Typography color="error">{t('studentsPage.fetchError')}</Typography>
                        <Button size="small" onClick={fetchStudents}>{t('studentsPage.retry')}</Button>
                      </Stack>
                    ) : (
                      <Typography>{t(search || status || courseId ? 'studentsPage.nothingFound' : 'studentsPage.noStudents')}</Typography>
                    )}
                  </Box>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <TablePagination
          component="div"
          count={result?.pagination.total ?? 0}
          page={page}
          onPageChange={(_, p) => setPage(p)}
          rowsPerPage={limit}
          onRowsPerPageChange={(e) => { setLimit(Number(e.target.value)); setPage(0); }}
          rowsPerPageOptions={[10, 20, 50, 100]}
          labelRowsPerPage={t('studentsPage.rowsPerPage')}
        />
      </Paper>

      <EditScheduleModal
        open={!!scheduleStudent}
        onClose={() => setScheduleStudent(null)}
        student={scheduleStudent}
      />
      <EnrollStudentDialog
        open={enrollOpen}
        onClose={() => setEnrollOpen(false)}
        onEnrolled={fetchStudents}
        courses={courses}
        groups={groups}
      />
    </PageContainer>
  );
};
