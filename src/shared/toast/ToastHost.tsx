import { useEffect, useState, useCallback } from 'react';
import { Snackbar, Alert } from '@mui/material';
import { subscribeToast, type ToastItem } from './toast';

const DEFAULT_DURATION = 5000;
const MAX_VISIBLE = 4;

/**
 * Хост тостов (A.2): подписан на эмиттер `toast`, рендерит стек MUI Snackbar+Alert в правом верхнем
 * углу. Монтируется один раз под AppThemeProvider (см. main.tsx). Несколько тостов — со смещением.
 */
export function ToastHost() {
  const [items, setItems] = useState<ToastItem[]>([]);

  useEffect(
    () => subscribeToast((t) => setItems((cur) => [...cur, t].slice(-MAX_VISIBLE))),
    [],
  );

  const close = useCallback((id: number) => {
    setItems((cur) => cur.filter((t) => t.id !== id));
  }, []);

  return (
    <>
      {items.map((t, i) => (
        <Snackbar
          key={t.id}
          open
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
          autoHideDuration={t.duration ?? DEFAULT_DURATION}
          onClose={(_e, reason) => {
            if (reason !== 'clickaway') close(t.id);
          }}
          sx={{ mt: `${i * 64}px` }}
        >
          <Alert severity={t.severity} variant="filled" onClose={() => close(t.id)} sx={{ width: '100%', boxShadow: 3 }}>
            {t.message}
          </Alert>
        </Snackbar>
      ))}
    </>
  );
}

export default ToastHost;
