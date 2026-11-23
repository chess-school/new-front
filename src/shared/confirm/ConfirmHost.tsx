import { useEffect, useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Button } from '@mui/material';
import { subscribeConfirm, type ConfirmRequest } from './confirm';

/**
 * Хост диалогов подтверждения (A.2 Wave 4): подписан на `confirmDialog`, рендерит MUI Dialog.
 * Монтируется один раз под AppThemeProvider (см. main.tsx).
 */
export function ConfirmHost() {
  const [req, setReq] = useState<ConfirmRequest | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => subscribeConfirm((r) => setReq(r)), []);

  const cancel = () => {
    req?.resolve(false);
    setReq(null);
  };

  const confirm = async () => {
    if (!req) return;
    try {
      setBusy(true);
      await req.onOk?.();
      req.resolve(true);
    } finally {
      setBusy(false);
      setReq(null);
    }
  };

  return (
    <Dialog open={!!req} onClose={() => !busy && cancel()} maxWidth="xs" fullWidth>
      {req?.title && <DialogTitle>{req.title}</DialogTitle>}
      {req?.content && (
        <DialogContent>
          <DialogContentText sx={{ whiteSpace: 'pre-wrap' }}>{req.content}</DialogContentText>
        </DialogContent>
      )}
      <DialogActions>
        <Button onClick={cancel} disabled={busy} color="inherit">
          {req?.cancelText || 'Cancel'}
        </Button>
        <Button onClick={confirm} disabled={busy} variant="contained" color={req?.danger ? 'error' : 'primary'}>
          {req?.okText || 'OK'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default ConfirmHost;
