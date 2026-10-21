import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Alert, Box, Button, Chip, CircularProgress, IconButton, Paper, Stack, Tooltip, Typography, useMediaQuery, useTheme,
} from '@mui/material';
import FlagRoundedIcon from '@mui/icons-material/FlagRounded';
import HandshakeRoundedIcon from '@mui/icons-material/HandshakeRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import SwapVertRoundedIcon from '@mui/icons-material/SwapVertRounded';
import VolumeUpRoundedIcon from '@mui/icons-material/VolumeUpRounded';
import VolumeOffRoundedIcon from '@mui/icons-material/VolumeOffRounded';
import ContentCopyRoundedIcon from '@mui/icons-material/ContentCopyRounded';
import { Chess } from 'chess.js';
import { notification } from 'antd';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/context/AuthContext';
import { ChessBoard } from '@/features/Chess/components/ChessBoard';
import { ResizableBoard } from '@/features/Chess/components/ResizableBoard';
import { PageContainer } from '@/shared/components/ui/PageHeader';
import { tokens } from '@/theme/tokens';
import { usePlaySocket } from '../usePlaySocket';
import { usePlayGame } from '../usePlayGame';
import { acceptChallenge, cancelChallenge, errorCode } from '../playApi';
import { PlayerBar } from '../components/PlayerBar';
import { GameOverDialog } from '../components/GameOverDialog';
import { timeControlLabel } from '../clock';
import { isMuted, setMuted } from '../sounds';
import { Color } from '../playTypes';

const opposite = (c: Color): Color => (c === 'white' ? 'black' : 'white');

/** Позиция после ply полуходов (просмотр прошлых ходов во время партии) */
const fenAtPly = (sanMoves: string[], ply: number) => {
  const chess = new Chess();
  for (const san of sanMoves.slice(0, ply)) chess.move(san);
  return chess.fen();
};

