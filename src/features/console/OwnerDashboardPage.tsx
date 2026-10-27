import { useEffect, useState } from 'react';
import { Box, Typography, Grid, Paper, Stack, Button, Chip, Divider, Table, TableBody, TableCell, TableHead, TableRow, CircularProgress } from '@mui/material';
import { useTranslation } from 'react-i18next';
import VideocamRoundedIcon from '@mui/icons-material/VideocamRounded';
import PeopleAltRoundedIcon from '@mui/icons-material/PeopleAltRounded';
import GroupsRoundedIcon from '@mui/icons-material/GroupsRounded';
import BadgeRoundedIcon from '@mui/icons-material/BadgeRounded';
import PaymentsRoundedIcon from '@mui/icons-material/PaymentsRounded';
import InsightsRoundedIcon from '@mui/icons-material/InsightsRounded';
import TelegramIcon from '@mui/icons-material/Telegram';
import ChatRoundedIcon from '@mui/icons-material/ChatRounded';
import { PageContainer } from '@/shared/components/ui/PageHeader';
import { SEOHead } from '@/shared/components/seo/SEOHead';
import { fetchOverview, ClubOverview } from '@/features/clubs/clubsApi';

const CURRENCY_SYMBOL: Record<string, string> = { USD: '$', EUR: '€', PLN: 'zł', UAH: '₴', GBP: '£' };
const fmtMoney = (byCurrency: Record<string, number>) => {
  const entries = Object.entries(byCurrency || {});
  if (!entries.length) return null;
  return entries.map(([cur, minor]) => {
    const major = (minor / 100).toLocaleString(undefined, { maximumFractionDigits: 0 });
    const sym = CURRENCY_SYMBOL[cur] || cur;
    return sym === 'zł' || sym === cur ? `${major} ${sym}` : `${sym}${major}`;
  }).join(' · ');
};
const fmtTime = (iso: string) => { try { return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); } catch { return '—'; } };

// Пустое состояние — честно показываем, что данных пока нет (а не выдуманные цифры)
const Empty = ({ text }: { text: string }) => (
  <Box sx={{ py: 3, textAlign: 'center' }}>
    <Typography variant="body2" color="text.disabled">{text}</Typography>
  </Box>
);

