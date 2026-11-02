import { useEffect, useState } from 'react';
import {
  Box, Button, Chip, CircularProgress, Grid, Paper, Stack, Tab, Tabs, TextField, Typography,
} from '@mui/material';
import SaveRoundedIcon from '@mui/icons-material/SaveRounded';
import PublishRoundedIcon from '@mui/icons-material/PublishRounded';
import VisibilityRoundedIcon from '@mui/icons-material/VisibilityRounded';
import { message } from 'antd';
import { useTranslation } from 'react-i18next';
import { PageContainer } from '@/shared/components/ui/PageHeader';
import { SEOHead } from '@/shared/components/seo/SEOHead';
import { useClubStore } from '@/features/clubs/clubStore';
import { SiteBlockEditor } from './SiteBlockEditor';
import { PageRenderer } from '@/features/site/PageRenderer';
import { fetchAdminPage, savePage, publishPage, SiteBlock } from '@/features/site/pagesApi';

// Стандартный набор страниц сайта клуба (slug'и фиксированы — совпадают с публичной навигацией).
const STANDARD_PAGES: Array<{ slug: string; labelKey: string; fallback: string }> = [
  { slug: 'home', labelKey: 'site.page.home', fallback: 'Home' },
  { slug: 'about', labelKey: 'site.page.about', fallback: 'About us' },
  { slug: 'coaches', labelKey: 'site.page.coaches', fallback: 'Coaches' },
  { slug: 'achievements', labelKey: 'site.page.achievements', fallback: 'Achievements' },
];

/** Редактор публичного сайта клуба: владелец заполняет страницы блоками (шаг 4 плана сайтов). */
export default function ClubSitePagesPage() {
  const { t } = useTranslation();
  const activeClub = useClubStore((s) => s.clubs.find((c) => c.club._id === s.activeClubId)?.club);

  const [slug, setSlug] = useState('home');
  const [title, setTitle] = useState('');
  const [blocks, setBlocks] = useState<SiteBlock[]>([]);
  const [status, setStatus] = useState<string>('draft');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    fetchAdminPage(slug)
      .then(({ page }) => {
        if (!alive) return;
        setTitle(page.title || '');
        setBlocks(Array.isArray(page.blocks) ? page.blocks : []);
        setStatus(page.status || 'draft');
      })
      .catch(() => { if (alive) { setTitle(''); setBlocks([]); setStatus('draft'); } })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [slug]);

  const doSave = async (): Promise<boolean> => {
    setBusy(true);
    try {
      await savePage(slug, { title, blocks });
      setStatus('draft');
      message.success(t('site.saved', 'Draft saved'));
      return true;
    } catch (e) {
      const err = e as { response?: { data?: { msg?: string } } };
      message.error(err.response?.data?.msg || t('site.saveFailed', 'Failed to save'));
      return false;
    } finally {
      setBusy(false);
    }
  };

  const doPublish = async () => {
    setBusy(true);
    try {
      await savePage(slug, { title, blocks });
      await publishPage(slug);
      setStatus('published');
      message.success(t('site.published', 'Page published — it is now live on your club site'));
    } catch (e) {
      const err = e as { response?: { data?: { msg?: string } } };
      message.error(err.response?.data?.msg || t('site.publishFailed', 'Failed to publish'));
    } finally {
      setBusy(false);
    }
  };

  const publicHref = activeClub?.slug ? `/c/${activeClub.slug}${slug === 'home' ? '' : `/${slug}`}` : null;

  return (
    <PageContainer maxWidth={1200}>
      <SEOHead title={t('site.editorTitle', 'Website')} description={t('site.editorSubtitle', 'Edit your club website pages.')} noindex />
      <Stack direction="row" alignItems="center" sx={{ mb: 1 }} spacing={1.5}>
        <Typography variant="h4" component="h1" sx={{ flex: 1 }}>{t('site.editorTitle', 'Website')}</Typography>
        {publicHref && (
          <Button component="a" href={publicHref} target="_blank" rel="noopener" startIcon={<VisibilityRoundedIcon />} size="small">
            {t('site.viewLive', 'View live site')}
          </Button>
        )}
      </Stack>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        {t('site.editorSubtitle', 'Fill in your club pages with text, photos and banners. Save a draft, then publish to make it live.')}
      </Typography>

      <Tabs value={slug} onChange={(_, v) => setSlug(v)} variant="scrollable" scrollButtons="auto" sx={{ mb: 3, borderBottom: '1px solid', borderColor: 'divider' }}>
        {STANDARD_PAGES.map((p) => <Tab key={p.slug} value={p.slug} label={t(p.labelKey, p.fallback)} />)}
      </Tabs>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 6 }}><CircularProgress /></Box>
      ) : (
        <Grid container spacing={3}>
          {/* Редактор */}
          <Grid item xs={12} md={7}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ sm: 'center' }} sx={{ mb: 2 }}>
              <TextField label={t('site.pageTitle', 'Page title')} size="small" fullWidth value={title} onChange={(e) => setTitle(e.target.value)} />
              <Chip
                size="small"
                color={status === 'published' ? 'success' : 'default'}
                variant={status === 'published' ? 'filled' : 'outlined'}
                label={status === 'published' ? t('site.statusPublished', 'Published') : t('site.statusDraft', 'Draft')}
              />
            </Stack>

            <SiteBlockEditor blocks={blocks} onChange={setBlocks} />

            <Stack direction="row" spacing={1.5} sx={{ mt: 3 }}>
              <Button variant="outlined" startIcon={<SaveRoundedIcon />} onClick={doSave} disabled={busy}>{t('site.save', 'Save draft')}</Button>
              <Button variant="contained" startIcon={<PublishRoundedIcon />} onClick={doPublish} disabled={busy}>{t('site.publish', 'Publish')}</Button>
            </Stack>
          </Grid>

          {/* Живое превью */}
          <Grid item xs={12} md={5}>
            <Box sx={{ position: 'sticky', top: 16 }}>
              <Typography variant="overline" color="text.secondary">{t('site.preview', 'Preview')}</Typography>
              <Paper variant="outlined" sx={{ p: 2.5, mt: 0.5, maxHeight: '75vh', overflow: 'auto' }}>
                {blocks.length ? <PageRenderer blocks={blocks} /> : (
                  <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                    {t('site.previewEmpty', 'Your page preview will appear here.')}
                  </Typography>
                )}
              </Paper>
            </Box>
          </Grid>
        </Grid>
      )}
    </PageContainer>
  );
}
