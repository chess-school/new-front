import React, { useEffect, useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Paper,
  Divider,
  Button,
  useTheme,
  Stack,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';

const phrases = [
  'Тренируй мышление, как чемпион.',
  'Находи сильные ходы — и в жизни.',
  'Учись думать, как гроссмейстер.',
];

const testimonials = [
  { name: 'Иван', quote: 'Улучшил мышление не только в шахматах, но и в жизни!' },
  { name: 'Алина', quote: 'Занятия помогли мне выиграть турнир в школе.' },
  { name: 'Максим', quote: 'Теперь я уверен в своих решениях за доской.' },
];

const coaches = [
  { name: 'GM Алексей', quote: '“Стратегия — это не только фигуры, это мышление.”' },
  { name: 'IM Ольга', quote: '“Шахматы учат видеть на 3 шага вперёд.”' },
];

export const About: React.FC = () => {
  const navigate = useNavigate();
  const [currentPhrase, setCurrentPhrase] = useState(0);
  const [currentTestimonial, setCurrentTestimonial] = useState(0);

  useEffect(() => {
    const phraseInterval = setInterval(() => {
      setCurrentPhrase((prev) => (prev + 1) % phrases.length);
    }, 3500);
    const testimonialInterval = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => {
      clearInterval(phraseInterval);
      clearInterval(testimonialInterval);
    };
  }, []);

  return (
    <Box sx={{ position: 'relative', overflow: 'hidden' }}>
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          backgroundImage:
            'linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.7)), url("/images/chess-cinematic-lg.jpg")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          zIndex: 0,
        }}
      />
      <Box sx={{ position: 'relative', color: 'white', py: 14, px: 2, zIndex: 1 }}>
        <Container maxWidth="lg">
          <Typography variant="h3" fontWeight="bold" align="center" gutterBottom sx={{ textTransform: 'uppercase' }}>
            MIND ON BOARD — УМ НА ДОСКЕ
          </Typography>

          <Typography
            variant="h6"
            align="center"
            sx={{ color: '#FFD700', fontStyle: 'italic', mt: 2, mb: 4 }}
          >
            {phrases[currentPhrase]}
          </Typography>

          <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="center" spacing={2} mb={8}>
            <Button variant="contained" onClick={() => navigate('/register')} sx={{
              backgroundColor: '#FFD700', color: '#000', fontWeight: 'bold', px: 4, py: 1.5,
              borderRadius: '30px', '&:hover': { backgroundColor: '#FFC107' }
            }}>
              Стать учеником
            </Button>
            <Button variant="outlined" onClick={() => navigate('/coaches')} sx={{
              color: '#fff', borderColor: '#ccc', px: 4, py: 1.5, fontWeight: 'bold',
              borderRadius: '30px', '&:hover': { borderColor: '#fff' }
            }}>
              Посмотреть тренеров
            </Button>
          </Stack>

          {/* Миссия */}
          <Box textAlign="center" mb={10}>
            <Typography variant="h5" fontWeight="bold" gutterBottom sx={{ color: '#ff4d4d' }}>
              🎯 Миссия
            </Typography>
            <Typography sx={{ maxWidth: 720, mx: 'auto', color: '#ccc', fontSize: '1.1rem' }}>
              В фокусе ума — <b>критический ум</b>, <b>стойкий характер</b> и <b>аналитический склад ума</b>
            </Typography>
            <Box component="ul" sx={{
              listStyle: 'none', mt: 3, pl: 0, color: '#b3e5c7', fontSize: '1rem',
              maxWidth: 500, mx: 'auto', textAlign: 'left',
              '& li::before': { content: '"🟢"', marginRight: '10px' }
            }}>
              <li>Анализировать риски</li>
              <li>Думать стратегически</li>
              <li>Учиться достойно проигрывать</li>
            </Box>
          </Box>

          {/* Почему MOB */}
          <Typography variant="h5" fontWeight="bold" align="center" sx={{ mb: 4, color: '#FFD700' }}>
            ✅ Почему MOB?
          </Typography>

          <Grid container spacing={4}>
            {[
              {
                icon: '🧠',
                title: 'Индивидуальные занятия',
                description: [
                  'Глубокий фокус тренера',
                  'Программа под ваш стиль',
                  'Максимальная эффективность',
                ],
              },
              {
                icon: '👥',
                title: 'Групповые занятия',
                description: [
                  'Энергия группы',
                  'Обмен стратегиями',
                  'Доступно по стоимости',
                ],
              },
              {
                icon: '🏆',
                title: 'Турнирные интенсивы',
                description: [
                  'Разбор партий с гроссмейстерами',
                  'Анализ дебютов и эндшпиля',
                  'На результат и победу',
                ],
              },
            ].map((card, i) => (
              <Grid item xs={12} sm={6} md={4} key={i}>
                <Paper sx={{
                  p: 4, backgroundColor: '#1a1f33', borderRadius: 3, textAlign: 'center',
                  color: '#fff', boxShadow: '0 0 12px rgba(0,0,0,0.2)',
                  transition: 'transform 0.3s', '&:hover': { transform: 'scale(1.05)' }
                }}>
                  <Typography fontSize="2.5rem">{card.icon}</Typography>
                  <Typography variant="h6" fontWeight="bold" mb={1}>{card.title}</Typography>
                  {card.description.map((line, idx) => (
                    <Typography key={idx} variant="body2" sx={{ color: '#aaa', mb: 0.5 }}>
                      {line}
                    </Typography>
                  ))}
                </Paper>
              </Grid>
            ))}
          </Grid>

          {/* Секция: Как проходит занятие */}
          <Box textAlign="center" mt={10} mb={6}>
            <Typography variant="h5" fontWeight="bold" color="#b3e5c7" mb={3}>
              📚 Как проходит занятие?
            </Typography>
            <Grid container spacing={3}>
              {[
                { step: '1️⃣ Запись на пробный урок', desc: 'Вы выбираете формат и заполняете анкету' },
                { step: '2️⃣ Онлайн-занятие', desc: 'Видеосозвон, разбор позиций, тренировка мышления' },
                { step: '3️⃣ Индивидуальный план', desc: 'Тренер подбирает цели и стратегию роста' },
              ].map((item, idx) => (
                <Grid item xs={12} sm={4} key={idx}>
                  <Paper sx={{
                    p: 3, backgroundColor: '#13192a', borderRadius: 3, color: '#fff', minHeight: '150px'
                  }}>
                    <Typography variant="subtitle1" fontWeight="bold" mb={1}>{item.step}</Typography>
                    <Typography variant="body2" color="#aaa">{item.desc}</Typography>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </Box>

          {/* Слайдер отзывов */}
          <Box mt={10} mb={6} textAlign="center">
            <Typography variant="h5" fontWeight="bold" color="#ffc400" mb={3}>
              🌟 Отзывы учеников
            </Typography>
            <Paper sx={{ p: 4, backgroundColor: '#212636', color: '#fff', borderRadius: 2, maxWidth: 600, mx: 'auto' }}>
              <Typography fontStyle="italic" fontSize="1.1rem">
                “{testimonials[currentTestimonial].quote}”
              </Typography>
              <Typography fontWeight="bold" mt={2}>
                — {testimonials[currentTestimonial].name}
              </Typography>
            </Paper>
          </Box>

          {/* Тизер тренеров */}
          <Box mt={10} mb={6}>
            <Typography variant="h5" fontWeight="bold" align="center" mb={4}>
              🧑‍🏫 Познакомьтесь с тренерами
            </Typography>
            <Grid container spacing={4}>
              {coaches.map((coach, idx) => (
                <Grid item xs={12} sm={6} key={idx}>
                  <Paper sx={{ p: 3, backgroundColor: '#161c2e', color: '#fff', borderRadius: 2 }}>
                    <Typography variant="subtitle1" fontWeight="bold">{coach.name}</Typography>
                    <Typography variant="body2" fontStyle="italic" color="#aaa">{coach.quote}</Typography>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </Box>

          {/* Нижний слоган */}
          <Divider sx={{ my: 8, borderColor: '#333' }} />
          <Typography align="center" fontWeight="bold" variant="h6" sx={{ color: '#fff', fontSize: '1.3rem' }}>
            ♟ Mob — это начало. Шахматы — инструмент. Победа — побочный эффект.
          </Typography>
        </Container>
      </Box>
    </Box>
  );
};
