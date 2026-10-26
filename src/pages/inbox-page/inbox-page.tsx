import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Grid,
  Paper,
  Typography,
  Button,
  List,
  ListItemText,
  ListItemButton,
  CircularProgress,
  Box,
  TextField,
  Divider,
  Tabs,
  Tab,
  Alert,
  Chip,
  MenuItem,
} from '@mui/material';
import { notification } from 'antd';
import { useTranslation } from 'react-i18next';

import { CoachRequestDto, decideCoachRequest, getCoachRequests } from '@/api/coaches';
import { CoachCourse, getCatalogCourses, getMyCourses } from '@/api/students';
import { getSubmissionsForReview, reviewSubmission } from '@/api/homework';
import { AttachmentImage } from '@/components/Homework/AttachmentImage';
import { SubmissionForReview } from '@/types/Homework';
import { PageContainer, PageHeader } from '@/shared/components/ui/PageHeader';
import { AskInChatButton } from '@/features/Chat';

// Заявки учеников со страницы «Тренеры» и сдачи ДЗ — API v2
// (/api/v2/coaches/me/requests, /api/v2/submissions)
type Request = CoachRequestDto;
type Homework = SubmissionForReview;
type InboxItem = Request | Homework;
type ViewType = 'requests' | 'homework';

// Различаем по форме объекта: у сдачи ДЗ есть assignment, у заявки — нет
const isRequest = (item: InboxItem): item is Request => !('assignment' in item);
const homeworkTitle = (item: Homework) => item.assignment?.schedule?.title || item.assignment?.title;

