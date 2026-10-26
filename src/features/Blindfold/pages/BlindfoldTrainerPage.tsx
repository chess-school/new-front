import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Box, Button, Collapse, Fade, LinearProgress, Paper, Slider, Stack,
  ToggleButton, ToggleButtonGroup, Typography,
} from '@mui/material';
import { PageContainer, PageHeader } from '@/shared/components/ui/PageHeader';
import { useTranslation } from 'react-i18next';

import {
  buildQuestion, describeStep, generateSession,
  type BlindfoldQuestion, type BlindfoldSession, type Piece, type PieceType,
} from '../services/blindfoldTrainerEngine';

// ---------------------------------------------------------------- доска / глифы

const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
// Рисуем сверху вниз: ранг 8 → 1, слева направо: файл a → h (вид «от белых»)
const RANKS = [8, 7, 6, 5, 4, 3, 2, 1];

// Юникод-глифы шахматных фигур. Берём «заливные» (чёрные) глифы для обоих цветов,
// а цвет фигуры передаём через CSS color + обводку — так белые видны и на светлых полях.
const GLYPH: Record<PieceType, string> = {
  q: '♛', // ♛
  r: '♜', // ♜
  b: '♝', // ♝
  n: '♞', // ♞
  p: '♟', // ♟
};

const PIECE_NAME_KEYS: Record<PieceType, string> = {
  q: 'queen', r: 'rook', b: 'bishop', n: 'knight', p: 'pawn',
};
const PIECE_NAME_EN: Record<PieceType, string> = {
  q: 'Queen', r: 'Rook', b: 'Bishop', n: 'Knight', p: 'Pawn',
};

type Phase = 'settings' | 'memorize' | 'blindfold' | 'question' | 'result';

const PIECE_CHOICES = [4, 6, 8, 10] as const;

// Один набор фигур для вариантов ответа в вопросе «что на поле?»
const ANSWER_PIECE_OPTIONS: { type: PieceType; color: 'w' | 'b' }[] = [
  ...(['q', 'r', 'b', 'n', 'p'] as PieceType[]).map((type) => ({ type, color: 'w' as const })),
  ...(['q', 'r', 'b', 'n', 'p'] as PieceType[]).map((type) => ({ type, color: 'b' as const })),
];

// ---------------------------------------------------------------- клетка доски

