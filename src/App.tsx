import { Routes, Route, useLocation } from 'react-router-dom';
import { Suspense } from 'react';
import { AuthPage } from '@/pages/auth-page';
import { Navbar } from '@/components/Navbar/Navbar';
import { Home } from '@/pages/home-page/home-page';
import { About } from '@/pages/about-page/about-page';
import { Achievements } from '@/pages/achievements-page/achievements-page';
import PrivateRoute from '@/components/PrivateRoute/PrivateRoute';
import { ProfilePage } from '@/pages/profile-page/profile-page';
import { UsersPage } from '@/pages/users-page/users-page';
import { StudentsPage } from '@/pages/students-page/students-page';
import { AnalysisPage } from '@/features/Chess/pages/AnalysisPage';
// import AnalysisPage from '@/pages/analisys-page/analisys-page';
// import ChallengesPage from '@/pages/challenges-page/challenges-page';
import PuzzleEditor from './components/PuzzleEditor/PuzzleEditor';
import { VerifyEmailPage } from './pages/verify-email-page/verify-email-page';
import { CoachesPage } from './pages/coaches-page/coaches-page';
import { InboxPage } from './pages/inbox-page/inbox-page';
// import { Footer } from './components/Footer/Footer';
import StudentSchedulePage from './pages/students-shedule-page/students-shedule-page';
import { CssBaseline } from '@mui/material';
import { ProfilePageById } from './pages/profile-page/profile-test';
import GuestRoute from './components/GuestRoute/GuestRoute';

function MainLayout() {
  const location = useLocation();
  const authPaths = ['/login', '/register'];
  const hideNavbar = authPaths.includes(location.pathname);

  return (
    <>
    <CssBaseline /> 
      {!hideNavbar && <Navbar />}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/achievements" element={<Achievements />} />
        <Route element={<GuestRoute />}>
          <Route path="/login" element={<AuthPage />} />
          <Route path="/register" element={<AuthPage />} />
        </Route>
        {/* <Route path="/chess" element={<ChessGame></ChessGame>} /> */}
        <Route path="/analysis" element={<AnalysisPage />} />
        {/* <Route path="/chess" element={<ChessProvider><GamePage /></ChessProvider>} /> */}
        {/* <Route path="/challenges" element={<ChallengesPage/>}/> */}
        <Route path="/verify-email" element={<VerifyEmailPage />} />
        <Route path="/coaches" element={<CoachesPage />} />

        <Route element={<PrivateRoute />}>
          <Route path="/editor" element={<PuzzleEditor />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route 
            path="/profile/:userId" 
            element={<ProfilePage />} 
            key={location.pathname}
          />          
          <Route 
            path="/profile-test/:userId" 
            element={<ProfilePageById />} 
            key={location.pathname} 
          />
          <Route path="/users" element={<UsersPage />} />
          <Route path="/students-shedule" element={<StudentSchedulePage />} />
          <Route path="/students" element={<StudentsPage />} />
          <Route path="/puzzle-editor" element={<PuzzleEditor />} />
          <Route path="/inbox" element={<InboxPage />} />
        </Route>
      </Routes>
      {/* {!hideNavbar && <Footer />} */}
    </>
  );
}

function App() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <MainLayout />
    </Suspense>
  );
}

export default App;