export const OwnerDashboardPage = () => {
  const { t } = useTranslation();
  const [data, setData] = useState<ClubOverview | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    fetchOverview().then((d) => { if (alive) { setData(d); setLoading(false); } }).catch(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, []);

  const panelCard = { p: 2.5, borderRadius: 4, border: '1px solid', borderColor: 'divider', height: '100%' };

  const money = data ? fmtMoney(data.payments.byCurrency) : null;
  const kpis = data ? [
    { icon: <PeopleAltRoundedIcon />, label: t('console.kpi.activeStudents', 'Active students'), value: String(data.counts.students), sub: data.club.limits.maxStudents != null ? `${t('console.kpi.of', 'of')} ${data.club.limits.maxStudents}` : t('console.kpi.noLimit', 'no limit') },
    { icon: <GroupsRoundedIcon />, label: t('console.kpi.groups', 'Groups'), value: String(data.counts.groups), sub: '' },
    { icon: <BadgeRoundedIcon />, label: t('console.kpi.trainers', 'Trainers'), value: String(data.counts.trainers), sub: data.club.limits.maxTrainers != null ? `${t('console.kpi.of', 'of')} ${data.club.limits.maxTrainers}` : t('console.kpi.noLimit', 'no limit') },
    { icon: <PaymentsRoundedIcon />, label: t('console.kpi.payments', 'Payments'), value: money || '—', sub: data.payments.pending ? `${data.payments.pending} ${t('console.kpi.pending', 'pending')}` : (money ? '' : t('console.kpi.noPayments', 'no payments yet')) },
  ] : [];

  return (
    <PageContainer>
      <SEOHead title={t('console.seoTitle', 'Club dashboard — debiut')} description="" noindex />

      <Stack direction="row" justifyContent="space-between" alignItems="flex-end" sx={{ mb: 3 }} flexWrap="wrap" useFlexGap>
        <Box>
          <Typography variant="body2" color="text.secondary">{t('console.dashboard', 'Dashboard')}</Typography>
          <Typography variant="h4" sx={{ mt: 0.5 }}>{data ? data.club.name : t('console.loading', 'Loading…')}</Typography>
        </Box>
        {data && <Chip label={`${t('console.plan', 'Plan')}: ${data.club.plan}`} sx={{ fontWeight: 600, textTransform: 'capitalize' }} />}
      </Stack>

      {loading ? (
        <Box sx={{ display: 'grid', placeItems: 'center', py: 10 }}><CircularProgress /></Box>
      ) : !data ? (
        <Paper sx={{ ...panelCard, textAlign: 'center', py: 6 }}>
          <Typography variant="h6">{t('console.noClub', 'No active club')}</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>{t('console.noClubDesc', 'Create a club to see its dashboard.')}</Typography>
        </Paper>
      ) : (
        <>
          {/* KPIs — реальные */}
          <Grid container spacing={2.5} sx={{ mb: 3 }}>
            {kpis.map((k, i) => (
              <Grid item xs={6} lg={3} key={i}>
                <Paper sx={{ p: 2.5, borderRadius: 4, border: '1px solid', borderColor: 'divider', height: '100%' }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                    <Typography variant="body2" color="text.secondary">{k.label}</Typography>
                    <Box sx={{ color: 'text.disabled', '& svg': { fontSize: 20 } }}>{k.icon}</Box>
                  </Stack>
                  <Typography sx={{ fontFamily: '"Space Grotesk"', fontWeight: 700, fontSize: { xs: '1.6rem', md: '2rem' }, mt: 1, lineHeight: 1 }}>{k.value}</Typography>
                  {k.sub && <Typography variant="caption" sx={{ display: 'block', mt: 1, color: 'text.secondary' }}>{k.sub}</Typography>}
                </Paper>
              </Grid>
            ))}
          </Grid>

          {/* Занятия сегодня + график */}
          <Grid container spacing={2.5} sx={{ mb: 3 }}>
            <Grid item xs={12} md={6}>
              <Paper sx={panelCard}>
                <Typography variant="h6" sx={{ mb: 2 }}>{t('console.lessonsToday', 'Lessons today')}</Typography>
                {data.todayLessons.length === 0 ? (
                  <Empty text={t('console.noLessonsToday', 'No lessons scheduled for today')} />
                ) : (
                  <Stack divider={<Divider />}>
                    {data.todayLessons.map((l, i) => (
                      <Stack key={i} direction="row" alignItems="center" spacing={1.5} sx={{ py: 1.25 }}>
                        <Typography sx={{ fontFamily: '"JetBrains Mono"', fontWeight: 600, fontSize: 14, width: 48 }}>{fmtTime(l.time)}</Typography>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography sx={{ fontWeight: 600, fontSize: 14 }} noWrap>{l.title}</Typography>
                          <Typography variant="caption" color="text.secondary" noWrap>{l.trainer}{l.type ? ` · ${l.type}` : ''}</Typography>
                        </Box>
                        {l.online
                          ? <Chip size="small" icon={<VideocamRoundedIcon />} label={t('console.online', 'Online')} sx={{ bgcolor: 'rgba(43,80,224,0.1)', color: 'primary.main', fontWeight: 600 }} />
                          : <Chip size="small" variant="outlined" label={t('console.onsite', 'On-site')} />}
                      </Stack>
                    ))}
                  </Stack>
                )}
              </Paper>
            </Grid>
            <Grid item xs={12} md={6}>
              <Paper sx={panelCard}>
                <Typography variant="h6">{t('console.solvedChart', 'Puzzles solved')}</Typography>
                <Empty text={t('console.noMetricData', 'Statistics will appear as the club becomes active')} />
              </Paper>
            </Grid>
          </Grid>

          {/* Группы — реальные */}
          <Paper sx={{ borderRadius: 4, border: '1px solid', borderColor: 'divider', mb: 3, overflow: 'hidden' }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ p: 2.5 }}>
              <Typography variant="h6">{t('console.groups', 'Groups')}</Typography>
              <Button size="small" variant="contained" href="/groups">{t('console.manageGroups', 'Manage groups')}</Button>
            </Stack>
            {data.groups.length === 0 ? (
              <Empty text={t('console.noGroups', 'No groups yet — create your first group')} />
            ) : (
              <Box sx={{ overflowX: 'auto' }}>
                <Table sx={{ minWidth: 640 }}>
                  <TableHead>
                    <TableRow>
                      <TableCell>{t('console.col.group', 'Group')}</TableCell>
                      <TableCell>{t('console.col.trainer', 'Trainer')}</TableCell>
                      <TableCell align="center">{t('console.col.students', 'Students')}</TableCell>
                      <TableCell>{t('console.col.next', 'Next lesson')}</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {data.groups.map((g) => (
                      <TableRow key={g.id} hover>
                        <TableCell>
                          <Stack direction="row" spacing={1.5} alignItems="center">
                            <Box sx={{ width: 32, height: 32, borderRadius: 1.5, flexShrink: 0, display: 'grid', placeItems: 'center', bgcolor: 'rgba(43,80,224,0.1)', color: 'primary.main', fontWeight: 700, fontSize: 12 }}>
                              {g.name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? '').join('') || 'G'}
                            </Box>
                            <Box>
                              <Typography sx={{ fontWeight: 600, fontSize: 14 }}>{g.name}</Typography>
                              {g.description && <Typography variant="caption" color="text.secondary">{g.description}</Typography>}
                            </Box>
                          </Stack>
                        </TableCell>
                        <TableCell><Typography variant="body2">{g.trainer}</Typography></TableCell>
                        <TableCell align="center"><Typography variant="body2" fontWeight={600}>{g.students}</Typography></TableCell>
                        <TableCell>
                          <Typography variant="body2" color="text.secondary">
                            {g.nextLesson ? `${new Date(g.nextLesson.date).toLocaleDateString()} · ${g.nextLesson.title}` : '—'}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Box>
            )}
          </Paper>

          {/* Нижний ряд */}
          <Grid container spacing={2.5}>
            <Grid item xs={12} md={6}>
              <Paper sx={panelCard}>
                <Typography variant="h6" sx={{ mb: 2 }}>{t('console.leaders', 'Most active this week')}</Typography>
                <Empty text={t('console.noActivityData', 'Activity data will appear once students start solving')} />
              </Paper>
            </Grid>
            <Grid item xs={12} md={6}>
              <Paper sx={panelCard}>
                <Typography variant="h6" sx={{ mb: 2 }}>{t('console.messengers', 'Messengers')}</Typography>
                <Stack spacing={1.5}>
                  <Stack direction="row" alignItems="center" spacing={1.5} sx={{ p: 1.5, borderRadius: 2.5, border: '1px solid', borderColor: 'divider' }}>
                    <TelegramIcon sx={{ color: '#229ED9', fontSize: 26 }} />
                    <Typography variant="body2" fontWeight={600} sx={{ flex: 1 }}>Telegram bot</Typography>
                    <Chip label={data.bots.telegram ? t('console.active', 'Active') : t('console.notConnected', 'Not connected')} size="small"
                      sx={{ bgcolor: data.bots.telegram ? 'rgba(22,163,74,0.14)' : 'action.hover', color: data.bots.telegram ? 'success.main' : 'text.secondary', fontWeight: 600 }} />
                  </Stack>
                  <Stack direction="row" alignItems="center" spacing={1.5} sx={{ p: 1.5, borderRadius: 2.5, border: '1px solid', borderColor: 'divider' }}>
                    <ChatRoundedIcon sx={{ color: '#25D366', fontSize: 26 }} />
                    <Typography variant="body2" fontWeight={600} sx={{ flex: 1 }}>WhatsApp bot</Typography>
                    <Chip label={data.bots.whatsapp ? t('console.active', 'Active') : t('console.notConnected', 'Not connected')} size="small"
                      sx={{ bgcolor: data.bots.whatsapp ? 'rgba(22,163,74,0.14)' : 'action.hover', color: data.bots.whatsapp ? 'success.main' : 'text.secondary', fontWeight: 600 }} />
                  </Stack>
                  <Typography variant="caption" color="text.disabled" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <InsightsRoundedIcon sx={{ fontSize: 14 }} />{t('console.botsSoon', 'Bot integration is coming soon')}
                  </Typography>
                </Stack>
              </Paper>
            </Grid>
          </Grid>
        </>
      )}
    </PageContainer>
  );
};

export default OwnerDashboardPage;
