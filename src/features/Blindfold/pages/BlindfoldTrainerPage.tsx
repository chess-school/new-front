import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Box, Button, Collapse, Fade, Paper, Slider, Stack,
  ToggleButton, ToggleButtonGroup, Typography,
} from '@mui/material';
import FavoriteRounded from '@mui/icons-material/FavoriteRounded';
import FavoriteBorderRounded from '@mui/icons-material/FavoriteBorderRounded';
import { PageContainer, PageHeader } from '@/shared/components/ui/PageHeader';
import { useTranslation } from 'react-i18next';

import {
  generatePuzzle, type BlindfoldPuzzle, type Piece, type PieceType,
} from '../services/blindfoldTrainerEngine';

// ---------------------------------------------------------------- доска / глифы

const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
// Рисуем сверху вниз: ранг 8 → 1, слева направо: файл a → h (вид «от белых»)
const RANKS = [8, 7, 6, 5, 4, 3, 2, 1];

// Юникод-глифы шахматных фигур. Берём «заливные» глифы для обоих цветов,
// а цвет фигуры передаём через CSS color + обводку — так белые видны и на светлых полях.
const GLYPH: Record<PieceType, string> = {
  q: '♛', r: '♜', b: '♝', n: '♞', p: '♟',
};

const PIECE_NAME_KEYS: Record<PieceType, string> = {
  q: 'queen', r: 'rook', b: 'bishop', n: 'knight', p: 'pawn',
};
const PIECE_NAME_EN: Record<PieceType, string> = {
  q: 'Queen', r: 'Rook', b: 'Bishop', n: 'Knight', p: 'Pawn',
};

// settings → memorize → recall → reveal → gameover
type Phase = 'settings' | 'memorize' | 'recall' | 'reveal' | 'gameover';

const PIECE_CHOICES = [4, 6, 8, 10] as const;
const LIVES = 3;

// ---------------------------------------------------------------- клетка доски

interface SquareCellProps {
  square: string;
  dark: boolean;
  piece?: Piece;
  hidden: boolean; // слепая фаза — фигуры скрыты
  showFileLabel?: string;
  showRankLabel?: string;
  clickable: boolean;
  highlight?: 'correct' | 'wrong' | 'ask';
  onClick?: () => void;
}

const LIGHT = '#E9EDF2';
const DARK = '#6E7F95';

const PieceGlyph: React.FC<{ piece: Piece }> = ({ piece }) => (
  <Box
    component="span"
    sx={{
      fontSize: { xs: '6.5vw', sm: 32, md: 38 },
      lineHeight: 1,
      userSelect: 'none',
      color: piece.color === 'w' ? '#FFFFFF' : '#111418',
      textShadow: piece.color === 'w'
        ? '0 0 1px #000, 0 0 1px #000, 0 1px 2px rgba(0,0,0,.4)'
        : '0 0 1px rgba(255,255,255,.4)',
    }}
  >
    {GLYPH[piece.type]}
  </Box>
);

const SquareCell: React.FC<SquareCellProps> = ({
  square, dark, piece, hidden, showFileLabel, showRankLabel, clickable, highlight, onClick,
}) => {
  const bg = highlight === 'correct' ? '#2E7D32'
    : highlight === 'wrong' ? '#C62828'
    : highlight === 'ask' ? '#2B50E0'
    : dark ? DARK : LIGHT;
  return (
    <Box
      role={clickable ? 'button' : undefined}
      aria-label={clickable ? square : undefined}
      tabIndex={clickable ? 0 : undefined}
      onClick={clickable ? onClick : undefined}
      onKeyDown={clickable ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick?.(); } } : undefined}
      sx={{
        position: 'relative',
        aspectRatio: '1 / 1',
        display: 'grid',
        placeItems: 'center',
        bgcolor: bg,
        cursor: clickable ? 'pointer' : 'default',
        transition: 'background-color .3s ease',
        '&:hover': clickable ? { filter: 'brightness(1.12)' } : undefined,
      }}
    >
      {/* координаты в углах */}
      {showFileLabel && (
        <Box component="span" sx={{ position: 'absolute', right: 3, bottom: 1, fontSize: 10, opacity: highlight ? 0.95 : 0.7, color: highlight ? '#fff' : (dark ? LIGHT : DARK) }}>
          {showFileLabel}
        </Box>
      )}
      {showRankLabel && (
        <Box component="span" sx={{ position: 'absolute', left: 3, top: 1, fontSize: 10, opacity: highlight ? 0.95 : 0.7, color: highlight ? '#fff' : (dark ? LIGHT : DARK) }}>
          {showRankLabel}
        </Box>
      )}
      <Fade in={!hidden && !!piece} timeout={400}>
        <Box sx={{ display: 'grid', placeItems: 'center' }}>
          {piece && <PieceGlyph piece={piece} />}
        </Box>
      </Fade>
    </Box>
  );
};