interface SquareCellProps {
  square: string;
  dark: boolean;
  piece?: Piece;
  hidden: boolean; // слепая фаза — фигуры скрыты
  showFileLabel?: string;
  showRankLabel?: string;
  clickable: boolean;
  selected: boolean;
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
  square, dark, piece, hidden, showFileLabel, showRankLabel, clickable, selected, highlight, onClick,
}) => {
  const bg = highlight === 'correct' ? '#2E7D32'
    : highlight === 'wrong' ? '#C62828'
    : highlight === 'ask' ? '#B8860B'
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
        outline: selected ? '3px solid #E5B849' : 'none',
        outlineOffset: '-3px',
        '&:hover': clickable ? { filter: 'brightness(1.12)' } : undefined,
      }}
    >
      {/* координаты в углах */}
      {showFileLabel && (
        <Box component="span" sx={{ position: 'absolute', right: 3, bottom: 1, fontSize: 10, opacity: 0.7, color: dark ? LIGHT : DARK }}>
          {showFileLabel}
        </Box>
      )}
      {showRankLabel && (
        <Box component="span" sx={{ position: 'absolute', left: 3, top: 1, fontSize: 10, opacity: 0.7, color: dark ? LIGHT : DARK }}>
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

// ---------------------------------------------------------------- страница

export const BlindfoldTrainerPage: React.FC = () => {
  const { t } = useTranslation();

  // настройки
  const [pieceCount, setPieceCount] = useState<number>(6);
  const [moveCount, setMoveCount] = useState<number>(20);
  const [speed, setSpeed] = useState<number>(3); // секунд на шаг / показ

  // состояние сессии
  const [phase, setPhase] = useState<Phase>('settings');
  const [session, setSession] = useState<BlindfoldSession | null>(null);
  const [memorizeLeft, setMemorizeLeft] = useState<number>(0);
  const [stepIndex, setStepIndex] = useState<number>(0);

  // вопрос / ответ
  const [question, setQuestion] = useState<BlindfoldQuestion | null>(null);
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
  const [answered, setAnswered] = useState<boolean>(false);
  const [lastCorrect, setLastCorrect] = useState<boolean>(false);
  const [answerSeconds, setAnswerSeconds] = useState<number>(0);

  // статистика
  const [attempts, setAttempts] = useState<number>(0);
  const [correct, setCorrect] = useState<number>(0);

  // таймеры — храним ссылки для очистки
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const answerTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTimers = useCallback(() => {
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
    if (timeoutRef.current) { clearTimeout(timeoutRef.current); timeoutRef.current = null; }
    if (answerTimerRef.current) { clearInterval(answerTimerRef.current); answerTimerRef.current = null; }
  }, []);

  // озвучка (best-effort, не фатально при отсутствии)
  const speak = useCallback((text: string) => {
    try {
      const synth = typeof window !== 'undefined' ? window.speechSynthesis : undefined;
      if (!synth || typeof window.SpeechSynthesisUtterance === 'undefined') return;
      const u = new window.SpeechSynthesisUtterance(text);
      u.lang = 'ru-RU';
      const ruVoice = synth.getVoices().find((v) => v.lang?.toLowerCase().startsWith('ru'));
      if (ruVoice) u.voice = ruVoice;
      synth.cancel();
      synth.speak(u);
    } catch {
      /* озвучка не обязательна */
    }
  }, []);

  // очистка при размонтировании
  useEffect(() => () => {
    clearTimers();
    try { window.speechSynthesis?.cancel(); } catch { /* noop */ }
  }, [clearTimers]);

  // --- ход фаз ---

  const startSession = useCallback(() => {
    clearTimers();
    const s = generateSession({ pieceCount, moveCount });
    setSession(s);
    setQuestion(null);
    setSelectedSquare(null);
    setAnswered(false);
    setStepIndex(0);
    setMemorizeLeft(speed);
    setPhase('memorize');
  }, [clearTimers, pieceCount, moveCount, speed]);

  const restart = useCallback(() => {
    clearTimers();
    try { window.speechSynthesis?.cancel(); } catch { /* noop */ }
    setSession(null);
    setQuestion(null);
    setPhase('settings');
  }, [clearTimers]);

  // отсчёт в фазе запоминания
  useEffect(() => {
    if (phase !== 'memorize') return;
    setMemorizeLeft(speed);
    intervalRef.current = setInterval(() => {
      setMemorizeLeft((left) => {
        if (left <= 1) {
          if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
          setPhase('blindfold');
          return 0;
        }
        return left - 1;
      });
    }, 1000);
    return () => { if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; } };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  // проигрывание шагов в слепой фазе
  useEffect(() => {
    if (phase !== 'blindfold' || !session) return;
    setStepIndex(0);
    const steps = session.steps;
    if (steps.length === 0) { setPhase('question'); return; }

    let i = 0;
    const playOne = () => {
      setStepIndex(i);
      speak(describeStep(steps[i]));
    };
    playOne(); // первый шаг сразу
    intervalRef.current = setInterval(() => {
      i += 1;
      if (i >= steps.length) {
        if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
        // небольшая пауза перед вопросом
        timeoutRef.current = setTimeout(() => goToQuestion(), Math.max(600, speed * 400));
        return;
      }
      playOne();
    }, speed * 1000);

    return () => {
      if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
      if (timeoutRef.current) { clearTimeout(timeoutRef.current); timeoutRef.current = null; }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, session]);

  const goToQuestion = useCallback(() => {
    if (!session) return;
    try { window.speechSynthesis?.cancel(); } catch { /* noop */ }
    const q = buildQuestion(session);
    setQuestion(q);
    setSelectedSquare(null);
    setAnswered(false);
    setAnswerSeconds(0);
    setPhase('question');
    answerTimerRef.current = setInterval(() => setAnswerSeconds((n) => n + 1), 1000);
  }, [session]);

  const stopAnswerTimer = useCallback(() => {
    if (answerTimerRef.current) { clearInterval(answerTimerRef.current); answerTimerRef.current = null; }
  }, []);

  const finishAnswer = useCallback((ok: boolean) => {
    stopAnswerTimer();
    setAnswered(true);
    setLastCorrect(ok);
    setAttempts((a) => a + 1);
    if (ok) setCorrect((c) => c + 1);
  }, [stopAnswerTimer]);

  // клик по полю (вопрос where-piece)
  const onSquareClick = useCallback((sq: string) => {
    if (phase !== 'question' || !question || answered || question.kind !== 'where-piece') return;
    setSelectedSquare(sq);
    finishAnswer(sq === question.answerSquare);
  }, [phase, question, answered, finishAnswer]);

  // выбор фигуры (вопрос what-on-square)
  const onPieceChoice = useCallback((type: PieceType, color: 'w' | 'b') => {
    if (phase !== 'question' || !question || answered || question.kind !== 'what-on-square') return;
    const ans = question.answerPiece;
    finishAnswer(!!ans && ans.type === type && ans.color === color);
  }, [phase, question, answered, finishAnswer]);

  // карта: поле → фигура для отображения initial / финала
  const initialBySquare = useMemo(() => {
    const map: Record<string, Piece> = {};
    if (session) for (const p of session.initial) map[p.square] = p;
    return map;
  }, [session]);

  // что показываем на доске
  const piecesOnBoard = phase === 'memorize' ? initialBySquare
    : (answered && session) ? session.finalBySquare
    : {};
  const hidden = phase === 'blindfold' || (phase === 'question' && !answered);

  const successPct = attempts > 0 ? Math.round((correct / attempts) * 100) : 0;

  // подсветка для результата / вопроса
  const squareHighlight = useCallback((sq: string): SquareCellProps['highlight'] => {
    if (!question) return undefined;
    if (phase === 'question' && question.kind === 'what-on-square' && question.square === sq) return 'ask';
    if (answered && question.kind === 'where-piece') {
      if (sq === question.answerSquare) return 'correct';
      if (sq === selectedSquare && sq !== question.answerSquare) return 'wrong';
    }
    return undefined;
  }, [question, phase, answered, selectedSquare]);

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
          const clickable = phase === 'question' && !!question && question.kind === 'where-piece' && !answered;
          return (
            <SquareCell
              key={sq}
              square={sq}
              dark={dark}
              piece={piecesOnBoard[sq]}
              hidden={hidden}
              clickable={clickable}
              selected={selectedSquare === sq}
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

  const pieceLabel = (p: Piece) => {
    const name = t(`blindfold.piece.${PIECE_NAME_KEYS[p.type]}`, PIECE_NAME_EN[p.type]);
    const color = p.color === 'w' ? t('blindfold.color.white', 'White') : t('blindfold.color.black', 'Black');
    return `${color} ${name.toLowerCase()}`;
  };

  return (
    <PageContainer maxWidth={1100}>
      <PageHeader
        eyebrow={t('nav.groups.training', 'Training')}
        title={t('blindfold.title', 'Blindfold memory')}
        subtitle={t('blindfold.subtitle', 'Memorise the position, follow the moves in your head, then answer where the pieces ended up.')}
        actions={attempts > 0 ? (
          <Typography variant="body2" color="text.secondary">
            {t('blindfold.stats.inline', '{{correct}}/{{attempts}} correct · {{pct}}%', { correct, attempts, pct: successPct })}
          </Typography>
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
              </Box>

              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  {t('blindfold.settings.moveCount', 'Series length (moves)')}: {moveCount}
                </Typography>
                <Slider
                  value={moveCount}
                  onChange={(_, v) => setMoveCount(v as number)}
                  min={10}
                  max={50}
                  step={1}
                  marks={[{ value: 10, label: '10' }, { value: 30, label: '30' }, { value: 50, label: '50' }]}
                  valueLabelDisplay="auto"
                />
              </Box>

              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  {t('blindfold.settings.speed', 'Show / move speed (seconds)')}: {speed}
                </Typography>
                <Slider
                  value={speed}
                  onChange={(_, v) => setSpeed(v as number)}
                  min={1}
                  max={5}
                  step={1}
                  marks
                  valueLabelDisplay="auto"
                />
              </Box>

              <Button variant="contained" size="large" onClick={startSession}>
                {t('blindfold.start', 'Start')}
              </Button>
            </Stack>
          </Collapse>

          <Collapse in={phase !== 'settings'} unmountOnExit>
            <Stack spacing={2}>
              <Box>
                <Typography variant="overline" color="text.secondary">
                  {phase === 'memorize' && t('blindfold.phase.memorize', 'Memorise')}
                  {phase === 'blindfold' && t('blindfold.phase.blindfold', 'Blindfold moves')}
                  {phase === 'question' && t('blindfold.phase.question', 'Question')}
                  {phase === 'result' && t('blindfold.phase.result', 'Result')}
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

              {phase === 'blindfold' && session && (
                <>
                  <Typography variant="body2" color="text.secondary">
                    {t('blindfold.blindfold.progress', 'Move {{i}} / {{n}}', { i: stepIndex + 1, n: session.steps.length })}
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={session.steps.length ? ((stepIndex + 1) / session.steps.length) * 100 : 0}
                  />
                  <Paper variant="outlined" sx={{ p: 2, textAlign: 'center', bgcolor: 'action.hover' }}>
                    <Typography variant="h5">{describeStep(session.steps[stepIndex])}</Typography>
                  </Paper>
                  <Typography variant="caption" color="text.secondary">
                    {t('blindfold.blindfold.hint', 'Track the moves in your head — the board is blank.')}
                  </Typography>
                </>
              )}

              {phase === 'question' && question && (
                <>
                  <Typography variant="caption" color="text.secondary">
                    {t('blindfold.question.timer', 'Time: {{s}}s', { s: answerSeconds })}
                  </Typography>
                  {question.kind === 'where-piece' && question.piece && (
                    <Typography variant="h6">
                      {t('blindfold.question.wherePiece', 'Which square holds the {{piece}}?', { piece: pieceLabel(question.piece) })}
                    </Typography>
                  )}
                  {question.kind === 'what-on-square' && (
                    <>
                      <Typography variant="h6">
                        {t('blindfold.question.whatOnSquare', 'Which piece stands on {{square}}?', { square: question.square })}
                      </Typography>
                      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 1 }}>
                        {ANSWER_PIECE_OPTIONS.map(({ type, color }) => (
                          <ToggleButton
                            key={`${color}${type}`}
                            value={`${color}${type}`}
                            disabled={answered}
                            selected={false}
                            onClick={() => onPieceChoice(type, color)}
                            sx={{
                              fontSize: 26,
                              lineHeight: 1,
                              color: color === 'w' ? '#FFFFFF' : '#111418',
                              textShadow: color === 'w' ? '0 0 1px #000, 0 0 1px #000' : 'none',
                              bgcolor: 'rgba(110,127,149,.35)',
                            }}
                          >
                            {GLYPH[type]}
                          </ToggleButton>
                        ))}
                      </Box>
                    </>
                  )}

                  {answered && (
                    <Fade in>
                      <Box>
                        <Typography variant="subtitle1" sx={{ color: lastCorrect ? 'success.main' : 'error.main', fontWeight: 700 }}>
                          {lastCorrect ? t('blindfold.question.right', 'Correct!') : t('blindfold.question.wrong', 'Not quite.')}
                        </Typography>
                        {question.kind === 'where-piece' && !lastCorrect && (
                          <Typography variant="body2" color="text.secondary">
                            {t('blindfold.question.answerWasSquare', 'It was on {{square}}.', { square: question.answerSquare })}
                          </Typography>
                        )}
                        {question.kind === 'what-on-square' && question.answerPiece && (
                          <Typography variant="body2" color="text.secondary">
                            {t('blindfold.question.answerWasPiece', 'It was the {{piece}}.', { piece: pieceLabel(question.answerPiece) })}
                          </Typography>
                        )}
                        <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
                          <Button variant="contained" onClick={startSession}>
                            {t('blindfold.again', 'Play again')}
                          </Button>
                          <Button variant="outlined" onClick={restart}>
                            {t('blindfold.settings.change', 'Settings')}
                          </Button>
                        </Stack>
                      </Box>
                    </Fade>
                  )}
                </>
              )}

              {attempts > 0 && (
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>{t('blindfold.stats.title', 'Your stats')}</Typography>
                  <Typography variant="body2">
                    {t('blindfold.stats.line', 'Correct {{correct}} of {{attempts}} — {{pct}}%', { correct, attempts, pct: successPct })}
                  </Typography>
                </Paper>
              )}
            </Stack>
          </Collapse>
        </Paper>

        {/* ПРАВО: доска */}
        <Box sx={{ flexGrow: 1, width: '100%' }}>
          {board}
          {phase === 'question' && question?.kind === 'where-piece' && !answered && (
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'center', mt: 1 }}>
              {t('blindfold.question.clickHint', 'Click the square on the blank board.')}
            </Typography>
          )}
        </Box>
      </Stack>
    </PageContainer>
  );
};

export default BlindfoldTrainerPage;
