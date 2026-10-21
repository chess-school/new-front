import React, { useRef, useState } from 'react';
import { alpha, Box, Button, CircularProgress, IconButton, LinearProgress, Paper, Stack, TextField, Tooltip, Typography } from '@mui/material';
import CloudUploadRoundedIcon from '@mui/icons-material/CloudUploadRounded';
import PictureAsPdfRoundedIcon from '@mui/icons-material/PictureAsPdfRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { startDigitize } from '@/api/digitizer';

interface FormValues {
  title: string;
  pagesRange: string;
  solutionsPages: string;
}

interface DigitizeUploadFormProps {
  onStarted: (taskId: string, title: string) => void;
}

const RANGE = /^\s*\d+\s*-\s*\d+\s*$/;
const isPdf = (file: File) => file.type === 'application/pdf' || /\.pdf$/i.test(file.name);
const formatSize = (bytes: number) => (bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`);

export const DigitizeUploadForm: React.FC<DigitizeUploadFormProps> = ({ onStarted }) => {
  const { t } = useTranslation();
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [rejected, setRejected] = useState(false);
  const [uploadPercent, setUploadPercent] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  // dragenter/dragleave приходят и от дочерних элементов — считаем вложенность
  const dragDepth = useRef(0);
  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    defaultValues: { title: '', pagesRange: '', solutionsPages: '' },
  });

  const uploading = uploadPercent !== null;

  const pick = (candidate: File | null | undefined) => {
    if (!candidate) return;
    if (!isPdf(candidate)) {
      setRejected(true);
      return;
    }
    setRejected(false);
    setFile(candidate);
  };

  const onDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    if (uploading) return;
    dragDepth.current += 1;
    setDragging(true);
  };
  const onDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    dragDepth.current = Math.max(0, dragDepth.current - 1);
    if (dragDepth.current === 0) setDragging(false);
  };
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    dragDepth.current = 0;
    setDragging(false);
    if (!uploading) pick(e.dataTransfer.files?.[0]);
  };

  const onSubmit = async (values: FormValues) => {
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    formData.append('pages_range', values.pagesRange.replace(/\s/g, ''));
    if (values.solutionsPages.trim()) formData.append('solutions_pages', values.solutionsPages.replace(/\s/g, ''));

    setUploadPercent(0);
    try {
      const created = await startDigitize(formData, setUploadPercent);
      onStarted(created.task_id, values.title.trim() || file.name.replace(/\.pdf$/i, ''));
      reset();
      setFile(null);
      if (inputRef.current) inputRef.current.value = '';
    } catch {
      // ошибку уже показал перехватчик axios
    } finally {
      setUploadPercent(null);
    }
  };

  return (
    <Paper component="form" onSubmit={handleSubmit(onSubmit)} sx={{ p: { xs: 2, sm: 3 } }}>
      <Typography variant="h6" sx={{ mb: 2 }}>{t('digitizer.form.heading')}</Typography>
      <Stack spacing={2.5}>
        {/* Зона перетаскивания: клик или Enter/Space открывают выбор файла */}
        <Box
          data-testid="pdf-dropzone"
          role="button"
          tabIndex={uploading ? -1 : 0}
          aria-label={t('digitizer.form.chooseFile')}
          aria-disabled={uploading}
          onClick={() => !uploading && inputRef.current?.click()}
          onKeyDown={(e) => {
            if (!uploading && (e.key === 'Enter' || e.key === ' ')) {
              e.preventDefault();
              inputRef.current?.click();
            }
          }}
          onDragEnter={onDragEnter}
          onDragOver={(e) => e.preventDefault()}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          sx={(theme) => ({
            position: 'relative',
            borderRadius: 3,
            border: '1.5px dashed',
            borderColor: dragging ? 'primary.main' : rejected ? 'error.main' : file ? alpha(theme.palette.success.main, 0.6) : 'divider',
            bgcolor: dragging ? alpha(theme.palette.primary.main, 0.08) : 'surface.raised',
            px: 3,
            py: file ? 2.5 : 4.5,
            textAlign: 'center',
            cursor: uploading ? 'default' : 'pointer',
            transition: 'border-color .2s ease, background-color .2s ease, transform .2s ease',
            transform: dragging ? 'scale(1.01)' : 'none',
            outline: 'none',
            '&:hover': uploading ? undefined : { borderColor: 'primary.main' },
            '&:focus-visible': { boxShadow: `0 0 0 3px ${alpha(theme.palette.primary.main, 0.35)}` },
          })}
        >
          <input
            ref={inputRef}
            hidden
            type="file"
            accept="application/pdf,.pdf"
            onChange={(e) => pick(e.target.files?.[0])}
          />
          {file ? (
            <Stack direction="row" alignItems="center" spacing={2} sx={{ textAlign: 'left' }}>
              <Box sx={{ width: 48, height: 48, borderRadius: 2, display: 'grid', placeItems: 'center', bgcolor: (th) => alpha(th.palette.error.main, 0.14), color: 'error.main', flexShrink: 0 }}>
                <PictureAsPdfRoundedIcon />
              </Box>
              <Box sx={{ minWidth: 0, flex: 1 }}>
                <Typography fontWeight={600} noWrap title={file.name}>{file.name}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {formatSize(file.size)} · {t('digitizer.form.replaceFile', 'Click or drop to replace')}
                </Typography>
              </Box>
              {!uploading && (
                <Tooltip title={t('digitizer.form.removeFile', 'Remove file')}>
                  <IconButton
                    size="small"
                    aria-label={t('digitizer.form.removeFile', 'Remove file')}
                    onClick={(e) => {
                      e.stopPropagation();
                      setFile(null);
                      if (inputRef.current) inputRef.current.value = '';
                    }}
                  >
                    <CloseRoundedIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}
            </Stack>
          ) : (
            <Stack alignItems="center" spacing={1.25}>
              <Box sx={{
                width: 56, height: 56, borderRadius: '50%', display: 'grid', placeItems: 'center',
                bgcolor: (th) => alpha(th.palette.primary.main, dragging ? 0.22 : 0.12), color: 'primary.main',
                transition: 'transform .2s ease', transform: dragging ? 'translateY(-3px)' : 'none',
              }}>
                <CloudUploadRoundedIcon />
              </Box>
              <Typography fontWeight={600}>
                {dragging ? t('digitizer.form.dropHere', 'Drop the PDF here') : t('digitizer.form.dragPrompt', 'Drag a PDF book here or click to browse')}
              </Typography>
              <Typography variant="body2" color={rejected ? 'error.main' : 'text.secondary'}>
                {rejected ? t('digitizer.form.onlyPdf', 'Only PDF files are supported') : t('digitizer.form.noFile')}
              </Typography>
            </Stack>
          )}
        </Box>

        <TextField
          label={t('digitizer.form.courseTitle')}
          size="small"
          {...register('title', { maxLength: 200 })}
          helperText={t('digitizer.form.courseTitleHelp')}
        />
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <TextField
            label={t('digitizer.form.pagesRange')}
            placeholder="39-105"
            size="small"
            fullWidth
            {...register('pagesRange', { required: true, pattern: RANGE })}
            error={!!errors.pagesRange}
            helperText={errors.pagesRange ? t('digitizer.form.rangeError') : t('digitizer.form.pagesRangeHelp')}
          />
          <TextField
            label={t('digitizer.form.solutionsPages')}
            placeholder="548-814"
            size="small"
            fullWidth
            {...register('solutionsPages', { validate: (v) => !v.trim() || RANGE.test(v) })}
            error={!!errors.solutionsPages}
            helperText={errors.solutionsPages ? t('digitizer.form.rangeError') : t('digitizer.form.solutionsPagesHelp')}
          />
        </Stack>
        {uploading && (
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <LinearProgress variant="determinate" value={uploadPercent ?? 0} sx={{ flex: 1 }} />
            <Typography variant="body2" sx={{ minWidth: 40, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{uploadPercent}%</Typography>
          </Stack>
        )}
        <Button
          type="submit"
          variant="contained"
          size="large"
          disabled={!file || uploading}
          startIcon={uploading ? <CircularProgress size={18} color="inherit" /> : <CloudUploadRoundedIcon />}
          sx={{ alignSelf: { xs: 'stretch', sm: 'flex-start' } }}
        >
          {uploading ? t('digitizer.form.uploading', { percent: uploadPercent }) : t('digitizer.form.submit')}
        </Button>
      </Stack>
    </Paper>
  );
};
