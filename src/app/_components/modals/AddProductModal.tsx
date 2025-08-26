"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "../spinner";
import { Success } from "../toasts/success";
import { UserNotFounded } from "../toasts/error";
import { useItemsContext } from "@/lib/context/ItemsContext";

interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddProductModal = ({ isOpen, onClose }: AddProductModalProps) => {
  const [name, setName] = useState("");
  const [value, setValue] = useState("");
  const [quantity, setQuantity] = useState("");
  const [error, setError] = useState<string | null>(null);
  const { addItem, loading, refetch } = useItemsContext();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const formattedName = name
      .toLowerCase()
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
      .trim();

    const itemValue = parseFloat(value);
    const itemQuantity = parseInt(quantity);

    if (formattedName.length < 2) {
      setError('O nome do produto deve ter pelo menos 2 caracteres');
      return;
    }
    if (isNaN(itemValue) || itemValue <= 0) {
      setError('O valor deve ser um número positivo');
      return;
    }
    if (isNaN(itemQuantity) || itemQuantity < 0) {
      setError('A quantidade em estoque deve ser um número não negativo');
      return;
    }

    try {
      await addItem(formattedName, itemValue, itemQuantity);
      setName("");
      setValue("");
      setQuantity("");
      setError(null);
      await refetch();
      Success({ text: "Produto Criado Com Sucesso" });
      onClose();
    } catch (err) {
      setError('Erro ao adicionar produto. Tente novamente.');
      UserNotFounded({ error: 'Erro ao adicionar produto' });
    }
  };

  const handleClose = () => {
    setName("");
    setValue("");
    setQuantity("");
    setError(null);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            onClick={handleClose}
          />
          
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="bg-zinc-800 rounded-xl border border-zinc-700/50 p-6 w-full max-w-md">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-500/20 rounded-lg">
                    <Plus size={20} className="text-orange-500" />
                  </div>
                  <h3 className="text-xl font-semibold text-white">Adicionar Produto</h3>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClose}
                  className="text-zinc-400 hover:text-white hover:bg-zinc-700"
                >
                  <X size={20} />
                </Button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="product-name" className="block text-sm font-medium text-zinc-300 mb-2">
                    Nome do Produto
                  </label>
                  <Input
                    id="product-name"
                    placeholder="Ex: Shampoo Anticaspa"
                    className="w-full bg-zinc-700/50 border-zinc-600 text-white placeholder-zinc-400 focus:border-orange-500"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      setError(null);
                    }}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="product-value" className="block text-sm font-medium text-zinc-300 mb-2">
                      Valor (R$)
                    </label>
                    <Input
                      id="product-value"
                      type="number"
                      placeholder="25.00"
                      className="w-full bg-zinc-700/50 border-zinc-600 text-white placeholder-zinc-400 focus:border-orange-500"
                      value={value}
                      onChange={(e) => {
                        setValue(e.target.value);
                        setError(null);
                      }}
                      step="0.01"
                      min="0"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="product-quantity" className="block text-sm font-medium text-zinc-300 mb-2">
                      Estoque
                    </label>
                    <Input
                      id="product-quantity"
                      type="number"
                      placeholder="10"
                      className="w-full bg-zinc-700/50 border-zinc-600 text-white placeholder-zinc-400 focus:border-orange-500"
                      value={quantity}
                      onChange={(e) => {
                        setQuantity(e.target.value);
                        setError(null);
                      }}
                      min="0"
                      required
                    />
                  </div>
                </div>

                {error && (
                  <div className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                    {error}
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleClose}
                    className="flex-1 border-zinc-600 text-zinc-300 hover:bg-zinc-700 hover:text-white"
                    disabled={loading}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 bg-orange-500 hover:bg-orange-600 text-white"
                    disabled={loading || !name || !value || !quantity}
                  >
                    {loading ? (
                      <>
                        <Spinner className="w-4 h-4 mr-2" />
                        Salvando...
                      </>
                    ) : (
                      "Adicionar Produto"
                    )}
                  </Button>
                </div>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};