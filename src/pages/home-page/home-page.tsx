import { Box, Typography, Button, Grid, Paper, Container, Divider } from "@mui/material";
import { useNavigate } from 'react-router-dom';
import { useTranslation } from "react-i18next";
import { CoachesBlock } from "@/components/CoachesBlock/CoachesBlock";
import SchoolIcon from '@mui/icons-material/School';
import GroupIcon from '@mui/icons-material/Group';

export const Home = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const currentYear = new Date().getFullYear();

  // Data for sections to avoid repetition
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
    { type: "individual", icon: <SchoolIcon sx={{ fontSize: 40, mb: 2, color: "#FFD700" }} />, descKey: "descIndividual", buttonKey: "schedule", path: "/coaches" },
    { type: "group", icon: <GroupIcon sx={{ fontSize: 40, mb: 2, color: "#FFD700" }} />, descKey: "descGroup", buttonKey: "learnMore", path: "/classes" },
  ];

  return (
    <Box sx={{ backgroundColor: "#0e0e0e", color: "white", fontFamily: "'Inter', sans-serif" }}>
      {/* Hero Section */}
      <Box
        sx={{
          backgroundImage: {
            xs: 'url("/images/chess-cinematic-mb.jpg")',
            sm: 'url("/images/chess-cinematic-tablet.jpg")',
            lg: 'url("/images/chess-cinematic-lg.jpg")',
          },
          backgroundSize: "cover",
          backgroundPosition: "center",
          py: { xs: 10, md: 20 },
          textAlign: "center",
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          px: 2,
        }}
      >
        <Container maxWidth="md">
          <Typography variant="h2" component="h1" fontWeight="bold">{t("homePage.hero.title")}</Typography>
          <Typography variant="h5" mt={2} sx={{ color: 'rgba(255, 255, 255, 0.9)' }}>{t("homePage.hero.subtitle")}</Typography>
          <Button
            variant="contained"
            size="large"
            onClick={() => navigate("/coaches")}
            sx={{
              mt: 4,
              px: 5,
              py: 1.5,
              borderRadius: "30px",
              boxShadow: '0px 8px 20px rgba(255, 215, 0, 0.3)',
              backgroundColor: "#FFD700",
              color: "black",
              fontWeight: "bold",
              '&:hover': { backgroundColor: "#FFC107", transform: 'translateY(-2px)', boxShadow: '0px 10px 25px rgba(255, 215, 0, 0.4)' },
              transition: 'all 0.3s ease',
            }}
            startIcon={<span style={{ fontSize: '1.5rem' }}>♟️</span>}
          >
            {t("homePage.hero.start")}
          </Button>
        </Container>
      </Box>

      {/* Why Chess Section */}
      <Container maxWidth="lg" sx={{ py: 10 }}>
        <Typography variant="h3" component="h2" fontWeight="bold" textAlign="center" mb={8}>
          {t("homePage.why.title")}
        </Typography>
        <Grid container spacing={4} justifyContent="center">
          {whyChessItems.map(({ icon, key, descKey }) => (
            <Grid item xs={12} sm={6} md={4} key={key}>
              <Paper
                elevation={6}
                sx={{
                  p: 4,
                  textAlign: "center",
                  borderRadius: 4,
                  backgroundColor: "rgba(255,255,255,0.05)",
                  backdropFilter: "blur(10px)",
                  transition: "all 0.3s ease",
                  color: "white",
                  height: '100%',
                  '&:hover': {
                    transform: "translateY(-10px)",
                    backgroundColor: "rgba(255,255,255,0.1)",
                  },
                }}
              >
                <Box fontSize="3.5rem">{icon}</Box>
                <Typography variant="h5" component="h3" mt={2} fontWeight="bold">
                  {t(`homePage.why.${key}`)}
                </Typography>
                <Typography mt={1.5} sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                  {t(`homePage.why.${descKey}`)}
                </Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Container>
      
      {/* Coaches Block Section */}
      <Box sx={{ py: 5 }}>
         <CoachesBlock />
      </Box>
      
      {/* How It Works Section */}
      <Box sx={{ py: 10, backgroundColor: '#121212' }}>
        <Container maxWidth="lg">
            <Typography variant="h3" component="h2" fontWeight="bold" textAlign="center" mb={8}>
              {t("homePage.howItWorks.title")}
            </Typography>
            <Grid container spacing={5}>
              {howItWorksSteps.map(({ num, titleKey, descKey }) => (
                <Grid item xs={12} md={4} key={num}>
                  <Box sx={{ textAlign: { xs: 'center', md: 'left' } }}>
                    <Typography variant="h1" component="div" fontWeight="bold" sx={{ color: '#FFD700', opacity: 0.5 }}>
                      {num}
                    </Typography>
                    <Typography variant="h5" component="h3" fontWeight="bold" mt={1}>
                      {t(`homePage.howItWorks.${titleKey}`)}
                    </Typography>
                    <Typography mt={1.5} sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                      {t(`homePage.howItWorks.${descKey}`)}
                    </Typography>
                  </Box>
                </Grid>
              ))}
            </Grid>
        </Container>
      </Box>
      
      {/* Formats Section */}
      <Container maxWidth="lg" sx={{ py: 10 }}>
        <Typography variant="h3" component="h2" fontWeight="bold" textAlign="center" mb={8}>
          {t("homePage.formats.title")}
        </Typography>
        <Grid container spacing={4} justifyContent="center">
          {formatItems.map(({ type, icon, descKey, buttonKey, path }) => (
            <Grid item xs={12} md={5} key={type}>
              <Paper
                elevation={6}
                sx={{
                  p: 4,
                  backgroundColor: "#1c1c1c",
                  color: "white",
                  borderRadius: 4,
                  textAlign: "center",
                  transition: 'background-color 0.3s ease',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  height: '100%',
                  '&:hover': { backgroundColor: "#2a2a2a" },
                }}
              >
                {icon}
                <Typography variant="h5" component="h3" fontWeight="bold">
                  {t(`homePage.formats.${type}`)}
                </Typography>
                <Typography mt={1.5} sx={{ color: 'rgba(255, 255, 255, 0.7)', flexGrow: 1 }}>
                  {t(`homePage.formats.${descKey}`)}
                </Typography>
                <Button 
                  variant="outlined" 
                  onClick={() => navigate(path)}
                  sx={{ 
                    mt: 3, 
                    color: "#FFD700", 
                    borderColor: '#FFD700', 
                    borderRadius: '20px',
                    '&:hover': { borderColor: '#FFC107', backgroundColor: 'rgba(255, 215, 0, 0.1)' }
                  }}
                >
                  {t(`homePage.formats.${buttonKey}`)} →
                </Button>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* Footer */}
      <Box component="footer" py={6} px={2} sx={{ backgroundColor: "#0b0b0b", color: "gray" }}>
        <Container maxWidth="lg">
          <Grid container spacing={5}>
            <Grid item xs={12} sm={4}>
              <Typography variant="h6" fontWeight="bold" sx={{ color: 'white' }}>{t("homePage.footer.name")}</Typography>
              <Typography variant="body2" sx={{ mt: 1, color: 'rgba(255,255,255,0.5)' }}>{t("homePage.footer.desc")}</Typography>
            </Grid>
            <Grid item xs={6} sm={2}>
               <Typography fontWeight="bold" sx={{ color: 'white' }}>{t("homePage.footer.company")}</Typography>
               <Button size="small" sx={{ color: "gray", display: 'block', p: '6px 0' }}>{t("homePage.footer.about")}</Button>
               <Button size="small" sx={{ color: "gray", display: 'block', p: '6px 0' }}>{t("homePage.footer.blog")}</Button>
               <Button size="small" sx={{ color: "gray", display: 'block', p: '6px 0' }}>{t("homePage.footer.coaches")}</Button>
            </Grid>
             <Grid item xs={6} sm={2}>
               <Typography fontWeight="bold" sx={{ color: 'white' }}>{t("homePage.footer.resources")}</Typography>
               <Button size="small" sx={{ color: "gray", display: 'block', p: '6px 0' }}>{t("homePage.footer.faq")}</Button>
               <Button size="small" sx={{ color: "gray", display: 'block', p: '6px 0' }}>{t("homePage.footer.contact")}</Button>
            </Grid>
             <Grid item xs={6} sm={2}>
               <Typography fontWeight="bold" sx={{ color: 'white' }}>{t("homePage.footer.legal")}</Typography>
               <Button size="small" sx={{ color: "gray", display: 'block', p: '6px 0' }}>{t("homePage.footer.privacy")}</Button>
               <Button size="small" sx={{ color: "gray", display: 'block', p: '6px 0' }}>{t("homePage.footer.terms")}</Button>
            </Grid>
          </Grid>
          <Divider sx={{ my: 4, borderColor: 'rgba(255, 255, 255, 0.1)' }} />
          <Typography variant="body2" textAlign="center" sx={{ color: 'rgba(255,255,255,0.4)' }}>
            {t("homePage.footer.copyright", { year: currentYear })}
          </Typography>
        </Container>
      </Box>
    </Box>
  );
};