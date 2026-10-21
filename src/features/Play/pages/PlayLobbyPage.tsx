import React, { useCallback, useEffect, useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import {
  Alert, Box, Button, ButtonBase, Chip, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, FormControlLabel,
  MenuItem, Paper, Slider, Stack, Switch, TextField, ToggleButton, ToggleButtonGroup, Typography,
} from '@mui/material';
import BoltRoundedIcon from '@mui/icons-material/BoltRounded';
import TuneRoundedIcon from '@mui/icons-material/TuneRounded';
import LinkRoundedIcon from '@mui/icons-material/LinkRounded';
import { notification } from 'antd';
import { useTranslation } from 'react-i18next';
import { PageContainer, PageHeader } from '@/shared/components/ui/PageHeader';
import { tokens } from '@/theme/tokens';
import { usePlaySocket } from '../usePlaySocket';
import { acceptChallenge, cancelChallenge, createChallenge, errorCode, getOpenChallenges, getPlayOverview, request } from '../playApi';
import { Challenge, PlayOverview, Speed } from '../playTypes';
import { timeControlLabel } from '../clock';
import { PRESETS, speedOf } from '../playPresets';

const SPEEDS: Speed[] = ['bullet', 'blitz', 'rapid', 'classical'];
const RANGES = [null, 100, 200, 300, 500] as const;
const LOBBY_REFRESH_MS = 5000;

type Mode = 'pairing' | 'lobby' | 'friend';

export const PlayLobbyPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { socket, connected } = usePlaySocket();
  const [rated, setRated] = useState(true);
  const [range, setRange] = useState<number | null>(null);
  const [seeking, setSeeking] = useState<{ minutes: number; increment: number } | null>(null);
  const [overview, setOverview] = useState<PlayOverview | null>(null);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [customOpen, setCustomOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const [o, list] = await Promise.all([getPlayOverview(), getOpenChallenges()]);
      setOverview(o);
      setChallenges(list);
    } catch {
      // лобби доступно и без списков
    }
  }, []);
  useEffect(() => {
    void refresh();
    const timer = setInterval(() => void refresh(), LOBBY_REFRESH_MS);
    return () => clearInterval(timer);
  }, [refresh]);

  // Партия началась (нашёлся соперник или приняли мой вызов) — в партию
  useEffect(() => {
    if (!socket) return undefined;
    const onStarted = (e: { gameId: string }) => { setSeeking(null); navigate(`/play/${e.gameId}`); };
    const onSeek = (e: { seeking: boolean; error?: string }) => {
      if (!e.seeking) setSeeking(null);
      if (e.error) notification.error({ message: t('play.errors.PAIRING_FAILED', 'Pairing failed, try again'), description: undefined });
    };
    socket.on('game_started', onStarted);
    socket.on('seek_state', onSeek);
    return () => { socket.off('game_started', onStarted); socket.off('seek_state', onSeek); };
  }, [socket, navigate, t]);

  // Уход со страницы — выйти из очереди
  useEffect(() => () => { if (socket) socket.emit('cancel_seek', {}); }, [socket]);

  const fail = (e: unknown) => notification.error({ message: t(`play.errors.${errorCode(e) ?? 'UNKNOWN'}`, (e as Error)?.message || 'Error'), description: undefined });

  const seek = async (minutes: number, increment: number, isRated = rated, ratingRange = range) => {
    if (!socket) return;
    setSeeking({ minutes, increment });
    try {
      const res = await request<{ seeking: boolean }>(socket, 'seek', { minutes, increment, rated: isRated, ratingRange });
      if (!res.seeking) setSeeking(null); // сразу нашёлся соперник — придёт game_started
    } catch (e) {
      setSeeking(null);
      fail(e);
    }
  };
  const cancelSeek = async () => {
    setSeeking(null);
    if (socket) await request(socket, 'cancel_seek', {}).catch(() => undefined);
  };

  const accept = async (c: Challenge) => {
    setBusy(true);
    try {
      navigate(`/play/${await acceptChallenge(c._id)}`);
    } catch (e) {
      fail(e);
      void refresh();
    } finally {
      setBusy(false);
    }
  };

  const others = challenges.filter((c) => !c.mine);
  const mine = overview?.challenges ?? [];

  return (
    <PageContainer maxWidth={1200}>
      <PageHeader eyebrow={t('nav.groups.training', 'Training')} title={t('play.lobbyTitle', 'Play online')}
        subtitle={t('play.lobbySubtitle', 'Quick pairing, open challenges and games with friends — rated by Glicko-2, like on Lichess.')} />

      {/* Рейтинги */}
      <Box sx={{ display: 'grid', gap: 1.5, gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(4, 1fr)' }, mb: 3 }} data-testid="my-ratings">
        {SPEEDS.map((s) => {
          const r = overview?.ratings[s];
          return (
            <Paper key={s} sx={{ p: 1.5 }}>
              <Typography variant="overline" color="text.secondary">{t(`play.speed.${s}`, s)}</Typography>
              <Typography sx={{ fontFamily: tokens.font.mono, fontWeight: 700, fontSize: '1.4rem' }}>
                {r ? `${r.rating}${r.provisional ? '?' : ''}` : '—'}
              </Typography>
              <Typography variant="caption" color="text.secondary">{t('play.gamesCount', { count: r?.games ?? 0, defaultValue: '{{count}} games' })}</Typography>
            </Paper>
          );
        })}
      </Box>

      {!!overview?.activeGames.length && (
        <Alert severity="info" sx={{ mb: 3 }} action={(
          <Button color="inherit" component={RouterLink} to={`/play/${overview.activeGames[0]._id}`}>{t('play.continue', 'Continue')}</Button>
        )}>
          {t('play.activeGame', { tc: timeControlLabel(overview.activeGames[0].timeControl), defaultValue: 'You have a game in progress ({{tc}})' })}
        </Alert>
      )}

      <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 3fr) minmax(0, 2fr)' } }}>
        {/* Быстрая игра */}
        <Paper sx={{ p: { xs: 2, sm: 2.5 } }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" useFlexGap spacing={1} sx={{ mb: 2 }}>
            <Typography variant="h6" component="h2"><BoltRoundedIcon sx={{ verticalAlign: '-5px', color: 'primary.main', mr: 0.5 }} />{t('play.quickPairing', 'Quick pairing')}</Typography>
            <Stack direction="row" spacing={1} alignItems="center">
              <FormControlLabel control={<Switch checked={rated} onChange={(e) => setRated(e.target.checked)} />} label={rated ? t('play.rated', 'Rated') : t('play.casual', 'Casual')} />
              <TextField select size="small" label={t('play.ratingRange', 'Opponent rating')} value={range ?? ''} onChange={(e) => setRange(e.target.value === '' ? null : Number(e.target.value))} sx={{ minWidth: 150 }}>
                {RANGES.map((r) => <MenuItem key={r ?? 'any'} value={r ?? ''}>{r ? `±${r}` : t('play.anyRating', 'Any')}</MenuItem>)}
              </TextField>
            </Stack>
          </Stack>
          <Box sx={{ display: 'grid', gap: 1.25, gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' }}>
            {PRESETS.map((p) => {
              const active = seeking?.minutes === p.minutes && seeking.increment === p.increment;
              return (
                <ButtonBase key={`${p.minutes}+${p.increment}`} data-testid={`preset-${p.minutes}+${p.increment}`} disabled={!connected || (!!seeking && !active)}
                  onClick={() => (active ? void cancelSeek() : void seek(p.minutes, p.increment))}
                  sx={{
                    flexDirection: 'column', py: { xs: 2, sm: 2.5 }, borderRadius: 2, border: 1,
                    borderColor: active ? 'primary.main' : 'divider', bgcolor: active ? tokens.accent.goldSoft : 'surface.raised',
                    transition: 'all .15s ease', '&:hover': { borderColor: 'primary.main', transform: 'translateY(-1px)' },
                    '&.Mui-disabled': { opacity: 0.45 },
                  }}>
                  <Typography sx={{ fontFamily: tokens.font.mono, fontWeight: 800, fontSize: { xs: '1.3rem', sm: '1.6rem' } }}>{p.minutes}+{p.increment}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {active ? <><CircularProgress size={10} sx={{ mr: 0.5 }} />{t('play.searching', 'Searching…')}</> : t(`play.speed.${p.speed}`, p.speed)}
                  </Typography>
                </ButtonBase>
              );
            })}
          </Box>
          {seeking && (
            <Alert severity="info" sx={{ mt: 2 }} action={<Button color="inherit" onClick={() => void cancelSeek()}>{t('play.cancel', 'Cancel')}</Button>}>
              {t('play.searchingFor', { tc: `${seeking.minutes}+${seeking.increment}`, defaultValue: 'Looking for an opponent {{tc}}…' })}
            </Alert>
          )}
          {!connected && <Alert severity="warning" sx={{ mt: 2 }}>{t('play.connecting', 'Connecting to the game server…')}</Alert>}
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ mt: 2 }}>
            <Button variant="outlined" color="inherit" startIcon={<TuneRoundedIcon />} onClick={() => setCustomOpen(true)} fullWidth>{t('play.customGame', 'Custom game')}</Button>
          </Stack>
        </Paper>

        {/* Вызовы */}
        <Stack spacing={3}>
          <Paper sx={{ p: { xs: 2, sm: 2.5 } }}>
            <Typography variant="h6" component="h2" sx={{ mb: 1.5 }}>{t('play.openChallenges', 'Open challenges')}</Typography>
            {others.length === 0 ? (
              <Typography variant="body2" color="text.secondary">{t('play.noChallenges', 'No open challenges — create one or use quick pairing.')}</Typography>
            ) : (
              <Stack spacing={1} data-testid="open-challenges">
                {others.map((c) => (
                  <Stack key={c._id} direction="row" alignItems="center" spacing={1.5} sx={{ p: 1, borderRadius: 1.5, bgcolor: 'surface.raised' }}>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography fontWeight={600} noWrap>{c.creator?.firstName} {c.creator?.lastName} <Box component="span" sx={{ color: 'text.secondary', fontFamily: tokens.font.mono }}>{c.creator?.rating}{c.creator?.provisional ? '?' : ''}</Box></Typography>
                      <Typography variant="caption" color="text.secondary">
                        {timeControlLabel(c.timeControl)} · {c.isRated ? t('play.rated', 'Rated') : t('play.casual', 'Casual')}{c.ratingRange ? ` · ±${c.ratingRange}` : ''}
                      </Typography>
                    </Box>
                    <Button size="small" variant="contained" disabled={busy} onClick={() => void accept(c)}>{t('play.accept', 'Accept')}</Button>
                  </Stack>
                ))}
              </Stack>
            )}
          </Paper>
          {mine.length > 0 && (
            <Paper sx={{ p: { xs: 2, sm: 2.5 } }}>
              <Typography variant="h6" component="h2" sx={{ mb: 1.5 }}>{t('play.myChallenges', 'My challenges')}</Typography>
              <Stack spacing={1}>
                {mine.map((c) => (
                  <Stack key={c._id} direction="row" alignItems="center" spacing={1} sx={{ p: 1, borderRadius: 1.5, bgcolor: 'surface.raised' }}>
                    <Chip size="small" label={timeControlLabel(c.timeControl)} sx={{ fontFamily: tokens.font.mono }} />
                    <Typography variant="body2" sx={{ flex: 1 }} noWrap>{c.isPrivate ? t('play.byLink', 'By link') : t('play.inLobby', 'In lobby')}</Typography>
                    <Button size="small" component={RouterLink} to={`/play/${c._id}`} startIcon={<LinkRoundedIcon />}>{t('play.open', 'Open')}</Button>
                    <Button size="small" color="inherit" onClick={async () => { await cancelChallenge(c._id).catch(fail); void refresh(); }}>{t('play.cancel', 'Cancel')}</Button>
                  </Stack>
                ))}
              </Stack>
            </Paper>
          )}
        </Stack>
      </Box>

      <CustomGameDialog
        open={customOpen}
        onClose={() => setCustomOpen(false)}
        defaultRated={rated}
        onSubmit={async ({ minutes, increment, rated: r, color, mode, ratingRange }) => {
          setCustomOpen(false);
          if (mode === 'pairing') { await seek(minutes, increment, r, ratingRange); return; }
          try {
            const c = await createChallenge({ minutes, increment, rated: r, color, isPrivate: mode === 'friend', ratingRange: mode === 'lobby' ? ratingRange : null });
            if (mode === 'friend') navigate(`/play/${c._id}`);
            else void refresh();
          } catch (e) {
            fail(e);
          }
        }}
      />
    </PageContainer>
  );
};

interface CustomValues {
  minutes: number;
  increment: number;
  rated: boolean;
  color: 'white' | 'black' | 'random';
  mode: Mode;
  ratingRange: number | null;
}

/** Свой контроль времени: 1–180 минут, добавка 0–60 секунд; автоподбор, открытый вызов или ссылка другу */
export const CustomGameDialog: React.FC<{ open: boolean; onClose: () => void; defaultRated: boolean; onSubmit: (v: CustomValues) => void }> = ({ open, onClose, defaultRated, onSubmit }) => {
  const { t } = useTranslation();
  const [minutes, setMinutes] = useState(10);
  const [increment, setIncrement] = useState(5);
  const [rated, setRated] = useState(defaultRated);
  const [color, setColor] = useState<'white' | 'black' | 'random'>('random');
  const [mode, setMode] = useState<Mode>('friend');
  const [ratingRange, setRatingRange] = useState<number | null>(null);
  useEffect(() => { if (open) setRated(defaultRated); }, [open, defaultRated]);
  const speed = speedOf(minutes, increment);

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>{t('play.customGame', 'Custom game')}</DialogTitle>
      <DialogContent>
        <Stack spacing={2.5} sx={{ pt: 1 }}>
          <Box>
            <Typography gutterBottom>{t('play.minutesPerSide', 'Minutes per side')}: <b data-testid="custom-minutes">{minutes}</b></Typography>
            <Slider value={minutes} min={1} max={180} onChange={(_, v) => setMinutes(v as number)} aria-label={t('play.minutesPerSide', 'Minutes per side')} />
          </Box>
          <Box>
            <Typography gutterBottom>{t('play.incrementSeconds', 'Increment in seconds')}: <b>{increment}</b></Typography>
            <Slider value={increment} min={0} max={60} onChange={(_, v) => setIncrement(v as number)} aria-label={t('play.incrementSeconds', 'Increment in seconds')} />
          </Box>
          <Typography variant="body2" color="text.secondary" data-testid="custom-speed">
            {minutes}+{increment} · {t(`play.speed.${speed}`, speed)}
          </Typography>
          <ToggleButtonGroup exclusive fullWidth size="small" value={mode} onChange={(_, v: Mode | null) => v && setMode(v)}>
            <ToggleButton value="friend">{t('play.modeFriend', 'Friend link')}</ToggleButton>
            <ToggleButton value="lobby">{t('play.modeLobby', 'Open challenge')}</ToggleButton>
            <ToggleButton value="pairing">{t('play.modePairing', 'Quick pairing')}</ToggleButton>
          </ToggleButtonGroup>
          {mode !== 'pairing' && (
            <ToggleButtonGroup exclusive fullWidth size="small" value={color} onChange={(_, v) => v && setColor(v)} aria-label={t('play.color', 'Color')}>
              <ToggleButton value="white">{t('play.white', 'White')}</ToggleButton>
              <ToggleButton value="random">{t('play.random', 'Random')}</ToggleButton>
              <ToggleButton value="black">{t('play.black', 'Black')}</ToggleButton>
            </ToggleButtonGroup>
          )}
          <FormControlLabel control={<Switch checked={rated} onChange={(e) => setRated(e.target.checked)} />} label={rated ? t('play.rated', 'Rated') : t('play.casual', 'Casual')} />
          {mode !== 'friend' && (
            <TextField select size="small" label={t('play.ratingRange', 'Opponent rating')} value={ratingRange ?? ''} onChange={(e) => setRatingRange(e.target.value === '' ? null : Number(e.target.value))}>
              {RANGES.map((r) => <MenuItem key={r ?? 'any'} value={r ?? ''}>{r ? `±${r}` : t('play.anyRating', 'Any')}</MenuItem>)}
            </TextField>
          )}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button color="inherit" onClick={onClose}>{t('play.cancel', 'Cancel')}</Button>
        <Button variant="contained" onClick={() => onSubmit({ minutes, increment, rated, color, mode, ratingRange })}>
          {mode === 'friend' ? t('play.createLink', 'Create link') : mode === 'lobby' ? t('play.createChallenge', 'Create challenge') : t('play.findOpponent', 'Find opponent')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
