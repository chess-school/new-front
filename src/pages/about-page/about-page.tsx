import React, { useEffect, useState, useMemo } from 'react';
import { Box, Container, Typography, Grid, Paper, Button, Stack, Divider } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { CSSTransition, SwitchTransition } from 'react-transition-group';

// Иконки
import TrackChangesIcon from '@mui/icons-material/TrackChanges';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';

import './styles.scss';

interface Testimonial { name: string; quote: string; }
interface CoachTeaser { name: string; quote: string; }
interface WhyUsCard { icon: string; title: string; description: string; }
interface HowItWorksStep { step: string; desc: string; }

export const About: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const phrases = useMemo(
    () => (t('aboutPage.phrases', { returnObjects: true }) as string[]) || [],
    [t]
  );
  
  const testimonials = useMemo(
    () => (t('aboutPage.testimonials.reviews', { returnObjects: true }) as Testimonial[]) || [],
    [t]
  );

  const coaches = useMemo(
    () => (t('aboutPage.ourCoaches.coaches', { returnObjects: true }) as CoachTeaser[]) || [],
    [t]
  );

  const whyUsCards = useMemo(
    () => (t('aboutPage.whyUs.cards', { returnObjects: true }) as WhyUsCard[]) || [],
    [t]
  );
  
  const howItWorksSteps = useMemo(
    () => (t('aboutPage.howItWorks.steps', { returnObjects: true }) as HowItWorksStep[]) || [],
    [t]
  );
  
  const missionPoints = useMemo(
    () => (t('aboutPage.mission.points', { returnObjects: true }) as string[]) || [],
    [t]
  );


  const [currentPhraseIndex, setCurrentPhraseIndex] = useState(0);
  const [currentTestimonialIndex, setCurrentTestimonialIndex] = useState(0);

  useEffect(() => {
    // Эта проверка важна, чтобы избежать ошибок, если данные еще не загрузились
    if (phrases.length === 0 || testimonials.length === 0) return;

    const phraseInterval = setInterval(() => {
      setCurrentPhraseIndex((prev) => (prev + 1) % phrases.length);
    }, 4000);
    const testimonialInterval = setInterval(() => {
      setCurrentTestimonialIndex((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    
    return () => {
      clearInterval(phraseInterval);
      clearInterval(testimonialInterval);
    };
  }, [phrases.length, testimonials.length]);

  return (
    <Box sx={{ bgcolor: '#0e0e0e', color: 'white' }}>
      {/* Hero Section */}
      <Box sx={{
        position: 'relative',
        py: { xs: 10, md: 15 },
        textAlign: 'center',
        backgroundImage: 'linear-gradient(rgba(0,0,0,0.7), rgba(0,0,0,0.8)), url("/images/chess-cinematic-lg.jpg")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
      }}>
        <Container maxWidth="md">
          <Typography variant="h2" component="h1" fontWeight="bold" sx={{ textTransform: 'uppercase', letterSpacing: '2px' }}>
            {t('aboutPage.mainTitle')}
          </Typography>
          <Box sx={{ height: '2.5em', my: 2 }}>
            <SwitchTransition mode="out-in">
              <CSSTransition key={currentPhraseIndex} timeout={300} classNames="fade">
                <Typography variant="h5" sx={{ color: '#FFD700', fontStyle: 'italic' }}>
                  {phrases.length > 0 ? phrases[currentPhraseIndex] : ''}
                </Typography>
              </CSSTransition>
            </SwitchTransition>
          </Box>
          <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="center" spacing={2} mt={4}>
            <Button variant="contained" onClick={() => navigate('/register')} size="large" sx={{ bgcolor: '#FFD700', color: 'black', borderRadius: '30px', px: 5, '&:hover': { bgcolor: '#FFC107' } }}>
              {t('aboutPage.ctaStudent')}
            </Button>
            <Button variant="outlined" onClick={() => navigate('/coaches')} size="large" sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.5)', borderRadius: '30px', px: 5, '&:hover': { borderColor: 'white', bgcolor: 'rgba(255,255,255,0.1)' } }}>
              {t('aboutPage.ctaCoaches')}
            </Button>
          </Stack>
        </Container>
      </Box>

      {/* Main Content */}
      <Container maxWidth="lg" sx={{ py: 8 }}>

        {/* Mission Section */}
        <Box sx={{ textAlign: 'center', my: 8 }}>
          <Stack direction="row" spacing={2} justifyContent="center" alignItems="center" sx={{ color: '#FFD700', mb: 1 }}>
            <TrackChangesIcon fontSize="large" />
            <Typography variant="h4" component="h2" fontWeight="bold">{t('aboutPage.mission.title')}</Typography>
          </Stack>
          <Typography variant="h6" sx={{ maxWidth: 720, mx: 'auto', color: 'rgba(255,255,255,0.7)', mb: 3 }}>
            {t('aboutPage.mission.subtitle')}
          </Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center">
            {missionPoints.map((point, i) => (
              <Stack direction="row" alignItems="center" spacing={1} key={i}>
                <CheckCircleOutlineIcon sx={{ color: 'success.main' }}/>
                <Typography>{point}</Typography>
              </Stack>
            ))}
          </Stack>
        </Box>
        
        <Divider sx={{ my: 8, borderColor: 'rgba(255,255,255,0.2)' }} />

        {/* Why Us Section */}
        <Box sx={{ my: 8 }}>
          <Typography variant="h4" component="h2" fontWeight="bold" align="center" sx={{ mb: 6 }}>
            {t('aboutPage.whyUs.title')}
          </Typography>
          <Grid container spacing={4}>
            {whyUsCards.map((card, i) => (
              <Grid item xs={12} md={4} key={i}>
                <Paper sx={{ p: 4, bgcolor: '#1c1c1c', borderRadius: 4, textAlign: 'center', height: '100%', transition: 'all 0.3s ease', '&:hover': { transform: 'translateY(-10px)', boxShadow: '0 10px 20px rgba(255,215,0,0.15)' }}}>
                  <Typography fontSize="3rem">{card.icon}</Typography>
                  <Typography variant="h6" fontWeight="bold" my={1}>{card.title}</Typography>
                  <Typography sx={{ color: 'rgba(255,255,255,0.6)' }}>{card.description}</Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* How It Works Section */}
        <Box sx={{ my: 8, py: 6, bgcolor: '#1c1c1c', borderRadius: 4 }}>
          <Typography variant="h4" component="h2" fontWeight="bold" align="center" sx={{ mb: 6 }}>
            {t('aboutPage.howItWorks.title')}
          </Typography>
          <Grid container spacing={4} sx={{ px: 4 }}>
            {howItWorksSteps.map((item, idx) => (
              <Grid item xs={12} md={4} key={idx}>
                <Stack direction="row" spacing={2} alignItems="center">
                  <Typography variant="h2" fontWeight="bold" sx={{ color: '#FFD700', opacity: 0.5 }}>{`0${idx + 1}`}</Typography>
                  <Box>
                    <Typography variant="h6" fontWeight="bold">{item.step}</Typography>
                    <Typography sx={{ color: 'rgba(255,255,255,0.6)' }}>{item.desc}</Typography>
                  </Box>
                </Stack>
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* Testimonials & Coaches */}
        <Grid container spacing={8} sx={{ my: 8 }}>
          <Grid item xs={12} md={6}>
            <Typography variant="h4" component="h2" fontWeight="bold" sx={{ mb: 3 }}>
              {t('aboutPage.testimonials.title')}
            </Typography>
            <Paper sx={{ p: 4, bgcolor: '#1c1c1c', borderRadius: 4, minHeight: 180 }}>
              <SwitchTransition>
                <CSSTransition key={currentTestimonialIndex} timeout={300} classNames="fade">
                  <Box>
                    {testimonials.length > 0 ? (
                      <>
                        <Typography fontStyle="italic" fontSize="1.1rem" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                          “{testimonials[currentTestimonialIndex].quote}”
                        </Typography>
                        <Typography fontWeight="bold" mt={2} sx={{ color: '#FFD700' }}>
                          — {testimonials[currentTestimonialIndex].name}
                        </Typography>
                      </>
                    ) : null}
                  </Box>
                </CSSTransition>
              </SwitchTransition>
            </Paper>
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography variant="h4" component="h2" fontWeight="bold" sx={{ mb: 3 }}>
              {t('aboutPage.ourCoaches.title')}
            </Typography>
            <Stack spacing={2}>
              {coaches.map((coach, idx) => (
                <Paper key={idx} sx={{ p: 2, bgcolor: '#1c1c1c', borderRadius: 2 }}>
                  <Typography variant="h6" fontWeight="bold">{coach.name}</Typography>
                  <Typography variant="body2" fontStyle="italic" sx={{ color: 'rgba(255,255,255,0.6)' }}>{coach.quote}</Typography>
                </Paper>
              ))}
              <Button variant="text" onClick={() => navigate('/coaches')} sx={{ color: '#FFD700', alignSelf: 'flex-start' }}>
                {t('aboutPage.ourCoaches.viewAll')} →
              </Button>
            </Stack>
          </Grid>
        </Grid>

        <Divider sx={{ my: 8, borderColor: 'rgba(255,255,255,0.2)' }} />
        
        <Typography align="center" fontWeight="bold" variant="h5" component="p" sx={{ fontStyle: 'italic' }}>
          {t('aboutPage.finalSlogan')}
        </Typography>

      </Container>
    </Box>
  );
};