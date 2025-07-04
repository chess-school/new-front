import React, { useState, useEffect } from 'react';
import {
  Container, Typography, Grid, Card, CardContent, Button, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, Select, MenuItem, InputLabel,
  FormControl, Divider, Box, Stack, Chip, Avatar, IconButton, InputAdornment, Paper,
  CardMedia
} from '@mui/material';
import { getCoaches } from '@/api/coaches';
import { notification } from 'antd';
import { useTranslation } from 'react-i18next';
import { createRequest } from '@/api/requests';

// Icons
import WorkHistoryIcon from '@mui/icons-material/WorkHistory';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import CloseIcon from '@mui/icons-material/Close';
import EditIcon from '@mui/icons-material/Edit';
import SendIcon from '@mui/icons-material/Send';
import SearchIcon from '@mui/icons-material/Search';

interface Coach {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  photoUrl?: string;
  coachProfile?: {
    title?: string;
    experience?: string;
    bio?: string;
    price?: number;
    services?: string[];
  };
}

// Helper for styling form inputs
const formInputStyles = {
  '& .MuiInputBase-root': {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    '&:hover': {
      backgroundColor: 'rgba(255, 255, 255, 0.12)',
    }
  },
  '& .MuiInputLabel-root': {
    color: 'rgba(255, 255, 255, 0.6)'
  },
  '& .MuiInputBase-input': {
    color: 'white'
  },
   '& .MuiSelect-icon': {
    color: 'rgba(255, 255, 255, 0.6)'
  }
};


