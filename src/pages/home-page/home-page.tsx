import { Box, Typography, Button, Grid, Paper, Stack, Chip, Accordion, AccordionSummary, AccordionDetails } from "@mui/material";
import { Link as RouterLink } from 'react-router-dom';
import { useTranslation } from "react-i18next";
import GroupsRoundedIcon from '@mui/icons-material/GroupsRounded';
import AutoStoriesRoundedIcon from '@mui/icons-material/AutoStoriesRounded';
import VideocamRoundedIcon from '@mui/icons-material/VideocamRounded';
import InsightsRoundedIcon from '@mui/icons-material/InsightsRounded';
import NotificationsActiveRoundedIcon from '@mui/icons-material/NotificationsActiveRounded';
import ExtensionRoundedIcon from '@mui/icons-material/ExtensionRounded';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import PlayArrowRoundedIcon from '@mui/icons-material/PlayArrowRounded';
import CheckRoundedIcon from '@mui/icons-material/CheckRounded';
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded';
import { PageContainer } from '@/shared/components/ui/PageHeader';

// Сине-индиго градиентная рамка для карточек — фирменный приём debiut
const gradientBorder = {
  position: 'relative' as const,
  '&::before': {
    content: '""',
    position: 'absolute',
    inset: 0,
    borderRadius: 'inherit',
    padding: '1px',
    background: 'linear-gradient(135deg, rgba(43,80,224,0.45), rgba(20,27,46,0.07) 42%, rgba(20,27,46,0.02))',
    WebkitMask: 'linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)',
    WebkitMaskComposite: 'xor',
    maskComposite: 'exclude',
    pointerEvents: 'none',
  },
};

const card = {
  p: { xs: 3, md: 3.5 },
  height: '100%',
  borderRadius: 4,
  bgcolor: 'background.paper',
  border: '1px solid',
  borderColor: 'divider',
  boxShadow: '0 1px 2px rgba(20,27,46,0.04), 0 18px 40px -28px rgba(20,27,46,0.35)',
  transition: 'transform .3s cubic-bezier(.22,1,.36,1), box-shadow .3s ease, border-color .3s ease',
  ...gradientBorder,
  '&:hover': {
    transform: 'translateY(-6px)',
    boxShadow: '0 28px 56px -26px rgba(20,27,46,0.4)',
  },
};

const iconBox = {
  width: 50, height: 50, borderRadius: 3, display: 'grid', placeItems: 'center',
  bgcolor: 'rgba(43,80,224,0.08)', border: '1px solid rgba(43,80,224,0.2)',
  color: 'primary.main', '& svg': { fontSize: 26 },
};

// ─────────────────────────────────────────────────────────────────────
// Декоративный live-виджет урока в герое (CSS-only, без шахматных движков)
// ─────────────────────────────────────────────────────────────────────
const LIGHT_SQ = '#EEF1F8';
const DARK_SQ = '#9AA8C9';

const MiniBoard = () => (
  <Box sx={{
    width: '100%', aspectRatio: '1', borderRadius: 2.5, overflow: 'hidden',
    display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gridTemplateRows: 'repeat(8, 1fr)',
    border: '1px solid rgba(20,27,46,0.12)', boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.4)',
  }}>
    {Array.from({ length: 64 }).map((_, i) => {
      const row = Math.floor(i / 8); const col = i % 8;
      const dark = (row + col) % 2 === 1;
      const highlight = i === 52 || i === 35; // пара подсвеченных полей
      return (
        <Box key={i} sx={{
          bgcolor: highlight ? 'rgba(43,80,224,0.38)' : (dark ? DARK_SQ : LIGHT_SQ),
        }} />
      );
    })}
  </Box>
);

