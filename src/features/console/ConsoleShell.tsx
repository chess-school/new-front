import React, { useState } from 'react';
import {
  Box, Drawer, Stack, Typography, List, ListItemButton, ListItemIcon, ListItemText,
  Chip, TextField, InputAdornment, IconButton, Badge, Button, Tooltip, useMediaQuery,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { Link as RouterLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import SpaceDashboardRoundedIcon from '@mui/icons-material/SpaceDashboardRounded';
import GroupsRoundedIcon from '@mui/icons-material/GroupsRounded';
import PeopleAltRoundedIcon from '@mui/icons-material/PeopleAltRounded';
import BadgeRoundedIcon from '@mui/icons-material/BadgeRounded';
import AutoStoriesRoundedIcon from '@mui/icons-material/AutoStoriesRounded';
import VideocamRoundedIcon from '@mui/icons-material/VideocamRounded';
import CalendarMonthRoundedIcon from '@mui/icons-material/CalendarMonthRounded';
import InsightsRoundedIcon from '@mui/icons-material/InsightsRounded';
import ExtensionRoundedIcon from '@mui/icons-material/ExtensionRounded';
import PaymentsRoundedIcon from '@mui/icons-material/PaymentsRounded';
import ForumRoundedIcon from '@mui/icons-material/ForumRounded';
import SettingsRoundedIcon from '@mui/icons-material/SettingsRounded';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import NotificationsNoneRoundedIcon from '@mui/icons-material/NotificationsNoneRounded';
import UnfoldMoreRoundedIcon from '@mui/icons-material/UnfoldMoreRounded';
import MenuRoundedIcon from '@mui/icons-material/MenuRounded';
import { ThemeToggle } from '@/components/ThemeToggle/ThemeToggle';

const DRAWER_W = 252;

type NavItem = { key: string; icon: React.ReactNode; labelKey: string; label: string; to: string; badge?: number; dot?: boolean };

const NAV: NavItem[] = [
  { key: 'pulpit', icon: <SpaceDashboardRoundedIcon />, labelKey: 'console.nav.dashboard', label: 'Dashboard', to: '/club' },
  { key: 'groups', icon: <GroupsRoundedIcon />, labelKey: 'console.nav.groups', label: 'Groups', to: '/groups', badge: 5 },
  { key: 'students', icon: <PeopleAltRoundedIcon />, labelKey: 'console.nav.students', label: 'Students', to: '/students', badge: 54 },
  { key: 'trainers', icon: <BadgeRoundedIcon />, labelKey: 'console.nav.trainers', label: 'Trainers', to: '/club', badge: 4 },
  { key: 'courses', icon: <AutoStoriesRoundedIcon />, labelKey: 'console.nav.courses', label: 'Courses', to: '/club' },
  { key: 'lessons', icon: <VideocamRoundedIcon />, labelKey: 'console.nav.lessons', label: 'Online lessons', to: '/my-classes', dot: true },
  { key: 'schedule', icon: <CalendarMonthRoundedIcon />, labelKey: 'console.nav.schedule', label: 'Schedule', to: '/students-shedule' },
  { key: 'journal', icon: <InsightsRoundedIcon />, labelKey: 'console.nav.journal', label: 'Journal & progress', to: '/club' },
  { key: 'base', icon: <ExtensionRoundedIcon />, labelKey: 'console.nav.base', label: 'Puzzle base', to: '/books' },
  { key: 'payments', icon: <PaymentsRoundedIcon />, labelKey: 'console.nav.payments', label: 'Payments', to: '/club', badge: 3 },
  { key: 'messengers', icon: <ForumRoundedIcon />, labelKey: 'console.nav.messengers', label: 'Messengers', to: '/club' },
  { key: 'settings', icon: <SettingsRoundedIcon />, labelKey: 'console.nav.settings', label: 'Club settings', to: '/club/settings' },
];

const SidebarInner: React.FC<{ active?: string; onNavigate?: () => void }> = ({ active, onNavigate }) => {
  const { t } = useTranslation();
  return (
    <Stack sx={{ height: '100%' }}>
      {/* Brand */}
      <Box sx={{ px: 2.5, py: 2.25 }}>
        <Stack direction="row" alignItems="center" spacing={1.25} component={RouterLink} to="/" sx={{ textDecoration: 'none', color: 'text.primary' }}>
          <Box aria-hidden sx={{ width: 32, height: 32, borderRadius: 2, display: 'grid', placeItems: 'center', background: 'linear-gradient(135deg,#3A5FF0,#1E3CB0)', color: '#fff', fontSize: 19, fontWeight: 800 }}>♞</Box>
          <Typography sx={{ fontFamily: '"Space Grotesk"', fontWeight: 700, fontSize: '1.25rem', letterSpacing: '-0.01em' }}>debiut</Typography>
        </Stack>
      </Box>

      {/* Club switcher */}
      <Box sx={{ px: 2, pb: 1.5 }}>
        <Stack direction="row" alignItems="center" spacing={1.25} sx={{ p: 1, borderRadius: 2.5, border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper', cursor: 'pointer' }}>
          <Box sx={{ width: 34, height: 34, borderRadius: 2, flexShrink: 0, display: 'grid', placeItems: 'center', bgcolor: 'rgba(43,80,224,0.12)', color: 'primary.main', fontWeight: 800, fontSize: 13 }}>SH</Box>
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography sx={{ fontWeight: 700, fontSize: 13.5, lineHeight: 1.2 }} noWrap>SKS Hetman Poznań</Typography>
            <Typography sx={{ fontSize: 11.5, color: 'text.secondary', lineHeight: 1.2 }} noWrap>{t('console.plan', 'Klub plan')} · 54/150</Typography>
          </Box>
          <UnfoldMoreRoundedIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
        </Stack>
      </Box>

      {/* Nav */}
      <List sx={{ px: 1.25, flex: 1, overflowY: 'auto' }}>
        {NAV.map((item) => (
          <ListItemButton key={item.key} selected={active === item.key} component={RouterLink} to={item.to} onClick={onNavigate}
            sx={{ mb: 0.25, py: 0.85 }}>
            <ListItemIcon>
              {item.dot
                ? <Badge color="error" variant="dot" overlap="circular">{item.icon}</Badge>
                : item.icon}
            </ListItemIcon>
            <ListItemText primaryTypographyProps={{ fontSize: 14, fontWeight: active === item.key ? 700 : 500 }}>
              {t(item.labelKey, item.label)}
            </ListItemText>
            {item.badge != null && (
              <Chip label={item.badge} size="small" sx={{ height: 20, fontSize: 11, fontWeight: 600, bgcolor: 'action.hover', color: 'text.secondary' }} />
            )}
          </ListItemButton>
        ))}
      </List>

      {/* User */}
      <Box sx={{ px: 2, py: 1.5, borderTop: '1px solid', borderColor: 'divider' }}>
        <Stack direction="row" alignItems="center" spacing={1.25}>
          <Box sx={{ width: 34, height: 34, borderRadius: '50%', flexShrink: 0, display: 'grid', placeItems: 'center', bgcolor: 'primary.main', color: '#fff', fontWeight: 700, fontSize: 13 }}>NS</Box>
          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ fontWeight: 600, fontSize: 13.5, lineHeight: 1.2 }} noWrap>Nikita S.</Typography>
            <Typography sx={{ fontSize: 11.5, color: 'text.secondary', lineHeight: 1.2 }} noWrap>{t('console.owner', 'Club owner')}</Typography>
          </Box>
        </Stack>
      </Box>
    </Stack>
  );
};

/** Каркас консоли управления клубом: постоянный сайдбар (по макету Panel właściciela klubu) + топбар. */
export const ConsoleShell: React.FC<{ active?: string; children: React.ReactNode }> = ({ active, children }) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const desktop = useMediaQuery(theme.breakpoints.up('md'));
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <Box sx={{ display: 'flex', minHeight: '100dvh', bgcolor: 'background.default' }}>
      {/* Sidebar */}
      {desktop ? (
        <Drawer variant="permanent" sx={{ width: DRAWER_W, flexShrink: 0, '& .MuiDrawer-paper': { width: DRAWER_W, borderRight: '1px solid', borderColor: 'divider' } }}>
          <SidebarInner active={active} />
        </Drawer>
      ) : (
        <Drawer variant="temporary" open={mobileOpen} onClose={() => setMobileOpen(false)} ModalProps={{ keepMounted: true }}
          sx={{ '& .MuiDrawer-paper': { width: DRAWER_W } }}>
          <SidebarInner active={active} onNavigate={() => setMobileOpen(false)} />
        </Drawer>
      )}

      {/* Main */}
      <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        {/* Topbar */}
        <Stack direction="row" alignItems="center" spacing={1.5} sx={{
          position: 'sticky', top: 0, zIndex: 10, px: { xs: 2, md: 3 }, py: 1.5,
          borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'rgba(243,244,247,0.001)',
          backdropFilter: 'blur(8px)', backgroundColor: 'background.default',
        }}>
          {!desktop && (
            <IconButton onClick={() => setMobileOpen(true)} aria-label="menu"><MenuRoundedIcon /></IconButton>
          )}
          <TextField size="small" placeholder={t('console.search', 'Search student, group, task…')}
            sx={{ flex: 1, maxWidth: 440 }}
            InputProps={{ startAdornment: <InputAdornment position="start"><SearchRoundedIcon sx={{ fontSize: 20, color: 'text.secondary' }} /></InputAdornment> }} />
          <Box sx={{ flex: 1 }} />
          <ThemeToggle size="small" />
          <Tooltip title={t('console.notifications', 'Notifications')}>
            <IconButton size="small"><Badge color="error" variant="dot"><NotificationsNoneRoundedIcon /></Badge></IconButton>
          </Tooltip>
          <Button variant="contained" startIcon={<AddRoundedIcon />} sx={{ borderRadius: 2.5, px: 2 }}>{t('console.add', 'Add')}</Button>
        </Stack>

        {/* Content */}
        <Box sx={{ p: { xs: 2, md: 3 }, flex: 1 }}>{children}</Box>
      </Box>
    </Box>
  );
};
