import React from 'react';
import { Select, MenuItem, SelectChangeEvent } from '@mui/material';
import { useTranslation } from 'react-i18next';

interface LanguageSwitcherProps {
  className?: string;
}

export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({ className }) => {
  const { i18n } = useTranslation();

  const handleChange = (event: SelectChangeEvent<string>) => {
    const selectedLanguage = event.target.value as string;
    i18n.changeLanguage(selectedLanguage);
  };

  return (
    <Select
      value={i18n.language}
      onChange={handleChange}
      size="small"
      className={className} 
      style={{ color: 'black', borderColor: 'black' }}
    >
      <MenuItem value="en">EN</MenuItem>
      <MenuItem value="pl">PL</MenuItem>
      <MenuItem value="uk">UA</MenuItem>
    </Select>
  );
};
