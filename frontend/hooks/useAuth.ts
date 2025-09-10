
import { useState, useEffect, useCallback } from 'react';
import type { User } from '../types';

const LOCAL_STORAGE_USER_KEY = 'mediremindo_local_user';
const LOCAL_STORAGE_ADMIN_KEY = 'mediremindo_local_admin';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem(LOCAL_STORAGE_USER_KEY);
      const storedIsAdmin = localStorage.getItem(LOCAL_STORAGE_ADMIN_KEY);
      if (storedUser) {
        setUser(JSON.parse(storedUser));
        setIsAdmin(storedIsAdmin === 'true');
      }
    } catch (error) {
      console.error('Failed to parse user from local storage', error);
      localStorage.removeItem(LOCAL_STORAGE_USER_KEY);
      localStorage.removeItem(LOCAL_STORAGE_ADMIN_KEY);
    }
  }, []);

  const login = useCallback((loggedInUser: User) => {
    const isAdminUser = loggedInUser.role === 'admin' || loggedInUser.role === 'super-admin';
    localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(loggedInUser));
    localStorage.setItem(LOCAL_STORAGE_ADMIN_KEY, String(isAdminUser));
    setUser(loggedInUser);
    setIsAdmin(isAdminUser);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(LOCAL_STORAGE_USER_KEY);
    localStorage.removeItem(LOCAL_STORAGE_ADMIN_KEY);
    setUser(null);
    setIsAdmin(false);
  }, []);
  
  const updateUserInSession = useCallback((updatedUser: User) => {
      setUser(updatedUser);
      localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(updatedUser));
  }, []);

  return { user, login, logout, isAdmin, setIsAdmin, updateUserInSession };
};
