'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';

interface UseRatingModalReturn {
  isRatingModalOpen: boolean;
  showRatingModal: () => void;
  hideRatingModal: () => void;
  handleRateOnGoogle: () => void;
  markAsRatedOnGoogle: () => Promise<void>;
}

export function useRatingModal(): UseRatingModalReturn {
  const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);
  const { user, refreshUser } = useAuth();

  // Verificar automaticamente se deve mostrar o modal
  useEffect(() => {
    const checkRatingNeeded = async () => {
      if (!user) return;
      
      try {
        const response = await fetch('/api/user/check-rating-needed', {
          credentials: 'include',
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.shouldShowRatingModal) {
            setIsRatingModalOpen(true);
          }
        }
      } catch (error) {
        console.error('Erro ao verificar necessidade de avaliação:', error);
      }
    };

    // Verificar imediatamente
    checkRatingNeeded();
    
    // Verificar a cada 30 segundos
    const interval = setInterval(checkRatingNeeded, 30000);
    
    return () => clearInterval(interval);
  }, [user]);

  const showRatingModal = () => {
    // Só mostra o modal se o usuário não tiver avaliado ainda
    if (user && !user.hasRatedOnGoogle) {
      setIsRatingModalOpen(true);
    }
  };

  const hideRatingModal = async () => {
    setIsRatingModalOpen(false);
    
    // Registrar que o modal foi dispensado
    try {
      await fetch('/api/user/dismiss-rating-modal', {
        method: 'POST',
        credentials: 'include',
      });
    } catch (error) {
      console.error('Erro ao registrar dispensa do modal:', error);
    }
  };

  const handleRateOnGoogle = () => {
    // URL do Google Maps para avaliação da La Barbearia
    const googleMapsUrl = 'https://www.google.com/maps/place/La+Barbearia+we/@-9.241144,-35.3546623,20z/data=!4m17!1m8!3m7!1s0x700fcf3d3038ee7:0x4ba633214f81a35d!2sAv.+Francisco+Lima,+S%C3%A3o+Miguel+dos+Milagres+-+AL,+57940-000!3b1!8m2!3d-9.2405735!4d-35.3538536!16s%2Fg%2F1ymw55d9g!3m7!1s0x700e1e4d9f87e17:0x75ddb74b2d22e6ba!8m2!3d-9.2414246!4d-35.354807!9m1!1b1!16s%2Fg%2F11m_yt54nf?hl=pt-BR&entry=ttu&g_ep=EgoyMDI1MDgwNi4wIKXMDSoASAFQAw%3D%3D';
    
    // Abrir Google Maps em nova aba
    window.open(googleMapsUrl, '_blank');
    
    // Marcar como avaliado
    markAsRatedOnGoogle();
  };

  const markAsRatedOnGoogle = async () => {
    try {
      const response = await fetch('/api/user/mark-rated', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        // Atualizar dados do usuário
        await refreshUser();
      } else {
        console.error('Erro ao marcar como avaliado');
      }
    } catch (error) {
      console.error('Erro ao marcar como avaliado:', error);
    }
  };

  return {
    isRatingModalOpen,
    showRatingModal,
    hideRatingModal,
    handleRateOnGoogle,
    markAsRatedOnGoogle,
  };
}