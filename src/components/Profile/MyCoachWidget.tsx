import React from 'react';
import { Paper, Skeleton, Stack, Box, Typography, Avatar } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { User } from '@/types/User';
import { getAvatarUrl } from '@/api/profile';

interface MyCoachWidgetProps {
  coach: User | null;
  isLoading: boolean;
}

export const MyCoachWidget: React.FC<MyCoachWidgetProps> = ({ coach, isLoading }) => {
  if (isLoading) return <Paper sx={{ p: 2, height: '100%' }}><Skeleton variant="rectangular" height={60} /></Paper>;
  if (!coach) return null;

  return (
    <Paper component={RouterLink} to={`/profile/${coach._id}`} sx={{ p: 2, color: 'text.primary', height: '100%', display: 'block', textDecoration: 'none', transition: 'transform 0.2s, border-color 0.2s', '&:hover': { transform: 'translateY(-2px)', borderColor: 'rgba(227,179,65,0.35)' } }}>
      <Stack direction="row" spacing={2} alignItems="center">
        <Avatar src={getAvatarUrl(coach._id)} sx={{ width: 56, height: 56 }}/>
        <Box>
          <Typography variant="body2" color="text.secondary">Your Coach</Typography>
          <Typography variant="h6" fontWeight={500}>{coach.firstName} {coach.lastName}</Typography>
        </Box>
      </Stack>
    </Paper>
  );
};