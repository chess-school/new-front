import React from 'react';
import { Container, Typography } from '@mui/material';

export const Achievements: React.FC = () => {
  return (
    <Container>
      <Typography variant="h3" gutterBottom>
        Наши успехи
      </Typography>
      <Typography variant="subtitle1">
        Мы гордимся нашими учениками, которые добились огромных успехов в мире шахмат.
      </Typography>
    </Container>
  );
};
