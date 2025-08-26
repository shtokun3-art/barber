"use client";

import { useState } from "react";
import { Users, UserPlus } from "lucide-react";
import { ClientsList } from "../../clientsList";
import { CreateClientModal } from "../../modals/CreateClientModal";

export const ClientsAdmin = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  interface Client {
    id: string;
    name: string;
    phone: string;
    email?: string;
  }

  const handleClientCreated = (client: Client) => {
    // Força a atualização da lista de clientes
    setRefreshKey(prev => prev + 1);
  };

  return (
    <section className="w-full h-full flex flex-col px-4 lg:px-6 py-2">
      {/* Header compacto */}
      <header className="glass-card-dark p-4 lg:p-6 rounded-xl mb-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-primary shadow-glow">
              <Users size={20} className="text-white"/>
            </div>
            <div>
              <h1 className="text-xl lg:text-2xl font-bold text-gradient-primary">Clientes</h1>
              <p className="text-zinc-400 text-sm hidden sm:block">Gerencie usuários e adicione à fila</p>
            </div>
          </div>

          {/* Botão para criar cliente */}
          <div className="flex gap-2">
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg hover:from-orange-600 hover:to-orange-700 transition-all duration-200 font-semibold shadow-lg"
            >
              <UserPlus size={16} />
              <span className="hidden sm:inline">Criar Cliente</span>
              <span className="sm:hidden">Novo</span>
            </button>
          </div>
        </div>
      </header>

      {/* Conteúdo principal */}
      <main className="flex-1 w-full min-h-0">
        <ClientsList key={refreshKey} />
      </main>

      {/* Modal de criação de cliente */}
      <CreateClientModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onClientCreated={handleClientCreated}
      />
    </section>
  );
};