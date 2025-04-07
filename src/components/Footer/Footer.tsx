import React from 'react';
import { Box, Typography, Link, Button, Stack } from '@mui/material';
import FacebookIcon from '@mui/icons-material/Facebook';
import InstagramIcon from '@mui/icons-material/Instagram';
import TwitterIcon from '@mui/icons-material/Twitter';

export const Footer = () => {
  return (
    <Box
      component="footer"
      sx={{
        backgroundColor: '#1A1A1A',
        color: '#CCCCCC',
        padding: '2rem',
        display: 'flex',
        flexDirection: { xs: 'column', md: 'row' },
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        gap: '1.5rem',
      }}
    >
      {/* О нашей школе */}
      <Box>
        <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#FFFFFF', marginBottom: '1rem' }}>
          Chess School
        </Typography>
        <Typography variant="body2" sx={{ marginBottom: '1rem' }}>
          Онлайн-школа шахмат для всех уровней — от начинающих до профессионалов.
        </Typography>
        <Stack spacing={1}>
          <Link href="/courses" underline="hover" sx={{ color: '#007BFF' }}>
            Популярные курсы
          </Link>
          <Link href="/reviews" underline="hover" sx={{ color: '#007BFF' }}>
            Отзывы
          </Link>
          <Link href="/coaches" underline="hover" sx={{ color: '#007BFF' }}>
            Наши тренеры
          </Link>
        </Stack>
      </Box>

      {/* Юридическая информация */}
      <Box>
        <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#FFFFFF', marginBottom: '1rem' }}>
          Юридическая информация
        </Typography>
        <Stack spacing={1}>
          <Link href="/privacy-policy" underline="hover" sx={{ color: '#007BFF' }}>
            Privacy Policy
          </Link>
          <Link href="/terms-of-use" underline="hover" sx={{ color: '#007BFF' }}>
            Terms of Use
          </Link>
        </Stack>
        <Typography variant="body2" sx={{ marginTop: '1rem' }}>
          © 2025 Chess School. Все права защищены.
        </Typography>
      </Box>

      {/* Социальные сети */}
      <Box>
        <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#FFFFFF', marginBottom: '1rem' }}>
          Мы в социальных сетях
        </Typography>
        <Stack direction="row" spacing={2} sx={{ marginBottom: '1rem' }}>
          <Link href="https://facebook.com" target="_blank">
            <FacebookIcon sx={{ fontSize: 24, color: '#FFFFFF', '&:hover': { color: '#1877F2' } }} />
          </Link>
          <Link href="https://instagram.com" target="_blank">
            <InstagramIcon sx={{ fontSize: 24, color: '#FFFFFF', '&:hover': { color: '#E4405F' } }} />
          </Link>
          <Link href="https://twitter.com" target="_blank">
            <TwitterIcon sx={{ fontSize: 24, color: '#FFFFFF', '&:hover': { color: '#1DA1F2' } }} />
          </Link>
        </Stack>
        <Button
          href="/contact"
          variant="contained"
          sx={{
            backgroundColor: '#007BFF',
            color: '#FFFFFF',
            textTransform: 'none',
            borderRadius: '20px',
            fontSize: '0.9rem',
            padding: '0.5rem 1.5rem',
            '&:hover': {
              backgroundColor: '#0056b3',
            },
          }}
        >
          Contact Us
        </Button>
      </Box>
    </Box>
  );
};