const AnswerRow = ({ initials, name, status, tone }: { initials: string; name: string; status: string; tone: 'ok' | 'wait' | 'err' }) => {
  const color = tone === 'ok' ? 'success.main' : tone === 'err' ? 'error.main' : 'text.secondary';
  return (
    <Stack direction="row" spacing={1.25} alignItems="center">
      <Box sx={{ width: 28, height: 28, borderRadius: '50%', flexShrink: 0, display: 'grid', placeItems: 'center',
        bgcolor: 'rgba(43,80,224,0.1)', color: 'primary.main', fontSize: 11, fontWeight: 700 }}>{initials}</Box>
      <Box sx={{ minWidth: 0 }}>
        <Typography sx={{ fontSize: 12.5, fontWeight: 600, lineHeight: 1.2 }} noWrap>{name}</Typography>
        <Typography sx={{ fontSize: 11, color, lineHeight: 1.2 }} noWrap>{status}</Typography>
      </Box>
    </Stack>
  );
};

const LiveLessonWidget = () => {
  const { t } = useTranslation();
  return (
    <Paper className="floaty" sx={{
      width: '100%', maxWidth: 460, borderRadius: 4, overflow: 'hidden',
      bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider',
      boxShadow: '0 40px 90px -40px rgba(20,27,46,0.55)', ...gradientBorder,
    }}>
      {/* Header */}
      <Stack direction="row" alignItems="center" spacing={1} sx={{ px: 2, py: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'error.main', boxShadow: '0 0 0 4px rgba(220,38,38,0.18)' }} />
        <Typography sx={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.08em', color: 'error.main' }}>{t('land.widget.live', 'LIVE')}</Typography>
        <Typography sx={{ fontSize: 12.5, fontWeight: 600 }} noWrap>{t('land.widget.lesson', 'Juniors B · Lesson 14')}</Typography>
        <Box sx={{ flex: 1 }} />
        <Typography sx={{ fontSize: 12.5, fontFamily: '"JetBrains Mono"', color: 'text.secondary' }}>32:14</Typography>
      </Stack>
      {/* Body */}
      <Grid container>
        <Grid item xs={7} sx={{ p: 1.75 }}>
          <MiniBoard />
        </Grid>
        <Grid item xs={5} sx={{ p: 1.75, pl: 0 }}>
          <Typography sx={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '0.06em', color: 'text.secondary', mb: 1 }}>
            {t('land.widget.answers', 'ANSWERS')} · 5/8
          </Typography>
          <Stack spacing={1.1}>
            <AnswerRow initials="KW" name="Kacper W." status={t('land.widget.correct', 'Correct') + ' · 0:42'} tone="ok" />
            <AnswerRow initials="ZM" name="Zosia M." status={t('land.widget.correct', 'Correct') + ' · 1:05'} tone="ok" />
            <AnswerRow initials="AP" name="Antek P." status={t('land.widget.thinking', 'Thinking…')} tone="wait" />
            <AnswerRow initials="MK" name="Maja K." status={t('land.widget.wrong', 'Wrong move')} tone="err" />
          </Stack>
        </Grid>
      </Grid>
      {/* Footer stat */}
      <Stack direction="row" alignItems="center" spacing={1.25} sx={{ px: 2, py: 1.5, bgcolor: 'rgba(22,163,74,0.08)', borderTop: '1px solid', borderColor: 'divider' }}>
        <InsightsRoundedIcon sx={{ fontSize: 18, color: 'success.main' }} />
        <Typography sx={{ fontSize: 12.5, color: 'text.secondary' }}>{t('land.widget.attendance', 'Attendance in October')}</Typography>
        <Typography sx={{ fontSize: 13, fontWeight: 800, color: 'text.primary' }}>91%</Typography>
        <Chip label="+4 pp" size="small" sx={{ height: 20, fontSize: 11, fontWeight: 700, color: 'success.main', bgcolor: 'rgba(22,163,74,0.14)' }} />
      </Stack>
    </Paper>
  );
};

const StepLabel = ({ move }: { move: string }) => (
  <Typography component="span" sx={{
    fontFamily: '"JetBrains Mono"', fontWeight: 700, fontSize: '0.95rem', color: 'warning.main', letterSpacing: '0.02em',
  }}>{move}</Typography>
);

