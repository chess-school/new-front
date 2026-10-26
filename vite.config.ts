import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';
import { SEO_ROUTES, renderSeoHead } from './src/shared/components/seo/routes';

// Build-пререндер SEO: для каждого публичного маршрута пишем статический <route>/index.html с
// корректными <head>-тегами (title/description/OG/JSON-LD). Боты и соц-скрейперы, читающие сырой
// HTML (Telegram/WhatsApp/VK, Яндекс), получают мету страницы; человек грузит тот же SPA.
function seoPrerender(): Plugin {
  const stripDefaultSeo = (html: string) => html
    .replace(/<title>[\s\S]*?<\/title>/, '')
    .replace(/[ \t]*<meta name="description"[^>]*>\n?/g, '')
    .replace(/[ \t]*<meta name="keywords"[^>]*>\n?/g, '')
    .replace(/[ \t]*<link rel="canonical"[^>]*>\n?/g, '')
    .replace(/[ \t]*<meta property="og:[^>]*>\n?/g, '')
    .replace(/[ \t]*<meta name="twitter:[^>]*>\n?/g, '');
  return {
    name: 'seo-prerender',
    apply: 'build',
    closeBundle() {
      const outDir = path.resolve(__dirname, 'build');
      const indexPath = path.join(outDir, 'index.html');
      if (!fs.existsSync(indexPath)) return;
      const template = fs.readFileSync(indexPath, 'utf8');
      for (const [route, cfg] of Object.entries(SEO_ROUTES)) {
        const head = renderSeoHead(cfg);
        const html = stripDefaultSeo(template).replace('</head>', `    ${head}\n  </head>`);
        if (route === '/') {
          fs.writeFileSync(indexPath, html);
        } else {
          const dir = path.join(outDir, route.replace(/^\//, ''));
          fs.mkdirSync(dir, { recursive: true });
          fs.writeFileSync(path.join(dir, 'index.html'), html);
        }
      }
    },
  };
}

export default defineConfig({
  plugins: [react(), seoPrerender()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: ``,
      },
    },
  },
  server: {
    port: 5173,
    host: true,
    open: false,
    proxy: {
      // Бэкенд монтирует роуты на /api и /api/v2 — префикс НЕ срезаем (nginx в проде тоже не срезает)
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      // socket.io всех namespace'ов (/chat, /play, /classroom) ходит через путь /socket.io
      '/socket.io': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        ws: true,
      },
    },
  },
  build: {
    outDir: 'build',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes('node_modules')) {
            return id
              .toString()
              .split('node_modules/')[1]
              .split('/')[0]
              .toString();
          }
        },
      },
    },
  },
});
