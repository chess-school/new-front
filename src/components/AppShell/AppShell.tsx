import React, { useContext, useEffect, useState } from 'react';
import { Link as RouterLink, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  AppBar, Avatar, Badge, Box, Button, Chip, Divider, Drawer, IconButton, InputBase, List, ListItemButton, ListItemIcon, ListItemText,
  ListSubheader, Menu, MenuItem, Skeleton, Stack, Toolbar, ToggleButton, ToggleButtonGroup, Tooltip, Typography, useMediaQuery, useTheme,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import PersonAddAlt1RoundedIcon from '@mui/icons-material/PersonAddAlt1Rounded';
import PublicRoundedIcon from '@mui/icons-material/PublicRounded';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import UnfoldMoreRoundedIcon from '@mui/icons-material/UnfoldMoreRounded';
import OpenInNewRoundedIcon from '@mui/icons-material/OpenInNewRounded';
import HomeRoundedIcon from '@mui/icons-material/HomeRounded';
import SportsEsportsRoundedIcon from '@mui/icons-material/SportsEsportsRounded';
import InfoRoundedIcon from '@mui/icons-material/InfoRounded';
import GroupsRoundedIcon from '@mui/icons-material/GroupsRounded';
import EmojiEventsRoundedIcon from '@mui/icons-material/EmojiEventsRounded';
import MenuBookRoundedIcon from '@mui/icons-material/MenuBookRounded';
import ExtensionRoundedIcon from '@mui/icons-material/ExtensionRounded';
import TrendingUpRoundedIcon from '@mui/icons-material/TrendingUpRounded';
import FavoriteRoundedIcon from '@mui/icons-material/FavoriteRounded';
import VisibilityOffRoundedIcon from '@mui/icons-material/VisibilityOffRounded';
import QueryStatsRoundedIcon from '@mui/icons-material/QueryStatsRounded';
import StorageRoundedIcon from '@mui/icons-material/StorageRounded';
import EventNoteRoundedIcon from '@mui/icons-material/EventNoteRounded';
import InboxRoundedIcon from '@mui/icons-material/InboxRounded';
import PersonRoundedIcon from '@mui/icons-material/PersonRounded';
import HistoryRoundedIcon from '@mui/icons-material/HistoryRounded';
import SchoolRoundedIcon from '@mui/icons-material/SchoolRounded';
import FactCheckRoundedIcon from '@mui/icons-material/FactCheckRounded';
import DocumentScannerRoundedIcon from '@mui/icons-material/DocumentScannerRounded';
import AutoStoriesRoundedIcon from '@mui/icons-material/AutoStoriesRounded';
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded';
import VideoCameraFrontRoundedIcon from '@mui/icons-material/VideoCameraFrontRounded';
import { AuthContext } from '@/context/AuthContext';
import { Notifications } from '@/components/Notifications/Notification';
import { SitePing } from '@/components/SitePing/SitePing';
import { ChatButton, ChatDrawer, ChatProvider } from '@/features/Chat';
import { LanguageSwitcher } from '@/components/LanguageSwitcher/LanguageSwitcher';
import { ThemeToggle } from '@/components/ThemeToggle/ThemeToggle';
import { getPrimaryRole } from '@/utils/getPrimaryRole';
import SpaceDashboardRoundedIcon from '@mui/icons-material/SpaceDashboardRounded';
import { useClubStore } from '@/features/clubs/clubStore';
import { useSiteSettings } from '@/features/site/SiteSettingsContext';
import { canCoach, isItemActive, NavIcon, NavItem, NavMode, visibleNav } from './navigation';

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
  blindfold: <VisibilityOffRoundedIcon />,
  analysis: <QueryStatsRoundedIcon />,
  database: <StorageRoundedIcon />,
  schedule: <EventNoteRoundedIcon />,
  classroom: <VideoCameraFrontRoundedIcon />,
  inbox: <InboxRoundedIcon />,
  profile: <PersonRoundedIcon />,
  games: <HistoryRoundedIcon />,
  students: <SchoolRoundedIcon />,
  groups: <GroupsRoundedIcon />,
  review: <FactCheckRoundedIcon />,
  digitizer: <DocumentScannerRoundedIcon />,
  courseBuilder: <AutoStoriesRoundedIcon />,
  console: <SpaceDashboardRoundedIcon />,
  coachApps: <PersonAddAlt1RoundedIcon />,
  public: <PublicRoundedIcon />,
};

const clubInitials = (name: string) =>
  name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? '').join('') || 'C';

