import { Button } from "@/components/ui/button";
import { Spinner } from "../spinner";
import { useBarbersContext } from "@/lib/context/BarbersContext";
import { Trash2, Users, UserX, Edit3, Percent } from "lucide-react";
import { useState } from "react";
import { EditBarberModal } from "../editBarberModal";

export const ListAllBarbers = () => {
  const { 
    barbers, 
    loading, 
    toggleBarberStatus, 
    toggleQueueStatus,
    deleteBarber,
    togglingBarberId,
    togglingQueueId,
    deletingBarberId 
  } = useBarbersContext();
  
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [editingBarber, setEditingBarber] = useState<any>(null);

  return (
    <div className="w-full space-y-3">
      {loading ? (
        <div className="flex justify-center py-8">
          <Spinner className="w-6 h-6" />
        </div>
      ) : barbers.length === 0 ? (
        <div className="text-center py-8 text-zinc-400">
          <p>Nenhum barbeiro cadastrado</p>
        </div>
      ) : (
        barbers.map((barber) => {
          const isToggling = togglingBarberId === barber.id;
          const isTogglingQueue = togglingQueueId === barber.id;
          const isDeleting = deletingBarberId === barber.id;
          const isActive = barber.status === "active";
          const isQueueOpen = barber.queueStatus === "open";
          const isConfirmingDelete = confirmDelete === barber.id;

          const handleDeleteClick = () => {
            if (isConfirmingDelete) {
              deleteBarber(barber.id);
              setConfirmDelete(null);
            } else {
              setConfirmDelete(barber.id);
              // Auto-cancel confirmation after 3 seconds
              setTimeout(() => setConfirmDelete(null), 3000);
            }
          };

          return (
            <div
              key={barber.id}
              className="bg-zinc-800/50 rounded-lg p-4 border border-zinc-700/50 hover:border-zinc-600/50 transition-colors"
            >
              <div className="flex flex-col gap-4">
                {/* Header with name and status */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {/* Status Indicator */}
                    <div className="relative">
                      {isActive ? (
                        <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse shadow-lg shadow-green-500/50"></div>
                      ) : (
                        <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse shadow-lg shadow-red-500/50"></div>
                      )}
                    </div>
                    
                    {/* Barber Name */}
                    <span className="text-white font-medium">{barber.name}</span>
                    
                    {/* Status Badges */}
                    <div className="flex gap-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        isActive 
                          ? "bg-green-500/20 text-green-400 border border-green-500/30" 
                          : "bg-red-500/20 text-red-400 border border-red-500/30"
                      }`}>
                        {isActive ? "Ativo" : "Inativo"}
                      </span>
                      
                      {isActive && (
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          isQueueOpen 
                            ? "bg-blue-500/20 text-blue-400 border border-blue-500/30" 
                            : "bg-orange-500/20 text-orange-400 border border-orange-500/30"
                        }`}>
                          Fila {isQueueOpen ? "Aberta" : "Fechada"}
                        </span>
                      )}
                      
                      {/* Commission Badge */}
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-500/20 text-purple-400 border border-purple-500/30 flex items-center gap-1">
                        <Percent className="w-3 h-3" />
                        {(barber.commissionRate * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2 flex-wrap">
                  {/* Edit Button */}
                  <Button
                    onClick={() => setEditingBarber(barber)}
                    disabled={isDeleting || isToggling || isTogglingQueue}
                    className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed px-3 py-2 text-sm"
                    aria-label="Editar barbeiro"
                  >
                    <div className="flex items-center gap-2">
                      <Edit3 className="w-4 h-4" />
                      <span>Editar</span>
                    </div>
                  </Button>
                  {/* Activate/Deactivate Button */}
                  {isActive ? (
                    <Button
                      onClick={() => toggleBarberStatus(barber.id, barber.status)}
                      disabled={isToggling || isDeleting}
                      className="bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed px-3 py-2 text-sm"
                      aria-label="Desativar barbeiro"
                    >
                      {isToggling ? (
                        <div className="flex items-center gap-2">
                          <Spinner className="w-4 h-4" />
                          <span className="text-xs">Desativando...</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <UserX className="w-4 h-4" />
                          <span>Desativar</span>
                        </div>
                      )}
                    </Button>
                  ) : (
                    <Button
                      onClick={() => toggleBarberStatus(barber.id, barber.status)}
                      disabled={isToggling || isDeleting}
                      className="bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed px-3 py-2 text-sm"
                      aria-label="Ativar barbeiro"
                    >
                      {isToggling ? (
                        <div className="flex items-center gap-2">
                          <Spinner className="w-4 h-4" />
                          <span className="text-xs">Ativando...</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4" />
                          <span>Ativar</span>
                        </div>
                      )}
                    </Button>
                  )}

                  {/* Queue Control Button (only for active barbers) */}
                  {isActive && (
                    <Button
                      onClick={() => toggleQueueStatus(barber.id, barber.queueStatus)}
                      disabled={isTogglingQueue || isDeleting}
                      className={`${
                        isQueueOpen 
                          ? "bg-orange-600 hover:bg-orange-700" 
                          : "bg-blue-600 hover:bg-blue-700"
                      } disabled:opacity-50 disabled:cursor-not-allowed px-3 py-2 text-sm`}
                      aria-label={isQueueOpen ? "Fechar fila" : "Abrir fila"}
                    >
                      {isTogglingQueue ? (
                        <div className="flex items-center gap-2">
                          <Spinner className="w-4 h-4" />
                          <span className="text-xs">{isQueueOpen ? "Fechando..." : "Abrindo..."}</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4" />
                          <span>{isQueueOpen ? "Fechar Fila" : "Abrir Fila"}</span>
                        </div>
                      )}
                    </Button>
                  )}

                  {/* Delete Button */}
                  <Button
                    onClick={handleDeleteClick}
                    disabled={isDeleting || isToggling || isTogglingQueue}
                    className={`${
                      isConfirmingDelete 
                        ? "bg-red-700 hover:bg-red-800 animate-pulse" 
                        : "bg-zinc-600 hover:bg-red-600"
                    } disabled:opacity-50 disabled:cursor-not-allowed px-3 py-2 text-sm transition-all`}
                    aria-label={isConfirmingDelete ? "Confirmar exclusão" : "Excluir barbeiro"}
                  >
                    {isDeleting ? (
                      <div className="flex items-center gap-2">
                        <Spinner className="w-4 h-4" />
                        <span className="text-xs">Excluindo...</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Trash2 className="w-4 h-4" />
                        <span>{isConfirmingDelete ? "Confirmar" : "Excluir"}</span>
                      </div>
                    )}
                  </Button>
                </div>

                {/* Warning message for delete confirmation */}
                {isConfirmingDelete && (
                  <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                    <p className="text-red-400 text-sm">
                      ⚠️ Clique novamente em "Confirmar" para excluir permanentemente este barbeiro.
                    </p>
                  </div>
                )}
              </div>
            </div>
          );
        })
      )}
      
      {/* Edit Barber Modal */}
      <EditBarberModal
        isOpen={!!editingBarber}
        onClose={() => setEditingBarber(null)}
        barber={editingBarber}
      />
    </div>
  );
};