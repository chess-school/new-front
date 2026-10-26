import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Divider, IconButton,
  MenuItem, Stack, TextField, ToggleButton, ToggleButtonGroup, Typography,
} from '@mui/material';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { useTranslation } from 'react-i18next';
import { notification } from 'antd';
import { getMyGroups, getStudents, CoachGroup } from '@/api/students';
import { getPuzzleBooks } from '@/api/digitizer';
import { createPuzzleAssignment } from '@/api/homework';
import { Student } from '@/types/Student';
import { PuzzleBookSummary } from '@/types/PuzzleBook';
import { HomeworkPlanItem } from '@/types/Homework';

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated?: () => void;
}

type Target = 'group' | 'student';
type PlanRow = { date: string; puzzleCount: string; note: string };

/**
 * Тренер выдаёт домашку «решать задачи из задачника»: кому (ученик/группа), какой задачник,
 * срок и/или план по дням («сегодня N, завтра M, читать …»). Адресаты получают уведомление.
 */
export const AssignPuzzlesDialog: React.FC<Props> = ({ open, onClose, onCreated }) => {
  const { t } = useTranslation();
  const [target, setTarget] = useState<Target>('student');
  const [groups, setGroups] = useState<CoachGroup[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [books, setBooks] = useState<PuzzleBookSummary[]>([]);
  const [contextId, setContextId] = useState('');
  const [bookId, setBookId] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [target_, setTargetCount] = useState('');
  const [plan, setPlan] = useState<PlanRow[]>([]);
  const [errors, setErrors] = useState<{ contextId?: string; bookId?: string }>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    getMyGroups().then((g) => setGroups(g.filter((x) => x.status === 'active'))).catch(() => setGroups([]));
    getStudents({ page: 1, limit: 100 }).then((r) => setStudents(r.data)).catch(() => setStudents([]));
    getPuzzleBooks().then(setBooks).catch(() => setBooks([]));
    setTarget('student'); setContextId(''); setBookId(''); setDueDate(''); setTargetCount(''); setPlan([]); setErrors({});
  }, [open]);

  const options = useMemo(
    () => (target === 'group'
      ? groups.map((g) => ({ id: g._id, label: g.name }))
      : students.map((s) => ({ id: s._id, label: `${s.firstName} ${s.lastName}`.trim() || s.email }))),
    [target, groups, students],
  );

  const addDay = () => setPlan((p) => [...p, { date: '', puzzleCount: '', note: '' }]);
  const setRow = (i: number, patch: Partial<PlanRow>) => setPlan((p) => p.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  const removeRow = (i: number) => setPlan((p) => p.filter((_, idx) => idx !== i));

  const handleSubmit = async () => {
    const next: typeof errors = {};
    if (!contextId) next.contextId = t('assignPuzzles.errSelect', { defaultValue: 'Choose a recipient' });
    if (!bookId) next.bookId = t('assignPuzzles.errBook', { defaultValue: 'Choose a puzzle set' });
    setErrors(next);
    if (Object.keys(next).length) return;

    const planItems: HomeworkPlanItem[] = plan
      .filter((r) => r.date)
      .map((r) => ({ date: new Date(r.date).toISOString(), puzzleCount: Math.max(0, Number(r.puzzleCount) || 0), note: r.note.trim() }));

    setSaving(true);
    try {
      await createPuzzleAssignment({
        contextType: target,
        contextRefId: contextId,
        puzzleBookId: bookId,
        puzzleTarget: target_ ? Math.max(0, Number(target_) || 0) : undefined,
        dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
        plan: planItems.length ? planItems : undefined,
      });
      notification.success({ message: t('assignPuzzles.created', { defaultValue: 'Homework assigned' }) });
      onCreated?.();
      onClose();
    } catch {
      // ошибку покажет перехватчик axios
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{t('assignPuzzles.title', { defaultValue: 'Assign puzzles' })}</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2.5} sx={{ pt: 0.5 }}>
          <ToggleButtonGroup exclusive fullWidth size="small" value={target}
            onChange={(_, v: Target | null) => { if (v) { setTarget(v); setContextId(''); } }}>
            <ToggleButton value="student">{t('assignPuzzles.targetStudent', { defaultValue: 'Student' })}</ToggleButton>
            <ToggleButton value="group">{t('assignPuzzles.targetGroup', { defaultValue: 'Group' })}</ToggleButton>
          </ToggleButtonGroup>

          <TextField select label={t('assignPuzzles.recipient', { defaultValue: 'Recipient' })} value={contextId}
            onChange={(e) => setContextId(e.target.value)} error={!!errors.contextId} helperText={errors.contextId} fullWidth>
            {options.map((o) => <MenuItem key={o.id} value={o.id}>{o.label}</MenuItem>)}
          </TextField>

          <TextField select label={t('assignPuzzles.book', { defaultValue: 'Puzzle set' })} value={bookId}
            onChange={(e) => setBookId(e.target.value)} error={!!errors.bookId} helperText={errors.bookId} fullWidth>
            {books.map((b) => <MenuItem key={b._id} value={b._id}>{b.title}</MenuItem>)}
          </TextField>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField label={t('assignPuzzles.dueDate', { defaultValue: 'Due date' })} type="date" value={dueDate}
              onChange={(e) => setDueDate(e.target.value)} fullWidth InputLabelProps={{ shrink: true }} />
            <TextField label={t('assignPuzzles.count', { defaultValue: 'Puzzles to solve' })} type="number" value={target_}
              onChange={(e) => setTargetCount(e.target.value)} sx={{ width: { sm: 200 } }} inputProps={{ min: 0 }} />
          </Stack>

          <Divider />
          <Box>
            <Stack direction="row" alignItems="center" justifyContent="space-between">
              <Typography variant="subtitle2">{t('assignPuzzles.plan', { defaultValue: 'Day-by-day plan (optional)' })}</Typography>
              <Button size="small" startIcon={<AddRoundedIcon />} onClick={addDay}>{t('assignPuzzles.addDay', { defaultValue: 'Add day' })}</Button>
            </Stack>
            <Typography variant="caption" color="text.secondary">
              {t('assignPuzzles.planHint', { defaultValue: 'E.g. today 10 puzzles, tomorrow 15 — the student sees “today: N”.' })}
            </Typography>
            <Stack spacing={1.25} sx={{ mt: 1 }}>
              {plan.map((r, i) => (
                <Stack key={i} direction="row" spacing={1} alignItems="center">
                  <TextField type="date" size="small" value={r.date} onChange={(e) => setRow(i, { date: e.target.value })} InputLabelProps={{ shrink: true }} sx={{ width: 160 }} />
                  <TextField type="number" size="small" label="№" value={r.puzzleCount} onChange={(e) => setRow(i, { puzzleCount: e.target.value })} inputProps={{ min: 0 }} sx={{ width: 80 }} />
                  <TextField size="small" placeholder={t('assignPuzzles.note', { defaultValue: 'note (read / do)' })} value={r.note} onChange={(e) => setRow(i, { note: e.target.value })} fullWidth />
                  <IconButton size="small" onClick={() => removeRow(i)} aria-label="remove"><DeleteOutlineIcon fontSize="small" /></IconButton>
                </Stack>
              ))}
            </Stack>
          </Box>

          <Alert severity="info">{t('assignPuzzles.notifyInfo', { defaultValue: 'The recipient gets a notification with a link to start solving.' })}</Alert>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving}>{t('common.cancel', { defaultValue: 'Cancel' })}</Button>
        <Button variant="contained" onClick={handleSubmit} disabled={saving}>
          {saving ? t('assignPuzzles.saving', { defaultValue: 'Assigning…' }) : t('assignPuzzles.submit', { defaultValue: 'Assign' })}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AssignPuzzlesDialog;
