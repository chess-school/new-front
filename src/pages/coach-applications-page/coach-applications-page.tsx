import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert, Box, Button, Chip, CircularProgress, Divider, Grid, List, ListItemButton, ListItemText, MenuItem,
  Paper, Stack, TextField, Typography,
} from '@mui/material';
import { notification } from 'antd';
import { useTranslation } from 'react-i18next';

import { CoachApplicationDto, CoachApplicationStatus, decideCoachApplication, getCoachApplications } from '@/api/coaches/coachApplications';
import { PageContainer, PageHeader } from '@/shared/components/ui/PageHeader';
import { AskInChatButton } from '@/features/Chat';
import { safeUrl } from '@/utils';

const STATUS_FILTERS: Array<{ value: CoachApplicationStatus | 'all'; labelKey: string; fallback: string }> = [
  { value: 'pending', labelKey: 'coachApplicationsAdmin.filter.pending', fallback: 'Pending' },
  { value: 'approved', labelKey: 'coachApplicationsAdmin.filter.approved', fallback: 'Approved' },
  { value: 'rejected', labelKey: 'coachApplicationsAdmin.filter.rejected', fallback: 'Rejected' },
  { value: 'all', labelKey: 'coachApplicationsAdmin.filter.all', fallback: 'All' },
];

const statusColor = (s: CoachApplicationStatus) => (s === 'approved' ? 'success' : s === 'rejected' ? 'default' : 'primary');

/**
 * Разбор заявок на роль тренера (ADMIN): список слева, детали справа.
 * Админ может написать кандидату в чат, одобрить (выдаётся роль COACH + черновик профиля) или отклонить.
 */
