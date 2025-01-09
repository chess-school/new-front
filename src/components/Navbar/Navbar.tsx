import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Drawer,
  List,
  ListItemButton,
  ListItemText,
  Divider,
  Box,
  Button,
  ListItemIcon,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LanguageSwitcher } from '../LanguageSwitcher/LanguageSwitcher';
import {
  HomeOutlined,
  InfoCircleOutlined,
  TrophyOutlined,
  TeamOutlined,
  PlayCircleOutlined,
  UserOutlined,
  LogoutOutlined,
  CloseOutlined,
} from '@ant-design/icons';
import './styles.scss';
import { Notifications } from '../Notifications/Notification';

export const Navbar: React.FC = () => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const navigate = useNavigate();
  const { t } = useTranslation();

  const userString = localStorage.getItem('user');
  let user = null;

  try {
    if (userString && userString !== 'undefined') {
      user = JSON.parse(userString);
    } else {
      console.warn('User data is undefined or not set in localStorage.');
    }
  } catch (error) {
    console.error('Error parsing user from localStorage:', error);
    user = null;
  }

  const token = localStorage.getItem('token');
  const isAuthenticated = !!token;
  const isAdmin = user?.roles?.includes('admin');
  const isCoach = user?.roles?.includes('coach');

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const navigateToRequests = () => {
    navigate('/inbox'); 
  };

  const toggleDrawer = (open: boolean) => () => {
    setIsDrawerOpen(open);
  };

  const handleMenuClick = (path: string) => {
    setIsDrawerOpen(false); // Закрываем меню при переходе
    navigate(path);
  };

  return (
    <>
      <AppBar position="static" color="primary" className="navbar-appbar">
        <Toolbar className="navbar-toolbar">
          <Typography variant="h6" className="navbar-title">
            {t('navbar.chessSchool')}
          </Typography>
          <Box className="navbar-controls" display="flex" alignItems="center">
            {isAuthenticated && (
              <Box display="flex" alignItems="center">
                <Notifications navigateToRequests={navigateToRequests} />
              </Box>
            )}
            <IconButton
              edge="end"
              color="inherit"
              aria-label="menu"
              onClick={toggleDrawer(true)}
              className="navbar-menu-button"
            >
              <MenuIcon />
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>

      <Drawer anchor="right" open={isDrawerOpen} onClose={toggleDrawer(false)}>
        <Box className="navbar-drawer">
          <IconButton onClick={toggleDrawer(false)} className="close-button">
            <CloseOutlined className="close-icon" />
          </IconButton>
          <List className="menu-list">
            <ListItemButton onClick={() => handleMenuClick('/')} className="menu-item">
              <ListItemIcon>
                <HomeOutlined />
              </ListItemIcon>
              <ListItemText primary={t('navbar.home')} />
            </ListItemButton>
            <ListItemButton onClick={() => handleMenuClick('/about')} className="menu-item">
              <ListItemIcon>
                <InfoCircleOutlined />
              </ListItemIcon>
              <ListItemText primary={t('navbar.aboutUs')} />
            </ListItemButton>
            <ListItemButton onClick={() => handleMenuClick('/achievements')} className="menu-item">
              <ListItemIcon>
                <TrophyOutlined />
              </ListItemIcon>
              <ListItemText primary={t('navbar.achievements')} />
            </ListItemButton>
            <ListItemButton onClick={() => handleMenuClick('/coaches')} className="menu-item">
              <ListItemIcon></ListItemIcon>
              <ListItemText primary={t('navbar.coaches')} />
            </ListItemButton>

            {isAuthenticated && (
              <>
                <Divider />
                <ListItemButton
                  onClick={() => handleMenuClick('/challenges')}
                  className="menu-item"
                >
                  <ListItemIcon>
                    <PlayCircleOutlined />
                  </ListItemIcon>
                  <ListItemText primary={t('navbar.challenges')} />
                </ListItemButton>
                <ListItemButton
                  onClick={() => handleMenuClick('/chess')}
                  className="menu-item"
                >
                  <ListItemIcon>
                    <PlayCircleOutlined />
                  </ListItemIcon>
                  <ListItemText primary={t('navbar.chessGame')} />
                </ListItemButton>
                <ListItemButton
                  onClick={() => handleMenuClick('/profile')}
                  className="menu-item"
                >
                  <ListItemIcon>
                    <UserOutlined />
                  </ListItemIcon>
                  <ListItemText primary={t('navbar.profile')} />
                </ListItemButton>
              </>
            )}

            {(isCoach || isAdmin) && (
              <>
                <Divider />
                <ListItemButton
                  onClick={() => handleMenuClick('/students')}
                  className="menu-item"
                >
                  <ListItemIcon>
                    <TeamOutlined />
                  </ListItemIcon>
                  <ListItemText primary={t('navbar.students')} />
                </ListItemButton>
              </>
            )}
            {isAdmin && (
              <ListItemButton
                onClick={() => handleMenuClick('/users')}
                className="menu-item"
              >
                <ListItemIcon>
                  <TeamOutlined />
                </ListItemIcon>
                <ListItemText primary={t('navbar.users')} />
              </ListItemButton>
            )}
          </List>

          {isAuthenticated && (
            <Button onClick={handleLogout} className="logout-button">
              <LogoutOutlined />
              {t('navbar.logout')}
            </Button>
          )}

          <LanguageSwitcher className="language-switcher" />
        </Box>
      </Drawer>
    </>
  );
};
