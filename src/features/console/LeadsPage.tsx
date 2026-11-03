import { useEffect, useState } from 'react';
import {
  Box, Chip, CircularProgress, MenuItem, Paper, Select, Stack, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Typography,
} from '@mui/material';
import { message } from 'antd';
import { useTranslation } from 'react-i18next';
import { PageContainer } from '@/shared/components/ui/PageHeader';
import { SEOHead } from '@/shared/components/seo/SEOHead';
import { fetchLeads, updateLead, Lead, LeadStatus } from '@/features/leads/leadsApi';

const STATUSES: LeadStatus[] = ['new', 'contacted', 'trial_scheduled', 'trial_done', 'converted', 'lost'];
const statusColor = (s: LeadStatus): 'default' | 'info' | 'warning' | 'success' | 'error' =>
  s === 'new' ? 'info' : s === 'converted' ? 'success' : s === 'lost' ? 'error' : 'warning';

/** Кабинет заявок на пробное (владелец клуба). */
export default function LeadsPage() {
  const { t } = useTranslation();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    fetchLeads()
      .then((d) => { if (alive) setLeads(d); })
      .catch(() => { /* интерцептор покажет ошибку */ })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, []);

  const changeStatus = async (id: string, status: LeadStatus) => {
    setLeads((prev) => prev.map((l) => (l._id === id ? { ...l, status } : l)));
    try {
      await updateLead(id, { status });
    } catch {
      message.error(t('leads.updateFailed', 'Could not update the lead'));
    }
  };

  const statusLabel = (s: LeadStatus) => t(`leads.status.${s}`, {
    new: 'New', contacted: 'Contacted', trial_scheduled: 'Trial scheduled', trial_done: 'Trial done', converted: 'Converted', lost: 'Lost',
  }[s]);

  const fmtDate = (iso: string) => { try { return new Date(iso).toLocaleDateString(); } catch { return ''; } };

  return (
    <PageContainer maxWidth={1100}>
      <SEOHead title={t('leads.title', 'Leads')} description="" noindex />
      <Typography variant="h4" component="h1" sx={{ mb: 0.5 }}>{t('leads.title', 'Leads')}</Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        {t('leads.subtitle', 'Trial requests from your club website. Contact people and move them through the pipeline.')}
      </Typography>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 6 }}><CircularProgress /></Box>
      ) : leads.length === 0 ? (
        <Paper variant="outlined" sx={{ p: 6, textAlign: 'center', borderRadius: 3 }}>
          <Typography color="text.secondary">{t('leads.empty', 'No trial requests yet. They will appear here when visitors submit the form on your site.')}</Typography>
        </Paper>
      ) : (
        <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 3 }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>{t('leads.col.date', 'Date')}</TableCell>
                <TableCell>{t('leads.col.name', 'Name')}</TableCell>
                <TableCell>{t('leads.col.contact', 'Contact')}</TableCell>
                <TableCell>{t('leads.col.level', 'Level')}</TableCell>
                <TableCell>{t('leads.col.status', 'Status')}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {leads.map((l) => (
                <TableRow key={l._id} hover>
                  <TableCell sx={{ whiteSpace: 'nowrap' }}>{fmtDate(l.createdAt)}</TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>{l.name}</Typography>
                      {l.who === 'child' && <Chip size="small" label={l.childAge ? t('leads.childAge', { age: l.childAge, defaultValue: 'child, {{age}}' }) : t('leads.childTag', 'child')} />}
                    </Stack>
                  </TableCell>
                  <TableCell>
                    <Stack>
                      {l.email && <Typography variant="body2">{l.email}</Typography>}
                      {l.phone && <Typography variant="body2" color="text.secondary">{l.phone}</Typography>}
                    </Stack>
                  </TableCell>
                  <TableCell>{l.level ? t(`leads.level.${l.level}`, l.level) : '—'}</TableCell>
                  <TableCell>
                    <Select
                      size="small"
                      value={l.status}
                      onChange={(e) => changeStatus(l._id, e.target.value as LeadStatus)}
                      renderValue={(v) => <Chip size="small" color={statusColor(v as LeadStatus)} label={statusLabel(v as LeadStatus)} />}
                      sx={{ minWidth: 160 }}
                    >
                      {STATUSES.map((s) => <MenuItem key={s} value={s}>{statusLabel(s)}</MenuItem>)}
                    </Select>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </PageContainer>
  );
}
