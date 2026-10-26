import React from 'react';
import { Box, Paper, Stack, Typography, Avatar, Button, Tooltip } from '@mui/material';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import CancelRoundedIcon from '@mui/icons-material/CancelRounded';
import MoreHorizRoundedIcon from '@mui/icons-material/MoreHorizRounded';
import { useTranslation } from 'react-i18next';

export type AnswerStatus = 'correct' | 'wrong' | 'thinking' | 'idle';

export interface StudentAnswer {
  /** Последний ход ученика в текущей задаче (SAN), если был */
  move?: string;
  status: AnswerStatus;
}

export interface StudentAnswersPanelProps {
  /** Ученики класса (из presence, роль student) */
  students: { userId: string; name: string }[];
  /** Ответы по userId — приходят с сервера в режиме решения (может отсутствовать, тогда статус выводится из solving) */
  answers?: Record<string, StudentAnswer>;
  /** Идёт ли режим решения */
  solving: boolean;
  /** Тренер видит кнопку «показать ход всему классу» */
  isCoach?: boolean;
  onShowMove?: (userId: string) => void;
}

const initialsOf = (name: string) =>
  name.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase() ?? '').join('') || '?';

const STATUS_META: Record<AnswerStatus, { color: string; icon: React.ReactNode | null; key: string; fallback: string }> = {
  correct: { color: 'success.main', icon: <CheckCircleRoundedIcon sx={{ fontSize: 18 }} />, key: 'classroom.answers.correct', fallback: 'Correct' },
  wrong: { color: 'error.main', icon: <CancelRoundedIcon sx={{ fontSize: 18 }} />, key: 'classroom.answers.wrong', fallback: 'Wrong' },
  thinking: { color: 'text.secondary', icon: <MoreHorizRoundedIcon sx={{ fontSize: 18 }} />, key: 'classroom.answers.thinking', fallback: 'Thinking…' },
  idle: { color: 'text.disabled', icon: null, key: 'classroom.answers.idle', fallback: '—' },
};

/** Панель «Ответы учеников N/M» с ходом и статусом каждого ученика (по макету группового урока). */
export const StudentAnswersPanel: React.FC<StudentAnswersPanelProps> = ({ students, answers, solving, isCoach, onShowMove }) => {
  const { t } = useTranslation();

  const resolved = students.map((s) => {
    const a = answers?.[s.userId];
    const status: AnswerStatus = a?.status ?? (solving ? 'thinking' : 'idle');
    return { ...s, move: a?.move, status };
  });
  const answered = resolved.filter((s) => s.status === 'correct' || s.status === 'wrong').length;

  return (
    <Paper sx={{ p: 2, borderRadius: 3, border: '1px solid', borderColor: 'divider', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.25 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{t('classroom.answers.title', 'Student answers')}</Typography>
        <Typography variant="body2" color="text.secondary">{answered} / {students.length || 0}</Typography>
      </Stack>

      {/* Полоса прогресса-сегментов */}
      <Stack direction="row" spacing={0.5} sx={{ mb: 1.5 }}>
        {resolved.map((s) => (
          <Box key={s.userId} sx={{
            flex: 1, height: 5, borderRadius: 3,
            bgcolor: s.status === 'correct' ? 'success.main' : s.status === 'wrong' ? 'error.main' : 'action.hover',
          }} />
        ))}
      </Stack>

      <Stack spacing={0.75} sx={{ overflowY: 'auto', flex: 1, minHeight: 0 }}>
        {resolved.length === 0 && (
          <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
            {t('classroom.answers.empty', 'No students in the class yet')}
          </Typography>
        )}
        {resolved.map((s) => {
          const meta = STATUS_META[s.status];
          return (
            <Stack key={s.userId} direction="row" alignItems="center" spacing={1.25} sx={{ py: 0.5 }}>
              <Avatar sx={{ width: 28, height: 28, fontSize: 11, fontWeight: 700, bgcolor: 'rgba(43,80,224,0.1)', color: 'primary.main' }}>{initialsOf(s.name)}</Avatar>
              <Typography variant="body2" sx={{ flex: 1, fontWeight: 500 }} noWrap>{s.name}</Typography>
              {s.move && (
                <Typography variant="caption" sx={{ fontFamily: '"JetBrains Mono"', fontWeight: 600 }}>{s.move}</Typography>
              )}
              <Stack direction="row" spacing={0.5} alignItems="center" sx={{ color: meta.color, minWidth: 74, justifyContent: 'flex-end' }}>
                {meta.icon}
                <Typography variant="caption" sx={{ color: meta.color, fontWeight: 600 }}>{t(meta.key, meta.fallback)}</Typography>
              </Stack>
            </Stack>
          );
        })}
      </Stack>

      {isCoach && onShowMove && resolved.some((s) => s.status === 'correct') && (
        <Tooltip title={t('classroom.answers.showHint', 'Show a correct student move to the whole class')}>
          <Button size="small" variant="outlined" color="inherit" sx={{ mt: 1.5, borderColor: 'divider', color: 'text.primary' }}
            onClick={() => {
              const first = resolved.find((s) => s.status === 'correct');
              if (first) onShowMove(first.userId);
            }}>
            {t('classroom.answers.showToClass', 'Show move to the class')}
          </Button>
        </Tooltip>
      )}
    </Paper>
  );
};
