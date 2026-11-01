import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Box, Paper, Stack, Typography, Button, IconButton, CircularProgress, Tooltip, LinearProgress,
} from '@mui/material';
import UploadRoundedIcon from '@mui/icons-material/UploadRounded';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import ContentCopyRoundedIcon from '@mui/icons-material/ContentCopyRounded';
import CheckRoundedIcon from '@mui/icons-material/CheckRounded';
import { message } from 'antd';
import { useTranslation } from 'react-i18next';
import { MediaItem, fetchMedia, uploadMedia, deleteMedia, mediaUrl } from './mediaApi';

const prettySize = (bytes: number) => {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const ACCEPT = 'image/png,image/jpeg,image/webp,image/gif';

interface Props {
  /** Режим выбора: по клику на карточку вызывается onPick (для вставки в настройки/страницы). */
  selectable?: boolean;
  onPick?: (item: MediaItem) => void;
  /** Подсвеченная ссылка (текущее выбранное значение) — покажем галочку. */
  selectedUrl?: string;
}

/** Медиатека клуба: сетка загруженных картинок с загрузкой, удалением, копированием и выбором. */
export const MediaLibrary = ({ selectable, onPick, selectedUrl }: Props) => {
  const { t } = useTranslation();
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let alive = true;
    fetchMedia()
      .then((r) => { if (alive) setItems(r.items); })
      .catch(() => { /* интерцептор покажет ошибку */ })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, []);

  const handleFiles = useCallback(async (files: FileList | File[]) => {
    const list = Array.from(files).filter((f) => f.type.startsWith('image/'));
    if (!list.length) return;
    setUploading(true);
    try {
      for (const file of list) {
        setProgress(0);
        // eslint-disable-next-line no-await-in-loop
        const created = await uploadMedia(file, '', setProgress);
        setItems((prev) => [created, ...prev]);
      }
      message.success(t('media.uploaded', 'Загружено'));
    } catch { /* интерцептор показал ошибку */ } finally {
      setUploading(false);
      setProgress(0);
    }
  }, [t]);

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files?.length) handleFiles(e.dataTransfer.files);
  };

  const onDelete = async (item: MediaItem) => {
    if (!window.confirm(t('media.confirmDelete', 'Удалить это изображение? Оно исчезнет со страниц, где используется.'))) return;
    try {
      await deleteMedia(item.id);
      setItems((prev) => prev.filter((x) => x.id !== item.id));
      message.success(t('media.deleted', 'Удалено'));
    } catch { /* интерцептор показал ошибку */ }
  };

  const onCopy = async (item: MediaItem) => {
    try {
      await navigator.clipboard.writeText(mediaUrl(item.url));
      message.success(t('media.copied', 'Ссылка скопирована'));
    } catch { message.error(t('media.copyFailed', 'Не удалось скопировать')); }
  };

  return (
    <Box>
      {/* Зона загрузки (клик + drag-and-drop) */}
      <Paper
        variant="outlined"
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        sx={{
          p: 3, mb: 2.5, borderRadius: 4, borderStyle: 'dashed', textAlign: 'center',
          bgcolor: dragOver ? 'action.hover' : 'transparent', transition: 'background-color .15s',
        }}
      >
        <input ref={inputRef} type="file" accept={ACCEPT} multiple hidden
          onChange={(e) => { if (e.target.files) handleFiles(e.target.files); e.target.value = ''; }} />
        <Stack spacing={1.5} alignItems="center">
          <Typography variant="body2" color="text.secondary">
            {t('media.dropHint', 'Перетащите изображения сюда или')}
          </Typography>
          <Button variant="contained" startIcon={<UploadRoundedIcon />} onClick={() => inputRef.current?.click()} disabled={uploading}>
            {t('media.upload', 'Загрузить изображение')}
          </Button>
          <Typography variant="caption" color="text.secondary">
            {t('media.formats', 'PNG, JPEG, WebP, GIF — до 5 МБ. Сжимаем в WebP автоматически.')}
          </Typography>
          {uploading && <Box sx={{ width: '60%', maxWidth: 320 }}><LinearProgress variant={progress ? 'determinate' : 'indeterminate'} value={progress} /></Box>}
        </Stack>
      </Paper>

      {loading ? (
        <Box sx={{ display: 'grid', placeItems: 'center', py: 8 }}><CircularProgress /></Box>
      ) : items.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 6, color: 'text.secondary' }}>
          <Typography>{t('media.empty', 'Пока нет загруженных изображений')}</Typography>
        </Box>
      ) : (
        <Box sx={{ display: 'grid', gap: 1.5, gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(3, 1fr)', md: 'repeat(4, 1fr)' } }}>
          {items.map((item) => {
            const picked = selectable && selectedUrl && mediaUrl(item.url) === mediaUrl(selectedUrl);
            const thumb = mediaUrl(item.variants.thumb?.url || item.url);
            return (
              <Paper key={item.id} variant="outlined"
                onClick={selectable ? () => onPick?.(item) : undefined}
                sx={{
                  borderRadius: 3, overflow: 'hidden', position: 'relative',
                  cursor: selectable ? 'pointer' : 'default',
                  outline: picked ? '3px solid' : 'none', outlineColor: 'primary.main',
                  '&:hover .media-actions': { opacity: 1 },
                }}
              >
                <Box sx={{ position: 'relative', pt: '72%', bgcolor: 'action.hover' }}>
                  <Box component="img" src={thumb} alt={item.alt || item.originalName} loading="lazy"
                    sx={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                  {picked && (
                    <Box sx={{ position: 'absolute', top: 6, right: 6, bgcolor: 'primary.main', color: '#fff', borderRadius: '50%', width: 26, height: 26, display: 'grid', placeItems: 'center' }}>
                      <CheckRoundedIcon fontSize="small" />
                    </Box>
                  )}
                  {/* Действия поверх картинки */}
                  <Stack direction="row" spacing={0.5} className="media-actions"
                    sx={{ position: 'absolute', top: 6, left: 6, opacity: { xs: 1, md: 0 }, transition: 'opacity .15s' }}>
                    <Tooltip title={t('media.copy', 'Скопировать ссылку')}>
                      <IconButton size="small" onClick={(e) => { e.stopPropagation(); onCopy(item); }}
                        sx={{ bgcolor: 'rgba(0,0,0,0.55)', color: '#fff', '&:hover': { bgcolor: 'rgba(0,0,0,0.75)' } }}>
                        <ContentCopyRoundedIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title={t('media.delete', 'Удалить')}>
                      <IconButton size="small" onClick={(e) => { e.stopPropagation(); onDelete(item); }}
                        sx={{ bgcolor: 'rgba(0,0,0,0.55)', color: '#fff', '&:hover': { bgcolor: 'rgba(220,38,38,0.9)' } }}>
                        <DeleteOutlineRoundedIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                </Box>
                <Box sx={{ px: 1, py: 0.75 }}>
                  <Typography variant="caption" noWrap sx={{ display: 'block' }} title={item.originalName}>{item.originalName}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {item.width}×{item.height}{item.size ? ` · ${prettySize(item.size)}` : ''}
                  </Typography>
                </Box>
              </Paper>
            );
          })}
        </Box>
      )}
    </Box>
  );
};

export default MediaLibrary;
