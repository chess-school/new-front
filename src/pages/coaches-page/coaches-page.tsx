import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Paper,
  Button,
  // Dialog,
  // DialogTitle,
  // DialogContent,
  // DialogActions,
  Drawer,
  TextField,
  Slider,
  Checkbox,
  FormControlLabel,
  CircularProgress,
  IconButton,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { getCoaches } from '@/api/coaches';
import { notification } from 'antd';
import CloseIcon from '@mui/icons-material/Close';
import { createRequest } from '@/api/requests';
import { createNotification } from '@/api/notifications';

interface Coach {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
}

export const CoachesPage: React.FC = () => {
  const { t } = useTranslation();
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [openDrawer, setOpenDrawer] = useState(false);
  const [selectedCoach, setSelectedCoach] = useState<Coach | null>(null);
  const [formValues, setFormValues] = useState({
    experience: 0,
    goals: '',
    certifications: false,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [submittedRequests, setSubmittedRequests] = useState<string[]>([]);

  const fetchCoaches = async () => {
    try {
      setIsLoading(true);
      const data = await getCoaches();
      setCoaches(data);
    } catch (error) {
      notification.error({
        message: t('coaches.fetchError'),
        description: undefined,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleApply = (coach: Coach) => {
    setSelectedCoach(coach);
    setOpenDrawer(true);
  };

  const handleCloseDrawer = () => {
    setOpenDrawer(false);
    setSelectedCoach(null);
    setFormValues({ experience: 0, goals: '', certifications: false });
    setSuccessMessage(null);
  };

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = event.target;
    setFormValues((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSliderChange = (event: Event, newValue: number | number[]) => {
    setFormValues((prev) => ({ ...prev, experience: newValue as number }));
  };

  const handleSubmitRequest = async () => {
    if (!selectedCoach) return;

    try {
      setIsLoading(true);
      await createRequest(
        selectedCoach._id,
        formValues.experience.toString(),
        `${formValues.goals}${formValues.certifications ? ' (Certified)' : ''}`
      );
      await createNotification({
        recipient: selectedCoach._id,
        type: 'request',
        content: `Новая заявка получена.`,
      });
      setSuccessMessage(t('coaches.successMessage'));
      setSubmittedRequests((prev) => [...prev, selectedCoach._id]);
    } catch (error) {
      notification.error({
        message: t('coaches.submitError'),
        description: t('coaches.submitErrorDescription'),
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCoaches();
  }, []);

  return (
    <Container>
      <Typography variant="h4" gutterBottom>
        {t('coaches.title')}
      </Typography>
      {isLoading ? (
        <CircularProgress />
      ) : (
        <Paper>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>{t('coaches.tableHeaders.firstName')}</TableCell>
                <TableCell>{t('coaches.tableHeaders.lastName')}</TableCell>
                <TableCell>{t('coaches.tableHeaders.email')}</TableCell>
                <TableCell>{t('coaches.tableHeaders.actions')}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {coaches.map((coach) => (
                <TableRow key={coach._id}>
                  <TableCell>{coach.firstName}</TableCell>
                  <TableCell>{coach.lastName}</TableCell>
                  <TableCell>{coach.email}</TableCell>
                  <TableCell>
                    {submittedRequests.includes(coach._id) ? (
                      <Typography color="primary">{t('coaches.requestSent')}</Typography>
                    ) : (
                      <Button
                        variant="contained"
                        color="primary"
                        onClick={() => handleApply(coach)}
                      >
                        {t('coaches.apply')}
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>
      )}

      <Drawer anchor="right" open={openDrawer} onClose={handleCloseDrawer}>
        <div style={{ width: 350, padding: '16px' }}>
          <IconButton onClick={handleCloseDrawer} style={{ float: 'right' }}>
            <CloseIcon />
          </IconButton>
          <Typography variant="h6" gutterBottom>
            {t('coaches.dialog.title')}
          </Typography>
          <Typography gutterBottom>
            {t('coaches.dialog.coach')}: {selectedCoach?.firstName} {selectedCoach?.lastName}
          </Typography>
          <Typography gutterBottom>
            {t('coaches.dialog.email')}: {selectedCoach?.email}
          </Typography>

          <Typography gutterBottom>{t('coaches.dialog.experience')}</Typography>
          <Slider
            value={formValues.experience}
            onChange={handleSliderChange}
            step={1}
            marks
            min={0}
            max={20}
            valueLabelDisplay="auto"
          />

          <TextField
            label={t('coaches.dialog.goals')}
            name="goals"
            value={formValues.goals}
            onChange={handleChange}
            fullWidth
            margin="normal"
          />

          <FormControlLabel
            control={
              <Checkbox
                name="certifications"
                checked={formValues.certifications}
                onChange={handleChange}
              />
            }
            label={t('coaches.dialog.certified')}
          />

          {successMessage && (
            <Typography color="primary" gutterBottom>
              {successMessage}
            </Typography>
          )}

          <Button
            onClick={handleSubmitRequest}
            color="primary"
            variant="contained"
            fullWidth
            style={{ marginTop: '16px' }}
            disabled={isLoading || !!successMessage}
          >
            {t('coaches.dialog.submit')}
          </Button>
        </div>
      </Drawer>
    </Container>
  );
};
