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

    return (
              <Box py={10} px={2} sx={{ backgroundColor: "#111" }}>
                <Typography variant="h4" fontWeight="bold" textAlign="center" mb={6}>
                  {t("homePage.coaches.title")}
                </Typography>
                <Grid container spacing={4} justifyContent="center">
                  {coaches.map((coach) => (
                    <Grid item xs={12} sm={6} md={3} key={coach._id}>
                      <Card
                        sx={{
                          backgroundColor: "#1a1a1a",
                          color: "white",
                          borderRadius: 3,
                          boxShadow: 4,
                          position: "relative",
                          '&:hover .hoverAction': {
                            opacity: 1,
                          },
                        }}
                      >
                        <CardMedia
                          component="img"
                          height="200"
                          image={coach.photoUrl || "/images/default-avatar.png"}
                          alt={`${coach.firstName} ${coach.lastName}`}
                        />
                        <CardContent>
                          <Typography variant="h6">
                            {coach.firstName} {coach.lastName}
                          </Typography>
                          <Typography variant="body2" color="gray">
                            GM, Индивидуальные и групповые занятия
                          </Typography>
                          <Box mt={1}>
                            {[...Array(5)].map((_, i) => (
                              <StarIcon key={i} sx={{ color: "#FFD700", fontSize: 20 }} />
                            ))}
                          </Box>
                        </CardContent>
                        <Box
                          className="hoverAction"
                          sx={{
                            position: "absolute",
                            bottom: 16,
                            left: 0,
                            right: 0,
                            textAlign: "center",
                            opacity: 0,
                            transition: "0.3s",
                          }}
                        >
                          <Button variant="contained"   
                          onClick={() => navigate("/coaches", { state: { coach } })}
                          sx={{ backgroundColor: "#FFD700", color: "black" }}>
                            {t("home.selectCoach")}
                          </Button>
                        </Box>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </Box>
    )
}