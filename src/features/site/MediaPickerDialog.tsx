import { Dialog, DialogTitle, DialogContent, DialogActions, Button, IconButton, Box } from '@mui/material';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import { useTranslation } from 'react-i18next';
import { MediaLibrary } from './MediaLibrary';
import { MediaItem, mediaUrl } from './mediaApi';

interface Props {
  open: boolean;
  onClose: () => void;
  /** Текущее значение (ссылка) — подсветится галочкой. */
  value?: string;
  /** Выбранная ссылка (уже приведённая mediaUrl) возвращается наружу. */
  onSelect: (url: string, item: MediaItem) => void;
}

/** Модальный выбор картинки из медиатеки — для полей «логотип», «фон окна входа» и будущих блоков. */
export const MediaPickerDialog = ({ open, onClose, value, onSelect }: Props) => {
  const { t } = useTranslation();
  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 4 } }}>
      <DialogTitle sx={{ pr: 6 }}>
        {t('media.pickTitle', 'Выбрать из медиатеки')}
        <IconButton onClick={onClose} sx={{ position: 'absolute', right: 8, top: 8 }}><CloseRoundedIcon /></IconButton>
      </DialogTitle>
      <DialogContent dividers>
        <Box sx={{ pt: 1 }}>
          <MediaLibrary selectable selectedUrl={value} onPick={(item) => { onSelect(mediaUrl(item.url), item); onClose(); }} />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t('common.close', 'Закрыть')}</Button>
      </DialogActions>
    </Dialog>
  );
};

export default MediaPickerDialog;
