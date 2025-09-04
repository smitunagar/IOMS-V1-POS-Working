"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface User {
  id: string; // Typically email or a unique ID from backend
  email: string;
  restaurantName?: string;
}

interface AuthContextType {
  currentUser: User | null;
  isLoading: boolean;
  isInitialized: boolean;
  login: (email: string, pass: string) => Promise<boolean>; // pass is unused in prototype
  signup: (email: string, pass: string, restaurantName?: string) => Promise<boolean>; // pass is unused
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const LOCAL_STORAGE_USER_KEY = 'gastronomeCurrentUser';
const LOCAL_STORAGE_USERS_LIST_KEY = 'gastronomeUsersList'; // To simulate a user database

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const router = useRouter();

  // Function to save user to localStorage
  const saveUserToStorage = (user: User | null) => {
    if (user) {
      localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(LOCAL_STORAGE_USER_KEY);
    }
  };

  // Function to load user from localStorage
  const loadUserFromStorage = (): User | null => {
    try {
      const storedUser = localStorage.getItem(LOCAL_STORAGE_USER_KEY);
      console.log('[AuthProvider] Raw localStorage data:', storedUser);
      
      if (storedUser) {
        const userData = JSON.parse(storedUser);
        console.log('[AuthProvider] Parsed user data:', userData);
        return userData;
      }
      return null;
    } catch (error) {
      console.error('[AuthProvider] Error loading user from localStorage:', error);
      localStorage.removeItem(LOCAL_STORAGE_USER_KEY); // Clear corrupted data
      return null;
    }
  };

  // Function to check if user exists in users list
  const validateUserExists = (user: User): boolean => {
    try {
      const usersListStr = localStorage.getItem(LOCAL_STORAGE_USERS_LIST_KEY);
      const usersList: User[] = usersListStr ? JSON.parse(usersListStr) : [];
      const userExists = usersList.find(u => u.email === user.email);
      console.log('[AuthProvider] User validation:', userExists ? 'valid' : 'invalid');
      return !!userExists;
    } catch (error) {
      console.error('[AuthProvider] User validation error:', error);
      return false;
    }
  };

  // Function to check authentication status on every render
  const checkAuthStatus = useCallback(() => {
    if (typeof window === 'undefined') return;
    
    const storedUser = localStorage.getItem(LOCAL_STORAGE_USER_KEY);
    if (storedUser && !currentUser) {
      try {
        const userData = JSON.parse(storedUser);
        if (validateUserExists(userData)) {
          console.log('[AuthProvider] Found stored user, restoring session:', userData);
          setCurrentUser(userData);
        }
      } catch (error) {
        console.error('[AuthProvider] Error restoring session:', error);
      }
    }
  }, [currentUser]);

  // Check auth status on mount only
  useEffect(() => {
    checkAuthStatus();
  }, [checkAuthStatus]);

  useEffect(() => {
    setIsLoading(true);
    setIsInitialized(false);
    
    const user = loadUserFromStorage();
    
    // Validate that the user still exists in the users list
    if (user && validateUserExists(user)) {
      setCurrentUser(user);
    } else if (user) {
      saveUserToStorage(null);
      setCurrentUser(null);
    } else {
      setCurrentUser(null);
    }
    
    setIsInitialized(true);
    setIsLoading(false);
  }, []);

  const login = async (email: string, pass: string): Promise<boolean> => {
    setIsLoading(true);
    
    try {
      // Simulate checking user credentials
      const usersListStr = localStorage.getItem(LOCAL_STORAGE_USERS_LIST_KEY);
      const usersList: User[] = usersListStr ? JSON.parse(usersListStr) : [];
      const existingUser = usersList.find(u => u.email === email);

      if (existingUser) {
        console.log('[AuthProvider] User found, setting currentUser:', existingUser);
        setCurrentUser(existingUser);
        saveUserToStorage(existingUser);
        setIsLoading(false);
        return true;
      } else {
        console.log('[AuthProvider] User not found in users list');
        setIsLoading(false);
        return false;
      }
    } catch (error) {
      console.error('[AuthProvider] Login error:', error);
      setIsLoading(false);
      return false;
    }
  };

  const signup = async (email: string, pass: string, restaurantName?: string): Promise<boolean> => {
    console.log('[AuthProvider] Signup attempt for:', email);
    setIsLoading(true);
    
    try {
      const usersListStr = localStorage.getItem(LOCAL_STORAGE_USERS_LIST_KEY);
      const usersList: User[] = usersListStr ? JSON.parse(usersListStr) : [];
      
      if (usersList.find(u => u.email === email)) {
        console.log('[AuthProvider] User already exists');
        setIsLoading(false);
        return false;
      }

      const newUser: User = { id: email, email, restaurantName };
      usersList.push(newUser);
      localStorage.setItem(LOCAL_STORAGE_USERS_LIST_KEY, JSON.stringify(usersList));
      console.log('[AuthProvider] New user created:', newUser);
      
      setIsLoading(false);
      return true;
    } catch (error) {
      console.error('[AuthProvider] Signup error:', error);
      setIsLoading(false);
      return false;
    }
  };

  const logout = () => {
    console.log('[AuthProvider] Logout called');
    setCurrentUser(null);
    saveUserToStorage(null);
    router.push('/login');
  };

  // Only show loading state if we haven't initialized yet
  const shouldShowLoading = isLoading && !isInitialized;

  return (
    <AuthContext.Provider value={{ currentUser, isLoading: shouldShowLoading, isInitialized, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 