export const Home = () => {
  const { t } = useTranslation();

  const stats = [
    { value: '150 000+', label: t('land.stats.puzzles', 'chess puzzles ready to assign') },
    { value: '~1 mln', label: t('land.stats.positions', 'positions in the analysis database') },
    { value: '16 900', label: t('land.stats.games', 'games to study and annotate') },
    { value: 'PDF →', label: t('land.stats.digitizer', 'digitize puzzle collections from books') },
  ];

  const features = [
    { icon: <GroupsRoundedIcon />, titleKey: 'featManage', title: 'Club management', descKey: 'featManageDesc', desc: 'Groups by level and age, student and parent accounts, trainer roles and permissions. Every club gets its own isolated space.' },
    { icon: <AutoStoriesRoundedIcon />, titleKey: 'featCourses', title: 'Course builder', descKey: 'featCoursesDesc', desc: 'Lessons combining theory, positions with variation trees and auto-checked exercises. Students progress step by step.' },
    { icon: <VideocamRoundedIcon />, titleKey: 'featLessons', title: 'Online group lessons', descKey: 'featLessonsDesc', desc: 'Video, chat and a shared board — everyone sees the trainer’s moves instantly, students answer tasks live.' },
    { icon: <InsightsRoundedIcon />, titleKey: 'featJournal', title: 'Journal & statistics', descKey: 'featJournalDesc', desc: 'Grades, attendance and puzzle results in one view. The trainer sees at once who needs more attention.' },
    { icon: <NotificationsActiveRoundedIcon />, titleKey: 'featBots', title: 'Telegram & WhatsApp bots', descKey: 'featBotsDesc', desc: 'Automatic reminders about lessons, new tasks and payments. Parents stay in the loop with no extra app.' },
    { icon: <ExtensionRoundedIcon />, titleKey: 'featBase', title: 'Puzzle base & analysis', descKey: 'featBaseDesc', desc: 'A huge puzzle base, the Stockfish engine, variation tree and PDF import — ready material for any level.' },
  ];

  const personas = [
    {
      glyph: '♚', titleKey: 'personaOwner', title: 'Club owner',
      items: [
        t('land.personas.owner1', 'Dashboard with attendance, activity and payments'),
        t('land.personas.owner2', 'Groups, trainers and permissions in a few clicks'),
        t('land.personas.owner3', 'Your own logo and club colors in the student panel'),
      ],
    },
    {
      glyph: '♜', titleKey: 'personaTrainer', title: 'Trainer',
      items: [
        t('land.personas.trainer1', 'Live lessons on an interactive board'),
        t('land.personas.trainer2', 'Course builder and homework with auto-checking'),
        t('land.personas.trainer3', 'Grade journal and progress of every student'),
      ],
    },
    {
      glyph: '♟', titleKey: 'personaStudent', title: 'Student & parent',
      items: [
        t('land.personas.student1', 'Courses, puzzle of the day and a learning streak'),
        t('land.personas.student2', 'Join a lesson with a single click'),
        t('land.personas.student3', 'Parent sees grades and attendance in the messenger'),
      ],
    },
  ];

  const steps = [
    { move: '1. e4', titleKey: 'step1', title: 'Create a club', descKey: 'step1Desc', desc: 'Name, logo, colors and address — your club space is ready right away.' },
    { move: '2. Nf3', titleKey: 'step2', title: 'Invite trainers and students', descKey: 'step2Desc', desc: 'An invite link or a list import. Students land straight into their groups.' },
    { move: '3. Bc4', titleKey: 'step3', title: 'Run your lessons', descKey: 'step3Desc', desc: 'Schedule, online lessons, tasks and the journal work from day one.' },
  ];

  const plans = [
    {
      key: 'start', name: 'Start', tagline: t('land.pricing.startTagline', 'For a trainer or a small school'),
      popular: false, cta: t('land.pricing.chooseStart', 'Choose Start'),
      points: [
        t('land.pricing.start1', 'Up to 30 students, 1 trainer'),
        t('land.pricing.start2', 'Puzzle base and courses'),
        t('land.pricing.start3', 'Online lessons up to 8 people'),
        t('land.pricing.start4', 'Telegram notifications'),
      ],
    },
    {
      key: 'club', name: 'Klub', tagline: t('land.pricing.clubTagline', 'For a club with several groups'),
      popular: true, cta: t('land.pricing.chooseClub', 'Choose Klub'),
      points: [
        t('land.pricing.club1', 'Up to 150 students, 10 trainers'),
        t('land.pricing.club2', 'Course builder and grade journal'),
        t('land.pricing.club3', 'Online lessons up to 30 people'),
        t('land.pricing.club4', 'Telegram & WhatsApp, online payments'),
      ],
    },
    {
      key: 'academy', name: 'Akademia', tagline: t('land.pricing.academyTagline', 'For school networks and federations'),
      popular: false, cta: t('land.pricing.contact', 'Let’s talk'), custom: true,
      points: [
        t('land.pricing.academy1', 'No limit on students and branches'),
        t('land.pricing.academy2', 'Own domain and branding'),
        t('land.pricing.academy3', 'Reports for the board'),
        t('land.pricing.academy4', 'Onboarding and support'),
      ],
    },
  ];

  const faqs = [
    { q: t('land.faq.q1', 'Is my club’s data separated from other clubs?'), a: t('land.faq.a1', 'Yes. Every club runs in its own isolated space: students, trainers and materials of one club are not visible to others.') },
    { q: t('land.faq.q2', 'Can I move students from another system or spreadsheet?'), a: t('land.faq.a2', 'Yes — import a list via CSV or an invite link, and students land straight into their groups.') },
    { q: t('land.faq.q3', 'How do Telegram and WhatsApp notifications work?'), a: t('land.faq.a3', 'Parents and students link their account to the bot once and then receive reminders about lessons, tasks and payments automatically.') },
    { q: t('land.faq.q4', 'Do online lessons require an extra program?'), a: t('land.faq.a4', 'No. Lessons run right in the browser — video, chat and the shared board work without installing anything.') },
  ];

  return (
    <Box sx={{ overflowX: 'hidden', bgcolor: 'background.default' }}>
      {/* ===================== HERO ===================== */}
      <Box className="grain" sx={{ position: 'relative', display: 'flex', alignItems: 'center', bgcolor: 'background.default' }}>
        <Box className="aurora" />
        <Box className="chess-grid" />
        <PageContainer>
          <Grid container spacing={5} alignItems="center" sx={{ position: 'relative', zIndex: 2, py: { xs: 6, md: 9 } }}>
            <Grid item xs={12} md={6}>
              <Box className="rise-in">
                <Chip label={t('land.hero.badge', 'Platform for chess clubs and schools')} size="small"
                  sx={{ mb: 3, px: 0.5, bgcolor: 'rgba(43,80,224,0.08)', color: 'primary.main', fontWeight: 700, letterSpacing: '0.02em', border: '1px solid rgba(43,80,224,0.25)' }} />
                <Typography variant="h1" sx={{ fontSize: { xs: '2.6rem', sm: '3.4rem', md: '4.1rem' }, lineHeight: 1.04, color: 'text.primary' }}>
                  {t('land.hero.titleLead', 'Your whole chess club')}{' '}
                  <Box component="span" className="text-foil">{t('land.hero.titleAccent', 'in one place')}</Box>
                </Typography>
                <Typography component="p" sx={{ mt: 3, fontSize: { xs: '1.05rem', md: '1.18rem' }, fontWeight: 400, lineHeight: 1.6, color: 'text.secondary', maxWidth: 540 }}>
                  {t('land.hero.subtitle', 'Groups, trainers and students, interactive courses, online lessons on a shared board and an electronic progress journal. Notifications go straight to Telegram and WhatsApp.')}
                </Typography>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mt: 4.5 }}>
                  <Button variant="contained" size="large" component={RouterLink} to="/register" endIcon={<ArrowForwardRoundedIcon />}
                    sx={{ px: 4, py: 1.5, fontSize: '1rem', borderRadius: 3, boxShadow: '0 16px 40px -14px rgba(43,80,224,0.6)' }}>
                    {t('land.hero.cta', 'Create a club for free')}
                  </Button>
                  <Button variant="outlined" color="inherit" size="large" href="#features" startIcon={<PlayArrowRoundedIcon />}
                    sx={{ px: 4, py: 1.5, fontSize: '1rem', borderRadius: 3, color: 'text.primary', borderColor: 'divider' }}>
                    {t('land.hero.ctaSecondary', 'See how it works')}
                  </Button>
                </Stack>
                <Stack direction="row" spacing={2} sx={{ mt: 2.5, color: 'text.secondary', fontSize: 13, flexWrap: 'wrap' }}>
                  <Stack direction="row" spacing={0.5} alignItems="center"><CheckRoundedIcon sx={{ fontSize: 16, color: 'success.main' }} />{t('land.hero.trial', 'Free trial, no card')}</Stack>
                  <Box>Polski · English · Українська</Box>
                </Stack>
              </Box>
            </Grid>
            <Grid item xs={12} md={6} sx={{ display: 'flex', justifyContent: 'center' }}>
              <LiveLessonWidget />
            </Grid>
          </Grid>
        </PageContainer>
      </Box>

      {/* ===================== STAT BAND ===================== */}
      <Box sx={{ position: 'relative', zIndex: 3 }}>
        <PageContainer>
          <Paper sx={{ borderRadius: 4, p: { xs: 2.5, md: 3.5 }, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', boxShadow: '0 30px 70px -44px rgba(20,27,46,0.5)', ...gradientBorder }}>
            <Grid container>
              {stats.map((s, i) => (
                <Grid item xs={6} md={3} key={i} sx={{ textAlign: { xs: 'left', md: 'left' }, px: { md: 3 }, borderLeft: { md: i === 0 ? 0 : '1px solid rgba(20,27,46,0.1)' }, py: { xs: 1.5, md: 0.5 } }}>
                  <Typography sx={{ fontFamily: '"Space Grotesk"', fontWeight: 700, fontSize: { xs: '1.6rem', md: '2rem' }, color: 'primary.main', lineHeight: 1.05 }}>{s.value}</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>{s.label}</Typography>
                </Grid>
              ))}
            </Grid>
          </Paper>
        </PageContainer>
      </Box>

      {/* ===================== FEATURES ===================== */}
      <Box id="features" sx={{ scrollMarginTop: 80 }}>
        <PageContainer>
          <Box sx={{ py: { xs: 7, md: 11 } }}>
            <Stack sx={{ mb: { xs: 4, md: 6 } }} spacing={1.5}>
              <Typography variant="overline" sx={{ color: 'primary.main' }}>{t('land.features.eyebrow', 'Features')}</Typography>
              <Typography variant="h2" sx={{ maxWidth: 760 }}>{t('land.features.title', 'Everything a club needs — from sign-ups to mate in two')}</Typography>
            </Stack>
            <Grid container spacing={2.5}>
              {features.map((f) => (
                <Grid item xs={12} sm={6} lg={4} key={f.titleKey}>
                  <Paper sx={{ ...card }}>
                    <Box sx={{ ...iconBox, mb: 2.5 }}>{f.icon}</Box>
                    <Typography variant="h6">{t(`land.features.${f.titleKey}`, f.title)}</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>{t(`land.features.${f.descKey}`, f.desc)}</Typography>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </Box>
        </PageContainer>
      </Box>

      {/* ===================== PERSONAS ===================== */}
      <Box id="personas" sx={{ scrollMarginTop: 80, bgcolor: 'surface.overlay', borderBlock: '1px solid', borderColor: 'divider' }}>
        <PageContainer>
          <Box sx={{ py: { xs: 7, md: 11 } }}>
            <Typography variant="h2" sx={{ mb: { xs: 4, md: 6 }, maxWidth: 620 }}>{t('land.personas.title', 'One platform, three perspectives')}</Typography>
            <Grid container spacing={2.5}>
              {personas.map((p) => (
                <Grid item xs={12} md={4} key={p.titleKey}>
                  <Paper sx={{ ...card, display: 'flex', flexDirection: 'column' }}>
                    <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2.5 }}>
                      <Box aria-hidden sx={{ fontSize: 30, lineHeight: 1, color: 'primary.main' }}>{p.glyph}</Box>
                      <Typography variant="h5">{t(`land.personas.${p.titleKey}`, p.title)}</Typography>
                    </Stack>
                    <Stack spacing={1.5}>
                      {p.items.map((it, idx) => (
                        <Stack key={idx} direction="row" spacing={1.25} alignItems="flex-start">
                          <CheckRoundedIcon sx={{ fontSize: 19, color: 'success.main', mt: '2px', flexShrink: 0 }} />
                          <Typography variant="body2" color="text.secondary">{it}</Typography>
                        </Stack>
                      ))}
                    </Stack>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </Box>
        </PageContainer>
      </Box>

      {/* ===================== STEPS ===================== */}
      <PageContainer>
        <Box sx={{ py: { xs: 7, md: 11 } }}>
          <Stack sx={{ mb: { xs: 4, md: 6 } }} spacing={1.5}>
            <Typography variant="overline" sx={{ color: 'primary.main' }}>{t('land.steps.eyebrow', 'Start in three moves')}</Typography>
            <Typography variant="h2" sx={{ maxWidth: 680 }}>{t('land.steps.title', 'From sign-up to the first lesson in one evening')}</Typography>
          </Stack>
          <Grid container spacing={{ xs: 3, md: 3 }}>
            {steps.map((s) => (
              <Grid item xs={12} md={4} key={s.titleKey}>
                <Paper sx={{ ...card }}>
                  <StepLabel move={s.move} />
                  <Typography variant="h5" sx={{ mt: 1.5 }}>{t(`land.steps.${s.titleKey}`, s.title)}</Typography>
                  <Typography color="text.secondary" sx={{ mt: 1 }}>{t(`land.steps.${s.descKey}`, s.desc)}</Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Box>
      </PageContainer>

      {/* ===================== PRICING ===================== */}
      <Box id="pricing" sx={{ scrollMarginTop: 80, bgcolor: 'surface.overlay', borderBlock: '1px solid', borderColor: 'divider' }}>
        <PageContainer>
          <Box sx={{ py: { xs: 7, md: 11 } }}>
            <Stack sx={{ mb: { xs: 4, md: 6 } }} spacing={1.5}>
              <Typography variant="overline" sx={{ color: 'primary.main' }}>{t('land.pricing.eyebrow', 'Pricing')}</Typography>
              <Typography variant="h2" sx={{ maxWidth: 680 }}>{t('land.pricing.title', 'You pay for club size, not for features')}</Typography>
            </Stack>
            <Grid container spacing={2.5} alignItems="stretch">
              {plans.map((p) => (
                <Grid item xs={12} md={4} key={p.key}>
                  <Paper sx={{
                    p: { xs: 3, md: 3.5 }, height: '100%', borderRadius: 4, display: 'flex', flexDirection: 'column',
                    bgcolor: 'background.paper', border: '2px solid', borderColor: p.popular ? 'primary.main' : 'divider',
                    boxShadow: p.popular ? '0 30px 70px -40px rgba(43,80,224,0.55)' : '0 1px 2px rgba(20,27,46,0.04)',
                    position: 'relative',
                  }}>
                    {p.popular && (
                      <Chip label={t('land.pricing.popular', 'Most popular')} size="small"
                        sx={{ position: 'absolute', top: -13, left: 24, bgcolor: 'primary.main', color: '#fff', fontWeight: 700, fontSize: 11 }} />
                    )}
                    <Typography variant="h5">{p.name}</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>{p.tagline}</Typography>
                    <Box sx={{ my: 2.5 }}>
                      <Typography component="span" sx={{ fontFamily: '"Space Grotesk"', fontWeight: 700, fontSize: p.custom ? '1.9rem' : '2.4rem', color: 'text.primary', lineHeight: 1 }}>
                        {p.custom ? t('land.pricing.custom', 'Custom') : t('land.pricing.priceStub', '[PRICE]')}
                      </Typography>
                      {!p.custom && <Typography component="span" color="text.secondary" sx={{ ml: 0.75 }}>{t('land.pricing.perMonth', '/ mo.')}</Typography>}
                    </Box>
                    <Stack spacing={1.25} sx={{ flexGrow: 1, mb: 3 }}>
                      {p.points.map((pt, idx) => (
                        <Stack key={idx} direction="row" spacing={1.25} alignItems="flex-start">
                          <CheckRoundedIcon sx={{ fontSize: 19, color: 'success.main', mt: '2px', flexShrink: 0 }} />
                          <Typography variant="body2" color="text.secondary">{pt}</Typography>
                        </Stack>
                      ))}
                    </Stack>
                    <Button fullWidth size="large" component={RouterLink} to="/register"
                      variant={p.popular ? 'contained' : 'outlined'} color={p.popular ? 'primary' : 'inherit'}
                      sx={{ borderRadius: 2.5, ...(p.popular ? {} : { borderColor: 'divider', color: 'text.primary' }) }}>
                      {p.cta}
                    </Button>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </Box>
        </PageContainer>
      </Box>

      {/* ===================== FAQ ===================== */}
      <Box id="faq" sx={{ scrollMarginTop: 80 }}>
        <PageContainer>
          <Box sx={{ py: { xs: 7, md: 11 }, maxWidth: 820, mx: 'auto' }}>
            <Typography variant="h2" sx={{ textAlign: 'center', mb: { xs: 4, md: 6 } }}>{t('land.faq.title', 'Frequently asked questions')}</Typography>
            {faqs.map((f, i) => (
              <Accordion key={i} disableGutters elevation={0}
                sx={{ bgcolor: 'transparent', borderBottom: '1px solid', borderColor: 'divider', '&:before': { display: 'none' } }}>
                <AccordionSummary expandIcon={<ExpandMoreRoundedIcon />} sx={{ px: 0, py: 1 }}>
                  <Typography sx={{ fontWeight: 600 }}>{f.q}</Typography>
                </AccordionSummary>
                <AccordionDetails sx={{ px: 0, pt: 0 }}>
                  <Typography variant="body2" color="text.secondary">{f.a}</Typography>
                </AccordionDetails>
              </Accordion>
            ))}
          </Box>
        </PageContainer>
      </Box>

      {/* ===================== CTA BAND ===================== */}
      <PageContainer>
        <Box sx={{
          position: 'relative', overflow: 'hidden', borderRadius: 6, my: { xs: 4, md: 6 },
          px: { xs: 3, md: 8 }, py: { xs: 6, md: 8 },
          background: 'linear-gradient(135deg, #2B50E0 0%, #1E3CB0 100%)', color: '#fff',
          boxShadow: '0 30px 70px -40px rgba(43,80,224,0.7)',
        }}>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={8}>
              <Typography variant="h2" sx={{ color: '#fff', maxWidth: 620 }}>{t('land.cta.title', 'Your move. Create a club and run your first lesson today.')}</Typography>
              <Typography sx={{ mt: 2, color: 'rgba(255,255,255,0.85)', maxWidth: 520 }}>{t('land.cta.subtitle', 'No credit card. You can export your club data at any time.')}</Typography>
            </Grid>
            <Grid item xs={12} md={4} sx={{ textAlign: { md: 'right' } }}>
              <Button size="large" component={RouterLink} to="/register" endIcon={<ArrowForwardRoundedIcon />}
                sx={{ px: 4, py: 1.6, fontSize: '1.05rem', borderRadius: 3, bgcolor: '#fff', color: 'primary.main', fontWeight: 700, '&:hover': { bgcolor: 'rgba(255,255,255,0.9)' } }}>
                {t('land.cta.button', 'Create a club for free')}
              </Button>
            </Grid>
          </Grid>
        </Box>
      </PageContainer>

    </Box>
  );
};
