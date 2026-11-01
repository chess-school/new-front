import { Box, Typography, Stack } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { PageContainer } from '@/shared/components/ui/PageHeader';
import { SEOHead } from '@/shared/components/seo/SEOHead';
import { MediaLibrary } from '@/features/site/MediaLibrary';

/** Консоль клуба → Media library (шаг 2 плана сайтов клубов). Загрузка/просмотр/удаление картинок клуба. */
export const MediaLibraryPage = () => {
  const { t } = useTranslation();
  return (
    <PageContainer>
      <SEOHead title={t('media.seoTitle', 'Media library — debiut')} description="" noindex />
      <Stack sx={{ mb: 3 }}>
        <Typography variant="body2" color="text.secondary">{t('media.eyebrow', 'Club website')}</Typography>
        <Typography variant="h4" sx={{ mt: 0.5 }}>{t('media.title', 'Media library')}</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          {t('media.subtitle', 'Upload club photos — logo, login background, illustrations for pages and articles. Copy the link and paste it in settings.')}
        </Typography>
      </Stack>
      <Box><MediaLibrary /></Box>
    </PageContainer>
  );
};

export default MediaLibraryPage;
