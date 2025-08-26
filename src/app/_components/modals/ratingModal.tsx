'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, ExternalLink, X } from 'lucide-react';

interface RatingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRateOnGoogle: () => void;
}

export default function RatingModal({ isOpen, onClose, onRateOnGoogle }: RatingModalProps) {
  const [animatedStars, setAnimatedStars] = useState<boolean[]>([false, false, false, false, false]);

  useEffect(() => {
    if (!isOpen) return;

    const animateStars = () => {
      // Animar preenchimento das estrelas uma por uma
      const fillStars = async () => {
        for (let i = 0; i < 5; i++) {
          await new Promise(resolve => setTimeout(resolve, 200));
          setAnimatedStars(prev => {
            const newStars = [...prev];
            newStars[i] = true;
            return newStars;
          });
        }
        
        // Aguardar um pouco e depois esvaziar
        await new Promise(resolve => setTimeout(resolve, 500));
        
        for (let i = 4; i >= 0; i--) {
          await new Promise(resolve => setTimeout(resolve, 200));
          setAnimatedStars(prev => {
            const newStars = [...prev];
            newStars[i] = false;
            return newStars;
          });
        }
      };

      fillStars();
    };

    // Iniciar animação imediatamente
    animateStars();
    
    // Repetir animação a cada 3 segundos
    const interval = setInterval(animateStars, 3000);

    return () => {
      clearInterval(interval);
      setAnimatedStars([false, false, false, false, false]);
    };
  }, [isOpen]);

  const handleRateOnGoogle = () => {
    onRateOnGoogle();
    onClose();
  };

  const handleCancel = () => {
    onClose();
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
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
            onClick={(e) => e.stopPropagation()} // Impede fechamento ao clicar no backdrop
          />
          
          {/* Modal */}
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 20 }}
              transition={{ type: "spring", duration: 0.5 }}
              className="bg-gradient-to-br from-zinc-900 to-zinc-800 rounded-2xl p-8 border border-zinc-700/50 shadow-2xl max-w-md w-full mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="text-center mb-8">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring" }}
                  className="w-16 h-16 bg-gradient-to-r from-orange-500 to-amber-500 rounded-full flex items-center justify-center mx-auto mb-4"
                >
                  <Star className="text-white" size={32} fill="white" />
                </motion.div>
                
                <h2 className="text-2xl font-bold text-white mb-2">
                  Corte Finalizado!
                </h2>
                
                <p className="text-zinc-400 text-sm">
                  Que tal avaliar nossa barbearia no Google Maps?
                </p>
              </div>

              {/* Estrelas Animadas */}
              <div className="flex justify-center gap-2 mb-8">
                {animatedStars.map((filled, index) => (
                  <motion.div
                    key={index}
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ 
                      scale: filled ? 1.2 : 1, 
                      rotate: filled ? 0 : -180 
                    }}
                    transition={{ 
                      type: "spring", 
                      stiffness: 300, 
                      damping: 20 
                    }}
                  >
                    <Star
                      size={40}
                      className={`transition-all duration-300 ${
                        filled 
                          ? 'text-yellow-400 drop-shadow-lg' 
                          : 'text-zinc-600'
                      }`}
                      fill={filled ? 'currentColor' : 'none'}
                    />
                  </motion.div>
                ))}
              </div>

              {/* Botões */}
              <div className="flex gap-4">
                {/* Botão Avaliar */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleRateOnGoogle}
                  className="flex-1 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 shadow-lg"
                >
                  <ExternalLink size={18} />
                  Avaliar
                </motion.button>

                {/* Botão Cancelar */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleCancel}
                  className="flex-1 bg-zinc-700 hover:bg-zinc-600 text-zinc-300 font-semibold py-3 px-6 rounded-xl transition-all duration-300 flex items-center justify-center gap-2"
                >
                  <X size={18} />
                  Cancelar
                </motion.button>
              </div>

              {/* Texto informativo */}
              <p className="text-xs text-zinc-500 text-center mt-4">
                Sua avaliação nos ajuda a melhorar nossos serviços
              </p>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}