// ---------------------------------------------------------------- жизни (сердечки)

const Lives: React.FC<{ lives: number }> = ({ lives }) => (
  <Stack direction="row" spacing={0.5} aria-label={`${lives}`}>
    {Array.from({ length: LIVES }, (_, i) => (
      i < lives
        ? <FavoriteRounded key={i} fontSize="small" sx={{ color: 'error.main' }} />
        : <FavoriteBorderRounded key={i} fontSize="small" sx={{ color: 'text.disabled' }} />
    ))}
  </Stack>
);

// ---------------------------------------------------------------- страница

export const BlindfoldTrainerPage: React.FC = () => {
  const { t } = useTranslation();

  // настройки
  const [pieceCount, setPieceCount] = useState<number>(6);
  const [memorizeTime, setMemorizeTime] = useState<number>(6); // секунд на запоминание

  // состояние партии
  const [phase, setPhase] = useState<Phase>('settings');
  const [puzzle, setPuzzle] = useState<BlindfoldPuzzle | null>(null);
  const [memorizeLeft, setMemorizeLeft] = useState<number>(0);
  const [lives, setLives] = useState<number>(LIVES);
  const [solved, setSolved] = useState<number>(0);
  const [best, setBest] = useState<number>(0);

  // ответ текущего раунда
  const [pickedSquare, setPickedSquare] = useState<string | null>(null);
  const [lastCorrect, setLastCorrect] = useState<boolean>(false);

  // таймеры
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTimers = useCallback(() => {
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
  }, []);

  useEffect(() => () => clearTimers(), [clearTimers]);

  // --- запуск раунда / партии ---

  const nextRound = useCallback(() => {
    clearTimers();
    const p = generatePuzzle({ pieceCount });
    setPuzzle(p);
    setPickedSquare(null);
    setMemorizeLeft(memorizeTime);
    setPhase('memorize');
  }, [clearTimers, pieceCount, memorizeTime]);

  const startGame = useCallback(() => {
    setLives(LIVES);
    setSolved(0);
    nextRound();
  }, [nextRound]);

  const toSettings = useCallback(() => {
    clearTimers();
    setPuzzle(null);
    setPhase('settings');
  }, [clearTimers]);

  // отсчёт фазы запоминания → recall
  useEffect(() => {
    if (phase !== 'memorize') return;
    setMemorizeLeft(memorizeTime);
    intervalRef.current = setInterval(() => {
      setMemorizeLeft((left) => {
        if (left <= 1) {
          clearTimers();
          setPhase('recall');
          return 0;
        }
        return left - 1;
      });
    }, 1000);
    return () => clearTimers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  // клик по клетке в фазе recall — назвать фигуру (указать её поле)
  const onSquareClick = useCallback((sq: string) => {
    if (phase !== 'recall' || !puzzle) return;
    const ok = sq === puzzle.answerSquare;
    setPickedSquare(sq);
    setLastCorrect(ok);
    setPhase('reveal');
    if (ok) {
      const next = solved + 1;
      setSolved(next);
      setBest((b) => (next > b ? next : b));
    } else {
      setLives((l) => Math.max(0, l - 1));
    }
  }, [phase, puzzle, solved]);

  // «Дальше» из reveal: конец партии при 0 жизней, иначе новый раунд
  const onContinue = useCallback(() => {
    if (!lastCorrect && lives <= 0) { setPhase('gameover'); return; }
    nextRound();
  }, [lastCorrect, lives, nextRound]);

  const outOfLives = !lastCorrect && lives <= 0;

  // что показываем на доске: в recall — пусто; иначе расстановка пазла
  const piecesOnBoard = puzzle && phase !== 'recall' ? puzzle.bySquare : {};
  const hidden = phase === 'recall';

  // подсветка клетки
  const squareHighlight = useCallback((sq: string): SquareCellProps['highlight'] => {
    if (!puzzle) return undefined;
    // поле-цель подсвечиваем синим в recall и reveal
    if ((phase === 'recall' || phase === 'reveal') && sq === puzzle.target) return 'ask';
    if (phase === 'reveal') {
      if (sq === puzzle.answerSquare) return 'correct';
      if (!lastCorrect && sq === pickedSquare && sq !== puzzle.answerSquare) return 'wrong';
    }
    return undefined;
  }, [puzzle, phase, lastCorrect, pickedSquare]);

  const pieceLabel = (p: Piece) => {
    const name = t(`blindfold.piece.${PIECE_NAME_KEYS[p.type]}`, PIECE_NAME_EN[p.type]);
    const color = p.color === 'w' ? t('blindfold.color.white', 'White') : t('blindfold.color.black', 'Black');
    return `${color} ${name.toLowerCase()}`;
  };

  // --- рендер доски ---
  const board = (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: 'repeat(8, 1fr)',
        width: '100%',
        maxWidth: 520,
        mx: 'auto',
        border: '4px solid',
        borderColor: 'rgba(0,0,0,.35)',
        borderRadius: 1,
        overflow: 'hidden',
        boxShadow: 3,
      }}
    >
      {RANKS.map((rank, rIdx) =>
        FILES.map((file, fIdx) => {
          const sq = `${file}${rank}`;
          const dark = (rIdx + fIdx) % 2 === 1;
          const clickable = phase === 'recall';
          return (
            <SquareCell
              key={sq}
              square={sq}
              dark={dark}
              piece={piecesOnBoard[sq]}
              hidden={hidden}
              clickable={clickable}
              highlight={squareHighlight(sq)}
              showFileLabel={rIdx === 7 ? file : undefined}
              showRankLabel={fIdx === 0 ? String(rank) : undefined}
              onClick={() => onSquareClick(sq)}
            />
          );
        }),
      )}
    </Box>
  );

  return (
    <PageContainer maxWidth={1100}>
      <PageHeader
        eyebrow={t('nav.groups.training', 'Training')}
        title={t('blindfold.title', 'Blindfold vision')}
        subtitle={t('blindfold.subtitle', 'Memorise the position, then — on a blank board — find the one piece that can move to the named square.')}
        actions={phase !== 'settings' ? (
          <Stack direction="row" spacing={2} alignItems="center">
            <Lives lives={lives} />
            <Typography variant="body2" color="text.secondary">
              {t('blindfold.score', 'Solved')}: <b>{solved}</b>
            </Typography>
          </Stack>
        ) : undefined}
      />

      <Stack direction={{ xs: 'column', md: 'row' }} spacing={3} alignItems="flex-start">
        {/* ЛЕВО: настройки / статус */}
        <Paper variant="outlined" sx={{ p: 3, width: { xs: '100%', md: 340 }, flexShrink: 0 }}>
          <Collapse in={phase === 'settings'} unmountOnExit>
            <Stack spacing={3}>
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  {t('blindfold.settings.pieceCount', 'Number of pieces')}
                </Typography>
                <ToggleButtonGroup
                  exclusive
                  size="small"
                  value={pieceCount}
                  onChange={(_, v) => { if (v != null) setPieceCount(v); }}
                  fullWidth
                >
                  {PIECE_CHOICES.map((n) => (
                    <ToggleButton key={n} value={n}>{n}</ToggleButton>
                  ))}
                </ToggleButtonGroup>
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                  {t('blindfold.settings.difficultyHint', 'More pieces — harder to hold in your head.')}
                </Typography>
              </Box>

              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  {t('blindfold.settings.memorizeTime', 'Time to memorise (seconds)')}: {memorizeTime}
                </Typography>
                <Slider
                  value={memorizeTime}
                  onChange={(_, v) => setMemorizeTime(v as number)}
                  min={2}
                  max={15}
                  step={1}
                  marks={[{ value: 2, label: '2' }, { value: 8, label: '8' }, { value: 15, label: '15' }]}
                  valueLabelDisplay="auto"
                />
              </Box>

              <Typography variant="body2" color="text.secondary">
                {t('blindfold.rules', '3 lives. Each round one square is named — find the only piece that can move there.')}
              </Typography>

              <Button variant="contained" size="large" onClick={startGame}>
                {t('blindfold.start', 'Start')}
              </Button>
            </Stack>
          </Collapse>

          <Collapse in={phase !== 'settings'} unmountOnExit>
            <Stack spacing={2}>
              <Box>
                <Typography variant="overline" color="text.secondary">
                  {phase === 'memorize' && t('blindfold.phase.memorize', 'Memorise')}
                  {phase === 'recall' && t('blindfold.phase.recall', 'Find the piece')}
                  {phase === 'reveal' && t('blindfold.phase.reveal', 'Answer')}
                  {phase === 'gameover' && t('blindfold.phase.gameover', 'Game over')}
                </Typography>
              </Box>

              {phase === 'memorize' && (
                <>
                  <Typography variant="h3" sx={{ fontVariantNumeric: 'tabular-nums' }}>{memorizeLeft}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {t('blindfold.memorize.hint', 'Remember every piece and its square.')}
                  </Typography>
                </>
              )}

              {phase === 'recall' && puzzle && (
                <>
                  <Typography variant="h6">
                    {t('blindfold.recall.prompt', 'Only one piece can move to {{square}}. Which one?', { square: puzzle.target })}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {t('blindfold.recall.clickHint', 'Click the square it stands on — the board is blank.')}
                  </Typography>
                </>
              )}

              {phase === 'reveal' && puzzle && (
                <Fade in>
                  <Stack spacing={1.5}>
                    <Typography variant="subtitle1" sx={{ color: lastCorrect ? 'success.main' : 'error.main', fontWeight: 700 }}>
                      {lastCorrect ? t('blindfold.reveal.correct', 'Correct!') : t('blindfold.reveal.wrong', 'Not quite.')}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {t('blindfold.reveal.answerWas', 'The {{piece}} on {{square}} could move to {{target}}.', {
                        piece: pieceLabel(puzzle.answerPiece),
                        square: puzzle.answerSquare,
                        target: puzzle.target,
                      })}
                    </Typography>
                    {!lastCorrect && (
                      <Typography variant="caption" color="text.secondary">
                        {t('blindfold.reveal.lostLife', 'Lost a life.')}
                      </Typography>
                    )}
                    <Button variant="contained" onClick={onContinue} sx={{ mt: 1 }}>
                      {outOfLives ? t('blindfold.reveal.results', 'See results') : t('blindfold.reveal.next', 'Next')}
                    </Button>
                  </Stack>
                </Fade>
              )}

              {phase === 'gameover' && (
                <Fade in>
                  <Stack spacing={1.5}>
                    <Typography variant="h6">{t('blindfold.gameover.title', 'Out of lives')}</Typography>
                    <Typography variant="body2">
                      {t('blindfold.gameover.solved', 'You identified {{count}} pieces.', { count: solved })}
                    </Typography>
                    {best > 0 && (
                      <Typography variant="body2" color="text.secondary">
                        {t('blindfold.gameover.best', 'Best this session: {{count}}', { count: best })}
                      </Typography>
                    )}
                    <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                      <Button variant="contained" onClick={startGame}>
                        {t('blindfold.again', 'Play again')}
                      </Button>
                      <Button variant="outlined" onClick={toSettings}>
                        {t('blindfold.settings.change', 'Settings')}
                      </Button>
                    </Stack>
                  </Stack>
                </Fade>
              )}

              {phase !== 'gameover' && (
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="caption" color="text.secondary">{t('blindfold.livesLabel', 'Lives')}</Typography>
                    <Lives lives={lives} />
                  </Stack>
                </Paper>
              )}
            </Stack>
          </Collapse>
        </Paper>

        {/* ПРАВО: доска */}
        <Box sx={{ flexGrow: 1, width: '100%' }}>
          {board}
          {phase === 'recall' && (
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'center', mt: 1 }}>
              {t('blindfold.recall.thinking', 'Picture the pieces in your head and click the right square.')}
            </Typography>
          )}
        </Box>
      </Stack>
    </PageContainer>
  );
};

export default BlindfoldTrainerPage;
