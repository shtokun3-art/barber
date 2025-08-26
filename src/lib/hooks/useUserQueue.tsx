import { useState, useEffect, useRef } from "react";
import { API_URL } from "@/lib/utils";
import { useQueueSSE } from "./useQueueSSE";

interface Service {
  id: string;
  name: string;
  price: number;
  averageTime: number;
}

interface Barber {
  id: string;
  name: string;
}

interface CurrentlyServing {
  name: string;
  position: number;
  isCurrentUser?: boolean;
}

export interface QueueClient {
  id: string;
  position: number;
  name: string;
  isCurrentUser: boolean;
  services: Service[];
  estimatedTime: number;
  status: 'waiting' | 'in_progress';
}

export interface UserQueueStatus {
  inQueue: boolean;
  queueId?: string;
  position?: number;
  peopleAhead?: number;
  totalPeople?: number;
  estimatedTime?: number;
  estimatedWaitTime?: number;
  totalPrice?: number;
  barber?: Barber;
  services?: Service[];
  queueList?: QueueClient[];
  currentlyServing?: CurrentlyServing;
  createdAt?: string;
  updatedAt?: string;
}

export const useUserQueue = () => {
  const [queueStatus, setQueueStatus] = useState<UserQueueStatus>({ inQueue: false });
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isFetching, setIsFetching] = useState<boolean>(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchQueueStatus = async () => {
    // Evitar múltiplas requisições simultâneas
    if (isFetching) {
      return;
    }
    
    // Cancelar requisição anterior se existir
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    // Criar novo AbortController
    abortControllerRef.current = new AbortController();
    
    try {
      setIsFetching(true);
      setLoading(true);
      setError(null);
      console.log("🔍 Buscando status da fila...");

      const baseUrl = window.location.origin;
      const response = await fetch(`${baseUrl}/api/queue/status`, {
        credentials: "include",
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        throw new Error(`Erro ao verificar status da fila: ${response.status}`);
      }

      const data: UserQueueStatus = await response.json();
      console.log("📊 Status da fila atualizado:", {
        inQueue: data.inQueue,
        position: data.position,
        queueId: data.queueId
      });
      setQueueStatus(data);
    } catch (err) {
      // Ignorar erros de abort
      if (err instanceof Error && err.name === 'AbortError') {
        return;
      }
      setError(err instanceof Error ? err.message : "Erro desconhecido");
      setQueueStatus({ inQueue: false });
    } finally {
      setLoading(false);
      setIsFetching(false);
      abortControllerRef.current = null;
    }
  };

  const addToQueue = async (serviceIds: string[], barberId: string) => {
    try {
      setLoading(true);
      setError(null);

      const baseUrl = window.location.origin;
      const response = await fetch(`${baseUrl}/api/queue/add`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ serviceIds, barberId }),
        credentials: "include",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erro ao entrar na fila");
      }

      const result = await response.json();
      
      // Força atualização imediata do estado para garantir redirecionamento
      setQueueStatus(prev => ({ ...prev, inQueue: true }));
      
      // Atualiza status completo em seguida
      await fetchQueueStatus();
      
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
      throw err;
    } finally {
      setLoading(false);
    }
  };



  // Usar SSE para atualizações em tempo real
  const { isConnected, error: sseError } = useQueueSSE(() => {
    // Callback executado quando há atualização da fila via SSE
    fetchQueueStatus();
  });

  // Buscar status inicial
  useEffect(() => {
    fetchQueueStatus();
  }, []);

  // Fallback: polling como backup se SSE falhar + polling adicional quando na fila
  useEffect(() => {
    if (!isConnected && !sseError) {
      // SSE ainda conectando, aguardar
      return;
    }

    // Polling mais frequente quando o usuário está na fila para detectar conclusão de serviço
    if (queueStatus.inQueue) {
      console.log('👀 Usuário na fila: ativando polling de verificação a cada 10 segundos');
      const interval = setInterval(() => {
        console.log('🔍 Verificação periódica do status da fila...');
        fetchQueueStatus();
      }, 10000); // Verificar a cada 10 segundos quando na fila

      return () => {
        console.log('⏹️ Parando polling de verificação');
        clearInterval(interval);
      };
    }

    if (sseError) {
      // SSE falhou, usar polling como fallback
      console.warn('SSE falhou, usando polling como fallback:', sseError);
      
      const interval = setInterval(() => {
        fetchQueueStatus();
      }, queueStatus.inQueue ? 5000 : 30000); // Polling mais frequente

      return () => clearInterval(interval);
    }

    // Polling adicional mesmo com SSE funcionando (como backup)
    if (!queueStatus.inQueue) {
      const backupInterval = setInterval(() => {
        fetchQueueStatus();
      }, 30000); // Backup a cada 30 segundos quando não está na fila

      return () => clearInterval(backupInterval);
    }
  }, [isConnected, sseError, queueStatus.inQueue]);

  // Atualizar quando a aba se torna visível (para casos onde SSE pode ter perdido conexão)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchQueueStatus();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  return {
    queueStatus,
    loading,
    error,
    addToQueue,
    refetch: fetchQueueStatus,
  };
};