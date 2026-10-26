import React, { useState } from 'react';
import {
  Alert, Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem, Stack, TextField,
  useMediaQuery, useTheme,
} from '@mui/material';
import { notification } from 'antd';
import { useTranslation } from 'react-i18next';
import { FideTitle } from '@/api/coaches';
import { CoachApplicationDto, submitCoachApplication } from '@/api/coaches/coachApplications';

const TITLES: FideTitle[] = ['None', 'GM', 'IM', 'FM', 'CM', 'WGM', 'WIM', 'WFM', 'WCM', 'NM'];

interface Form {
  headline: string;
  motivation: string;
  experience: string;
  specializations: string;
  contact: string;
  title: FideTitle;
  fideId: string;
  standard: string;
  rapid: string;
  blitz: string;
  profileUrl: string;
}
const EMPTY: Form = {
  headline: '', motivation: '', experience: '', specializations: '', contact: '',
  title: 'None', fideId: '', standard: '', rapid: '', blitz: '', profileUrl: '',
};

const ratingOf = (v: string) => {
  const n = Number(v);
  return v.trim() && Number.isFinite(n) && n > 0 ? Math.round(n) : undefined;
};

interface CoachApplicationDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmitted: (application: CoachApplicationDto) => void;
}

/**
 * Анкета кандидата в тренеры: мотивация (обязательно), опыт, специализации, контакт и данные FIDE.
 * После отправки заявку рассматривает администратор.
 */
export const CoachApplicationDialog: React.FC<CoachApplicationDialogProps> = ({ open, onClose, onSubmitted }) => {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const lang = (i18n.language || 'en').slice(0, 2);
  const [form, setForm] = useState<Form>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (field: keyof Form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [field]: e.target.value }));
  const urlInvalid = !!form.profileUrl.trim() && !/^https?:\/\/\S+$/i.test(form.profileUrl.trim());
  const motivationInvalid = !form.motivation.trim();

  const submit = async () => {
    if (motivationInvalid) { setError(t('coachApplication.motivationRequired', 'Please tell us why you want to become a coach.')); return; }
    setSaving(true);
    setError(null);
    try {
      const application = await submitCoachApplication({
        motivation: form.motivation.trim(),
        headline: form.headline.trim() || undefined,
        experience: form.experience.trim() || undefined,
        specializations: form.specializations.split(',').map((s) => s.trim()).filter(Boolean),
        contact: form.contact.trim() || undefined,
        fideProfile: {
          title: form.title,
          fideId: form.fideId.trim() || undefined,
          rating: { standard: ratingOf(form.standard), rapid: ratingOf(form.rapid), blitz: ratingOf(form.blitz) },
          profileUrl: form.profileUrl.trim() || undefined,
        },
        sourceLang: lang,
      });
      notification.success({ message: t('coachApplication.submitted', 'Your application has been sent for review.'), description: undefined });
      onSubmitted(application);
      setForm(EMPTY);
      onClose();
    } catch (e) {
      const msg = (e as { response?: { data?: { msg?: string } } })?.response?.data?.msg;
      setError(msg || t('coachApplication.submitFailed', 'Failed to send your application. Please try again.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={saving ? undefined : onClose} fullWidth maxWidth="sm" fullScreen={fullScreen}>
      <DialogTitle>{t('coachApplication.title', 'Apply to become a coach')}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          <Alert severity="info">
            {t('coachApplication.hint', 'An administrator will review your application and may message you to clarify the details. Once approved, you will be able to set up your coach page.')}
          </Alert>
          <TextField
            label={t('coachApplication.motivation', 'Why do you want to become a coach?')}
            value={form.motivation} onChange={set('motivation')} fullWidth required multiline minRows={4}
            inputProps={{ maxLength: 2000 }} error={!!error && motivationInvalid}
            placeholder={t('coachApplication.motivationPlaceholder', 'Tell us about yourself, your coaching style and what students can expect.')}
          />
          <TextField
            label={t('coachApplication.experience', 'Coaching & playing experience')}
            value={form.experience} onChange={set('experience')} fullWidth multiline minRows={3} inputProps={{ maxLength: 2000 }}
            placeholder={t('coachApplication.experiencePlaceholder', 'Years of experience, achievements, students you have trained…')}
          />
          <TextField
            label={t('coachesPage.headline', 'Headline')} value={form.headline} onChange={set('headline')} fullWidth inputProps={{ maxLength: 120 }}
            placeholder={t('coachesPage.headlinePlaceholder', 'e.g. FIDE trainer, endgame specialist')}
          />
          <TextField
            label={t('coachesPage.specializations', 'Specializations')} value={form.specializations} onChange={set('specializations')} fullWidth
            helperText={t('coachesPage.specializationsHelp', 'Comma-separated: openings, endgames, tactics')}
          />
          <TextField
            label={t('coachApplication.contact', 'Contact (phone / Telegram)')} value={form.contact} onChange={set('contact')} fullWidth inputProps={{ maxLength: 200 }}
            helperText={t('coachApplication.contactHelp', 'Optional — how the administrator can reach you besides chat.')}
          />
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
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button onClick={onClose} color="inherit" disabled={saving}>{t('coaches.cancel')}</Button>
        <Button onClick={submit} variant="contained" disabled={saving || urlInvalid || motivationInvalid}>
          {saving ? <CircularProgress size={18} /> : t('coachApplication.send', 'Send application')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
