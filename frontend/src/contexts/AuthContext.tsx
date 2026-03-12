import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { apiClient } from "@/lib/apiClient";
import { AuthUser } from "@/types/api";

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Check existing session on mount
  useEffect(() => {
    apiClient
      .get<{ user: AuthUser | null }>("/api/auth/me")
      .then((data) => setUser(data.user))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const signIn = async (email: string, password: string): Promise<{ error: Error | null }> => {
    try {
      const data = await apiClient.post<{ user: AuthUser; error?: string }>("/api/auth/login", { email, password });
      if (data.error) return { error: new Error(data.error) };
      setUser(data.user);
      return { error: null };
    } catch (err: any) {
      return { error: err };
    }
  };

  const signUp = async (email: string, password: string): Promise<{ error: Error | null }> => {
    try {
      const data = await apiClient.post<{ user: AuthUser; error?: string }>("/api/auth/register", { email, password });
      if (data.error) return { error: new Error(data.error) };
      setUser(data.user);
      return { error: null };
    } catch (err: any) {
      return { error: err };
    }
  };

  const signOut = async () => {
    await apiClient.post("/api/auth/logout", {}).catch(() => {});
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
