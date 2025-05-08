;

import { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";
import { jwtDecode } from "jwt-decode";
import authService from "../services/auth-service"; // Assuming authService has register and login methods

// Create the AuthContext
export const AuthContext = createContext({
  user: null,
  isAuthenticated: false,
  loading: true,
  login: () => {},
  register: () => {},
  logout: () => {},
  getUserRole: () => {},
  getFullName: () => {},
});

// Create the AuthProvider component
export function AuthProvider({ children }) {
  const [state, setState] = useState({
    user: null,
    isAuthenticated: false,
    loading: true
  });

  // Axios instance
  const api = axios.create({
    baseURL: "http://localhost:5000/api",
    timeout: 5000,
    headers: {
      "Content-Type": "application/json"
    }
  });

  // Add request interceptor
  useEffect(() => {
    api.interceptors.request.use(config => {
      const token = localStorage.getItem("auth_token");
      if (token) config.headers.Authorization = `Bearer ${token}`;
      return config;
    });

    api.interceptors.response.use(
      response => response,
      async error => {
        const originalRequest = error.config;
        if (error.response?.status === 401 && !originalRequest._retry) {
          try {
            originalRequest._retry = true;
            const { data } = await api.post("/auth/refresh");
            localStorage.setItem("auth_token", data.token);
            
            localStorage.setItem("userId", data.id)
            return api(originalRequest);
          } catch (refreshError) {
            localStorage.removeItem("auth_token");
            window.location.href = "/login";
          }
        }
        return Promise.reject(error.response?.data?.message || "Erreur du serveur");
      }
    );
  }, []);

  // Verify token on mount
  useEffect(() => {
    const verifyToken = async () => {
      try {
        const token = localStorage.getItem("auth_token");
        if (!token) return;

        const decoded = jwtDecode(token);
        if (Date.now() >= decoded.exp * 1000) {
          throw new Error("Token expiré");
        }

        try {
          const { data } = await api.get("/auth/verify");
          console.log("Verify response:", data);
          
          setState({
            user: {
              ...data.user,
              id: decoded.id,
              email: decoded.email || decoded.lastName, // Some tokens have email in lastName field
              role: decoded.role || 'user',
              firstName: data.user?.firstName || decoded.firstName,
              lastName: data.user?.lastName || decoded.lastName,
              fullName: data.user?.fullName || decoded.fullName,
            },
            isAuthenticated: true,
            loading: false
          });
        } catch (error) {
          console.log("Verify API failed, using token data only");
          // If API verification fails, use token data only
          setState({
            user: {
              id: decoded.id,
              email: decoded.email || decoded.lastName, // Some tokens have email in lastName field
              role: decoded.role || 'user',
              firstName: decoded.firstName,
              lastName: decoded.lastName,
              fullName: decoded.fullName,
            },
            isAuthenticated: true,
            loading: false
          });
        }
      } catch (error) {
        console.error("Erreur de vérification du token:", error);
        logout();
      }
    };
    verifyToken();
  }, []);

  // Login function
  const login = async (email, password) => {
    try {
      setState(prev => ({ ...prev, loading: true }));

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        throw new Error("Format d'email invalide");
      }

      const data = await authService.login({ email, password });
      console.log("Login response:", data);
      
      localStorage.setItem("auth_token", data.token);
      const decoded = jwtDecode(data.token);

      setState({
        user: {
          id: data.id || decoded.id,
          email: data.email || decoded.email || decoded.lastName,
          role: decoded.role || data.role || 'user',
          firstName: data.firstName || decoded.firstName,
          lastName: data.lastName || decoded.lastName,
          fullName: data.fullName || decoded.fullName,
        },
        isAuthenticated: true,
        loading: false
      });

      return { success: true, role: decoded.role };
    } catch (error) {
      console.error("Erreur de connexion:", error);
      setState(prev => ({ ...prev, loading: false }));
      return {
        success: false,
        error: error.message || "Identifiants invalides"
      };
    }
  };

  // Register function
  const register = async (userData) => {
    try {
      setState(prev => ({ ...prev, loading: true }));
      
      const response = await authService.register(userData);
      const data = response;

      localStorage.setItem("auth_token", data.token);
      const decoded = jwtDecode(data.token);

      setState({
        user: {
          id: data.id || decoded.id,
          email: data.email || decoded.email || decoded.lastName,
          role: decoded.role || data.role || 'user',
          firstName: data.firstName || decoded.firstName,
          lastName: data.lastName || decoded.lastName,
          fullName: data.fullName || decoded.fullName,
        },
        isAuthenticated: true,
        loading: false
      });

      return { success: true, role: decoded.role };
    } catch (error) {
      console.error("Erreur d'inscription:", error);
      setState(prev => ({ ...prev, loading: false }));
      return {
        success: false,
        error: error.message || "Erreur d'inscription"
      };
    }
  };

  // Logout function
  const logout = () => {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("userId");
    setState({
      user: null,
      isAuthenticated: false,
      loading: false
    });
    window.location.href = "/login"; // Redirect to login page after logout
  };
  
  // Improved getUserRole method to handle different token structures
  const getUserRole = () => {
    if (!state.user) return null;
    
    const role = state.user.role;
    if (!role) return 'user'; // Default to user if no role found
    
    // Normalize role to lowercase for consistent comparison
    const normalizedRole = typeof role === 'string' ? role.toLowerCase() : '';
    
    // Check for admin role
    if (normalizedRole.includes('admin')) return 'admin';
    
    // Check for user role
    if (normalizedRole === 'user' || normalizedRole === '') return 'user';
    
    // If role contains a name (as in some of your token examples), 
    // it's probably not actually a role but a name
    if (normalizedRole.includes(' ') && !normalizedRole.includes('admin') && !normalizedRole.includes('user')) {
      return 'user'; // Default to user if role appears to be a name
    }
    
    return normalizedRole;
  }

  // Improved getFullName method to handle different token structures
  const getFullName = () => {
    if (!state.user) return "";
    
    // Try to get fullName directly if available
    if (state.user.fullName) {
      return state.user.fullName;
    }
    
    // Check if the role field might contain a name (as seen in your token examples)
    if (typeof state.user.role === 'string' && 
        state.user.role.includes(' ') && 
        !state.user.role.toLowerCase().includes('admin') && 
        !state.user.role.toLowerCase().includes('user')) {
      return state.user.role;
    }
    
    // Try to get name from firstName and lastName fields
    const firstName = state.user.firstName || state.user.first_name || "";
    const lastName = state.user.lastName || state.user.last_name || "";
    
    // If lastName looks like an email and not a name, don't use it
    const formattedLastName = lastName && lastName.includes('@') ? "" : lastName;
    
    const fullName = `${firstName} ${formattedLastName}`.trim();
    
    // Return the constructed name or a default if empty
    return fullName || (state.user.email ? state.user.email.split('@')[0] : "User");
  }

  return (
    <AuthContext.Provider value={{ ...state, login, register, logout, getUserRole, getFullName }}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook to use AuthContext
export const useAuth = () => useContext(AuthContext);