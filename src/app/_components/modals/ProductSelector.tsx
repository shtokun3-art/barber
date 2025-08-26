"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Plus, ShoppingBag, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useItemsContext } from "@/lib/context/ItemsContext";
import { Spinner } from "../spinner";

interface Item {
  id: string;
  item: string;
  value: number;
  qtd: number;
  createdAt: string;
  updatedAt: string;
}

interface SelectedProduct {
  id: string;
  name: string;
  price: number;
  quantity: number;
  totalPrice: number;
}

interface ProductSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  selectedProducts: SelectedProduct[];
  onProductsChange: (products: SelectedProduct[]) => void;
  pauseUpdates?: () => void;
  resumeUpdates?: () => void;
}

export const ProductSelector = ({
  isOpen,
  onClose,
  selectedProducts,
  onProductsChange,
  pauseUpdates,
  resumeUpdates
}: ProductSelectorProps) => {
  const { items, loading } = useItemsContext();
  const [searchTerm, setSearchTerm] = useState("");

  // Pausar/retomar atualizações quando modal abrir/fechar
  useEffect(() => {
    if (isOpen) {
      pauseUpdates?.();
    } else {
      resumeUpdates?.();
    }
    
    // Cleanup: sempre retomar updates quando componente desmontar
    return () => {
      if (isOpen) {
        resumeUpdates?.();
      }
    };
  }, [isOpen, pauseUpdates, resumeUpdates]);

  // Filtrar produtos por termo de busca
  const filteredProducts = items.filter(item =>
    item.item.toLowerCase().includes(searchTerm.toLowerCase())
  ).sort((a, b) => a.item.toLowerCase().localeCompare(b.item.toLowerCase()));

  // Adicionar produto à seleção
  const handleAddProduct = (item: Item) => {
    if (item.qtd <= 0) return; // Não permite adicionar se estoque zerado

    const existingProduct = selectedProducts.find(p => p.id === item.id);
    
    if (existingProduct) {
      // Se já existe, incrementa a quantidade (respeitando o estoque)
      if (existingProduct.quantity < item.qtd) {
        const updatedProducts = selectedProducts.map(p =>
          p.id === item.id
            ? {
                ...p,
                quantity: p.quantity + 1,
                totalPrice: (p.quantity + 1) * p.price
              }
            : p
        );
        onProductsChange(updatedProducts);
      }
    } else {
      // Se não existe, adiciona novo produto
      const newProduct: SelectedProduct = {
        id: item.id,
        name: item.item,
        price: item.value,
        quantity: 1,
        totalPrice: item.value
      };
      onProductsChange([...selectedProducts, newProduct]);
    }
  };

  // Remover produto da seleção
  const handleRemoveProduct = (productId: string) => {
    const updatedProducts = selectedProducts.filter(p => p.id !== productId);
    onProductsChange(updatedProducts);
  };

  // Diminuir quantidade do produto
  const handleDecreaseQuantity = (productId: string) => {
    const updatedProducts = selectedProducts.map(p => {
      if (p.id === productId) {
        if (p.quantity > 1) {
          return {
            ...p,
            quantity: p.quantity - 1,
            totalPrice: (p.quantity - 1) * p.price
          };
        } else {
          return null; // Será filtrado abaixo
        }
      }
      return p;
    }).filter(Boolean) as SelectedProduct[];
    
    onProductsChange(updatedProducts);
  };

  // Verificar se produto pode ser adicionado
  const canAddProduct = (item: Item) => {
    if (item.qtd <= 0) return false;
    const selectedProduct = selectedProducts.find(p => p.id === item.id);
    return !selectedProduct || selectedProduct.quantity < item.qtd;
  };

  // Calcular total dos produtos selecionados
  const totalProductsValue = selectedProducts.reduce((total, product) => total + product.totalPrice, 0);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
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
            onClick={onClose}
          />
          
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, x: 300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 300 }}
            className="fixed right-0 top-0 h-full w-96 bg-zinc-800 border-l border-zinc-700/50 shadow-xl z-50 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-zinc-700/50">
              <div className="flex items-center gap-2">
                <ShoppingBag className="h-5 w-5 text-orange-500" />
                <h3 className="text-lg font-semibold text-white">Adicionar Produtos</h3>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="h-8 w-8 p-0 text-zinc-400 hover:text-white hover:bg-zinc-700"
              >
                ×
              </Button>
            </div>

            {/* Search Bar */}
            <div className="p-4 border-b border-zinc-700/50">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-zinc-400" />
                <Input
                  type="text"
                  placeholder="Buscar produtos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-zinc-700/50 border-zinc-600 text-white placeholder-zinc-400 focus:border-orange-500"
                />
              </div>
            </div>

            {/* Products List */}
            <div className="flex-1 overflow-y-auto p-4">
              {loading ? (
                <div className="flex items-center justify-center h-32">
                  <Spinner className="h-6 w-6" />
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredProducts.length === 0 ? (
                    <div className="text-center py-8 text-zinc-400">
                      <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>Nenhum produto encontrado</p>
                    </div>
                  ) : (
                    filteredProducts.map((item) => {
                      const selectedProduct = selectedProducts.find(p => p.id === item.id);
                      const isOutOfStock = item.qtd <= 0;
                      const canAdd = canAddProduct(item);
                      
                      return (
                        <div
                          key={item.id}
                          className={`p-3 rounded-lg border transition-colors ${
                            isOutOfStock
                              ? 'bg-zinc-700/30 border-zinc-600/50 opacity-50'
                              : 'bg-zinc-700/50 border-zinc-600 hover:border-orange-500/50'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <h4 className={`font-medium ${
                                isOutOfStock ? 'text-zinc-500' : 'text-white'
                              }`}>
                                {item.item}
                              </h4>
                              <div className="flex items-center gap-4 mt-1 text-sm">
                                <span className={isOutOfStock ? 'text-zinc-500' : 'text-green-400'}>
                                  {formatCurrency(item.value)}
                                </span>
                                <span className={`text-xs ${
                                  isOutOfStock ? 'text-red-400' : 'text-zinc-400'
                                }`}>
                                  Estoque: {item.qtd}
                                </span>
                              </div>
                              {selectedProduct && (
                                <div className="mt-2 text-xs text-orange-400">
                                  Selecionado: {selectedProduct.quantity}x
                                </div>
                              )}
                            </div>
                            <Button
                              size="sm"
                              onClick={() => handleAddProduct(item)}
                              disabled={!canAdd}
                              className={`h-8 w-8 p-0 ${
                                canAdd
                                  ? 'bg-orange-500 hover:bg-orange-600 text-white'
                                  : 'bg-zinc-600 text-zinc-400 cursor-not-allowed'
                              }`}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>

            {/* Selected Products Summary */}
            {selectedProducts.length > 0 && (
              <div className="border-t border-zinc-700/50 p-4 bg-zinc-800/50">
                <h4 className="font-medium text-white mb-3">Produtos Selecionados</h4>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {selectedProducts.map((product) => (
                    <div key={product.id} className="flex items-center justify-between text-sm">
                      <div className="flex-1">
                        <span className="text-white">{product.name}</span>
                        <div className="text-zinc-400">
                          {product.quantity}x {formatCurrency(product.price)}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-green-400 font-medium">
                          {formatCurrency(product.totalPrice)}
                        </span>
                        <div className="flex items-center gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDecreaseQuantity(product.id)}
                            className="h-6 w-6 p-0 border-zinc-600 text-zinc-400 hover:bg-zinc-700"
                          >
                            -
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRemoveProduct(product.id)}
                            className="h-6 w-6 p-0 border-red-600 text-red-400 hover:bg-red-600/20"
                          >
                            ×
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-3 pt-3 border-t border-zinc-700/50">
                  <div className="flex justify-between items-center font-semibold">
                    <span className="text-white">Total Produtos:</span>
                    <span className="text-green-400 text-lg">
                      {formatCurrency(totalProductsValue)}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};