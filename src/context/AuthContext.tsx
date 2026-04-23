import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { API_BASE } from '../config';

export type UserRole = 'ADMIN' | 'USER';

export interface UserProfile {
  id: string;
  email: string;
  role: UserRole;
  familyId: string;
  name: string;
  photoUrl?: string;
}

interface AuthContextType {
  user: UserProfile | null;
  profile: UserProfile | null;
  loading: boolean;
  logout: () => void;
  isAdmin: boolean;
  setAuthData: (token: string, user: UserProfile) => void;
  refreshProfile: () => Promise<void>;
  updateProfile: (data: { name?: string; email?: string; photoUrl?: string }) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchCurrentUser = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/auth/me`, {
        headers: { 'Content-Type': 'application/json' },
        //@ts-ignore
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      }
    } catch (e) {
      console.error("Session restoration failed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  const logout = async () => {
    try {
      await fetch(`${API_BASE}/api/auth/logout`, {
        method: 'POST',
        //@ts-ignore
        credentials: 'include'
      });
    } catch (e) {
      console.error("Logout request failed");
    }
    setUser(null);
  };

  const setAuthData = (_token: string, userProfile: UserProfile) => {
    setUser(userProfile);
  };

  const refreshProfile = async () => {
    await fetchCurrentUser();
  };

  const updateProfile = async (data: { name?: string; email?: string; photoUrl?: string }) => {
    const response = await fetch(`${API_BASE}/api/auth/profile`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      //@ts-ignore
      credentials: 'include',
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      let errorMessage = 'Failed to update profile';
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorMessage;
      } catch (e) {
        errorMessage = `Error ${response.status}: ${response.statusText}`;
      }
      throw new Error(errorMessage);
    }

    const { user: updatedUser } = await response.json();
    setUser(updatedUser);
  };

  const isAdmin = user?.role === 'ADMIN';

  return (
    <AuthContext.Provider value={{ 
      user, 
      profile: user, 
      loading, 
      logout, 
      isAdmin, 
      refreshProfile,
      updateProfile,
      setAuthData
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
