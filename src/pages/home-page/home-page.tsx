import { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Button,
  Grid,
  Paper,
  Card,
  CardContent,
  CardMedia,
} from "@mui/material";
import { useNavigate } from 'react-router-dom';
import StarIcon from "@mui/icons-material/Star";
import { useTranslation } from "react-i18next";
import { getCoachesByEmail } from "@/api/coaches";
import { Coach } from "@/types/Coach";
import { CoachesBlock } from "@/components/CoachesBlock/CoachesBlock";


export const Home = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  // const [coaches, setCoaches] = useState<Coach[]>([]);

  // useEffect(() => {
  //   const fetchCoaches = async () => {
  //     try {
  //       const data = await getCoachesByEmail(["ad3@example.com", "ad7@example.com"]);
  //       setCoaches(data);
  //     } catch (error) {
  //       console.error("Ошибка при получении тренеров", error);
  //     }
  //   };

  //   fetchCoaches();
  // }, []);

  return (
    <Box sx={{ backgroundColor: "#0e0e0e", color: "white", fontFamily: "'Inter', sans-serif" }}>
      {/* Hero Block */}
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
        }}
        
      >
        <Typography variant="h3" fontWeight="bold">
          Master the Game. Master Your Mind.
        </Typography>
        <Typography variant="h6" mt={2}>
          Прокачай стратегическое мышление с лучшими тренерами онлайн
        </Typography>
        <Button
          variant="contained"
          size="large"
          onClick={() => navigate("/coaches")}
          sx={{
            mt: 4,
            px: 5,
            py: 1.5,
            borderRadius: "30px",
            boxShadow: 3,
            backgroundColor: "#FFD700",
            color: "black",
            fontWeight: "bold",
            '&:hover': { backgroundColor: "#FFC107" },
          }}
          startIcon={<span style={{ fontSize: '1.5rem' }}>♟</span>}
        >
          Начать обучение
        </Button>
      </Box>

      {/* Why Chess */}
      <Box py={10} px={2}>
        <Typography variant="h4" fontWeight="bold" textAlign="center" mb={6}>
          Почему шахматы?
        </Typography>
        <Grid container spacing={4} justifyContent="center">
          {[
            { icon: "🎯", title: "Аналитика" },
            { icon: "🧠", title: "Память" },
            { icon: "🏆", title: "Спортсменский дух" },
          ].map((item, idx) => (
            <Grid item xs={12} sm={4} key={idx}>
              <Paper
                sx={{
                  p: 4,
                  textAlign: "center",
                  borderRadius: 3,
                  backgroundColor: "rgba(255,255,255,0.05)",
                  backdropFilter: "blur(6px)",
                  transition: "all 0.3s ease",
                  color: "white",
                  '&:hover': {
                    transform: "scale(1.05)",
                    backgroundColor: "rgba(255,255,255,0.08)",
                  },
                }}
              >
                <Box fontSize="3rem">{item.icon}</Box>
                <Typography variant="h6" mt={2}>
                  {item.title}
                </Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Box>
      <CoachesBlock></CoachesBlock>
      {/* Formats */}
      <Box py={10} px={2}>
        <Typography variant="h4" fontWeight="bold" textAlign="center" mb={6}>
          Форматы обучения
        </Typography>
        <Grid container spacing={4} justifyContent="center">
          {["Индивидуальные", "Групповые"].map((label, idx) => (
            <Grid item xs={12} sm={6} md={5} key={idx}>
              <Paper
                sx={{
                  p: 4,
                  backgroundColor: "#1c1c1c",
                  color: "white",
                  borderRadius: 3,
                  textAlign: "center",
                  '&:hover': { backgroundColor: "#2a2a2a" },
                }}
              >
                <Typography variant="h6" fontWeight="bold">
                  {label} занятия
                </Typography>
                <Typography mt={1}>
                  {idx === 0
                    ? "Персональные тренировки с фокусом на ваш уровень и цели."
                    : "Учись в интерактивной группе и мотивируйся вместе."}
                </Typography>
                <Button variant="text" sx={{ mt: 2, color: "#FFD700" }}>
                  {idx === 0 ? "Посмотреть расписание" : "Узнать подробнее"} →
                </Button>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* Footer */}
      <Box py={4} px={2} sx={{ backgroundColor: "#0b0b0b", color: "gray" }}>
        <Grid container spacing={2} justifyContent="space-between" alignItems="center">
          <Grid item xs={12} sm={6}>
            <Typography fontWeight="bold">Chess School</Typography>
            <Typography variant="body2">Онлайн-платформа для стратегического развития</Typography>
          </Grid>
          <Grid item xs={12} sm={6} textAlign={{ xs: "left", sm: "right" }}>
            <Button size="small" sx={{ color: "gray" }}>Privacy</Button>
            <Button size="small" sx={{ color: "gray" }}>Terms</Button>
            <Button size="small" sx={{ color: "gray" }}>Instagram</Button>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
};
