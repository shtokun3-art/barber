"use client";

import { motion } from "framer-motion";
import { ShoppingBag, Plus, Search } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ListAllItems } from "@/app/_components/listAllItems";
import { AddProductModal } from "@/app/_components/modals/AddProductModal";

export const ProductsSettingPage = () => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  return (
    <div className="w-full h-full p-6 overflow-y-auto">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="max-w-7xl mx-auto"
      >
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">Gerenciar Produtos</h2>
              <p className="text-zinc-400">Controle o estoque e adicione novos produtos para venda</p>
            </div>
            <Button 
              onClick={() => setIsAddModalOpen(true)}
              className="bg-orange-600 hover:bg-orange-700 text-white"
            >
              <Plus size={18} className="mr-2" />
              Novo Produto
            </Button>
          </div>

          {/* Search Bar */}
          <div className="flex gap-4 items-center bg-zinc-800/50 p-4 rounded-xl border border-zinc-700/50">
            <div className="relative flex-1">
              <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-400" />
              <Input
                type="text"
                placeholder="Buscar produtos por nome..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-zinc-700/50 border-zinc-600 text-white placeholder-zinc-400 focus:border-orange-500"
              />
            </div>
          </div>
        </div>

        {/* Add Product Modal */}
        <AddProductModal 
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
        />

        {/* Products List */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-zinc-800/30 rounded-xl border border-zinc-700/50 p-6 h-[calc(100%-200px)] overflow-hidden"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-orange-500/20 rounded-lg">
              <ShoppingBag size={20} className="text-orange-500" />
            </div>
            <h3 className="text-xl font-semibold text-white">Produtos Cadastrados</h3>
          </div>
          <div className="h-[calc(100%-80px)] overflow-y-auto custom-scrollbar">
            <ListAllItems searchTerm={searchTerm} />
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};