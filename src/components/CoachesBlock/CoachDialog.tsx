import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Typography,
    TextField,
    Button,
    Box,
  } from '@mui/material';
  import { useState } from 'react';
  import { useTranslation } from 'react-i18next';
  import { notification } from 'antd';
  
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
  
  interface Props {
    coach: Coach;
    open: boolean;
    onClose: () => void;
    onUpdated?: () => void;
  }
  
  export const CoachDialog: React.FC<Props> = ({ coach, open, onClose, onUpdated }) => {
    const { t } = useTranslation();
  
    const userEmail = localStorage.getItem('email');
    const isCurrentCoach = userEmail === coach.email;
  
    const [editMode, setEditMode] = useState(false);
    const [form, setForm] = useState({
      title: coach.coachProfile?.title || '',
      experience: coach.coachProfile?.experience || '',
      bio: coach.coachProfile?.bio || '',
      price: coach.coachProfile?.price?.toString() || '',
      services: (coach.coachProfile?.services || []).join(', '),
    });
  
    const handleChange = (field: string, value: string) => {
      setForm((prev) => ({ ...prev, [field]: value }));
    };
  
    const handleSave = async () => {
      try {
        const res = await fetch('/coach/profile', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
          body: JSON.stringify({
            title: form.title,
            experience: form.experience,
            bio: form.bio,
            price: parseFloat(form.price),
            services: form.services.split(',').map((s) => s.trim()),
          }),
        });
  
        if (!res.ok) throw new Error();
  
        notification.success({
            message: t('coaches.updated'),
            description: undefined
        });
        setEditMode(false);
        onUpdated?.();
        onClose();
      } catch {
        notification.error({
            message: t('coaches.updateFailed'),
            description: undefined
        });
      }
    };
  
    return (
      <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
        <DialogTitle>
          {coach.firstName} {coach.lastName}
        </DialogTitle>
        <DialogContent>
          {isCurrentCoach && editMode ? (
            <>
              <TextField
                fullWidth
                label={t('coaches.title')}
                margin="normal"
                value={form.title}
                onChange={(e) => handleChange('title', e.target.value)}
              />
              <TextField
                fullWidth
                label={t('coaches.experience')}
                margin="normal"
                value={form.experience}
                onChange={(e) => handleChange('experience', e.target.value)}
              />
              <TextField
                fullWidth
                label={t('coaches.bio')}
                multiline
                rows={3}
                margin="normal"
                value={form.bio}
                onChange={(e) => handleChange('bio', e.target.value)}
              />
              <TextField
                fullWidth
                label={t('coaches.price')}
                margin="normal"
                type="number"
                value={form.price}
                onChange={(e) => handleChange('price', e.target.value)}
              />
              <TextField
                fullWidth
                label={t('coaches.services')}
                margin="normal"
                helperText={t('coaches.servicesHint')}
                value={form.services}
                onChange={(e) => handleChange('services', e.target.value)}
              />
            </>
          ) : (
            <Box>
              <Typography gutterBottom>
                <b>{t('coaches.title')}:</b> {coach.coachProfile?.title || '—'}
              </Typography>
              <Typography gutterBottom>
                <b>{t('coaches.experience')}:</b> {coach.coachProfile?.experience || '—'}
              </Typography>
              <Typography gutterBottom>
                <b>{t('coaches.bio')}:</b> {coach.coachProfile?.bio || '—'}
              </Typography>
              <Typography gutterBottom>
                <b>{t('coaches.price')}:</b> {coach.coachProfile?.price || 0}$
              </Typography>
              <Typography gutterBottom>
                <b>{t('coaches.services')}:</b> {(coach.coachProfile?.services || []).join(', ') || '—'}
              </Typography>
              <Typography gutterBottom>
                <b>Email:</b> {coach.email}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          {isCurrentCoach && !editMode && (
            <Button onClick={() => setEditMode(true)} color="secondary">
              ✏ {t('coaches.editProfile')}
            </Button>
          )}
          {isCurrentCoach && editMode && (
            <>
              <Button onClick={() => setEditMode(false)}>{t('coaches.cancel')}</Button>
              <Button variant="contained" onClick={handleSave}>
                {t('coaches.save')}
              </Button>
            </>
          )}
          {!editMode && (
            <Button onClick={onClose}>
              {t('coaches.close')}
            </Button>
          )}
        </DialogActions>
      </Dialog>
    );
  };
  