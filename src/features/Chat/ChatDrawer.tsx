import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Avatar, Badge, Box, Button, Chip, CircularProgress, Drawer, IconButton, List, ListItemAvatar, ListItemButton,
  ListItemText, ListSubheader, Stack, TextField, Tooltip, Typography, useMediaQuery, useTheme,
} from '@mui/material';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import SendRoundedIcon from '@mui/icons-material/SendRounded';
import DoneRoundedIcon from '@mui/icons-material/DoneRounded';
import DoneAllRoundedIcon from '@mui/icons-material/DoneAllRounded';
import ScheduleRoundedIcon from '@mui/icons-material/ScheduleRounded';
import ErrorOutlineRoundedIcon from '@mui/icons-material/ErrorOutlineRounded';
import ForumRoundedIcon from '@mui/icons-material/ForumRounded';
import ExtensionRoundedIcon from '@mui/icons-material/ExtensionRounded';
import AssignmentRoundedIcon from '@mui/icons-material/AssignmentRounded';
import MenuBookRoundedIcon from '@mui/icons-material/MenuBookRounded';
import { glass, tokens } from '@/theme/tokens';
import { useChat } from './chatContext';
import { ChatContext as ChatTopic, ChatContact, ChatMessage, ChatRoom, ChatUser } from './chatTypes';
import { sortedRooms } from './chatReducer';

const DRAWER_WIDTH = 400;
const TYPING_IDLE_MS = 2500;

const initials = (u?: Pick<ChatUser, 'firstName' | 'lastName'> | null) =>
  `${u?.firstName?.[0] ?? ''}${u?.lastName?.[0] ?? ''}`.toUpperCase() || '?';
const fullName = (u?: Pick<ChatUser, 'firstName' | 'lastName'> | null) => (u ? `${u.firstName} ${u.lastName}`.trim() : '');

const PersonAvatar: React.FC<{ user?: ChatUser | null; size?: number }> = ({ user, size = 40 }) => (
  <Avatar src={user?.avatarUrl ?? undefined} sx={{ width: size, height: size, bgcolor: 'surface.overlay', color: 'primary.main', fontWeight: 700, fontSize: size * 0.38 }}>
    {initials(user)}
  </Avatar>
);

const CONTEXT_ICONS: Record<ChatTopic['kind'], React.ReactElement> = {
  direct: <ForumRoundedIcon />,
  puzzle: <ExtensionRoundedIcon />,
  homework: <AssignmentRoundedIcon />,
  book: <MenuBookRoundedIcon />,
};

/** Чип темы диалога («Задача: …», «Домашка: …»); для общего диалога — ничего */
const ContextChip: React.FC<{ context?: ChatTopic | null; size?: 'small' | 'medium' }> = ({ context, size = 'small' }) => {
  const { t } = useTranslation();
  if (!context || context.kind === 'direct') return null;
  const kind = t(`chat.context.${context.kind}`, { puzzle: 'Puzzle', homework: 'Homework', book: 'Book' }[context.kind]);
  return (
    <Chip size={size} icon={CONTEXT_ICONS[context.kind]} label={context.title ? `${kind}: ${context.title}` : kind}
      data-testid="chat-context-chip" variant="outlined"
      sx={{ maxWidth: '100%', height: 22, fontSize: '0.72rem', borderColor: tokens.accent.goldSoft, color: 'primary.main', '& .MuiChip-icon': { fontSize: 14, color: 'primary.main' } }} />
  );
};

const sameDay = (a: Date, b: Date) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

const useFormatters = () => {
  const { t, i18n } = useTranslation();
  return useMemo(() => {
    const lng = i18n.language || 'en';
    const time = (iso: string) => new Date(iso).toLocaleTimeString(lng, { hour: '2-digit', minute: '2-digit' });
    const day = (iso: string) => {
      const d = new Date(iso);
      const today = new Date();
      const yesterday = new Date(); yesterday.setDate(today.getDate() - 1);
      if (sameDay(d, today)) return t('chat.today', 'Today');
      if (sameDay(d, yesterday)) return t('chat.yesterday', 'Yesterday');
      return d.toLocaleDateString(lng, { day: 'numeric', month: 'long', ...(d.getFullYear() !== today.getFullYear() ? { year: 'numeric' } : {}) });
    };
    /** В списке: время для сегодняшних, иначе дата */
    const short = (iso: string) => (sameDay(new Date(iso), new Date()) ? time(iso) : new Date(iso).toLocaleDateString(lng, { day: 'numeric', month: 'short' }));
    return { time, day, short };
  }, [t, i18n.language]);
};

