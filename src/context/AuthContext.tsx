import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { API_BASE } from '../config';

export type UserRole = 'ADMIN' | 'USER';

export interface UserProfile {
  id: string;
  email: string;
  role: UserRole;
  familyId: string;
  fullName: string;
  photoUrl?: string;
}

interface AuthContextType {
  user: UserProfile | null;
  profile: UserProfile | null;
  loading: boolean;
  slowLoading: boolean;
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
  const [slowLoading, setSlowLoading] = useState(false);

  const fetchCurrentUser = async () => {
    // Check cache for instant entry
    const cached = localStorage.getItem('user_profile');
    if (cached && loading) {
      setUser(JSON.parse(cached));
      setLoading(false);
    }

    const controller = new AbortController();
    const slowTimeoutId = setTimeout(() => setSlowLoading(true), 5000);
    const timeoutId = setTimeout(() => {
      console.warn("Auth request timed out. Database might be waking up.");
      controller.abort();
    }, 20000); // Increased to 20s for Oracle cold starts

    try {
      const response = await fetch(`${API_BASE}/api/auth/me`, {
        headers: { 'Content-Type': 'application/json' },
        //@ts-ignore
        credentials: 'include',
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      clearTimeout(slowTimeoutId);
      setSlowLoading(false);
      
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        localStorage.setItem('user_profile', JSON.stringify(data.user));
      } else {
        if (response.status === 401) {
          setUser(null);
          localStorage.removeItem('user_profile');
        }
        // Even if not 401, we stop loading to show login screen or error
      }
    } catch (e: any) {
      clearTimeout(slowTimeoutId);
      setSlowLoading(false);
      if (e.name === 'AbortError') {
        console.error("Auth request aborted due to timeout");
      } else {
        console.error("Session restoration failed:", e);
      }
      // If we have a cached user, maybe keep it but let the user know?
      // For now, we just stop the loader so the app doesn't hang
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  const logout = async () => {
    localStorage.removeItem('user_profile');
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
      slowLoading,
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
