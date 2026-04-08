import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from './api';

export interface User {
  id: string;
  email: string;
}

export interface Profile {
  _id: string;
  user: any;
  name: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: { name?: string }) => Promise<void>;
  updatePassword: (newPassword: string) => Promise<void>; // Mock for now
  resendVerification: (email: string) => Promise<void>; // Mock for now
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async (userId: string) => {
    try {
      const profiles = await api.get('/profiles');
      const found = profiles.find((p: any) => 
        (p.user && p.user._id === userId) || p.user === userId
      );
      if (found) setProfile(found);
    } catch (err) {
      console.error('Failed to fetch profile', err);
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('collab_token');
    const storedUser = localStorage.getItem('collab_user');
    
    if (token && storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      fetchProfile(parsedUser.id);
    }
    setLoading(false);
  }, [fetchProfile]);

  const login = useCallback(async (email: string, password: string) => {
    const data = await api.post('/auth/login', { email, password });
    localStorage.setItem('collab_token', data.token);
    const loggedInUser = { id: data._id, email: data.email };
    localStorage.setItem('collab_user', JSON.stringify(loggedInUser));
    setUser(loggedInUser);
    await fetchProfile(loggedInUser.id);
  }, [fetchProfile]);

  const signup = useCallback(async (name: string, email: string, password: string) => {
    const data = await api.post('/auth/signup', { name, email, password });
    localStorage.setItem('collab_token', data.token);
    const signedUpUser = { id: data._id, email: data.email };
    localStorage.setItem('collab_user', JSON.stringify(signedUpUser));
    setUser(signedUpUser);
    await fetchProfile(signedUpUser.id);
  }, [fetchProfile]);

  const logout = useCallback(async () => {
    localStorage.removeItem('collab_token');
    localStorage.removeItem('collab_user');
    setUser(null);
    setProfile(null);
  }, []);

  const updateProfile = useCallback(async (data: { name?: string }) => {
    if (!profile) return;
    await api.put(`/profiles/${profile._id}`, data);
    if (user) await fetchProfile(user.id);
  }, [profile, user, fetchProfile]);

  const updatePassword = useCallback(async (newPassword: string) => {
    console.warn('updatePassword not fully implemented in MongoDB backend yet');
  }, []);

  const resendVerification = useCallback(async (email: string) => {
    console.warn('resendVerification not needed currently');
  }, []);

  return (
    <AuthContext.Provider value={{ 
      user, 
      profile, 
      isAuthenticated: !!user, 
      loading, 
      login, 
      signup, 
      logout, 
      updateProfile,
      updatePassword,
      resendVerification
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
