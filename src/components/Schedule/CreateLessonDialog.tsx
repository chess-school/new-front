import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert, Box, Button, Checkbox, Dialog, DialogActions, DialogContent, DialogTitle, Divider, FormControlLabel,
  MenuItem, Stack, Switch, TextField, ToggleButton, ToggleButtonGroup, Typography,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { notification } from 'antd';
import { createLesson } from '@/api/lessons';
import { getMyGroups, getStudents, CoachGroup } from '@/api/students';
import { Student } from '@/types/Student';

interface CreateLessonDialogProps {
  open: boolean;
  onClose: () => void;
  /** Вызывается после успешного создания (обновить расписание) */
  onCreated?: () => void;
  /** Предвыбор группы (например, при открытии со страницы класса) */
  defaultGroupId?: string;
}

type Target = 'group' | 'individual';

const DEFAULT_DURATION = 60;

/**
 * Создание занятия тренером: групповое (для учебной группы) или индивидуальное (для ученика),
 * с возможностью оповестить адресатов по почте (от лица тренера) и уведомлением на сайте.
 */
export const CreateLessonDialog: React.FC<CreateLessonDialogProps> = ({ open, onClose, onCreated, defaultGroupId }) => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [target, setTarget] = useState<Target>('group');
  const [groups, setGroups] = useState<CoachGroup[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [contextId, setContextId] = useState('');

  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(String(DEFAULT_DURATION));
  const [link, setLink] = useState('');
  const [description, setDescription] = useState('');
  const [notify, setNotify] = useState(true);
  const [message, setMessage] = useState('');
  const [personalize, setPersonalize] = useState(false);
  const [personalMessages, setPersonalMessages] = useState<Record<string, string>>({});

  const [errors, setErrors] = useState<{ title?: string; date?: string; contextId?: string; duration?: string; link?: string }>({});
  const [saving, setSaving] = useState(false);

  // Справочники — при открытии
  useEffect(() => {
    if (!open) return;
    getMyGroups().then((g) => setGroups(g.filter((x) => x.status === 'active'))).catch(() => setGroups([]));
    getStudents({ page: 1, limit: 100 }).then((r) => setStudents(r.data)).catch(() => setStudents([]));
  }, [open]);

  // Сброс формы при открытии
  useEffect(() => {
    if (!open) return;
    setTarget(defaultGroupId ? 'group' : 'individual');
    setContextId(defaultGroupId || '');
    setTitle(''); setDate(''); setDurationMinutes(String(DEFAULT_DURATION));
    setLink(''); setDescription(''); setNotify(true); setMessage('');
    setPersonalize(false); setPersonalMessages({});
    setErrors({});
  }, [open, defaultGroupId]);

  const options = useMemo(
    () => (target === 'group'
      ? groups.map((g) => ({ id: g._id, label: g.name }))
      : students.map((s) => ({ id: s._id, label: `${s.firstName} ${s.lastName}`.trim() || s.email }))),
    [target, groups, students],
  );

  // Адресаты выбранного контекста — для персональных сообщений: участники группы / выбранный ученик
  const recipients = useMemo(() => {
    if (!contextId) return [] as { id: string; name: string }[];
    if (target === 'group') {
      const g = groups.find((x) => x._id === contextId);
      return (g?.members || []).map((m) => ({ id: m._id, name: `${m.firstName} ${m.lastName}`.trim() || t('createLesson.student') }));
    }
    const s = students.find((x) => x._id === contextId);
    return s ? [{ id: s._id, name: `${s.firstName} ${s.lastName}`.trim() || s.email }] : [];
  }, [target, contextId, groups, students, t]);

  // Смена группы/ученика — сбрасываем набранные персональные тексты (они привязаны к другим людям)
  useEffect(() => { setPersonalMessages({}); }, [contextId, target]);

  const validate = () => {
    const next: typeof errors = {};
    if (!title.trim()) next.title = t('createLesson.errors.title');
    if (!date) next.date = t('createLesson.errors.date');
    if (!contextId) next.contextId = target === 'group' ? t('createLesson.errors.selectGroup') : t('createLesson.errors.selectStudent');
    const dur = Number(durationMinutes);
    if (!Number.isInteger(dur) || dur < 5 || dur > 600) next.duration = t('createLesson.errors.duration');
    if (link.trim() && !/^https?:\/\/\S+$/i.test(link.trim())) next.link = t('createLesson.errors.link');
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    // Персональные сообщения — только непустые и только по текущим адресатам
    const personal = notify && personalize
      ? Object.fromEntries(
        recipients
          .map((r) => [r.id, (personalMessages[r.id] || '').trim()] as const)
          .filter(([, v]) => v.length > 0),
      )
      : undefined;

    setSaving(true);
    try {
      const res = await createLesson({
        eventType: target,
        contextId,
        title: title.trim(),
        description: description.trim() || undefined,
        date: new Date(date).toISOString(),
        durationMinutes: Number(durationMinutes),
        link: link.trim() || undefined,
        notify,
        message: notify && message.trim() ? message.trim() : undefined,
        personalMessages: personal && Object.keys(personal).length ? personal : undefined,
      });
      const n = res.notified;
      notification.success({
        message: t('createLesson.created'),
        description: notify && n
          ? t('createLesson.notified', { count: n.total - n.failed })
            + (n.failed ? ` ${t('createLesson.notifiedFailed', { count: n.failed })}` : '')
          : undefined,
      });
      onCreated?.();
      onClose();
    } catch {
      // сообщение об ошибке уже показал перехватчик axios
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{t('createLesson.title')}</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2.5} sx={{ pt: 0.5 }}>
          <ToggleButtonGroup
            exclusive
            fullWidth
            size="small"
            value={target}
            onChange={(_, v: Target | null) => { if (v) { setTarget(v); setContextId(''); } }}
          >
            <ToggleButton value="group">{t('createLesson.targetGroup')}</ToggleButton>
            <ToggleButton value="individual">{t('createLesson.targetStudent')}</ToggleButton>
          </ToggleButtonGroup>

          <TextField
            select
            label={target === 'group' ? t('createLesson.labelGroup') : t('createLesson.labelStudent')}
            value={contextId}
            onChange={(e) => setContextId(e.target.value)}
            error={!!errors.contextId}
            helperText={errors.contextId || (options.length === 0 ? (target === 'group' ? t('createLesson.noActiveGroups') : t('createLesson.noStudents')) : '')}
            fullWidth
          >
            {options.map((o) => <MenuItem key={o.id} value={o.id}>{o.label}</MenuItem>)}
          </TextField>

          {target === 'group' && options.length === 0 && (
            <Button size="small" onClick={() => { onClose(); navigate('/groups'); }} sx={{ alignSelf: 'flex-start', mt: -1.5 }}>
              {t('createLesson.createGroupLink')}
            </Button>
          )}

          <TextField label={t('createLesson.lessonTitle')} value={title} onChange={(e) => setTitle(e.target.value)} error={!!errors.title} helperText={errors.title} fullWidth inputProps={{ maxLength: 200 }} />

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField
              label={t('createLesson.dateTime')} type="datetime-local" value={date} onChange={(e) => setDate(e.target.value)}
              error={!!errors.date} helperText={errors.date} fullWidth InputLabelProps={{ shrink: true }}
            />
            <TextField
              label={t('createLesson.duration')} type="number" value={durationMinutes} onChange={(e) => setDurationMinutes(e.target.value)}
              error={!!errors.duration} helperText={errors.duration} sx={{ width: { sm: 200 } }} inputProps={{ min: 5, max: 600 }}
            />
          </Stack>

          <TextField label={t('createLesson.link')} value={link} onChange={(e) => setLink(e.target.value)} error={!!errors.link} helperText={errors.link || t('createLesson.linkHelp')} fullWidth />

          <TextField label={t('createLesson.description')} value={description} onChange={(e) => setDescription(e.target.value)} fullWidth multiline minRows={2} />

          <Box>
            <FormControlLabel
              control={<Checkbox checked={notify} onChange={(e) => setNotify(e.target.checked)} />}
              label={t('createLesson.notify')}
            />
            {notify && (
              <>
                <TextField
                  label={t('createLesson.commonMessage')} value={message} onChange={(e) => setMessage(e.target.value)}
                  fullWidth multiline minRows={2} inputProps={{ maxLength: 2000 }} sx={{ mt: 1 }}
                  placeholder={t('createLesson.commonMessagePlaceholder')}
                />

                {target === 'group' && (
                  <FormControlLabel
                    sx={{ mt: 0.5 }}
                    control={<Switch checked={personalize} onChange={(e) => setPersonalize(e.target.checked)} />}
                    label={t('createLesson.personalize')}
                  />
                )}
                {personalize && target === 'group' && (
                  <Box sx={{ mt: 0.5 }}>
                    {recipients.length === 0 ? (
                      <Typography variant="body2" color="text.secondary">
                        {t('createLesson.groupEmpty')}
                      </Typography>
                    ) : (
                      <Stack spacing={1.5} divider={<Divider flexItem />}>
                        {recipients.map((r) => (
                          <TextField
                            key={r.id}
                            label={r.name}
                            value={personalMessages[r.id] || ''}
                            onChange={(e) => setPersonalMessages((prev) => ({ ...prev, [r.id]: e.target.value }))}
                            fullWidth multiline minRows={1} inputProps={{ maxLength: 2000 }}
                            placeholder={t('createLesson.personalMessagePlaceholder')}
                          />
                        ))}
                      </Stack>
                    )}
                  </Box>
                )}

                <Alert severity="info" sx={{ mt: 1 }}>
                  {t('createLesson.notifyInfo')}
                  {personalize ? ` ${t('createLesson.notifyInfoPersonal')}` : ''}
                </Alert>
              </>
            )}
          </Box>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving}>{t('createLesson.cancel')}</Button>
        <Button variant="contained" onClick={handleSubmit} disabled={saving}>
          {saving ? t('createLesson.creating') : t('createLesson.submit')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CreateLessonDialog;
