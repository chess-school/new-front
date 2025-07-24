import { useContext } from 'react';
import { AuthContext } from '@/context/AuthContext'; 

export const useAuthUser = () => {
  const auth = useContext(AuthContext);

  if (!auth) {
    throw new Error('useAuthUser must be used within an AuthProvider');
  }

  return { 
    userId: auth.user?._id, 
    user: auth.user, 
    isAuthLoading: auth.loading 
  };
};