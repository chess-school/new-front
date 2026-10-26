import React from 'react';
import { useTranslation } from 'react-i18next';
import { Box, Chip, IconButton, List, ListItem, ListItemText, Stack, Tooltip, Typography } from '@mui/material';
import PanToolRoundedIcon from '@mui/icons-material/PanToolRounded';
import SportsEsportsRoundedIcon from '@mui/icons-material/SportsEsportsRounded';
import BackHandRoundedIcon from '@mui/icons-material/BackHandRounded';
import { Participant } from '../classroomApi';

interface ParticipantsPanelProps {
  participants: Participant[];
  hands: Record<string, string>;
  controllerId: string | null;
  myUserId?: string;
  isCoach: boolean;
  onGrantControl: (userId: string) => void;
  onLowerHand: (userId: string) => void;
}

/** Список участников урока: роль, поднятая рука, значок владельца хода; тренеру — передать ход / опустить руку */
export const ParticipantsPanel: React.FC<ParticipantsPanelProps> = ({
  participants, hands, controllerId, myUserId, isCoach, onGrantControl, onLowerHand,
}) => {
  const { t } = useTranslation();
  // Участники, которых не видно в presence, но поднявшие руку, всё равно должны быть учтены тренером
  const sorted = [...participants].sort((a, b) => Number(!!hands[b.userId]) - Number(!!hands[a.userId]));

  return (
    <Box>
      <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
        {t('participants.title', { count: participants.length })}
      </Typography>
      {sorted.length === 0 ? (
        <Typography variant="body2" color="text.secondary">{t('participants.empty')}</Typography>
      ) : (
        <List dense disablePadding>
          {sorted.map((p) => {
            const raised = !!hands[p.userId];
            const controlling = controllerId === p.userId;
            const isMe = p.userId === myUserId;
            return (
              <ListItem
                key={p.userId}
                disableGutters
                secondaryAction={isCoach ? (
                  <Stack direction="row" spacing={0.5}>
                    {raised && (
                      <Tooltip title={t('participants.lowerHand')}>
                        <IconButton size="small" onClick={() => onLowerHand(p.userId)} aria-label={t('participants.lowerHand')}>
                          <BackHandRoundedIcon fontSize="small" color="warning" />
                        </IconButton>
                      </Tooltip>
                    )}
                    {!controlling && p.role !== 'coach' && (
                      <Tooltip title={t('participants.grantControl')}>
                        <IconButton size="small" onClick={() => onGrantControl(p.userId)} aria-label={t('participants.grantControl')}>
                          <SportsEsportsRoundedIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                  </Stack>
                ) : undefined}
              >
                <ListItemText
                  primary={(
                    <Stack direction="row" spacing={0.75} alignItems="center" useFlexGap flexWrap="wrap">
                      <Typography variant="body2" fontWeight={isMe ? 700 : 500} noWrap>
                        {isMe ? t('participants.you', { name: p.name }) : p.name}
                      </Typography>
                      {p.role === 'coach' && <Chip size="small" color="primary" label={t('participants.coach')} sx={{ height: 18, '& .MuiChip-label': { px: 0.75, fontSize: '0.65rem' } }} />}
                      {controlling && (
                        <Tooltip title={t('participants.controlling')}>
                          <SportsEsportsRoundedIcon fontSize="small" color="success" />
                        </Tooltip>
                      )}
                      {raised && <PanToolRoundedIcon fontSize="small" color="warning" />}
                    </Stack>
                  )}
                />
              </ListItem>
            );
          })}
        </List>
      )}
    </Box>
  );
};
