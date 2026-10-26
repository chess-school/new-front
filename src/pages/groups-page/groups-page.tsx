import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Autocomplete, Box, Button, Chip, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle,
  Grid, Paper, Stack, TextField, Typography,
} from '@mui/material';
import GroupAddRoundedIcon from '@mui/icons-material/GroupAddRounded';
import VideoCameraFrontIcon from '@mui/icons-material/VideoCameraFront';
import PersonAddAlt1RoundedIcon from '@mui/icons-material/PersonAddAlt1Rounded';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { notification } from 'antd';
import {
  addGroupMember, createGroup, getMyGroups, getStudents, removeGroupMember, CoachGroup, GroupMember,
} from '@/api/students';
import { Student } from '@/types/Student';
import { errorCode } from '@/features/Classroom/classroomApi';
import { PageContainer, PageHeader } from '@/shared/components/ui/PageHeader';

/**
 * Управление учебными группами: создать группу, добавить/убрать учеников. Участники группы
 * (`Group.members`) — это то, что видят групповые занятия и интерактивный класс, поэтому здесь
 * собирается состав, для которого потом создаются уроки (см. «Создать занятие») и класс.
 */
export const GroupsPage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const ADD_ERRORS: Record<string, string> = {
    NOT_YOUR_STUDENT: t('groupsPage.addErrors.notYourStudent'),
    ALREADY_MEMBER: t('groupsPage.addErrors.alreadyMember'),
    GROUP_ARCHIVED: t('groupsPage.addErrors.groupArchived'),
    STUDENT_NOT_FOUND: t('groupsPage.addErrors.studentNotFound'),
  };
  const [groups, setGroups] = useState<CoachGroup[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [busyGroup, setBusyGroup] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [g, s] = await Promise.all([
        getMyGroups(),
        getStudents({ page: 1, limit: 100 }).then((r) => r.data).catch(() => [] as Student[]),
      ]);
      setGroups(g);
      setStudents(s);
    } catch {
      notification.error({ message: t('groupsPage.loadError'), description: undefined });
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => { void load(); }, [load]);

  const activeGroups = useMemo(() => groups.filter((g) => g.status === 'active'), [groups]);

  const handleCreate = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      await createGroup({ name: name.trim(), description: description.trim() || undefined });
      notification.success({ message: t('groupsPage.created'), description: undefined });
      setCreateOpen(false); setName(''); setDescription('');
      await load();
    } catch (e) {
      if (errorCode(e) === 'COACH_PROFILE_REQUIRED') {
        notification.warning({
          message: t('groupsPage.coachProfileRequired.title'),
          description: t('groupsPage.coachProfileRequired.description'),
        });
        setCreateOpen(false);
        navigate('/coaches');
      } else {
        notification.error({ message: t('groupsPage.createError'), description: undefined });
      }
    } finally {
      setSaving(false);
    }
  };

  const handleAdd = async (groupId: string, student: Student | null) => {
    if (!student) return;
    setBusyGroup(groupId);
    try {
      await addGroupMember(groupId, student.uuid);
      notification.success({ message: t('groupsPage.memberAdded', { name: `${student.firstName} ${student.lastName}`.trim() }), description: undefined });
      await load();
    } catch (e) {
      const code = errorCode(e) ?? '';
      notification.error({ message: t('groupsPage.addFailed'), description: ADD_ERRORS[code] || t('groupsPage.tryLater') });
    } finally {
      setBusyGroup(null);
    }
  };

  const handleRemove = async (groupId: string, member: GroupMember) => {
    if (!member.uuid) return;
    setBusyGroup(groupId);
    try {
      await removeGroupMember(groupId, member.uuid);
      await load();
    } catch {
      notification.error({ message: t('groupsPage.removeFailed'), description: undefined });
    } finally {
      setBusyGroup(null);
    }
  };

  if (loading) {
    return <Box sx={{ display: 'grid', placeItems: 'center', minHeight: '50vh' }}><CircularProgress /></Box>;
  }

  return (
    <PageContainer>
      <PageHeader
        eyebrow={t('groupsPage.eyebrow')}
        title={t('groupsPage.title')}
        subtitle={t('groupsPage.subtitle')}
        actions={(
          <Button variant="contained" startIcon={<GroupAddRoundedIcon />} onClick={() => setCreateOpen(true)}>
            {t('groupsPage.createGroup')}
          </Button>
        )}
      />

      {activeGroups.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography color="text.secondary" gutterBottom>{t('groupsPage.emptyGroups')}</Typography>
          <Button variant="outlined" startIcon={<GroupAddRoundedIcon />} onClick={() => setCreateOpen(true)} sx={{ mt: 1 }}>
            {t('groupsPage.createFirstGroup')}
          </Button>
        </Paper>
      ) : (
        <Grid container spacing={2}>
          {activeGroups.map((group) => {
            const members = group.members || [];
            const memberIds = new Set(members.map((m) => m._id));
            const available = students.filter((s) => !memberIds.has(s._id));
            return (
              <Grid item xs={12} md={6} key={group._id}>
                <Paper sx={{ p: 2.5, height: '100%', display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1}>
                    <Typography variant="h6" noWrap>{group.name}</Typography>
                    <Chip size="small" label={t('groupsPage.memberCount', { count: members.length })} />
                  </Stack>

                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, minHeight: 32 }}>
                    {members.length === 0 ? (
                      <Typography variant="body2" color="text.secondary">{t('groupsPage.noMembers')}</Typography>
                    ) : members.map((m) => (
                      <Chip
                        key={m._id}
                        label={`${m.firstName} ${m.lastName}`.trim() || t('groupsPage.student')}
                        onDelete={() => handleRemove(group._id, m)}
                        disabled={busyGroup === group._id}
                      />
                    ))}
                  </Box>

                  <Autocomplete
                    size="small"
                    options={available}
                    getOptionLabel={(o) => `${o.firstName} ${o.lastName}`.trim() || o.email}
                    disabled={busyGroup === group._id}
                    value={null}
                    blurOnSelect
                    onChange={(_, v) => handleAdd(group._id, v)}
                    renderInput={(params) => (
                      <TextField {...params} label={t('groupsPage.addMember')} placeholder={t('groupsPage.addMemberPlaceholder')}
                        InputProps={{ ...params.InputProps, startAdornment: <PersonAddAlt1RoundedIcon fontSize="small" sx={{ ml: 0.5, mr: 0.5, color: 'text.secondary' }} /> }} />
                    )}
                    noOptionsText={t('groupsPage.noAvailableStudents')}
                  />

                  <Box sx={{ flex: 1 }} />
                  <Button
                    variant="outlined" color="success" startIcon={<VideoCameraFrontIcon />}
                    onClick={() => navigate(`/classroom/group/${group._id}`)}
                  >
                    {t('groupsPage.enterClassroom')}
                  </Button>
                </Paper>
              </Grid>
            );
          })}
        </Grid>
      )}

      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>{t('groupsPage.createGroup')}</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ pt: 0.5 }}>
            <TextField label={t('groupsPage.groupName')} value={name} onChange={(e) => setName(e.target.value)} fullWidth autoFocus inputProps={{ maxLength: 100 }} />
            <TextField label={t('groupsPage.groupDescription')} value={description} onChange={(e) => setDescription(e.target.value)} fullWidth multiline minRows={2} inputProps={{ maxLength: 2000 }} />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateOpen(false)} disabled={saving}>{t('groupsPage.cancel')}</Button>
          <Button variant="contained" onClick={handleCreate} disabled={saving || !name.trim()}>{saving ? t('groupsPage.creating') : t('groupsPage.create')}</Button>
        </DialogActions>
      </Dialog>
    </PageContainer>
  );
};

export default GroupsPage;
