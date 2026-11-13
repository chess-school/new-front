import React, { createContext, useState, useEffect, ReactNode, useCallback, useContext } from 'react';
import { User } from '@/types/User';
import { getMyProfile } from '@/api/profile';
import { logoutUser } from '@/api/auth';
import { LoginResponse } from '@/types/Auth';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (loginResponse: LoginResponse) => Promise<User>;
  logout: () => Promise<void>;
  refetchUser: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true); 

  const logout = useCallback(async () => {
    await logoutUser(); // сервер удаляет HttpOnly-cookie
    localStorage.removeItem('user');
    setUser(null);
  }, []);

  useEffect(() => {
    // Сессия определяется наличием валидной HttpOnly-cookie: просто пробуем загрузить профиль.
    // 401 (гость) — не ошибка: skipAuthRedirect не даёт глобальному перехватчику редиректить.
    const checkAuthStatus = async () => {
      setLoading(true);
      try {
        const profile = await getMyProfile({ skipAuthRedirect: true });
        setUser(profile);
      } catch {
        setUser(null); // гость или протухшая сессия
      } finally {
        setLoading(false);
      }
    };
    checkAuthStatus();
  }, []);

  const login = useCallback(async () => {
    // Токен уже установлен сервером в HttpOnly-cookie при POST /auth/login.
    // Нам остаётся подтянуть профиль (cookie уйдёт автоматически через withCredentials).
    try {
        const fullUserProfile = await getMyProfile();
        setUser(fullUserProfile);
        return fullUserProfile;
    } catch (error) {
        console.error("Failed to fetch profile after login.", error);
        await logout();
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
        await logout();
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