import { Box, Typography, Divider, Stack, Button, ImageList, ImageListItem } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { Link as RouterLink } from 'react-router-dom';
import { mediaUrl } from './mediaApi';
import { SiteBlock, BlockImage, I18nText, pickText } from './pagesApi';

// PageRenderer — показывает страницу клуба как список БЛОКОВ-данных (шаг 3). Никакого
// dangerouslySetInnerHTML: всё, что пришло из блока, рендерится как текст/картинка/ссылка.
// Ссылки на картинки берём из медиатеки (assetId → в шаге 4 резолвится редактором; тут берём
// готовый props.url, который редактор проставляет из медиатеки) и прогоняем через mediaUrl.

const imgSrc = (img?: BlockImage): string => mediaUrl((img && img.url) || '');

// Внутренняя ссылка (/…) рендерится через RouterLink, внешняя (http…) — обычным href в новой вкладке.
const LinkButton = ({ label, url, color }: { label: string; url: string; color?: string }) => {
  if (!label || !url) return null;
  const sx = { borderRadius: 2.5, ...(color ? { bgcolor: color, '&:hover': { bgcolor: color, filter: 'brightness(0.95)' } } : {}) };
  return url.startsWith('/')
    ? <Button component={RouterLink} to={url} variant="contained" sx={sx}>{label}</Button>
    : <Button component="a" href={url} target="_blank" rel="noopener noreferrer" variant="contained" sx={sx}>{label}</Button>;
};

const videoEmbed = (provider?: string, id?: string): string | null => {
  if (!id) return null;
  if (provider === 'vimeo') return `https://player.vimeo.com/video/${id}`;
  return `https://www.youtube-nocookie.com/embed/${id}`;
};

/** Один блок. T — функция выбора языка для многоязычных полей. */
const BlockView = ({ block, lng }: { block: SiteBlock; lng: string }) => {
  const p = block.props || {};
  const txt = (v?: I18nText) => pickText(v, lng);

  switch (block.type) {
    case 'heading': {
      const level = Math.min(Math.max(Number(p.level) || 2, 1), 3);
      const variant = (['h3', 'h4', 'h5'] as const)[level - 1];
      return (
        <Typography variant={variant} sx={{ fontFamily: '"Unbounded"', fontWeight: 800, textAlign: p.align || 'left', mt: 1 }}>
          {txt(p.text)}
        </Typography>
      );
    }
    case 'text':
      // Переносы строк сохраняем; угловых скобок в данных уже нет (срезаны на бэке).
      return (
        <Typography sx={{ whiteSpace: 'pre-wrap', textAlign: p.align || 'left', color: 'text.secondary', fontSize: '1.05rem', lineHeight: 1.7 }}>
          {txt(p.text)}
        </Typography>
      );
    case 'quote':
      return (
        <Box component="blockquote" sx={{ m: 0, pl: 2.5, borderLeft: '4px solid', borderColor: 'primary.main' }}>
          <Typography sx={{ fontStyle: 'italic', fontSize: '1.25rem', lineHeight: 1.5 }}>{txt(p.text)}</Typography>
          {p.author && <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>— {p.author}</Typography>}
        </Box>
      );
    case 'divider':
      return <Divider sx={{ my: 1 }} />;
    case 'photo': {
      const src = imgSrc(p as BlockImage);
      if (!src) return null;
      return (
        <Box>
          <Box component="img" src={src} alt={p.alt || ''} loading="lazy"
            sx={{ width: '100%', height: 'auto', borderRadius: 3, display: 'block' }} />
          {txt(p.caption) && <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block', textAlign: 'center' }}>{txt(p.caption)}</Typography>}
        </Box>
      );
    }
    case 'gallery': {
      const items = (p.items || []).filter((i) => imgSrc(i));
      if (!items.length) return null;
      return (
        <ImageList variant="masonry" cols={3} gap={10} sx={{ m: 0, '@media (max-width:600px)': { columnCount: '1 !important' } }}>
          {items.map((i, idx) => (
            <ImageListItem key={idx}>
              <img src={imgSrc(i)} alt={i.alt || ''} loading="lazy" style={{ borderRadius: 12, display: 'block', width: '100%' }} />
            </ImageListItem>
          ))}
        </ImageList>
      );
    }
    case 'banner': {
      const bg = imgSrc(p.bg);
      return (
        <Box sx={{
          position: 'relative', borderRadius: 4, overflow: 'hidden', p: { xs: 4, md: 7 },
          color: bg ? '#fff' : 'text.primary',
          bgcolor: p.bgColor || (bg ? undefined : 'action.hover'),
          ...(bg ? { backgroundImage: `linear-gradient(rgba(10,14,20,0.45),rgba(10,14,20,0.55)), url(${bg})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}),
        }}>
          {txt(p.title) && <Typography variant="h4" sx={{ fontFamily: '"Unbounded"', fontWeight: 800 }}>{txt(p.title)}</Typography>}
          {txt(p.subtitle) && <Typography sx={{ mt: 1.5, opacity: 0.92, maxWidth: 640 }}>{txt(p.subtitle)}</Typography>}
          {txt(p.buttonLabel) && p.buttonUrl && (
            <Box sx={{ mt: 3 }}><LinkButton label={txt(p.buttonLabel)} url={p.buttonUrl} /></Box>
          )}
        </Box>
      );
    }
    case 'video': {
      const embed = videoEmbed(p.provider, p.videoId);
      if (!embed) return null;
      return (
        <Box>
          <Box sx={{ position: 'relative', pt: '56.25%', borderRadius: 3, overflow: 'hidden', bgcolor: '#000' }}>
            <Box component="iframe" src={embed} title={txt(p.caption) || 'video'} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen
              sx={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 0 }} />
          </Box>
          {txt(p.caption) && <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block', textAlign: 'center' }}>{txt(p.caption)}</Typography>}
        </Box>
      );
    }
    default:
      return null;   // неизвестный тип (на всякий случай — бэк такие не отдаёт)
  }
};

/** Рендер страницы клуба из массива блоков. */
export const PageRenderer = ({ blocks, maxWidth = 820 }: { blocks: SiteBlock[]; maxWidth?: number }) => {
  const { i18n } = useTranslation();
  const lng = i18n.language || 'en';
  if (!blocks || !blocks.length) return null;
  return (
    <Box sx={{ maxWidth, mx: 'auto', px: { xs: 2, md: 3 }, py: { xs: 4, md: 6 } }}>
      <Stack spacing={{ xs: 3, md: 4 }}>
        {blocks.map((b, idx) => <BlockView key={b.id || idx} block={b} lng={lng} />)}
      </Stack>
    </Box>
  );
};

export default PageRenderer;
