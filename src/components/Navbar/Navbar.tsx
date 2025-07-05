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
  RocketOutlined, 
} from '@ant-design/icons';
import './styles.scss';
import { Notifications } from '@/components/Notifications/Notification';

export const Navbar: React.FC = () => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const navigate = useNavigate();
  const { t } = useTranslation();

  const userString = localStorage.getItem('user');
  let user = null;
  try {
    if (userString && userString !== 'undefined' && userString !== 'null') {
      user = JSON.parse(userString);
    }
  } catch (error) {
    console.error('Error parsing user from localStorage:', error);
    user = null;
  }

  const token = localStorage.getItem('token');
  const isAuthenticated = !!token && !!user;
  const isAdmin = user?.roles?.includes('admin');
  const isCoach = user?.roles?.includes('coach');
  const isStudent = user?.roles?.includes('student');

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsDrawerOpen(false);
    navigate('/login');
  };

  const handleGetStarted = () => {
    setIsDrawerOpen(false);
    navigate('/register');
  };

  const navigateToRequests = () => {
    navigate('/inbox'); 
  };

  const toggleDrawer = (open: boolean) => () => {
    setIsDrawerOpen(open);
  };

  const handleMenuClick = (path: string) => {
    setIsDrawerOpen(false);
    navigate(path);
  };

  return (
    <>
      <AppBar position="static" className="navbar-appbar">
        <Toolbar className="navbar-toolbar">
          <Typography variant="h6" className="navbar-title" onClick={() => navigate('/')}>
            {t('navbar.chessSchool')}
          </Typography>
          
          <Box className="navbar-controls">
            {!isAuthenticated && (
              <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center' }}>
                <Button color="inherit" onClick={() => navigate('/login')}>{t('navbar.login')}</Button>
                <Button variant="contained" color="secondary" onClick={() => navigate('/register')} sx={{ ml: 1 }}>{t('navbar.register')}</Button>
              </Box>
            )}

            {isAuthenticated && (
              <Notifications navigateToRequests={navigateToRequests} />
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
          <Box className="drawer-header">
            <IconButton onClick={toggleDrawer(false)} className="close-button">
              <CloseOutlined className="close-icon" />
            </IconButton>
          </Box>
          
          <List className="menu-list">
            {/* Общие пункты меню */}
            <ListItemButton onClick={() => handleMenuClick('/')} className="menu-item">
              <ListItemIcon><HomeOutlined /></ListItemIcon>
              <ListItemText primary={t('navbar.home')} />
            </ListItemButton>
            <ListItemButton onClick={() => handleMenuClick('/about')} className="menu-item">
              <ListItemIcon><InfoCircleOutlined /></ListItemIcon>
              <ListItemText primary={t('navbar.aboutUs')} />
            </ListItemButton>
            <ListItemButton onClick={() => handleMenuClick('/achievements')} className="menu-item">
              <ListItemIcon><TrophyOutlined /></ListItemIcon>
              <ListItemText primary={t('navbar.achievements')} />
            </ListItemButton>
            <ListItemButton onClick={() => handleMenuClick('/coaches')} className="menu-item">
              <ListItemIcon><TeamOutlined /></ListItemIcon>
              <ListItemText primary={t('navbar.coaches')} />
            </ListItemButton>
            
            {/* 👇 ВОССТАНОВИЛ РАЗДЕЛИТЕЛИ МЕЖДУ СЕМАНТИЧЕСКИМИ БЛОКАМИ */}
            {isAuthenticated && <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.12)' }} />}

            {/* Меню для авторизованных пользователей */}
            {isAuthenticated && (
              <>
                <ListItemButton onClick={() => handleMenuClick('/analysis')} className="menu-item">
                  <ListItemIcon><PlayCircleOutlined /></ListItemIcon>
                  <ListItemText primary={t('navbar.chessGame')} />
                </ListItemButton>
                <ListItemButton onClick={() => handleMenuClick('/profile')} className="menu-item">
                  <ListItemIcon><UserOutlined /></ListItemIcon>
                  <ListItemText primary={t('navbar.profile')} />
                </ListItemButton>
              </>
            )}

            {(isCoach || isAdmin || isStudent) && <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.12)' }} />}
            
            {/* Меню для ролей */}
            {(isCoach || isAdmin) && (
              <ListItemButton onClick={() => handleMenuClick('/students')} className="menu-item">
                <ListItemIcon><TeamOutlined /></ListItemIcon>
                <ListItemText primary={t('navbar.students')} />
              </ListItemButton>
            )}
            {(isCoach || isAdmin || isStudent) && (
              <ListItemButton onClick={() => handleMenuClick('/students-shedule')} className="menu-item">
                <ListItemIcon><TeamOutlined /></ListItemIcon>
                <ListItemText primary={t('navbar.students-shedule')} />
              </ListItemButton>
            )}
            {isAdmin && (
              <ListItemButton onClick={() => handleMenuClick('/users')} className="menu-item">
                <ListItemIcon><TeamOutlined /></ListItemIcon>
                <ListItemText primary={t('navbar.users')} />
              </ListItemButton>
            )}
          </List>

          <Box className="drawer-bottom-actions">
            {isAuthenticated ? (
              <Button onClick={handleLogout} className="logout-button">
                <LogoutOutlined />
                {t('navbar.logout')}
              </Button>
            ) : (
              <Button onClick={handleGetStarted} className="get-started-button" variant="contained" color="secondary">
                <RocketOutlined style={{ marginRight: '8px' }}/>
                {t('navbar.getStarted')}
              </Button>
            )}

            <LanguageSwitcher className="language-switcher" />
          </Box>
        </Box>
      </Drawer>
    </>
  );
};