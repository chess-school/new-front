import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { Suspense } from 'react';
import { AuthPage } from '@/pages/auth-page';
import { RegisterPage } from '@/pages/register-page';
import { Navbar } from '@/components/Navbar/Navbar';
import { Home } from '@/pages/home-page/home-page';
import { About } from '@/pages/about-page/about-page';
import { Achievements } from '@/pages/achievements-page/achievements-page';
import PrivateRoute from '@/components/PrivateRoute/PrivateRoute';
import { ProfilePage } from '@/pages/profile-page/profile-page';
import { UsersPage } from '@/pages/users-page/users-page';
import { StudentsPage } from '@/pages/students-page/students-page';
import { GamePage } from '@/pages/chessgame-page/chessgame-page';
import { ChessProvider } from '@/context/ChessContext';
import AnalysisPage from '@/pages/analisys-page/analisys-page';
import ChallengesPage from '@/pages/challenges-page/challenges-page';
import PuzzleEditor from './components/PuzzleEditor/PuzzleEditor';

function MainLayout() {
  const location = useLocation();
  const hideNavbar = location.pathname === '/login' || location.pathname === '/register';

  return (
    <>
      {!hideNavbar && <Navbar />}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/achievements" element={<Achievements />} />
        <Route path="/login" element={<AuthPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/analysis" element={<ChessProvider><AnalysisPage /></ChessProvider>} />
        <Route path="/chess" element={<ChessProvider><GamePage /></ChessProvider>} />
        <Route path="/challenges" element={<ChallengesPage />} />

        <Route element={<PrivateRoute />}>
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/users" element={<UsersPage />} />
          <Route path="/students" element={<StudentsPage />} />
          <Route path="/puzzle-editor" element={<PuzzleEditor />} />
        </Route>
      </Routes>
    </>
  );
}

function App() {
  return (
    <Router>
      <Suspense fallback={<div>Загрузка...</div>}>
        <MainLayout />
      </Suspense>
    </Router>
  );
}

export default App;
