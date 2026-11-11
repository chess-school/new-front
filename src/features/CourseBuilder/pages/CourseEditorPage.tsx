import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Stack, Paper, TextField, Typography, Button, IconButton, Tooltip, Menu, MenuItem,
  Divider, Chip, CircularProgress, Alert, Collapse,
} from '@mui/material';
import ArrowUpwardRounded from '@mui/icons-material/ArrowUpwardRounded';
import ArrowDownwardRounded from '@mui/icons-material/ArrowDownwardRounded';
import DeleteOutlineRounded from '@mui/icons-material/DeleteOutlineRounded';
import AddRounded from '@mui/icons-material/AddRounded';
import SaveRounded from '@mui/icons-material/SaveRounded';
import ArrowBackRounded from '@mui/icons-material/ArrowBackRounded';
import VisibilityRounded from '@mui/icons-material/VisibilityRounded';
import ExpandMoreRounded from '@mui/icons-material/ExpandMoreRounded';
import ExpandLessRounded from '@mui/icons-material/ExpandLessRounded';
import { useTranslation } from 'react-i18next';
import { notification } from 'antd';

import { PageContainer, PageHeader } from '@/shared/components/ui/PageHeader';
import type { CourseContent, CourseBlock, CourseBlockType, CourseChapter } from '@/features/Courses/types/courseBlocks';
import type { CourseStatus } from '@/types/Course';
import { getCourse, updateCourse, setCourseStatus } from '@/api/courses';
import {
  emptyContent, addChapter, updateChapter, removeChapter, moveChapter,
  addBlock, updateBlock, removeBlock, moveBlock, validateDraft,
} from '../lib/courseDraft';
import { BlockEditor } from '../components/BlockEditor';
import { ProgressSummaryPanel } from '../components/ProgressSummaryPanel';

const BLOCK_TYPES: CourseBlockType[] = ['text', 'puzzle', 'game'];

const blockTypeLabel = (t: (k: string, d: string) => string, type: CourseBlockType): string => ({
  text: t('courses.block.type.text', 'Text'),
  puzzle: t('courses.block.type.puzzle', 'Puzzles'),
  game: t('courses.block.type.game', 'Game'),
  blindfold: t('courses.block.type.blindfold', 'Blindfold'),
  solveMode: t('courses.block.type.solveMode', 'Solve mode'),
}[type]);

// --- один блок (заголовок + reorder/delete + редактор) ---
const BlockCard: React.FC<{
  block: CourseBlock;
  index: number;
  total: number;
  onChange: (b: CourseBlock) => void;
  onMove: (dir: -1 | 1) => void;
  onRemove: () => void;
}> = ({ block, index, total, onChange, onMove, onRemove }) => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(true);
  return (
    <Paper variant="outlined" sx={{ p: 1.5 }}>
      <Stack direction="row" spacing={1} alignItems="center">
        <IconButton size="small" onClick={() => setOpen((v) => !v)}>
          {open ? <ExpandLessRounded fontSize="small" /> : <ExpandMoreRounded fontSize="small" />}
        </IconButton>
        <Chip size="small" label={blockTypeLabel(t, block.type)} />
        <TextField
          variant="standard"
          placeholder={t('courses.block.titlePlaceholder', 'Block title (optional)')}
          value={block.title ?? ''}
          onChange={(e) => onChange({ ...block, title: e.target.value })}
          sx={{ flexGrow: 1 }}
        />
        <Tooltip title={t('common.moveUp', 'Move up')}>
          <span><IconButton size="small" disabled={index === 0} onClick={() => onMove(-1)}><ArrowUpwardRounded fontSize="small" /></IconButton></span>
        </Tooltip>
        <Tooltip title={t('common.moveDown', 'Move down')}>
          <span><IconButton size="small" disabled={index === total - 1} onClick={() => onMove(1)}><ArrowDownwardRounded fontSize="small" /></IconButton></span>
        </Tooltip>
        <Tooltip title={t('common.delete', 'Delete')}>
          <IconButton size="small" color="error" onClick={onRemove}><DeleteOutlineRounded fontSize="small" /></IconButton>
        </Tooltip>
      </Stack>
      <Collapse in={open} unmountOnExit>
        <Box sx={{ mt: 1.5 }}>
          <BlockEditor block={block} onChange={onChange} />
        </Box>
      </Collapse>
    </Paper>
  );
};

