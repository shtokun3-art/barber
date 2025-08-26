"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Search, Plus, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ListAllBarbers } from "@/app/_components/listAllBarbers";
import { AddBarberModal } from "@/app/_components/addBarberModal";

export const BarbersSettingPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);

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
              <h2 className="text-2xl font-bold text-white mb-2">Gerenciar Barbeiros</h2>
              <p className="text-zinc-400">Gerencie a equipe de profissionais da barbearia</p>
            </div>
            <Button 
              onClick={() => setShowModal(true)}
              className="bg-orange-500 hover:bg-orange-600 text-white"
            >
              <Plus size={18} className="mr-2" />
              Novo Barbeiro
            </Button>
          </div>

          {/* Search Bar */}
          <div className="flex gap-4 items-center bg-zinc-800/50 p-4 rounded-xl border border-zinc-700/50">
            <div className="relative flex-1">
              <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-400" />
              <Input
                type="text"
                placeholder="Buscar barbeiros por nome..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-zinc-700/50 border-zinc-600 text-white placeholder-zinc-400 focus:border-orange-500"
              />
            </div>
          </div>
        </div>

        {/* Barbers List */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-zinc-800/30 rounded-xl border border-zinc-700/50 p-6 h-[calc(100%-200px)] overflow-hidden"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-green-500/20 rounded-lg">
              <Users size={20} className="text-green-500" />
            </div>
            <h3 className="text-xl font-semibold text-white">Barbeiros Cadastrados</h3>
          </div>
          <div className="h-[calc(100%-80px)] overflow-y-auto custom-scrollbar">
            <ListAllBarbers />
          </div>
        </motion.div>
      </motion.div>
      
      {/* Add Barber Modal */}
      <AddBarberModal 
        isOpen={showModal} 
        onClose={() => setShowModal(false)} 
      />
    </div>
  );
};