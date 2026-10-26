import React, { useEffect, useState } from 'react';
import {
  Alert, Box, Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem, Stack, TextField,
  useMediaQuery, useTheme,
} from '@mui/material';
import { notification } from 'antd';
import { useTranslation } from 'react-i18next';
import { FideTitle, getMyCoachProfile, MyCoachProfile, updateMyCoachProfile, verifyMyCoachProfile } from '@/api/coaches';
import { useAuth } from '@/context/AuthContext';

const TITLES: FideTitle[] = ['None', 'GM', 'IM', 'FM', 'CM', 'WGM', 'WIM', 'WFM', 'WCM', 'NM'];

interface Form {
  headline: string;
  bio: string;
  specializations: string;
  title: FideTitle;
  fideId: string;
  standard: string;
  rapid: string;
  blitz: string;
  profileUrl: string;
}
const EMPTY: Form = { headline: '', bio: '', specializations: '', title: 'None', fideId: '', standard: '', rapid: '', blitz: '', profileUrl: '' };

const pick = <T,>(value: Record<string, T> | undefined, lang: string): T | undefined => value?.[lang] ?? value?.en;
const toForm = (p: MyCoachProfile | null, lang: string): Form => (p ? {
  headline: pick(p.headline, lang) ?? '',
  bio: pick(p.bio, lang) ?? '',
  specializations: (pick(p.specializations, lang) ?? []).join(', '),
  title: p.fideProfile?.title ?? 'None',
  fideId: p.fideProfile?.fideId ?? '',
  standard: p.fideProfile?.rating?.standard ? String(p.fideProfile.rating.standard) : '',
  rapid: p.fideProfile?.rating?.rapid ? String(p.fideProfile.rating.rapid) : '',
  blitz: p.fideProfile?.rating?.blitz ? String(p.fideProfile.rating.blitz) : '',
  profileUrl: p.fideProfile?.profileUrl ?? '',
} : EMPTY);

const ratingOf = (v: string) => {
  const n = Number(v);
  return v.trim() && Number.isFinite(n) && n > 0 ? Math.round(n) : undefined;
};

interface MyCoachProfileDialogProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}

