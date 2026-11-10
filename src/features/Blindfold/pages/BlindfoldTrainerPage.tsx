import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Box, Button, Collapse, Fade, Paper, Slider, Stack,
  ToggleButton, ToggleButtonGroup, Typography,
} from '@mui/material';
import FavoriteRounded from '@mui/icons-material/FavoriteRounded';
import FavoriteBorderRounded from '@mui/icons-material/FavoriteBorderRounded';
import { Chessboard } from 'react-chessboard';
import type { BoardPosition } from 'react-chessboard/dist/chessboard/types';
import { PageContainer, PageHeader } from '@/shared/components/ui/PageHeader';
import { useTranslation } from 'react-i18next';

import {
  buildLineBlock, type BlindfoldLine, type LineStep, type Piece, type PieceType,
} from '../services/blindfoldTrainerEngine';
import { PIECE_SVG, type PieceCode } from '../pieceSvgs';

// ---------------------------------------------------------------- фигуры / доска

const PIECE_NAME_KEYS: Record<PieceType, string> = {
  q: 'queen', r: 'rook', b: 'bishop', n: 'knight', p: 'pawn',
};
const PIECE_NAME_EN: Record<PieceType, string> = {
  q: 'Queen', r: 'Rook', b: 'Bishop', n: 'Knight', p: 'Pawn',
};

const LIGHT = '#E9EDF2';
const DARK = '#6E7F95';

// settings → memorize → question → reveal → gameover
type Phase = 'settings' | 'memorize' | 'question' | 'reveal' | 'gameover';

const PIECE_CHOICES = [4, 6, 8, 10] as const;
const LIVES = 3;
const BLOCK_SIZE = 12;      // сколько линий держим в блоке на каждый расклад
const MAX_LINE_MOVES = 75;  // линии в блоке длиной ровно 75 ходов

// Палитра ответов: 5 типов × 2 цвета (белые сверху, чёрные снизу)
const ANSWER_PIECE_OPTIONS: { type: PieceType; color: 'w' | 'b' }[] = [
  ...(['q', 'r', 'b', 'n', 'p'] as PieceType[]).map((type) => ({ type, color: 'w' as const })),
  ...(['q', 'r', 'b', 'n', 'p'] as PieceType[]).map((type) => ({ type, color: 'b' as const })),
];

const toPieceCode = (p: { type: PieceType; color: 'w' | 'b' }): PieceCode =>
  `${p.color}${p.type.toUpperCase()}` as PieceCode;

const toBoardPosition = (bySquare: Record<string, Piece>): BoardPosition => {
  const pos: Record<string, PieceCode> = {};
  for (const sq of Object.keys(bySquare)) pos[sq] = toPieceCode(bySquare[sq]);
  return pos as BoardPosition;
};

// Блок заранее подготовленных и протестированных линий, кэш по числу фигур.
// Детерминирован (buildLineBlock сканирует сиды по порядку) — инвариант проверяется юнит-тестами.
const blockCache = new Map<number, BlindfoldLine[]>();
const getBlock = (pieceCount: number): BlindfoldLine[] => {
  let block = blockCache.get(pieceCount);
  if (!block || block.length === 0) {
    block = buildLineBlock({ pieceCount, count: BLOCK_SIZE, minMoves: MAX_LINE_MOVES, maxMoves: MAX_LINE_MOVES });
    blockCache.set(pieceCount, block);
  }
  return block;
};

// Снимок позиции из списка фигур
const indexBySquare = (pieces: Piece[]): Record<string, Piece> => {
  const map: Record<string, Piece> = {};
  for (const p of pieces) map[p.square] = { ...p };
  return map;
};

// Применить ход линии к позиции (возвращает новый объект)
const applyMove = (prev: Record<string, Piece>, step: LineStep): Record<string, Piece> => {
  const next = { ...prev };
  const mover = next[step.from];
  if (!mover) return next;
  delete next[step.from];
  next[step.target] = { ...mover, square: step.target };
  return next;
};

