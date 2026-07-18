import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import httpClient from '../services/httpClient';

export const useAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    const role = localStorage.getItem('user_role');
    if (token) {
      setIsAuthenticated(true);
      setUserRole(role);
    }
    setIsLoading(false);
  }, []);

  const login = async (credentials: any) => {
    try {
      const response = await httpClient.post('/auth/login', credentials);
      const { access_token, refresh_token, role } = response.data.data;
      localStorage.setItem('access_token', access_token);
      localStorage.setItem('refresh_token', refresh_token);
      if (role) localStorage.setItem('user_role', role);
      
      setIsAuthenticated(true);
      setUserRole(role);
      
      if (role === 'admin') {
        navigate('/admin/dashboard');
      } else {
        navigate('/dashboard');
      }
      return { success: true };
    } catch (error: any) {
      return { 
        success: false, 
        error: error.response?.data?.message || 'Login failed' 
      };
    }
  };

  const register = async (userData: any) => {
    try {
      const response = await httpClient.post('/auth/register', userData);
      const { access_token, refresh_token, role } = response.data.data;
      localStorage.setItem('access_token', access_token);
      localStorage.setItem('refresh_token', refresh_token);
      if (role) localStorage.setItem('user_role', role);
      
      setIsAuthenticated(true);
      setUserRole(role);
      navigate('/dashboard');
      return { success: true };
    } catch (error: any) {
      return { 
        success: false, 
        error: error.response?.data?.message || 'Registration failed' 
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_role');
    setIsAuthenticated(false);
    setUserRole(null);
    navigate('/login');
  };

  return {
    isAuthenticated,
    userRole,
    isLoading,
    login,
    register,
    logout
  };
};
