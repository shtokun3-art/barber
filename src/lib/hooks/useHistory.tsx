import { useState, useEffect } from "react";
import { API_URL } from "@/lib/utils";

interface Service {
  id: string;
  name: string;
  price: number;
  averageTime: number;
}

interface HistoryService {
  id: string;
  historyId: string;
  serviceId: string;
  isExtra: boolean;
  createdAt: string;
  service: Service;
}

interface Item {
  id: string;
  item: string;
  value: number;
}

interface HistoryItem {
  id: string;
  historyId: string;
  itemId: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  createdAt: string;
  item: Item;
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

export interface HistoryEntry {
  id: string;
  userId: string;
  barberId: string;
  totalValue: number;
  paymentMethod: string;
  installments: number;
  feeRate: number;
  feeAmount: number;
  netAmount: number | null;
  createdAt: string;
  user: User;
  barber: Barber;
  services: HistoryService[];
  items: HistoryItem[];
}

export const useHistory = (shouldFetch: boolean = true) => {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [hasLoaded, setHasLoaded] = useState<boolean>(false);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const baseUrl = window.location.origin;
      const response = await fetch(`${baseUrl}/api/history`, {
        credentials: "include",
      });
      
      if (!response.ok) {
        throw new Error(`Erro ao buscar histórico: ${response.status} ${response.statusText}`);
      }
      
      const data: HistoryEntry[] = await response.json();
      setHistory(data);
      setError(null);
      setHasLoaded(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Só carregar quando shouldFetch for true e ainda não tiver carregado
    if (shouldFetch && !hasLoaded) {
      fetchHistory();
    }
  }, [shouldFetch, hasLoaded]);

  return {
    history,
    loading,
    error,
    hasLoaded,
    refetch: fetchHistory,
  };
};