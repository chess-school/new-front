import { useEffect, useMemo, useState } from 'react';
import {
  Avatar, Box, Button, Chip, CircularProgress, MenuItem, Paper, Select, Stack, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, TextField, Typography,
} from '@mui/material';
import PersonAddAlt1RoundedIcon from '@mui/icons-material/PersonAddAlt1Rounded';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import { useTranslation } from 'react-i18next';
import { message } from '@/shared/toast/compat';
import { useAuth } from '@/context/AuthContext';
import { useClubStore } from '@/features/clubs/clubStore';
import { PageContainer } from '@/shared/components/ui/PageHeader';
import { SEOHead } from '@/shared/components/seo/SEOHead';
import {
  fetchClubMembers, changeMemberRole, inviteMember, removeMember, type ClubMember, type ClubRole,
} from '@/features/clubs/clubsApi';
import {
  ASSIGNABLE_ROLES, ROLE_LABEL, can, canAssignRole, canManageMember,
} from '@/features/clubs/permissions';

const roleColor = (r: ClubRole): 'default' | 'primary' | 'info' | 'success' | 'warning' =>
  r === 'owner' ? 'primary' : r === 'admin' ? 'info' : r === 'manager' ? 'warning' : r === 'trainer' ? 'success' : 'default';

/** Кабинет «Участники и роли»: список членов клуба, смена роли, приглашение, удаление. */
export default function MembersPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const clubs = useClubStore((s) => s.clubs);
  const activeClubId = useClubStore((s) => s.activeClubId);
  const actorRole: ClubRole | null = useMemo(
    () => clubs.find((c) => c.club._id === activeClubId)?.role ?? null,
    [clubs, activeClubId],
  );

  const [members, setMembers] = useState<ClubMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<ClubRole>('student');
  const [inviting, setInviting] = useState(false);

  const roleLabel = (r: ClubRole) => t(`members.role.${r}`, ROLE_LABEL[r]);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    fetchClubMembers()
      .then((d) => { if (alive) setMembers(d); })
      .catch(() => { /* интерцептор покажет ошибку */ })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, []);

  const onChangeRole = async (m: ClubMember, role: ClubRole) => {
    const prev = m.role;
    setMembers((list) => list.map((x) => (x.userId === m.userId ? { ...x, role } : x)));
    try {
      await changeMemberRole(m.userId, role);
      message.success(t('members.roleUpdated', 'Role updated'));
    } catch {
      setMembers((list) => list.map((x) => (x.userId === m.userId ? { ...x, role: prev } : x)));
    }
  };

  const onRemove = async (m: ClubMember) => {
    const name = m.user ? `${m.user.firstName} ${m.user.lastName}` : m.userId;
    if (!window.confirm(t('members.confirmRemove', 'Remove {{name}} from the club?', { name }))) return;
    const prev = members;
    setMembers((list) => list.filter((x) => x.userId !== m.userId));
    try {
      await removeMember(m.userId);
    } catch {
      setMembers(prev);
    }
  };

  const onInvite = async () => {
    if (!inviteEmail.trim()) return;
    setInviting(true);
    try {
      await inviteMember(inviteEmail.trim(), inviteRole);
      setInviteEmail('');
      message.success(t('members.invited', 'Member added'));
      const fresh = await fetchClubMembers();
      setMembers(fresh);
    } catch {
      /* интерцептор покажет ошибку (нет пользователя с таким email / уже участник) */
    } finally {
      setInviting(false);
    }
  };

  const isSelf = (m: ClubMember) => !!user && !!m.user && m.user.uuid === user.uuid;
  const canInvite = can(actorRole, 'manageMembers');
  // Роли, которые актёр вправе назначить (для select'ов).
  const assignable = ASSIGNABLE_ROLES.filter((r) => canAssignRole(actorRole, r));

  return (
    <PageContainer maxWidth={980}>
      <SEOHead title={t('members.title', 'Members & roles')} description="" noindex />
      <Typography variant="h4" component="h1" sx={{ mb: 0.5 }}>{t('members.title', 'Members & roles')}</Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        {t('members.subtitle', 'Manage who is in your club and what they can do.')}
      </Typography>

      {canInvite && (
        <Paper sx={{ p: 2, mb: 3, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ sm: 'center' }}>
            <TextField
              size="small" type="email" label={t('members.inviteEmail', 'Email of an existing user')}
              value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)}
              sx={{ flex: 1 }} fullWidth
            />
            <Select size="small" value={inviteRole} onChange={(e) => setInviteRole(e.target.value as ClubRole)} sx={{ minWidth: 150 }}>
              {assignable.map((r) => <MenuItem key={r} value={r}>{roleLabel(r)}</MenuItem>)}
            </Select>
            <Button
              variant="contained" startIcon={<PersonAddAlt1RoundedIcon />}
              onClick={onInvite} disabled={inviting || !inviteEmail.trim()}
            >
              {t('members.invite', 'Add member')}
            </Button>
          </Stack>
        </Paper>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box>
      ) : (
        <TableContainer component={Paper} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>{t('members.colMember', 'Member')}</TableCell>
                <TableCell>{t('members.colRole', 'Role')}</TableCell>
                <TableCell>{t('members.colStatus', 'Status')}</TableCell>
                <TableCell align="right" />
              </TableRow>
            </TableHead>
            <TableBody>
              {members.map((m) => {
                const editable = !isSelf(m) && canManageMember(actorRole, m.role);
                return (
                  <TableRow key={m.userId} hover>
                    <TableCell>
                      <Stack direction="row" spacing={1.5} alignItems="center">
                        <Avatar src={m.user?.avatarUrl} sx={{ width: 36, height: 36 }}>
                          {m.user?.firstName?.[0] ?? '?'}
                        </Avatar>
                        <Box>
                          <Typography sx={{ fontWeight: 600, lineHeight: 1.2 }}>
                            {m.user ? `${m.user.firstName} ${m.user.lastName}` : m.userId}
                            {isSelf(m) && <Typography component="span" color="text.secondary"> · {t('members.you', 'you')}</Typography>}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">{m.user?.email}</Typography>
                        </Box>
                      </Stack>
                    </TableCell>
                    <TableCell>
                      {editable ? (
                        <Select
                          size="small" value={m.role}
                          onChange={(e) => onChangeRole(m, e.target.value as ClubRole)}
                          sx={{ minWidth: 140 }}
                        >
                          {/* текущая роль + те, что актёр вправе назначить */}
                          {[...new Set([m.role, ...assignable])].map((r) => (
                            <MenuItem key={r} value={r}>{roleLabel(r)}</MenuItem>
                          ))}
                        </Select>
                      ) : (
                        <Chip size="small" color={roleColor(m.role)} label={roleLabel(m.role)} />
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="small" variant="outlined"
                        color={m.status === 'active' ? 'success' : 'default'}
                        label={t(`members.status.${m.status}`, m.status)}
                      />
                    </TableCell>
                    <TableCell align="right">
                      {editable && (
                        <Button
                          size="small" color="error" startIcon={<DeleteOutlineRoundedIcon />}
                          onClick={() => onRemove(m)}
                        >
                          {t('members.remove', 'Remove')}
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </PageContainer>
  );
}
