import { Routes, Route, useLocation } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import { AuthPage } from '@/pages/auth-page';
import { AppShell } from '@/components/AppShell/AppShell';
import { Home } from '@/pages/home-page/home-page';
import { PricingPage } from '@/pages/pricing-page/pricing-page';
import { CreateClubPage } from '@/pages/create-club-page/create-club-page';
import { MarketingShell } from '@/components/marketing/MarketingShell';
import { About } from '@/pages/about-page/about-page';
import { Achievements } from '@/pages/achievements-page/achievements-page';
import PrivateRoute from '@/components/PrivateRoute/PrivateRoute';
import RoleRoute from '@/components/RoleRoute/RoleRoute';
import { StudentsPage } from '@/pages/students-page/students-page';
import { VerifyEmailPage } from './pages/verify-email-page/verify-email-page';
import { CoachesPage } from './pages/coaches-page/coaches-page';
import { InboxPage } from './pages/inbox-page/inbox-page';
import { CoachApplicationsPage } from './pages/coach-applications-page/coach-applications-page';
import { MyGamesPage } from './pages/my-games-page/my-games-page';
import StudentSchedulePage from './pages/students-shedule-page/students-shedule-page';
import { Box, CircularProgress } from '@mui/material';
import GuestRoute from './components/GuestRoute/GuestRoute';
import { TestProfileV2Page } from '@/pages/profile-page/profile-v2-page';
// Тяжёлые feature-страницы (chess.js, Stockfish, livekit) грузим лениво — меньше основной бандл, лучше Core Web Vitals
const AnalysisPage = lazy(() => import('@/features/Chess/pages/AnalysisPage').then((m) => ({ default: m.AnalysisPage })));
const PuzzlePage = lazy(() => import('./features/Chess/pages/PuzzlePage').then((m) => ({ default: m.PuzzlePage })));
const RatingClimbPage = lazy(() => import('./features/Chess/pages/ratingClimbPage').then((m) => ({ default: m.RatingClimbPage })));
const SurvivalModePage = lazy(() => import('./features/Chess/pages/SurvivalModePage').then((m) => ({ default: m.SurvivalModePage })));
const DatabasePage = lazy(() => import('./features/Chess/pages/BookPage').then((m) => ({ default: m.DatabasePage })));
const DigitizerPage = lazy(() => import('./features/Digitizer/pages/DigitizerPage').then((m) => ({ default: m.DigitizerPage })));
const BookEditorPage = lazy(() => import('./features/Digitizer/pages/BookEditorPage').then((m) => ({ default: m.BookEditorPage })));
const BookSolvePage = lazy(() => import('./features/Digitizer/pages/BookSolvePage').then((m) => ({ default: m.BookSolvePage })));
const PuzzleBooksPage = lazy(() => import('./features/Digitizer/pages/PuzzleBooksPage').then((m) => ({ default: m.PuzzleBooksPage })));
const PlayLobbyPage = lazy(() => import('./features/Play/pages/PlayLobbyPage').then((m) => ({ default: m.PlayLobbyPage })));
const PlayGamePage = lazy(() => import('./features/Play/pages/PlayGamePage').then((m) => ({ default: m.PlayGamePage })));
const ClassroomPage = lazy(() => import('./features/Classroom/pages/ClassroomPage'));
const MyClassesPage = lazy(() => import('./features/Classroom/pages/MyClassesPage').then((m) => ({ default: m.MyClassesPage })));
const BlindfoldTrainerPage = lazy(() => import('./features/Blindfold/pages/BlindfoldTrainerPage').then((m) => ({ default: m.BlindfoldTrainerPage })));
const OwnerDashboardPage = lazy(() => import('./features/console/OwnerDashboardPage'));
const ClubSettingsPage = lazy(() => import('./features/console/ClubSettingsPage'));
const ClubSitePage = lazy(() => import('./pages/club-site/club-site-page'));
import { GroupsPage } from './pages/groups-page/groups-page';
import { SEOHead } from '@/shared/components/seo/SEOHead';
import { SEO_ROUTES } from '@/shared/components/seo/routes';
import { SiteSettingsProvider } from '@/features/site/SiteSettingsContext';

