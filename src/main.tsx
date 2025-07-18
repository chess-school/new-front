import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom'; 
// import { ThemeProvider } from '@/shared/theme/ThemeProvider';
import { AuthProvider } from '@/context/AuthContext.tsx';
import '@/styles'; 
import './index.css';
import './i18n'; 
import App from './App.tsx';

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Failed to find the root element');
const root = createRoot(rootElement);

root.render(
  <StrictMode>
    <BrowserRouter> 
      {/* <ThemeProvider>  */}
        <AuthProvider>
          <App />
        </AuthProvider>
      {/* </ThemeProvider> */}
    </BrowserRouter>
  </StrictMode>
);