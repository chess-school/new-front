import { useState } from 'react';
import {
  Box, Button, IconButton, MenuItem, Paper, Select, Stack, TextField, Tooltip, Typography,
} from '@mui/material';
import ArrowUpwardRoundedIcon from '@mui/icons-material/ArrowUpwardRounded';
import ArrowDownwardRoundedIcon from '@mui/icons-material/ArrowDownwardRounded';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import PhotoLibraryRoundedIcon from '@mui/icons-material/PhotoLibraryRounded';
import { useTranslation } from 'react-i18next';
import { SiteBlock, I18nText, pickText } from '@/features/site/pagesApi';
import { MediaPickerDialog } from '@/features/site/MediaPickerDialog';
import { mediaUrl } from '@/features/site/mediaApi';

// Текст блоков многоязычен ({pl,uk,en}); редактор v1 правит одним полем и кладёт значение во все
// три языка (как делает и бэк-санитайзер для простой строки) — отдельный перевод будет позже.
const i18nAll = (v: string): I18nText => ({ pl: v, uk: v, en: v });
const newId = () => (globalThis.crypto?.randomUUID?.() ?? `b${Math.random().toString(36).slice(2)}`);

type BlockType = SiteBlock['type'];
// video опущен в v1 (отдельный контракт парсинга URL на бэке) — добавим следующим шагом.
const BLOCK_TYPES: Array<{ type: BlockType; labelKey: string; fallback: string }> = [
  { type: 'heading', labelKey: 'site.block.heading', fallback: 'Heading' },
  { type: 'text', labelKey: 'site.block.text', fallback: 'Text' },
  { type: 'quote', labelKey: 'site.block.quote', fallback: 'Quote' },
  { type: 'photo', labelKey: 'site.block.photo', fallback: 'Photo' },
  { type: 'gallery', labelKey: 'site.block.gallery', fallback: 'Gallery' },
  { type: 'slider', labelKey: 'site.block.slider', fallback: 'Slider' },
  { type: 'coaches', labelKey: 'site.block.coaches', fallback: 'Coaches' },
  { type: 'banner', labelKey: 'site.block.banner', fallback: 'Banner' },
  { type: 'divider', labelKey: 'site.block.divider', fallback: 'Divider' },
];

const EMPTY_PROPS: Record<BlockType, SiteBlock['props']> = {
  heading: { text: i18nAll(''), level: 2, align: 'left' },
  text: { text: i18nAll(''), align: 'left' },
  quote: { text: i18nAll(''), author: '' },
  divider: {},
  photo: { url: '', alt: '', caption: i18nAll('') },
  gallery: { items: [] },
  slider: { items: [], interval: 5 },
  coaches: { title: i18nAll('Our coaches'), subtitle: i18nAll(''), layout: 'grid', limit: 0 },
  banner: { bgColor: '#2B50E0', title: i18nAll(''), subtitle: i18nAll(''), buttonLabel: i18nAll(''), buttonUrl: '' },
  video: { provider: 'youtube', videoId: '' },
};

interface Props {
  blocks: SiteBlock[];
  onChange: (blocks: SiteBlock[]) => void;
}

