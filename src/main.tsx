import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ThemeProvider } from '@/shared/theme/ThemeProvider';
import '@/styles'; 
import './index.css'
import './i18n'; 
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
     <ThemeProvider> 
    <App />
    </ThemeProvider>
  </StrictMode>,
)