export const PlayGamePage: React.FC = () => {
  const { gameId = '' } = useParams();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const theme = useTheme();
  const wide = useMediaQuery(theme.breakpoints.up('md'), { noSsr: true });
  const { user } = useAuth();
  const { socket, connected } = usePlaySocket();
  const [flipped, setFlipped] = useState(false);
  const [viewPly, setViewPly] = useState<number | null>(null);
  const [confirmResign, setConfirmResign] = useState(false);
  const [overOpen, setOverOpen] = useState(false);
  const [rematchOffered, setRematchOffered] = useState<string | null>(null);
  const [muted, setMutedState] = useState(isMuted());
  const [accepting, setAccepting] = useState(false);

  const showError = (code: string, message: string) => {
    notification.error({ message: t(`play.errors.${code}`, message || code), description: undefined });
  };
  const play = usePlayGame({ gameId, socket, connected, userId: user?._id, onError: showError });
  const { game, myColor } = play;

  // Новая партия (реванш) — сбросить локальное состояние страницы
  useEffect(() => { setViewPly(null); setOverOpen(false); setRematchOffered(null); setConfirmResign(false); }, [gameId]);

  // Конец партии — окно итога (один раз)
  const finished = game?.status === 'finished' || game?.status === 'aborted';
  useEffect(() => { if (finished) setOverOpen(true); }, [finished]);

  // Реванш принят (мной или соперником) — перейти в новую партию
  useEffect(() => {
    if (!socket) return undefined;
    const onStarted = (e: { gameId: string }) => {
      if (e.gameId !== gameId && (e.gameId === rematchOffered || e.gameId === play.rematch?.newGameId)) navigate(`/play/${e.gameId}`);
    };
    socket.on('game_started', onStarted);
    return () => { socket.off('game_started', onStarted); };
  }, [socket, gameId, rematchOffered, play.rematch, navigate]);

  const orientation: Color = flipped ? opposite(myColor ?? 'white') : (myColor ?? 'white');
  const live = game?.status === 'active';
  const ply = game?.moves.length ?? 0;
  const viewing = viewPly !== null && viewPly < ply;
  const boardFen = useMemo(() => (game && viewing ? fenAtPly(game.sanMoves, viewPly!) : game?.fen ?? ''), [game, viewing, viewPly]);
  const lastUci = game && (viewing ? game.moves[viewPly! - 1] : game.moves[ply - 1]);
  const lastMove = lastUci ? { from: lastUci.slice(0, 2), to: lastUci.slice(2, 4) } : null;
  const canMove = live && !!myColor && !viewing;

  if (!socket) return <PageContainer><Alert severity="info">{t('play.loginRequired', 'Log in to play online.')}</Alert></PageContainer>;
  if (play.loadError) {
    return (
      <PageContainer>
        <Alert severity="error" action={<Button color="inherit" onClick={() => navigate('/play')}>{t('play.toLobby', 'To lobby')}</Button>}>
          {t(`play.errors.${play.loadError}`, play.loadError === 'GAME_NOT_FOUND' ? 'Game not found.' : 'Failed to load the game.')}
        </Alert>
      </PageContainer>
    );
  }
  if (!game) return <Box sx={{ display: 'grid', placeItems: 'center', minHeight: '60vh' }}><CircularProgress /></Box>;

  const tcChip = (
    <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
      <Chip size="small" label={timeControlLabel(game.timeControl)} sx={{ fontFamily: tokens.font.mono, fontWeight: 700 }} />
      <Chip size="small" variant="outlined" label={t(`play.speed.${game.timeControl.type}`, game.timeControl.type)} />
      <Chip size="small" variant="outlined" color={game.isRated ? 'primary' : 'default'} label={game.isRated ? t('play.rated', 'Rated') : t('play.casual', 'Casual')} />
    </Stack>
  );

  // ---- вызов ещё не принят
  if (game.status === 'created') {
    const mine = game.createdBy?._id === user?._id;
    const link = `${window.location.origin}/play/${game._id}`;
    return (
      <PageContainer maxWidth={640}>
        <Paper sx={{ p: { xs: 2.5, sm: 4 }, textAlign: 'center' }}>
          <Typography variant="h4" component="h1" sx={{ mb: 1 }}>{mine ? t('play.waitingTitle', 'Waiting for an opponent') : t('play.challengeTitle', 'Challenge')}</Typography>
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>{tcChip}</Box>
          {mine ? (
            <>
              <Typography color="text.secondary" sx={{ mb: 2 }}>{t('play.shareLink', 'Send this link to a friend — the game starts as soon as they accept.')}</Typography>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems="stretch">
                <Box data-testid="challenge-link" sx={{ flex: 1, p: 1.25, borderRadius: 1, bgcolor: 'surface.raised', fontFamily: tokens.font.mono, fontSize: '0.85rem', overflowX: 'auto', whiteSpace: 'nowrap' }}>{link}</Box>
                <Button variant="contained" startIcon={<ContentCopyRoundedIcon />} onClick={() => {
                  void navigator.clipboard?.writeText(link).then(() => notification.success({ message: t('play.linkCopied', 'Link copied'), description: undefined })).catch(() => undefined);
                }}>{t('play.copyLink', 'Copy')}</Button>
              </Stack>
              <CircularProgress size={28} sx={{ mt: 3 }} />
              <Box sx={{ mt: 2 }}>
                <Button color="inherit" onClick={async () => { await cancelChallenge(game._id).catch(() => undefined); navigate('/play'); }}>{t('play.cancelChallenge', 'Cancel challenge')}</Button>
              </Box>
            </>
          ) : (
            <>
              <Typography sx={{ mb: 3 }}>
                {t('play.challengeFrom', { name: `${game.createdBy?.firstName ?? ''} ${game.createdBy?.lastName ?? ''}`.trim(), defaultValue: '{{name}} challenges you to a game' })}
              </Typography>
              <Button size="large" variant="contained" disabled={accepting} onClick={async () => {
                setAccepting(true);
                try {
                  await acceptChallenge(game._id);
                  await play.reload();
                } catch (e) {
                  showError(errorCode(e) ?? 'UNKNOWN', '');
                } finally {
                  setAccepting(false);
                }
              }}>{t('play.acceptChallenge', 'Accept challenge')}</Button>
            </>
          )}
        </Paper>
      </PageContainer>
    );
  }

  // ---- партия
  const top = opposite(orientation);
  const bottom = orientation;
  const bar = (color: Color) => (
    <PlayerBar player={game[color]} color={color} clock={game.clock} receivedAt={play.receivedAt} live={live}
      ratingDiff={finished ? game.ratingChanges?.[color] ?? null : null} isMe={color === myColor} />
  );
  const opponentOffersDraw = live && !!myColor && game.drawOfferBy === opposite(myColor);
  const myDrawOffer = live && !!myColor && game.drawOfferBy === myColor;
  const canAbort = live && ply < 2;

  const board = (
    <ChessBoard
      fen={boardFen}
      onMove={(from, to, promotion) => (canMove ? play.move(from, to, promotion) : false)}
      boardOrientation={orientation}
      movable={canMove ? myColor! : orientation === 'white' ? 'black' : 'white'}
      lastMove={lastMove}
      premoves={canMove}
      premoveKey={game._id}
    />
  );

  const moveList = (
    <Box data-testid="play-moves" sx={{ display: 'grid', gridTemplateColumns: '2.5rem 1fr 1fr', rowGap: 0.25, fontSize: '0.92rem', alignContent: 'start' }}>
      {game.sanMoves.length === 0 && <Typography variant="body2" color="text.secondary" sx={{ gridColumn: '1 / -1', py: 1 }}>{t('play.noMovesYet', 'No moves yet')}</Typography>}
      {Array.from({ length: Math.ceil(game.sanMoves.length / 2) }, (_, i) => (
        <React.Fragment key={i}>
          <Box sx={{ color: 'text.disabled', fontFamily: tokens.font.mono, fontSize: '0.8rem', textAlign: 'right', pr: 1, alignSelf: 'center' }}>{i + 1}.</Box>
          {[0, 1].map((k) => {
            const idx = i * 2 + k;
            const san = game.sanMoves[idx];
            if (!san) return <span key={k} />;
            const active = (viewing ? viewPly! : ply) === idx + 1;
            return (
              <Box key={k} component="button" type="button" onClick={() => setViewPly(idx + 1 === ply ? null : idx + 1)}
                sx={{ all: 'unset', cursor: 'pointer', px: 1, py: 0.4, borderRadius: 1, fontWeight: active ? 700 : 500, color: active ? 'primary.main' : 'text.primary', bgcolor: active ? tokens.accent.goldSoft : 'transparent', '&:hover': { bgcolor: 'action.hover' } }}>
                {san}
              </Box>
            );
          })}
        </React.Fragment>
      ))}
    </Box>
  );

  const controls = (
    <Stack spacing={1}>
      {opponentOffersDraw && (
        <Alert severity="info" icon={<HandshakeRoundedIcon />} action={(
          <Stack direction="row" spacing={0.5}>
            <Button size="small" color="inherit" onClick={() => void play.acceptDraw()}>{t('play.accept', 'Accept')}</Button>
            <Button size="small" color="inherit" onClick={() => void play.declineDraw()}>{t('play.decline', 'Decline')}</Button>
          </Stack>
        )}>{t('play.drawOffered', 'Your opponent offers a draw')}</Alert>
      )}
      {viewing && (
        <Button size="small" variant="outlined" color="inherit" onClick={() => setViewPly(null)}>{t('play.backToGame', 'Back to the game')}</Button>
      )}
      <Stack direction="row" spacing={1} justifyContent="space-between" alignItems="center">
        <Stack direction="row" spacing={1}>
          {live && myColor && (canAbort ? (
            <Button size="small" variant="outlined" color="inherit" startIcon={<CloseRoundedIcon />} onClick={() => void play.abort()}>{t('play.abort', 'Abort')}</Button>
          ) : (
            <>
              <Button size="small" variant="outlined" color="inherit" startIcon={<HandshakeRoundedIcon />} disabled={myDrawOffer} onClick={() => void play.offerDraw()}>
                {myDrawOffer ? t('play.drawSent', 'Draw offered') : t('play.offerDraw', 'Offer draw')}
              </Button>
              {confirmResign ? (
                <Button size="small" variant="contained" color="error" startIcon={<FlagRoundedIcon />} onClick={() => { setConfirmResign(false); void play.resign(); }}>
                  {t('play.confirmResign', 'Resign?')}
                </Button>
              ) : (
                <Button size="small" variant="outlined" color="error" startIcon={<FlagRoundedIcon />} onClick={() => { setConfirmResign(true); setTimeout(() => setConfirmResign(false), 3000); }}>
                  {t('play.resign', 'Resign')}
                </Button>
              )}
            </>
          ))}
          {finished && <Button size="small" variant="contained" onClick={() => setOverOpen(true)}>{t('play.result', 'Result')}</Button>}
        </Stack>
        <Stack direction="row">
          <Tooltip title={t('play.flip', 'Flip board')}><IconButton size="small" onClick={() => setFlipped((f) => !f)} aria-label={t('play.flip', 'Flip board')}><SwapVertRoundedIcon /></IconButton></Tooltip>
          <Tooltip title={muted ? t('play.soundOn', 'Sound on') : t('play.soundOff', 'Sound off')}>
            <IconButton size="small" onClick={() => { setMuted(!muted); setMutedState(!muted); }} aria-label={t('play.sound', 'Sound')}>
              {muted ? <VolumeOffRoundedIcon /> : <VolumeUpRoundedIcon />}
            </IconButton>
          </Tooltip>
        </Stack>
      </Stack>
      {!connected && <Alert severity="warning">{t('play.reconnecting', 'Connection lost — reconnecting…')}</Alert>}
    </Stack>
  );

  const rematchState: 'idle' | 'offered' | 'incoming' = play.rematch && play.rematch.by !== myColor ? 'incoming' : rematchOffered ? 'offered' : 'idle';
  const onRematch = async () => {
    const res = await play.rematchGame();
    if (!res) return;
    if (res.accepted) navigate(`/play/${res.gameId}`);
    else setRematchOffered(res.gameId);
  };
  const onAnalyze = () => {
    const chess = new Chess();
    for (const san of game.sanMoves) chess.move(san);
    navigate('/analysis', { state: { pgn: chess.pgn() } });
  };

  return (
    <PageContainer dense maxWidth={1320}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1.5 }} spacing={1}>
        <Typography variant="h5" component="h1" noWrap>{t('play.title', 'Online game')}</Typography>
        {tcChip}
      </Stack>
      <Box sx={{ display: 'flex', flexDirection: wide ? 'row' : 'column', gap: 2.5, justifyContent: 'center', alignItems: wide ? 'flex-start' : 'stretch' }}>
        <Box sx={{ flex: wide ? '0 0 auto' : '1 1 auto' }}>
          {bar(top)}
          <Box sx={{ mx: { xs: -2, sm: 0 } }}>
            {wide ? <ResizableBoard reserveBottom={70}>{board}</ResizableBoard> : <Box sx={{ width: '100%', maxWidth: 'calc(100dvh - 230px)', minWidth: { xs: '100%', sm: 320 }, mx: 'auto', aspectRatio: '1 / 1' }}>{board}</Box>}
          </Box>
          {bar(bottom)}
        </Box>
        <Paper sx={{ flex: wide ? '0 1 360px' : '1 1 auto', minWidth: wide ? 300 : 0, p: 1.5, display: 'flex', flexDirection: 'column', gap: 1.5, maxHeight: wide ? 'calc(100dvh - 150px)' : 'none' }}>
          {finished && (
            <Box data-testid="game-result" sx={{ p: 1.25, borderRadius: 1, bgcolor: 'surface.raised', textAlign: 'center', fontWeight: 600 }}>
              {game.status === 'aborted' ? t('play.over.aborted', 'Game aborted')
                : game.winner === 'draw' ? `½–½ · ${t(`play.reason.${game.endReason}`, game.endReason ?? '')}`
                  : `${game.winner === 'white' ? '1–0' : '0–1'} · ${t(`play.reason.${game.endReason}`, game.endReason ?? '')}`}
            </Box>
          )}
          <Box sx={{ flex: 1, minHeight: 80, overflowY: 'auto' }}>{moveList}</Box>
          {controls}
        </Paper>
      </Box>
      <GameOverDialog open={overOpen && finished} game={game} myColor={myColor} onClose={() => setOverOpen(false)}
        onRematch={() => void onRematch()} rematchState={rematchState} onAnalyze={onAnalyze} onNewGame={() => navigate('/play')} />
    </PageContainer>
  );
};
