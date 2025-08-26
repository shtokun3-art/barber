import { useState, useEffect, useRef, useCallback } from 'react';
import { API_URL } from '@/lib/utils';

interface QueueSSEHook {
  isConnected: boolean;
  lastUpdate: number | null;
  error: string | null;
  reconnect: () => void;
}

export function useQueueSSE(onUpdate?: () => void): QueueSSEHook {
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;
  const baseReconnectDelay = 1000; // 1 segundo

  const cleanup = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
  }, []);

  const connect = useCallback(() => {
    cleanup();
    setError(null);

    try {
      const baseUrl = window.location.origin;
      const eventSource = new EventSource(`${baseUrl}/api/queue/stream`);
      
      eventSourceRef.current = eventSource;

      eventSource.onopen = () => {
        console.log('SSE: Conectado ao stream da fila');
        setIsConnected(true);
        setError(null);
        reconnectAttemptsRef.current = 0;
      };

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          switch (data.type) {
            case 'connected':
              console.log('SSE: Conexão estabelecida');
              break;
            case 'queue_update':
              console.log('🔔 SSE: Atualização da fila recebida, executando callback...');
              setLastUpdate(data.timestamp);
              if (onUpdate) {
                console.log('📞 SSE: Chamando callback de atualização');
                onUpdate();
              }
              break;
            case 'heartbeat':
              // Heartbeat para manter conexão viva
              break;
            default:
              console.log('SSE: Evento desconhecido:', data.type);
          }
        } catch (error) {
          console.error('SSE: Erro ao processar mensagem:', error);
        }
      };

      eventSource.onerror = (event) => {
        console.log('SSE: Conexão interrompida, tentando reconectar...');
        setIsConnected(false);
        
        // Tentar reconectar automaticamente
        if (reconnectAttemptsRef.current < maxReconnectAttempts) {
          const delay = baseReconnectDelay * Math.pow(2, reconnectAttemptsRef.current);
          console.log(`SSE: Tentando reconectar em ${delay}ms (tentativa ${reconnectAttemptsRef.current + 1}/${maxReconnectAttempts})`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttemptsRef.current++;
            connect();
          }, delay);
        } else {
          setError('Falha ao conectar com o servidor. Verifique sua conexão.');
          console.error('SSE: Máximo de tentativas de reconexão atingido');
        }
      };

    } catch (error) {
      console.error('SSE: Erro ao criar EventSource:', error);
      setError('Erro ao estabelecer conexão em tempo real');
      setIsConnected(false);
    }
  }, [cleanup, onUpdate]);

  const reconnect = useCallback(() => {
    reconnectAttemptsRef.current = 0;
    connect();
  }, [connect]);

  useEffect(() => {
    // Conectar quando o componente monta
    connect();

    // Reconectar quando a aba se torna visível
    const handleVisibilityChange = () => {
      if (!document.hidden && !isConnected) {
        console.log('SSE: Aba visível, reconectando...');
        reconnect();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Cleanup quando o componente desmonta
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      cleanup();
    };
  }, [connect, reconnect, isConnected, cleanup]);

  return {
    isConnected,
    lastUpdate,
    error,
    reconnect
  };
}