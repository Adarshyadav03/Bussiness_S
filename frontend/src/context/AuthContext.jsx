import React, { createContext, useState, useEffect } from 'react';
import { loginApi, signupApi } from '../services/authApi';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('erp_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('erp_token') || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const login = async (email, password) => {
    setLoading(true);
    setError(null);
    try {
      // Clear any previous session token to prevent role token mismatch
      localStorage.removeItem('erp_user');
      localStorage.removeItem('erp_token');

      const response = await loginApi({ email, password });
      if (response.success) {
        setUser(response.user);
        setToken(response.token);
        localStorage.setItem('erp_user', JSON.stringify(response.user));
        localStorage.setItem('erp_token', response.token);
        return { success: true, user: response.user };
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Login failed. Invalid credentials.';
      setError(msg);
      return { success: false, error: msg };
    } finally {
      setLoading(false);
    }
  };

  const signup = async (name, email, password) => {
    setLoading(true);
    setError(null);
    try {
      const response = await signupApi({ name, email, password });
      return { success: true, message: response.message };
    } catch (err) {
      const msg = err.response?.data?.message || 'Signup failed. Please try again.';
      setError(msg);
      return { success: false, error: msg };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('erp_user');
    localStorage.removeItem('erp_token');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        isAdmin: user?.role === 'ADMIN',
        isSalesUser: user?.role === 'SALES_USER',
        loading,
        error,
        login,
        signup,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
