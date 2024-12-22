import React from 'react';
import { AppBar, Toolbar, Typography, Button, Container } from '@mui/material';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LanguageSwitcher } from '../LanguageSwitcher/LanguageSwitcher';

export const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isAuthenticated = !!token;
  const isAdmin = user?.roles?.includes('admin');
  const isCoach = user?.roles?.includes('coach');

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <AppBar position="static" color="primary">
      <Container>
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            {t('navbar.chessSchool')}
          </Typography>
          <Button color="inherit" component={Link} to="/">
            {t('navbar.home')}
          </Button>
          <Button color="inherit" component={Link} to="/about">
            {t('navbar.aboutUs')}
          </Button>
          <Button color="inherit" component={Link} to="/achievements">
            {t('navbar.achievements')}
          </Button>
          <Button color="inherit" component={Link} to="/challenges">
            {t('navbar.challenges')}
          </Button>
          {(isCoach || isAdmin) && (
            <Button color="inherit" component={Link} to="/students">
              {t('navbar.students')}
            </Button>
          )}
          {isAdmin && (
            <Button color="inherit" component={Link} to="/users">
              {t('navbar.users')}
            </Button>
          )}
          <Button color="inherit" component={Link} to="/chess">
              {t('navbar.chessGame')}
          </Button>
          {isAuthenticated ? (
            <>
              <Button color="inherit" component={Link} to="/profile">
                {t('navbar.profile')}
              </Button>
              <Button color="inherit" onClick={handleLogout}>
                {t('navbar.logout')}
              </Button>
            </>
          ) : (
            <Button color="inherit" component={Link} to="/login">
              {t('navbar.loginOrRegister')}
            </Button>
          )}
          <LanguageSwitcher />
        </Toolbar>
      </Container>
    </AppBar>
  );
};
