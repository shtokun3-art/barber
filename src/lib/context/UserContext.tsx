'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { API_URL } from '../utils';

export interface User {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  role: string;
  profileImage?: string | null;
  createdAt: string;
}

interface UsersContextType {
  users: User[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
}

const UsersContext = createContext<UsersContextType | undefined>(undefined);

export const UsersProvider = ({ children }: { children: ReactNode }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const baseUrl = window.location.origin;
      const response = await fetch(`${baseUrl}/api/users`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) throw new Error('Erro ao carregar usuários');
      const data = await response.json();
      setUsers(data);
      setError(null);
    } catch (err) {
      setError('Erro ao carregar usuários');
    } finally {
      setLoading(false);
    }
  };

  const deleteUser = async (id: string) => {
    setLoading(true);
    try {
      const baseUrl = window.location.origin;
      const response = await fetch(`${baseUrl}/api/users/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) throw new Error('Erro ao deletar usuário');
      setUsers((prev) => prev.filter((user) => user.id !== id));
      setError(null);
    } catch (err) {
      setError('Erro ao deletar usuário');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  return (
    <UsersContext.Provider value={{ users, loading, error, refetch: fetchUsers, deleteUser }}>
      {children}
    </UsersContext.Provider>
  );
};

export const useUsersContext = () => {
  const context = useContext(UsersContext);
  if (!context) {
    throw new Error('useUsersContext deve ser usado dentro de um UsersProvider');
  }
  return context;
};