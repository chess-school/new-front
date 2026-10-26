import React, { useEffect, useMemo, useState } from 'react';
import {
  Box, Button, Checkbox, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle,
  List, ListItemButton, ListItemText, TextField, Typography,
} from '@mui/material';
import { useTranslation } from 'react-i18next';

import { getStudents } from '@/api/students';
import { getCoachGroups, CoachGroup } from '@/api/digitizer';
import { Student } from '@/types/Student';
import { PuzzleBookVisibility } from '@/types/PuzzleBook';

interface AccessDialogProps {
  open: boolean;
  /** Приватный режим выбирает учеников, групповой — группы */
  mode: Extract<PuzzleBookVisibility, 'private' | 'group'>;
  selectedUsers: string[];
  selectedGroups: string[];
  onClose: () => void;
  onSave: (next: { allowedUsers: string[]; allowedGroups: string[] }) => void;
}

/** Модальное окно выбора учеников (приватный доступ) или групп (групповой) к задачнику — Module 1. */
export const AccessDialog: React.FC<AccessDialogProps> = ({ open, mode, selectedUsers, selectedGroups, onClose, onSave }) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [students, setStudents] = useState<Student[]>([]);
  const [groups, setGroups] = useState<CoachGroup[]>([]);
  const [users, setUsers] = useState<Set<string>>(new Set());
  const [grps, setGrps] = useState<Set<string>>(new Set());
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (!open) return;
    setUsers(new Set(selectedUsers));
    setGrps(new Set(selectedGroups));
    setQuery('');
    setLoading(true);
    const load = mode === 'private'
      ? getStudents({ limit: 200 }).then((page) => setStudents(page.data))
      : getCoachGroups().then(setGroups);
    load.catch(() => { /* сеть/доступ — показываем пустой список */ }).finally(() => setLoading(false));
  }, [open, mode, selectedUsers, selectedGroups]);

  const toggle = (set: Set<string>, id: string): Set<string> => {
    const next = new Set(set);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  };

  const filteredStudents = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return students;
    return students.filter((s) => `${s.firstName} ${s.lastName} ${s.email}`.toLowerCase().includes(q));
  }, [students, query]);

  const filteredGroups = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return groups;
    return groups.filter((g) => g.name.toLowerCase().includes(q));
  }, [groups, query]);

  const handleSave = () => onSave({ allowedUsers: [...users], allowedGroups: [...grps] });

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>
        {mode === 'private'
          ? t('digitizer.access.pickStudents', 'Select students with access')
          : t('digitizer.access.pickGroups', 'Select groups with access')}
      </DialogTitle>
      <DialogContent dividers sx={{ p: 0 }}>
        <Box sx={{ p: 2, pb: 1 }}>
          <TextField
            fullWidth size="small" value={query} onChange={(e) => setQuery(e.target.value)}
            placeholder={t('digitizer.access.search', 'Search…')}
          />
        </Box>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress size={28} /></Box>
        ) : mode === 'private' ? (
          filteredStudents.length === 0
            ? <Typography color="text.secondary" sx={{ px: 2, py: 3, textAlign: 'center' }}>{t('digitizer.access.noStudents', 'No students')}</Typography>
            : (
              <List dense sx={{ maxHeight: 360, overflowY: 'auto' }}>
                {filteredStudents.map((s) => (
                  <ListItemButton key={s._id} onClick={() => setUsers((prev) => toggle(prev, s._id))}>
                    <Checkbox edge="start" checked={users.has(s._id)} tabIndex={-1} disableRipple />
                    <ListItemText primary={`${s.firstName} ${s.lastName}`.trim() || s.email} secondary={s.email} />
                  </ListItemButton>
                ))}
              </List>
            )
        ) : (
          filteredGroups.length === 0
            ? <Typography color="text.secondary" sx={{ px: 2, py: 3, textAlign: 'center' }}>{t('digitizer.access.noGroups', 'No groups')}</Typography>
            : (
              <List dense sx={{ maxHeight: 360, overflowY: 'auto' }}>
                {filteredGroups.map((g) => (
                  <ListItemButton key={g._id} onClick={() => setGrps((prev) => toggle(prev, g._id))}>
                    <Checkbox edge="start" checked={grps.has(g._id)} tabIndex={-1} disableRipple />
                    <ListItemText primary={g.name} secondary={g.membersCount != null ? t('digitizer.access.members', { count: g.membersCount, defaultValue: '{{count}} members' }) : undefined} />
                  </ListItemButton>
                ))}
              </List>
            )
        )}
      </DialogContent>
      <DialogActions>
        <Button color="inherit" onClick={onClose}>{t('common.cancel', 'Cancel')}</Button>
        <Button variant="contained" onClick={handleSave}>{t('common.save', 'Save')}</Button>
      </DialogActions>
    </Dialog>
  );
};
