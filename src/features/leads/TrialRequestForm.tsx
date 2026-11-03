import { useState } from 'react';
import {
  Box, Button, Checkbox, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle,
  FormControlLabel, MenuItem, Stack, TextField, Typography, ToggleButton, ToggleButtonGroup,
} from '@mui/material';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import { useTranslation } from 'react-i18next';
import { submitTrialRequest } from './leadsApi';

interface Props {
  open: boolean;
  onClose: () => void;
  slug: string;
  coachUuid?: string;
  coachName?: string;
}

/** Форма «Записаться на пробное» — публичная, с honeypot и согласием (RODO/GDPR). */
export const TrialRequestForm = ({ open, onClose, slug, coachUuid, coachName }: Props) => {
  const { t } = useTranslation();
  const [who, setWho] = useState<'self' | 'child'>('self');
  const [name, setName] = useState('');
  const [childAge, setChildAge] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [level, setLevel] = useState('');
  const [format, setFormat] = useState('');
  const [preferredTime, setPreferredTime] = useState('');
  const [consent, setConsent] = useState(false);
  const [company, setCompany] = useState(''); // honeypot
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState('');

  const reset = () => {
    setWho('self'); setName(''); setChildAge(''); setEmail(''); setPhone(''); setLevel(''); setFormat('');
    setPreferredTime(''); setConsent(false); setCompany(''); setDone(false); setErr('');
  };
  const close = () => { if (!busy) { onClose(); setTimeout(reset, 300); } };

  const submit = async () => {
    setErr('');
    if (!name.trim()) { setErr(t('trial.errName', 'Please enter a name.')); return; }
    if (!email.trim() && !phone.trim()) { setErr(t('trial.errContact', 'Provide an email or a phone number.')); return; }
    if (!consent) { setErr(t('trial.errConsent', 'Please agree to the processing of your data.')); return; }
    setBusy(true);
    try {
      await submitTrialRequest(slug, {
        who, name: name.trim(),
        childAge: who === 'child' && childAge ? Number(childAge) : undefined,
        email: email.trim() || undefined, phone: phone.trim() || undefined,
        level: level || undefined, format: format || undefined,
        preferredTime: preferredTime.trim() || undefined,
        coachUuid, consent: true, company, pagePath: window.location.pathname,
      });
      setDone(true);
    } catch (e) {
      const ex = e as { response?: { data?: { msg?: string } } };
      setErr(ex.response?.data?.msg || t('trial.errGeneric', 'Could not send the request. Please try again.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onClose={close} fullWidth maxWidth="sm">
      {done ? (
        <DialogContent sx={{ textAlign: 'center', py: 6 }}>
          <CheckCircleRoundedIcon color="success" sx={{ fontSize: 56 }} />
          <Typography variant="h5" sx={{ fontWeight: 800, mt: 2 }}>{t('trial.thanksTitle', 'Thank you!')}</Typography>
          <Typography color="text.secondary" sx={{ mt: 1 }}>
            {t('trial.thanksBody', 'The club will contact you within 24 hours.')}
          </Typography>
          <Button onClick={close} variant="contained" sx={{ mt: 3 }}>{t('common.close', 'Close')}</Button>
        </DialogContent>
      ) : (
        <>
          <DialogTitle>
            {coachName ? t('trial.titleCoach', { name: coachName, defaultValue: 'Book a trial with {{name}}' }) : t('trial.title', 'Book a trial lesson')}
          </DialogTitle>
          <DialogContent dividers>
            <Stack spacing={2}>
              <ToggleButtonGroup exclusive size="small" value={who} onChange={(_, v) => v && setWho(v)}>
                <ToggleButton value="self">{t('trial.self', 'For me')}</ToggleButton>
                <ToggleButton value="child">{t('trial.child', 'For my child')}</ToggleButton>
              </ToggleButtonGroup>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <TextField label={t('trial.name', 'Name')} value={name} onChange={(e) => setName(e.target.value)} fullWidth required />
                {who === 'child' && (
                  <TextField label={t('trial.childAge', "Child's age")} type="number" value={childAge} onChange={(e) => setChildAge(e.target.value)} sx={{ width: { sm: 160 } }} inputProps={{ min: 3, max: 18 }} />
                )}
              </Stack>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <TextField label={t('trial.email', 'Email')} type="email" value={email} onChange={(e) => setEmail(e.target.value)} fullWidth />
                <TextField label={t('trial.phone', 'Phone')} value={phone} onChange={(e) => setPhone(e.target.value)} fullWidth />
              </Stack>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <TextField select label={t('trial.level', 'Level')} value={level} onChange={(e) => setLevel(e.target.value)} fullWidth>
                  <MenuItem value="">{t('trial.levelAny', '—')}</MenuItem>
                  <MenuItem value="new">{t('trial.levelNew', 'New to chess')}</MenuItem>
                  <MenuItem value="rules">{t('trial.levelRules', 'Knows the rules')}</MenuItem>
                  <MenuItem value="tournaments">{t('trial.levelTourn', 'Plays tournaments')}</MenuItem>
                </TextField>
                <TextField select label={t('trial.format', 'Format')} value={format} onChange={(e) => setFormat(e.target.value)} fullWidth>
                  <MenuItem value="">{t('trial.formatAny', '—')}</MenuItem>
                  <MenuItem value="offline">{t('trial.offline', 'In person')}</MenuItem>
                  <MenuItem value="online">{t('trial.online', 'Online')}</MenuItem>
                </TextField>
              </Stack>
              <TextField label={t('trial.preferredTime', 'Preferred time (optional)')} value={preferredTime} onChange={(e) => setPreferredTime(e.target.value)} fullWidth />
              {/* honeypot — скрыто от людей */}
              <Box sx={{ position: 'absolute', left: '-9999px' }} aria-hidden>
                <input tabIndex={-1} autoComplete="off" value={company} onChange={(e) => setCompany(e.target.value)} />
              </Box>
              <FormControlLabel
                control={<Checkbox checked={consent} onChange={(e) => setConsent(e.target.checked)} />}
                label={<Typography variant="body2" color="text.secondary">{t('trial.consent', 'I agree to the processing of my personal data to be contacted by the club.')}</Typography>}
              />
              {err && <Typography variant="body2" color="error">{err}</Typography>}
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, py: 2 }}>
            <Button onClick={close} disabled={busy}>{t('common.cancel', 'Cancel')}</Button>
            <Button onClick={submit} variant="contained" disabled={busy} startIcon={busy ? <CircularProgress size={18} color="inherit" /> : undefined}>
              {busy ? t('trial.sending', 'Sending…') : t('trial.send', 'Send request')}
            </Button>
          </DialogActions>
        </>
      )}
    </Dialog>
  );
};

export default TrialRequestForm;