// фигура из палитры (тот же SVG-набор, что и на доске)
const PaletteGlyph: React.FC<{ code: PieceCode }> = ({ code }) => (
  <Box
    sx={{ width: 30, height: 30, display: 'grid', placeItems: 'center' }}
    dangerouslySetInnerHTML={{ __html: PIECE_SVG[code] }}
  />
);

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
  const [lineLength, setLineLength] = useState<number>(60);     // длина разыгрываемой линии

  // состояние партии
  const [phase, setPhase] = useState<Phase>('settings');
  const [line, setLine] = useState<BlindfoldLine | null>(null);
  const [live, setLive] = useState<Record<string, Piece>>({}); // текущая (эволюционирующая) позиция
  const [stepIndex, setStepIndex] = useState<number>(0);
  const [memorizeLeft, setMemorizeLeft] = useState<number>(0);
  const [lives, setLives] = useState<number>(LIVES);
  const [correct, setCorrect] = useState<number>(0);
  const [best, setBest] = useState<number>(0);

  // ответ текущего хода
  const [picked, setPicked] = useState<{ type: PieceType; color: 'w' | 'b' } | null>(null);
  const [lastCorrect, setLastCorrect] = useState<boolean>(false);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const flashRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ширина доски — чтобы react-chessboard масштабировался по контейнеру
  const boardWrapRef = useRef<HTMLDivElement | null>(null);
  const [boardWidth, setBoardWidth] = useState<number>(400);
  useEffect(() => {
    const el = boardWrapRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width;
      if (w) setBoardWidth(Math.max(240, Math.min(Math.floor(w), 520)));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const clearTimers = useCallback(() => {
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
    if (flashRef.current) { clearTimeout(flashRef.current); flashRef.current = null; }
  }, []);

  useEffect(() => () => clearTimers(), [clearTimers]);

  const limit = line ? Math.min(lineLength, line.steps.length) : 0;
  const current: LineStep | null = line && stepIndex < line.steps.length ? line.steps[stepIndex] : null;

  // --- запуск партии ---
  const startGame = useCallback(() => {
    clearTimers();
    const block = getBlock(pieceCount);
    const chosen = block[Math.floor(Math.random() * block.length)];
    setLine(chosen);
    setLive(indexBySquare(chosen.initial));
    setStepIndex(0);
    setLives(LIVES);
    setCorrect(0);
    setPicked(null);
    setMemorizeLeft(memorizeTime);
    setPhase('memorize');
  }, [clearTimers, pieceCount, memorizeTime]);

  const toSettings = useCallback(() => {
    clearTimers();
    setLine(null);
    setLive({});
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
    const ok = current.pieceType === type && current.pieceColor === color;
    setPicked({ type, color });
    setLastCorrect(ok);

    if (ok) {
      const nextCorrect = correct + 1;
      setCorrect(nextCorrect);
      setBest((b) => (nextCorrect > b ? nextCorrect : b));
      setLive((prev) => applyMove(prev, current)); // позиция меняется
      // короткая зелёная вспышка, затем следующий вопрос (доску не раскрываем)
      flashRef.current = setTimeout(() => {
        const next = stepIndex + 1;
        if (next >= limit) setPhase('gameover');
        else { setStepIndex(next); setPicked(null); }
      }, 750);
    } else {
      setLives((l) => Math.max(0, l - 1));
      setPhase('reveal'); // показываем позицию (до хода) после ошибки
    }
  }, [phase, current, picked, correct, stepIndex, limit]);

  // «Дальше» из reveal (после ошибки): применяем правильный ход и идём дальше
  const onContinue = useCallback(() => {
    if (!current) return;
    setLive((prev) => applyMove(prev, current));
    const next = stepIndex + 1;
    if (lives <= 0 || next >= limit) { setPhase('gameover'); return; }
    setStepIndex(next);
    setPicked(null);
    setPhase('question');
  }, [current, stepIndex, lives, limit]);

  const ended = lives <= 0 || stepIndex + 1 >= limit;

  // позиция на доске: в вопросе — пусто (слепо); иначе текущая
  const boardPosition = useMemo<BoardPosition>(
    () => (phase === 'question' ? {} : toBoardPosition(live)),
    [phase, live],
  );

  // подсветка: цель (синяя) в вопросе и разборе; поле ходящей фигуры (зелёное) в разборе
  const squareStyles = useMemo<Record<string, React.CSSProperties>>(() => {
    const styles: Record<string, React.CSSProperties> = {};
    if (!current) return styles;
    if (phase === 'question' || phase === 'reveal') {
      styles[current.target] = { background: 'rgba(43,80,224,.45)' };
    }
    if (phase === 'reveal') {
      styles[current.from] = { background: 'rgba(46,125,50,.55)' };
    }
    return styles;
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
          sx={{ p: 0.5, bgcolor: 'rgba(110,127,149,.18)' }}
          aria-label={pieceLabel({ type, color })}
        >
          <PaletteGlyph code={toPieceCode({ type, color })} />
        </ToggleButton>
      ))}
    </Box>
  );

  // --- рендер доски ---
  const board = (
    <Box ref={boardWrapRef} sx={{ width: '100%', maxWidth: 520, mx: 'auto' }}>
      <Chessboard
        id="blindfold-board"
        position={boardPosition}
        boardWidth={boardWidth}
        arePiecesDraggable={false}
        arePremovesAllowed={false}
        areArrowsAllowed={false}
        showBoardNotation
        animationDuration={200}
        customSquareStyles={squareStyles}
        customBoardStyle={{ borderRadius: 6, boxShadow: '0 2px 12px rgba(0,0,0,.3)' }}
        customDarkSquareStyle={{ backgroundColor: DARK }}
        customLightSquareStyle={{ backgroundColor: LIGHT }}
      />
    </Box>
  );

  return (
    <PageContainer maxWidth={1100}>
      <PageHeader
        eyebrow={t('nav.groups.training', 'Training')}
        title={t('blindfold.title', 'Blindfold vision')}
        subtitle={t('blindfold.subtitle', 'Memorise the position, then follow the line in your head: each move, name the only piece that can reach the called square.')}
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
                  {t('blindfold.settings.lineLength', 'Line length (moves)')}: {lineLength}
                </Typography>
                <Slider
                  value={lineLength}
                  onChange={(_, v) => setLineLength(v as number)}
                  min={50}
                  max={75}
                  step={1}
                  marks={[{ value: 50, label: '50' }, { value: 60, label: '60' }, { value: 75, label: '75' }]}
                  valueLabelDisplay="auto"
                />
              </Box>

              <Typography variant="body2" color="text.secondary">
                {t('blindfold.rules', '3 lives. The position changes after every move — keep it in your head and name the only piece that can reach the called square.')}
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
                    {t('blindfold.memorize.hint', 'Remember the position — it changes with every move. Track it in your head.')}
                  </Typography>
                </>
              )}

              {(phase === 'question' || phase === 'reveal') && current && (
                <>
                  <Typography variant="caption" color="text.secondary">
                    {t('blindfold.question.progress', 'Move {{i}} / {{n}}', { i: stepIndex + 1, n: limit })}
                  </Typography>
                  <Typography variant="h6">
                    {t('blindfold.question.prompt', 'Which piece can move to {{square}}?', { square: current.target })}
                  </Typography>
                </>
              )}

              {phase === 'question' && current && (
                <>
                  {picked && lastCorrect && (
                    <Typography variant="subtitle1" sx={{ color: 'success.main', fontWeight: 700 }}>
                      {t('blindfold.question.correctMove', 'Correct! {{piece}} → {{square}}', {
                        piece: pieceLabel({ type: current.pieceType, color: current.pieceColor }),
                        square: current.target,
                      })}
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
                      {t('blindfold.reveal.answerWas', 'The {{piece}} on {{square}} moves to {{target}}.', {
                        piece: pieceLabel({ type: current.pieceType, color: current.pieceColor }),
                        square: current.from,
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
                      {lives <= 0 ? t('blindfold.gameover.outOfLives', 'Out of lives') : t('blindfold.gameover.finished', 'Line complete')}
                    </Typography>
                    <Typography variant="body2">
                      {t('blindfold.gameover.result', 'Correct: {{correct}} of {{asked}}.', { correct, asked: Math.min(stepIndex + 1, limit) })}
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
