import { Routes, Route, useLocation } from 'react-router-dom';
import { Suspense } from 'react';
import { AuthPage } from '@/pages/auth-page';
import { AppShell } from '@/components/AppShell/AppShell';
import { Home } from '@/pages/home-page/home-page';
import { About } from '@/pages/about-page/about-page';
import { Achievements } from '@/pages/achievements-page/achievements-page';
import PrivateRoute from '@/components/PrivateRoute/PrivateRoute';
import RoleRoute from '@/components/RoleRoute/RoleRoute';
import { StudentsPage } from '@/pages/students-page/students-page';
import { AnalysisPage } from '@/features/Chess/pages/AnalysisPage';
import { VerifyEmailPage } from './pages/verify-email-page/verify-email-page';
import { CoachesPage } from './pages/coaches-page/coaches-page';
import { InboxPage } from './pages/inbox-page/inbox-page';
import StudentSchedulePage from './pages/students-shedule-page/students-shedule-page';
import { Box, CircularProgress } from '@mui/material';
import GuestRoute from './components/GuestRoute/GuestRoute';
import { TestProfileV2Page } from '@/pages/profile-page/profile-v2-page';
import { PuzzlePage } from './features/Chess/pages/PuzzlePage';
import { RatingClimbPage } from './features/Chess/pages/ratingClimbPage';
import { SurvivalModePage } from './features/Chess/pages/SurvivalModePage';
import { DatabasePage } from './features/Chess/pages/BookPage';
import { DigitizerPage } from './features/Digitizer/pages/DigitizerPage';
import { BookEditorPage } from './features/Digitizer/pages/BookEditorPage';
import { BookSolvePage } from './features/Digitizer/pages/BookSolvePage';
import { PuzzleBooksPage } from './features/Digitizer/pages/PuzzleBooksPage';
import { PlayLobbyPage } from './features/Play/pages/PlayLobbyPage';
import { PlayGamePage } from './features/Play/pages/PlayGamePage';

function MainLayout() {
  const location = useLocation();
  const authPaths = ['/login', '/register'];
  const hideNavbar = authPaths.includes(location.pathname);

  const routes = (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/about" element={<About />} />
      <Route path="/achievements" element={<Achievements />} />
      <Route element={<GuestRoute />}>
        <Route path="/login" element={<AuthPage />} />
        <Route path="/register" element={<AuthPage />} />
      </Route>
      <Route path="/book" element={<DatabasePage />} />
      <Route path="/analysis" element={<AnalysisPage />} />
      <Route path="/rating" element={<RatingClimbPage />} />
      <Route path="/survival" element={<SurvivalModePage />} />
      <Route path="/puzzles" element={<PuzzlePage />} />
      <Route path="/verify-email" element={<VerifyEmailPage />} />
      <Route path="/coaches" element={<CoachesPage />} />

      <Route element={<PrivateRoute />}>
        <Route path="/profile/:uuid" element={<TestProfileV2Page />} key={location.pathname} />
        <Route path="/students-shedule" element={<StudentSchedulePage />} />
        <Route path="/inbox" element={<InboxPage />} />
        <Route path="/books" element={<PuzzleBooksPage />} />
        <Route path="/books/:bookId/solve" element={<BookSolvePage />} />
        <Route path="/play" element={<PlayLobbyPage />} />
        <Route path="/play/:gameId" element={<PlayGamePage />} />
      </Route>

      <Route element={<RoleRoute roles={['COACH', 'ADMIN']} />}>
        <Route path="/students" element={<StudentsPage />} />
        <Route path="/digitizer" element={<DigitizerPage />} />
        <Route path="/digitizer/books/:bookId/edit" element={<BookEditorPage />} />
      </Route>
    </Routes>
  );

  // Вход и регистрация — на весь экран, без меню
  return hideNavbar ? routes : <AppShell>{routes}</AppShell>;
}

function App() {
  return (
    <Suspense fallback={<Box sx={{ minHeight: '100dvh', display: 'grid', placeItems: 'center' }}><CircularProgress /></Box>}>
      <MainLayout />
    </Suspense>
  );
}

export default App;
