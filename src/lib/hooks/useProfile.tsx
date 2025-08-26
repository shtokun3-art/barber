import { useState } from "react";
import { toast } from "sonner";

interface User {
  id: string;
  name: string;
  phone: string;
  email: string;
  role: string;
  color?: string;
  profileImage?: string;
  createdAt: string;
}

interface UpdateProfileData {
  name?: string;
  phone?: string;
  email?: string;
  currentPassword?: string;
  newPassword?: string;
  profileImage?: string;
}

export const useProfile = () => {
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/user/profile", {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erro ao buscar perfil");
      }

      const data = await response.json();
      setUser(data.user);
      return data.user;
    } catch (error: unknown) {
      console.error("Erro ao buscar perfil:", error);
      const errorMessage = error instanceof Error ? error.message : "Erro ao buscar perfil";
      toast.error(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (profileData: UpdateProfileData) => {
    try {
      setLoading(true);
      const response = await fetch("/api/user/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(profileData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erro ao atualizar perfil");
      }

      const data = await response.json();
      setUser(data.user);
      toast.success("Perfil atualizado com sucesso!");
      return data.user;
    } catch (error: unknown) {
      console.error("Erro ao atualizar perfil:", error);
      const errorMessage = error instanceof Error ? error.message : "Erro ao atualizar perfil";
      toast.error(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return {
    user,
    loading,
    fetchProfile,
    updateProfile,
  };
};