import React from 'react';
import { Paper, Typography } from '@mui/material';
import EmojiEventsRoundedIcon from '@mui/icons-material/EmojiEventsRounded';
import { useTranslation } from 'react-i18next';
import { PageContainer, PageHeader } from '@/shared/components/ui/PageHeader';

export const Achievements: React.FC = () => {
  const { t } = useTranslation();
  return (
    <PageContainer>
      <PageHeader title={t('navbar.achievements')} subtitle={t('achievementsPage.subtitle', 'Tournament results and milestones of our students')} />
      <Paper sx={{ p: { xs: 4, md: 6 }, textAlign: 'center' }}>
        <EmojiEventsRoundedIcon sx={{ fontSize: 56, color: 'primary.main', mb: 2 }} />
        <Typography variant="h6">{t('achievementsPage.comingSoon', 'Coming soon')}</Typography>
        <Typography color="text.secondary" sx={{ mt: 1 }}>
          {t('achievementsPage.comingSoonDesc', "We are preparing a showcase of our students' achievements.")}
        </Typography>
      </Paper>
    </PageContainer>
  );
};
