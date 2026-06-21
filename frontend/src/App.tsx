import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import ProfilePage from './pages/ProfilePage';
import CvAnalysisPage from './pages/CvAnalysisPage';
import GitHubAnalysisPage from './pages/GitHubAnalysisPage';
import MockInterviewsPage from './pages/MockInterviewsPage';
import InterviewSessionPage from './pages/InterviewSessionPage';
import SkillsPage from './pages/SkillsPage';
import LearningRoadmapPage from './pages/LearningRoadmapPage';
import SkillVerificationPage from './pages/SkillVerificationPage';
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
            <Route path="/cv" element={<CvAnalysisPage />} />
            <Route path="/github" element={<GitHubAnalysisPage />} />
            <Route path="/interviews" element={<MockInterviewsPage />} />
            <Route path="/interviews/:id" element={<InterviewSessionPage />} />
            <Route path="/skills" element={<SkillsPage />} />
            <Route path="/roadmap" element={<LearningRoadmapPage />} />
            <Route path="/verification" element={<SkillVerificationPage />} />
            <Route path="/verification/:skillId" element={<VerificationQuizPage />} />
          </Route>

          <Route path="/" element={<LandingPage />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
