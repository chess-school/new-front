import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Box, Button, Card, InputAdornment, Skeleton, Stack, TextField, Typography } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ManageAccountsRoundedIcon from '@mui/icons-material/ManageAccountsRounded';
import { useTranslation } from 'react-i18next';
import { PageContainer, PageHeader } from '@/shared/components/ui/PageHeader';
import { CoachDto, CoachRequestStatus, getCoaches, getSentCoachRequests } from '@/api/coaches';
import { useAuth } from '@/context/AuthContext';
import { CoachCard } from './CoachCard';
import { CoachProfileDialog } from './CoachProfileDialog';
import { MyCoachProfileDialog } from './MyCoachProfileDialog';

const PAGE_SIZE = 12;
const SEARCH_DEBOUNCE_MS = 300;

/**
 * Каталог тренеров: поиск по имени (на сервере), «Показать ещё», профиль тренера с заявкой
 * «хочу заниматься». Тренер редактирует здесь свой профиль. Статус моих заявок — на карточках.
 */
export const CoachesPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { user, isAuthenticated } = useAuth();
  const isCoach = !!user?.roles?.includes('COACH');

  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [coaches, setCoaches] = useState<CoachDto[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [loadingMore, setLoadingMore] = useState(false);
  const [selected, setSelected] = useState<CoachDto | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [requests, setRequests] = useState<Record<string, CoachRequestStatus>>({});
  const requestSeq = useRef(0);

  // Поиск — с задержкой, чтобы не запрашивать на каждую букву
  useEffect(() => {
    const timer = setTimeout(() => setQuery(search.trim()), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [search]);

  const load = useCallback(async (nextPage: number, append: boolean) => {
    const seq = ++requestSeq.current;
    if (append) setLoadingMore(true);
    else setStatus('loading');
    try {
      const result = await getCoaches({ page: nextPage, limit: PAGE_SIZE, q: query });
      if (seq !== requestSeq.current) return; // ответ устаревшего поиска
      setCoaches((prev) => (append ? [...prev, ...result.data.filter((c) => !prev.some((p) => p._id === c._id))] : result.data));
      setPage(result.pagination.currentPage);
      setTotalPages(result.pagination.totalPages);
      setTotal(result.pagination.totalCoaches);
      setStatus('ready');
    } catch {
      // «Показать ещё» при ошибке просто остаётся доступной; первая страница — экран ошибки с повтором
      if (seq === requestSeq.current && !append) setStatus('error');
    } finally {
      if (seq === requestSeq.current) setLoadingMore(false);
    }
    // Язык — в зависимостях: тексты профилей приходят локализованными
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, i18n.language]);

  useEffect(() => { void load(1, false); }, [load]);

  // Мои заявки — статус «отправлена / ваш тренер» на карточках
  const loadRequests = useCallback(async () => {
    if (!isAuthenticated) { setRequests({}); return; }
    try {
      const sent = await getSentCoachRequests();
      // Ответ отсортирован от новых к старым: статус пары — по последней заявке.
      // После отказа можно отправить новую — такой тренер без статуса
      const latest: Record<string, CoachRequestStatus> = {};
      const seen = new Set<string>();
      for (const r of sent) {
        const coachId = typeof r.coach === 'string' ? r.coach : r.coach._id;
        if (seen.has(coachId)) continue;
        seen.add(coachId);
        if (r.status !== 'rejected') latest[coachId] = r.status;
      }
      setRequests(latest);
    } catch {
      setRequests({});
    }
  }, [isAuthenticated]);
  useEffect(() => { void loadRequests(); }, [loadRequests]);

  const myId = user?._id;
  const isMe = useCallback((coach: CoachDto) => !!myId && coach.user._id === myId, [myId]);
  const skeletons = useMemo(() => Array.from({ length: 6 }, (_, i) => i), []);

  return (
    <PageContainer maxWidth={1200}>
      <PageHeader
        eyebrow={t('navbar.coaches')}
        title={t('coaches.title')}
        subtitle={t('coaches.subtitle')}
        actions={(
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ width: { xs: '100%', sm: 'auto' } }}>
            <TextField
              size="small"
              placeholder={t('coaches.searchByName')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              sx={{ width: { xs: '100%', sm: 280 } }}
              inputProps={{ 'aria-label': t('coaches.searchByName'), maxLength: 100 }}
              InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon sx={{ color: 'text.secondary' }} /></InputAdornment> }}
            />
            {isCoach && (
              <Button variant="outlined" color="inherit" startIcon={<ManageAccountsRoundedIcon />} onClick={() => setEditOpen(true)}>
                {t('coachesPage.myProfile', 'My coach profile')}
              </Button>
            )}
          </Stack>
        )}
      />

      {status === 'error' ? (
        <Alert severity="error" action={<Button color="inherit" size="small" onClick={() => void load(1, false)}>{t('coachesPage.retry', 'Retry')}</Button>}>
          {t('coaches.fetchError')}
        </Alert>
      ) : (
        <>
          {status === 'ready' && query && (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {t('coachesPage.found', { count: total, defaultValue: 'Found: {{count}}' })}
            </Typography>
          )}
          <Box sx={{ display: 'grid', gap: 2.5, gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))', md: 'repeat(3, minmax(0, 1fr))' } }}>
            {status === 'loading'
              ? skeletons.map((i) => (
                <Card key={i} sx={{ p: 2.5 }} aria-hidden>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Skeleton variant="circular" width={64} height={64} />
                    <Box sx={{ flex: 1 }}><Skeleton width="70%" height={28} /><Skeleton width="50%" /></Box>
                  </Stack>
                  <Skeleton sx={{ mt: 2 }} /><Skeleton width="80%" /><Skeleton variant="rounded" height={36} sx={{ mt: 2 }} />
                </Card>
              ))
              : coaches.map((coach) => (
                <CoachCard key={coach._id} coach={coach} requestStatus={requests[coach._id]} isMe={isMe(coach)} onOpen={setSelected} />
              ))}
          </Box>

          {status === 'ready' && coaches.length === 0 && (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <Typography variant="h6">{query ? t('coachesPage.nothingFound', 'No coaches match your search') : t('coachesPage.empty', 'No coaches yet')}</Typography>
              {query && <Button sx={{ mt: 1 }} onClick={() => setSearch('')}>{t('coaches.clearFilter')}</Button>}
            </Box>
          )}
          {status === 'ready' && page < totalPages && (
            <Box sx={{ textAlign: 'center', mt: 3 }}>
              <Button variant="outlined" color="inherit" onClick={() => void load(page + 1, true)} disabled={loadingMore}>
                {t('coachesPage.loadMore', 'Show more')}
              </Button>
            </Box>
          )}
        </>
      )}

      <CoachProfileDialog
        coach={selected}
        onClose={() => setSelected(null)}
        isAuthenticated={isAuthenticated}
        isMe={!!selected && isMe(selected)}
        requestStatus={selected ? requests[selected._id] : undefined}
        onRequested={(coachId) => setRequests((r) => ({ ...r, [coachId]: 'pending' }))}
        onEditMyProfile={() => { setSelected(null); setEditOpen(true); }}
      />
      {isCoach && <MyCoachProfileDialog open={editOpen} onClose={() => setEditOpen(false)} onSaved={() => void load(1, false)} />}
    </PageContainer>
  );
};
