import React from 'react';
import { Button, ButtonProps } from '@mui/material';
import ChatBubbleOutlineRoundedIcon from '@mui/icons-material/ChatBubbleOutlineRounded';
import { useTranslation } from 'react-i18next';
import { useChat } from './chatContext';
import { OpenChatOptions } from './chatTypes';

type AskInChatButtonProps = OpenChatOptions & Omit<ButtonProps, 'onClick'> & { label?: React.ReactNode };

/**
 * «Спросить тренера» / «Написать ученику»: открывает диалог (по умолчанию — с тренером)
 * в теме задачи/домашки. Без входа (нет ChatProvider) не показывается.
 */
export const AskInChatButton: React.FC<AskInChatButtonProps> = ({ withUserId, context, label, ...button }) => {
  const { t } = useTranslation();
  const chat = useChat();
  if (!chat?.available) return null;
  return (
    <Button
      variant="outlined"
      color="inherit"
      startIcon={<ChatBubbleOutlineRoundedIcon />}
      {...button}
      onClick={() => void chat.openChat({ withUserId, context })}
    >
      {label ?? t('chat.askCoach', 'Ask the coach')}
    </Button>
  );
};
