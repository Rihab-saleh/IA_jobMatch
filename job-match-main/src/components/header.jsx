"use client"

import { useState } from "react"
import { Link, useLocation } from "react-router-dom"
import { Search, Menu, X, Bell, User, Settings, LogOut } from "lucide-react"
import { useAuth } from "../contexts/auth-context"

const AdminHeader = ({ logout }) => {
  return (
    <header className="border-b bg-white sticky top-0 z-50">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/admin" className="flex items-center gap-2 text-purple-700">
          <Search className="h-5 w-5" />
          <span className="text-lg font-bold text-purple-700 tracking-wide">Admin Dashboard</span>
        </Link>

        <div className="flex items-center gap-3">
          <div className="relative group">
            <button className="relative h-8 w-8 rounded-full">
              <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-700">
                <User className="h-4 w-4" />
              </div>
            </button>
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10 hidden group-hover:block">
              <div className="px-4 py-2 text-sm text-gray-700 border-b">
                Admin Account
                <span className="ml-2 px-2 py-0.5 text-xs bg-purple-100 text-purple-800 rounded-full">Admin</span>
              </div>
              <Link
                to="/admin/settings"
                className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                <Settings className="mr-2 h-4 w-4" />
                Admin Settings
              </Link>
              <button
                onClick={logout}
                className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}

const UserHeader = ({ mobileMenuOpen, setMobileMenuOpen, isAuthenticated, logout, userRole, user }) => {
  const location = useLocation()
  const isActive = (path) => location.pathname === path

  // Main navigation links
  const userLinks = [
    { path: "/", label: "Home" },
    { path: "/jobs", label: "Find Jobs" },
    { path: "/dashboard", label: "Dashboard" },
    { path: "/recommendations", label: "Recommendations" },
    { path: "/cv-builder", label: "CV Builder" },
    { path: "/post-job", label: "Post Job" },
  ]

  // User account links
  const accountLinks = [
    { path: "/profile", label: "Profile", icon: User },
    { path: "/settings", label: "Settings", icon: Settings },
  ]

  return (
    <header className="border-b bg-white sticky top-0 z-50">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2 text-purple-700">
          <Search className="h-5 w-5" />
          <span className="text-lg font-bold text-purple-700 tracking-wide">Job Match</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-4">
          {userLinks.map(({ path, label }) => (
            <Link
              key={path}
              to={path}
              className={`text-sm font-medium ${
                isActive(path) ? "text-purple-900" : "text-gray-600 hover:text-purple-900"
              }`}
            >
              {label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <>
              <Link to="/notifications" className="relative p-1 text-gray-600 hover:text-purple-700">
                <Bell className="h-5 w-5" />
                <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-red-500"></span>
              </Link>

              <div className="relative group">
                <div className="flex items-center">
                  <button className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-700">
                    <User className="h-4 w-4" />
                  </button>
                  {user && user.person && (
                    <span className="ml-2 hidden md:block text-sm font-medium">
                      {user.person.firstName} {user.person.lastName}
                    </span>
                  )}
                </div>
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10 hidden group-hover:block">
                  <div className="px-4 py-2 text-sm text-gray-700 border-b">
                    My Account
                    {userRole === "admin" && (
                      <span className="ml-2 px-2 py-0.5 text-xs bg-purple-100 text-purple-800 rounded-full">Admin</span>
                    )}
                  </div>

                  {accountLinks.map(({ path, label, icon: Icon }) => (
                    <Link
                      key={path}
                      to={path}
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <Icon className="mr-2 h-4 w-4" />
                      {label}
                    </Link>
                  ))}

                  <button
                    onClick={logout}
                    className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                  </button>
                </div>
              </div>
            </>
          ) : (
            <Link
              to="/login"
              className="bg-purple-700 hover:bg-purple-800 text-white px-4 py-2 rounded-md transition-colors"
            >
              Login
            </Link>
          )}

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-1 text-gray-600 hover:text-purple-700"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
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
              {userLinks.map(({ path, label }) => (
                <Link
                  key={path}
                  to={path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`text-sm font-medium ${isActive(path) ? "text-purple-900" : "text-gray-600"}`}
                >
                  {label}
                </Link>
              ))}

              {isAuthenticated && (
                <>
                  {accountLinks.map(({ path, label }) => (
                    <Link
                      key={path}
                      to={path}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`text-sm font-medium ${isActive(path) ? "text-purple-900" : "text-gray-600"}`}
                    >
                      {label}
                    </Link>
                  ))}
                  <div className="pt-2 border-t">
                    <button
                      onClick={() => {
                        logout()
                        setMobileMenuOpen(false)
                      }}
                      className="flex w-full items-center text-sm font-medium text-gray-600"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Logout
                    </button>
                  </div>
                </>
              )}
            </nav>
          </div>
        </div>
      )}
    </header>
  )
}

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { isAuthenticated, logout, user } = useAuth()
  const location = useLocation()

  // Get user role directly from user object
  const userRole = user?.role || null

  // For debugging - remove in production
  console.log("Auth state:", { isAuthenticated, user, userRole, path: location.pathname })

  // Render different header based on path
  if (location.pathname.startsWith("/admin")) {
    return <AdminHeader logout={logout} />
  }

  return (
    <UserHeader
      mobileMenuOpen={mobileMenuOpen}
      setMobileMenuOpen={setMobileMenuOpen}
      isAuthenticated={isAuthenticated}
      logout={logout}
      userRole={userRole}
      user={user}
    />
  )
}

