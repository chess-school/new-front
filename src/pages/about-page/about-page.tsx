import React from 'react';
import { Container, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';

export const About: React.FC = () => {
    const { t } = useTranslation();
  return (
    <Container>
      <Typography variant="h3" gutterBottom>
        {t('aboutPage.title')}
      </Typography>
      <Typography variant="subtitle1">
        Chess School - это лучшая школа для обучения шахматам. Мы объединяем лучших тренеров и игроков для вашего развития.
      </Typography>
    </Container>
  );
};
