import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { API_URL } from '@/lib/utils';
import { toast } from 'sonner';
import { Spinner } from '../spinner';
import { Clock, DollarSign, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Service {
  id: string;
  name: string;
  price: number;
  averageTime: number;
}

interface Barber {
  id: string;
  name: string;
  status: string;
  queueStatus: string;
}

interface User {
  id: string;
  name: string;
  phone: string;
}

interface AddUserToQueueModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  onSuccess?: () => void;
}

interface QueueEntry {
  id: string;
  userId: string;
  barberId: string;
  status: string;
  createdAt: string;
  queueServices: Array<{
    service: {
      averageTime: number;
    };
  }>;
}

export const AddUserToQueueModal = ({ isOpen, onClose, user, onSuccess }: AddUserToQueueModalProps) => {
  const [services, setServices] = useState<Service[]>([]);
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [selectedBarber, setSelectedBarber] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [queueData, setQueueData] = useState<QueueEntry[]>([]);

  // Buscar serviços, barbeiros e dados da fila
  useEffect(() => {
    const fetchData = async () => {
      try {
        setDataLoading(true);
        
        const [servicesResponse, barbersResponse, queueResponse] = await Promise.all([
          fetch(`${window.location.origin}/api/services`, { credentials: 'include' }),
          fetch(`${window.location.origin}/api/barbers`, { credentials: 'include' }),
          fetch(`${window.location.origin}/api/queue`, { credentials: 'include' })
        ]);
        
        if (servicesResponse.ok) {
          const servicesData = await servicesResponse.json();
          setServices(servicesData);
        }
        
        if (barbersResponse.ok) {
          const barbersData = await barbersResponse.json();
          const activeBarbers = barbersData.filter((barber: Barber) => barber.status === 'active');
          setBarbers(activeBarbers);
        }
        
        if (queueResponse.ok) {
          const queueData = await queueResponse.json();
          setQueueData(queueData);
        }
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
        toast.error('Erro ao carregar dados');
      } finally {
        setDataLoading(false);
      }
    };

    if (isOpen) {
      fetchData();
    }
  }, [isOpen]);

  // Calcular valores totais
  const selectedServicesData = services.filter(service => selectedServices.includes(service.id));
  const totalPrice = selectedServicesData.reduce((total, service) => total + service.price, 0);
  const totalTime = selectedServicesData.reduce((total, service) => total + service.averageTime, 0);

  // Calcular tempo estimado de espera baseado na fila do barbeiro selecionado
  const calculateEstimatedWaitTime = () => {
    if (!selectedBarber) return 0;
    
    // Filtrar entradas do barbeiro selecionado que estão aguardando
    const barberQueueEntries = queueData
      .filter(entry => entry.barberId === selectedBarber && entry.status === 'waiting')
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    
    // Calcular tempo total dos clientes que estão na frente
    const totalWaitTime = barberQueueEntries.reduce((total, entry) => {
      const entryTime = entry.queueServices.reduce((serviceTotal, qs) => {
        return serviceTotal + (qs.service?.averageTime || 0);
      }, 0);
      return total + entryTime;
    }, 0);
    
    return totalWaitTime;
  };
  
  const estimatedWaitTime = calculateEstimatedWaitTime();
  
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

  const handleServiceToggle = (serviceId: string) => {
    setSelectedServices(prev => 
      prev.includes(serviceId) 
        ? prev.filter(id => id !== serviceId)
        : [...prev, serviceId]
    );
  };

  const handleSubmit = async () => {
    if (selectedServices.length === 0) {
      toast.error('Selecione pelo menos um serviço');
      return;
    }
    
    if (!selectedBarber) {
      toast.error('Selecione um barbeiro');
      return;
    }

    setLoading(true);
    try {
      // Criar uma API específica para admin adicionar usuário à fila
      const response = await fetch(`${window.location.origin}/api/queue/add-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          serviceIds: selectedServices,
          barberId: selectedBarber
        }),
        credentials: 'include'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao adicionar usuário à fila');
      }

      toast.success(`${user.name} foi adicionado à fila com sucesso!`);
      onSuccess?.();
      onClose();
      
      // Reset form
      setSelectedServices([]);
      setSelectedBarber('');
    } catch (error) {
      console.error('Erro ao adicionar à fila:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao adicionar à fila');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSelectedServices([]);
    setSelectedBarber('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="bg-zinc-800 text-white border-zinc-700 max-w-md overflow-hidden">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: -20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ duration: 0.3, type: "spring", stiffness: 300 }}
        >
          <DialogHeader>
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.3 }}
            >
              <DialogTitle className="text-xl font-bold text-orange-400 flex items-center gap-2">
                <motion.div
                  animate={{ 
                    rotate: [0, 10, -10, 0],
                    scale: [1, 1.1, 1]
                  }}
                  transition={{ 
                    duration: 2, 
                    repeat: Infinity, 
                    repeatDelay: 3 
                  }}
                >
                  👤
                </motion.div>
                <motion.span
                  animate={{ 
                    color: ['#fb923c', '#f97316', '#ea580c', '#fb923c']
                  }}
                  transition={{ 
                    duration: 3, 
                    repeat: Infinity 
                  }}
                >
                  Adicionar {user.name} à Fila
                </motion.span>
              </DialogTitle>
            </motion.div>
          </DialogHeader>

        {dataLoading ? (
          <div className="flex justify-center py-8">
            <Spinner />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Seleção de Serviços */}
            <div>
              <label className="text-sm font-medium text-zinc-300 mb-3 block">
                Selecione os Serviços:
              </label>
              <div className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar">
                <AnimatePresence>
                  {services.map((service, index) => (
                    <motion.div
                      key={service.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1, duration: 0.3 }}
                      className="flex items-center space-x-3 p-3 rounded-lg border border-zinc-700/50 hover:border-orange-500/50 hover:bg-zinc-700/30 transition-all duration-200 cursor-pointer group"
                      onClick={() => handleServiceToggle(service.id)}
                    >
                      <motion.div
                        animate={{
                          scale: selectedServices.includes(service.id) ? 1.1 : 1,
                          rotate: selectedServices.includes(service.id) ? 360 : 0
                        }}
                        transition={{ duration: 0.3 }}
                      >
                        <Checkbox
                          id={service.id}
                          checked={selectedServices.includes(service.id)}
                          onCheckedChange={() => handleServiceToggle(service.id)}
                          className="border-zinc-600 data-[state=checked]:bg-orange-500 data-[state=checked]:border-orange-500"
                        />
                      </motion.div>
                      <label htmlFor={service.id} className="flex-1 cursor-pointer">
                        <div className="flex justify-between items-center">
                          <span className={`text-sm transition-colors duration-200 ${
                            selectedServices.includes(service.id) 
                              ? 'text-orange-400 font-medium' 
                              : 'text-white group-hover:text-orange-300'
                          }`}>
                            {service.name}
                          </span>
                          <div className="flex items-center gap-2 text-xs">
                            <motion.span 
                              className={`transition-colors duration-200 ${
                                selectedServices.includes(service.id) 
                                  ? 'text-green-400 font-medium' 
                                  : 'text-zinc-400 group-hover:text-green-300'
                              }`}
                              animate={{
                                scale: selectedServices.includes(service.id) ? 1.05 : 1
                              }}
                            >
                              R$ {service.price.toFixed(2)}
                            </motion.span>
                            <span className="text-zinc-500">•</span>
                            <motion.span 
                              className={`transition-colors duration-200 ${
                                selectedServices.includes(service.id) 
                                  ? 'text-blue-400 font-medium' 
                                  : 'text-zinc-400 group-hover:text-blue-300'
                              }`}
                              animate={{
                                scale: selectedServices.includes(service.id) ? 1.05 : 1
                              }}
                            >
                              {service.averageTime}min
                            </motion.span>
                          </div>
                        </div>
                      </label>
                      {selectedServices.includes(service.id) && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <CheckCircle className="w-4 h-4 text-green-400" />
                        </motion.div>
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>

            {/* Seleção de Barbeiro */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.3 }}
            >
              <label className="text-sm font-medium text-zinc-300 mb-2 block">
                Selecione o Barbeiro:
              </label>
              <motion.div
                animate={{
                  scale: selectedBarber ? 1.02 : 1,
                  borderColor: selectedBarber ? '#f97316' : '#52525b'
                }}
                transition={{ duration: 0.2 }}
              >
                <Select value={selectedBarber} onValueChange={setSelectedBarber}>
                  <SelectTrigger className={`bg-zinc-700 border-zinc-600 text-white transition-all duration-200 hover:border-orange-500/50 ${
                    selectedBarber ? 'border-orange-500 ring-1 ring-orange-500/20' : ''
                  }`}>
                    <SelectValue placeholder="Escolha um barbeiro" />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-700 border-zinc-600">
                    {barbers
                      .filter(barber => barber.status === 'active' && barber.queueStatus === 'open')
                      .map((barber, index) => (
                      <SelectItem 
                        key={barber.id} 
                        value={barber.id} 
                        className="text-white hover:bg-zinc-600 focus:bg-orange-500/20 focus:text-orange-300"
                      >
                        <motion.div
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="flex items-center gap-2"
                        >
                          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                          {barber.name}
                          <span className="text-xs text-green-400 ml-1">(Fila Aberta)</span>
                        </motion.div>
                      </SelectItem>
                    ))}
                    {barbers.filter(barber => barber.status === 'active' && barber.queueStatus === 'open').length === 0 && (
                      <div className="p-3 text-center text-zinc-400 text-sm">
                        Nenhum barbeiro com fila aberta no momento
                      </div>
                    )}
                  </SelectContent>
                </Select>
              </motion.div>
            </motion.div>

            {/* Resumo */}
            <AnimatePresence>
              {selectedServices.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -20, scale: 0.95 }}
                  transition={{ duration: 0.3, type: "spring", stiffness: 300 }}
                  className="bg-gradient-to-r from-zinc-700/50 to-zinc-600/50 p-4 rounded-lg space-y-3 border border-orange-500/20"
                >
                  <motion.h4 
                    className="font-medium text-orange-400 flex items-center gap-2"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.1 }}
                  >
                    <CheckCircle className="w-4 h-4" />
                    Resumo:
                  </motion.h4>
                  
                  <motion.div 
                    className="flex items-center justify-between text-sm p-2 rounded bg-green-500/10 border border-green-500/20"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                    whileHover={{ scale: 1.02 }}
                  >
                    <div className="flex items-center gap-2">
                      <motion.div
                        animate={{ rotate: [0, 360] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      >
                        <DollarSign size={16} className="text-green-400" />
                      </motion.div>
                      <span>Valor Total:</span>
                    </div>
                    <motion.span 
                      className="font-bold text-green-400 text-lg"
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
                    >
                      R$ {totalPrice.toFixed(2)}
                    </motion.span>
                  </motion.div>
                  
                  <motion.div 
                    className="flex items-center justify-between text-sm p-2 rounded bg-blue-500/10 border border-blue-500/20"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                    whileHover={{ scale: 1.02 }}
                  >
                    <div className="flex items-center gap-2">
                      <motion.div
                        animate={{ rotate: [0, 360] }}
                        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                      >
                        <Clock size={16} className="text-blue-400" />
                      </motion.div>
                      <span>Tempo dos Serviços:</span>
                    </div>
                    <motion.span 
                      className="font-bold text-blue-400 text-lg"
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2.5 }}
                    >
                      {totalTime} min
                    </motion.span>
                  </motion.div>
                  
                  <motion.div 
                    className="flex items-center justify-between text-sm p-2 rounded bg-orange-500/10 border border-orange-500/20"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 }}
                    whileHover={{ scale: 1.02 }}
                  >
                    <div className="flex items-center gap-2">
                      <motion.div
                        animate={{ rotate: [0, 360] }}
                        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                      >
                        <Clock size={16} className="text-orange-400" />
                      </motion.div>
                      <span>Tempo Estimado de Espera:</span>
                    </div>
                    <motion.span 
                      className="font-bold text-orange-400 text-lg"
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 3 }}
                    >
                      {estimatedWaitTime > 0 ? `~${formatTime(estimatedWaitTime)}` : 'Sem fila'}
                    </motion.span>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        <DialogFooter className="gap-3">
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button
              onClick={handleClose}
              className="bg-zinc-600 hover:bg-zinc-500 transition-all duration-200 hover:shadow-lg"
              disabled={loading}
            >
              Cancelar
            </Button>
          </motion.div>
          
          <motion.div
            whileHover={{ scale: loading ? 1 : 1.05 }}
            whileTap={{ scale: loading ? 1 : 0.95 }}
            animate={{
              opacity: (selectedServices.length === 0 || !selectedBarber) ? 0.5 : 1
            }}
          >
            <Button
              onClick={handleSubmit}
              className={`transition-all duration-300 hover:shadow-lg ${
                loading 
                  ? 'bg-orange-500 hover:bg-orange-500' 
                  : 'bg-green-600 hover:bg-green-500 hover:shadow-green-500/25'
              }`}
              disabled={loading || dataLoading || selectedServices.length === 0 || !selectedBarber}
            >
              {loading ? (
                <motion.div 
                  className="flex items-center gap-2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  >
                    <Spinner className="w-4 h-4" />
                  </motion.div>
                  <motion.span
                    animate={{ opacity: [1, 0.5, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    Adicionando...
                  </motion.span>
                </motion.div>
              ) : (
                <motion.div
                  className="flex items-center gap-2"
                  whileHover={{ x: 2 }}
                >
                  <CheckCircle className="w-4 h-4" />
                  Adicionar à Fila
                </motion.div>
              )}
            </Button>
          </motion.div>
         </DialogFooter>
        </motion.div>
       </DialogContent>
     </Dialog>
   );
 };