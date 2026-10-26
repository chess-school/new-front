import React from 'react';
import { Box } from '@mui/material';
import { keyframes } from '@mui/system';

// Фирменный маскот MOB Chess («Mind Over Board») — мудрая сова.
// Показывает состояние задачи: ждёт хода, думает над ошибкой, радуется решению, объясняет.
export type MascotMood = 'waiting' | 'thinking' | 'happy' | 'teaching';

const float = keyframes`
  0%, 100% { transform: translateY(0); }
  50%      { transform: translateY(-6px); }
`;
const cheer = keyframes`
  0%   { transform: translateY(0) rotate(0); }
  30%  { transform: translateY(-12px) rotate(-4deg); }
  55%  { transform: translateY(0) rotate(3deg); }
  75%  { transform: translateY(-5px) rotate(-2deg); }
  100% { transform: translateY(0) rotate(0); }
`;

const GOLD = '#E5B849';
const GOLD_DARK = '#B88A2E';
const BODY = '#38415C';
const BELLY = '#4A5878';
const INK = '#12161F';
const WHITE = '#F3F4F6';

export const MobMascot: React.FC<{ mood?: MascotMood; size?: number }> = ({ mood = 'waiting', size = 132 }) => {
  const happy = mood === 'happy';
  const thinking = mood === 'thinking';
  // Зрачки: ждёт/объясняет — смотрит на доску (влево-вниз); думает — вверх
  const px = thinking ? 0 : -3;
  const py = thinking ? -5 : 2;

  return (
    <Box
      aria-hidden
      sx={{
        width: size,
        height: size,
        animation: happy ? `${cheer} 0.9s ease` : `${float} 4.5s ease-in-out infinite`,
        transformOrigin: '50% 90%',
      }}
    >
      <svg viewBox="0 0 120 128" width="100%" height="100%" role="img">
        {/* лапки */}
        <path d="M50 118 v8 M58 120 v8 M62 120 v8 M70 118 v8" stroke={GOLD} strokeWidth={4} strokeLinecap="round" />
        {/* ушки-кисточки */}
        <polygon points="32,30 42,6 55,27" fill={GOLD} />
        <polygon points="88,30 78,6 65,27" fill={GOLD} />
        {/* тело */}
        <ellipse cx={60} cy={70} rx={46} ry={52} fill={BODY} stroke="rgba(255,255,255,0.10)" strokeWidth={2} />
        <ellipse cx={60} cy={84} rx={30} ry={34} fill={BELLY} />

        {happy ? (
          <>
            {/* довольные прищуренные глаза-дуги */}
            <path d="M34 60 q11 -13 22 0" stroke={INK} strokeWidth={5} fill="none" strokeLinecap="round" />
            <path d="M64 60 q11 -13 22 0" stroke={INK} strokeWidth={5} fill="none" strokeLinecap="round" />
            {/* румянец */}
            <circle cx={34} cy={74} r={6} fill={GOLD} opacity={0.45} />
            <circle cx={86} cy={74} r={6} fill={GOLD} opacity={0.45} />
            {/* искорки радости */}
            <path d="M14 42 l2 6 l6 2 l-6 2 l-2 6 l-2 -6 l-6 -2 l6 -2 Z" fill={GOLD} />
            <path d="M104 46 l1.6 5 l5 1.6 l-5 1.6 l-1.6 5 l-1.6 -5 l-5 -1.6 l5 -1.6 Z" fill={GOLD} />
          </>
        ) : (
          <>
            {/* глаза */}
            <circle cx={46} cy={60} r={16} fill={WHITE} />
            <circle cx={74} cy={60} r={16} fill={WHITE} />
            <circle cx={46 + px} cy={60 + py} r={7} fill={INK} />
            <circle cx={74 + px} cy={60 + py} r={7} fill={INK} />
            {/* блики */}
            <circle cx={46 + px + 2.5} cy={60 + py - 2.5} r={2} fill={WHITE} />
            <circle cx={74 + px + 2.5} cy={60 + py - 2.5} r={2} fill={WHITE} />
            {/* брови-домиком, когда задумался */}
            {thinking && (
              <>
                <path d="M36 42 L56 48" stroke={GOLD} strokeWidth={4} strokeLinecap="round" />
                <path d="M84 42 L64 48" stroke={GOLD} strokeWidth={4} strokeLinecap="round" />
                <text x={97} y={30} fontSize={22} fontWeight={800} fill={GOLD}>?</text>
              </>
            )}
          </>
        )}

        {/* клюв */}
        <polygon points="54,66 66,66 60,78" fill={GOLD} stroke={GOLD_DARK} strokeWidth={1} />
      </svg>
    </Box>
  );
};
