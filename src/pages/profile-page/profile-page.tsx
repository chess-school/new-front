import React, { useEffect, useState, useMemo } from 'react';
import {
  Container, Typography, Button, Paper, Grid, CircularProgress, Box, Stack, Avatar, Chip, Tabs, Tab, Tooltip,
  Skeleton
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import EditProfileForm from '@/components/Profile/EditProfileForm';
import { getProfile, getAvatarUrl } from '@/api/profile';
import { getCoachById } from '@/api/coaches';
import {getScheduleByStudent} from '@/api/schedule';
import { User } from '@/types/User';
import { ScheduleEvent } from '@/types/SheduleEvent';

// --- ICONS ---
import EditIcon from '@mui/icons-material/Edit';
import LogoutIcon from '@mui/icons-material/Logout';
import SchoolIcon from '@mui/icons-material/School';
import EventIcon from '@mui/icons-material/Event';

// --- ROLE MANAGEMENT & HELPERS ---
const ROLE_PRIORITY: { [key: string]: number } = {
  admin: 4,
  coach: 3,
  student: 2,
  user: 1,
};
const getPrimaryRole = (roles: string[] = []): string => {
  if (roles.length === 0) return 'user';
  const sortedRoles = [...roles].sort((a, b) => (ROLE_PRIORITY[b] || 0) - (ROLE_PRIORITY[a] || 0));
  return sortedRoles[0];
};

function TabPanel(props: { children?: React.ReactNode; index: number; value: number; }) {
  const { children, value, index, ...other } = props;
  return <div role="tabpanel" hidden={value !== index} {...other}>{value === index && <Box sx={{ pt: 3 }}>{children}</Box>}</div>;
}

// --- WIDGETS С РЕАЛЬНЫМИ ДАННЫМИ ---
const MyCoachWidget: React.FC<{ coach: User | null; isLoading: boolean }> = ({ coach, isLoading }) => {
  if (isLoading) {
    return <Paper sx={{ p: 2, bgcolor: '#2a2a2a', borderRadius: 3, height: '100%' }}><Skeleton variant="text" width="60%" sx={{ bgcolor: 'grey.700' }} /><Skeleton variant="text" width="40%" sx={{ bgcolor: 'grey.700' }} /></Paper>;
  }
  if (!coach) return null; // Если тренера нет, виджет не отображается
  return (
    <Paper sx={{ p: 2, bgcolor: '#2a2a2a', color: 'white', borderRadius: 3, height: '100%' }}>
      <Stack direction="row" spacing={2} alignItems="center">
        <SchoolIcon sx={{ color: '#FFD700' }} />
        <Box>
          <Typography variant="h6">Your Coach</Typography>
          <Typography>{coach.firstName} {coach.lastName}</Typography>
        </Box>
      </Stack>
    </Paper>
  );
};

const UpcomingLessonsWidget: React.FC<{ schedule: ScheduleEvent[]; isLoading: boolean }> = ({ schedule, isLoading }) => {
  if (isLoading) {
    return <Paper sx={{ p: 2, bgcolor: '#2a2a2a', borderRadius: 3, height: '100%' }}><Skeleton variant="rectangular" height={80} sx={{ bgcolor: 'grey.700' }} /></Paper>;
  }
  
  const upcomingEvents = schedule.filter(event => new Date(event.date) >= new Date()).slice(0, 3); // Только будущие, не больше 3
  
  return (
    <Paper sx={{ p: 2, bgcolor: '#2a2a2a', color: 'white', borderRadius: 3, height: '100%' }}>
      <Stack direction="row" spacing={2} alignItems="center" mb={2}>
        <EventIcon sx={{ color: '#FFD700' }}/>
        <Typography variant="h6">Upcoming Lessons</Typography>
      </Stack>
      <Stack spacing={1}>
        {upcomingEvents.length > 0 ? (
          upcomingEvents.map(event => (
            <Typography key={event._id}>- {event.title} ({new Date(event.date).toLocaleDateString()})</Typography>
          ))
        ) : (
          <Typography sx={{color: 'grey.500'}}>No upcoming lessons.</Typography>
        )}
      </Stack>
    </Paper>
  );
};

// --- MAIN PAGE COMPONENT ---
export const ProfilePage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  // State
  const [user, setUser] = useState<User | null>(null);
  const [coach, setCoach] = useState<User | null>(null);
  const [schedule, setSchedule] = useState<ScheduleEvent[]>([]);
  const [loading, setLoading] = useState({ profile: true, coach: false, schedule: false });
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState(0);

  // Data Fetching: Основной профиль
  useEffect(() => {
    const fetchUserProfile = async () => {
      setLoading(prev => ({ ...prev, profile: true }));
      try {
        const profileData = await getProfile();
        setUser(profileData);
      } catch (err) {
        setError(t('profile.errorLoadingProfile'));
        setLoading(prev => ({ ...prev, profile: false }));
      }
    };
    fetchUserProfile();
  }, [t]);

  // Data Fetching: Зависимые данные (тренер и расписание)
  useEffect(() => {
    // Эта часть сработает, как только `user` будет загружен
    if (user) {
      setLoading(prev => ({ ...prev, profile: false, coach: true, schedule: true }));

      // 1. Загружаем данные тренера, если он есть
      if (user.trainer) {
        getCoachById(user.trainer)
          .then(setCoach)
          .catch(err => console.error("Failed to fetch coach data:", err))
          .finally(() => setLoading(prev => ({ ...prev, coach: false })));
      } else {
        setLoading(prev => ({ ...prev, coach: false }));
      }

      // 2. Загружаем расписание студента
      getScheduleByStudent(user._id)
        .then(setSchedule)
        .catch(err => console.error("Failed to fetch schedule:", err))
        .finally(() => setLoading(prev => ({ ...prev, schedule: false })));
    }
  }, [user]);
  // Handlers
  const handleLogout = () => {
    localStorage.clear();
    navigate('/auth/login');
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => setActiveTab(newValue);
  const avatarUrl = useMemo(() => user?._id ? getAvatarUrl(user._id) : '', [user]);

  // Render Logic
  if (loading.profile) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', bgcolor: '#0e0e0e' }}><CircularProgress sx={{ color: '#FFD700' }} /></Box>;
  }

  if (error || !user) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', bgcolor: '#0e0e0e' }}><Typography color="error">{error || 'User not found'}</Typography></Box>;
  }

  const primaryRole = getPrimaryRole(user.roles);
  const otherRoles = user.roles.filter(role => role !== primaryRole);
  const roleChipColor = {
    admin: 'secondary',
    coach: 'primary',
    student: 'success',
    user: 'default',
  }[primaryRole] as "secondary" | "primary" | "success" | "default";
  
  return (
    <Box sx={{ bgcolor: '#0e0e0e', color: 'white', minHeight: '100vh', py: 5 }}>
      <Container maxWidth="lg">
        <Box sx={{ textAlign: 'center', mb: 5 }}>
          <Typography variant="h2" component="h1" fontWeight="bold">{t('profile.title')}</Typography>
          <Typography variant="h6" sx={{ mt: 1, color: 'rgba(255, 255, 255, 0.7)' }}>{t('profile.subtitle')}</Typography>
        </Box>

        {/* --- PROFILE CARD --- */}
        <Paper sx={{ p: { xs: 2, md: 4 }, mb: 4, bgcolor: '#1c1c1c', borderRadius: 4, color: 'white' }}>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={4} alignItems="center">
            <Avatar src={avatarUrl} alt={`${user.firstName} ${user.lastName}`} sx={{ width: 120, height: 120, border: '4px solid #FFD700' }} />
            <Box sx={{ flexGrow: 1, textAlign: { xs: 'center', md: 'left' } }}>
              <Stack direction="row" spacing={2} alignItems="center" justifyContent={{xs: 'center', md: 'flex-start'}}>
                <Typography variant="h4" fontWeight="bold">{user.firstName} {user.lastName}</Typography>
                <Tooltip title={otherRoles.length > 0 ? `Also: ${otherRoles.join(', ')}` : ''} arrow>
                  <Chip label={primaryRole} color={roleChipColor} size="small" sx={{ textTransform: 'capitalize' }} />
                </Tooltip>
              </Stack>
              {user.trainerEmail && <Typography sx={{color: 'rgba(255,255,255,0.7)'}}>Coach: {user.trainerEmail.split('@')[0]}</Typography>}
              <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                {t('profile.registrationDate')}: {new Date(user.registrationDate).toLocaleDateString()}
              </Typography>
            </Box>
            <Stack direction="row" spacing={2} sx={{ mt: { xs: 3, md: 0 } }}>
              <Button variant="outlined" onClick={() => setIsEditing(true)} startIcon={<EditIcon />} sx={{ color: '#FFD700', borderColor: 'rgba(255, 215, 0, 0.5)', '&:hover': {borderColor: '#FFD700'} }}>
                {t('profile.editProfile')}
              </Button>
              <Button variant="contained" color="error" onClick={handleLogout} startIcon={<LogoutIcon />}>
                {t('profile.logout')}
              </Button>
            </Stack>
          </Stack>
        </Paper>

        {/* --- TABS --- */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={activeTab} onChange={handleTabChange} textColor="inherit" 
                TabIndicatorProps={{ sx: { backgroundColor: '#FFD700' } }}
            >
                <Tab label={t('profile.tabs.overview', 'Overview')} />
                <Tab label={t('profile.tabs.statistics', 'Statistics')} />
                <Tab label={t('profile.tabs.activity', 'Activity')} disabled />
            </Tabs>
        </Box>

        {/* --- TAB PANELS --- */}
        <TabPanel value={activeTab} index={0}>
          <Typography variant="h5" fontWeight="bold" sx={{ mb: 3 }}>Dashboard</Typography>
          <Grid container spacing={3}>
    <Grid item xs={12} md={6}>
        <MyCoachWidget coach={coach} isLoading={loading.coach} />
    </Grid>
    <Grid item xs={12} md={6}>
        <UpcomingLessonsWidget schedule={schedule} isLoading={loading.schedule} />
    </Grid>
</Grid>
        </TabPanel>

        <TabPanel value={activeTab} index={1}>
           <Box sx={{ opacity: 0.6, p: 2, borderRadius: 3, bgcolor: '#1c1c1c' }}>
                <Typography variant="h5" fontWeight="bold" sx={{ mb: 1 }}>{t('profile.playerStats')}</Typography>
                <Typography sx={{ mb: 3, fontStyle: 'italic', color: 'rgba(255,255,255,0.7)'}}>
                    Game statistics will be available soon!
                </Typography>
                {/* You can place the mock statistics component here if you have one */}
           </Box>
        </TabPanel>

        <TabPanel value={activeTab} index={2}>
           {/* Activity feed will be here */}
        </TabPanel>

        {isEditing && (
          <EditProfileForm user={user} onClose={() => setIsEditing(false)} />
        )}

      </Container>
    </Box>
  );
};