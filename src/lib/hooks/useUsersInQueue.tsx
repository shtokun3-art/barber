import { useState, useEffect } from "react";
import { API_URL } from "@/lib/utils";

interface UserInQueue {
  userId: string;
  inQueue: boolean;
  queueId?: string;
  status?: 'waiting' | 'in_progress';
}

export const useUsersInQueue = () => {
  const [usersInQueue, setUsersInQueue] = useState<UserInQueue[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsersInQueue = async () => {
    try {
      setLoading(true);
      setError(null);

      const baseUrl = window.location.origin;
      const response = await fetch(`${baseUrl}/api/queue`, {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(`Erro ao verificar usuários na fila: ${response.status}`);
      }

      const queueData = await response.json();
      
      // Extrair apenas os userIds que estão na fila
      const usersInQueueData: UserInQueue[] = queueData.map((entry: {
        userId: string;
        id: string;
        status: 'waiting' | 'in_progress';
      }) => ({
        userId: entry.userId,
        inQueue: true,
        queueId: entry.id,
        status: entry.status
      }));
      
      setUsersInQueue(usersInQueueData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
      setUsersInQueue([]);
    } finally {
      setLoading(false);
    }
  };

  const isUserInQueue = (userId: string): boolean => {
    return usersInQueue.some(user => user.userId === userId && user.inQueue);
  };

  const getUserQueueStatus = (userId: string): UserInQueue | null => {
    return usersInQueue.find(user => user.userId === userId) || null;
  };

  useEffect(() => {
    fetchUsersInQueue();

    // Atualizar a cada 30 segundos
    const interval = setInterval(fetchUsersInQueue, 30000);

    return () => clearInterval(interval);
  }, []);

  return {
    usersInQueue,
    loading,
    error,
    isUserInQueue,
    getUserQueueStatus,
    refetch: fetchUsersInQueue,
  };
};