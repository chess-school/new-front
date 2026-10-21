import React, { useState } from 'react';
import {
  Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Divider,
  IconButton, LinearProgress, ListItemText, Menu, MenuItem, TextField, Tooltip, Typography,
} from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import PaidIcon from '@mui/icons-material/Paid';
import { notification } from 'antd';
import { useTranslation } from 'react-i18next';

import { deleteEnrollment, updateEnrollment, CoachGroup } from '@/api/students';
import { Enrollment, EnrollmentStatus, STATUS_TRANSITIONS } from '@/types/Student';

const STATUS_COLORS: Record<EnrollmentStatus, 'default' | 'success' | 'warning' | 'info' | 'error'> = {
  pending_payment: 'warning',
  pending_approval: 'info',
  active: 'success',
  completed: 'default',
  cancelled: 'error',
  refunded: 'error',
};

interface EnrollmentRowProps {
  studentUuid: string;
  enrollment: Enrollment;
  groups: CoachGroup[];
  isAdmin: boolean;
  onChanged: () => void;
}

/** Одна запись студента на курс: статус, группа, прогресс, оплата и меню действий */
export const EnrollmentRow: React.FC<EnrollmentRowProps> = ({ studentUuid, enrollment, groups, isAdmin, onChanged }) => {
  const { t } = useTranslation();
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
  const [dialog, setDialog] = useState<'group' | 'delete' | null>(null);
  const [groupId, setGroupId] = useState(enrollment.group?._id ?? '');
  const [busy, setBusy] = useState(false);

  // refunded — деньги, его выставляет только администратор (бэкенд тоже проверяет)
  const transitions = STATUS_TRANSITIONS[enrollment.status].filter((s) => s !== 'refunded' || isAdmin);

  const run = async (action: () => Promise<unknown>, successKey: string) => {
    setBusy(true);
    try {
      await action();
      notification.success({ message: t(successKey), description: undefined });
      setDialog(null);
      onChanged();
    } catch {
      // ошибку (например, 409 «есть оплата») уже показал перехватчик axios
    } finally {
      setBusy(false);
    }
  };

  const changeStatus = (status: EnrollmentStatus) => {
    setMenuAnchor(null);
    run(() => updateEnrollment(studentUuid, enrollment._id, { status }), 'studentsPage.enrollment.updated');
  };

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 0.5, flexWrap: 'wrap' }}>
      <Typography variant="body2" fontWeight="bold" sx={{ minWidth: 140 }}>
        {enrollment.course.title ?? '—'}
      </Typography>
      <Chip size="small" color={STATUS_COLORS[enrollment.status]} label={t(`studentsPage.enrollmentStatus.${enrollment.status}`)} />
      {enrollment.group?.name && <Chip size="small" variant="outlined" label={enrollment.group.name} />}
      {enrollment.payment.paid && (
        <Tooltip title={t('studentsPage.paid')}>
          <PaidIcon fontSize="small" color="success" />
        </Tooltip>
      )}
      <Tooltip title={t('studentsPage.progress')}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, width: 90 }}>
          <LinearProgress variant="determinate" value={enrollment.progress.percentage} sx={{ flex: 1, height: 6, borderRadius: 3 }} />
          <Typography variant="caption">{enrollment.progress.percentage}%</Typography>
        </Box>
      </Tooltip>
      <IconButton size="small" onClick={(e) => setMenuAnchor(e.currentTarget)} disabled={busy} aria-label={t('studentsPage.actions')}>
        <MoreVertIcon fontSize="small" />
      </IconButton>

      <Menu anchorEl={menuAnchor} open={!!menuAnchor} onClose={() => setMenuAnchor(null)}>
        {transitions.map((status) => (
          <MenuItem key={status} onClick={() => changeStatus(status)}>
            <ListItemText>{t('studentsPage.enrollment.changeStatusTo', { status: t(`studentsPage.enrollmentStatus.${status}`) })}</ListItemText>
          </MenuItem>
        ))}
        {transitions.length > 0 && <Divider />}
        <MenuItem onClick={() => { setMenuAnchor(null); setGroupId(enrollment.group?._id ?? ''); setDialog('group'); }}>
          {t('studentsPage.enrollment.changeGroup')}
        </MenuItem>
        <MenuItem onClick={() => { setMenuAnchor(null); setDialog('delete'); }} sx={{ color: 'error.main' }}>
          {t('studentsPage.enrollment.remove')}
        </MenuItem>
      </Menu>

      <Dialog open={dialog === 'group'} onClose={() => setDialog(null)} fullWidth maxWidth="xs">
        <DialogTitle>{t('studentsPage.enrollment.changeGroup')}</DialogTitle>
        <DialogContent>
          <TextField select fullWidth sx={{ mt: 1 }} label={t('studentsPage.group')} value={groupId} onChange={(e) => setGroupId(e.target.value)}>
            <MenuItem value="">{t('studentsPage.noGroup')}</MenuItem>
            {groups.filter((g) => g.status === 'active').map((g) => <MenuItem key={g._id} value={g._id}>{g.name}</MenuItem>)}
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialog(null)}>{t('common.close')}</Button>
          <Button
            variant="contained"
            disabled={busy || groupId === (enrollment.group?._id ?? '')}
            onClick={() => run(() => updateEnrollment(studentUuid, enrollment._id, { groupId: groupId || null }), 'studentsPage.enrollment.updated')}
          >
            {t('common.save')}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={dialog === 'delete'} onClose={() => setDialog(null)} fullWidth maxWidth="xs">
        <DialogTitle>{t('studentsPage.enrollment.removeTitle')}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {t('studentsPage.enrollment.removeText', { course: enrollment.course.title ?? '' })}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialog(null)}>{t('common.close')}</Button>
          <Button
            color="error"
            variant="contained"
            disabled={busy}
            onClick={() => run(() => deleteEnrollment(studentUuid, enrollment._id), 'studentsPage.enrollment.removed')}
          >
            {t('common.delete')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
