import React from 'react';
import { Paper, Grid, Box, Typography } from '@mui/material';

export interface AnnotatedMove {
  san: string;
  evaluation?: number;
}

interface MoveHistoryProps {
  history: AnnotatedMove[];
  currentMoveIndex: number;
  onMoveClick: (moveIndex: number) => void;
}

const getEvaluationSymbol = (evaluation?: number): string => {
  if (evaluation === undefined) return '';
  const evalAbs = Math.abs(evaluation);

  if (evalAbs < 0.4) return ' =';
  if (evalAbs < 1.0) return evaluation > 0 ? ' += ' : ' -= ';
  if (evalAbs < 2.0) return evaluation > 0 ? ' ±' : ' ∓';
  return evaluation > 0 ? ' +-' : ' -+';
};

const getSymbolColor = (evaluation?: number): string => {
    if (evaluation === undefined) return 'text.secondary';
    if (Math.abs(evaluation) < 0.4) return 'text.secondary';
    return evaluation > 0 ? 'success.light' : 'error.light';
};

export const MoveHistory: React.FC<MoveHistoryProps> = ({
  history,
  currentMoveIndex,
  onMoveClick,
}) => {
  const movePairs = React.useMemo(() => {
    const pairs: { white: AnnotatedMove; black: AnnotatedMove | null }[] = [];
    for (let i = 0; i < history.length; i += 2) {
      pairs.push({ white: history[i], black: history[i + 1] || null });
    }
    return pairs;
  }, [history]);

  return (
    <Paper variant="outlined" sx={{ p: 1.5, height: '100%', overflowY: 'auto', bgcolor: '#1c1c1c', borderColor: 'rgba(255,255,255,0.2)' }}>
      <Grid container rowSpacing={0.5} columnSpacing={1} sx={{ fontSize: '1rem', color: 'white' }}>
        {movePairs.map((pair, index) => {
          const whiteMoveIndex = index * 2 + 1;
          const blackMoveIndex = index * 2 + 2;

          return (
            <React.Fragment key={index}>
              <Grid item xs={2} sx={{ color: 'rgba(255, 255, 255, 0.6)', textAlign: 'right', pt: '4px' }}>
                {index + 1}.
              </Grid>
              <Grid item xs={5}>
                <Box
                  onClick={() => onMoveClick(whiteMoveIndex)}
                  sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer', p: '2px 5px', borderRadius: '4px', bgcolor: currentMoveIndex === whiteMoveIndex ? 'rgba(255, 215, 0, 0.3)' : 'transparent', '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' } }}
                >
                  <Typography component="span">{pair.white.san}</Typography>
                  <Typography component="span" sx={{ color: getSymbolColor(pair.white.evaluation), fontWeight: 'bold', ml: 0.5 }}>
                    {getEvaluationSymbol(pair.white.evaluation)}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={5}>
                {pair.black && (
                  <Box
                    onClick={() => onMoveClick(blackMoveIndex)}
                    sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer', p: '2px 5px', borderRadius: '4px', bgcolor: currentMoveIndex === blackMoveIndex ? 'rgba(255, 215, 0, 0.3)' : 'transparent', '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' } }}
                  >
                    <Typography component="span">{pair.black.san}</Typography>
                    <Typography component="span" sx={{ color: getSymbolColor(pair.black.evaluation), fontWeight: 'bold', ml: 0.5 }}>
                        {getEvaluationSymbol(pair.black.evaluation)}
                    </Typography>
                  </Box>
                )}
              </Grid>
            </React.Fragment>
          );
        })}
      </Grid>
    </Paper>
  );
};