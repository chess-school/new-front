// src/components/OpeningMoveBar.tsx
import React from 'react';
import { Typography, Box, Grid } from '@mui/material';
import { IOpeningMove } from '@/types/Opening'; 

interface OpeningMoveBarProps {
  moveData: IOpeningMove;
  totalGames: number;
  onMoveClick: (san: string) => void;
}

export const OpeningMoveBar: React.FC<OpeningMoveBarProps> = ({ moveData, totalGames, onMoveClick }) => {
  if (totalGames === 0 || moveData.games === 0) return null;

  const { san, games, wins, draws } = moveData;
  const winPercent = (wins / games) * 100;
  const drawPercent = (draws / games) * 100;
  
  return (
    <Box 
        onClick={() => onMoveClick(san)} 
        sx={{ 
            p: 1, borderRadius: '4px', cursor: 'pointer',
            '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.08)' }, mb: 0.5
        }}>
        <Grid container alignItems="center" spacing={2}>
            <Grid item xs={3}><Typography fontWeight="bold" noWrap color="white">{san}</Typography></Grid>
            <Grid item xs={3} sx={{ textAlign: 'right' }}><Typography variant="body2" color="rgba(255, 255, 255, 0.7)">{games.toLocaleString()}</Typography></Grid>
            <Grid item xs={6}>
                <Box
                    sx={{
                        width: '100%', height: '20px', backgroundColor: '#424242', // Более темный фон для лучшего контраста
                        display: 'flex', borderRadius: '4px', overflow: 'hidden'
                    }}>
                    {/* Белая полоса для побед */}
                    <Box sx={{ width: `${winPercent}%`, bgcolor: '#e0e0e0' }} /> 
                    {/* Серая полоса для ничьих */}
                    <Box sx={{ width: `${drawPercent}%`, bgcolor: '#8c8c8c' }} />
                </Box>
            </Grid>
        </Grid>
    </Box>
  );
};