export const InboxPage: React.FC = () => {
  const { t } = useTranslation();
  // На телефоне детали — под списком: после выбора прокручиваем к ним
  const detailsRef = useRef<HTMLDivElement | null>(null);
  // ?tab=homework — пункт меню «Проверка работ»
  const [searchParams] = useSearchParams();
  const [view, setView] = useState<ViewType>(searchParams.get('tab') === 'homework' ? 'homework' : 'requests');
  useEffect(() => {
    setView(searchParams.get('tab') === 'homework' ? 'homework' : 'requests');
  }, [searchParams]);
  const [items, setItems] = useState<InboxItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<InboxItem | null>(null);
  useEffect(() => {
    if (!selectedItem || typeof window.matchMedia !== 'function') return;
    if (window.matchMedia('(max-width: 899px)').matches) detailsRef.current?.scrollIntoView?.({ behavior: 'smooth', block: 'start' });
  }, [selectedItem]);
  const [isLoading, setIsLoading] = useState(true);
  const [reviewComment, setReviewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchData = useCallback(async (currentView: ViewType) => {
    setIsLoading(true);
    setSelectedItem(null);
    try {
      const data = currentView === 'requests'
        ? await getCoachRequests()
        : await getSubmissionsForReview('submitted');
      setItems(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(`Error loading ${currentView}:`, error); // Console log for developers can remain in English
      notification.error({
        message: t('inbox.errors.loadFailed'),
        description: undefined
      });
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchData(view);
  }, [view, fetchData]);

  useEffect(() => {
    setReviewComment('');
  }, [selectedItem]);
  
  // Одобрение = запись ученика на курс тренера: курсы подгружаются, когда выбрана заявка
  const [courses, setCourses] = useState<CoachCourse[] | null>(null);
  const [courseId, setCourseId] = useState('');
  const [requestError, setRequestError] = useState<string | null>(null);
  const pendingRequestSelected = !!selectedItem && isRequest(selectedItem) && selectedItem.status === 'pending';
  useEffect(() => {
    setRequestError(null);
    if (!pendingRequestSelected || courses) return;
    // Админ без профиля тренера записывает на курс из каталога
    getMyCourses().catch(() => getCatalogCourses())
      .then((list) => {
        const usable = list.filter((c) => c.status !== 'archived');
        setCourses(usable);
        if (usable.length === 1) setCourseId(usable[0]._id);
      })
      .catch(() => setCourses([]));
  }, [pendingRequestSelected, courses]);

  const handleRequestAction = async (action: 'approved' | 'rejected') => {
    if (!selectedItem || !isRequest(selectedItem)) return;
    // Курс обязателен, только если у тренера уже есть курсы; иначе ученик идёт на персональный курс
    if (action === 'approved' && courses !== null && courses.length > 0 && !courseId) return;
    setIsSubmitting(true);
    setRequestError(null);
    try {
      await decideCoachRequest(selectedItem._id, action === 'approved' ? { status: 'approved', courseId } : { status: 'rejected' });
      notification.success({
        message: t('inbox.success.requestHandled', {
          action: t(action === 'approved' ? 'inbox.success.actions.approved' : 'inbox.success.actions.rejected')
        }),
        description: undefined
      });
      await fetchData('requests');
    } catch (error) {
      // Понятная причина от сервера: уже записан на курс, заявка уже решена и т. п.
      const msg = (error as { response?: { data?: { msg?: string } } })?.response?.data?.msg;
      setRequestError(msg || t('inbox.errors.handleRequestFailed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleHomeworkAction = async (action: 'approved' | 'needs_revision') => {
    if (!selectedItem || isRequest(selectedItem)) return;
    // На доработку без объяснения отправить нельзя (бэкенд тоже требует комментарий)
    if (action === 'needs_revision' && !reviewComment.trim()) {
      notification.error({ message: t('inbox.errors.commentRequired'), description: undefined });
      return;
    }
    setIsSubmitting(true);
    try {
      await reviewSubmission(selectedItem._id, action, reviewComment.trim());
      notification.success({
        message: t('inbox.success.homeworkReviewed'),
        description: undefined
      });
      await fetchData('homework');
    } catch (error) {
      console.error('Error reviewing homework:', error);
      notification.error({
        message: t('inbox.errors.reviewHomeworkFailed'),
        description: undefined
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderItemDetails = () => {
    if (isLoading && !selectedItem) return null;
    if (!selectedItem) {
      return <Typography color="text.secondary">{t('inbox.selectItemPrompt')}</Typography>;
    }

    if (isRequest(selectedItem)) {
      return (
        <>
          <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
            <Typography variant="h6">{selectedItem.student.firstName} {selectedItem.student.lastName}</Typography>
            <Chip size="small" label={t(`inbox.requestStatus.${selectedItem.status}`, selectedItem.status)}
              color={selectedItem.status === 'approved' ? 'success' : selectedItem.status === 'rejected' ? 'default' : 'primary'} variant="outlined" />
          </Box>
          {selectedItem.student.email && <Typography>{t('inbox.details.email')}: {selectedItem.student.email}</Typography>}
          <Typography>{t('inbox.details.sent')}: {new Date(selectedItem.createdAt).toLocaleString()}</Typography>
          <Divider sx={{ my: 2 }} />
          <Typography><strong>{t('inbox.details.experience')}:</strong> {selectedItem.experience ? t(`coaches.level${selectedItem.experience}`, selectedItem.experience) : t('inbox.details.notSpecified')}</Typography>
          <Typography sx={{ whiteSpace: 'pre-wrap' }}><strong>{t('inbox.details.goals')}:</strong> {selectedItem.goals || t('inbox.details.notSpecified')}</Typography>
          {selectedItem.status === 'pending' && (
            <Box mt={3}>
              {courses === null ? <CircularProgress size={20} /> : courses.length === 0 ? (
                <Alert severity="info">{t('inbox.requests.noCourses', 'You have no courses yet — approving will enroll the student into your personal lessons. You can create a course later and move them if you like.')}</Alert>
              ) : (
                <TextField select fullWidth size="small" label={t('inbox.requests.course', 'Enroll into course')} value={courseId} onChange={(e) => setCourseId(e.target.value)}>
                  {courses.map((c) => <MenuItem key={c._id} value={c._id}>{c.title}</MenuItem>)}
                </TextField>
              )}
              {requestError && <Alert severity="error" sx={{ mt: 2 }}>{requestError}</Alert>}
              <Box mt={2} display="flex" gap={2} flexWrap="wrap">
                <Button variant="contained" color="primary" onClick={() => handleRequestAction('approved')} disabled={isSubmitting || (courses !== null && courses.length > 0 && !courseId)}>
                  {t('inbox.actions.approve')}
                </Button>
                <Button variant="outlined" color="inherit" onClick={() => handleRequestAction('rejected')} disabled={isSubmitting}>
                  {t('inbox.actions.reject')}
                </Button>
              </Box>
            </Box>
          )}
        </>
      );
    } else {
      return (
        <>
          <Typography variant="h5" gutterBottom>{homeworkTitle(selectedItem) || t('inbox.list.untitled')}</Typography>
          <Typography variant="subtitle1" color="text.secondary" gutterBottom>
            {t('inbox.details.student')}: {selectedItem.student.firstName} {selectedItem.student.lastName}
            {' · '}{new Date(selectedItem.submittedAt).toLocaleString()}
          </Typography>
          {selectedItem.assignment?.description && (
            <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'pre-wrap' }}>{selectedItem.assignment.description}</Typography>
          )}
          <Divider sx={{ my: 2 }} />
          {selectedItem.contentText && (
            <Box mb={2}>
              <Typography variant="h6">{t('inbox.details.responseText')}:</Typography>
              <Typography sx={{ whiteSpace: 'pre-wrap', p: 1, bgcolor: 'action.hover', borderRadius: 1 }}>{selectedItem.contentText}</Typography>
            </Box>
          )}
          
          {selectedItem.attachment && (
            <Box mb={2}>
              <Typography variant="h6">{t('inbox.details.screenshot')}:</Typography>
              <AttachmentImage key={selectedItem._id} submissionId={selectedItem._id} version={selectedItem.submittedAt} />
            </Box>
          )}

          <Divider sx={{ my: 2 }} />
          <Typography variant="h6">{t('inbox.details.feedback')}:</Typography>
          <TextField 
            fullWidth 
            multiline 
            rows={4} 
            label={t('inbox.details.commentLabel')}
            value={reviewComment} 
            onChange={(e) => setReviewComment(e.target.value)} 
            margin="normal" 
            disabled={isSubmitting}
          />
          <Box mt={2} display="flex" gap={2} flexWrap="wrap">
            <Button variant="contained" color="success" onClick={() => handleHomeworkAction('approved')} disabled={isSubmitting}>
              {t('inbox.actions.approve')}
            </Button>
            <Button variant="contained" color="error" onClick={() => handleHomeworkAction('needs_revision')} disabled={isSubmitting}>
              {t('inbox.actions.sendForRevision')}
            </Button>
            {/* Обсудить работу с учеником в чате — диалог с темой задания */}
            <AskInChatButton
              withUserId={selectedItem.student._id}
              context={{ kind: 'homework', refId: selectedItem.assignment?._id ?? selectedItem._id, title: homeworkTitle(selectedItem) || undefined }}
              label={t('chat.messageStudent', 'Message the student')}
            />
          </Box>
        </>
      );
    }
  };

  return (
    <PageContainer>
      <PageHeader title={t('inbox.title')} />

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2.5 }}>
        <Tabs value={view} onChange={(_e, newValue) => setView(newValue)} aria-label="inbox tabs" variant="scrollable" allowScrollButtonsMobile>
          <Tab label={t('inbox.tabs.requests')} value="requests" />
          <Tab label={t('inbox.tabs.homework')} value="homework" />
        </Tabs>
      </Box>

      <Grid container spacing={2.5}>
        <Grid item xs={12} md={4}>
          <Paper sx={{ maxHeight: { xs: '45vh', md: 'calc(100dvh - 260px)' }, overflow: 'auto' }}>
            {isLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>
            ) : (
              <List component="nav" sx={{ p: 1 }}>
                {items.length > 0 ? items.map((item) => (
                  <ListItemButton key={item._id} selected={selectedItem?._id === item._id} onClick={() => setSelectedItem(item)} sx={{ mb: 0.5 }}>
                    <ListItemText
                      primaryTypographyProps={{ style: { fontWeight: selectedItem?._id === item._id ? 'bold' : 'normal' } }}
primary={
    item.student 
    ? `${item.student.firstName} ${item.student.lastName}`
    : t('inbox.unknownStudent', 'Unknown Student')
}                     
secondary={
  isRequest(item) 
    ? t('inbox.list.requestSecondary', { date: new Date(item.createdAt).toLocaleDateString() }) 
    : t('inbox.list.homeworkSecondary', { title: homeworkTitle(item) || t('inbox.list.untitled', 'Без темы') })
}
                    />
                  </ListItemButton>
                )) : <Typography color="text.secondary" sx={{ p: 3, textAlign: 'center' }}>{t('inbox.empty')}</Typography>}
              </List>
            )}
          </Paper>
        </Grid>
        <Grid item xs={12} md={8}>
          <Paper ref={detailsRef} sx={{ p: { xs: 2, sm: 3 }, minHeight: { xs: 200, md: '50vh' }, display: 'flex', flexDirection: 'column', scrollMarginTop: 72 }}>
            {renderItemDetails()}
          </Paper>
        </Grid>
      </Grid>
    </PageContainer>
  );
};