/** Редактор списка блоков страницы сайта клуба (добавить/изменить/переставить/удалить). */
export const SiteBlockEditor = ({ blocks, onChange }: Props) => {
  const { t, i18n } = useTranslation();
  const lng = i18n.language;
  const [addType, setAddType] = useState<BlockType>('text');
  const [picker, setPicker] = useState<{ cb: (url: string) => void } | null>(null);

  const patch = (i: number, props: Partial<SiteBlock['props']>) =>
    onChange(blocks.map((b, idx) => (idx === i ? { ...b, props: { ...b.props, ...props } } : b)));
  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= blocks.length) return;
    const next = blocks.slice();
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };
  const remove = (i: number) => onChange(blocks.filter((_, idx) => idx !== i));
  const add = () => onChange([...blocks, { id: newId(), type: addType, props: { ...EMPTY_PROPS[addType] } }]);

  const openPicker = (cb: (url: string) => void) => setPicker({ cb });

  const renderFields = (b: SiteBlock, i: number) => {
    switch (b.type) {
      case 'heading':
        return (
          <Stack spacing={1.5}>
            <TextField label={t('site.f.text', 'Text')} fullWidth value={pickText(b.props.text, lng)} onChange={(e) => patch(i, { text: i18nAll(e.target.value) })} />
            <Stack direction="row" spacing={1.5}>
              <Select size="small" value={b.props.level ?? 2} onChange={(e) => patch(i, { level: Number(e.target.value) })}>
                <MenuItem value={1}>H1</MenuItem><MenuItem value={2}>H2</MenuItem><MenuItem value={3}>H3</MenuItem>
              </Select>
              <Select size="small" value={b.props.align ?? 'left'} onChange={(e) => patch(i, { align: e.target.value as 'left' | 'center' | 'right' })}>
                <MenuItem value="left">{t('site.align.left', 'Left')}</MenuItem>
                <MenuItem value="center">{t('site.align.center', 'Center')}</MenuItem>
                <MenuItem value="right">{t('site.align.right', 'Right')}</MenuItem>
              </Select>
            </Stack>
          </Stack>
        );
      case 'text':
        return (
          <Stack spacing={1.5}>
            <TextField label={t('site.f.text', 'Text')} fullWidth multiline minRows={3} value={pickText(b.props.text, lng)} onChange={(e) => patch(i, { text: i18nAll(e.target.value) })} />
            <Select size="small" value={b.props.align ?? 'left'} sx={{ alignSelf: 'flex-start' }} onChange={(e) => patch(i, { align: e.target.value as 'left' | 'center' | 'right' })}>
              <MenuItem value="left">{t('site.align.left', 'Left')}</MenuItem>
              <MenuItem value="center">{t('site.align.center', 'Center')}</MenuItem>
              <MenuItem value="right">{t('site.align.right', 'Right')}</MenuItem>
            </Select>
          </Stack>
        );
      case 'quote':
        return (
          <Stack spacing={1.5}>
            <TextField label={t('site.f.quote', 'Quote')} fullWidth multiline minRows={2} value={pickText(b.props.text, lng)} onChange={(e) => patch(i, { text: i18nAll(e.target.value) })} />
            <TextField label={t('site.f.author', 'Author')} fullWidth value={b.props.author ?? ''} onChange={(e) => patch(i, { author: e.target.value })} />
          </Stack>
        );
      case 'divider':
        return <Typography variant="body2" color="text.secondary">{t('site.divider.hint', 'A horizontal divider line.')}</Typography>;
      case 'photo':
        return (
          <Stack spacing={1.5}>
            <ImageField label={t('site.f.image', 'Image')} url={b.props.url} onPick={() => openPicker((url) => patch(i, { url }))} onClear={() => patch(i, { url: '' })} pickLabel={t('site.pick', 'Choose image')} />
            <TextField label={t('site.f.caption', 'Caption')} fullWidth value={pickText(b.props.caption, lng)} onChange={(e) => patch(i, { caption: i18nAll(e.target.value) })} />
            <TextField label={t('site.f.alt', 'Alt text')} fullWidth value={b.props.alt ?? ''} onChange={(e) => patch(i, { alt: e.target.value })} />
          </Stack>
        );
      case 'gallery': {
        const items = b.props.items ?? [];
        return (
          <Stack spacing={1.5}>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              {items.map((it, k) => (
                <Box key={k} sx={{ position: 'relative' }}>
                  <Box component="img" src={mediaUrl(it.url || '')} alt="" sx={{ width: 84, height: 84, objectFit: 'cover', borderRadius: 1.5, border: '1px solid', borderColor: 'divider' }} />
                  <IconButton size="small" onClick={() => patch(i, { items: items.filter((_, x) => x !== k) })} sx={{ position: 'absolute', top: -8, right: -8, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider' }}>
                    <DeleteOutlineRoundedIcon fontSize="small" />
                  </IconButton>
                </Box>
              ))}
            </Stack>
            <Button size="small" startIcon={<PhotoLibraryRoundedIcon />} onClick={() => openPicker((url) => patch(i, { items: [...items, { url }] }))} sx={{ alignSelf: 'flex-start' }}>
              {t('site.gallery.add', 'Add image')}
            </Button>
          </Stack>
        );
      }
      case 'slider': {
        const items = b.props.items ?? [];
        return (
          <Stack spacing={1.5}>
            <Typography variant="body2" color="text.secondary">{t('site.slider.hint', 'A full-width image carousel that auto-advances.')}</Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              {items.map((it, k) => (
                <Box key={k} sx={{ position: 'relative' }}>
                  <Box component="img" src={mediaUrl(it.url || '')} alt="" sx={{ width: 84, height: 84, objectFit: 'cover', borderRadius: 1.5, border: '1px solid', borderColor: 'divider' }} />
                  <IconButton size="small" onClick={() => patch(i, { items: items.filter((_, x) => x !== k) })} sx={{ position: 'absolute', top: -8, right: -8, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider' }}>
                    <DeleteOutlineRoundedIcon fontSize="small" />
                  </IconButton>
                </Box>
              ))}
            </Stack>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Button size="small" startIcon={<PhotoLibraryRoundedIcon />} onClick={() => openPicker((url) => patch(i, { items: [...items, { url }] }))}>
                {t('site.slider.add', 'Add slide')}
              </Button>
              <TextField type="number" size="small" label={t('site.f.interval', 'Seconds per slide')} value={b.props.interval ?? 5}
                onChange={(e) => patch(i, { interval: Math.max(2, Math.min(15, Number(e.target.value) || 5)) })}
                sx={{ width: 160 }} inputProps={{ min: 2, max: 15 }} />
            </Stack>
          </Stack>
        );
      }
      case 'coaches':
        return (
          <Stack spacing={1.5}>
            <Typography variant="body2" color="text.secondary">{t('site.coaches.hint', 'Shows your club coaches automatically — add coaches and fill their profiles; they appear here on the published site.')}</Typography>
            <TextField label={t('site.f.title', 'Title')} fullWidth value={pickText(b.props.title, lng)} onChange={(e) => patch(i, { title: i18nAll(e.target.value) })} />
            <TextField label={t('site.f.subtitle', 'Subtitle')} fullWidth value={pickText(b.props.subtitle, lng)} onChange={(e) => patch(i, { subtitle: i18nAll(e.target.value) })} />
            <Stack direction="row" spacing={1.5}>
              <Select size="small" value={b.props.layout ?? 'grid'} onChange={(e) => patch(i, { layout: e.target.value as 'grid' | 'list' })}>
                <MenuItem value="grid">{t('site.coaches.grid', 'Grid')}</MenuItem>
                <MenuItem value="list">{t('site.coaches.list', 'List')}</MenuItem>
              </Select>
              <Select size="small" value={b.props.limit ?? 0} onChange={(e) => patch(i, { limit: Number(e.target.value) })}>
                <MenuItem value={0}>{t('site.coaches.all', 'All')}</MenuItem>
                <MenuItem value={3}>3</MenuItem>
                <MenuItem value={6}>6</MenuItem>
                <MenuItem value={9}>9</MenuItem>
              </Select>
            </Stack>
          </Stack>
        );
      case 'banner':
        return (
          <Stack spacing={1.5}>
            <ImageField label={t('site.f.bg', 'Background image')} url={b.props.bg?.url} onPick={() => openPicker((url) => patch(i, { bg: { url } }))} onClear={() => patch(i, { bg: undefined })} pickLabel={t('site.pick', 'Choose image')} />
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Typography variant="body2" color="text.secondary">{t('site.f.bgColor', 'Background color')}</Typography>
              <input type="color" value={b.props.bgColor ?? '#2B50E0'} onChange={(e) => patch(i, { bgColor: e.target.value })} style={{ width: 44, height: 32, border: 'none', background: 'none' }} />
            </Stack>
            <TextField label={t('site.f.title', 'Title')} fullWidth value={pickText(b.props.title, lng)} onChange={(e) => patch(i, { title: i18nAll(e.target.value) })} />
            <TextField label={t('site.f.subtitle', 'Subtitle')} fullWidth value={pickText(b.props.subtitle, lng)} onChange={(e) => patch(i, { subtitle: i18nAll(e.target.value) })} />
            <Stack direction="row" spacing={1.5}>
              <TextField label={t('site.f.buttonLabel', 'Button label')} fullWidth value={pickText(b.props.buttonLabel, lng)} onChange={(e) => patch(i, { buttonLabel: i18nAll(e.target.value) })} />
              <TextField label={t('site.f.buttonUrl', 'Button link')} fullWidth value={b.props.buttonUrl ?? ''} onChange={(e) => patch(i, { buttonUrl: e.target.value })} />
            </Stack>
          </Stack>
        );
      default:
        return null;
    }
  };

  const typeLabel = (type: BlockType) => {
    const def = BLOCK_TYPES.find((x) => x.type === type);
    return def ? t(def.labelKey, def.fallback) : type;
  };

  return (
    <Box>
      <Stack spacing={2}>
        {blocks.map((b, i) => (
          <Paper key={b.id || i} variant="outlined" sx={{ p: 2 }}>
            <Stack direction="row" alignItems="center" sx={{ mb: 1.5 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'text.secondary', flex: 1 }}>
                {typeLabel(b.type)}
              </Typography>
              <Tooltip title={t('site.moveUp', 'Move up')}><span><IconButton size="small" disabled={i === 0} onClick={() => move(i, -1)}><ArrowUpwardRoundedIcon fontSize="small" /></IconButton></span></Tooltip>
              <Tooltip title={t('site.moveDown', 'Move down')}><span><IconButton size="small" disabled={i === blocks.length - 1} onClick={() => move(i, 1)}><ArrowDownwardRoundedIcon fontSize="small" /></IconButton></span></Tooltip>
              <Tooltip title={t('common.delete', 'Delete')}><IconButton size="small" color="error" onClick={() => remove(i)}><DeleteOutlineRoundedIcon fontSize="small" /></IconButton></Tooltip>
            </Stack>
            {renderFields(b, i)}
          </Paper>
        ))}
        {blocks.length === 0 && (
          <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
            {t('site.empty', 'No blocks yet — add one below to start filling this page.')}
          </Typography>
        )}
      </Stack>

      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mt: 2.5 }}>
        <Select size="small" value={addType} onChange={(e) => setAddType(e.target.value as BlockType)}>
          {BLOCK_TYPES.map((x) => <MenuItem key={x.type} value={x.type}>{t(x.labelKey, x.fallback)}</MenuItem>)}
        </Select>
        <Button variant="outlined" startIcon={<AddRoundedIcon />} onClick={add}>{t('site.addBlock', 'Add block')}</Button>
      </Stack>

      <MediaPickerDialog open={!!picker} onClose={() => setPicker(null)} onSelect={(url) => { picker?.cb(url); setPicker(null); }} />
    </Box>
  );
};

// Поле выбора картинки с превью/очисткой — общий вид для photo и banner-фона.
const ImageField = ({ label, url, onPick, onClear, pickLabel }: {
  label: string; url?: string; onPick: () => void; onClear: () => void; pickLabel: string;
}) => {
  const { t } = useTranslation();
  return (
  <Box>
    <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>{label}</Typography>
    {url ? (
      <Stack direction="row" spacing={1.5} alignItems="center">
        <Box component="img" src={mediaUrl(url)} alt="" sx={{ width: 120, height: 72, objectFit: 'cover', borderRadius: 1.5, border: '1px solid', borderColor: 'divider' }} />
        <Button size="small" onClick={onPick}>{t('site.replace', 'Replace')}</Button>
        <Button size="small" color="error" onClick={onClear}>{t('common.remove', 'Remove')}</Button>
      </Stack>
    ) : (
      <Button variant="outlined" size="small" startIcon={<PhotoLibraryRoundedIcon />} onClick={onPick}>{pickLabel}</Button>
    )}
  </Box>
  );
};
