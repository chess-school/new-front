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
import { VerifyEmailPage } from './pages/verify-email-page/verify-email-page';
import { CoachesPage } from './pages/coaches-page/coaches-page';
import { RequestsPage } from './pages/requests-page/requests-page';
// import { Footer } from './components/Footer/Footer';
import ChessGame from './components/ChessGame/ChessGame';
import StudentSchedulePage from './pages/students-shedule-page/students-shedule-page';

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
        <Route path="/chess" element={<ChessGame></ChessGame>} />
        <Route path="/analysis" element={<ChessProvider><AnalysisPage /></ChessProvider>} />
        <Route path="/chess" element={<ChessProvider><GamePage /></ChessProvider>} />
        <Route path="/challenges" element={<ChallengesPage/>}/>
        <Route path="/verify-email" element={<VerifyEmailPage />} />
        <Route path="/coaches" element={<CoachesPage />} />

        <Route element={<PrivateRoute />}>
          <Route path="/editor" element={<PuzzleEditor />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/users" element={<UsersPage />} />
          <Route path="/students-shedule" element={<StudentSchedulePage />} />
          <Route path="/students" element={<StudentsPage />} />
          <Route path="/puzzle-editor" element={<PuzzleEditor />} />
          <Route path="/inbox" element={<RequestsPage />} />
        </Route>
      </Routes>
      {/* {!hideNavbar && <Footer />} */}
    </>
  );
}

function App() {
  return (
    <Router>
      <Suspense fallback={<div>Loading...</div>}>
        <MainLayout />
      </Suspense>
    </Router>
  );
}

export default App;