export const CoachApplicationsPage: React.FC = () => {
  const { t } = useTranslation();
  const detailsRef = useRef<HTMLDivElement | null>(null);
  const [filter, setFilter] = useState<CoachApplicationStatus | 'all'>('pending');
  const [items, setItems] = useState<CoachApplicationDto[]>([]);
  const [selected, setSelected] = useState<CoachApplicationDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async (status: CoachApplicationStatus | 'all') => {
    setIsLoading(true);
    setSelected(null);
    try {
      const data = await getCoachApplications(status === 'all' ? undefined : status);
      setItems(Array.isArray(data) ? data : []);
    } catch {
      notification.error({ message: t('coachApplicationsAdmin.loadFailed', 'Failed to load applications'), description: undefined });
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  useEffect(() => { void fetchData(filter); }, [filter, fetchData]);
  useEffect(() => { setNote(''); setError(null); }, [selected]);
  useEffect(() => {
    if (!selected || typeof window.matchMedia !== 'function') return;
    if (window.matchMedia('(max-width: 899px)').matches) detailsRef.current?.scrollIntoView?.({ behavior: 'smooth', block: 'start' });
  }, [selected]);

  const decide = async (status: CoachApplicationStatus) => {
    if (!selected) return;
    setIsSubmitting(true);
    setError(null);
    try {
      await decideCoachApplication(selected._id, { status, adminNote: note.trim() || undefined });
      notification.success({
        message: status === 'approved'
          ? t('coachApplicationsAdmin.approved', 'Application approved — the user is now a coach')
          : t('coachApplicationsAdmin.rejected', 'Application rejected'),
        description: undefined,
      });
      await fetchData(filter);
    } catch (e) {
      const msg = (e as { response?: { data?: { msg?: string } } })?.response?.data?.msg;
      setError(msg || t('coachApplicationsAdmin.decideFailed', 'Failed to process the application'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const fide = selected?.fideProfile;
  const hasRating = !!(fide?.rating && (fide.rating.standard || fide.rating.rapid || fide.rating.blitz));

  return (
    <PageContainer maxWidth={1200}>
      <PageHeader
        eyebrow={t('coachApplicationsAdmin.eyebrow', 'Administration')}
        title={t('coachApplicationsAdmin.title', 'Coach applications')}
        subtitle={t('coachApplicationsAdmin.subtitle', 'Review candidates, message them to clarify details, and approve or reject.')}
        actions={(
          <TextField select size="small" value={filter} onChange={(e) => setFilter(e.target.value as CoachApplicationStatus | 'all')} sx={{ minWidth: 180 }}>
            {STATUS_FILTERS.map((f) => <MenuItem key={f.value} value={f.value}>{t(f.labelKey, f.fallback)}</MenuItem>)}
          </TextField>
        )}
      />

      <Grid container spacing={2}>
        <Grid item xs={12} md={4}>
          <Paper variant="outlined" sx={{ p: 1 }}>
            {isLoading ? (
              <Box sx={{ display: 'grid', placeItems: 'center', py: 6 }}><CircularProgress /></Box>
            ) : items.length === 0 ? (
              <Typography color="text.secondary" sx={{ p: 2 }}>{t('coachApplicationsAdmin.empty', 'No applications')}</Typography>
            ) : (
              <List disablePadding>
                {items.map((item) => (
                  <ListItemButton key={item._id} selected={selected?._id === item._id} onClick={() => setSelected(item)} sx={{ borderRadius: 1 }}>
                    <ListItemText
                      primary={`${item.applicant.firstName} ${item.applicant.lastName}`}
                      secondary={new Date(item.createdAt).toLocaleDateString()}
                    />
                    <Chip size="small" variant="outlined" color={statusColor(item.status)}
                      label={t(`coachApplicationsAdmin.status.${item.status}`, item.status)} />
                  </ListItemButton>
                ))}
              </List>
            )}
          </Paper>
        </Grid>

        <Grid item xs={12} md={8}>
          <Paper variant="outlined" sx={{ p: 3 }} ref={detailsRef}>
            {!selected ? (
              <Typography color="text.secondary">{t('coachApplicationsAdmin.selectPrompt', 'Select an application to review')}</Typography>
            ) : (
              <Stack spacing={2}>
                <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
                  <Typography variant="h6">{selected.applicant.firstName} {selected.applicant.lastName}</Typography>
                  <Chip size="small" variant="outlined" color={statusColor(selected.status)}
                    label={t(`coachApplicationsAdmin.status.${selected.status}`, selected.status)} />
                </Box>

                <Box>
                  {selected.applicant.email && <Typography variant="body2">{t('coachApplicationsAdmin.email', 'Email')}: {selected.applicant.email}</Typography>}
                  {selected.applicant.phone && <Typography variant="body2">{t('coachApplicationsAdmin.phone', 'Phone')}: {selected.applicant.phone}</Typography>}
                  {selected.contact && <Typography variant="body2">{t('coachApplicationsAdmin.contact', 'Contact')}: {selected.contact}</Typography>}
                  <Typography variant="body2" color="text.secondary">
                    {t('coachApplicationsAdmin.sent', 'Sent')}: {new Date(selected.createdAt).toLocaleString()}
                  </Typography>
                </Box>

                <AskInChatButton
                  withUserId={selected.applicant._id}
                  label={t('coachApplicationsAdmin.message', 'Message candidate')}
                  sx={{ alignSelf: 'flex-start' }}
                />

                <Divider />

                {selected.headline && <Typography><strong>{t('coachesPage.headline', 'Headline')}:</strong> {selected.headline}</Typography>}
                <Typography sx={{ whiteSpace: 'pre-wrap' }}>
                  <strong>{t('coachApplication.motivation', 'Why do you want to become a coach?')}:</strong> {selected.motivation}
                </Typography>
                {selected.experience && (
                  <Typography sx={{ whiteSpace: 'pre-wrap' }}>
                    <strong>{t('coachApplication.experience', 'Coaching & playing experience')}:</strong> {selected.experience}
                  </Typography>
                )}
                {selected.specializations.length > 0 && (
                  <Typography><strong>{t('coachesPage.specializations', 'Specializations')}:</strong> {selected.specializations.join(', ')}</Typography>
                )}
                {fide && (fide.title && fide.title !== 'None' || fide.fideId || hasRating || fide.profileUrl) && (
                  <Box>
                    <Typography><strong>FIDE</strong></Typography>
                    {fide.title && fide.title !== 'None' && <Typography variant="body2">{t('coachesPage.fideTitle', 'FIDE title')}: {fide.title}</Typography>}
                    {fide.fideId && <Typography variant="body2">FIDE ID: {fide.fideId}</Typography>}
                    {hasRating && (
                      <Typography variant="body2">
                        {['standard', 'rapid', 'blitz'].map((k) => fide.rating?.[k as 'standard' | 'rapid' | 'blitz'] ? `${t(`coachesPage.ratingKind.${k}`, k)}: ${fide.rating[k as 'standard' | 'rapid' | 'blitz']}` : null).filter(Boolean).join(' · ')}
                      </Typography>
                    )}
                    {safeUrl(fide.profileUrl) && <Typography variant="body2"><a href={safeUrl(fide.profileUrl)} target="_blank" rel="noopener noreferrer">{fide.profileUrl}</a></Typography>}
                  </Box>
                )}

                {selected.status !== 'pending' && selected.adminNote && (
                  <Alert severity="info">{t('coachApplication.adminNote', 'Administrator note')}: {selected.adminNote}</Alert>
                )}

                {selected.status === 'pending' && (
                  <Box>
                    <Divider sx={{ mb: 2 }} />
                    <TextField
                      fullWidth multiline minRows={2} size="small"
                      label={t('coachApplicationsAdmin.note', 'Note for the candidate (optional)')}
                      value={note} onChange={(e) => setNote(e.target.value)} inputProps={{ maxLength: 2000 }}
                    />
                    {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
                    <Stack direction="row" spacing={2} sx={{ mt: 2 }} flexWrap="wrap">
                      <Button variant="contained" color="primary" onClick={() => decide('approved')} disabled={isSubmitting}>
                        {t('coachApplicationsAdmin.approve', 'Approve')}
                      </Button>
                      <Button variant="outlined" color="inherit" onClick={() => decide('rejected')} disabled={isSubmitting}>
                        {t('coachApplicationsAdmin.reject', 'Reject')}
                      </Button>
                    </Stack>
                  </Box>
                )}
              </Stack>
            )}
          </Paper>
        </Grid>
      </Grid>
    </PageContainer>
  );
};

export default CoachApplicationsPage;
