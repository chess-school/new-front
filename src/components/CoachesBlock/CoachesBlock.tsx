import { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  CardMedia,
} from "@mui/material";
import { useNavigate } from 'react-router-dom';
import StarIcon from "@mui/icons-material/Star";
import { useTranslation } from "react-i18next";
import { getCoachesByEmail } from "@/api/coaches";
import { Coach } from "@/types/Coach";
import { PageContainer } from "@/shared/components/ui/PageHeader";


export const CoachesBlock = () => {
      const { t } = useTranslation();
      const navigate = useNavigate();
      const [coaches, setCoaches] = useState<Coach[]>([]);

      useEffect(() => {
        const fetchCoaches = async () => {
            const data = await getCoachesByEmail(["ad3@example.com", "ad7@example.com"]);
            setCoaches(data);
        };
    
        fetchCoaches();
      }, []);

    if (coaches.length === 0) return null;

    return (
      <PageContainer>
        <Typography variant="h3" component="h2" textAlign="center" mb={{ xs: 4, md: 6 }}>
          {t("homePage.coaches.title")}
        </Typography>
        <Grid container spacing={2.5} justifyContent="center">
          {coaches.map((coach) => (
            <Grid item xs={12} sm={6} md={3} key={coach._id}>
              <Card
                sx={{
                  overflow: 'hidden',
                  position: "relative",
                  '&:hover': { borderColor: 'rgba(227,179,65,0.35)', transform: 'translateY(-4px)' },
                  '&:hover .hoverAction, &:focus-within .hoverAction': { opacity: 1 },
                }}
              >
                <CardMedia
                  component="img"
                  height="220"
                  image={coach.photoUrl || "/images/default-avatar.png"}
                  alt={`${coach.firstName} ${coach.lastName}`}
                  sx={{ objectFit: 'cover', bgcolor: 'surface.raised' }}
                />
                <CardContent>
                  <Typography variant="h6">
                    {coach.firstName} {coach.lastName}
                  </Typography>
                  <Box mt={0.5} aria-hidden>
                    {[...Array(5)].map((_, i) => (
                      <StarIcon key={i} sx={{ color: "primary.main", fontSize: 18 }} />
                    ))}
                  </Box>
                </CardContent>
                <Box
                  className="hoverAction"
                  sx={{
                    px: 2,
                    pb: 2,
                    // На сенсорных экранах наведения нет — кнопка видна всегда
                    opacity: { xs: 1, md: 0 },
                    transition: "opacity .25s ease",
                  }}
                >
                  <Button variant="contained" fullWidth
                    onClick={() => navigate("/coaches", { state: { coach } })}>
                    {t("homePage.coaches.selectCoach")}
                  </Button>
                </Box>
              </Card>
            </Grid>
          ))}
        </Grid>
      </PageContainer>
    )
}