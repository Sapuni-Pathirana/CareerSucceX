import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import ProfilePage from './pages/ProfilePage';
import AnalyzePage from './pages/AnalyzePage';
import MockInterviewsPage from './pages/MockInterviewsPage';
import InterviewSessionPage from './pages/InterviewSessionPage';
import SkillsPage from './pages/SkillsPage';
import LearningRoadmapPage from './pages/LearningRoadmapPage';
import VerificationQuizPage from './pages/VerificationQuizPage';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          <Route
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/analyze" element={<AnalyzePage />} />
            <Route path="/cv" element={<Navigate to="/analyze#cv-analysis" replace />} />
            <Route path="/github" element={<Navigate to="/analyze#github-analysis" replace />} />
            <Route path="/interviews" element={<MockInterviewsPage />} />
            <Route path="/interviews/:id" element={<InterviewSessionPage />} />
            <Route path="/skills" element={<SkillsPage />} />
            <Route path="/roadmap" element={<LearningRoadmapPage />} />
            <Route path="/verification" element={<Navigate to="/skills?tab=verification" replace />} />
            <Route path="/verification/:skillId" element={<VerificationQuizPage />} />
          </Route>

          <Route path="/" element={<LandingPage />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
