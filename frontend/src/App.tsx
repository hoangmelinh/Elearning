import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import LandingPage from './pages/LandingPage';
import DashboardPage from './pages/DashboardPage';
import SpeakingHistoryPage from './pages/speaking/SpeakingHistoryPage';
import SpeakingRecorderPage from './pages/speaking/SpeakingRecorderPage';
import SpeakingAnalysisPage from './pages/speaking/SpeakingAnalysisPage';
import ReadingListPage from './pages/reading/ReadingListPage';
import ReadingExercisePage from './pages/reading/ReadingExercisePage';
import ListeningListPage from './pages/listening/ListeningListPage';
import ListeningExercisePage from './pages/listening/ListeningExercisePage';
import WritingListPage from './pages/writing/WritingListPage';
import WritingPromptPage from './pages/writing/WritingPromptPage';
import WritingFeedbackPage from './pages/writing/WritingFeedbackPage';
import DeckListPage from './pages/vocabulary/DeckListPage';
import DeckDetailPage from './pages/vocabulary/DeckDetailPage';
import DocumentImportPage from './pages/vocabulary/DocumentImportPage';
import FlashcardReviewPage from './pages/vocabulary/FlashcardReviewPage';
import MatchingExercisePage from './pages/vocabulary/MatchingExercisePage';
import SpellingPracticePage from './pages/vocabulary/SpellingPracticePage';
import AdminLayout from './components/AdminLayout';
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import AdminUsersPage from './pages/admin/AdminUsersPage';
import AdminContentPage from './pages/admin/AdminContentPage';
import AdminExercisePage from './pages/admin/AdminExercisePage';
import AdminWritingPage from './pages/admin/AdminWritingPage';
import AdminSettingsPage from './pages/admin/AdminSettingsPage';
import Layout from './components/Layout';
import { useAuth } from './hooks/useAuth';
import ForbiddenPage from './pages/errors/ForbiddenPage';
import NotFoundPage from './pages/errors/NotFoundPage';
import ServerErrorPage from './pages/errors/ServerErrorPage';
import ErrorBoundary from './components/ErrorBoundary';
import { Toaster } from 'react-hot-toast';

const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
  return isAuthenticated ? <Layout>{children}</Layout> : <Navigate to="/login" />;
};

const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, userRole, isLoading } = useAuth();
  if (isLoading) return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
  if (!isAuthenticated) return <Navigate to="/login" />;
  if (userRole !== 'admin') return <Navigate to="/403" replace />;
  return <AdminLayout>{children}</AdminLayout>;
};

function App() {
  return (
    <ErrorBoundary>
      <Toaster 
        position="top-right"
        toastOptions={{
          style: {
            background: '#111',
            color: '#fff',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '16px',
            padding: '16px',
          },
          success: {
            iconTheme: {
              primary: '#4ade80',
              secondary: '#111',
            },
          },
          error: {
            iconTheme: {
              primary: '#f87171',
              secondary: '#111',
            },
          },
        }}
      />
      <Router>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Admin routes */}
          <Route path="/admin/dashboard" element={<AdminRoute><AdminDashboardPage /></AdminRoute>} />
          <Route path="/admin/users" element={<AdminRoute><AdminUsersPage /></AdminRoute>} />
          <Route path="/admin/content" element={<AdminRoute><AdminContentPage /></AdminRoute>} />
          <Route path="/admin/exercises" element={<AdminRoute><AdminExercisePage /></AdminRoute>} />
          <Route path="/admin/writing" element={<AdminRoute><AdminWritingPage /></AdminRoute>} />
          <Route path="/admin/settings" element={<AdminRoute><AdminSettingsPage /></AdminRoute>} />

          {/* Private routes — all wrapped in Layout */}
          <Route path="/dashboard" element={<PrivateRoute><DashboardPage /></PrivateRoute>} />

          <Route path="/speaking" element={<PrivateRoute><SpeakingHistoryPage /></PrivateRoute>} />
          <Route path="/speaking/record" element={<PrivateRoute><SpeakingRecorderPage /></PrivateRoute>} />
          <Route path="/speaking/analysis/:id" element={<PrivateRoute><SpeakingAnalysisPage /></PrivateRoute>} />

          <Route path="/reading" element={<PrivateRoute><ReadingListPage /></PrivateRoute>} />
          <Route path="/reading/:id" element={<PrivateRoute><ReadingExercisePage /></PrivateRoute>} />

          <Route path="/listening" element={<PrivateRoute><ListeningListPage /></PrivateRoute>} />
          <Route path="/listening/:id" element={<PrivateRoute><ListeningExercisePage /></PrivateRoute>} />

          <Route path="/writing" element={<PrivateRoute><WritingListPage /></PrivateRoute>} />
          <Route path="/writing/:id" element={<PrivateRoute><WritingPromptPage /></PrivateRoute>} />
          <Route path="/writing/feedback/:id" element={<PrivateRoute><WritingFeedbackPage /></PrivateRoute>} />

          <Route path="/vocabulary" element={<PrivateRoute><DeckListPage /></PrivateRoute>} />
          <Route path="/vocabulary/import" element={<PrivateRoute><DocumentImportPage /></PrivateRoute>} />
          <Route path="/vocabulary/decks/:deckId" element={<PrivateRoute><DeckDetailPage /></PrivateRoute>} />
          <Route path="/vocabulary/decks/:deckId/review" element={<PrivateRoute><FlashcardReviewPage /></PrivateRoute>} />
          <Route path="/vocabulary/decks/:deckId/match" element={<PrivateRoute><MatchingExercisePage /></PrivateRoute>} />
          <Route path="/vocabulary/decks/:deckId/spelling" element={<PrivateRoute><SpellingPracticePage /></PrivateRoute>} />

          {/* Error routes */}
          <Route path="/403" element={<ForbiddenPage />} />
          <Route path="/500" element={<ServerErrorPage />} />

          {/* 404 Catch-all Route */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
