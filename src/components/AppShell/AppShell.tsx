import React, { useContext, useEffect, useState } from 'react';
import { Link as RouterLink, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  AppBar, Avatar, Box, Button, Divider, Drawer, IconButton, List, ListItemButton, ListItemIcon, ListItemText,
  ListSubheader, Skeleton, Stack, Toolbar, Tooltip, Typography, useMediaQuery, useTheme,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import HomeRoundedIcon from '@mui/icons-material/HomeRounded';
import SportsEsportsRoundedIcon from '@mui/icons-material/SportsEsportsRounded';
import InfoRoundedIcon from '@mui/icons-material/InfoRounded';
import GroupsRoundedIcon from '@mui/icons-material/GroupsRounded';
import EmojiEventsRoundedIcon from '@mui/icons-material/EmojiEventsRounded';
import MenuBookRoundedIcon from '@mui/icons-material/MenuBookRounded';
import ExtensionRoundedIcon from '@mui/icons-material/ExtensionRounded';
import TrendingUpRoundedIcon from '@mui/icons-material/TrendingUpRounded';
import FavoriteRoundedIcon from '@mui/icons-material/FavoriteRounded';
import QueryStatsRoundedIcon from '@mui/icons-material/QueryStatsRounded';
import StorageRoundedIcon from '@mui/icons-material/StorageRounded';
import EventNoteRoundedIcon from '@mui/icons-material/EventNoteRounded';
import InboxRoundedIcon from '@mui/icons-material/InboxRounded';
import PersonRoundedIcon from '@mui/icons-material/PersonRounded';
import SchoolRoundedIcon from '@mui/icons-material/SchoolRounded';
import FactCheckRoundedIcon from '@mui/icons-material/FactCheckRounded';
import DocumentScannerRoundedIcon from '@mui/icons-material/DocumentScannerRounded';
import AutoStoriesRoundedIcon from '@mui/icons-material/AutoStoriesRounded';
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded';
import { AuthContext } from '@/context/AuthContext';
import { Notifications } from '@/components/Notifications/Notification';
import { ChatButton, ChatDrawer, ChatProvider } from '@/features/Chat';
import { LanguageSwitcher } from '@/components/LanguageSwitcher/LanguageSwitcher';
import { getPrimaryRole } from '@/utils/getPrimaryRole';
import { isItemActive, NavIcon, NavItem, visibleNav } from './navigation';

export const SIDEBAR_WIDTH = 264;

const ICONS: Record<NavIcon, React.ReactElement> = {
  home: <HomeRoundedIcon />,
  play: <SportsEsportsRoundedIcon />,
  about: <InfoRoundedIcon />,
  coaches: <GroupsRoundedIcon />,
  achievements: <EmojiEventsRoundedIcon />,
  books: <MenuBookRoundedIcon />,
  puzzles: <ExtensionRoundedIcon />,
  rating: <TrendingUpRoundedIcon />,
  survival: <FavoriteRoundedIcon />,
  analysis: <QueryStatsRoundedIcon />,
  database: <StorageRoundedIcon />,
  schedule: <EventNoteRoundedIcon />,
  inbox: <InboxRoundedIcon />,
  profile: <PersonRoundedIcon />,
  students: <SchoolRoundedIcon />,
  review: <FactCheckRoundedIcon />,
  digitizer: <DocumentScannerRoundedIcon />,
  courseBuilder: <AutoStoriesRoundedIcon />,
};

const Logo: React.FC<{ onClick?: () => void }> = ({ onClick }) => {
  const { t } = useTranslation();
  return (
    <Stack component={RouterLink} to="/" onClick={onClick} direction="row" alignItems="center" spacing={1.25}
      sx={{ textDecoration: 'none', color: 'text.primary', minWidth: 0 }}>
      <Box sx={{
        width: 34, height: 34, borderRadius: 2, display: 'grid', placeItems: 'center', flexShrink: 0,
        background: 'linear-gradient(135deg, #f0c453 0%, #c4972a 100%)', color: '#1a1405', fontSize: 20, fontWeight: 800,
        boxShadow: '0 4px 14px rgba(227,179,65,0.25)',
      }} aria-hidden>
        ♞
      </Box>
      <Typography variant="h6" noWrap sx={{ fontWeight: 700, letterSpacing: '-0.01em' }}>{t('navbar.chessSchool')}</Typography>
    </Stack>
  );
};

/** Содержимое бокового меню — одно для постоянного сайдбара и для выдвижного на телефоне */
const SidebarContent: React.FC<{ onNavigate?: () => void }> = ({ onNavigate }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const auth = useContext(AuthContext);
  const user = auth?.user ?? null;
  const isAuthenticated = !!auth?.isAuthenticated;
  const groups = visibleNav(user, isAuthenticated);

  const hrefOf = (item: NavItem) => (item.key === 'profile' && user?.uuid ? `/profile/${user.uuid}` : item.to);
  const handleLogout = () => {
    auth?.logout();
    onNavigate?.();
    navigate('/login');
  };
  const role = user ? getPrimaryRole(user.roles).toLowerCase() : null;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Box sx={{ px: 2.5, py: 2.25 }}><Logo onClick={onNavigate} /></Box>
      <Box component="nav" aria-label={t('nav.main', 'Main navigation')} sx={{ flex: 1, overflowY: 'auto', px: 1.5, pb: 2 }}>
        {auth?.loading ? (
          <Stack spacing={1} sx={{ px: 1, pt: 1 }}>{[0, 1, 2, 3, 4].map((i) => <Skeleton key={i} height={36} />)}</Stack>
        ) : groups.map((group) => (
          <List key={group.key} dense disablePadding
            subheader={(
              <ListSubheader disableSticky sx={{ bgcolor: 'transparent', color: 'text.disabled', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', lineHeight: '32px', mt: 1.5 }}>
                {t(group.labelKey, group.fallback)}
              </ListSubheader>
            )}>
            {group.items.map((item) => {
              const active = isItemActive(item, location.pathname, location.search, location.hash);
              return (
                <ListItemButton key={item.key} component={RouterLink} to={hrefOf(item)} selected={active} onClick={onNavigate}
                  aria-current={active ? 'page' : undefined} data-nav={item.key} sx={{ mb: 0.25, py: 0.85 }}>
                  <ListItemIcon sx={{ '& svg': { fontSize: 20 } }}>{ICONS[item.icon]}</ListItemIcon>
                  <ListItemText primary={t(item.labelKey, item.fallback)} primaryTypographyProps={{ fontWeight: active ? 600 : 500, fontSize: '0.92rem' }} />
                </ListItemButton>
              );
            })}
          </List>
        ))}
      </Box>

      <Divider />
      <Box sx={{ p: 2 }}>
        {isAuthenticated && user ? (
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <Avatar sx={{ width: 38, height: 38, bgcolor: 'surface.overlay', color: 'primary.main', fontWeight: 700, fontSize: '0.95rem' }}>
              {(user.firstName?.[0] ?? '') + (user.lastName?.[0] ?? '')}
            </Avatar>
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Typography variant="body2" fontWeight={600} noWrap>{user.firstName} {user.lastName}</Typography>
              <Typography variant="caption" color="text.secondary" noWrap sx={{ textTransform: 'capitalize' }}>
                {t(`roles.${role}`, role ?? '')}
              </Typography>
            </Box>
            <Tooltip title={t('navbar.logout')}>
              <IconButton size="small" onClick={handleLogout} aria-label={t('navbar.logout')}><LogoutRoundedIcon fontSize="small" /></IconButton>
            </Tooltip>
          </Stack>
        ) : !auth?.loading && (
          <Stack spacing={1}>
            <Button variant="contained" component={RouterLink} to="/register" onClick={onNavigate} fullWidth>{t('navbar.getStarted')}</Button>
            <Button variant="outlined" color="inherit" component={RouterLink} to="/login" onClick={onNavigate} fullWidth>{t('navbar.login')}</Button>
          </Stack>
        )}
        <Box sx={{ mt: 1.5 }}><LanguageSwitcher /></Box>
      </Box>
    </Box>
  );
};

/**
 * Каркас приложения: на десктопе — постоянный сайдбар слева и тонкая стеклянная шапка,
 * на телефоне/планшете — шапка с кнопкой меню и выдвижной сайдбар.
 */
export const AppShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const theme = useTheme();
  const desktop = useMediaQuery(theme.breakpoints.up('lg'), { noSsr: true });
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const auth = useContext(AuthContext);
  const { t } = useTranslation();

  // Смена страницы закрывает выдвижное меню (в том числе по «назад» в браузере)
  useEffect(() => { setOpen(false); }, [location.pathname]);

  const sidebarPaperSx = { width: SIDEBAR_WIDTH, boxSizing: 'border-box' as const, borderRight: 1, borderColor: 'divider' };

  // Чат — на всё приложение: страницы открывают диалог через useChat().openChat()
  return (
    <ChatProvider>
    <Box sx={{ display: 'flex', minHeight: '100dvh', bgcolor: 'background.default' }}>
      {desktop ? (
        <Drawer variant="permanent" sx={{ width: SIDEBAR_WIDTH, flexShrink: 0, '& .MuiDrawer-paper': sidebarPaperSx }}>
          <SidebarContent />
        </Drawer>
      ) : (
        <Drawer variant="temporary" open={open} onClose={() => setOpen(false)} ModalProps={{ keepMounted: true }}
          sx={{ '& .MuiDrawer-paper': { ...sidebarPaperSx, width: `min(${SIDEBAR_WIDTH + 16}px, 86vw)` } }}>
          <SidebarContent onNavigate={() => setOpen(false)} />
        </Drawer>
      )}

      <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <AppBar position="sticky" sx={{ top: 0, zIndex: (th) => th.zIndex.appBar }}>
          <Toolbar sx={{ gap: 1, minHeight: { xs: 56, lg: 60 }, px: { xs: 1.5, sm: 2.5 } }}>
            {!desktop && (
              <IconButton edge="start" onClick={() => setOpen(true)} aria-label={t('nav.openMenu', 'Open menu')} sx={{ color: 'text.primary' }}>
                <MenuIcon />
              </IconButton>
            )}
            {!desktop && <Logo />}
            <Box sx={{ flex: 1 }} />
            {auth?.isAuthenticated && <ChatButton />}
            {auth?.isAuthenticated && <Notifications navigateToRequests={() => navigate('/inbox')} />}
            {!auth?.loading && !auth?.isAuthenticated && desktop && (
              <Stack direction="row" spacing={1}>
                <Button color="inherit" component={RouterLink} to="/login">{t('navbar.login')}</Button>
                <Button variant="contained" component={RouterLink} to="/register">{t('navbar.register')}</Button>
              </Stack>
            )}
          </Toolbar>
        </AppBar>
        <Box component="main" sx={{ flex: 1, minWidth: 0 }}>{children}</Box>
      </Box>
      <ChatDrawer />
    </Box>
    </ChatProvider>
  );
};
