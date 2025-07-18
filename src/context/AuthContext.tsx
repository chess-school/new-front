import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { User } from '@/types/User';
import { getProfile } from '@/api/profile';

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  loading: boolean;
  login: (token: string, userData: User) => void;
  logout: () => void;
  refetchUser: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true); 

  useEffect(() => {
    const checkAuthStatus = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const profile = await getProfile();
          setUser(profile);
          setIsAuthenticated(true);
        } catch (error) {
          console.error('Session token is invalid, logging out.', error);
          logout(); 
        }
      }
      setLoading(false);
    };

    checkAuthStatus();
  }, []);

  const login = (token: string, userData: User) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData)); 
    setIsAuthenticated(true);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setIsAuthenticated(false);
  };

  const refetchUser = async () => {
    setLoading(true);
    try {
        const profile = await getProfile();
        setUser(profile);
    } catch (error) {
        console.error("Failed to refetch user data", error);
        logout();
    } finally {
        setLoading(false);
    }
  }

  const value = {
    isAuthenticated,
    user,
    loading,
    login,
    logout,
    refetchUser
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};