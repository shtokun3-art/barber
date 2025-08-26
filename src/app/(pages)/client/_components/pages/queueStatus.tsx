'use client'

import { motion } from "framer-motion";
import { Clock, Users, Scissors, DollarSign, LogOut } from "lucide-react";
import { useUserQueue } from "@/lib/hooks/useUserQueue";
import { useCancelQueue } from "@/lib/hooks/useCancelQueue";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export const QueueStatusPage = () => {
    const { queueStatus, loading } = useUserQueue();
    const { cancelQueue, loading: cancelLoading } = useCancelQueue();
    const router = useRouter();

    const handleLeaveQueue = async () => {
        if (!queueStatus.queueId) return;
        
        try {
            await cancelQueue(queueStatus.queueId);
            toast.success("Você saiu da fila com sucesso!");
            // O redirecionamento será feito automaticamente pelo useEffect em page.tsx
            // quando queueStatus.inQueue mudar para false
        } catch (error) {
            toast.error("Erro ao sair da fila. Tente novamente.");
        }
    };



    const formatTime = (minutes: number) => {
        if (minutes < 60) {
            return `${minutes}min`;
        }
        const hours = Math.floor(minutes / 60);
        const remainingMinutes = minutes % 60;
        return `${hours}h ${remainingMinutes}min`;
    };



    if (loading) {
        return (
            <div className="p-4 md:p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
                <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
                        <p className="text-zinc-400">Carregando status da fila...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (!queueStatus.inQueue) {
        return (
            <div className="p-4 md:p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
                <div className="text-center">
                    <p className="text-zinc-400">Você não está na fila</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-6 lg:p-8 max-w-6xl mx-auto space-y-6">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="text-center mb-8"
            >
                <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
                    Status da Fila
                </h1>
                <p className="text-zinc-400">
                    Acompanhe sua posição e tempo estimado
                </p>
            </motion.div>

            {/* Status Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-zinc-800/50 backdrop-blur-sm rounded-2xl p-6 border border-zinc-700/50"
                >
                    <div className="flex items-center gap-3 mb-2">
                        <Users className="text-orange-500" size={24} />
                        <span className="text-zinc-400 text-sm">Posição</span>
                    </div>
                    <p className="text-2xl font-bold text-white">
                        {queueStatus.position}º
                    </p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-zinc-800/50 backdrop-blur-sm rounded-2xl p-6 border border-zinc-700/50"
                >
                    <div className="flex items-center gap-3 mb-2">
                        <Clock className="text-blue-500" size={24} />
                        <span className="text-zinc-400 text-sm">Tempo de Espera</span>
                    </div>
                    <p className="text-2xl font-bold text-white">
                        {formatTime(queueStatus.estimatedWaitTime || 0)}
                    </p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className={`backdrop-blur-sm rounded-2xl p-6 border ${
                        queueStatus.peopleAhead === 0 
                            ? 'bg-green-500/20 border-green-500/50' 
                            : 'bg-zinc-800/50 border-zinc-700/50'
                    }`}
                >
                    {queueStatus.peopleAhead === 0 ? (
                        <>
                            <div className="flex items-center gap-3 mb-2">
                                <Scissors className="text-green-500" size={24} />
                                <span className="text-green-400 text-sm font-medium">É sua vez!</span>
                            </div>
                            <p className="text-2xl font-bold text-green-400">
                                É sua vez de cortar
                            </p>
                        </>
                    ) : (
                        <>
                            <div className="flex items-center gap-3 mb-2">
                                <Users className="text-purple-500" size={24} />
                                <span className="text-zinc-400 text-sm">Pessoas na Frente</span>
                            </div>
                            <p className="text-2xl font-bold text-white">
                                {queueStatus.peopleAhead}
                            </p>
                        </>
                    )}
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="bg-zinc-800/50 backdrop-blur-sm rounded-2xl p-6 border border-zinc-700/50"
                >
                    <div className="flex items-center gap-3 mb-2">
                        <DollarSign className="text-green-500" size={24} />
                        <span className="text-zinc-400 text-sm">Total a Pagar</span>
                    </div>
                    <p className="text-2xl font-bold text-white">
                        R$ {queueStatus.totalPrice?.toFixed(2) || '0.00'}
                    </p>
                </motion.div>
            </div>

            {/* Meus Serviços */}
            {queueStatus.services && queueStatus.services.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="bg-zinc-800/50 backdrop-blur-sm rounded-2xl p-6 border border-zinc-700/50 mb-6"
                >
                    <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                        <Scissors className="text-orange-500" size={20} />
                        Meus Serviços
                    </h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {queueStatus.services.map((service, index) => (
                            <motion.div
                                key={service.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.1 * index }}
                                className="bg-zinc-700/30 rounded-xl p-4 border border-zinc-600/50"
                            >
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="font-medium text-white">{service.name}</h3>
                                        <div className="flex items-center gap-4 mt-2 text-sm text-zinc-400">
                                            <span className="flex items-center gap-1">
                                                <Clock size={14} />
                                                {service.averageTime}min
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <DollarSign size={14} />
                                                R$ {service.price.toFixed(2)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                    
                    <div className="mt-4 pt-4 border-t border-zinc-600/50">
                        <div className="flex justify-between items-center text-lg font-bold">
                            <span className="text-zinc-300">Total:</span>
                            <div className="flex items-center gap-4">
                                <span className="text-blue-400">
                                    {queueStatus.services.reduce((total, service) => total + service.averageTime, 0)}min
                                </span>
                                <span className="text-green-400">
                                    R$ {(queueStatus.totalPrice || 0).toFixed(2)}
                                </span>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}





            {/* Botão Sair da Fila */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="flex justify-center mb-6"
            >
                <motion.button
                    onClick={handleLeaveQueue}
                    disabled={cancelLoading}
                    whileHover={{ 
                        scale: 1.05,
                        boxShadow: "0 0 20px rgba(239, 68, 68, 0.4)"
                    }}
                    whileTap={{ scale: 0.95 }}
                    className="group relative px-4 py-2 text-sm font-medium text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg hover:bg-red-500/20 hover:border-red-500/50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                    <LogOut size={16} className="group-hover:rotate-12 transition-transform duration-300" />
                    {cancelLoading ? "Saindo..." : "Sair da Fila"}
                    
                    {/* Efeito de brilho no hover */}
                    <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-transparent via-red-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-sm" />
                </motion.button>
            </motion.div>

            {/* Atualização automática */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7 }}
                className="text-center text-sm text-zinc-500"
            >
                <p>🔄 Atualizando automaticamente a cada 30 segundos</p>
            </motion.div>
        </div>
    );
};