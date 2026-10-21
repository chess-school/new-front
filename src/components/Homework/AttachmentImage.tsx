import React, { useEffect, useState } from 'react';
import { Box, CircularProgress, Link, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';

import { getSubmissionAttachment } from '@/api/homework';

interface AttachmentImageProps {
  submissionId: string;
  /** Меняется при пересдаче — картинку надо перезагрузить */
  version?: string;
}

/**
 * Скриншот сдачи. Эндпоинт закрыт авторизацией, поэтому <img src> напрямую не подойдёт:
 * скачиваем blob через axios (с токеном) и показываем по object URL.
 */
export const AttachmentImage: React.FC<AttachmentImageProps> = ({ submissionId, version }) => {
  const { t } = useTranslation();
  const [url, setUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let objectUrl: string | null = null;
    let cancelled = false;
    setUrl(null);
    setFailed(false);
    getSubmissionAttachment(submissionId)
      .then((blob) => {
        if (cancelled) return;
        objectUrl = URL.createObjectURL(blob);
        setUrl(objectUrl);
      })
      .catch(() => { if (!cancelled) setFailed(true); });
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [submissionId, version]);

  if (failed) return <Typography color="error" variant="body2">{t('homework.attachmentError')}</Typography>;
  if (!url) return <Box sx={{ py: 2 }}><CircularProgress size={24} /></Box>;
  return (
    <Link href={url} target="_blank" rel="noopener noreferrer">
      <img
        src={url}
        alt={t('homework.screenshotAlt')}
        style={{ maxWidth: '100%', maxHeight: 360, borderRadius: 8, border: '1px solid rgba(255,255,255,0.12)', display: 'block' }}
      />
    </Link>
  );
};