// ---------------------------------------------------------------- список диалогов

const RoomList: React.FC = () => {
  const { t } = useTranslation();
  const chat = useChat()!;
  const fmt = useFormatters();
  const rooms = sortedRooms(chat.state);
  const withDirect = new Set(rooms.filter((r) => r.context.kind === 'direct').map((r) => r.interlocutor?._id));
  // Собеседники без общего диалога — «Начать диалог»; при выборе тренера для темы — все
  const starters = chat.pendingContext ? chat.contacts : chat.contacts.filter((c) => !withDirect.has(c._id));

  const roomItem = (room: ChatRoom) => {
    const mine = room.lastMessage?.sender === chat.state.myId;
    return (
      <ListItemButton key={room._id} onClick={() => chat.selectRoom(room._id)} data-testid="chat-room" sx={{ py: 1.25, mb: 0.25, alignItems: 'flex-start' }}>
        <ListItemAvatar sx={{ minWidth: 52, mt: 0.25 }}>
          <Badge color="primary" variant="dot" invisible={!room.unreadCount} overlap="circular">
            <PersonAvatar user={room.interlocutor} />
          </Badge>
        </ListItemAvatar>
        <ListItemText
          disableTypography
          primary={(
            <Stack direction="row" alignItems="baseline" spacing={1}>
              <Typography variant="body2" fontWeight={room.unreadCount ? 700 : 600} noWrap sx={{ flex: 1 }}>{fullName(room.interlocutor) || t('chat.unknownUser', 'User')}</Typography>
              {room.lastMessageAt && <Typography variant="caption" color={room.unreadCount ? 'primary.main' : 'text.secondary'} sx={{ flexShrink: 0 }}>{fmt.short(room.lastMessageAt)}</Typography>}
            </Stack>
          )}
          secondary={(
            <Stack spacing={0.5} sx={{ mt: 0.25, minWidth: 0 }}>
              <ContextChip context={room.context} />
              <Stack direction="row" alignItems="center" spacing={1}>
                <Typography variant="caption" color={room.unreadCount ? 'text.primary' : 'text.secondary'} noWrap sx={{ flex: 1 }}>
                  {room.lastMessage ? `${mine ? `${t('chat.you', 'You')}: ` : ''}${room.lastMessage.text}` : t('chat.noMessagesYet', 'No messages yet')}
                </Typography>
                {room.unreadCount > 0 && (
                  <Box data-testid="chat-room-unread" sx={{ minWidth: 20, height: 20, px: 0.75, borderRadius: 10, bgcolor: 'primary.main', color: 'primary.contrastText', fontSize: '0.7rem', fontWeight: 700, display: 'grid', placeItems: 'center' }}>
                    {room.unreadCount > 99 ? '99+' : room.unreadCount}
                  </Box>
                )}
              </Stack>
            </Stack>
          )}
        />
      </ListItemButton>
    );
  };

  const contactItem = (c: ChatContact) => (
    <ListItemButton key={c._id} onClick={() => void chat.startWith(c)} data-testid="chat-contact" sx={{ py: 1 }}>
      <ListItemAvatar sx={{ minWidth: 52 }}><PersonAvatar user={c} size={36} /></ListItemAvatar>
      <ListItemText primary={fullName(c)} secondary={c.relation === 'coach' ? t('chat.relation.coach', 'Your coach') : t('chat.relation.student', 'Your student')}
        primaryTypographyProps={{ variant: 'body2', fontWeight: 600 }} secondaryTypographyProps={{ variant: 'caption' }} />
    </ListItemButton>
  );

  const empty = rooms.length === 0 && starters.length === 0;
  return (
    <Box sx={{ flex: 1, overflowY: 'auto', px: 1, pb: 2 }}>
      {chat.pendingContext && (
        <Box sx={{ m: 1, p: 1.5, borderRadius: 2, bgcolor: tokens.accent.goldSoft }} data-testid="chat-pick-coach">
          <Typography variant="body2" fontWeight={600}>{t('chat.pickRecipient', 'Who do you want to ask?')}</Typography>
          <Box sx={{ mt: 0.75 }}><ContextChip context={chat.pendingContext} /></Box>
        </Box>
      )}
      {!chat.pendingContext && rooms.length > 0 && <List disablePadding>{rooms.map(roomItem)}</List>}
      {starters.length > 0 && (
        <List disablePadding subheader={(
          <ListSubheader disableSticky sx={{ bgcolor: 'transparent', color: 'text.disabled', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', lineHeight: '32px', mt: 1 }}>
            {t('chat.startConversation', 'Start a conversation')}
          </ListSubheader>
        )}>
          {starters.map(contactItem)}
        </List>
      )}
      {empty && (
        <Stack alignItems="center" spacing={1.5} sx={{ textAlign: 'center', px: 3, py: 8, color: 'text.secondary' }} data-testid="chat-empty">
          <ForumRoundedIcon sx={{ fontSize: 48, color: 'text.disabled' }} />
          <Typography variant="body1" fontWeight={600} color="text.primary">{t('chat.emptyTitle', 'No conversations yet')}</Typography>
          <Typography variant="body2">{t('chat.emptyHint', 'You can message your coach (or your students) once you are enrolled in a course.')}</Typography>
        </Stack>
      )}
    </Box>
  );
};

// ---------------------------------------------------------------- диалог

const MessageStatus: React.FC<{ message: ChatMessage; onRetry: () => void }> = ({ message, onRetry }) => {
  const { t } = useTranslation();
  const sx = { fontSize: 15 };
  if (message.status === 'pending') return <ScheduleRoundedIcon aria-label={t('chat.status.pending', 'Sending')} data-status="pending" sx={{ ...sx, opacity: 0.7 }} />;
  if (message.status === 'failed') {
    return (
      <Tooltip title={t('chat.retry', 'Not sent — tap to retry')}>
        <IconButton size="small" onClick={onRetry} aria-label={t('chat.retry', 'Not sent — tap to retry')} data-status="failed" sx={{ p: 0, color: 'error.main' }}>
          <ErrorOutlineRoundedIcon sx={sx} />
        </IconButton>
      </Tooltip>
    );
  }
  return message.readAt
    ? <DoneAllRoundedIcon aria-label={t('chat.status.read', 'Read')} data-status="read" sx={{ ...sx, color: tokens.accent.blue }} />
    : <DoneRoundedIcon aria-label={t('chat.status.sent', 'Sent')} data-status="sent" sx={{ ...sx, opacity: 0.8 }} />;
};

const Conversation: React.FC<{ room: ChatRoom }> = ({ room }) => {
  const { t } = useTranslation();
  const chat = useChat()!;
  const fmt = useFormatters();
  const data = chat.state.messages[room._id];
  const items = useMemo(() => data?.items ?? [], [data?.items]);
  const typing = chat.state.typing[room._id];
  const scroller = useRef<HTMLDivElement | null>(null);
  const stickToBottom = useRef(true);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [draft, setDraft] = useState('');
  const typingSent = useRef(false);
  const typingTimer = useRef<ReturnType<typeof setTimeout>>();

  // Новые сообщения — вниз, если пользователь и так внизу (или это его сообщение)
  const lastId = items.at(-1)?._id;
  useLayoutEffect(() => {
    const el = scroller.current;
    if (!el) return;
    const last = items.at(-1);
    if (stickToBottom.current || last?.sender === chat.state.myId) el.scrollTop = el.scrollHeight;
  }, [lastId, typing, items, chat.state.myId]);

  useEffect(() => () => {
    clearTimeout(typingTimer.current);
    if (typingSent.current) chat.setTyping(false);
  }, [chat]);

  const onScroll = () => {
    const el = scroller.current;
    if (el) stickToBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
  };

  const loadOlder = async () => {
    const el = scroller.current;
    const before = el?.scrollHeight ?? 0;
    setLoadingOlder(true);
    try {
      await chat.loadOlder();
    } finally {
      setLoadingOlder(false);
    }
    // Сохраняем позицию чтения после подгрузки сверху
    requestAnimationFrame(() => { if (el) el.scrollTop += el.scrollHeight - before; });
  };

  const stopTyping = () => {
    clearTimeout(typingTimer.current);
    if (typingSent.current) {
      typingSent.current = false;
      chat.setTyping(false);
    }
  };
  const onDraft = (value: string) => {
    setDraft(value);
    if (!typingSent.current && value.trim()) {
      typingSent.current = true;
      chat.setTyping(true);
    }
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(stopTyping, TYPING_IDLE_MS);
  };
  const submit = () => {
    if (!draft.trim()) return;
    chat.send(draft);
    setDraft('');
    stopTyping();
    stickToBottom.current = true;
  };

  const rows: React.ReactNode[] = [];
  items.forEach((m, i) => {
    const prev = items[i - 1];
    if (!prev || !sameDay(new Date(prev.createdAt), new Date(m.createdAt))) {
      rows.push(
        <Box key={`d-${m._id}`} sx={{ display: 'flex', justifyContent: 'center', my: 1.5 }}>
          <Typography variant="caption" data-testid="chat-day" sx={{ px: 1.5, py: 0.25, borderRadius: 10, bgcolor: 'surface.raised', color: 'text.secondary', border: 1, borderColor: 'divider' }}>
            {fmt.day(m.createdAt)}
          </Typography>
        </Box>,
      );
    }
    const mine = m.sender === chat.state.myId;
    const grouped = prev && prev.sender === m.sender && sameDay(new Date(prev.createdAt), new Date(m.createdAt));
    rows.push(
      <Box key={m.clientId ?? m._id} data-testid="chat-message" data-mine={mine ? 'true' : 'false'}
        sx={{ display: 'flex', justifyContent: mine ? 'flex-end' : 'flex-start', mt: grouped ? 0.25 : 1 }}>
        <Box sx={{
          maxWidth: '82%', px: 1.5, py: 0.75, borderRadius: 2.5,
          borderBottomRightRadius: mine ? 6 : undefined, borderBottomLeftRadius: mine ? undefined : 6,
          bgcolor: mine ? tokens.accent.goldSoft : 'surface.raised',
          border: 1, borderColor: mine ? 'rgba(227,179,65,0.28)' : 'divider',
          opacity: m.status === 'pending' ? 0.75 : 1,
        }}>
          <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', lineHeight: 1.45 }}>{m.text}</Typography>
          <Stack direction="row" spacing={0.5} alignItems="center" justifyContent="flex-end" sx={{ mt: 0.25, color: 'text.secondary' }}>
            <Typography variant="caption" sx={{ fontSize: '0.68rem' }}>{fmt.time(m.createdAt)}</Typography>
            {mine && <MessageStatus message={m} onRetry={() => chat.retry(m)} />}
          </Stack>
        </Box>
      </Box>,
    );
  });

  return (
    <>
      <Box ref={scroller} onScroll={onScroll} data-testid="chat-messages" sx={{ flex: 1, overflowY: 'auto', px: 2, py: 1 }}>
        {data?.hasMore && (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 1 }}>
            <Button size="small" color="inherit" onClick={() => void loadOlder()} disabled={loadingOlder}>
              {loadingOlder ? <CircularProgress size={16} /> : t('chat.loadOlder', 'Load earlier messages')}
            </Button>
          </Box>
        )}
        {!data?.loaded && <Box sx={{ display: 'grid', placeItems: 'center', py: 6 }}><CircularProgress size={28} /></Box>}
        {data?.loaded && items.length === 0 && (
          <Stack alignItems="center" spacing={1} sx={{ textAlign: 'center', py: 8, px: 3, color: 'text.secondary' }}>
            <ForumRoundedIcon sx={{ fontSize: 40, color: 'text.disabled' }} />
            <Typography variant="body2">{t('chat.firstMessageHint', 'Say hello — your messages are visible only to the two of you.')}</Typography>
          </Stack>
        )}
        {rows}
        {typing && (
          <Typography variant="caption" color="text.secondary" data-testid="chat-typing" sx={{ display: 'block', mt: 1, fontStyle: 'italic' }}>
            {t('chat.typing', { name: room.interlocutor?.firstName ?? '', defaultValue: '{{name}} is typing…' })}
          </Typography>
        )}
      </Box>
      <Stack direction="row" spacing={1} alignItems="flex-end" sx={{ p: 1.5, borderTop: 1, borderColor: 'divider' }}>
        <TextField
          fullWidth multiline maxRows={5} size="small"
          value={draft}
          onChange={(e) => onDraft(e.target.value)}
          onKeyDown={(e) => {
            // Enter — отправить, Shift+Enter — новая строка
            if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
              e.preventDefault();
              submit();
            }
          }}
          placeholder={t('chat.placeholder', 'Write a message…')}
          inputProps={{ 'aria-label': t('chat.placeholder', 'Write a message…'), maxLength: 4000 }}
        />
        <IconButton color="primary" onClick={submit} disabled={!draft.trim()} aria-label={t('chat.send', 'Send')}
          sx={{ bgcolor: draft.trim() ? 'primary.main' : 'transparent', color: draft.trim() ? 'primary.contrastText' : undefined, '&:hover': { bgcolor: 'primary.light' } }}>
          <SendRoundedIcon fontSize="small" />
        </IconButton>
      </Stack>
    </>
  );
};

