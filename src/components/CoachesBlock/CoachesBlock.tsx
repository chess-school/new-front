import { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Chip,
} from "@mui/material";
import { useNavigate } from 'react-router-dom';
import WorkspacePremiumRoundedIcon from "@mui/icons-material/WorkspacePremiumRounded";
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
            const data = await getCoachesByEmail(["admin21@example.com", "admin22@example.com", "admin11@example.com"]);
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
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  '&:hover': { borderColor: 'rgba(138,43,43,0.35)', transform: 'translateY(-4px)', boxShadow: '0 16px 32px rgba(0,0,0,0.35)' },
                }}
              >
                <CardMedia
                  component="img"
                  height="220"
                  image={coach.photoUrl || "/images/default-avatar.png"}
                  alt={`${coach.firstName} ${coach.lastName}`}
                  sx={{ objectFit: 'cover', bgcolor: 'surface.raised' }}
                />
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography variant="h6" noWrap>
                    {coach.firstName} {coach.lastName}
                  </Typography>
                  {coach.specialization && (
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }} noWrap>
                      {coach.specialization}
                    </Typography>
                  )}
                  {coach.experience > 0 && (
                    <Chip
                      size="small"
                      variant="outlined"
                      icon={<WorkspacePremiumRoundedIcon sx={{ fontSize: 16 }} />}
                      label={t("homePage.coaches.experienceYears", { count: coach.experience, defaultValue: "{{count}} yrs experience" })}
                      sx={{ mt: 1.25, color: 'primary.main', borderColor: 'rgba(138,43,43,0.35)' }}
                    />
                  )}
                </CardContent>
                {/* CTA всегда в потоке — без скачка верстки при наведении */}
                <Box sx={{ px: 2, pb: 2 }}>
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