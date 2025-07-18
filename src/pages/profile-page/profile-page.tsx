import React, { useEffect, useState, useMemo, useContext } from 'react';
import { Container, Typography, CircularProgress, Box, Tabs, Tab } from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { notification } from 'antd';

// API & Context
import { getProfile, getAvatarUrl, getUserProfileById } from '@/api/profile';
import { getCoachById } from '@/api/coaches';
import { getScheduleByStudent } from '@/api/schedule';
import { sendHomework } from '@/api/homework';
import { createNotification } from '@/api/notifications';
import { AuthContext } from '@/context/AuthContext'; 

// Типы
import { User } from '@/types/User';
import { ScheduleEvent } from '@/types/SheduleEvent';

// Компоненты
import { ProfileHeader, EditProfileForm} from '@/components/Profile';
import { LessonsList } from '@/components/LessonsList/LessonsList';
import { NextLessonWidget } from '@/components/NextLessonWidget/NextLessonWidget';
import { HomeworkDialog } from '@/components/HomeworkDialog/HomeworkDialog';

// Вспомогательная функция для табов
function TabPanel(props: { children?: React.ReactNode; index: number; value: number; }) {
  const { children, value, index, ...other } = props;
  return <div role="tabpanel" hidden={value !== index} {...other}>{value === index && <Box sx={{ pt: 3 }}>{children}</Box>}</div>;
}