// --- одна глава ---
const ChapterCard: React.FC<{
  chapter: CourseChapter;
  index: number;
  total: number;
  onPatch: (patch: Partial<CourseChapter>) => void;
  onMove: (dir: -1 | 1) => void;
  onRemove: () => void;
  onAddBlock: (type: CourseBlockType) => void;
  onBlockChange: (b: CourseBlock) => void;
  onBlockMove: (blockId: string, dir: -1 | 1) => void;
  onBlockRemove: (blockId: string) => void;
}> = ({ chapter, index, total, onPatch, onMove, onRemove, onAddBlock, onBlockChange, onBlockMove, onBlockRemove }) => {
  const { t } = useTranslation();
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);

  return (
    <Paper sx={{ p: { xs: 2, sm: 2.5 } }}>
      <Stack spacing={2}>
        <Stack direction="row" spacing={1} alignItems="center">
          <Typography variant="overline" color="text.secondary">{t('courses.chapter', 'Chapter')} {index + 1}</Typography>
          <Box sx={{ flexGrow: 1 }} />
          <Tooltip title={t('common.moveUp', 'Move up')}>
            <span><IconButton size="small" disabled={index === 0} onClick={() => onMove(-1)}><ArrowUpwardRounded fontSize="small" /></IconButton></span>
          </Tooltip>
          <Tooltip title={t('common.moveDown', 'Move down')}>
            <span><IconButton size="small" disabled={index === total - 1} onClick={() => onMove(1)}><ArrowDownwardRounded fontSize="small" /></IconButton></span>
          </Tooltip>
          <Tooltip title={t('common.delete', 'Delete')}>
            <IconButton size="small" color="error" onClick={onRemove}><DeleteOutlineRounded fontSize="small" /></IconButton>
          </Tooltip>
        </Stack>
        <TextField
          label={t('courses.chapterTitle', 'Chapter title')}
          value={chapter.title}
          onChange={(e) => onPatch({ title: e.target.value })}
          size="small"
          fullWidth
          error={!chapter.title.trim()}
        />
        <TextField
          label={t('courses.chapterDescription', 'Chapter description (optional)')}
          value={chapter.description ?? ''}
          onChange={(e) => onPatch({ description: e.target.value })}
          size="small"
          fullWidth
        />

        <Divider />
        <Stack spacing={1.5}>
          {chapter.blocks.map((b, bi) => (
            <BlockCard
              key={b.id}
              block={b}
              index={bi}
              total={chapter.blocks.length}
              onChange={onBlockChange}
              onMove={(dir) => onBlockMove(b.id, dir)}
              onRemove={() => onBlockRemove(b.id)}
            />
          ))}
          {chapter.blocks.length === 0 && (
            <Typography variant="body2" color="text.secondary">{t('courses.noBlocks', 'No blocks yet — add text, puzzles or a game.')}</Typography>
          )}
        </Stack>

        <Box>
          <Button size="small" startIcon={<AddRounded />} variant="outlined" onClick={(e) => setMenuAnchor(e.currentTarget)}>
            {t('courses.addBlock', 'Add block')}
          </Button>
          <Menu anchorEl={menuAnchor} open={!!menuAnchor} onClose={() => setMenuAnchor(null)}>
            {BLOCK_TYPES.map((type) => (
              <MenuItem key={type} onClick={() => { onAddBlock(type); setMenuAnchor(null); }}>
                {blockTypeLabel(t, type)}
              </MenuItem>
            ))}
          </Menu>
        </Box>
      </Stack>
    </Paper>
  );
};

