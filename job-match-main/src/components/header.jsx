"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { Menu, X, Bell, User, Settings, LogOut, ChevronDown, Briefcase, Home, FileText, Sparkles } from 'lucide-react'
import { useAuth } from "../contexts/auth-context"
import { cn } from "./lib/utils"

const Logo = () => (
  <Link
    to="/"
    className="flex items-center gap-3 text-blue-600 transition-all duration-300 hover:scale-105"
    aria-label="Job Match Home"
  >
    <div className="relative">
      <div className="absolute -inset-1 rounded-full bg-blue-500/30 blur-md"></div>
      <div className="relative h-12 w-12 rounded-xl bg-blue-100 flex items-center justify-center">
        <Briefcase className="h-7 w-7 text-blue-600" />
      </div>
    </div>
    <span className="text-2xl font-bold tracking-tight">
      Job<span className="text-blue-600">Match</span>
    </span>
  </Link>
)

const NavLink = ({ to, label, icon: Icon, isActive, onClick }) => (
  <Link
    to={to}
    onClick={onClick}
    className={cn(
      "group flex items-center gap-2.5 px-4 py-3 text-base font-medium transition-all duration-200 border-b-2",
      isActive
        ? "text-blue-600 border-blue-600"
        : "text-muted-foreground hover:text-blue-600 border-transparent hover:border-blue-300"
    )}
  >
    {Icon && <Icon className={cn("h-5 w-5 transition-transform group-hover:scale-110", isActive ? "text-blue-600" : "text-muted-foreground group-hover:text-blue-600")} />}
    <span>{label}</span>
    {isActive && <div className="h-1.5 w-1.5 rounded-full "></div>}
  </Link>
)

const UserBadge = ({ role }) => {
  if (role === "admin") {
    return (
      <span className="ml-2 px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded-full font-medium shadow-sm">Admin</span>
    )
  }
  if (role === "user") {
    return (
      <span className="ml-2 px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded-full font-medium shadow-sm">User</span>
    )
  }
  return null
}

const NotificationBadge = ({ count = 0 }) => (
  <Link
    to="/notifications"
    className="relative p-3 text-muted-foreground hover:text-blue-600 transition-all duration-200 hover:scale-110"
    aria-label={`${count} unread notifications`}
  >
    <Bell className="h-6 w-6" />
    {count > 0 && (
      <span className="absolute top-2 right-2 h-3 w-3 rounded-full bg-blue-600 ring-2 ring-white animate-pulse"></span>
    )}
  </Link>
)

