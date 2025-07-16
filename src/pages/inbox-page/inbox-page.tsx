import React, { useState, useEffect, useCallback } from 'react';
import {
  Container,
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
  Link,
} from '@mui/material';
import { notification } from 'antd';
import { useTranslation } from 'react-i18next';

import { fetchRequests, handleRequest } from '@/api/requests';
import { getHomeworksForReview, reviewHomework, getHomeworkScreenshot } from '@/api/homework';

interface Request {
  _id: string;
  student: { _id: string; firstName: string; lastName: string; email: string; };
  experience?: string;
  goals?: string;
  createdAt: string;
  status: 'pending' | 'approved' | 'rejected';
}

interface Homework {
  _id: string;
  student: { _id: string; firstName: string; lastName: string; };
  schedule: { title: string; };
  text?: string;
  hasScreenshot?: boolean;
  submittedAt: string;
  status: 'pending' | 'approved' | 'rejected';
}

type InboxItem = Request | Homework;
type ViewType = 'requests' | 'homework';

const isRequest = (item: InboxItem): item is Request => 'createdAt' in item;

export const InboxPage: React.FC = () => {
  const { t } = useTranslation();
  const [view, setView] = useState<ViewType>('requests');
  const [items, setItems] = useState<InboxItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<InboxItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [reviewComment, setReviewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [screenshotUrl, setScreenshotUrl] = useState<string | null>(null);
  const [isLoadingScreenshot, setIsLoadingScreenshot] = useState(false);

  const fetchData = useCallback(async (currentView: ViewType) => {
    setIsLoading(true);
    setSelectedItem(null);
    try {
      const data = currentView === 'requests'
        ? await fetchRequests()
        : await getHomeworksForReview();
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
    let objectUrl: string | null = null;
  
    const fetchScreenshot = async () => {
      if (!selectedItem || isRequest(selectedItem) || !selectedItem.hasScreenshot) {
        setScreenshotUrl(null);
        return;
      }
      setIsLoadingScreenshot(true);
      try {
        const screenshotBlob = await getHomeworkScreenshot(selectedItem._id);
        objectUrl = URL.createObjectURL(screenshotBlob);
        setScreenshotUrl(objectUrl);
      } catch (error) {
        console.error("Screenshot load error:", error);
        notification.error({
          message: t('inbox.errors.loadScreenshotFailed'),
          description: undefined
        });
      } finally {
        setIsLoadingScreenshot(false);
      }
    };
  
    fetchScreenshot();
    setReviewComment('');
  
    // Cleanup function
    return () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [selectedItem, t]);
  
  const handleRequestAction = async (action: 'approved' | 'rejected') => {
    if (!selectedItem || !isRequest(selectedItem)) return;
    setIsSubmitting(true);
    try {
      await handleRequest(selectedItem._id, action);
      notification.success({
        message: t('inbox.success.requestHandled', {
          action: t(action === 'approved' ? 'inbox.success.actions.approved' : 'inbox.success.actions.rejected')
        }),
        description: undefined
      });
      await fetchData('requests');
    } catch (error) {
      console.error('Error handling request:', error);
      notification.error({
        message: t('inbox.errors.handleRequestFailed'),
        description: undefined
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleHomeworkAction = async (action: 'approved' | 'rejected') => {
    if (!selectedItem || isRequest(selectedItem)) return;
    setIsSubmitting(true);
    try {
      await reviewHomework(selectedItem._id, { status: action, comment: reviewComment });
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
          <Typography variant="h6">{selectedItem.student.firstName} {selectedItem.student.lastName}</Typography>
          <Typography>{t('inbox.details.email')}: {selectedItem.student.email}</Typography>
          <Typography>{t('inbox.details.sent')}: {new Date(selectedItem.createdAt).toLocaleString()}</Typography>
          <Divider sx={{ my: 2 }} />
          <Typography><strong>{t('inbox.details.experience')}:</strong> {selectedItem.experience || t('inbox.details.notSpecified')}</Typography>
          <Typography><strong>{t('inbox.details.goals')}:</strong> {selectedItem.goals || t('inbox.details.notSpecified')}</Typography>
          <Box mt={3} display="flex" gap={2}>
            <Button variant="contained" color="primary" onClick={() => handleRequestAction('approved')} disabled={isSubmitting || selectedItem.status !== 'pending'}>
              {t('inbox.actions.approve')}
            </Button>
            <Button variant="contained" color="secondary" onClick={() => handleRequestAction('rejected')} disabled={isSubmitting || selectedItem.status !== 'pending'}>
              {t('inbox.actions.reject')}
            </Button>
          </Box>
        </>
      );
    } else {
      return (
        <>
          <Typography variant="h5" gutterBottom>{selectedItem.schedule?.title || t('inbox.list.untitled')}</Typography>
          <Typography variant="subtitle1" color="text.secondary" gutterBottom>
            {t('inbox.details.student')}: {selectedItem.student.firstName} {selectedItem.student.lastName}
          </Typography>
          <Divider sx={{ my: 2 }} />
          {selectedItem.text && (
            <Box mb={2}>
              <Typography variant="h6">{t('inbox.details.responseText')}:</Typography>
              <Typography sx={{ whiteSpace: 'pre-wrap', p: 1, bgcolor: 'action.hover', borderRadius: 1 }}>{selectedItem.text}</Typography>
            </Box>
          )}
          
          {selectedItem.hasScreenshot && (
            <Box mb={2}>
              <Typography variant="h6">{t('inbox.details.screenshot')}:</Typography>
              {isLoadingScreenshot && <Box sx={{display: 'flex', alignItems: 'center', my: 2}}><CircularProgress size={24} sx={{mr: 2}} /> {t('inbox.loading')}</Box>}
              {screenshotUrl && !isLoadingScreenshot && (
                <Link href={screenshotUrl} target="_blank" rel="noopener noreferrer">
                  <img 
                    src={screenshotUrl} 
                    alt={t('inbox.details.screenshotAlt')}
                    style={{ maxWidth: '100%', height: 'auto', borderRadius: '8px', border: '1px solid #ddd', display: 'block', cursor: 'pointer' }} 
                  />
                </Link>
              )}
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
          <Box mt={2} display="flex" gap={2}>
            <Button variant="contained" color="success" onClick={() => handleHomeworkAction('approved')} disabled={isSubmitting}>
              {t('inbox.actions.approve')}
            </Button>
            <Button variant="contained" color="error" onClick={() => handleHomeworkAction('rejected')} disabled={isSubmitting}>
              {t('inbox.actions.sendForRevision')}
            </Button>
          </Box>
        </>
      );
    }
  };

  return (
    <Container sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>{t('inbox.title')}</Typography>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs value={view} onChange={(_e, newValue) => setView(newValue)} aria-label="inbox tabs">
          <Tab label={t('inbox.tabs.requests')} value="requests" />
          <Tab label={t('inbox.tabs.homework')} value="homework" />
        </Tabs>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Paper style={{ maxHeight: '80vh', overflow: 'auto' }}>
            {isLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>
            ) : (
              <List component="nav">
                {items.length > 0 ? items.map((item) => (
                  <ListItemButton key={item._id} selected={selectedItem?._id === item._id} onClick={() => setSelectedItem(item)}>
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
    : t('inbox.list.homeworkSecondary', { title: item.schedule?.title || t('inbox.list.untitled', 'Без темы') })
}
                    />
                  </ListItemButton>
                )) : <Typography sx={{ p: 2, textAlign: 'center' }}>{t('inbox.empty')}</Typography>}
              </List>
            )}
          </Paper>
        </Grid>
        <Grid item xs={12} md={8}>
          <Paper style={{ padding: 24, minHeight: '50vh', display: 'flex', flexDirection: 'column' }}>
            {renderItemDetails()}
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};