function MainLayout() {
  const location = useLocation();
  const authPaths = ['/login', '/register'];
  const hideNavbar = authPaths.includes(location.pathname);
  // Публичные маркетинговые страницы — со своим навбаром/футером (MarketingShell), без app-сайдбара
  const marketingPaths = ['/', '/pricing', '/create-club'];
  const isMarketing = marketingPaths.includes(location.pathname);
  // Публичный сайт клуба /c/<slug> — свой брендированный каркас, без app-сайдбара
  const isClubSite = location.pathname.startsWith('/c/');

  const routes = (
    <Routes>
      <Route path="/" element={<><SEOHead {...SEO_ROUTES['/']} /><Home /></>} />
      <Route path="/pricing" element={<PricingPage />} />
      <Route path="/create-club" element={<CreateClubPage />} />
      <Route path="/c/:slug" element={<ClubSitePage />} />
      <Route path="/about" element={<><SEOHead {...SEO_ROUTES['/about']} /><About /></>} />
      <Route path="/achievements" element={<><SEOHead {...SEO_ROUTES['/achievements']} /><Achievements /></>} />
      <Route element={<GuestRoute />}>
        <Route path="/login" element={<AuthPage />} />
        <Route path="/register" element={<AuthPage />} />
      </Route>
      <Route path="/book" element={<><SEOHead {...SEO_ROUTES['/book']} /><DatabasePage /></>} />
      <Route path="/analysis" element={<><SEOHead {...SEO_ROUTES['/analysis']} /><AnalysisPage /></>} />
      <Route path="/rating" element={<><SEOHead {...SEO_ROUTES['/rating']} /><RatingClimbPage /></>} />
      <Route path="/survival" element={<><SEOHead {...SEO_ROUTES['/survival']} /><SurvivalModePage /></>} />
      <Route path="/blindfold" element={<BlindfoldTrainerPage />} />
      <Route path="/puzzles" element={<><SEOHead {...SEO_ROUTES['/puzzles']} /><PuzzlePage /></>} />
      <Route path="/verify-email" element={<><SEOHead title="Подтверждение e-mail" description="Подтверждение адреса электронной почты." noindex /><VerifyEmailPage /></>} />
      <Route path="/coaches" element={<><SEOHead {...SEO_ROUTES['/coaches']} /><CoachesPage /></>} />

      <Route element={<PrivateRoute />}>
        <Route path="/profile/:uuid" element={<TestProfileV2Page />} key={location.pathname} />
        <Route path="/students-shedule" element={<StudentSchedulePage />} />
        <Route path="/my-games" element={<MyGamesPage />} />
        <Route path="/inbox" element={<InboxPage />} />
        <Route path="/books" element={<PuzzleBooksPage />} />
        <Route path="/books/:bookId/solve" element={<BookSolvePage />} />
        <Route path="/play" element={<PlayLobbyPage />} />
        <Route path="/play/:gameId" element={<PlayGamePage />} />
        <Route path="/my-classes" element={<MyClassesPage />} />
        <Route path="/classroom/:eventId" element={<ClassroomPage />} />
        <Route path="/classroom/group/:groupId" element={<ClassroomPage />} />
      </Route>

      <Route element={<RoleRoute roles={['COACH', 'ADMIN']} />}>
        <Route path="/club" element={<OwnerDashboardPage />} />
        <Route path="/club/settings" element={<ClubSettingsPage />} />
        <Route path="/students" element={<StudentsPage />} />
        <Route path="/groups" element={<GroupsPage />} />
        <Route path="/digitizer" element={<DigitizerPage />} />
        <Route path="/digitizer/books/:bookId/edit" element={<BookEditorPage />} />
      </Route>

      <Route element={<RoleRoute roles={['ADMIN']} />}>
        <Route path="/coach-applications" element={<CoachApplicationsPage />} />
      </Route>
    </Routes>
  );

  // Вход и регистрация — на весь экран, без меню
  if (hideNavbar) return routes;
  // Маркетинговые страницы — свой каркас (навбар + футер debiut)
  if (isMarketing) return <MarketingShell>{routes}</MarketingShell>;
  // Публичный сайт клуба приносит собственный брендированный каркас
  if (isClubSite) return routes;
  return <AppShell>{routes}</AppShell>;
}

function App() {
  return (
    <Suspense fallback={<Box sx={{ minHeight: '100dvh', display: 'grid', placeItems: 'center' }}><CircularProgress /></Box>}>
      <SiteSettingsProvider>
        <MainLayout />
      </SiteSettingsProvider>
    </Suspense>
  );
}

export default App;
