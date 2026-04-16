import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { apiClient, setUnauthorizedHandler } from "@/lib/apiClient";
import { AuthUser } from "@/types/api";
import { toast } from "@/hooks/use-toast";

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  signIn: (email: string, password: string, rememberMe?: boolean) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Check existing session on mount
  useEffect(() => {
    // Nejdřív nastavíme handler
    const handleUnauthorized = () => {
      setUser((prev) => {
        if (prev) {
          toast({
            title: "Relace vypršela",
            description: "Přihlaš se prosím znovu.",
            variant: "destructive",
          });
        }
        return null;
      });
    };
    
    setUnauthorizedHandler(handleUnauthorized);

    // Pak zavolají `/api/auth/me`
    apiClient
      .get<{ user: AuthUser | null }>("/api/auth/me")
      .then((data) => setUser(data.user))
      .catch((error) => {
        // Chybu já zpracován handlers, jen si ji logujeme
        console.error("Chyba při načítání uživatele:", error);
        setUser(null);
      })
      .finally(() => setLoading(false));

    return () => setUnauthorizedHandler(null);
  }, []);

  const signIn = async (email: string, password: string, rememberMe?: boolean): Promise<{ error: Error | null }> => {
    try {
      const data = await apiClient.post<{ user: AuthUser; error?: string }>("/api/auth/login", { 
        email, 
        password,
        remember_me: rememberMe ?? false
      });
      if (data.error) return { error: new Error(data.error) };
      setUser(data.user);
      return { error: null };
    } catch (err: any) {
      const errorMessage = err?.message || "Došlo k chybě při přihlášení";
      return { error: new Error(errorMessage) };
    }
  };

  const signUp = async (email: string, password: string): Promise<{ error: Error | null }> => {
    try {
      const data = await apiClient.post<{ user: AuthUser; error?: string }>("/api/auth/register", { email, password });
      if (data.error) return { error: new Error(data.error) };
      setUser(data.user);
      return { error: null };
    } catch (err: any) {
      const errorMessage = err?.message || "Došlo k chybě při registraci";
      return { error: new Error(errorMessage) };
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
