"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "../spinner";
import { useItemsContext } from "@/lib/context/ItemsContext";

interface Item {
  id: string;
  item: string;
  value: number;
  qtd: number;
}

interface EditItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: Item | null;
}

export const EditItemModal = ({ isOpen, onClose, item }: EditItemModalProps) => {
  const [itemName, setItemName] = useState("");
  const [itemValue, setItemValue] = useState("");
  const [qtd, setQtd] = useState("");
  const [error, setError] = useState<string | null>(null);

  const { updateItem, updatingItemId } = useItemsContext();
  const isUpdating = updatingItemId === item?.id;

  useEffect(() => {
    if (item && isOpen) {
      setItemName(item.item);
      setItemValue(item.value.toString());
      setQtd(item.qtd.toString());
      setError(null);
    }
  }, [item, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!item) return;

    const formattedName = itemName
      .toLowerCase()
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ")
      .trim();

    const value = parseFloat(itemValue);
    const quantity = parseInt(qtd);

    if (formattedName.length < 2) {
      setError("O nome do item deve ter pelo menos 2 caracteres");
      return;
    }
    if (isNaN(value) || value <= 0) {
      setError("O valor deve ser um número positivo");
      return;
    }
    if (isNaN(quantity) || quantity < 0) {
      setError("A quantidade em estoque deve ser um número não negativo");
      return;
    }

    try {
      await updateItem(item.id, formattedName, value, quantity);
      setError(null);
      onClose();
    } catch (err) {
      setError("Erro ao atualizar item. Tente novamente.");
    }
  };

  const handleClose = () => {
    if (!isUpdating) {
      onClose();
      setError(null);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={handleClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative bg-zinc-800 rounded-xl border border-zinc-700/50 p-6 w-full max-w-md mx-4 shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-500/20 rounded-lg">
                  <Edit size={20} className="text-orange-500" />
                </div>
                <h2 className="text-xl font-semibold text-white">Editar Produto</h2>
              </div>
              <Button
                onClick={handleClose}
                disabled={isUpdating}
                className="p-2 bg-transparent hover:bg-zinc-700 text-zinc-400 hover:text-white"
              >
                <X size={18} />
              </Button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Nome do Produto
                </label>
                <Input
                  value={itemName}
                  onChange={(e) => {
                    setItemName(e.target.value);
                    setError(null);
                  }}
                  placeholder="Nome do Item"
                  disabled={isUpdating}
                  className="bg-zinc-700 border-zinc-600 text-white placeholder-zinc-400 focus:border-orange-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    Valor (R$)
                  </label>
                  <Input
                    type="number"
                    value={itemValue}
                    onChange={(e) => {
                      setItemValue(e.target.value);
                      setError(null);
                    }}
                    placeholder="0,00"
                    disabled={isUpdating}
                    step="0.01"
                    className="bg-zinc-700 border-zinc-600 text-white placeholder-zinc-400 focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    Estoque
                  </label>
                  <Input
                    type="number"
                    value={qtd}
                    onChange={(e) => {
                      setQtd(e.target.value);
                      setError(null);
                    }}
                    placeholder="0"
                    disabled={isUpdating}
                    min="0"
                    className="bg-zinc-700 border-zinc-600 text-white placeholder-zinc-400 focus:border-orange-500"
                  />
                </div>
              </div>

              {error && (
                <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  onClick={handleClose}
                  disabled={isUpdating}
                  className="flex-1 bg-zinc-700 hover:bg-zinc-600 text-white"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={isUpdating || itemName.length < 2 || !itemValue || !qtd}
                  className="flex-1 bg-orange-600 hover:bg-orange-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUpdating ? (
                    <div className="flex items-center gap-2">
                      <Spinner className="w-4 h-4" />
                      <span>Salvando...</span>
                    </div>
                  ) : (
                    "Salvar Alterações"
                  )}
                </Button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};