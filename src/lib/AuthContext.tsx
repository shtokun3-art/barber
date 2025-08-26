'use client'

import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { API_URL } from "./utils";

interface User {
  id: string;
  name: string;
  phone: string;
  email?: string | null;
  role: string;
  color?: string;
  profileImage?: string | null;
  hasRatedOnGoogle?: boolean;
}

interface AuthContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  loading: boolean;
  loggingOut: boolean;
  logout: () => void;
  refreshUser: () => Promise<void>;
  redirectToCorrectPage: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const router = useRouter();

  // Ensure we're on the client side to prevent hydration issues
  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient) return;

    async function fetchUser() {
      try {
        const response = await fetch(`/api/auth/me`, {
          credentials: "include",
        });

        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error("Erro ao buscar usuário:", error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    }

    fetchUser();
  }, [isClient]);

  const refreshUser = async () => {
    if (!isClient) return;
    
    try {
      const response = await fetch(`/api/auth/me`, {
        credentials: "include",
      });

      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      }
    } catch (error) {
      console.error("Erro ao atualizar usuário:", error);
    }
  };

  const redirectToCorrectPage = (user: User) => {
    if (user.role === 'client') {
      router.replace(`/client/${user.id}`);
    } else if (user.role === 'admin' || user.role === 'barber') {
      router.replace(`/main/${user.id}`);
    } else {
      // Fallback para roles desconhecidos
      router.replace(`/client/${user.id}`);
    }
  };

  const logout = async () => {
    setLoggingOut(true);
    try {
      const response = await fetch(`/api/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
      if (response.ok) {
        setUser(null);
        // Pequeno delay para mostrar a tela de logout
        setTimeout(() => {
          setLoggingOut(false);
          router.replace(`/auth/login`);
        }, 1500);
      } else {
        setLoggingOut(false);
      }
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
      setLoggingOut(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, setUser, loading, loggingOut, logout, refreshUser, redirectToCorrectPage }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth deve ser usado dentro de um AuthProvider");
  }
  return context;
}