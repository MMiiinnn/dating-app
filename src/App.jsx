import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { UserProvider, useUser } from './context/UserContext';
import RegisterPage from './pages/RegisterPage';
import DiscoverPage from './pages/DiscoverPage';
import MatchesPage from './pages/MatchesPage';
import SchedulePage from './pages/SchedulePage';

function ProtectedRoute({ children }) {
  const { currentUser, loading } = useUser();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-rose-50 to-pink-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-rose-300 border-t-rose-500 rounded-full animate-spin" />
          <p className="text-gray-400 text-sm">Loading Breeze...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/register" replace />;
  }

  return children;
}

function AppRoutes() {
  const { currentUser, loading } = useUser();

  if (loading) return null;

  return (
    <Routes>
      <Route
        path="/register"
        element={currentUser ? <Navigate to="/discover" replace /> : <RegisterPage />}
      />
      <Route
        path="/discover"
        element={
          <ProtectedRoute>
            <DiscoverPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/matches"
        element={
          <ProtectedRoute>
            <MatchesPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/schedule/:matchId"
        element={
          <ProtectedRoute>
            <SchedulePage />
          </ProtectedRoute>
        }
      />
      {/* Default: redirect to register or discover */}
      <Route
        path="*"
        element={<Navigate to={currentUser ? '/discover' : '/register'} replace />}
      />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <UserProvider>
        <AppRoutes />
      </UserProvider>
    </BrowserRouter>
  );
}
