import React, { useState } from 'react';
import { Badge, Box, IconButton, Stack, Tab, Tabs, Tooltip, Typography } from '@mui/material';
import FormatListNumberedRoundedIcon from '@mui/icons-material/FormatListNumberedRounded';
import ChatRoundedIcon from '@mui/icons-material/ChatRounded';
import GroupRoundedIcon from '@mui/icons-material/GroupRounded';
import FirstPageRoundedIcon from '@mui/icons-material/FirstPageRounded';
import NavigateBeforeRoundedIcon from '@mui/icons-material/NavigateBeforeRounded';
import NavigateNextRoundedIcon from '@mui/icons-material/NavigateNextRounded';
import LastPageRoundedIcon from '@mui/icons-material/LastPageRounded';
import ArrowUpwardRoundedIcon from '@mui/icons-material/ArrowUpwardRounded';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import { useTranslation } from 'react-i18next';
import { VariationTree } from '@/features/Chess/components/VariationTree';
import { GameTreeApi } from '@/features/Chess/tree/useGameTree';
import { ChatMessage, Participant } from '../classroomApi';
import { ChatPanel } from './ChatPanel';
import { ParticipantsPanel } from './ParticipantsPanel';

interface ClassroomTabsProps {
  game: GameTreeApi;
  /** Может ли текущий пользователь вести доску (ходы/навигация синхронны всем) */
  canControl: boolean;
  chat: ChatMessage[];
  myUserId?: string;
  onSendChat: (text: string, to?: string) => void;
  participants: Participant[];
  hands: Record<string, string>;
  controllerId: string | null;
  isCoach: boolean;
  onGrantControl: (id: string) => void;
  onLowerHand: (id: string) => void;
}

/**
 * Правая панель: Ходы (кликабельное дерево вариантов + навигация) / Чат / Участники.
 * Контент каждой вкладки скроллится ВНУТРИ себя — окно браузера не двигается.
 */
export const ClassroomTabs: React.FC<ClassroomTabsProps> = ({
  game, canControl, chat, myUserId, onSendChat, participants, hands, controllerId, isCoach, onGrantControl, onLowerHand,
}) => {
  const { t } = useTranslation();
  const [tab, setTab] = useState(0);

  const hasMoves = Object.keys(game.tree.nodes).length > 1;
  const atRoot = game.current.id === game.tree.rootId;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
      <Tabs
        value={tab}
        onChange={(_, v) => setTab(v)}
        variant="fullWidth"
        sx={{ minHeight: 40, borderBottom: 1, borderColor: 'divider', '& .MuiTab-root': { minHeight: 40, py: 0.5 } }}
      >
        <Tab icon={<FormatListNumberedRoundedIcon fontSize="small" />} iconPosition="start" label={t('classroom.moves.title', { defaultValue: 'Ходы' })} />
        <Tab icon={<ChatRoundedIcon fontSize="small" />} iconPosition="start" label={t('classroom.chat.title', { defaultValue: 'Чат' })} />
        <Tab
          icon={<Badge color="primary" badgeContent={participants.length} max={99}><GroupRoundedIcon fontSize="small" /></Badge>}
          iconPosition="start"
          label={t('classroom.participants.tab', { defaultValue: 'Участники' })}
        />
      </Tabs>

      <Box sx={{ flex: 1, minHeight: 0, overflow: 'hidden', pt: 1 }}>
        {tab === 0 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
            <Box sx={{ flex: 1, minHeight: 0, overflowY: 'auto', pr: 0.5 }}>
              {hasMoves ? (
                <VariationTree
                  tree={game.tree}
                  currentId={game.current.id}
                  onSelect={canControl ? game.actions.goTo : () => {}}
                />
              ) : (
                <Typography variant="body2" color="text.secondary">{t('classroom.moves.empty', { defaultValue: 'Ходов пока нет' })}</Typography>
              )}
            </Box>
            {/* Навигация и ветвление — только у ведущего доску */}
            {canControl && (
              <Stack direction="row" spacing={0.25} alignItems="center" sx={{ pt: 0.5, borderTop: 1, borderColor: 'divider' }}>
                <IconButton size="small" onClick={game.actions.toStart} disabled={atRoot}><FirstPageRoundedIcon fontSize="small" /></IconButton>
                <IconButton size="small" onClick={game.actions.back} disabled={atRoot}><NavigateBeforeRoundedIcon fontSize="small" /></IconButton>
                <IconButton size="small" onClick={game.actions.forward}><NavigateNextRoundedIcon fontSize="small" /></IconButton>
                <IconButton size="small" onClick={game.actions.toEnd}><LastPageRoundedIcon fontSize="small" /></IconButton>
                <Box sx={{ flex: 1 }} />
                {!atRoot && (
                  <>
                    <Tooltip title={t('classroom.moves.promote', { defaultValue: 'Повысить вариант' })}>
                      <IconButton size="small" onClick={game.actions.promote}><ArrowUpwardRoundedIcon fontSize="small" /></IconButton>
                    </Tooltip>
                    <Tooltip title={t('classroom.moves.delete', { defaultValue: 'Удалить ветку' })}>
                      <IconButton size="small" color="error" onClick={game.actions.remove}><DeleteOutlineRoundedIcon fontSize="small" /></IconButton>
                    </Tooltip>
                  </>
                )}
              </Stack>
            )}
          </Box>
        )}
        {tab === 1 && <ChatPanel messages={chat} myUserId={myUserId} participants={participants} onSend={onSendChat} />}
        {tab === 2 && (
          <Box sx={{ height: '100%', overflowY: 'auto', pr: 0.5 }}>
            <ParticipantsPanel
              participants={participants}
              hands={hands}
              controllerId={controllerId}
              myUserId={myUserId}
              isCoach={isCoach}
              onGrantControl={onGrantControl}
              onLowerHand={onLowerHand}
            />
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default ClassroomTabs;
