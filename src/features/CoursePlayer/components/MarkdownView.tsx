import React from 'react';
import { Box, Typography, Link } from '@mui/material';

/**
 * Лёгкий безопасный рендер Markdown для текстовых блоков курса.
 * В проекте нет react-markdown — а тащить зависимость ради теории курса избыточно.
 * Поддержка подмножества: заголовки #/##/###, **жирный**, *курсив*, `код`, [ссылки](url),
 * списки - / * / 1., абзацы и пустые строки. HTML намеренно НЕ интерпретируется (XSS-safe:
 * весь ввод — текстовые узлы React, никакого dangerouslySetInnerHTML).
 */

// --- инлайновое форматирование: **bold** *italic* `code` [text](url) ---
const INLINE_RE = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/g;

const renderInline = (text: string): React.ReactNode[] => {
  const parts = text.split(INLINE_RE).filter((p) => p !== '');
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith('*') && part.endsWith('*')) {
      return <em key={i}>{part.slice(1, -1)}</em>;
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <Box key={i} component="code" sx={{ px: 0.5, py: 0.1, borderRadius: 0.5, bgcolor: 'action.hover', fontFamily: 'monospace', fontSize: '0.9em' }}>
          {part.slice(1, -1)}
        </Box>
      );
    }
    const link = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (link) {
      const href = link[2];
      const safe = /^(https?:|mailto:|\/)/i.test(href) ? href : '#'; // только безопасные схемы
      return (
        <Link key={i} href={safe} target="_blank" rel="noopener noreferrer">{link[1]}</Link>
      );
    }
    return <React.Fragment key={i}>{part}</React.Fragment>;
  });
};

export const MarkdownView: React.FC<{ body: string }> = ({ body }) => {
  const lines = (body || '').replace(/\r\n/g, '\n').split('\n');
  const out: React.ReactNode[] = [];
  let list: { ordered: boolean; items: string[] } | null = null;
  let key = 0;

  const flushList = () => {
    if (!list) return;
    const Tag = list.ordered ? 'ol' : 'ul';
    out.push(
      <Box key={`l${key++}`} component={Tag} sx={{ pl: 3, my: 1 }}>
        {list.items.map((it, i) => (
          <Typography key={i} component="li" variant="body1" sx={{ mb: 0.5 }}>{renderInline(it)}</Typography>
        ))}
      </Box>,
    );
    list = null;
  };

  for (const raw of lines) {
    const line = raw.trimEnd();
    const h = line.match(/^(#{1,3})\s+(.*)$/);
    const ul = line.match(/^[-*]\s+(.*)$/);
    const ol = line.match(/^\d+\.\s+(.*)$/);

    if (h) {
      flushList();
      const level = h[1].length;
      out.push(
        <Typography key={`h${key++}`} variant={level === 1 ? 'h5' : level === 2 ? 'h6' : 'subtitle1'} sx={{ fontWeight: 700, mt: 2, mb: 1 }}>
          {renderInline(h[2])}
        </Typography>,
      );
    } else if (ul) {
      if (!list || list.ordered) { flushList(); list = { ordered: false, items: [] }; }
      list.items.push(ul[1]);
    } else if (ol) {
      if (!list || !list.ordered) { flushList(); list = { ordered: true, items: [] }; }
      list.items.push(ol[1]);
    } else if (!line.trim()) {
      flushList(); // пустая строка — конец абзаца/списка
    } else {
      flushList();
      out.push(
        <Typography key={`p${key++}`} variant="body1" sx={{ my: 1, lineHeight: 1.7 }}>
          {renderInline(line)}
        </Typography>,
      );
    }
  }
  flushList();
  return <Box>{out}</Box>;
};

export default MarkdownView;
