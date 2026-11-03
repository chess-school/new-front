import { useEffect, useState } from 'react';
import { Box, Typography, Divider, Stack, Button, ImageList, ImageListItem, IconButton, Avatar, Chip, Grid, Paper } from '@mui/material';
import ChevronLeftRoundedIcon from '@mui/icons-material/ChevronLeftRounded';
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded';
import { useTranslation } from 'react-i18next';
import { Link as RouterLink } from 'react-router-dom';
import { mediaUrl } from './mediaApi';
import { SiteBlock, BlockImage, I18nText, pickText } from './pagesApi';

// Публичная карточка тренера (данные подставляются вживую, в блоке не хранятся).
export interface PublicCoach {
  uuid?: string | null; name: string; headline?: string; title?: string | null;
  photoUrl?: string | null; bio?: string; tags?: string[];
}
const coachInitials = (name: string) => name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? '').join('') || 'C';

const CoachCard = ({ c, list, slug }: { c: PublicCoach; list?: boolean; slug?: string }) => {
  const linkProps = slug && c.uuid
    ? { component: RouterLink, to: `/c/${slug}/coaches/${c.uuid}`, sx: { textDecoration: 'none', color: 'inherit', transition: 'box-shadow .15s, border-color .15s', '&:hover': { borderColor: 'primary.main', boxShadow: 3 } } }
    : {};
  return (
  <Paper variant="outlined" {...linkProps} sx={{ p: 2.5, borderRadius: 4, height: '100%', display: 'flex', flexDirection: 'column', gap: 1.5, ...(linkProps.sx || {}) }}>
    <Stack direction="row" spacing={1.75} alignItems="center">
      <Avatar src={c.photoUrl || undefined} sx={{ width: 52, height: 52, bgcolor: 'primary.main', color: 'primary.contrastText', fontWeight: 700 }}>{coachInitials(c.name)}</Avatar>
      <Box sx={{ minWidth: 0 }}>
        <Stack direction="row" spacing={0.75} alignItems="center">
          {c.title && c.title !== 'None' && <Chip label={c.title} size="small" color="primary" variant="outlined" sx={{ height: 18, fontSize: 10, fontWeight: 700 }} />}
          <Typography sx={{ fontWeight: 700 }} noWrap>{c.name}</Typography>
        </Stack>
        {c.headline && <Typography variant="body2" color="text.secondary" noWrap>{c.headline}</Typography>}
      </Box>
    </Stack>
    {c.bio && (
      <Typography variant="body2" color="text.secondary" sx={{ display: '-webkit-box', WebkitLineClamp: list ? 2 : 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{c.bio}</Typography>
    )}
    {!!(c.tags && c.tags.length) && (
      <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap sx={{ mt: 'auto' }}>
        {c.tags.map((tg) => <Chip key={tg} label={tg} size="small" variant="outlined" sx={{ height: 22, fontSize: 11 }} />)}
      </Stack>
    )}
  </Paper>
  );
};

// Блок «Тренеры»: заголовок/подзаголовок из настроек блока + живой список тренеров клуба.
const CoachesBlock = ({ title, subtitle, layout, limit, coaches, slug }: { title: string; subtitle: string; layout: string; limit: number; coaches?: PublicCoach[]; slug?: string }) => {
  // coaches === undefined → превью в редакторе (живых данных нет): показываем пояснение.
  if (coaches === undefined) {
    return (
      <Box sx={{ p: 3, borderRadius: 3, border: '1px dashed', borderColor: 'divider', textAlign: 'center', color: 'text.secondary' }}>
        {title && <Typography component="h2" variant="h6" sx={{ fontFamily: '"Unbounded"', fontWeight: 800, color: 'text.primary', mb: 0.5 }}>{title}</Typography>}
        <Typography variant="body2">Coaches of your club appear here automatically on the published site.</Typography>
      </Box>
    );
  }
  const list = coaches.slice(0, limit && limit > 0 ? limit : undefined);
  if (!list.length) return null;   // нет видимых тренеров — блок не рендерится
  return (
    <Box>
      {title && <Typography component="h2" variant="h4" sx={{ fontFamily: '"Unbounded"', fontWeight: 800, mb: subtitle ? 0.5 : 2 }}>{title}</Typography>}
      {subtitle && <Typography color="text.secondary" sx={{ mb: 2.5, maxWidth: 640 }}>{subtitle}</Typography>}
      {layout === 'list' ? (
        <Stack spacing={1.5}>{list.map((c, i) => <CoachCard key={c.uuid || i} c={c} list slug={slug} />)}</Stack>
      ) : (
        <Grid container spacing={2.5}>
          {list.map((c, i) => <Grid item xs={12} sm={6} md={4} key={c.uuid || i}><CoachCard c={c} slug={slug} /></Grid>)}
        </Grid>
      )}
    </Box>
  );
};

// Слайдер (карусель) — полноширинный, с автопрокруткой, стрелками и точками. Чистый React/MUI.
const SliderView = ({ items, interval }: { items: BlockImage[]; interval?: number }) => {
  const imgs = (items || []).map((i) => mediaUrl((i && i.url) || '')).filter(Boolean);
  const [idx, setIdx] = useState(0);
  const ms = Math.max(2, Math.min(15, Number(interval) || 5)) * 1000;
  useEffect(() => {
    if (imgs.length < 2) return undefined;
    const id = setInterval(() => setIdx((v) => (v + 1) % imgs.length), ms);
    return () => clearInterval(id);
  }, [imgs.length, ms]);
  if (!imgs.length) return null;
  const go = (d: number) => setIdx((v) => (v + d + imgs.length) % imgs.length);
  const navBtn = { position: 'absolute', top: '50%', transform: 'translateY(-50%)', bgcolor: 'rgba(0,0,0,0.35)', color: '#fff', '&:hover': { bgcolor: 'rgba(0,0,0,0.55)' } } as const;
  return (
    <Box sx={{ position: 'relative', borderRadius: 3, overflow: 'hidden', bgcolor: '#000' }}>
      <Box sx={{ position: 'relative', pt: '46%' }}>
        {imgs.map((src, k) => (
          <Box key={k} component="img" src={src} alt="" loading="lazy"
            sx={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: k === idx ? 1 : 0, transition: 'opacity .6s ease' }} />
        ))}
      </Box>
      {imgs.length > 1 && (
        <>
          <IconButton size="small" onClick={() => go(-1)} sx={{ ...navBtn, left: 8 }}><ChevronLeftRoundedIcon /></IconButton>
          <IconButton size="small" onClick={() => go(1)} sx={{ ...navBtn, right: 8 }}><ChevronRightRoundedIcon /></IconButton>
          <Stack direction="row" spacing={1} sx={{ position: 'absolute', bottom: 10, left: 0, right: 0, justifyContent: 'center' }}>
            {imgs.map((_, k) => (
              <Box key={k} onClick={() => setIdx(k)} sx={{ width: 9, height: 9, borderRadius: '50%', cursor: 'pointer', bgcolor: k === idx ? '#fff' : 'rgba(255,255,255,0.5)' }} />
            ))}
          </Stack>
        </>
      )}
    </Box>
  );
};

// PageRenderer — показывает страницу клуба как список БЛОКОВ-данных (шаг 3). Никакого
// dangerouslySetInnerHTML: всё, что пришло из блока, рендерится как текст/картинка/ссылка.
// Ссылки на картинки берём из медиатеки (assetId → в шаге 4 резолвится редактором; тут берём
// готовый props.url, который редактор проставляет из медиатеки) и прогоняем через mediaUrl.

const imgSrc = (img?: BlockImage): string => mediaUrl((img && img.url) || '');

// Внутренняя ссылка (/…) рендерится через RouterLink, внешняя (http…) — обычным href в новой вкладке.
const LinkButton = ({ label, url, color, onColor }: { label: string; url: string; color?: string; onColor?: boolean }) => {
  if (!label || !url) return null;
  // onColor — кнопка на цветном/тёмном фоне баннера: белая заливка + тёмный текст (хорошо видна).
  const sx = onColor
    ? { borderRadius: 2.5, bgcolor: '#fff', color: '#141B2E', '&:hover': { bgcolor: '#fff', filter: 'brightness(0.95)' } }
    : { borderRadius: 2.5, ...(color ? { bgcolor: color, color: '#fff', '&:hover': { bgcolor: color, filter: 'brightness(0.95)' } } : {}) };
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
const BlockView = ({ block, lng, coaches, clubSlug }: { block: SiteBlock; lng: string; coaches?: PublicCoach[]; clubSlug?: string }) => {
  const p = block.props || {};
  const txt = (v?: I18nText) => pickText(v, lng);

  switch (block.type) {
    case 'heading': {
      const level = Math.min(Math.max(Number(p.level) || 2, 1), 3);
      // Семантический тег соответствует уровню (h1/h2/h3) — корректная иерархия для SEO/a11y;
      // визуальный размер держим компактным под колонку контента.
      const component = (['h1', 'h2', 'h3'] as const)[level - 1];
      const variant = (['h3', 'h4', 'h5'] as const)[level - 1];
      return (
        <Typography component={component} variant={variant} sx={{ fontFamily: '"Unbounded"', fontWeight: 800, textAlign: p.align || 'left', mt: 1 }}>
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
    case 'slider':
      return <SliderView items={p.items || []} interval={p.interval} />;
    case 'coaches':
      return <CoachesBlock title={txt(p.title)} subtitle={txt(p.subtitle)} layout={p.layout || 'grid'} limit={Number(p.limit) || 0} coaches={coaches} slug={clubSlug} />;
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
            <Box sx={{ mt: 3 }}><LinkButton label={txt(p.buttonLabel)} url={p.buttonUrl} onColor={!!(bg || p.bgColor)} /></Box>
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

/** Рендер страницы клуба из массива блоков. coaches — живой список тренеров клуба (для блока coaches). */
export const PageRenderer = ({ blocks, maxWidth = 820, coaches, clubSlug }: { blocks: SiteBlock[]; maxWidth?: number; coaches?: PublicCoach[]; clubSlug?: string }) => {
  const { i18n } = useTranslation();
  const lng = i18n.language || 'en';
  if (!blocks || !blocks.length) return null;
  return (
    <Box sx={{ maxWidth, mx: 'auto', px: { xs: 2, md: 3 }, py: { xs: 4, md: 6 } }}>
      <Stack spacing={{ xs: 3, md: 4 }}>
        {blocks.map((b, idx) => <BlockView key={b.id || idx} block={b} lng={lng} coaches={coaches} clubSlug={clubSlug} />)}
      </Stack>
    </Box>
  );
};

export default PageRenderer;
