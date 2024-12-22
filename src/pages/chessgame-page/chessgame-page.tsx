import React from 'react';
import { useChess } from '../../context/ChessContext';
import ChessBoard from '../../components/ChessGame/ChessBoard';
import { Button, Stack, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import MoveHistory from '../../components/ChessGame/MoveHistory';
import { Square } from 'chess.js';

export const GamePage: React.FC = () => {
  const { fen, makeMove, resetGame, history, isGameOver } = useChess();
  const navigate = useNavigate();

  const handleAnalyze = () => {
    navigate('/analysis', { state: { history } });
  };

  return (
    <div>
      <Typography variant="h4">Игра между двумя игроками</Typography>
      <Stack direction="row" spacing={4}>
        <div>
          <ChessBoard
            position={fen}
            onMove={(source, target) => makeMove(source as Square, target as Square)}
          />
          <Button onClick={resetGame} style={{ marginTop: '20px' }}>
            Сбросить игру
          </Button>

          {isGameOver() && (
            <Button
              onClick={handleAnalyze}
              variant="contained"
              color="primary"
              style={{ marginTop: '20px' }}
            >
              Анализировать
            </Button>
          )}
        </div>
        <div>
          <Typography variant="h6">История ходов</Typography>
          <MoveHistory history={history} />
        </div>
      </Stack>
    </div>
  );
};