export const ProfilePage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { userId: urlUserId } = useParams<{ userId: string }>();
  
  const auth = useContext(AuthContext);
  if (!auth) throw new Error("AuthContext is not available");
  const { user: loggedInUser, logout, loading: authLoading, refetchUser } = auth;

  // State
  const [profileUser, setProfileUser] = useState<User | null>(null);
  const [coach, setCoach] = useState<User | null>(null);
  const [schedule, setSchedule] = useState<ScheduleEvent[]>([]);
  const [loading, setLoading] = useState({ profile: true, coach: false, schedule: false });
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [selectedEvent, setSelectedEvent] = useState<ScheduleEvent | null>(null);

  // Data Fetching
  useEffect(() => {
    if (authLoading) return;
    const profileIdToLoad = urlUserId || loggedInUser?._id;
    if (!profileIdToLoad) {
      setError(t('profile.errorNoUser', "Could not determine which profile to load."));
      setLoading({ profile: false, coach: false, schedule: false });
      return;
    }
    
    setProfileUser(null); setCoach(null); setSchedule([]);

    const fetchData = async () => {
      setLoading(prev => ({ ...prev, profile: true }));
      try {
        const data = await (urlUserId ? getUserProfileById(urlUserId) : getProfile());
        setProfileUser(data);
      } catch (err) { setError(t('profile.errorLoadingProfile')); } 
      finally { setLoading(prev => ({ ...prev, profile: false })); }
    };
    fetchData();
  }, [t, urlUserId, loggedInUser?._id, authLoading]);

  useEffect(() => {
    if (profileUser) {
      const isMyProfile = !urlUserId || (loggedInUser?._id === profileUser._id);
      
      if (profileUser.trainer) {
        setLoading(prev => ({ ...prev, coach: true }));
        getCoachById(profileUser.trainer)
          .then(setCoach).catch(err => console.error("Failed to fetch coach", err))
          .finally(() => setLoading(prev => ({ ...prev, coach: false })));
      } else {
        setCoach(null);
      }
      
      if (isMyProfile && profileUser.roles.some(role => ['student', 'user'].includes(role))) {
        setLoading(prev => ({ ...prev, schedule: true }));
        getScheduleByStudent(profileUser._id)
          .then(setSchedule).catch(err => console.error("Failed to fetch schedule", err))
          .finally(() => setLoading(prev => ({ ...prev, schedule: false })));
      } else {
        setSchedule([]);
      }
    }
  }, [profileUser, urlUserId, loggedInUser?._id]);
  
  // Handlers
  const handleLogout = () => { logout(); navigate('/auth/login'); };
  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => setActiveTab(newValue);
  const isMyProfile = !urlUserId || (loggedInUser?._id === profileUser?._id);

  const handleSendHomework = async (homeworkText: string, screenshot: File | null) => {
    if (!loggedInUser || !selectedEvent) return;
    try {
      await sendHomework({
        studentId: loggedInUser._id,
        scheduleId: selectedEvent._id,
        homeworkText: homeworkText.trim() || undefined,
        screenshot: screenshot || undefined,
      });

      if (selectedEvent.coach) {
        await createNotification({
            recipient: selectedEvent.coach,
            type: 'homework_submission',
            content: `New homework from ${loggedInUser.firstName} for: "${selectedEvent.title}"`,
            metadata: { scheduleId: selectedEvent._id },
        });
      }
      notification.success({
        message: t('studentSchedule.homeworkSentSuccess', 'Homework sent successfully!'),
        description: undefined
      });
      setSelectedEvent(null);
      setSchedule(prev => prev.map(e => e._id === selectedEvent._id ? { ...e, status: 'pending' } : e));
    } catch (err) {
      notification.error({
        message: t('errors.sendHomework', 'Failed to send homework.'),
        description: undefined
      });
    }
  };

  const avatarUrl = useMemo(() => profileUser?._id ? getAvatarUrl(profileUser._id) : '', [profileUser]);

  // --- Render Logic ---
  if (authLoading || loading.profile) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', bgcolor: '#0e0e0e' }}><CircularProgress sx={{ color: '#FFD700' }} /></Box>;
  }

  if (error || !profileUser) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', bgcolor: '#0e0e0e' }}><Typography color="error">{error || 'User not found'}</Typography></Box>;
  }
  
  return (
    <Box sx={{ bgcolor: '#0e0e0e', color: 'white', minHeight: '100vh', py: 5 }}>
      <Container maxWidth="lg">
        <Box sx={{ textAlign: 'center', mb: 5 }}>
          <Typography variant="h2" component="h1" fontWeight="bold">{isMyProfile ? t('profile.title') : `${profileUser.firstName}'s Profile`}</Typography>
          <Typography variant="h6" sx={{ mt: 1, color: 'rgba(255, 255, 255, 0.7)' }}>{isMyProfile && t('profile.subtitle')}</Typography>
        </Box>
        
        <ProfileHeader 
          user={profileUser}
          coach={coach}
          avatarUrl={avatarUrl}
          isMyProfile={isMyProfile}
          onEdit={() => setIsEditing(true)}
          onLogout={handleLogout}
          t={t}
        />
        
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={activeTab} onChange={handleTabChange} textColor="inherit" TabIndicatorProps={{ sx: { backgroundColor: '#FFD700' } }}>
                <Tab label={t('profile.tabs.overview', 'Overview')} />
                {isMyProfile && profileUser.roles.some(r => ['student', 'user'].includes(r)) && 
                    <Tab label={t('profile.tabs.lessons', 'All Lessons')} />
                }
                <Tab label={t('profile.tabs.statistics', 'Statistics')} disabled />
            </Tabs>
        </Box>

        <TabPanel value={activeTab} index={0}>
          {isMyProfile ? (
            <NextLessonWidget 
                schedule={schedule}
                isLoading={loading.schedule}
                onEventSelect={setSelectedEvent}
            />
          ) : (
            <Typography sx={{ color: 'grey.500', textAlign: 'center', p: 4 }}>
              This is a public profile overview.
            </Typography>
          )}
        </TabPanel>

        {isMyProfile && profileUser.roles.some(r => ['student', 'user'].includes(r)) &&
            <TabPanel value={activeTab} index={1}>
                <LessonsList 
                    schedule={schedule}
                    isLoading={loading.schedule}
                    onEventSelect={setSelectedEvent}
                />
            </TabPanel>
        }
        
        <TabPanel value={activeTab} index={isMyProfile && profileUser.roles.some(r => ['student', 'user'].includes(r)) ? 2 : 1}>
           <Typography sx={{ color: 'grey.500', textAlign: 'center', p: 4 }}>
              Game statistics and analytics are coming soon!
            </Typography>
        </TabPanel>

        {isMyProfile && isEditing && (
          <EditProfileForm 
              user={profileUser} 
              onClose={() => {
                setIsEditing(false);
                refetchUser(); // Обновляем данные пользователя в контексте после редактирования
              }} 
          />
        )}
        
        {isMyProfile && (
             <HomeworkDialog 
                event={selectedEvent}
                open={!!selectedEvent}
                onClose={() => setSelectedEvent(null)}
                onSendHomework={handleSendHomework}
            />
        )}
      </Container>
    </Box>
  );
};