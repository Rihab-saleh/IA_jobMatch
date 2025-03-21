"use client";

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
  logout: () => {}
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

        const { data } = await api.get("/auth/verify");

        setState({
          user: {
            ...data.user,
            role: decoded.role || 'user'
          },
          isAuthenticated: true,
          loading: false
        });
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

      const  data  = await authService.login({ email, password });
console.log("----------------------------------------------", await authService.login({ email, password }))
      localStorage.setItem("auth_token", data.token);
      const decoded = jwtDecode(data.token);

      setState({
        user: {
          ...data.user,
          role: decoded.role || 'user'
        },
        isAuthenticated: true,
        loading: false
      });

      return { success: true, role: decoded.role };
    } catch (error) {
      console.error("Erreur de connexion:", error);
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
      
      const { data } = await authService.register(userData);

      localStorage.setItem("auth_token", await authService.register(userData));
      const decoded = jwtDecode(data.token);

      setState({
        user: {
          ...data.user,
          role: decoded.role || 'user'
        },
        isAuthenticated: true,
        loading: false
      });

      return { success: true, role: decoded.role };
    } catch (error) {
      console.error("Erreur d'inscription:", error);
      return {
        success: false,
        error: error.message || "Erreur d'inscription"
      };
    }
  };

  // Logout function
  const logout = () => {
    localStorage.removeItem("auth_token");
    setState({
      user: null,
      isAuthenticated: false,
      loading: false
    });
    window.location.href = "/login"; // Redirect to login page after logout
  };

  return (
    <AuthContext.Provider value={{ ...state, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook to use AuthContext
export const useAuth = () => useContext(AuthContext);
