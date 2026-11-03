import { useEffect, useRef, useState } from 'react';
import {
  Box, Button, Chip, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle,
  Grid, Paper, Stack, Tab, Tabs, TextField, Typography,
} from '@mui/material';
import SaveRoundedIcon from '@mui/icons-material/SaveRounded';
import PublishRoundedIcon from '@mui/icons-material/PublishRounded';
import VisibilityRoundedIcon from '@mui/icons-material/VisibilityRounded';
import AutoAwesomeRoundedIcon from '@mui/icons-material/AutoAwesomeRounded';
import UploadFileRoundedIcon from '@mui/icons-material/UploadFileRounded';
import { message, Modal } from 'antd';
import { useTranslation } from 'react-i18next';
import { PageContainer } from '@/shared/components/ui/PageHeader';
import { SEOHead } from '@/shared/components/seo/SEOHead';
import { useClubStore } from '@/features/clubs/clubStore';
import { SiteBlockEditor } from './SiteBlockEditor';
import { PageRenderer } from '@/features/site/PageRenderer';
import { fetchAdminPage, savePage, publishPage, generatePages, fetchPagesList, SiteBlock } from '@/features/site/pagesApi';

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
  const [reloadKey, setReloadKey] = useState(0);
  // Статусы всех страниц (для точек в табах и кнопки «Publish all»).
  const [pageStatuses, setPageStatuses] = useState<Record<string, string>>({});

  // Диалог автогенерации
  const [genOpen, setGenOpen] = useState(false);
  const [genText, setGenText] = useState('');
  const [genUrls, setGenUrls] = useState('');
  const [genFile, setGenFile] = useState<File | null>(null);
  const [generating, setGenerating] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

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
  }, [slug, reloadKey]);

  // Список страниц клуба → карта slug→status (для точек в табах и Publish all).
  useEffect(() => {
    let alive = true;
    fetchPagesList()
      .then((list) => { if (alive) setPageStatuses(Object.fromEntries(list.map((p) => [p.slug, p.status]))); })
      .catch(() => { /* нет страниц — тихо */ });
    return () => { alive = false; };
  }, [reloadKey]);

  const runGenerate = async () => {
    setGenerating(true);
    try {
      const pages = await generatePages({ text: genText, urls: genUrls, document: genFile || undefined });
      message.success(t('site.gen.done', { count: pages.length, defaultValue: 'Generated {{count}} draft pages — review and publish' }));
      setGenOpen(false);
      setGenText(''); setGenUrls(''); setGenFile(null);
      setReloadKey((k) => k + 1); // перечитать текущую страницу (черновики созданы для всех)
    } catch (e) {
      const err = e as { response?: { data?: { msg?: string } } };
      message.error(err.response?.data?.msg || t('site.gen.failed', 'Generation failed. Try again with more text.'));
    } finally {
      setGenerating(false);
    }
  };

  // Перед генерацией: проверка ввода + подтверждение перезаписи, если черновики уже есть.
  const doGenerate = () => {
    if (!genText.trim() && !genUrls.trim() && !genFile) {
      message.warning(t('site.gen.needInput', 'Add text, a document or a link first.'));
      return;
    }
    if (Object.keys(pageStatuses).length > 0) {
      Modal.confirm({
        title: t('site.gen.confirmTitle', 'Replace all page drafts?'),
        content: t('site.gen.confirmBody', 'AI generation overwrites the current drafts of all four pages. Already-published pages stay live until you publish again. Continue?'),
        okText: t('site.gen.generate', 'Generate'),
        cancelText: t('common.cancel', 'Cancel'),
        onOk: runGenerate,
      });
    } else {
      runGenerate();
    }
  };

  // Publish all — сохранить текущий черновик и опубликовать ВСЕ существующие страницы разом.
  const doPublishAll = async () => {
    setBusy(true);
    try {
      await savePage(slug, { title, blocks });
      const list = await fetchPagesList();
      const slugs = list.map((p) => p.slug);
      await Promise.all(slugs.map((s) => publishPage(s)));
      setStatus('published');
      setReloadKey((k) => k + 1);
      message.success(t('site.publishedAll', { count: slugs.length, defaultValue: 'Published {{count}} pages — your site is live' }));
    } catch (e) {
      const err = e as { response?: { data?: { msg?: string } } };
      message.error(err.response?.data?.msg || t('site.publishFailed', 'Failed to publish'));
    } finally {
      setBusy(false);
    }
  };

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
        <Button onClick={() => setGenOpen(true)} startIcon={<AutoAwesomeRoundedIcon />} variant="contained" size="small">
          {t('site.gen.button', 'Generate with AI')}
        </Button>
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
        {STANDARD_PAGES.map((p) => (
          <Tab key={p.slug} value={p.slug} label={(
            <Stack direction="row" spacing={0.75} alignItems="center">
              <span>{t(p.labelKey, p.fallback)}</span>
              {pageStatuses[p.slug] && (
                <Box component="span" title={pageStatuses[p.slug]} sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: pageStatuses[p.slug] === 'published' ? 'success.main' : 'warning.main' }} />
              )}
            </Stack>
          )} />
        ))}
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

            <Stack direction="row" spacing={1.5} sx={{ mt: 3, flexWrap: 'wrap', rowGap: 1.5 }}>
              <Button variant="outlined" startIcon={<SaveRoundedIcon />} onClick={doSave} disabled={busy}>{t('site.save', 'Save draft')}</Button>
              <Button variant="outlined" startIcon={<PublishRoundedIcon />} onClick={doPublish} disabled={busy}>{t('site.publishThis', 'Publish this page')}</Button>
              <Button variant="contained" startIcon={<PublishRoundedIcon />} onClick={doPublishAll} disabled={busy}>{t('site.publishAll', 'Publish all')}</Button>
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

      {/* Диалог автогенерации всех страниц из текста/документа/ссылок */}
      <Dialog open={genOpen} onClose={() => !generating && setGenOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>{t('site.gen.title', 'Generate pages with AI')}</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {t('site.gen.hint', 'Paste text about your club, upload a document, or drop public links. The AI will draft all four pages — you can edit and publish them afterwards. Login-walled feeds (e.g. a private Facebook timeline) cannot be imported.')}
          </Typography>
          <TextField
            label={t('site.gen.text', 'Text about your club')}
            fullWidth multiline minRows={4} value={genText} onChange={(e) => setGenText(e.target.value)}
            placeholder={t('site.gen.textPh', 'Mission, history, coaches, achievements, schedule…')}
            sx={{ mb: 2 }}
          />
          <TextField
            label={t('site.gen.urls', 'Links (one per line)')}
            fullWidth multiline minRows={2} value={genUrls} onChange={(e) => setGenUrls(e.target.value)}
            placeholder={'https://facebook.com/yourclub/posts/…\nhttps://yourclub.example/about'}
            sx={{ mb: 2 }}
          />
          <input ref={fileRef} type="file" accept=".docx,.txt,.md" hidden onChange={(e) => setGenFile(e.target.files?.[0] || null)} />
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Button variant="outlined" size="small" startIcon={<UploadFileRoundedIcon />} onClick={() => fileRef.current?.click()}>
              {t('site.gen.upload', 'Upload document (.docx/.txt)')}
            </Button>
            {genFile && <Typography variant="body2" color="text.secondary" noWrap>{genFile.name}</Typography>}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setGenOpen(false)} disabled={generating}>{t('common.cancel', 'Cancel')}</Button>
          <Button onClick={doGenerate} variant="contained" disabled={generating} startIcon={generating ? <CircularProgress size={18} color="inherit" /> : <AutoAwesomeRoundedIcon />}>
            {generating ? t('site.gen.generating', 'Generating…') : t('site.gen.generate', 'Generate')}
          </Button>
        </DialogActions>
      </Dialog>
    </PageContainer>
  );
}
