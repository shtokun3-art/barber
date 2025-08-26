"use client";

import { useState, useMemo } from "react";
import { Search, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Spinner } from "../spinner";
import { UserList } from "../userList";
import { useUsersContext } from "@/lib/context/UserContext";
import { useUsersInQueue } from "@/lib/hooks/useUsersInQueue";

export const ClientsList = () => {
  const { users, loading, refetch } = useUsersContext();
  const { isUserInQueue, loading: queueLoading } = useUsersInQueue();
  const [searchTerm, setSearchTerm] = useState('');
  const [visibleCount, setVisibleCount] = useState(5);

  // Filtrar usuários por nome e excluir os que já estão na fila e admins
  const filteredUsers = useMemo(() => {
    // Primeiro, filtrar usuários que NÃO estão na fila e NÃO são admin
    const usersNotInQueueAndNotAdmin = users.filter(user => 
      !isUserInQueue(user.id) && user.role !== 'admin'
    );
    
    // Depois, aplicar filtro de pesquisa por nome
    if (!searchTerm.trim()) return usersNotInQueueAndNotAdmin;
    return usersNotInQueueAndNotAdmin.filter(user => 
      user.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [users, searchTerm, isUserInQueue]);

  // Usuários visíveis baseado na paginação
  const visibleUsers = useMemo(() => {
    return filteredUsers.slice(0, visibleCount);
  }, [filteredUsers, visibleCount]);

  // Verificar se há mais usuários para mostrar
  const hasMoreUsers = filteredUsers.length > visibleCount;

  // Função para carregar mais usuários
  const loadMoreUsers = () => {
    setVisibleCount(prev => prev + 5);
  };

  // Reset da paginação quando o termo de busca muda
  useMemo(() => {
    setVisibleCount(5);
  }, [searchTerm]);

  return (
    <div className="flex flex-col h-full w-full">
      {/* Campo de pesquisa */}
      <div className="glass-card-dark p-4 rounded-xl mb-4 flex-shrink-0">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-400" size={20} />
          <input
            type="text"
            placeholder="Pesquisar por nome..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-zinc-800/50 border border-zinc-700 rounded-lg text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200"
          />
        </div>
        {searchTerm && (
          <p className="mt-2 text-sm text-zinc-400">
            {filteredUsers.length} usuário(s) encontrado(s)
          </p>
        )}
        {!searchTerm && filteredUsers.length > 0 && (
          <p className="mt-2 text-sm text-zinc-400">
            Mostrando {visibleUsers.length} de {filteredUsers.length} usuários
          </p>
        )}
      </div>

      {/* Lista de usuários com scroll independente */}
      <div className="flex-1 min-h-0">
        <div className="h-full overflow-y-auto custom-scrollbar pr-2">
          {(loading || queueLoading) ? (
            <div className="flex justify-center items-center h-32">
              <Spinner />
            </div>
          ) : filteredUsers.length > 0 ? (
            <>
              <div className="space-y-2">
                {visibleUsers.map((user) => (
                  <UserList key={user.id} user={user} />
                ))}
              </div>
              {hasMoreUsers && (
                <div className="flex justify-center mt-4 pb-4">
                  <Button
                    onClick={loadMoreUsers}
                    className="btn-glass hover:bg-white/10 flex items-center gap-2 px-6 py-3 rounded-lg transition-all duration-200"
                  >
                    <span>Ver mais</span>
                    <ChevronDown size={16} />
                  </Button>
                </div>
              )}
            </>
          ) : (
            <div className="glass-card-dark p-8 rounded-xl text-center">
              <Search className="mx-auto mb-4 text-zinc-500" size={48} />
              <h3 className="text-lg font-semibold text-zinc-300 mb-2">
                {searchTerm ? 'Nenhum usuário encontrado' : 'Nenhum usuário cadastrado'}
              </h3>
              <p className="text-zinc-500">
                {searchTerm 
                  ? `Não encontramos usuários com o nome "${searchTerm}"` 
                  : 'Ainda não há usuários cadastrados no sistema'
                }
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};