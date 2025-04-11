import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "./components/theme-provider";
import Header from "./components/header";
import { AuthProvider, useAuth } from "./contexts/auth-context";

// Import pages
import Home from "./pages/home";
import Login from "./pages/login";
import Register from "./pages/register";
import Jobs from "./pages/jobs";
import JobDetails from "./pages/job-details-view";
import Dashboard from "./pages/dashboard";
import Profile from "./pages/profile";
import Settings from "./pages/settings";
import Notifications from "./pages/notifications";
import CVBuilder from "./pages/cv-builder";
import Recommendations from "./pages/recommendations";
import Admin from "./pages/admin";
import PostJob from "./pages/post-job";
import Apply from "./pages/apply";

// Protected Route Component
const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (adminOnly && user.role !== "admin") {
    return <Navigate to="/" replace />;
  }

  return children;
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
          <div className="flex min-h-screen flex-col">
            <Header />
            <main className="flex-1">
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/jobs" element={<Jobs />} />
                <Route path="/jobs/:id" element={<JobDetails />} />

                {/* Authenticated Routes */}
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <Dashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/profile"
                  element={
                    <ProtectedRoute>
                      <Profile />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/settings"
                  element={
                    <ProtectedRoute>
                      <Settings />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/notifications"
                  element={
                    <ProtectedRoute>
                      <Notifications />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/cv-builder"
                  element={
                    <ProtectedRoute>
                      <CVBuilder />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/recommendations"
                  element={
                    <ProtectedRoute>
                      <Recommendations />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/post-job"
                  element={
                    <ProtectedRoute>
                      <PostJob />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/apply/:id"
                  element={
                    <ProtectedRoute>
                      <Apply />
                    </ProtectedRoute>
                  }
                />

                {/* Admin-only Route */}
                <Route
                  path="/admin"
                  element={
                    <ProtectedRoute adminOnly>
                      <Admin />
                    </ProtectedRoute>
                  }
                />

                {/* 404 Not Found */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>
          </div>
        </ThemeProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;