const UserDropdown = ({ isOpen, setIsOpen, fullName, userRole, accountLinks, logout }) => {
  const dropdownRef = useRef(null)
  const [isHovered, setIsHovered] = useState(false)
  const { isAuthenticated } = useAuth()

  const getInitials = (name) => {
    if (!name) return "U"
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .substring(0, 2)
  }

  const initials = getInitials(fullName)

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [setIsOpen])

  const handleLinkClick = useCallback((e) => {
    if (!isAuthenticated) {
      e.preventDefault()
      // Optionally redirect to login with return url
    }
    setIsOpen(false)
  }, [isAuthenticated, setIsOpen])

  return (
    <div className="relative user-dropdown" ref={dropdownRef}>
      <button
        className={cn(
          "flex items-center gap-3 transition-all duration-300",
          isOpen ? "scale-105" : isHovered ? "scale-105" : ""
        )}
        onClick={() => setIsOpen(!isOpen)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <div className="relative group">
          <div
            className={cn(
              "absolute inset-0 rounded-full blur-md transition-all duration-300",
              isHovered || isOpen ? "bg-blue-400/30 scale-110" : "bg-blue-300/20",
            )}
          ></div>

          <div
            className={cn(
              "relative h-11 w-11 rounded-full flex items-center justify-center text-white font-semibold text-lg overflow-hidden",
              "bg-gradient-to-br from-blue-500 to-blue-700 transition-transform duration-300",
              (isHovered || isOpen) && "scale-105",
            )}
          >
            {initials}
          </div>

          <div className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full bg-green-500 border-2 border-white"></div>
        </div>

        {fullName && (
          <div className="flex flex-col items-start">
            <span className="text-base font-medium max-w-[150px] truncate">{fullName}</span>
            <span className="text-xs text-muted-foreground">{userRole === "admin" ? "Administrator" : "Online"}</span>
          </div>
        )}

        <ChevronDown
          className={cn("h-5 w-5 text-blue-500 transition-transform duration-300", isOpen && "rotate-180")}
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-3 w-72 bg-card rounded-xl shadow-xl py-1 z-10 border border-blue-100 animate-in fade-in-50 slide-in-from-top-5 duration-200 bg-white">
          <div className="px-5 py-4 border-b border-blue-50">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white font-semibold text-lg">
                {initials}
              </div>
              <div>
                <p className="font-semibold text-foreground text-base">{fullName || "My Account"}</p>
                <p className="text-muted-foreground text-xs mt-0.5 flex items-center">
                  {userRole === "admin" ? "Administrator" : "Job Seeker"}
                  <UserBadge role={userRole} />
                </p>
              </div>
            </div>
          </div>

          <div className="py-2">
            {accountLinks.map(({ path, label, icon: Icon, description }) => (
              <Link
                key={path}
                to={isAuthenticated ? path : "#"}
                onClick={handleLinkClick}
                className={cn(
                  "flex items-center px-5 py-2.5 text-sm text-foreground transition-colors",
                  isAuthenticated ? "hover:bg-blue-50" : "opacity-50 cursor-not-allowed"
                )}
              >
                <div className="mr-3 h-9 w-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                  <Icon className="h-4.5 w-4.5" />
                </div>
                <div>
                  <p className="font-medium">{label}</p>
                  {description && <p className="text-xs text-muted-foreground">{description}</p>}
                </div>
              </Link>
            ))}
          </div>

          <div className="border-t border-blue-50 py-2">
            <button
              onClick={() => {
                logout()
                setIsOpen(false)
              }}
              className="flex w-full items-center px-5 py-2.5 text-sm text-foreground hover:bg-red-50 transition-colors"
            >
              <div className="mr-3 h-9 w-9 rounded-full bg-red-100 flex items-center justify-center text-red-600">
                <LogOut className="h-4.5 w-4.5" />
              </div>
              <div>
                <p className="font-medium">Sign out</p>
                <p className="text-xs text-muted-foreground">End your current session</p>
              </div>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

const AdminHeader = ({ logout, fullName }) => {
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const location = useLocation()
  const isActive = (path) => location.pathname === path

  const adminNavLinks = [
    { path: "/admin", label: "Dashboard", icon: Home },
  ]

  const accountLinks = [
 
    {
      path: "/admin/settings",
      label: "Admin Settings",
      icon: Settings,
      description: "Configure system preferences",
    },
  ]

  return (
    <header className="border-b border-border sticky top-0 z-50 shadow-md bg-white">
      <div className="container mx-auto flex h-20 items-center justify-between px-6">
        <div className="flex items-center">
          <Logo />
          <div className="ml-6 hidden md:flex items-center space-x-1">
            {adminNavLinks.map(({ path, label, icon }) => (
              <NavLink key={path} to={path} label={label} icon={icon} isActive={isActive(path)} />
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <NotificationBadge count={3} />
          <UserDropdown
            isOpen={dropdownOpen}
            setIsOpen={setDropdownOpen}
            fullName={fullName}
            userRole="admin"
            accountLinks={accountLinks}
            logout={logout}
          />
        </div>
      </div>
    </header>
  )
}

const UserHeader = ({ mobileMenuOpen, setMobileMenuOpen, isAuthenticated, logout, userRole, fullName }) => {
  const location = useLocation()
  const isActive = (path) => location.pathname === path
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const userNavLinks = [
    { path: "/", label: "Home", icon: Home },
    { path: "/jobs", label: "Find Jobs", icon: Briefcase },
    { path: "/dashboard", label: "Dashboard", icon: Home },
    { path: "/recommendations", label: "For You", icon: Sparkles },
    { path: "/cv-builder", label: "CV Builder", icon: FileText },
  ]

  const defaultLinks = [
    { path: "/", label: "Home", icon: Home },
    { path: "/jobs", label: "Find Jobs", icon: Briefcase },
  ]

  const navLinks = isAuthenticated ? userNavLinks : defaultLinks

  const accountLinks = [
    {
      path: "/profile",
      label: "Your Profile",
      icon: User,
      description: "View and edit your profile",
    },
    {
      path: "/settings",
      label: "Account Settings",
      icon: Settings,
      description: "Manage your preferences",
    },
  ]

  return (
    <header
      className={cn(
        "border-b border-border sticky top-0 z-50 transition-all duration-300",
        scrolled
          ? "bg-gradient-to-r from-background to-background/95 backdrop-blur-sm shadow-md"
          : "bg-gradient-to-r from-background/90 to-background",
      )}
    >
      <div className="container mx-auto flex h-20 items-center justify-between px-6">
        <div className="flex items-center flex-1">
          <Logo />
        </div>

        <nav className="hidden md:flex items-center space-x-1">
          {navLinks.map(({ path, label, icon }) => (
            <NavLink key={path} to={path} label={label} icon={icon} isActive={isActive(path)} />
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {isAuthenticated ? (
            <>
              <NotificationBadge count={2} />
              <UserDropdown
                isOpen={dropdownOpen}
                setIsOpen={setDropdownOpen}
                fullName={fullName}
                userRole={userRole}
                accountLinks={accountLinks}
                logout={logout}
              />
            </>
          ) : (
            <div className="flex gap-3">
              <Link
                to="/login"
                className="text-base font-medium px-5 py-2.5 rounded-lg border-2 border-blue-200 hover:bg-blue-50 transition-all duration-200 hover:scale-105 hover:shadow-sm"
              >
                Log in
              </Link>
              <Link
                to="/register"
                className="text-base font-medium px-5 py-2.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-all duration-200 hover:scale-105 hover:shadow-md"
              >
                Sign up
              </Link>
            </div>
          )}

          <button
            className="md:hidden p-2 text-muted-foreground hover:text-foreground rounded-md hover:bg-muted/50 transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-expanded={mobileMenuOpen}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden bg-background border-t border-border animate-in slide-in-from-top-5 duration-200">
          <div className="container mx-auto px-4 py-3">
            <nav className="flex flex-col space-y-1">
              {navLinks.map(({ path, label, icon: Icon }) => (
                <Link
                  key={path}
                  to={path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3.5 text-base font-medium rounded-lg transition-all duration-200",
                    isActive(path)
                      ? "text-primary bg-primary/10 shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/70 hover:scale-105",
                  )}
                >
                  {Icon && <Icon className="h-5 w-5" />}
                  {label}
                </Link>
              ))}

              {!isAuthenticated && (
                <div className="pt-3 mt-3 border-t border-border grid grid-cols-2 gap-2">
                  <Link
                    to="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-sm font-medium px-4 py-2 rounded-md border border-border hover:bg-muted/50 transition-colors text-center"
                  >
                    Log in
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-sm font-medium px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-center"
                  >
                    Sign up
                  </Link>
                </div>
              )}

              {isAuthenticated && (
                <div className="pt-3 mt-3 border-t border-border">
                  <button
                    onClick={() => {
                      logout()
                      setMobileMenuOpen(false)
                    }}
                    className="flex w-full items-center gap-3 px-3 py-2.5 text-sm font-medium text-red-500 hover:bg-red-50 rounded-md transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign out
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

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { isAuthenticated, logout, user, getUserRole, getFullName } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  const userRole = getUserRole()
  const fullName = getFullName()

  useEffect(() => {
    setMobileMenuOpen(false)
  }, [location.pathname])

  useEffect(() => {
    if (isAuthenticated && userRole === "admin" && !location.pathname.startsWith("/admin")) {
      navigate("/admin")
    }
  }, [isAuthenticated, userRole, location.pathname, navigate])

  if (userRole === "admin") {
    return <AdminHeader logout={logout} fullName={fullName} />
  }

  return (
    <UserHeader
      mobileMenuOpen={mobileMenuOpen}
      setMobileMenuOpen={setMobileMenuOpen}
      isAuthenticated={isAuthenticated}
      logout={logout}
      userRole={userRole}
      fullName={fullName}
    />
  )
}