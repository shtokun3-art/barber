import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Edit, Trash2 } from 'lucide-react';
import { Spinner } from '../spinner';
import { useItemsContext } from '@/lib/context/ItemsContext';
import { EditItemModal } from '../editItemModal';

interface Item {
  id: string;
  item: string;
  value: number;
  qtd: number;
  createdAt: string;
  updatedAt: string;
}

interface ListAllItemsProps {
  searchTerm?: string;
}

export const ListAllItems = ({ searchTerm = "" }: ListAllItemsProps) => {
  const { items, loading, deleteItem, deletingItemId } = useItemsContext();
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Filtrar e ordenar itens por ordem alfabética
  const filteredAndSortedItems = [...items]
    .filter(item => 
      item.item.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => 
      a.item.toLowerCase().localeCompare(b.item.toLowerCase())
    );

  const handleEditClick = (item: Item) => {
    setEditingItem(item);
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setEditingItem(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="flex items-center gap-2">
          <Spinner className="w-6 h-6" />
          <span className="text-zinc-400">Carregando produtos...</span>
        </div>
      </div>
    );
  }

  if (filteredAndSortedItems.length === 0 && searchTerm) {
    return (
      <div className="text-center py-8">
        <p className="text-zinc-500">Nenhum produto encontrado para &quot;{searchTerm}&quot;</p>
      </div>
    );
  }

  if (filteredAndSortedItems.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-zinc-500">Nenhum produto encontrado</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {filteredAndSortedItems.map((item) => {
          const isDeleting = deletingItemId === item.id;
          
          return (
            <div
              key={item.id}
              className="bg-zinc-700/50 rounded-lg p-4 border border-zinc-600/50 hover:border-zinc-500/50 transition-all duration-200"
            >
              <div className="flex items-center justify-between">
                {/* Nome do Produto */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-white truncate">{item.item}</h3>
                </div>

                {/* Valor */}
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-green-400 font-semibold">
                      R$ {item.value.toFixed(2)}
                    </p>
                    <p className="text-xs text-zinc-400">Valor</p>
                  </div>

                  {/* Estoque */}
                  <div className="text-right">
                    <p className="text-blue-400 font-semibold">{item.qtd}</p>
                    <p className="text-xs text-zinc-400">Estoque</p>
                  </div>

                  {/* Botões de Ação */}
                  <div className="flex items-center gap-2">
                    {/* Botão Editar */}
                    <Button
                      onClick={() => handleEditClick(item)}
                      disabled={isDeleting}
                      className="bg-orange-600 hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed p-2"
                      aria-label={`Editar ${item.item}`}
                    >
                      <Edit size={16} />
                    </Button>

                    {/* Botão Excluir */}
                    <Button
                      onClick={() => deleteItem(item.id)}
                      disabled={isDeleting}
                      className="bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed p-2"
                      aria-label={`Excluir ${item.item}`}
                    >
                      {isDeleting ? (
                        <Spinner className="w-4 h-4" />
                      ) : (
                        <Trash2 size={16} />
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal de Edição */}
      <EditItemModal
        isOpen={isEditModalOpen}
        onClose={handleCloseEditModal}
        item={editingItem}
      />
    </>
  );
};