export const CourseEditorPage: React.FC = () => {
  const { courseId = '' } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [content, setContent] = useState<CourseContent>(emptyContent());
  const [status, setStatus] = useState<CourseStatus>('draft');
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const c = await getCourse(courseId);
        if (!alive) return;
        setTitle(c.title ?? '');
        setDescription(c.description ?? '');
        setContent(c.modules && Array.isArray(c.modules.chapters) ? c.modules : emptyContent());
        setStatus(c.status ?? 'draft');
      } catch {
        if (alive) setNotFound(true);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [courseId]);

  const mutate = useCallback((next: CourseContent) => { setContent(next); setDirty(true); }, []);

  const problems = useMemo(() => validateDraft(content), [content]);

  const handleSave = async () => {
    if (!title.trim()) { notification.warning({ message: t('courses.needTitle', 'Course needs a title') }); return; }
    if (problems.length) { notification.warning({ message: t('courses.fixProblems', 'Fix the highlighted problems first') }); return; }
    setSaving(true);
    try {
      await updateCourse(courseId, { title: title.trim(), description, modules: content });
      setDirty(false);
      notification.success({ message: t('courses.saved', 'Course saved') });
    } catch {
      // интерсептор покажет ошибку
    } finally {
      setSaving(false);
    }
  };

  const togglePublish = async () => {
    const next: CourseStatus = status === 'published' ? 'draft' : 'published';
    try {
      await setCourseStatus(courseId, next);
      setStatus(next);
      notification.success({ message: next === 'published' ? t('courses.published', 'Course published') : t('courses.unpublished', 'Moved to draft') });
    } catch { /* интерсептор */ }
  };

  if (loading) {
    return <PageContainer><Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box></PageContainer>;
  }
  if (notFound) {
    return (
      <PageContainer>
        <Alert severity="error">{t('courses.notFound', 'Course not found')}</Alert>
        <Button sx={{ mt: 2 }} startIcon={<ArrowBackRounded />} onClick={() => navigate('/club/courses')}>{t('common.back', 'Back')}</Button>
      </PageContainer>
    );
  }

  return (
    <PageContainer maxWidth={1100}>
      <PageHeader
        eyebrow={t('nav.courses', 'Courses')}
        title={title || t('courses.untitled', 'Untitled course')}
        subtitle={status === 'published' ? t('courses.statusPublished', 'Published') : t('courses.statusDraft', 'Draft')}
        actions={(
          <Stack direction="row" spacing={1}>
            <Button variant="outlined" onClick={() => navigate('/club/courses')} startIcon={<ArrowBackRounded />}>{t('common.back', 'Back')}</Button>
            <Button variant="outlined" startIcon={<VisibilityRounded />} onClick={() => window.open(`/courses/${courseId}`, '_blank', 'noopener')}>
              {t('courses.preview', 'Preview')}
            </Button>
            <Button variant="outlined" color={status === 'published' ? 'warning' : 'success'} onClick={togglePublish}>
              {status === 'published' ? t('courses.unpublish', 'Unpublish') : t('courses.publish', 'Publish')}
            </Button>
            <Button
              variant="contained"
              startIcon={saving ? <CircularProgress size={18} color="inherit" /> : <SaveRounded />}
              disabled={saving || !dirty}
              onClick={handleSave}
            >
              {t('common.save', 'Save')}
            </Button>
          </Stack>
        )}
      />

      <Stack spacing={3}>
        <Paper sx={{ p: { xs: 2, sm: 2.5 } }}>
          <Stack spacing={2}>
            <TextField
              label={t('courses.courseTitle', 'Course title')}
              value={title}
              onChange={(e) => { setTitle(e.target.value); setDirty(true); }}
              size="small"
              fullWidth
              error={!title.trim()}
            />
            <TextField
              label={t('courses.courseDescription', 'Course description')}
              value={description}
              onChange={(e) => { setDescription(e.target.value); setDirty(true); }}
              size="small"
              fullWidth
              multiline
              minRows={2}
            />
          </Stack>
        </Paper>

        {courseId && <ProgressSummaryPanel courseId={courseId} />}

        {problems.length > 0 && (
          <Alert severity="warning">
            <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>{t('courses.beforeSave', 'Before saving:')}</Typography>
            {problems.slice(0, 8).map((p, i) => <Typography key={i} variant="caption" display="block">• {p}</Typography>)}
          </Alert>
        )}

        {content.chapters.map((ch, ci) => (
          <ChapterCard
            key={ch.id}
            chapter={ch}
            index={ci}
            total={content.chapters.length}
            onPatch={(patch) => mutate(updateChapter(content, ch.id, patch))}
            onMove={(dir) => mutate(moveChapter(content, ch.id, dir))}
            onRemove={() => mutate(removeChapter(content, ch.id))}
            onAddBlock={(type) => mutate(addBlock(content, ch.id, type))}
            onBlockChange={(b) => mutate(updateBlock(content, ch.id, b))}
            onBlockMove={(blockId, dir) => mutate(moveBlock(content, ch.id, blockId, dir))}
            onBlockRemove={(blockId) => mutate(removeBlock(content, ch.id, blockId))}
          />
        ))}

        <Box>
          <Button variant="outlined" startIcon={<AddRounded />} onClick={() => mutate(addChapter(content))}>
            {t('courses.addChapter', 'Add chapter')}
          </Button>
        </Box>
      </Stack>
    </PageContainer>
  );
};

export default CourseEditorPage;