/** Свой профиль тренера: тексты на текущем языке (бэкенд переводит на остальные) и данные FIDE */
export const MyCoachProfileDialog: React.FC<MyCoachProfileDialogProps> = ({ open, onClose, onSaved }) => {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const lang = (i18n.language || 'en').slice(0, 2);
  const { user } = useAuth();
  const isAdmin = !!user?.roles?.includes('ADMIN');
  const [profile, setProfile] = useState<MyCoachProfile | null>(null);
  const [form, setForm] = useState<Form>(EMPTY);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return undefined;
    let cancelled = false;
    setLoading(true);
    setError(null);
    getMyCoachProfile()
      .then((p) => { if (!cancelled) { setProfile(p); setForm(toForm(p, lang)); } })
      .catch(() => { if (!cancelled) setError(t('coachesPage.profileLoadError', 'Failed to load your coach profile.')); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [open, lang, t]);

  // Админ может верифицировать профиль (в т.ч. свой) — профиль появится в каталоге тренеров
  const handleVerify = async () => {
    setVerifying(true);
    try {
      const p = await verifyMyCoachProfile();
      setProfile(p);
      setForm(toForm(p, lang));
      notification.success({ message: t('coachesPage.verified', 'Профиль верифицирован'), description: undefined });
      onSaved();
    } catch {
      notification.error({ message: t('coachesPage.verifyFailed', 'Не удалось верифицировать профиль'), description: undefined });
    } finally {
      setVerifying(false);
    }
  };

  const set = (field: keyof Form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [field]: e.target.value }));
  const urlInvalid = !!form.profileUrl.trim() && !/^https?:\/\/\S+$/i.test(form.profileUrl.trim());

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      await updateMyCoachProfile({
        headline: form.headline.trim() || undefined,
        bio: form.bio.trim() || undefined,
        specializations: form.specializations.split(',').map((s) => s.trim()).filter(Boolean),
        fideProfile: {
          title: form.title,
          fideId: form.fideId.trim() || undefined,
          rating: { standard: ratingOf(form.standard), rapid: ratingOf(form.rapid), blitz: ratingOf(form.blitz) },
          profileUrl: form.profileUrl.trim() || undefined,
        },
        sourceLang: lang,
      });
      notification.success({ message: t('coaches.updated'), description: undefined });
      onSaved();
      onClose();
    } catch {
      setError(t('coaches.updateFailed'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm" fullScreen={fullScreen}>
      <DialogTitle>{t('coachesPage.myProfile', 'My coach profile')}</DialogTitle>
      <DialogContent>
        {loading ? (
          <Box sx={{ display: 'grid', placeItems: 'center', py: 6 }}><CircularProgress /></Box>
        ) : (
          <Stack spacing={2} sx={{ pt: 1 }}>
            {profile && !profile.isVerified && (
              <Alert
                severity={isAdmin ? 'warning' : 'info'}
                action={isAdmin ? (
                  <Button color="inherit" size="small" disabled={verifying} onClick={handleVerify}>
                    {verifying ? t('coachesPage.verifying', 'Верификация…') : t('coachesPage.verifyNow', 'Верифицировать')}
                  </Button>
                ) : undefined}
              >
                {isAdmin
                  ? t('coachesPage.notVerifiedAdmin', 'Профиль ещё не верифицирован. Как администратор, вы можете подтвердить его прямо сейчас — после этого он появится в каталоге тренеров.')
                  : t('coachesPage.notVerified', 'Your profile is awaiting verification by an administrator and is not shown in the catalog yet.')}
              </Alert>
            )}
            {profile && profile.isVerified && (
              <Alert severity="success">{t('coachesPage.verifiedInfo', 'Профиль верифицирован и виден в каталоге тренеров.')}</Alert>
            )}
            {!profile && <Alert severity="info">{t('coachesPage.createProfileHint', 'Fill in your profile — students will see it in the coaches catalog after verification.')}</Alert>}
            <TextField label={t('coachesPage.headline', 'Headline')} value={form.headline} onChange={set('headline')} fullWidth inputProps={{ maxLength: 120 }}
              placeholder={t('coachesPage.headlinePlaceholder', 'e.g. FIDE trainer, endgame specialist')} />
            <TextField label={t('coaches.bio')} value={form.bio} onChange={set('bio')} fullWidth multiline minRows={4} inputProps={{ maxLength: 3000 }} />
            <TextField label={t('coachesPage.specializations', 'Specializations')} value={form.specializations} onChange={set('specializations')} fullWidth
              helperText={t('coachesPage.specializationsHelp', 'Comma-separated: openings, endgames, tactics')} />
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField select label={t('coachesPage.fideTitle', 'FIDE title')} value={form.title} onChange={set('title')} sx={{ minWidth: 140 }}>
                {TITLES.map((title) => <MenuItem key={title} value={title}>{title === 'None' ? t('coachesPage.noTitle', 'No title') : title}</MenuItem>)}
              </TextField>
              <TextField label="FIDE ID" value={form.fideId} onChange={set('fideId')} fullWidth inputProps={{ inputMode: 'numeric', maxLength: 12 }} />
            </Stack>
            <Stack direction="row" spacing={1.5}>
              {(['standard', 'rapid', 'blitz'] as const).map((kind) => (
                <TextField key={kind} label={t(`coachesPage.ratingKind.${kind}`, kind)} value={form[kind]} onChange={set(kind)} type="number"
                  inputProps={{ min: 0, max: 3500 }} fullWidth />
              ))}
            </Stack>
            <TextField label={t('coachesPage.fideProfile', 'FIDE profile')} value={form.profileUrl} onChange={set('profileUrl')} fullWidth
              error={urlInvalid} helperText={urlInvalid ? t('coachesPage.urlInvalid', 'Enter a link starting with https://') : ' '} placeholder="https://ratings.fide.com/profile/…" />
            {error && <Alert severity="error">{error}</Alert>}
          </Stack>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button onClick={onClose} color="inherit">{t('coaches.cancel')}</Button>
        <Button onClick={save} variant="contained" disabled={loading || saving || urlInvalid}>
          {saving ? <CircularProgress size={18} /> : t('coaches.save')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