// ---------------------------------------------------------------- панель

/** Личные сообщения: стеклянная панель справа (на телефоне — на весь экран) */
export const ChatDrawer: React.FC = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const phone = useMediaQuery(theme.breakpoints.down('sm'), { noSsr: true });
  const chat = useChat();
  if (!chat?.available) return null;
  const room = chat.state.activeRoomId ? chat.state.rooms[chat.state.activeRoomId] : undefined;

  return (
    <Drawer anchor="right" open={chat.isOpen} onClose={chat.closeDrawer}
      PaperProps={{
        'aria-label': t('chat.title', 'Messages'),
        sx: { ...glass, backgroundColor: 'rgba(22, 27, 34, 0.88)', width: phone ? '100vw' : DRAWER_WIDTH, maxWidth: '100vw', borderRadius: 0, display: 'flex', flexDirection: 'column' },
      }}
      data-testid="chat-drawer">
      <Stack direction="row" alignItems="center" spacing={1} sx={{ px: 1.5, py: 1.25, minHeight: 64, borderBottom: 1, borderColor: 'divider' }}>
        {room ? (
          <>
            <IconButton onClick={() => chat.selectRoom(null)} aria-label={t('chat.back', 'Back to conversations')}><ArrowBackRoundedIcon /></IconButton>
            <PersonAvatar user={room.interlocutor} size={36} />
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Typography variant="subtitle2" fontWeight={700} noWrap color="text.primary">{fullName(room.interlocutor)}</Typography>
              {room.context.kind !== 'direct'
                ? <ContextChip context={room.context} />
                : <Typography variant="caption" color={chat.connected ? 'success.main' : 'text.secondary'}>{chat.connected ? t('chat.online', 'Connected') : t('chat.offline', 'Connecting…')}</Typography>}
            </Box>
          </>
        ) : (
          <>
            {chat.pendingContext && (
              <IconButton onClick={() => chat.selectRoom(null)} aria-label={t('chat.back', 'Back to conversations')}><ArrowBackRoundedIcon /></IconButton>
            )}
            <Typography variant="h6" sx={{ flex: 1, pl: chat.pendingContext ? 0 : 1 }}>{t('chat.title', 'Messages')}</Typography>
          </>
        )}
        <IconButton onClick={chat.closeDrawer} aria-label={t('common.close', 'Close')}><CloseRoundedIcon /></IconButton>
      </Stack>
      {room ? <Conversation key={room._id} room={room} /> : <RoomList />}
    </Drawer>
  );
};
