import { Box, Typography, Button, Grid, Paper, Divider, Stack, Chip } from "@mui/material";
import { Link as RouterLink } from 'react-router-dom';
import { useTranslation } from "react-i18next";
import { CoachesBlock } from "@/components/CoachesBlock/CoachesBlock";
import SchoolIcon from '@mui/icons-material/School';
import GroupIcon from '@mui/icons-material/Group';
import ExtensionRoundedIcon from '@mui/icons-material/ExtensionRounded';
import QueryStatsRoundedIcon from '@mui/icons-material/QueryStatsRounded';
import MenuBookRoundedIcon from '@mui/icons-material/MenuBookRounded';
import EventNoteRoundedIcon from '@mui/icons-material/EventNoteRounded';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import { PageContainer } from '@/shared/components/ui/PageHeader';

const sectionTitle = { textAlign: 'center' as const, mb: { xs: 4, md: 6 } };

const cardSx = {
  p: { xs: 3, md: 4 },
  height: '100%',
  borderRadius: 3,
  transition: 'transform .25s ease, border-color .25s ease, background-color .25s ease',
  '&:hover': { transform: 'translateY(-4px)', borderColor: 'rgba(227,179,65,0.35)' },
};

export const Home = () => {
  const { t } = useTranslation();
  const currentYear = new Date().getFullYear();

  const whyChessItems = [
    { icon: "🎯", key: "analytics", descKey: "descAnalytics" },
    { icon: "🧠", key: "memory", descKey: "descMemory" },
    { icon: "🏆", key: "spirit", descKey: "descSpirit" },
  ];

  const howItWorksSteps = [
    { num: "1", titleKey: "step1Title", descKey: "step1Desc" },
    { num: "2", titleKey: "step2Title", descKey: "step2Desc" },
    { num: "3", titleKey: "step3Title", descKey: "step3Desc" },
  ];

  const formatItems = [
    { type: "individual", icon: <SchoolIcon />, descKey: "descIndividual", buttonKey: "schedule", path: "/coaches" },
    { type: "group", icon: <GroupIcon />, descKey: "descGroup", buttonKey: "learnMore", path: "/about" },
  ];

  // Разделы платформы — быстрый вход в тренировки
  const platformSections = [
    { key: 'puzzles', icon: <ExtensionRoundedIcon />, path: '/puzzles', title: t('homePage.platform.puzzles', 'Puzzles'), desc: t('homePage.platform.puzzlesDesc', 'Thousands of tactics with rating, survival mode and instant engine review.') },
    { key: 'analysis', icon: <QueryStatsRoundedIcon />, path: '/analysis', title: t('homePage.platform.analysis', 'Analysis board'), desc: t('homePage.platform.analysisDesc', 'Stockfish evaluation, best-move arrows, opening book and master games.') },
    { key: 'books', icon: <MenuBookRoundedIcon />, path: '/books', title: t('homePage.platform.books', 'Books & courses'), desc: t('homePage.platform.booksDesc', 'Digitized puzzle books from your coach — solve them chapter by chapter.') },
    { key: 'schedule', icon: <EventNoteRoundedIcon />, path: '/students-shedule', title: t('homePage.platform.schedule', 'Lessons & homework'), desc: t('homePage.platform.scheduleDesc', 'Your lesson schedule, assignments and coach feedback in one place.') },
  ];

  const footerLinks = [
    { titleKey: 'company', links: [{ key: 'about', to: '/about' }, { key: 'coaches', to: '/coaches' }] },
    { titleKey: 'resources', links: [{ key: 'faq', to: '/about' }, { key: 'contact', to: '/coaches' }] },
  ];

  return (
    <Box>
      {/* Hero */}
      <Box
        sx={{
          position: 'relative',
          overflow: 'hidden',
          minHeight: { xs: 460, md: 600 },
          display: 'flex',
          alignItems: 'center',
          backgroundImage: {
            xs: 'url("/images/chess-cinematic-mb.jpg")',
            sm: 'url("/images/chess-cinematic-tablet.jpg")',
            lg: 'url("/images/chess-cinematic-lg.jpg")',
          },
          backgroundSize: "cover",
          backgroundPosition: "center",
          '&::before': {
            content: '""',
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(90deg, rgba(13,17,23,0.96) 0%, rgba(13,17,23,0.78) 45%, rgba(13,17,23,0.35) 100%), linear-gradient(0deg, #0d1117 0%, transparent 35%)',
          },
          '&::after': {
            content: '""',
            position: 'absolute',
            width: 520,
            height: 520,
            left: -160,
            top: -160,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(227,179,65,0.18) 0%, transparent 65%)',
            pointerEvents: 'none',
          },
        }}
      >
        <PageContainer>
          <Box sx={{ position: 'relative', zIndex: 1, maxWidth: 680, py: { xs: 6, md: 10 } }}>
            <Chip label={t('homePage.hero.badge', 'Online chess school')} size="small"
              sx={{ mb: 3, bgcolor: 'rgba(227,179,65,0.14)', color: 'primary.main', fontWeight: 600, border: '1px solid rgba(227,179,65,0.3)' }} />
            <Typography variant="h1">{t("homePage.hero.title")}</Typography>
            <Typography variant="h6" component="p" color="text.secondary" sx={{ mt: 2.5, fontWeight: 400, lineHeight: 1.6 }}>
              {t("homePage.hero.subtitle")}
            </Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mt: 4 }}>
              <Button
                variant="contained"
                size="large"
                component={RouterLink}
                to="/coaches"
                endIcon={<ArrowForwardRoundedIcon />}
                sx={{ px: 4, py: 1.5, boxShadow: '0 10px 30px rgba(227,179,65,0.25)' }}
              >
                {t("homePage.hero.start")}
              </Button>
              <Button variant="outlined" color="inherit" size="large" component={RouterLink} to="/puzzles" sx={{ px: 4, py: 1.5 }}>
                {t('homePage.hero.tryPuzzles', 'Solve a puzzle')}
              </Button>
            </Stack>
          </Box>
        </PageContainer>
      </Box>

      {/* Разделы платформы */}
      <PageContainer>
        <Grid container spacing={2.5} sx={{ mt: { xs: 0, md: -6 }, position: 'relative', zIndex: 2 }}>
          {platformSections.map((section) => (
            <Grid item xs={12} sm={6} lg={3} key={section.key}>
              <Paper component={RouterLink} to={section.path} data-section={section.key}
                sx={{ ...cardSx, p: 3, display: 'block', textDecoration: 'none', color: 'inherit', bgcolor: 'rgba(22,27,34,0.85)', backdropFilter: 'blur(12px)' }}>
                <Box sx={{ width: 44, height: 44, borderRadius: 2, display: 'grid', placeItems: 'center', bgcolor: 'rgba(227,179,65,0.12)', color: 'primary.main', mb: 2 }}>
                  {section.icon}
                </Box>
                <Typography variant="h6">{section.title}</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>{section.desc}</Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>

        {/* Почему шахматы */}
        <Box sx={{ py: { xs: 7, md: 10 } }}>
          <Typography variant="h3" component="h2" sx={sectionTitle}>{t("homePage.why.title")}</Typography>
          <Grid container spacing={2.5}>
            {whyChessItems.map(({ icon, key, descKey }) => (
              <Grid item xs={12} md={4} key={key}>
                <Paper sx={{ ...cardSx, textAlign: 'center' }}>
                  <Box fontSize="3rem" aria-hidden>{icon}</Box>
                  <Typography variant="h5" component="h3" mt={2}>{t(`homePage.why.${key}`)}</Typography>
                  <Typography mt={1.5} color="text.secondary">{t(`homePage.why.${descKey}`)}</Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Box>
      </PageContainer>

      <Box sx={{ py: { xs: 2, md: 4 } }}>
        <CoachesBlock />
      </Box>

      {/* Как это работает */}
      <Box sx={{ py: { xs: 7, md: 10 }, bgcolor: 'background.paper', borderBlock: 1, borderColor: 'divider' }}>
        <PageContainer>
          <Typography variant="h3" component="h2" sx={sectionTitle}>{t("homePage.howItWorks.title")}</Typography>
          <Grid container spacing={4}>
            {howItWorksSteps.map(({ num, titleKey, descKey }) => (
              <Grid item xs={12} md={4} key={num}>
                <Stack direction="row" spacing={2.5} alignItems="flex-start">
                  <Box sx={{
                    flexShrink: 0, width: 52, height: 52, borderRadius: '50%', display: 'grid', placeItems: 'center',
                    border: '1px solid rgba(227,179,65,0.4)', color: 'primary.main', fontWeight: 800, fontSize: '1.3rem',
                    background: 'radial-gradient(circle, rgba(227,179,65,0.15) 0%, transparent 70%)',
                  }}>
                    {num}
                  </Box>
                  <Box>
                    <Typography variant="h6" component="h3">{t(`homePage.howItWorks.${titleKey}`)}</Typography>
                    <Typography mt={1} color="text.secondary">{t(`homePage.howItWorks.${descKey}`)}</Typography>
                  </Box>
                </Stack>
              </Grid>
            ))}
          </Grid>
        </PageContainer>
      </Box>

      {/* Форматы */}
      <PageContainer>
        <Box sx={{ py: { xs: 7, md: 10 } }}>
          <Typography variant="h3" component="h2" sx={sectionTitle}>{t("homePage.formats.title")}</Typography>
          <Grid container spacing={2.5} justifyContent="center">
            {formatItems.map(({ type, icon, descKey, buttonKey, path }) => (
              <Grid item xs={12} md={6} key={type}>
                <Paper sx={{ ...cardSx, display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                  <Box sx={{ color: 'primary.main', mb: 2, '& svg': { fontSize: 40 } }}>{icon}</Box>
                  <Typography variant="h5" component="h3">{t(`homePage.formats.${type}`)}</Typography>
                  <Typography mt={1.5} color="text.secondary" sx={{ flexGrow: 1 }}>{t(`homePage.formats.${descKey}`)}</Typography>
                  <Button variant="outlined" component={RouterLink} to={path} endIcon={<ArrowForwardRoundedIcon />} sx={{ mt: 3 }}>
                    {t(`homePage.formats.${buttonKey}`)}
                  </Button>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Box>
      </PageContainer>

      {/* Подвал */}
      <Box component="footer" sx={{ py: 6, bgcolor: 'background.paper', borderTop: 1, borderColor: 'divider' }}>
        <PageContainer>
          <Grid container spacing={4}>
            <Grid item xs={12} md={6}>
              <Typography variant="h6">{t("homePage.footer.name")}</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1, maxWidth: 420 }}>{t("homePage.footer.desc")}</Typography>
            </Grid>
            {footerLinks.map((col) => (
              <Grid item xs={6} md={3} key={col.titleKey}>
                <Typography fontWeight={600} sx={{ mb: 1 }}>{t(`homePage.footer.${col.titleKey}`)}</Typography>
                {col.links.map((link) => (
                  <Button key={link.key} component={RouterLink} to={link.to} size="small" color="inherit"
                    sx={{ display: 'block', px: 0, color: 'text.secondary', '&:hover': { color: 'text.primary', bgcolor: 'transparent' } }}>
                    {t(`homePage.footer.${link.key}`)}
                  </Button>
                ))}
              </Grid>
            ))}
          </Grid>
          <Divider sx={{ my: 4 }} />
          <Typography variant="body2" textAlign="center" color="text.disabled">
            {t("homePage.footer.copyright", { year: currentYear })}
          </Typography>
        </PageContainer>
      </Box>
    </Box>
  );
};