export const CoachesPage: React.FC = () => {
  const { t } = useTranslation();
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [selectedCoach, setSelectedCoach] = useState<Coach | null>(null);
  const [filter, setFilter] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  const currentUserEmail = localStorage.getItem('email');

  const [formValues, setFormValues] = useState({
    userName: '',
    userEmail: '',
    experienceLevel: 'Intermediate', // Using a key for state
    goals: '',
  });

  const [editProfile, setEditProfile] = useState({
    title: '',
    experience: '',
    bio: '',
    price: '',
    services: '',
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getCoaches();
        setCoaches(data);
      } catch (error) {
        notification.error({
          message: t('coaches.fetchError'),
          description: undefined
        });
      }
    };
    fetchData();
  }, [t]);

  const handleOpenDialog = (coach: Coach) => {
    setSelectedCoach(coach);
    setIsDialogOpen(true);
    setShowForm(false);
    setIsEditMode(false);

    setEditProfile({
      title: coach.coachProfile?.title || '',
      experience: coach.coachProfile?.experience || '',
      bio: coach.coachProfile?.bio || '',
      price: coach.coachProfile?.price?.toString() || '',
      services: (coach.coachProfile?.services || []).join(', '),
    });
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setTimeout(() => {
      setSelectedCoach(null);
      setShowForm(false);
      setIsEditMode(false);
      setFormValues({ userName: '', userEmail: '', experienceLevel: 'Intermediate', goals: '' });
    }, 300);
  };

  const handleSendRequest = async () => {
    if (!selectedCoach) return;
    
    try {
      setIsLoading(true);
      await createRequest(selectedCoach._id, formValues.experienceLevel, formValues.goals);
      notification.success({
        message: t('coaches.successMessage'),
        description: undefined
      });
      handleCloseDialog();
    } catch (error) {
      notification.error({
        message: t('coaches.submitError'),
        description: undefined
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveEdit = async () => {
    console.log("Saving profile:", editProfile);
    notification.success({
      message: t('coaches.updated'),
      description: undefined
    });
    handleCloseDialog();
  };

  const filteredCoaches = coaches.filter((c) =>
    `${c.firstName} ${c.lastName}`.toLowerCase().includes(filter.toLowerCase())
  );

  const coachName = selectedCoach ? `${selectedCoach.firstName} ${selectedCoach.lastName}` : '';
  
  return (
    <Box sx={{ bgcolor: '#0e0e0e', color: 'white', minHeight: '100vh', py: 8 }}>
      <Container maxWidth="lg">
        <Box sx={{ textAlign: 'center', mb: 8 }}>
          <Typography variant="h2" component="h1" fontWeight="bold">{t('coaches.title')}</Typography>
          <Typography variant="h6" sx={{ mt: 1, color: 'rgba(255, 255, 255, 0.7)' }}>
            {t('coaches.subtitle')}
          </Typography>
        </Box>

        <Box sx={{ mb: 5, maxWidth: '600px', mx: 'auto' }}>
          <TextField
            fullWidth
            variant="outlined"
            placeholder={t('coaches.searchByName')}
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: '30px',
                backgroundColor: '#1c1c1c',
                '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.2)' },
                '&:hover fieldset': { borderColor: '#FFD700' },
                '&.Mui-focused fieldset': { borderColor: '#FFD700' },
              },
              '& .MuiInputBase-input': { color: 'white' },
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: 'rgba(255, 255, 255, 0.5)' }} />
                </InputAdornment>
              ),
            }}
          />
        </Box>

        <Grid container spacing={4}>
          {filteredCoaches.map((coach) => (
            <Grid item xs={12} sm={6} md={4} key={coach._id}>
              <Card sx={{
                bgcolor: '#1c1c1c',
                color: 'white',
                borderRadius: 4,
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-8px)',
                  boxShadow: '0 12px 24px rgba(255, 215, 0, 0.2)'
                }
              }}>
                <CardMedia
                  component="img"
                  height="250"
                  image={coach.photoUrl || '/images/default-avatar.png'}
                  alt={`${coach.firstName} ${coach.lastName}`}
                />
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography variant="h5" component="div" fontWeight="bold">
                    {coach.firstName} {coach.lastName}
                  </Typography>
                  <Typography variant="body1" sx={{ color: '#FFD700', mb: 2 }}>
                    {coach.coachProfile?.title || 'Chess Master'}
                  </Typography>
                  <Stack spacing={1}>
                    <Box sx={{ display: 'flex', alignItems: 'center', color: 'rgba(255,255,255,0.7)' }}>
                      <WorkHistoryIcon fontSize="small" sx={{ mr: 1 }} />
                      <Typography variant="body2">{coach.coachProfile?.experience || 'N/A'}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', color: 'rgba(255,255,255,0.7)' }}>
                      <AttachMoneyIcon fontSize="small" sx={{ mr: 1 }} />
                      <Typography variant="body2">{coach.coachProfile?.price ? `${coach.coachProfile.price}$ / hour` : 'Contact for price'}</Typography>
                    </Box>
                  </Stack>
                </CardContent>
                <Box sx={{ p: 2, pt: 0 }}>
                  <Button
                    variant="contained"
                    fullWidth
                    onClick={() => handleOpenDialog(coach)}
                    sx={{ 
                      backgroundColor: '#FFD700', color: 'black', fontWeight: 'bold', borderRadius: '20px',
                      '&:hover': { backgroundColor: '#FFC107' }
                    }}
                  >
                    {t('coaches.viewProfile')}
                  </Button>
                </Box>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* --- DIALOG MODAL - KEY CHANGES BELOW --- */}
        <Dialog open={isDialogOpen} onClose={handleCloseDialog} fullWidth maxWidth="md" PaperProps={{
          sx: { bgcolor: '#1c1c1c', color: 'white', borderRadius: 4, backgroundImage: 'none' }
        }}>
          {selectedCoach && ( // Ensure selectedCoach exists before rendering
          <>
            <DialogTitle sx={{ p: 3, pb: 1 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="h5" fontWeight="bold">
                  {isEditMode ? t('coaches.editProfile') : t('coaches.profileOf', { coachName })}
                </Typography>
                <IconButton onClick={handleCloseDialog} sx={{ color: 'rgba(255,255,255,0.7)' }}>
                  <CloseIcon />
                </IconButton>
              </Stack>
            </DialogTitle>
            <DialogContent>
              {isEditMode ? (
                <Stack spacing={2} sx={{ pt: 1 }}>
                  {/* Edit form remains the same */}
                </Stack>
              ) : (
                <>
                  <Grid container spacing={4} sx={{ pt: 1 }}>
                    <Grid item xs={12} md={4}>
                      <Avatar src={selectedCoach.photoUrl || '/images/default-avatar.png'} sx={{ width: '100%', height: 'auto', aspectRatio: '1 / 1', borderRadius: 3 }} variant="rounded" />
                    </Grid>
                    <Grid item xs={12} md={8}>
                      <Stack spacing={2.5}>
                        <Box>
                          <Typography fontWeight="bold" color="#FFD700">{t('coaches.bio')}</Typography>
                          <Typography sx={{ color: 'rgba(255,255,255,0.8)', whiteSpace: 'pre-wrap' }}>
                            {selectedCoach.coachProfile?.bio || <span style={{ color: 'rgba(255,255,255,0.5)', fontStyle: 'italic' }}>No bio provided.</span>}
                          </Typography>
                        </Box>
                        <Box>
                          <Typography fontWeight="bold" color="#FFD700">{t('coaches.services')}</Typography>
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                            {selectedCoach.coachProfile?.services?.length ? selectedCoach.coachProfile.services.map(s => <Chip key={s} label={s} sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }}/>) : <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontStyle: 'italic' }}>No services listed.</Typography>}
                          </Box>
                        </Box>
                      </Stack>
                    </Grid>
                  </Grid>

                  <Divider sx={{ my: 3, borderColor: 'rgba(255,255,255,0.2)' }} />
                  
                  <Box>
                    {!showForm ? (
                      <Button fullWidth variant="outlined" onClick={() => setShowForm(true)} sx={{ color: '#FFD700', borderColor: '#FFD700', '&:hover': { borderColor: '#FFC107', bgcolor: 'rgba(255, 215, 0, 0.1)' }}}>
                        {t('coaches.requestTitle', { coachName: selectedCoach.firstName })}
                      </Button>
                    ) : (
                      <Paper elevation={0} sx={{ p: {xs: 2, sm: 3}, bgcolor: 'rgba(0,0,0,0.25)', borderRadius: 2 }}>
                        <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
                          {t('coaches.requestTitle', { coachName })}
                        </Typography>
                        <Stack spacing={2}>
                          <TextField fullWidth label={t('coaches.yourName')} value={formValues.userName} onChange={(e) => setFormValues({ ...formValues, userName: e.target.value })} variant="filled" sx={formInputStyles} />
                          <TextField fullWidth label={t('coaches.yourEmail')} value={formValues.userEmail} onChange={(e) => setFormValues({ ...formValues, userEmail: e.target.value })} variant="filled" sx={formInputStyles} />
                          <FormControl fullWidth variant="filled" sx={formInputStyles}>
                            <InputLabel id="level-select-label">{t('coaches.level')}</InputLabel>
                            <Select
                              labelId="level-select-label"
                              value={formValues.experienceLevel}
                              onChange={(e) => setFormValues({ ...formValues, experienceLevel: e.target.value })}
                            >
                              <MenuItem value="Beginner">{t('coaches.levelBeginner')}</MenuItem>
                              <MenuItem value="Intermediate">{t('coaches.levelIntermediate')}</MenuItem>
                              <MenuItem value="Advanced">{t('coaches.levelAdvanced')}</MenuItem>
                            </Select>
                          </FormControl>
                          <TextField fullWidth multiline rows={3} label={t('coaches.goals')} value={formValues.goals} onChange={(e) => setFormValues({ ...formValues, goals: e.target.value })} variant="filled" sx={formInputStyles} />
                        </Stack>
                      </Paper>
                    )}
                  </Box>
                </>
              )}
            </DialogContent>
            <DialogActions sx={{ p: 3, pt: 2 }}>
              {isEditMode ? (
                <>
                  <Button onClick={() => setIsEditMode(false)} sx={{ color: 'rgba(255,255,255,0.7)' }}>{t('coaches.cancel')}</Button>
                  <Button variant="contained" onClick={handleSaveEdit} startIcon={<EditIcon />} sx={{ bgcolor: '#FFD700', color: 'black', '&:hover': { bgcolor: '#FFC107' } }}>{t('coaches.save')}</Button>
                </>
              ) : showForm ? (
                <>
                  <Button variant="outlined" onClick={() => setShowForm(false)} sx={{ color: 'rgba(255,255,255,0.7)', borderColor: 'rgba(255,255,255,0.3)' }}>
                    {t('coaches.cancel')}
                  </Button>
                  <Button variant="contained" onClick={handleSendRequest} disabled={isLoading} startIcon={<SendIcon />} sx={{ bgcolor: '#FFD700', color: 'black', '&:hover': { bgcolor: '#FFC107' } }}>
                    {t('coaches.sendRequest')}
                  </Button>
                </>
              ) : (
                selectedCoach.email === currentUserEmail && (
                  <Button variant="text" onClick={() => setIsEditMode(true)} startIcon={<EditIcon />} sx={{ color: '#FFD700' }}>
                    {t('coaches.editProfile')}
                  </Button>
                )
              )}
            </DialogActions>
          </>
          )}
        </Dialog>
      </Container>
    </Box>
  );
};