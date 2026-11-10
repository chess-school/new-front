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
  generatePosition, type BlindfoldPosition, type Piece, type PieceType, type UniqueTarget,
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

// settings → memorize → question → reveal → gameover
type Phase = 'settings' | 'memorize' | 'question' | 'reveal' | 'gameover';

const PIECE_CHOICES = [4, 6, 8, 10] as const;
const LIVES = 3;

// Палитра ответов: 5 типов × 2 цвета (белые сверху, чёрные снизу)
const ANSWER_PIECE_OPTIONS: { type: PieceType; color: 'w' | 'b' }[] = [
  ...(['q', 'r', 'b', 'n', 'p'] as PieceType[]).map((type) => ({ type, color: 'w' as const })),
  ...(['q', 'r', 'b', 'n', 'p'] as PieceType[]).map((type) => ({ type, color: 'b' as const })),
];

/** Fisher–Yates (Math.random — только для перемешивания очереди вопросов, не для генерации позиции) */
const shuffle = <T,>(arr: T[]): T[] => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

// ---------------------------------------------------------------- клетка доски

interface SquareCellProps {
  square: string;
  dark: boolean;
  piece?: Piece;
  hidden: boolean; // слепая фаза — фигуры скрыты
  showFileLabel?: string;
  showRankLabel?: string;
  highlight?: 'correct' | 'ask';
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
  square, dark, piece, hidden, showFileLabel, showRankLabel, highlight,
}) => {
  const bg = highlight === 'correct' ? '#2E7D32'
    : highlight === 'ask' ? '#2B50E0'
    : dark ? DARK : LIGHT;
  return (
    <Box
      aria-label={square}
      sx={{
        position: 'relative',
        aspectRatio: '1 / 1',
        display: 'grid',
        placeItems: 'center',
        bgcolor: bg,
        transition: 'background-color .3s ease',
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
  const [memorizeTime, setMemorizeTime] = useState<number>(8); // секунд на запоминание
  const [totalQuestions, setTotalQuestions] = useState<number>(60); // длина серии

  // состояние партии
  const [phase, setPhase] = useState<Phase>('settings');
  const [position, setPosition] = useState<BlindfoldPosition | null>(null);
  const [memorizeLeft, setMemorizeLeft] = useState<number>(0);
  const [lives, setLives] = useState<number>(LIVES);
  const [correct, setCorrect] = useState<number>(0);
  const [asked, setAsked] = useState<number>(0);
  const [best, setBest] = useState<number>(0);

  // текущий вопрос + ответ
  const [current, setCurrent] = useState<UniqueTarget | null>(null);
  const [picked, setPicked] = useState<{ type: PieceType; color: 'w' | 'b' } | null>(null);
  const [lastCorrect, setLastCorrect] = useState<boolean>(false);

  // рефы для колбэков/интервалов (не завязаны на ре-рендер)
  const positionRef = useRef<BlindfoldPosition | null>(null);
  const queueRef = useRef<UniqueTarget[]>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const flashRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimers = useCallback(() => {
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
    if (flashRef.current) { clearTimeout(flashRef.current); flashRef.current = null; }
  }, []);

  useEffect(() => () => clearTimers(), [clearTimers]);

  // Следующий вопрос из перемешанной очереди (пополняется заново, когда опустеет)
  const drawQuestion = useCallback(() => {
    const pos = positionRef.current;
    if (!pos || pos.targets.length === 0) return;
    if (queueRef.current.length === 0) queueRef.current = shuffle(pos.targets);
    setCurrent(queueRef.current.shift() ?? null);
    setPicked(null);
  }, []);

  // --- запуск партии ---
  const startGame = useCallback(() => {
    clearTimers();
    const pos = generatePosition({ pieceCount });
    positionRef.current = pos;
    queueRef.current = shuffle(pos.targets);
    setPosition(pos);
    setLives(LIVES);
    setCorrect(0);
    setAsked(0);
    setCurrent(null);
    setPicked(null);
    setMemorizeLeft(memorizeTime);
    setPhase('memorize');
  }, [clearTimers, pieceCount, memorizeTime]);

  const toSettings = useCallback(() => {
    clearTimers();
    setPosition(null);
    positionRef.current = null;
    queueRef.current = [];
    setCurrent(null);
    setPhase('settings');
  }, [clearTimers]);

  // отсчёт фазы запоминания → первый вопрос
  useEffect(() => {
    if (phase !== 'memorize') return;
    setMemorizeLeft(memorizeTime);
    intervalRef.current = setInterval(() => {
      setMemorizeLeft((left) => {
        if (left <= 1) {
          clearTimers();
          drawQuestion();
          setPhase('question');
          return 0;
        }
        return left - 1;
      });
    }, 1000);
    return () => clearTimers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  // выбор фигуры из палитры
  const onPickPiece = useCallback((type: PieceType, color: 'w' | 'b') => {
    if (phase !== 'question' || !current || picked) return;
    const ok = current.piece.type === type && current.piece.color === color;
    setPicked({ type, color });
    setLastCorrect(ok);
    const nextAsked = asked + 1;
    setAsked(nextAsked);

    if (ok) {
      const nextCorrect = correct + 1;
      setCorrect(nextCorrect);
      setBest((b) => (nextCorrect > b ? nextCorrect : b));
      // короткая зелёная вспышка, затем следующий вопрос (доску не раскрываем)
      flashRef.current = setTimeout(() => {
        if (nextAsked >= totalQuestions) setPhase('gameover');
        else drawQuestion();
      }, 650);
    } else {
      setLives((l) => Math.max(0, l - 1));
      setPhase('reveal'); // показываем доску после ошибки
    }
  }, [phase, current, picked, asked, correct, totalQuestions, drawQuestion]);

  // «Дальше» из reveal (после ошибки)
  const onContinue = useCallback(() => {
    if (lives <= 0 || asked >= totalQuestions) { setPhase('gameover'); return; }
    drawQuestion();
    setPhase('question');
  }, [lives, asked, totalQuestions, drawQuestion]);

  const ended = lives <= 0 || asked >= totalQuestions;

  // что показываем на доске: в вопросе — пусто; иначе расстановка
  const piecesOnBoard = position && phase !== 'question' ? position.bySquare : {};
  const hidden = phase === 'question';

  const squareHighlight = useCallback((sq: string): SquareCellProps['highlight'] => {
    if (!current) return undefined;
    if ((phase === 'question' || phase === 'reveal') && sq === current.target) return 'ask';
    if (phase === 'reveal' && sq === current.piece.square) return 'correct';
    return undefined;
  }, [current, phase]);

  const pieceLabel = (p: { type: PieceType; color: 'w' | 'b' }) => {
    const name = t(`blindfold.piece.${PIECE_NAME_KEYS[p.type]}`, PIECE_NAME_EN[p.type]);
    const color = p.color === 'w' ? t('blindfold.color.white', 'White') : t('blindfold.color.black', 'Black');
    return `${color} ${name.toLowerCase()}`;
  };

  // палитра выбора фигуры (под жизнями)
  const palette = (
    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 1 }}>
      {ANSWER_PIECE_OPTIONS.map(({ type, color }) => (
        <ToggleButton
          key={`${color}${type}`}
          value={`${color}${type}`}
          disabled={!!picked}
          selected={false}
          onClick={() => onPickPiece(type, color)}
          sx={{
            fontSize: 26,
            lineHeight: 1,
            p: 0.75,
            color: color === 'w' ? '#FFFFFF' : '#111418',
            textShadow: color === 'w' ? '0 0 1px #000, 0 0 1px #000' : 'none',
            bgcolor: 'rgba(110,127,149,.35)',
          }}
          aria-label={pieceLabel({ type, color })}
        >
          {GLYPH[type]}
        </ToggleButton>
      ))}
    </Box>
  );

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
          return (
            <SquareCell
              key={sq}
              square={sq}
              dark={dark}
              piece={piecesOnBoard[sq]}
              hidden={hidden}
              highlight={squareHighlight(sq)}
              showFileLabel={rIdx === 7 ? file : undefined}
              showRankLabel={fIdx === 0 ? String(rank) : undefined}
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
        subtitle={t('blindfold.subtitle', 'Memorise one position, then keep it in your head and name the piece that can reach each called square.')}
        actions={phase !== 'settings' ? (
          <Stack direction="row" spacing={2} alignItems="center">
            <Lives lives={lives} />
            <Typography variant="body2" color="text.secondary">
              {t('blindfold.score', 'Correct')}: <b>{correct}</b>
            </Typography>
          </Stack>
        ) : undefined}
      />

      <Stack direction={{ xs: 'column', md: 'row' }} spacing={3} alignItems="flex-start">
        {/* ЛЕВО: настройки / статус + палитра под жизнями */}
        <Paper variant="outlined" sx={{ p: 3, width: { xs: '100%', md: 360 }, flexShrink: 0 }}>
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
                  min={3}
                  max={20}
                  step={1}
                  marks={[{ value: 3, label: '3' }, { value: 10, label: '10' }, { value: 20, label: '20' }]}
                  valueLabelDisplay="auto"
                />
              </Box>

              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  {t('blindfold.settings.questions', 'Questions in a row')}: {totalQuestions}
                </Typography>
                <Slider
                  value={totalQuestions}
                  onChange={(_, v) => setTotalQuestions(v as number)}
                  min={50}
                  max={75}
                  step={1}
                  marks={[{ value: 50, label: '50' }, { value: 60, label: '60' }, { value: 75, label: '75' }]}
                  valueLabelDisplay="auto"
                />
              </Box>

              <Typography variant="body2" color="text.secondary">
                {t('blindfold.rules', 'One position, 3 lives. Memorise it once, then name the piece that can move to each called square.')}
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
                  {phase === 'question' && t('blindfold.phase.question', 'Name the piece')}
                  {phase === 'reveal' && t('blindfold.phase.reveal', 'Answer')}
                  {phase === 'gameover' && t('blindfold.phase.gameover', 'Game over')}
                </Typography>
              </Box>

              {phase === 'memorize' && (
                <>
                  <Typography variant="h3" sx={{ fontVariantNumeric: 'tabular-nums' }}>{memorizeLeft}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {t('blindfold.memorize.hint', 'Remember every piece and its square — you keep this one position in your head.')}
                  </Typography>
                </>
              )}

              {(phase === 'question' || phase === 'reveal') && current && (
                <>
                  <Typography variant="caption" color="text.secondary">
                    {t('blindfold.question.progress', 'Question {{i}} / {{n}}', { i: asked + (phase === 'reveal' ? 0 : 1), n: totalQuestions })}
                  </Typography>
                  <Typography variant="h6">
                    {t('blindfold.question.prompt', 'Which piece can move to {{square}}?', { square: current.target })}
                  </Typography>
                </>
              )}

              {phase === 'question' && (
                <>
                  {picked && lastCorrect && (
                    <Typography variant="subtitle1" sx={{ color: 'success.main', fontWeight: 700 }}>
                      {t('blindfold.question.correct', 'Correct!')}
                    </Typography>
                  )}
                  {!picked && (
                    <Typography variant="caption" color="text.secondary">
                      {t('blindfold.question.pickHint', 'Pick the piece from the palette below.')}
                    </Typography>
                  )}
                </>
              )}

              {phase === 'reveal' && current && (
                <Fade in>
                  <Stack spacing={1.5}>
                    <Typography variant="subtitle1" sx={{ color: 'error.main', fontWeight: 700 }}>
                      {t('blindfold.reveal.wrong', 'Not quite.')}
                    </Typography>
                    {picked && (
                      <Typography variant="body2" color="text.secondary">
                        {t('blindfold.reveal.yourPick', 'You picked {{piece}}.', { piece: pieceLabel(picked) })}
                      </Typography>
                    )}
                    <Typography variant="body2" color="text.secondary">
                      {t('blindfold.reveal.answerWas', 'The {{piece}} on {{square}} could move to {{target}}.', {
                        piece: pieceLabel(current.piece),
                        square: current.piece.square,
                        target: current.target,
                      })}
                    </Typography>
                    <Button variant="contained" onClick={onContinue} sx={{ mt: 1 }}>
                      {ended ? t('blindfold.reveal.results', 'See results') : t('blindfold.reveal.next', 'Next')}
                    </Button>
                  </Stack>
                </Fade>
              )}

              {phase === 'gameover' && (
                <Fade in>
                  <Stack spacing={1.5}>
                    <Typography variant="h6">
                      {lives <= 0 ? t('blindfold.gameover.outOfLives', 'Out of lives') : t('blindfold.gameover.finished', 'Series complete')}
                    </Typography>
                    <Typography variant="body2">
                      {t('blindfold.gameover.result', 'Correct: {{correct}} of {{asked}}.', { correct, asked })}
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

              {/* жизни + палитра выбора фигуры ПОД жизнями */}
              {phase !== 'gameover' && (
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Stack spacing={1.5}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Typography variant="caption" color="text.secondary">{t('blindfold.livesLabel', 'Lives')}</Typography>
                      <Lives lives={lives} />
                    </Stack>
                    {phase === 'question' && palette}
                  </Stack>
                </Paper>
              )}
            </Stack>
          </Collapse>
        </Paper>

        {/* ПРАВО: доска */}
        <Box sx={{ flexGrow: 1, width: '100%' }}>
          {board}
          {phase === 'question' && (
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'center', mt: 1 }}>
              {t('blindfold.question.boardHint', 'The board is blank — the highlighted square is the target.')}
            </Typography>
          )}
        </Box>
      </Stack>
    </PageContainer>
  );
};

export default BlindfoldTrainerPage;
