import { useEffect, useMemo, useState } from 'react';
import {
  Box, Typography, Grid, Paper, Stack, Button, TextField, Divider, CircularProgress, Chip, InputAdornment,
} from '@mui/material';
import SaveRoundedIcon from '@mui/icons-material/SaveRounded';
import { message } from 'antd';
import { useTranslation } from 'react-i18next';
import { PageContainer } from '@/shared/components/ui/PageHeader';
import { SEOHead } from '@/shared/components/seo/SEOHead';
import { useClubStore } from '@/features/clubs/clubStore';
import {
  fetchAdminSiteSettings, saveSiteSettings, SiteFact, SiteSettingsInput,
} from '@/features/site/siteApi';

const SWATCHES = ['#2B50E0', '#7C3AED', '#0EA5E9', '#16A34A', '#DC2626', '#B8862F', '#DB2777', '#0F766E', '#111827'];

// Контрастный текст на акценте (как на публичной витрине)
const onAccent = (hex: string) => {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex || '');
  if (!m) return '#fff';
  const [r, g, b] = [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)];
  return (r * 299 + g * 587 + b * 114) / 1000 > 150 ? '#141B2E' : '#ffffff';
};

type FormState = {
  siteName: string; logoUrl: string; tagline: string; primaryColor: string;
  promoTitle: string; promoSubtitle: string; backgroundUrl: string;
  facts: SiteFact[];
  footerText: string; legalName: string;
  facebook: string; instagram: string; twitter: string; youtube: string; telegram: string;
};

const EMPTY: FormState = {
  siteName: '', logoUrl: '', tagline: '', primaryColor: '#2B50E0',
  promoTitle: '', promoSubtitle: '', backgroundUrl: '',
  facts: [{ value: '', label: '' }, { value: '', label: '' }, { value: '', label: '' }],
  footerText: '', legalName: '',
  facebook: '', instagram: '', twitter: '', youtube: '', telegram: '',
};

