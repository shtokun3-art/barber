import { useState, useEffect } from "react";
import { API_URL } from "@/lib/utils";
import { useQueueSSE } from "./useQueueSSE";

interface Service {
  id: string;
  name: string;
  price: number;
  averageTime: number;
}

interface QueueService {
  service: Service;
}

interface User {
  id: string;
  name: string;
  phone: string;
}

interface Barber {
  id: string;
  name: string;
}

export interface QueueEntry {
  id: string;
  userId: string;
  user: User;
  barberId: string;
  barber: Barber;
  status: "waiting" | "completed" | "canceled";
  createdAt: string;
  updatedAt: string;
  queueServices: QueueService[];
}

export const useQueue = () => {
  const [queueEntries, setQueueEntries] = useState<QueueEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isFirstLoad, setIsFirstLoad] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isTabVisible, setIsTabVisible] = useState<boolean>(true);

  // Detectar visibilidade da aba
  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsTabVisible(!document.hidden);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  const fetchData = async (showLoading = true) => {
    try {
      if (showLoading) {
        setLoading(true);
      }

      const baseUrl = window.location.origin;
      const response = await fetch(`${baseUrl}/api/queue`, {
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error("Erro ao buscar a fila");
      }
      const data: QueueEntry[] = await response.json();

      const waitingEntries = data
        .filter((entry) => entry.status === "waiting")
        .sort(
          (a, b) =>
            new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()
        );

      setQueueEntries(waitingEntries);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
    } finally {
      if (showLoading) {
        setLoading(false);
        setIsFirstLoad(false);
      }
    }
  };

  // Usar SSE para atualizações em tempo real
  const { isConnected, error: sseError } = useQueueSSE(() => {
    // Callback executado quando há atualização da fila via SSE
    if (!isPaused) {
      fetchData(false);
    }
  });

  // Buscar dados inicial
  useEffect(() => {
    fetchData();
  }, []);

  // Fallback: polling como backup se SSE falhar
  useEffect(() => {
    if (!isConnected && !sseError) {
      // SSE ainda conectando, aguardar
      return;
    }

    if (sseError) {
      // SSE falhou, usar polling como fallback
      console.warn('SSE falhou, usando polling como fallback:', sseError);
      
      const interval = setInterval(() => {
        if (!isPaused && isTabVisible) {
          fetchData(false);
        }
      }, isTabVisible ? 5000 : 30000); // Polling mais frequente: 5s quando visível, 30s quando não

      return () => clearInterval(interval);
    }

    // Polling adicional mesmo com SSE funcionando (como backup)
    const backupInterval = setInterval(() => {
      if (!isPaused && isTabVisible) {
        fetchData(false);
      }
    }, 30000); // Backup a cada 30 segundos

    return () => clearInterval(backupInterval);
  }, [isConnected, sseError, isPaused, isTabVisible]);

  // Recarregar dados quando a aba se torna visível (para casos onde SSE pode ter perdido conexão)
  useEffect(() => {
    if (isTabVisible && !isFirstLoad) {
      fetchData(false);
    }
  }, [isTabVisible, isFirstLoad]);

  const completeService = async (queueId: string, services: { serviceId: string; price: number; time: number }[], products: { id: string; name: string; price: number; quantity: number; totalPrice: number }[] = [], paymentMethod: 'cash' | 'credit_card' | 'debit_card' | 'pix', installments: number = 1, extraServices: any[] = []) => {
    try {
      const baseUrl = window.location.origin;
      const response = await fetch(`${baseUrl}/api/queue/complete`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ queueId, services, products, paymentMethod, installments, extraServices }),
        credentials: "include",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erro ao concluir serviço");
      }

      // Dados serão atualizados automaticamente via SSE
      // await fetchData(false); // Removido: SSE irá notificar a atualização
      return await response.json();
    } catch (error) {
      console.error("Erro ao concluir serviço:", error);
      throw error;
    }
  };

  const cancelEntry = async (queueId: string) => {
    try {
      const baseUrl = window.location.origin;
      const response = await fetch(`${baseUrl}/api/queue/cancel`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ queueId }),
        credentials: "include",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erro ao cancelar entrada");
      }

      // Dados serão atualizados automaticamente via SSE
      // await fetchData(false); // Removido: SSE irá notificar a atualização
      return await response.json();
    } catch (error) {
      console.error("Erro ao cancelar entrada:", error);
      throw error;
    }
  };

  const movePosition = async (queueId: string, direction: 'up' | 'down') => {
    try {
      const baseUrl = window.location.origin;
      const response = await fetch(`${baseUrl}/api/queue/move`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ queueId, direction }),
        credentials: "include",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erro ao mover posição");
      }

      // Dados serão atualizados automaticamente via SSE
      // await fetchData(false); // Removido: SSE irá notificar a atualização
      return await response.json();
    } catch (error) {
      console.error("Erro ao mover posição:", error);
      throw error;
    }
  };

  const pauseUpdates = () => setIsPaused(true);
  const resumeUpdates = () => setIsPaused(false);

  return { 
    queueEntries, 
    loading, 
    isFirstLoad,
    error, 
    refetch: fetchData,
    completeService,
    cancelEntry,
    movePosition,
    pauseUpdates,
    resumeUpdates,
    isPaused
  };
};