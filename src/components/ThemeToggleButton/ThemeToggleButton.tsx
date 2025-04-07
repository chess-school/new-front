import { MoonOutlined, SunOutlined } from '@ant-design/icons';
import { Button } from 'antd';
import React, { useEffect } from 'react';
import { useSettingsStore } from '@/store';
import './styles.scss';

const ThemeToggleButton: React.FC = () => {
  const changeUserTheme = useSettingsStore((state) => state.changeUserTheme);
  const theme = useSettingsStore((state) => state.theme);

  useEffect(() => {
    const themeSet = localStorage.getItem('themeSet');
    if (!themeSet) {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 1 : 0;
      changeUserTheme(systemTheme);
      localStorage.setItem('themeSet', 'true');
    }
  }, [changeUserTheme]);

  const toggleTheme = () => {
    const newTheme = theme === 0 ? 1 : 0;
    changeUserTheme(newTheme);
  };

  return (
    <div className="ThemeToggleButton">
      <Button type="text" onClick={toggleTheme}>
        {theme === 0 ? <SunOutlined style={{ fontSize: '20px' }} /> : <MoonOutlined style={{ fontSize: '20px' }} />}
      </Button>
    </div>
  );
};

export default ThemeToggleButton;
