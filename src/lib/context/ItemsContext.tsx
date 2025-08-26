import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { API_URL } from '../utils';

interface Item {
  id: string;
  item: string;
  value: number;
  qtd: number;
  createdAt: string;
  updatedAt: string;
}

interface ItemsContextType {
  items: Item[];
  loading: boolean;
  error: string | null;
  deletingItemId: string | null;
  updatingItemId: string | null;
  addItem: (item: string, value: number, stockQuantity: number) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
  updateItem: (id: string, item: string, value: number, qtd: number) => Promise<void>;
  refetch: () => Promise<void>;
}

const ItemsContext = createContext<ItemsContextType | undefined>(undefined);

export const ItemsProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletingItemId, setDeletingItemId] = useState<string | null>(null);
  const [updatingItemId, setUpdatingItemId] = useState<string | null>(null);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const baseUrl = window.location.origin;
      const response = await fetch(`${baseUrl}/api/items`);
      if (!response.ok) throw new Error('Erro ao carregar itens');
      const data = await response.json();
      setItems(data);
      setError(null);
    } catch (err) {
      setError('Erro ao carregar itens');
    } finally {
      setLoading(false);
    }
  };

  const addItem = async (item: string, value: number, qtd: number) => {
    setLoading(true);
    try {
      const baseUrl = window.location.origin;
      const response = await fetch(`${baseUrl}/api/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ item, value, qtd }),
      });
      if (!response.ok) throw new Error('Erro ao adicionar item');
      const newItem = await response.json();
      setItems((prev) => [...prev, newItem]);
      setError(null);
    } catch (err) {
      setError('Erro ao adicionar item');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteItem = async (id: string) => {
    setDeletingItemId(id);
    try {
      const baseUrl = window.location.origin;
      const response = await fetch(`${baseUrl}/api/items/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Erro ao deletar item');
      setItems((prev) => prev.filter((item) => item.id !== id));
      setError(null);
    } catch (err) {
      setError('Erro ao deletar item');
      throw err;
    } finally {
      setDeletingItemId(null);
    }
  };

  const updateItem = async (id: string, item: string, value: number, qtd: number) => {
    setUpdatingItemId(id);
    try {
      const baseUrl = window.location.origin;
      const response = await fetch(`${baseUrl}/api/items/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ item, value, qtd }),
      });
      if (!response.ok) throw new Error('Erro ao atualizar item');
      const updatedItem = await response.json();
      setItems((prev) => prev.map((i) => i.id === id ? updatedItem : i));
      setError(null);
    } catch (err) {
      setError('Erro ao atualizar item');
      throw err;
    } finally {
      setUpdatingItemId(null);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  return (
    <ItemsContext.Provider
      value={{ items, loading, error, deletingItemId, updatingItemId, addItem, deleteItem, updateItem, refetch: fetchItems }}
    >
      {children}
    </ItemsContext.Provider>
  );
};

export const useItemsContext = () => {
  const context = useContext(ItemsContext);
  if (!context) {
    throw new Error('useItemsContext deve ser usado dentro de um ItemsProvider');
  }
  return context;
};