/** Переключатель клуба (вверху сайдбара): данные из /clubs/mine, смена клуба меняет X-Club-Id. */
const ClubSwitcher: React.FC = () => {
  const { t } = useTranslation();
  const clubs = useClubStore((s) => s.clubs);
  const activeClubId = useClubStore((s) => s.activeClubId);
  const load = useClubStore((s) => s.load);
  const setActive = useClubStore((s) => s.setActive);
  const [anchor, setAnchor] = useState<null | HTMLElement>(null);
  useEffect(() => { void load(); }, [load]);

  const active = clubs.find((c) => c.club._id === activeClubId) ?? null;

  if (!active) {
    return (
      <Stack direction="row" alignItems="center" spacing={1.25} component={RouterLink} to="/create-club"
        sx={{ p: 1, borderRadius: 2.5, border: '1px dashed', borderColor: 'divider', textDecoration: 'none', color: 'text.primary', '&:hover': { borderColor: 'primary.main' } }}>
        <Box sx={{ width: 34, height: 34, borderRadius: 2, display: 'grid', placeItems: 'center', bgcolor: 'rgba(43,80,224,0.1)', color: 'primary.main' }}><AddRoundedIcon fontSize="small" /></Box>
        <Typography sx={{ fontWeight: 600, fontSize: 13.5 }}>{t('club.create', 'Create a club')}</Typography>
      </Stack>
    );
  }

  const c = active.club;
  const multi = clubs.length > 1;
  return (
    <>
      <Stack direction="row" alignItems="center" spacing={1.25} onClick={(e) => { if (multi) setAnchor(e.currentTarget); }}
        sx={{ p: 1, borderRadius: 2.5, border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper', cursor: multi ? 'pointer' : 'default', '&:hover': { borderColor: multi ? 'text.disabled' : 'divider' } }}>
        <Box sx={{ width: 34, height: 34, borderRadius: 2, flexShrink: 0, display: 'grid', placeItems: 'center', bgcolor: 'rgba(43,80,224,0.12)', color: 'primary.main', fontWeight: 800, fontSize: 13 }}>{clubInitials(c.name)}</Box>
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography sx={{ fontWeight: 700, fontSize: 13.5, lineHeight: 1.2 }} noWrap>{c.name}</Typography>
          <Typography sx={{ fontSize: 11.5, color: 'text.secondary', lineHeight: 1.2, textTransform: 'capitalize' }} noWrap>{t(`club.role.${active.role}`, active.role)}</Typography>
        </Box>
        {multi && <UnfoldMoreRoundedIcon sx={{ fontSize: 18, color: 'text.secondary' }} />}
      </Stack>
      <Menu anchorEl={anchor} open={!!anchor} onClose={() => setAnchor(null)} sx={{ '& .MuiPaper-root': { minWidth: 230 } }}>
        {clubs.map((entry) => (
          <MenuItem key={entry.club._id} selected={entry.club._id === activeClubId} onClick={() => { setAnchor(null); setActive(entry.club._id); }}>
            <Box sx={{ width: 26, height: 26, borderRadius: 1.5, mr: 1.25, display: 'grid', placeItems: 'center', bgcolor: 'rgba(43,80,224,0.12)', color: 'primary.main', fontWeight: 700, fontSize: 11 }}>{clubInitials(entry.club.name)}</Box>
            <ListItemText primary={entry.club.name} secondary={t(`club.role.${entry.role}`, entry.role)}
              primaryTypographyProps={{ fontSize: 14, fontWeight: 600 }} secondaryTypographyProps={{ fontSize: 11, sx: { textTransform: 'capitalize' } }} />
          </MenuItem>
        ))}
        <Divider />
        <MenuItem component={RouterLink} to="/create-club" onClick={() => setAnchor(null)}>
          <AddRoundedIcon fontSize="small" sx={{ mr: 1.25, color: 'text.secondary' }} />
          <ListItemText primary={t('club.create', 'Create a club')} primaryTypographyProps={{ fontSize: 14 }} />
        </MenuItem>
      </Menu>
    </>
  );
};

const Logo: React.FC<{ onClick?: () => void }> = ({ onClick }) => {
  // Бренд активного клуба (имя/логотип/цвет) из настроек сайта; пусто → платформенный debiut.
  const site = useSiteSettings();
  const brand = site.siteName || 'debiut';
  const accent = site.primaryColor || '#2B50E0';
  return (
    <Stack component={RouterLink} to="/" onClick={onClick} direction="row" alignItems="center" spacing={1.25}
      sx={{ textDecoration: 'none', color: 'text.primary', minWidth: 0 }}>
      {site.logoUrl ? (
        <Box component="img" src={site.logoUrl} alt={brand} sx={{ width: 34, height: 34, borderRadius: 2, flexShrink: 0, objectFit: 'cover' }} />
      ) : (
        <Box sx={{
          width: 34, height: 34, borderRadius: 2, display: 'grid', placeItems: 'center', flexShrink: 0,
          background: `linear-gradient(135deg, ${accent} 0%, ${accent} 100%)`, color: '#FFFFFF', fontSize: 20, fontWeight: 800,
          boxShadow: `0 4px 14px ${accent}59`,
        }} aria-hidden>
          ♞
        </Box>
      )}
      <Typography variant="h6" noWrap sx={{ fontFamily: '"Space Grotesk"', fontWeight: 700, letterSpacing: '-0.01em' }}>{brand}</Typography>
    </Stack>
  );
};

/** Содержимое бокового меню — одно для постоянного сайдбара и для выдвижного на телефоне */
const SidebarContent: React.FC<{ onNavigate?: () => void }> = ({ onNavigate }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  // На десктопе кнопки входа/регистрации живут в верхнем баре — в сайдбаре их не дублируем
  const desktop = useMediaQuery(theme.breakpoints.up('lg'), { noSsr: true });
  const auth = useContext(AuthContext);
  const user = auth?.user ?? null;
  const isAuthenticated = !!auth?.isAuthenticated;
  const coachCapable = canCoach(user, isAuthenticated);

  // Режим сайдбара Learn/Coach (тумблер виден только тренеру/админу), запоминается
  const [mode, setMode] = useState<NavMode>(() => {
    try {
      const saved = localStorage.getItem('debiut.navMode');
      if (saved === 'coach' || saved === 'learn') return saved;
    } catch { /* ignore */ }
    return 'coach';
  });
  useEffect(() => { if (!coachCapable && mode === 'coach') setMode('learn'); }, [coachCapable, mode]);
  const effMode: NavMode = coachCapable ? mode : 'learn';
  const groups = visibleNav(user, isAuthenticated, effMode);

  // Счётчики-бейджи (coach applications, review) появятся с данными backend; пока пусто
  const badgeCounts: Record<string, number> = {};

  const hrefOf = (item: NavItem) => (item.key === 'profile' && user?.uuid ? `/profile/${user.uuid}` : item.to);
  const handleLogout = () => {
    useClubStore.getState().reset();
    auth?.logout();
    onNavigate?.();
    navigate('/login');
  };
  const role = user ? getPrimaryRole(user.roles).toLowerCase() : null;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Box sx={{ px: 2.5, pt: 2.25, pb: 1.5 }}><Logo onClick={onNavigate} /></Box>

      {isAuthenticated && user && (
        <Box sx={{ px: 2, pb: 1 }}><ClubSwitcher /></Box>
      )}

      {/* Тумблер режима Learn / Coach — только для тренера/админа */}
      {coachCapable && (
        <Box sx={{ px: 2, pb: 1 }}>
          <ToggleButtonGroup exclusive fullWidth size="small" value={effMode}
            onChange={(_, v: NavMode | null) => { if (v) { setMode(v); try { localStorage.setItem('debiut.navMode', v); } catch { /* ignore */ } } }}
            sx={{ '& .MuiToggleButton-root': { py: 0.6, gap: 0.75, fontWeight: 600 } }}>
            <ToggleButton value="learn"><SchoolRoundedIcon sx={{ fontSize: 18 }} />{t('nav.mode.learn', 'Learn')}</ToggleButton>
            <ToggleButton value="coach"><VideoCameraFrontRoundedIcon sx={{ fontSize: 18 }} />{t('nav.mode.coach', 'Coach')}</ToggleButton>
          </ToggleButtonGroup>
        </Box>
      )}

      {/* Поиск / быстрый переход (⌘K) */}
      {isAuthenticated && (
        <Box sx={{ px: 2, pb: 0.5 }}>
          <Stack direction="row" alignItems="center" spacing={1}
            sx={{ px: 1.25, py: 0.6, borderRadius: 2, border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
            <SearchRoundedIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
            <InputBase placeholder={t('nav.search', 'Search or jump to…')} sx={{ flex: 1, fontSize: 13.5 }} inputProps={{ 'aria-label': t('nav.search', 'Search or jump to…') }} />
            <Chip label="⌘K" size="small" sx={{ height: 20, fontSize: 11, color: 'text.secondary', bgcolor: 'action.hover' }} />
          </Stack>
        </Box>
      )}

      <Box component="nav" aria-label={t('nav.main', 'Main navigation')} sx={{ flex: 1, overflowY: 'auto', px: 1.5, pt: 0.5, pb: 2 }}>
        {auth?.loading ? (
          <Stack spacing={1} sx={{ px: 1, pt: 1 }}>{[0, 1, 2, 3, 4].map((i) => <Skeleton key={i} height={36} />)}</Stack>
        ) : groups.map((group) => (
          <List key={group.key} dense disablePadding
            subheader={group.labelKey ? (
              <ListSubheader disableSticky sx={{ bgcolor: 'transparent', color: 'text.disabled', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', lineHeight: '32px', mt: 1.5 }}>
                {t(group.labelKey, group.fallback)}
              </ListSubheader>
            ) : undefined}>
            {group.items.map((item) => {
              const active = isItemActive(item, location.pathname, location.search, location.hash);
              const count = item.badge ? badgeCounts[item.badge] : undefined;
              const inner = (
                <>
                  <ListItemIcon sx={{ '& svg': { fontSize: 20 } }}>{ICONS[item.icon]}</ListItemIcon>
                  <ListItemText primary={t(item.labelKey, item.fallback)} primaryTypographyProps={{ fontWeight: active ? 600 : 500, fontSize: '0.92rem' }} />
                  {item.external && <OpenInNewRoundedIcon sx={{ fontSize: 15, color: 'text.disabled' }} />}
                  {count != null && count > 0 && (
                    <Chip label={count} size="small" sx={{ height: 20, minWidth: 20, fontSize: 11, fontWeight: 700, bgcolor: 'primary.main', color: '#fff' }} />
                  )}
                </>
              );
              if (item.external) {
                return (
                  <ListItemButton key={item.key} component="a" href={item.to} target="_blank" rel="noopener"
                    onClick={onNavigate} data-nav={item.key} sx={{ mb: 0.25, py: 0.85 }}>
                    {inner}
                  </ListItemButton>
                );
              }
              return (
                <ListItemButton key={item.key} component={RouterLink} to={hrefOf(item)} selected={active} onClick={onNavigate}
                  aria-current={active ? 'page' : undefined} data-nav={item.key} sx={{ mb: 0.25, py: 0.85 }}>
                  {inner}
                </ListItemButton>
              );
            })}
          </List>
        ))}
      </Box>

      <Divider />
      <Box sx={{ p: 2 }}>
        {isAuthenticated && user ? (
          <Stack direction="row" alignItems="center" spacing={1}>
            <Stack
              component={RouterLink}
              to={user.uuid ? `/profile/${user.uuid}` : '/profile'}
              onClick={onNavigate}
              direction="row"
              alignItems="center"
              spacing={1.5}
              aria-label={t('nav.profile', 'Profile')}
              sx={{
                minWidth: 0, flex: 1, textDecoration: 'none', color: 'text.primary',
                borderRadius: 2, p: 0.75, mx: -0.75,
                transition: 'background-color .15s ease',
                '&:hover': { bgcolor: 'action.hover' },
              }}
            >
              <Badge overlap="circular" anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }} variant="dot"
                sx={{ '& .MuiBadge-dot': { bgcolor: 'success.main', border: '2px solid', borderColor: 'background.paper', width: 10, height: 10, borderRadius: '50%' } }}>
                <Avatar sx={{ width: 38, height: 38, bgcolor: 'surface.overlay', color: 'primary.main', fontWeight: 700, fontSize: '0.95rem' }}>
                  {(user.firstName?.[0] ?? '') + (user.lastName?.[0] ?? '')}
                </Avatar>
              </Badge>
              <Box sx={{ minWidth: 0, flex: 1 }}>
                <Typography variant="body2" fontWeight={600} noWrap>{user.firstName} {user.lastName}</Typography>
                <Typography variant="caption" color="text.secondary" noWrap sx={{ textTransform: 'capitalize' }}>
                  {t(`roles.${role}`, role ?? '')}
                </Typography>
              </Box>
            </Stack>
            <Tooltip title={t('navbar.logout')}>
              <IconButton size="small" onClick={handleLogout} aria-label={t('navbar.logout')}><LogoutRoundedIcon fontSize="small" /></IconButton>
            </Tooltip>
          </Stack>
        ) : !auth?.loading && !desktop && (
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
        <AppBar position="sticky" sx={{
          top: 0, zIndex: (th) => th.zIndex.appBar,
          // Фирменная золотая градиентная hairline сверху
          '&::before': {
            content: '""', position: 'absolute', top: 0, left: 0, right: 0, height: 2,
            background: 'linear-gradient(90deg, transparent, rgba(138,43,43,0.7) 35%, rgba(240,198,90,0.9) 50%, rgba(138,43,43,0.7) 65%, transparent)',
          },
        }}>
          <Toolbar sx={{ gap: 1, minHeight: { xs: 56, lg: 60 }, px: { xs: 1.5, sm: 2.5 } }}>
            {!desktop && (
              <IconButton edge="start" onClick={() => setOpen(true)} aria-label={t('nav.openMenu', 'Open menu')} sx={{ color: 'text.primary' }}>
                <MenuIcon />
              </IconButton>
            )}
            {!desktop && <Logo />}
            <Box sx={{ flex: 1 }} />
            <ThemeToggle size="small" />
            {auth?.isAuthenticated && (
              <Box sx={{ display: 'flex', alignItems: 'center', mr: 0.5 }}>
                <SitePing />
              </Box>
            )}
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