export const ClubSettingsPage = () => {
  const { t } = useTranslation();
  const [form, setForm] = useState<FormState>(EMPTY);
  const [clubName, setClubName] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const clubs = useClubStore((s) => s.clubs);
  const activeClubId = useClubStore((s) => s.activeClubId);
  const loadClubs = useClubStore((s) => s.load);
  useEffect(() => { loadClubs(); }, [loadClubs]);
  const entry = clubs.find((c) => c.club._id === activeClubId) ?? null;
  const role = entry?.role;
  const isOwner = role === undefined || role === 'owner'; // роль неизвестна → не блокируем (бэк всё равно проверит)

  useEffect(() => {
    let alive = true;
    fetchAdminSiteSettings()
      .then((d) => {
        if (!alive) return;
        setClubName(d.club.name);
        const s = d.settings;
        const facts = (s?.auth?.facts ?? []).slice(0, 3);
        while (facts.length < 3) facts.push({ value: '', label: '' });
        setForm({
          siteName: s?.siteName ?? '',
          logoUrl: s?.logoUrl ?? '',
          tagline: s?.tagline ?? '',
          primaryColor: d.club.primaryColor || '#2B50E0',
          promoTitle: s?.auth?.promoTitle ?? '',
          promoSubtitle: s?.auth?.promoSubtitle ?? '',
          backgroundUrl: s?.auth?.backgroundUrl ?? '',
          facts,
          footerText: s?.footer?.text ?? '',
          legalName: s?.footer?.legalName ?? '',
          facebook: s?.socials?.facebook ?? '',
          instagram: s?.socials?.instagram ?? '',
          twitter: s?.socials?.twitter ?? '',
          youtube: s?.socials?.youtube ?? '',
          telegram: s?.socials?.telegram ?? '',
        });
      })
      .catch(() => { /* интерцептор покажет ошибку */ })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, []);

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => setForm((f) => ({ ...f, [k]: v }));
  const setFact = (i: number, key: keyof SiteFact, v: string) =>
    setForm((f) => ({ ...f, facts: f.facts.map((x, idx) => (idx === i ? { ...x, [key]: v } : x)) }));

  const previewFacts = useMemo(() => form.facts.filter((x) => x.value || x.label), [form.facts]);
  const brandName = form.siteName || clubName || 'debiut';
  const accent = form.primaryColor || '#2B50E0';
  const ink = onAccent(accent);

  const onSave = async () => {
    setSaving(true);
    const payload: SiteSettingsInput = {
      siteName: form.siteName,
      logoUrl: form.logoUrl,
      tagline: form.tagline,
      primaryColor: form.primaryColor,
      auth: {
        promoTitle: form.promoTitle,
        promoSubtitle: form.promoSubtitle,
        backgroundUrl: form.backgroundUrl,
        facts: form.facts.filter((x) => x.value || x.label),
      },
      footer: { text: form.footerText, legalName: form.legalName },
      socials: {
        facebook: form.facebook, instagram: form.instagram, twitter: form.twitter,
        youtube: form.youtube, telegram: form.telegram,
      },
    };
    try {
      await saveSiteSettings(payload);
      message.success(t('clubSettings.saved', 'Настройки сохранены'));
    } catch { /* интерцептор показал ошибку */ } finally { setSaving(false); }
  };

  const cardSx = { p: { xs: 2.5, md: 3 }, borderRadius: 4, border: '1px solid', borderColor: 'divider', mb: 2.5 };

  return (
    <PageContainer>
      <SEOHead title={t('clubSettings.seoTitle', 'Настройки клуба — debiut')} description="" noindex />

      <Stack direction="row" justifyContent="space-between" alignItems="flex-end" sx={{ mb: 3 }} flexWrap="wrap" useFlexGap>
        <Box>
          <Typography variant="body2" color="text.secondary">{t('clubSettings.eyebrow', 'Сайт клуба')}</Typography>
          <Typography variant="h4" sx={{ mt: 0.5 }}>{t('clubSettings.title', 'Настройки клуба')}</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {t('clubSettings.subtitle', 'Бренд, окно входа и соцсети вашего клуба. Публикуется на странице входа и сайте клуба.')}
          </Typography>
        </Box>
        <Button variant="contained" size="large" startIcon={<SaveRoundedIcon />} onClick={onSave}
          disabled={!isOwner || saving || loading} sx={{ borderRadius: 2.5 }}>
          {saving ? t('clubSettings.saving', 'Сохраняю…') : t('clubSettings.save', 'Сохранить')}
        </Button>
      </Stack>

      {!isOwner && (
        <Paper sx={{ ...cardSx, bgcolor: 'warning.light', borderColor: 'warning.main' }}>
          <Typography variant="body2">{t('clubSettings.ownerOnly', 'Редактировать настройки сайта может только владелец клуба.')}</Typography>
        </Paper>
      )}

      {loading ? (
        <Box sx={{ display: 'grid', placeItems: 'center', py: 10 }}><CircularProgress /></Box>
      ) : (
        <Grid container spacing={2.5}>
          {/* Левая колонка — форма */}
          <Grid item xs={12} md={7}>
            <Paper sx={cardSx}>
              <Typography variant="h6" sx={{ mb: 2 }}>{t('clubSettings.brand', 'Бренд')}</Typography>
              <Stack spacing={2}>
                <TextField label={t('clubSettings.siteName', 'Название сайта')} value={form.siteName}
                  onChange={(e) => set('siteName', e.target.value)} placeholder={clubName} fullWidth
                  helperText={t('clubSettings.siteNameHelp', 'Пусто → используется название клуба')} />
                <TextField label={t('clubSettings.logoUrl', 'Логотип (ссылка на изображение)')} value={form.logoUrl}
                  onChange={(e) => set('logoUrl', e.target.value)} placeholder="https://…" fullWidth
                  helperText={t('clubSettings.logoHelp', 'Загрузка файлов появится с медиатекой (шаг 2). Пока — ссылка.')} />
                <TextField label={t('clubSettings.tagline', 'Слоган')} value={form.tagline}
                  onChange={(e) => set('tagline', e.target.value)} fullWidth />
                <Box>
                  <Typography variant="body2" sx={{ mb: 1, color: 'text.secondary' }}>{t('clubSettings.color', 'Цвет бренда')}</Typography>
                  <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                    {SWATCHES.map((c) => (
                      <Box key={c} onClick={() => set('primaryColor', c)} role="button" aria-label={c}
                        sx={{ width: 30, height: 30, borderRadius: '50%', bgcolor: c, cursor: 'pointer',
                          outline: form.primaryColor.toLowerCase() === c.toLowerCase() ? '3px solid' : '1px solid',
                          outlineColor: form.primaryColor.toLowerCase() === c.toLowerCase() ? 'text.primary' : 'divider', outlineOffset: 2 }} />
                    ))}
                    <TextField value={form.primaryColor} onChange={(e) => set('primaryColor', e.target.value)}
                      size="small" sx={{ width: 130 }}
                      InputProps={{ startAdornment: <InputAdornment position="start"><Box sx={{ width: 16, height: 16, borderRadius: '4px', bgcolor: form.primaryColor }} /></InputAdornment> }} />
                  </Stack>
                </Box>
              </Stack>
            </Paper>

            <Paper sx={cardSx}>
              <Typography variant="h6" sx={{ mb: 2 }}>{t('clubSettings.authPanel', 'Окно входа')}</Typography>
              <Stack spacing={2}>
                <TextField label={t('clubSettings.promoTitle', 'Заголовок')} value={form.promoTitle}
                  onChange={(e) => set('promoTitle', e.target.value)} fullWidth placeholder="Think deeper. Play sharper." />
                <TextField label={t('clubSettings.promoSubtitle', 'Подзаголовок')} value={form.promoSubtitle}
                  onChange={(e) => set('promoSubtitle', e.target.value)} fullWidth multiline minRows={2} />
                <TextField label={t('clubSettings.bgUrl', 'Фоновое фото (ссылка)')} value={form.backgroundUrl}
                  onChange={(e) => set('backgroundUrl', e.target.value)} fullWidth placeholder="https://…" />
                <Divider textAlign="left"><Chip label={t('clubSettings.facts', 'Цифры-факты (до 3, пустые скрываются)')} size="small" /></Divider>
                {form.facts.map((f, i) => (
                  <Stack key={i} direction="row" spacing={1.5}>
                    <TextField label={t('clubSettings.factValue', 'Значение')} value={f.value}
                      onChange={(e) => setFact(i, 'value', e.target.value)} sx={{ width: 160 }} placeholder="50k+" />
                    <TextField label={t('clubSettings.factLabel', 'Подпись')} value={f.label}
                      onChange={(e) => setFact(i, 'label', e.target.value)} fullWidth placeholder="tactics" />
                  </Stack>
                ))}
              </Stack>
            </Paper>

            <Paper sx={cardSx}>
              <Typography variant="h6" sx={{ mb: 2 }}>{t('clubSettings.socials', 'Соцсети')}</Typography>
              <Stack spacing={2}>
                {(['facebook', 'instagram', 'twitter', 'youtube', 'telegram'] as const).map((k) => (
                  <TextField key={k} label={k[0].toUpperCase() + k.slice(1)} value={form[k]}
                    onChange={(e) => set(k, e.target.value)} fullWidth placeholder="https://…" />
                ))}
              </Stack>
            </Paper>

            <Paper sx={cardSx}>
              <Typography variant="h6" sx={{ mb: 2 }}>{t('clubSettings.footer', 'Футер')}</Typography>
              <Stack spacing={2}>
                <TextField label={t('clubSettings.footerText', 'Текст под брендом')} value={form.footerText}
                  onChange={(e) => set('footerText', e.target.value)} fullWidth />
                <TextField label={t('clubSettings.legalName', 'Имя для копирайта')} value={form.legalName}
                  onChange={(e) => set('legalName', e.target.value)} fullWidth placeholder={clubName} />
              </Stack>
            </Paper>
          </Grid>

          {/* Правая колонка — живой превью окна входа */}
          <Grid item xs={12} md={5}>
            <Box sx={{ position: 'sticky', top: 16 }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>{t('clubSettings.preview', 'Предпросмотр окна входа')}</Typography>
              <Paper sx={{ borderRadius: 4, overflow: 'hidden', border: '1px solid', borderColor: 'divider' }}>
                <Box sx={{
                  p: 4, minHeight: 360, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', color: '#fff',
                  background: form.backgroundUrl
                    ? `linear-gradient(rgba(12,15,20,0.55), rgba(12,15,20,0.75)), url(${form.backgroundUrl}) center/cover no-repeat`
                    : `radial-gradient(80% 60% at 20% 10%, ${accent}2E, transparent 60%), #0C0F14`,
                }}>
                  <Stack direction="row" spacing={1.5} alignItems="center">
                    {form.logoUrl
                      ? <Box component="img" src={form.logoUrl} alt="" sx={{ width: 36, height: 36, borderRadius: 2, objectFit: 'cover' }} />
                      : <Box sx={{ width: 36, height: 36, borderRadius: 2, display: 'grid', placeItems: 'center', bgcolor: accent, color: ink, fontWeight: 800 }}>♞</Box>}
                    <Typography sx={{ fontWeight: 700 }}>{brandName}</Typography>
                  </Stack>
                  <Box>
                    <Typography sx={{ fontSize: '1.8rem', fontWeight: 800, lineHeight: 1.1 }}>
                      {form.promoTitle || t('clubSettings.previewTitle', 'Train. Compete. Improve.')}
                    </Typography>
                    <Typography sx={{ mt: 1.5, color: 'rgba(243,244,246,0.75)', fontSize: '0.95rem' }}>
                      {form.promoSubtitle || t('clubSettings.previewSub', 'Lessons, puzzles and online games — all inside one platform.')}
                    </Typography>
                  </Box>
                  {previewFacts.length > 0 && (
                    <Stack direction="row" spacing={3}>
                      {previewFacts.map((f, i) => (
                        <Box key={i}>
                          <Typography sx={{ fontWeight: 800, fontSize: '1.3rem', color: accent, lineHeight: 1 }}>{f.value}</Typography>
                          <Typography sx={{ fontSize: '0.75rem', color: 'rgba(243,244,246,0.6)' }}>{f.label}</Typography>
                        </Box>
                      ))}
                    </Stack>
                  )}
                </Box>
              </Paper>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1.5 }}>
                {t('clubSettings.previewNote', 'Так окно входа увидят на /login?club=')}{entry?.club.slug ? ` ${entry.club.slug}` : ""}
              </Typography>
            </Box>
          </Grid>
        </Grid>
      )}
    </PageContainer>
  );
};

export default ClubSettingsPage;
