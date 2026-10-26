import React, { useEffect, useRef, useState } from 'react';
import { Box, IconButton, MenuItem, Stack, TextField, Typography } from '@mui/material';
import SendRoundedIcon from '@mui/icons-material/SendRounded';
import LockRoundedIcon from '@mui/icons-material/LockRounded';
import { useTranslation } from 'react-i18next';
import { ChatMessage, Participant } from '../classroomApi';

interface ChatPanelProps {
  messages: ChatMessage[];
  myUserId?: string;
  participants: Participant[];
  onSend: (text: string, to?: string) => void;
}

/** Чат урока: сообщения всем или лично выбранному участнику; поле ввода всегда закреплено снизу. */
export const ChatPanel: React.FC<ChatPanelProps> = ({ messages, myUserId, participants, onSend }) => {
  const { t } = useTranslation();
  const [text, setText] = useState('');
  const [to, setTo] = useState(''); // '' = всем
  const boxRef = useRef<HTMLDivElement | null>(null);

  // Скролл только внутри ленты сообщений (не scrollIntoView — он дёргает всё окно браузера)
  useEffect(() => {
    const el = boxRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages.length]);

  // Если выбранный адресат вышел — сбрасываем на «всем»
  useEffect(() => {
    if (to && !participants.some((p) => p.userId === to)) setTo('');
  }, [participants, to]);

  const submit = () => {
    const clean = text.trim();
    if (!clean) return;
    onSend(clean, to || undefined);
    setText('');
  };

  const others = participants.filter((p) => p.userId !== myUserId);

  return (
    <Stack spacing={1} sx={{ minHeight: 0, height: '100%' }}>
      <Box ref={boxRef} sx={{ flex: 1, minHeight: 0, overflowY: 'auto', pr: 0.5 }}>
        {messages.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            {t('classroom.chat.empty', { defaultValue: 'Сообщений пока нет — напишите первым.' })}
          </Typography>
        ) : (
          <Stack spacing={0.75}>
            {messages.map((m) => {
              const mine = m.userId === myUserId;
              const priv = !!m.to;
              return (
                <Box key={m.id} sx={{ alignSelf: mine ? 'flex-end' : 'flex-start', maxWidth: '85%' }}>
                  {!mine && <Typography variant="caption" color="text.secondary">{m.name}</Typography>}
                  <Box sx={{
                    px: 1.25, py: 0.75, borderRadius: '10px', wordBreak: 'break-word',
                    bgcolor: mine ? 'primary.main' : 'surface.raised',
                    color: mine ? 'primary.contrastText' : 'text.primary',
                    border: priv ? '1px dashed' : (mine ? 'none' : '1px solid'),
                    borderColor: priv ? 'warning.main' : 'divider',
                  }}>
                    {priv && (
                      <Stack direction="row" spacing={0.5} alignItems="center" sx={{ opacity: 0.85, mb: 0.25 }}>
                        <LockRoundedIcon sx={{ fontSize: 12 }} />
                        <Typography variant="caption">
                          {mine
                            ? `${t('classroom.chat.privateTo', { defaultValue: 'лично' })} ${m.toName || ''}`.trim()
                            : t('classroom.chat.privateFrom', { defaultValue: 'лично вам' })}
                        </Typography>
                      </Stack>
                    )}
                    <Typography variant="body2">{m.text}</Typography>
                  </Box>
                </Box>
              );
            })}
          </Stack>
        )}
      </Box>

      <Stack spacing={0.75} sx={{ flexShrink: 0 }}>
        {others.length > 0 && (
          <TextField
            select size="small" fullWidth
            value={to}
            onChange={(e) => setTo(e.target.value)}
            SelectProps={{ MenuProps: { disablePortal: true } }}
          >
            <MenuItem value="">{t('classroom.chat.toAll', { defaultValue: 'Всем' })}</MenuItem>
            {others.map((p) => (
              <MenuItem key={p.userId} value={p.userId}>
                {t('classroom.chat.toOne', { defaultValue: 'Лично' })}: {p.name}
              </MenuItem>
            ))}
          </TextField>
        )}
        <Stack direction="row" spacing={1} alignItems="flex-end">
          <TextField
            size="small" fullWidth multiline maxRows={3}
            placeholder={to
              ? t('classroom.chat.placeholderPrivate', { defaultValue: 'Личное сообщение…' })
              : t('classroom.chat.placeholder', { defaultValue: 'Написать сообщение…' })}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit(); } }}
          />
          <IconButton color="primary" onClick={submit} disabled={!text.trim()} aria-label={t('classroom.chat.send', { defaultValue: 'Отправить' })}>
            <SendRoundedIcon />
          </IconButton>
        </Stack>
      </Stack>
    </Stack>
  );
};

export default ChatPanel;
