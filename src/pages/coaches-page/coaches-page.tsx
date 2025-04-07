import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Button,
  TextField,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { getCoaches } from '@/api/coaches';
import { notification } from 'antd';

interface Coach {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  experience: number;
  specialization: string;
  photoUrl?: string;
}

export const CoachesPage: React.FC = () => {
  const { t } = useTranslation();
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedCoach, setSelectedCoach] = useState<Coach | null>(null);
  const [filter, setFilter] = useState('');
  const [formValues, setFormValues] = useState({
    userName: '',
    userEmail: '',
    experienceLevel: 'Новичок',
    goals: '',
  });
  const [isLoading, setIsLoading] = useState(false);

  const fetchCoaches = async () => {
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

  useEffect(() => {
    fetchCoaches();
  }, []);

  const handleOpenDialog = (coach: Coach) => {
    setSelectedCoach(coach);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedCoach(null);
    setFormValues({
      userName: '',
      userEmail: '',
      experienceLevel: 'Новичок',
      goals: '',
    });
  };

  const handleSubmitRequest = async () => {
    if (!selectedCoach) return;

    try {
      setIsLoading(true);
      // Вызов API для отправки заявки (замените на реальную функцию)
      // await sendRequest(formValues, selectedCoach._id);
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

  return (
    <Container>
      <Typography variant="h3" align="center" gutterBottom>
        {t('coaches.title')}
      </Typography>
      <Typography variant="subtitle1" align="center" color="textSecondary" gutterBottom>
        {t('coaches.subtitle')}
      </Typography>

      {/* Фильтр */}
      <Grid container spacing={2} alignItems="center" style={{ marginBottom: '16px' }}>
        <Grid item xs={10}>
          <TextField
            fullWidth
            variant="outlined"
            placeholder={t('coaches.searchPlaceholder')}
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
        </Grid>
        <Grid item xs={2}>
          <Button fullWidth variant="outlined" onClick={() => setFilter('')}>
            {t('coaches.clearFilter')}
          </Button>
        </Grid>
      </Grid>

      {/* Карточки тренеров */}
      <Grid container spacing={3}>
        {coaches
          .filter((coach) =>
            `${coach.firstName} ${coach.lastName}`
              .toLowerCase()
              .includes(filter.toLowerCase())
          )
          .map((coach) => (
            <Grid item xs={12} sm={6} md={4} key={coach._id}>
              <Card style={{ position: 'relative', overflow: 'hidden' }}>
                <CardMedia
                  component="img"
                  alt={`${coach.firstName} ${coach.lastName}`}
                  height="200"
                  image={coach.photoUrl || 'https://via.placeholder.com/150'}
                  style={{ objectFit: 'cover' }}
                />
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    {coach.firstName} {coach.lastName}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    {t('coaches.experience')}: {coach.experience} {t('coaches.years')}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    {t('coaches.specialization')}: {coach.specialization}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    {t('coaches.email')}: {coach.email}
                  </Typography>
                </CardContent>
                <Button
                  variant="contained"
                  color="primary"
                  style={{ margin: '8px' }}
                  onClick={() => handleOpenDialog(coach)}
                >
                  {t('coaches.more')}
                </Button>
              </Card>
            </Grid>
          ))}
      </Grid>

      {/* Диалоговое окно */}
      <Dialog open={openDialog} onClose={handleCloseDialog} fullWidth maxWidth="sm">
        <DialogTitle>
          {t('coaches.requestTitle')} {selectedCoach?.firstName} {selectedCoach?.lastName}
        </DialogTitle>
        <DialogContent>
          <Typography variant="subtitle2" gutterBottom>
            {t('coaches.email')}: {selectedCoach?.email}
          </Typography>
          <FormControl fullWidth margin="normal">
            <TextField
              label={t('coaches.userName')}
              value={formValues.userName}
              onChange={(e) => setFormValues((prev) => ({ ...prev, userName: e.target.value }))}
            />
          </FormControl>
          <FormControl fullWidth margin="normal">
            <TextField
              label={t('coaches.userEmail')}
              value={formValues.userEmail}
              onChange={(e) => setFormValues((prev) => ({ ...prev, userEmail: e.target.value }))}
            />
          </FormControl>
          <FormControl fullWidth margin="normal">
            <InputLabel>{t('coaches.level')}</InputLabel>
            <Select
              value={formValues.experienceLevel}
              onChange={(e) =>
                setFormValues((prev) => ({ ...prev, experienceLevel: e.target.value }))
              }
            >
              <MenuItem value="Новичок">{t('coaches.levelBeginner')}</MenuItem>
              <MenuItem value="Средний уровень">{t('coaches.levelIntermediate')}</MenuItem>
              <MenuItem value="Профессионал">{t('coaches.levelAdvanced')}</MenuItem>
            </Select>
          </FormControl>
          <TextField
            fullWidth
            multiline
            rows={4}
            label={t('coaches.goals')}
            value={formValues.goals}
            onChange={(e) => setFormValues((prev) => ({ ...prev, goals: e.target.value }))}
            margin="normal"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} color="secondary">
            {t('coaches.cancel')}
          </Button>
          <Button
            onClick={handleSubmitRequest}
            color="primary"
            variant="contained"
            disabled={isLoading}
          >
            {t('coaches.submit')}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};
