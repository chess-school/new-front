import React, { createContext, useState, useEffect, ReactNode, useCallback, useContext } from 'react';
import { User } from '@/types/User'; 
import { getMyProfile } from '@/api/profile';
import { LoginResponse } from '@/types/Auth';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (loginResponse: LoginResponse) => Promise<User>;
  logout: () => void;
  refetchUser: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true); 

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    setUser(null);
  }, []);

  useEffect(() => {
    const checkAuthStatus = async () => {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const profile = await getMyProfile();
        setUser(profile);
      } catch (error) {
        console.error('Session check failed, token is invalid. Logging out.', error);
        logout(); 
      } finally {
        setLoading(false);
      }
    };
    checkAuthStatus();
  }, [logout]);

  const login = useCallback(async (loginResponse: LoginResponse) => {
    if (!loginResponse || !loginResponse.token) {
      throw new Error("Invalid login response");
    }
    
    localStorage.setItem('token', loginResponse.token);
    
    try {
        const fullUserProfile = await getMyProfile();
        setUser(fullUserProfile);
        return fullUserProfile;
    } catch (error) {
        console.error("Failed to fetch profile after login. Rolling back.", error);
        logout();
        throw error;
    }
  }, [logout]);
  
  const refetchUser = useCallback(async () => {
    setLoading(true);
    try {
        const profile = await getMyProfile();
        setUser(profile);
    } catch (error) {
        console.error("Failed to refetch user data", error);
        logout();
    } finally {
        setLoading(false);
    }
  }, [logout]);

  const isAuthenticated = !!user;

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


export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};