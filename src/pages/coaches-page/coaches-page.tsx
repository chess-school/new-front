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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { getCoaches, createRequest } from '@/api/coaches';
import { notification } from 'antd';

interface Coach {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
}

export const CoachesPage: React.FC = () => {
  const { t } = useTranslation();
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedCoach, setSelectedCoach] = useState<Coach | null>(null);
  const [formValues, setFormValues] = useState({
    experience: '',
    goals: '',
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
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedCoach(null);
    setFormValues({ experience: '', goals: '' });
    setSuccessMessage(null);
  };

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setFormValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmitRequest = async () => {
    if (!selectedCoach) return;

    try {
      setIsLoading(true);
      await createRequest(selectedCoach._id, formValues.experience, formValues.goals);
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

      <Dialog open={openDialog} onClose={handleCloseDialog}>
        <DialogTitle>{t('coaches.dialog.title')}</DialogTitle>
        <DialogContent>
          <Typography gutterBottom>
            {t('coaches.dialog.coach')}: {selectedCoach?.firstName} {selectedCoach?.lastName}
          </Typography>
          <TextField
            label={t('coaches.dialog.experience')}
            name="experience"
            value={formValues.experience}
            onChange={handleChange}
            fullWidth
            margin="normal"
          />
          <TextField
            label={t('coaches.dialog.goals')}
            name="goals"
            value={formValues.goals}
            onChange={handleChange}
            fullWidth
            margin="normal"
          />
          {successMessage && (
            <Typography color="primary" gutterBottom>
              {successMessage}
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} color="secondary">
            {t('coaches.dialog.cancel')}
          </Button>
          <Button
            onClick={handleSubmitRequest}
            color="primary"
            variant="contained"
            disabled={isLoading || !!successMessage}
          >
            {t('coaches.dialog.submit')}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};
