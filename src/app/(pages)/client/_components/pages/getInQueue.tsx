'use client'

import { useState, useEffect, useMemo, useCallback, memo } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Scissors, Clock, DollarSign, Check } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { useUserQueue } from "@/lib/hooks/useUserQueue";
import { API_URL } from "@/lib/utils";
import { toast } from "sonner";

interface GetInQueueProps {
    onBack?: () => void;
    onSuccess?: () => void;
}

export const GetInQueue = memo(({ onBack, onSuccess }: GetInQueueProps) => {
    const { user } = useAuth();
    const { addToQueue } = useUserQueue();
    const [selectedServices, setSelectedServices] = useState<string[]>([]);
    const [selectedBarber, setSelectedBarber] = useState<string>("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [services, setServices] = useState<any[]>([]);
    const [barbers, setBarbers] = useState<any[]>([]);
    const [loadingData, setLoadingData] = useState(true);

    const toggleService = useCallback((serviceId: string) => {
        setSelectedServices(prev => 
            prev.includes(serviceId) 
                ? prev.filter(id => id !== serviceId)
                : [...prev, serviceId]
        );
    }, []);

    const totalPrice = useMemo(() => {
        return selectedServices.reduce((total, serviceId) => {
            const service = services.find(s => s.id === serviceId);
            return total + (service?.price || 0);
        }, 0);
    }, [selectedServices, services]);

    const totalTime = useMemo(() => {
        return selectedServices.reduce((total, serviceId) => {
            const service = services.find(s => s.id === serviceId);
            return total + (service?.averageTime || 0);
        }, 0);
    }, [selectedServices, services]);

    // Carregar dados da API
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoadingData(true);
                
                // Buscar serviços
                const servicesResponse = await fetch(`${window.location.origin}/api/services`, {
                    credentials: "include",
                });
                
                // Buscar barbeiros
                const barbersResponse = await fetch(`${window.location.origin}/api/barbers`, {
                    credentials: "include",
                });
                
                if (servicesResponse.ok) {
                    const servicesData = await servicesResponse.json();
                    setServices(servicesData);
                }
                
                if (barbersResponse.ok) {
                    const barbersData = await barbersResponse.json();
                    // Filtrar barbeiros ativos e mapear disponibilidade baseada no queueStatus
                    const activeBarbers = barbersData.filter((barber: any) => barber.status === 'active');
                    setBarbers(activeBarbers.map((barber: any) => ({
                        ...barber,
                        available: barber.queueStatus === 'open' // Disponível apenas se a fila estiver aberta
                    })));
                }
            } catch (error) {
                console.error("Erro ao carregar dados:", error);
                toast.error("Erro ao carregar dados");
            } finally {
                setLoadingData(false);
            }
        };
        
        fetchData();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (selectedServices.length === 0 || !selectedBarber) {
            toast.error("Selecione pelo menos um serviço e um barbeiro");
            return;
        }
        
        setIsSubmitting(true);
        try {
            await addToQueue(selectedServices, selectedBarber);
            toast.success("Você foi adicionado à fila com sucesso!");
            onSuccess?.();
            // Reload automático da página
            setTimeout(() => {
                window.location.reload();
            }, 500);
        } catch (error) {
            console.error("Erro ao entrar na fila:", error);
            toast.error(error instanceof Error ? error.message : "Erro ao entrar na fila");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loadingData) {
        return (
            <div className="p-4 md:p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
                <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
                        <p className="text-zinc-400">Carregando...</p>
                    </div>
                </div>
            </div>
        );
    }

    return(
        <div className="p-4 md:p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-4 mb-6"
            >
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={onBack}
                    className="p-2 rounded-lg bg-zinc-800/50 hover:bg-zinc-700/50 text-zinc-400 hover:text-orange-500 transition-all duration-200"
                >
                    <ArrowLeft size={20} />
                </motion.button>
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-zinc-100">Entrar na Fila</h1>
                    <p className="text-zinc-400">Selecione os serviços desejados</p>
                </div>
            </motion.div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Serviços */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-zinc-900/60 backdrop-blur-sm rounded-2xl p-6 border border-zinc-700/50"
                >
                    <div className="flex items-center gap-3 mb-4">
                        <Scissors className="text-orange-500" size={24} />
                        <h2 className="text-xl font-bold text-zinc-100">Serviços</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {services.map((service) => (
                            <motion.div
                                key={service.id}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => toggleService(service.id)}
                                className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-300 ${
                                    selectedServices.includes(service.id)
                                        ? 'border-orange-500 bg-orange-500/10'
                                        : 'border-zinc-700 hover:border-orange-500/50 bg-zinc-800/30'
                                }`}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex-1">
                                        <h3 className="font-medium text-zinc-100">{service.name}</h3>
                                        <div className="flex items-center gap-4 mt-2 text-sm text-zinc-400">
                                            <span className="flex items-center gap-1">
                                                <DollarSign size={14} />
                                                R$ {service.price}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Clock size={14} />
                                                {service.averageTime}min
                                            </span>
                                        </div>
                                    </div>
                                    {selectedServices.includes(service.id) && (
                                        <motion.div
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center"
                                        >
                                            <Check size={14} className="text-white" />
                                        </motion.div>
                                    )}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>

                {/* Barbeiros */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-zinc-900/60 backdrop-blur-sm rounded-2xl p-6 border border-zinc-700/50"
                >
                    <h2 className="text-xl font-bold text-zinc-100 mb-4">Escolha o Barbeiro</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {barbers.map((barber) => (
                            <motion.div
                                key={barber.id}
                                whileHover={{ scale: barber.available ? 1.02 : 1 }}
                                whileTap={{ scale: barber.available ? 0.98 : 1 }}
                                onClick={() => barber.available && setSelectedBarber(barber.id)}
                                className={`p-4 rounded-xl border-2 transition-all duration-300 ${
                                    !barber.available
                                        ? 'border-zinc-700 bg-zinc-800/20 opacity-50 cursor-not-allowed'
                                        : selectedBarber === barber.id
                                        ? 'border-orange-500 bg-orange-500/10 cursor-pointer'
                                        : 'border-zinc-700 hover:border-orange-500/50 bg-zinc-800/30 cursor-pointer'
                                }`}
                            >
                                <div className="text-center">
                                    <h3 className="font-medium text-zinc-100">{barber.name}</h3>
                                    <p className={`text-sm mt-1 ${
                                        barber.available ? 'text-green-400' : 'text-red-400'
                                    }`}>
                                        {barber.available ? 'Fila Aberta' : 'Fila Fechada'}
                                    </p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>

                {/* Resumo */}
                {selectedServices.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="bg-gradient-to-r from-orange-500/10 to-amber-500/10 backdrop-blur-sm rounded-2xl p-6 border border-orange-500/30"
                    >
                        <h2 className="text-xl font-bold text-zinc-100 mb-4">Resumo</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                            <div>
                                <p className="text-zinc-400 text-sm">Serviços</p>
                                <p className="text-2xl font-bold text-orange-500">{selectedServices.length}</p>
                            </div>
                            <div>
                                <p className="text-zinc-400 text-sm">Tempo Total</p>
                                <p className="text-2xl font-bold text-blue-500">{totalTime}min</p>
                            </div>
                            <div>
                                <p className="text-zinc-400 text-sm">Valor Total</p>
                                <p className="text-2xl font-bold text-green-500">R$ {totalPrice}</p>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* Botão de Envio */}
                <motion.button
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    whileHover={{ scale: selectedServices.length > 0 ? 1.02 : 1 }}
                    whileTap={{ scale: selectedServices.length > 0 ? 0.98 : 1 }}
                    type="submit"
                    disabled={selectedServices.length === 0 || !selectedBarber || isSubmitting}
                    className={`w-full p-4 rounded-2xl font-bold text-lg transition-all duration-300 ${
                        selectedServices.length > 0 && selectedBarber
                            ? 'bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-2xl'
                            : 'bg-zinc-700 text-zinc-400 cursor-not-allowed'
                    }`}
                >
                    {isSubmitting ? 'Entrando na fila...' : 'Confirmar e Entrar na Fila'}
                </motion.button>
            </form>
        </div>
    )
});