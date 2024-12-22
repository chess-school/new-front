import React from 'react';
import { Container, Typography } from '@mui/material';

export const Home: React.FC = () => {
  return (
    <Container>
      <Typography variant="h3" gutterBottom>
        Добро пожаловать в Chess School!
      </Typography>
      <Typography variant="subtitle1">
        Мы поможем вам стать лучшим игроком в шахматы. Присоединяйтесь к нам и начните свой путь к успеху!
      </Typography>
    </Container>
  );
};
