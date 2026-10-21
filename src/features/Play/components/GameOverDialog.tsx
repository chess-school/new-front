import React from 'react';
import { Box, Button, Dialog, DialogActions, DialogContent, Stack, Typography } from '@mui/material';
import EmojiEventsRoundedIcon from '@mui/icons-material/EmojiEventsRounded';
import HandshakeRoundedIcon from '@mui/icons-material/HandshakeRounded';
import { useTranslation } from 'react-i18next';
import { Color, PlayGame } from '../playTypes';
import { tokens } from '@/theme/tokens';

interface GameOverDialogProps {
  open: boolean;
  game: PlayGame;
  myColor: Color | null;
  onClose: () => void;
  onRematch: () => void;
  rematchState: 'idle' | 'offered' | 'incoming';
  onAnalyze: () => void;
  onNewGame: () => void;
}

const REASON_FALLBACK: Record<string, string> = {
  checkmate: 'by checkmate', timeout: 'on time', resignation: 'by resignation', draw_agreement: 'by agreement',
  stalemate: 'stalemate', insufficient_material: 'insufficient material', threefold_repetition: 'threefold repetition',
  fifty_moves: 'fifty-move rule', aborted: 'game aborted',
};

/** Итог партии: победитель, причина, изменение рейтинга, реванш и анализ */
export const GameOverDialog: React.FC<GameOverDialogProps> = ({ open, game, myColor, onClose, onRematch, rematchState, onAnalyze, onNewGame }) => {
  const { t } = useTranslation();
  const aborted = game.status === 'aborted';
  const draw = game.winner === 'draw';
  const iWon = !!myColor && game.winner === myColor;
  const winnerName = game.winner === 'white' || game.winner === 'black' ? game[game.winner]?.firstName : null;
  const title = aborted
    ? t('play.over.aborted', 'Game aborted')
    : draw ? t('play.over.draw', 'Draw')
      : myColor ? (iWon ? t('play.over.youWon', 'You won!') : t('play.over.youLost', 'You lost'))
        : t('play.over.winner', { name: winnerName, defaultValue: '{{name}} won' });
  const reason = game.endReason ? t(`play.reason.${game.endReason}`, REASON_FALLBACK[game.endReason]) : '';
  const diff = (color: Color) => game.ratingChanges?.[color];

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth aria-labelledby="game-over-title">
      <DialogContent sx={{ textAlign: 'center', pt: 4 }}>
        <Box sx={{
          width: 64, height: 64, mx: 'auto', mb: 2, borderRadius: '50%', display: 'grid', placeItems: 'center',
          bgcolor: iWon ? tokens.accent.goldSoft : draw ? tokens.accent.blueSoft : 'surface.raised',
          color: iWon ? 'primary.main' : draw ? 'info.main' : 'text.secondary',
        }}>
          {draw ? <HandshakeRoundedIcon fontSize="large" /> : <EmojiEventsRoundedIcon fontSize="large" />}
        </Box>
        <Typography id="game-over-title" variant="h4" component="h2" data-testid="game-over-title">{title}</Typography>
        <Typography color="text.secondary" sx={{ mt: 0.5 }}>{reason}</Typography>
        {game.isRated && game.ratingChanges && !aborted && (
          <Stack direction="row" spacing={2} justifyContent="center" sx={{ mt: 3 }}>
            {(['white', 'black'] as const).map((color) => {
              const d = diff(color) ?? 0;
              return (
                <Box key={color} sx={{ flex: 1, p: 1.5, borderRadius: 2, bgcolor: 'surface.raised', border: 1, borderColor: color === myColor ? 'primary.main' : 'divider' }}>
                  <Typography variant="body2" noWrap>{game[color]?.firstName}</Typography>
                  <Typography sx={{ fontFamily: tokens.font.mono, fontWeight: 700 }}>
                    {game.ratings?.[color]?.after ?? '—'}
                    <Box component="span" data-testid={`delta-${color}`} sx={{ ml: 1, color: d > 0 ? 'success.main' : d < 0 ? 'error.main' : 'text.secondary' }}>
                      {d > 0 ? `+${d}` : d}
                    </Box>
                  </Typography>
                </Box>
              );
            })}
          </Stack>
        )}
        {!game.isRated && !aborted && <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>{t('play.casualNoRating', 'Casual game — ratings unchanged')}</Typography>}
      </DialogContent>
      <DialogActions sx={{ flexDirection: 'column', gap: 1, px: 3, pb: 3, '& > :not(style) ~ :not(style)': { ml: 0 } }}>
        {myColor && (
          <Button fullWidth variant="contained" onClick={onRematch} disabled={rematchState === 'offered'}>
            {rematchState === 'incoming' ? t('play.acceptRematch', 'Accept rematch') : rematchState === 'offered' ? t('play.rematchSent', 'Rematch offered…') : t('play.rematch', 'Rematch')}
          </Button>
        )}
        <Button fullWidth variant="outlined" color="inherit" onClick={onAnalyze} disabled={game.moves.length === 0}>
          {t('play.analyze', 'Analyze with Stockfish')}
        </Button>
        <Button fullWidth color="inherit" onClick={onNewGame}>{t('play.newGame', 'New game')}</Button>
      </DialogActions>
    </Dialog>
  );
};
