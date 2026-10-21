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
      fullWidth
      inputProps={{ 'aria-label': 'Language' }}
      sx={{ fontSize: '0.85rem', '& .MuiSelect-select': { py: 0.75 } }}
    >
      <MenuItem value="en">English</MenuItem>
      <MenuItem value="pl">Polski</MenuItem>
      <MenuItem value="uk">Українська</MenuItem>
    </Select>
  );
};
