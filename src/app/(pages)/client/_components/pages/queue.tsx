'use client'

import { useAuth } from "@/lib/AuthContext";
import { motion } from "framer-motion";
import { Plus, Users, Clock, UserCheck } from "lucide-react";
import { useState, useEffect, useMemo, useCallback } from "react";
import { API_URL } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface QueueEntry {
  id: string;
  userId: string;
  barberId: string;
  status: string;
  position: number;
  estimatedTime: number;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    name: string;
    phone: string;
  };
  barber: {
    id: string;
    name: string;
    status: string;
  };
  queueServices: Array<{
    id: string;
    queueId: string;
    serviceId: string;
    service: {
      id: string;
      name: string;
      price: number;
      averageTime: number;
    };
  }>;
}

interface BarberQueueStats {
  barberId: string;
  barberName: string;
  waitingCount: number;
  averageWaitTime: number;
  currentlyServing: QueueEntry | null;
}

interface QueuePageProps {
    setPage: (val:'form' | 'hist' | 'queue') => void
}

export const QueuePage = ({setPage}:QueuePageProps) => {
    const {user} = useAuth();
    const [queueData, setQueueData] = useState<QueueEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedBarberId, setSelectedBarberId] = useState<string | null>(null);
    const router = useRouter();

    useEffect(() => {
        const fetchQueueData = async () => {
            try {
                const response = await fetch(`${window.location.origin}/api/queue`, {
                    credentials: 'include'
                });
                if (response.ok) {
                    const data = await response.json();
                    setQueueData(data);
                    
                    // Auto-seleciona o primeiro barbeiro se nenhum estiver selecionado
                    if (!selectedBarberId && data.length > 0) {
                        const firstBarber = data.find((entry: QueueEntry) => entry.barber)?.barber;
                        if (firstBarber) {
                            setSelectedBarberId(firstBarber.id);
                        }
                    }
                }
            } catch (error) {
                console.error('Erro ao buscar dados da fila:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchQueueData();
        const interval = setInterval(fetchQueueData, 30000);
        return () => clearInterval(interval);
    }, [selectedBarberId]);

    // Obtém lista única de barbeiros
    const getAvailableBarbers = () => {
        const barberMap = new Map<string, { id: string; name: string }>();
        
        queueData.forEach(entry => {
            if (entry.barber && !barberMap.has(entry.barber.id)) {
                barberMap.set(entry.barber.id, {
                    id: entry.barber.id,
                    name: entry.barber.name
                });
            }
        });
        
        return Array.from(barberMap.values());
    };
    
    // Obtém estatísticas do barbeiro selecionado
    const getSelectedBarberStats = useCallback((): BarberQueueStats | null => {
        if (!selectedBarberId) return null;
        
        const barberEntries = queueData.filter(entry => entry.barber?.id === selectedBarberId);
        const selectedBarber = barberEntries[0]?.barber;
        
        if (!selectedBarber) return null;
        
        // Ordenar entradas por data de criação (ordem da fila)
        const sortedEntries = barberEntries
            .filter(entry => entry.status === "waiting" || entry.status === "in_progress")
            .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        
        const waitingEntries = sortedEntries.filter(entry => entry.status === "waiting");
        const currentlyServing = sortedEntries.find(entry => entry.status === "in_progress") || null;
        
        // Calcular tempo de espera específico do usuário logado
        let userEstimatedWaitTime = 0;
        
        if (user?.id) {
            // Encontrar a posição do usuário na fila
            const userQueueEntry = sortedEntries.find(entry => entry.userId === user.id);
            
            if (userQueueEntry) {
                // Somar tempo apenas dos clientes que estão na frente do usuário
                for (const entry of sortedEntries) {
                    // Parar quando chegar no usuário
                    if (entry.userId === user.id) break;
                    
                    // Contar tempo de todos os clientes à frente (incluindo o sendo atendido)
                    if (entry.queueServices) {
                        const entryTime = entry.queueServices.reduce((total, qs) => {
                            return total + (qs.service?.averageTime || 0);
                        }, 0);
                        userEstimatedWaitTime += entryTime;
                    }
                }
            } else {
                // Se o usuário não está na fila, mostrar tempo total da fila
                // Somar tempo de todos os clientes (sendo atendido + aguardando)
                for (const entry of sortedEntries) {
                    if (entry.queueServices) {
                        const entryTime = entry.queueServices.reduce((total, qs) => {
                            return total + (qs.service?.averageTime || 0);
                        }, 0);
                        userEstimatedWaitTime += entryTime;
                    }
                }
            }
        } else {
            // Se não há usuário logado, mostrar tempo total da fila
            // Somar tempo de todos os clientes (sendo atendido + aguardando)
            for (const entry of sortedEntries) {
                if (entry.queueServices) {
                    const entryTime = entry.queueServices.reduce((total, qs) => {
                        return total + (qs.service?.averageTime || 0);
                    }, 0);
                    userEstimatedWaitTime += entryTime;
                }
            }
        }
        
        return {
            barberId: selectedBarber.id,
            barberName: selectedBarber.name,
            waitingCount: waitingEntries.length,
            averageWaitTime: userEstimatedWaitTime,
            currentlyServing
        };
    }, [selectedBarberId, queueData, user]);
    
    const availableBarbers = useMemo(() => getAvailableBarbers(), [queueData]);
    const selectedBarberStats = useMemo(() => getSelectedBarberStats(), [getSelectedBarberStats]);
    
    // Função para converter minutos em formato de horas e minutos
    const formatTime = (minutes: number): string => {
        if (minutes === 0) return '0 min';
        
        const hours = Math.floor(minutes / 60);
        const remainingMinutes = minutes % 60;
        
        if (hours === 0) {
            return `${remainingMinutes} min`;
        } else if (remainingMinutes === 0) {
            return `${hours}h`;
        } else {
            return `${hours}h ${remainingMinutes}min`;
        }
    };



    return(
        <section className="p-4 md:p-6 lg:p-8 space-y-8 max-w-4xl mx-auto">
            {/* Welcome Section */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="text-center space-y-4"
            >
                <div className="space-y-2">
                    <h1 className="text-3xl md:text-4xl font-bold text-zinc-100">
                        Seja Bem-Vindo,{" "}
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-amber-500">
                            {user?.name}!
                        </span>
                    </h1>
                    <p className="text-zinc-400 text-lg md:text-xl">
                        Pronto para um novo visual?
                    </p>
                </div>

                {/* Main CTA Button */}
                <motion.button
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setPage('form')}
                    className="group relative inline-flex items-center gap-3 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-lg px-8 py-4 rounded-2xl shadow-2xl transition-all duration-300 overflow-hidden"
                >
                    <div className="absolute inset-0 bg-gradient-to-r from-orange-400 to-amber-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <Plus size={24} className="relative z-10" />
                    <span className="relative z-10">Entrar na Fila</span>
                    <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 skew-x-12" />
                </motion.button>
            </motion.div>



            {/* Seleção de Barbeiro */}
            <motion.div
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.6 }}
                className="bg-gradient-to-r from-zinc-900/80 to-zinc-800/80 backdrop-blur-sm rounded-2xl p-6 border border-zinc-700/50"
            >
                <div className="flex items-center gap-3 mb-6">
                    <Users className="text-orange-500" size={24} />
                    <h3 className="text-xl font-bold text-zinc-100">Escolha o Barbeiro</h3>
                </div>
                
                {/* Seletor de Barbeiro */}
                {!loading && availableBarbers.length > 0 && (
                    <div className="mb-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                            {availableBarbers.map((barber) => (
                                <button
                                    key={barber.id}
                                    onClick={() => setSelectedBarberId(barber.id)}
                                    className={`p-4 rounded-xl border-2 transition-all duration-300 text-left ${
                                        selectedBarberId === barber.id
                                            ? 'border-orange-500 bg-orange-500/10'
                                            : 'border-zinc-700 hover:border-orange-500/50 bg-zinc-800/30'
                                    }`}
                                >
                                    <h4 className="font-medium text-zinc-100">{barber.name}</h4>
                                </button>
                            ))}
                        </div>
                    </div>
                )}
                
                {/* Informações do Barbeiro Selecionado */}
                {!loading && selectedBarberStats && (
                    <div className="bg-zinc-800/50 rounded-xl p-6 border border-zinc-700/30">
                        <h4 className="text-lg font-semibold text-zinc-200 mb-4">{selectedBarberStats.barberName}</h4>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="text-center">
                                <div className="flex items-center justify-center gap-2 mb-2">
                                    <Users className="text-orange-500" size={20} />
                                    <p className="text-zinc-400 text-sm">Pessoas na fila</p>
                                </div>
                                <p className="text-3xl font-bold text-orange-500">
                                    {selectedBarberStats.waitingCount}
                                </p>
                            </div>
                            
                            <div className="text-center">
                                <div className="flex items-center justify-center gap-2 mb-2">
                                    <Clock className="text-blue-500" size={20} />
                                    <p className="text-zinc-400 text-sm">Tempo estimado</p>
                                </div>
                                <p className="text-3xl font-bold text-blue-500">
                                     {formatTime(Math.ceil(selectedBarberStats.averageWaitTime))}
                                 </p>
                            </div>
                        </div>
                        
                        {selectedBarberStats.waitingCount === 0 && (
                             <div className="mt-4 text-center text-zinc-500 text-sm italic">
                                 Sem clientes na fila
                             </div>
                         )}
                    </div>
                )}
                
                {!loading && availableBarbers.length === 0 && (
                    <div className="text-center py-8">
                        <Users className="mx-auto text-zinc-600 mb-3" size={48} />
                        <p className="text-zinc-400">Nenhum barbeiro disponível no momento</p>
                    </div>
                )}
            </motion.div>
        </section>
    )
}