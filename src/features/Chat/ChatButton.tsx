import React, { useEffect, useRef, useState } from 'react';
import { Badge, IconButton, Tooltip } from '@mui/material';
import { keyframes } from '@emotion/react';
import ChatBubbleOutlineRoundedIcon from '@mui/icons-material/ChatBubbleOutlineRounded';
import { useTranslation } from 'react-i18next';
import { useChat } from './chatContext';

const pulse = keyframes`
  0% { transform: scale(1); }
  30% { transform: scale(1.25); }
  100% { transform: scale(1); }
`;

/** Кнопка сообщений в шапке: бейдж непрочитанного, «пульс» при новом сообщении */
export const ChatButton: React.FC = () => {
  const { t } = useTranslation();
  const chat = useChat();
  const unread = chat?.unread ?? 0;
  const prev = useRef(unread);
  const [bump, setBump] = useState(0);

  useEffect(() => {
    if (unread > prev.current) setBump((n) => n + 1);
    prev.current = unread;
  }, [unread]);

  if (!chat?.available) return null;
  const label = unread
    ? t('chat.openWithUnread', { count: unread, defaultValue: 'Messages ({{count}} unread)' })
    : t('chat.title', 'Messages');

  return (
    <Tooltip title={label}>
      <IconButton onClick={chat.openDrawer} aria-label={label} data-testid="chat-button" sx={{ color: 'text.primary' }}>
        <Badge key={bump} badgeContent={unread} color="primary" max={99} data-testid="chat-unread-badge"
          sx={{ '& .MuiBadge-badge': { fontWeight: 700, animation: bump ? `${pulse} .5s ease-out` : 'none' } }}>
          <ChatBubbleOutlineRoundedIcon />
        </Badge>
      </IconButton>
    </Tooltip>
  );
};
