

import { useState } from "react"
import { Link, useLocation } from "react-router-dom"
import { Search, Menu, X, Bell, User, Briefcase, FileText, Settings, LogOut } from "lucide-react"
import { useAuth } from "../contexts/auth-context"

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const location = useLocation()
  const { isAuthenticated, logout, userRole } = useAuth()

  const isActive = (path) => {
    return location.pathname === path
  }

  return (
    <header className="border-b bg-white sticky top-0 z-50">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center">
          <Link to="/" className="flex items-center gap-2 text-purple-700">
            <Search className="h-5 w-5" />
            <span className="text-lg font-bold text-purple-700 tracking-wide">Job Match</span>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-4">
          {/* Home is always visible */}
          <Link
            to="/"
            className={`text-sm font-medium ${isActive("/") ? "text-purple-900" : "text-gray-600 hover:text-purple-900"}`}
          >
            Home
          </Link>

          {/* Only show Find Jobs to non-admin users */}
          {(!isAuthenticated || (isAuthenticated && userRole !== "admin")) && (
            <Link
              to="/jobs"
              className={`text-sm font-medium ${isActive("/jobs") ? "text-purple-900" : "text-gray-600 hover:text-purple-900"}`}
            >
              Find Jobs
            </Link>
          )}

          {/* Only show these links to authenticated regular users */}
          {isAuthenticated && userRole !== "admin" && (
            <>
              <Link
                to="/recommendations"
                className={`text-sm font-medium ${isActive("/recommendations") ? "text-purple-900" : "text-gray-600 hover:text-purple-900"}`}
              >
                Recommendations
              </Link>
              <Link
                to="/cv-builder"
                className={`text-sm font-medium ${isActive("/cv-builder") ? "text-purple-900" : "text-gray-600 hover:text-purple-900"}`}
              >
                CV Builder
              </Link>
              <Link
                to="/profile"
                className={`text-sm font-medium ${isActive("/profile") ? "text-purple-900" : "text-gray-600 hover:text-purple-900"}`}
              >
                Profile
              </Link>
              <Link
                to="/dashboard"
                className={`text-sm font-medium ${isActive("/dashboard") ? "text-purple-900" : "text-gray-600 hover:text-purple-900"}`}
              >
                Dashboard
              </Link>
              <Link
                to="/post-job"
                className={`text-sm font-medium ${isActive("/post-job") ? "text-purple-900" : "text-gray-600 hover:text-purple-900"}`}
              >
                Post Job
              </Link>
              <Link
                to="/settings"
                className={`text-sm font-medium ${isActive("/settings") ? "text-purple-900" : "text-gray-600 hover:text-purple-900"}`}
              >
                Settings
              </Link>
            </>
          )}

          {/* Only show Admin link to admin users */}
          {isAuthenticated && userRole === "admin" && (
            <Link
              to="/admin"
              className={`text-sm font-medium ${isActive("/admin") ? "text-purple-900" : "text-gray-600 hover:text-purple-900"}`}
            >
              Admin
            </Link>
          )}

          {/* Login button for unauthenticated users */}
          {!isAuthenticated && (
            <Link to="/login">
              <button className="bg-purple-700 hover:bg-purple-800 text-white px-4 py-2 rounded-md">Login</button>
            </Link>
          )}
        </nav>

        <div className="flex items-center gap-3">
          {/* Notifications - only for authenticated users */}
          {isAuthenticated && (
            <Link to="/notifications" className="relative p-1 text-gray-600 hover:text-purple-700">
              <Bell className="h-5 w-5" />
              <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-red-500"></span>
            </Link>
          )}

          {/* User Menu (Desktop) */}
          {isAuthenticated ? (
            <div className="relative group">
              <button className="relative h-8 w-8 rounded-full">
                <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-700">
                  <User className="h-4 w-4" />
                </div>
              </button>
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10 hidden group-hover:block">
                <div className="px-4 py-2 text-sm text-gray-700 border-b">
                  My Account
                  {userRole === "admin" && (
                    <span className="ml-2 px-2 py-0.5 text-xs bg-purple-100 text-purple-800 rounded-full">Admin</span>
                  )}
                </div>

                {/* Admin-specific menu items */}
                {userRole === "admin" ? (
                  <Link to="/admin" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                    <Settings className="inline-block mr-2 h-4 w-4" />
                    Admin Dashboard
                  </Link>
                ) : (
                  /* Regular user menu items */
                  <>
                    <Link to="/profile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                      <User className="inline-block mr-2 h-4 w-4" />
                      Profile
                    </Link>
                    <Link to="/dashboard" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                      <Briefcase className="inline-block mr-2 h-4 w-4" />
                      Dashboard
                    </Link>
                    <Link to="/cv-builder" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                      <FileText className="inline-block mr-2 h-4 w-4" />
                      CV Builder
                    </Link>
                    <Link to="/settings" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                      <Settings className="inline-block mr-2 h-4 w-4" />
                      Settings
                    </Link>
                  </>
                )}

                <button
                  onClick={logout}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  <LogOut className="inline-block mr-2 h-4 w-4" />
                  Log out
                </button>
              </div>
            </div>
          ) : (
            <Link to="/login">
              <button className="bg-purple-700 hover:bg-purple-800 text-white px-4 py-2 rounded-md">Login</button>
            </Link>
          )}

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-1 text-gray-600 hover:text-purple-700"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-t">
          <div className="container mx-auto px-4 py-3">
            <nav className="flex flex-col space-y-3">
              {/* Home is always visible */}
              <Link
                to="/"
                className={`text-sm font-medium ${isActive("/") ? "text-purple-900" : "text-gray-600"}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                Home
              </Link>

              {/* Only show Find Jobs to non-admin users */}
              {(!isAuthenticated || (isAuthenticated && userRole !== "admin")) && (
                <Link
                  to="/jobs"
                  className={`text-sm font-medium ${isActive("/jobs") ? "text-purple-900" : "text-gray-600"}`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Find Jobs
                </Link>
              )}

              {/* Only show these links to authenticated regular users */}
              {isAuthenticated && userRole !== "admin" && (
                <>
                  <Link
                    to="/recommendations"
                    className={`text-sm font-medium ${isActive("/recommendations") ? "text-purple-900" : "text-gray-600"}`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Recommendations
                  </Link>
                  <Link
                    to="/cv-builder"
                    className={`text-sm font-medium ${isActive("/cv-builder") ? "text-purple-900" : "text-gray-600"}`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    CV Builder
                  </Link>
                  <Link
                    to="/profile"
                    className={`text-sm font-medium ${isActive("/profile") ? "text-purple-900" : "text-gray-600"}`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Profile
                  </Link>
                  <Link
                    to="/dashboard"
                    className={`text-sm font-medium ${isActive("/dashboard") ? "text-purple-900" : "text-gray-600"}`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Dashboard
                  </Link>
                  <Link
                    to="/post-job"
                    className={`text-sm font-medium ${isActive("/post-job") ? "text-purple-900" : "text-gray-600"}`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Post Job
                  </Link>
                  <Link
                    to="/settings"
                    className="flex items-center text-sm font-medium text-gray-600"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Settings
                  </Link>
                </>
              )}

              {/* Only show Admin link to admin users */}
              {isAuthenticated && userRole === "admin" && (
                <Link
                  to="/admin"
                  className={`text-sm font-medium ${isActive("/admin") ? "text-purple-900" : "text-gray-600"}`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Admin
                </Link>
              )}

              {/* Logout button for authenticated users */}
              {isAuthenticated && (
                <div className="pt-2 border-t">
                  <button
                    className="flex items-center text-sm font-medium text-gray-600"
                    onClick={() => {
                      logout()
                      setMobileMenuOpen(false)
                    }}
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Log out
                  </button>
                </div>
              )}
            </nav>
          </div>
        </div>
      )}
    </header>
  )
}

