import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import { ThemeProvider } from "./components/theme-provider"
import Header from "./components/header"
import { AuthProvider } from "./contexts/auth-context"

// Import pages
import Home from "./pages/home"
import Login from "./pages/login"
import Register from "./pages/register"
import Jobs from "./pages/jobs"
import JobDetails from "./pages/job-details-view"
import Dashboard from "./pages/dashboard"
import Profile from "./pages/profile"
import Settings from "./pages/settings"
import Notifications from "./pages/notifications"
import CVBuilder from "./pages/cv-builder"
import Recommendations from "./pages/recommendations"
import Admin from "./pages/admin"
import PostJob from "./pages/post-job"
import Apply from "./pages/apply"

function App() {
  return (
    <Router>
      <AuthProvider>
        <ThemeProvider defaultTheme="light">
          <div className="flex min-h-screen flex-col">
            <Header />
            <main className="flex-1">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/jobs" element={<Jobs />} />
                <Route path="/jobs/:id" element={<JobDetails />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/notifications" element={<Notifications />} />
                <Route path="/cv-builder" element={<CVBuilder />} />
                <Route path="/recommendations" element={<Recommendations />} />
                <Route path="/admin" element={<Admin />} />
                <Route path="/post-job" element={<PostJob />} />
                <Route path="/apply/:id" element={<Apply />} />
              </Routes>
            </main>
          </div>
        </ThemeProvider>
      </AuthProvider>
    </Router>
  )
}

export default App

