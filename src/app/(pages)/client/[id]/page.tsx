'use client'

import { useAuth } from "@/lib/AuthContext";
import { API_URL } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback, useMemo, lazy, Suspense } from "react";
import { Header } from "../_components/header";
import { MenuBar } from "../_components/menuBar";
import { motion, AnimatePresence } from "framer-motion";
import { useUserQueue } from "@/lib/hooks/useUserQueue";
import { useRatingModal } from "@/lib/hooks/useRatingModal";
import RatingModal from "@/app/_components/modals/ratingModal";
import { WhatsAppButton } from "@/app/_components/whatsappButton";
import { AuthLoadingScreen } from "@/app/_components/loadingScreen";

// Lazy loading dos componentes de página para melhor performance
const QueuePage = lazy(() => import("../_components/pages/queue").then(module => ({ default: module.QueuePage })));
const GetInQueue = lazy(() => import("../_components/pages/getInQueue").then(module => ({ default: module.GetInQueue })));
const HistoryPage = lazy(() => import("../_components/pages/history").then(module => ({ default: module.HistoryPage })));
const QueueStatusPage = lazy(() => import("../_components/pages/queueStatus").then(module => ({ default: module.QueueStatusPage })));

export default function ClientMainPage() {
  const { logout, loading, user } = useAuth();
  const { queueStatus, loading: queueLoading } = useUserQueue();
  const { isRatingModalOpen, hideRatingModal, handleRateOnGoogle } = useRatingModal();
  const [menuOpen, setMenuOpen] = useState<boolean>(false);
  const [onMouseMenu, setOnMouseMenu] = useState<boolean>(false);
  const router = useRouter();
  const [page, setPage] = useState<'queue' | 'hist' | 'form' | 'queueStatus'>('queue')
  const [hasRedirected, setHasRedirected] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    if (!user && !loading && !hasRedirected) {
      setHasRedirected(true);
      router.replace(`/auth/login`);
    }
  }, [user, loading, hasRedirected, router]);

  // Lógica consolidada para gerenciar redirecionamento baseado no status da fila
  useEffect(() => {
    if (queueLoading) return; // Aguardar carregamento

    console.log("🔄 Verificando redirecionamento:", {
      inQueue: queueStatus.inQueue,
      currentPage: page,
      queueLoading
    });

    if (queueStatus.inQueue && page !== 'queueStatus') {
      // Usuário está na fila mas não está na página correta
      console.log("➡️ Redirecionando para queueStatus");
      setIsTransitioning(true);
      setTimeout(() => {
        setPage('queueStatus');
        setIsTransitioning(false);
      }, 300); // Reduzido de 500ms para 300ms
    } else if (!queueStatus.inQueue && page === 'queueStatus') {
      // Usuário não está mais na fila mas ainda está na página de status
      console.log("⬅️ Redirecionando para queue (menu principal)");
      setPage('queue');
    }
  }, [queueStatus.inQueue, queueLoading, page]);

  // Bloquear navegação quando estiver na fila
  useEffect(() => {
    if (queueStatus.inQueue) {
      // Bloquear tentativas de sair da página
      const handleBeforeUnload = (e: BeforeUnloadEvent) => {
        e.preventDefault();
        e.returnValue = 'Você está na fila! Tem certeza que deseja sair?';
        return 'Você está na fila! Tem certeza que deseja sair?';
      };

      // Bloquear navegação com botão voltar
      const handlePopState = (e: PopStateEvent) => {
        if (queueStatus.inQueue) {
          e.preventDefault();
          // Forçar a permanecer na página atual
          window.history.pushState(null, '', window.location.href);
          alert('Você está na fila e não pode navegar para outras páginas. Use o botão "Sair da Fila" se desejar sair.');
        }
      };

      // Adicionar estado ao histórico para interceptar navegação
      window.history.pushState(null, '', window.location.href);
      
      window.addEventListener('beforeunload', handleBeforeUnload);
      window.addEventListener('popstate', handlePopState);

      return () => {
        window.removeEventListener('beforeunload', handleBeforeUnload);
        window.removeEventListener('popstate', handlePopState);
      };
    }
  }, [queueStatus.inQueue]);

  // Memoização das funções para evitar re-renderizações desnecessárias
  const toggleMenu = useCallback(() => {
    setMenuOpen(prev => !prev);
  }, []);

  const onClose = useCallback((e: React.MouseEvent) => {
    if (!onMouseMenu && !(e.target as HTMLElement).closest('button')) {
      setMenuOpen(false);
    }
  }, [onMouseMenu]);

  const handlePageChange = useCallback((newPage: 'form' | 'queue' | 'hist') => {
    if (!queueStatus.inQueue) {
      setPage(newPage);
    }
  }, [queueStatus.inQueue]);

  // Componente de loading para Suspense
  const PageLoader = () => (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  if (loading) {
    return <AuthLoadingScreen />;
  }

  return (
    <div
      className="w-screen h-dvh bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 text-zinc-200 relative overflow-hidden"
      onClick={onClose}
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(251,146,60,0.1),transparent_50%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_49%,rgba(251,146,60,0.03)_50%,transparent_51%)] bg-[length:20px_20px]" />
      </div>

      {/* Só mostrar header se não estiver na fila */}
      {!queueStatus.inQueue && <Header setMenu={toggleMenu} />}
      
      {/* Overlay para mobile quando menu está aberto */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed top-0 left-0 w-full h-full bg-black/60 z-20 lg:hidden"
            onClick={() => setMenuOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Só mostrar menu se não estiver na fila */}
      {!queueStatus.inQueue && (
        <MenuBar setPage={handlePageChange} page={page} menuOpen={menuOpen} onMouse={setOnMouseMenu}/>
      )}

      <main className={`w-full h-full pb-4 relative z-10 ${queueStatus.inQueue ? 'pt-0' : 'pt-16'}`}>
        <AnimatePresence mode="wait">
          {isTransitioning && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="h-full flex items-center justify-center bg-zinc-900"
            >
              <div className="text-center space-y-4">
                <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                <p className="text-zinc-300 text-lg">Entrando na fila...</p>
              </div>
            </motion.div>
          )}
          {page === "queueStatus" && !isTransitioning && (
            <motion.div
              key="queueStatus"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="h-full overflow-y-auto custom-scrollbar"
            >
              <Suspense fallback={<PageLoader />}>
                <QueueStatusPage />
              </Suspense>
            </motion.div>
          )}
          {page === "queue" && !queueStatus.inQueue && (
            <motion.div
              key="queue"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="h-full overflow-y-auto custom-scrollbar"
            >
              <Suspense fallback={<PageLoader />}>
                <QueuePage setPage={handlePageChange}/>
              </Suspense>
            </motion.div>
          )}
          {page === 'hist' && !queueStatus.inQueue && (
            <motion.div
              key="history"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="h-full overflow-y-auto custom-scrollbar"
            >
              <Suspense fallback={<PageLoader />}>
                <HistoryPage />
              </Suspense>
            </motion.div>
          )}
          {page === 'form' && !queueStatus.inQueue && (
            <motion.div
              key="form"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="h-full overflow-y-auto custom-scrollbar"
            >
              <Suspense fallback={<PageLoader />}>
                <GetInQueue 
                  onBack={() => handlePageChange('queue')} 
                  onSuccess={() => {
                    setIsTransitioning(true);
                    setTimeout(() => {
                      setPage('queueStatus');
                      setIsTransitioning(false);
                    }, 800);
                  }}
                />
              </Suspense>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
      
      {/* Modal de Avaliação */}
      <RatingModal
        isOpen={isRatingModalOpen}
        onClose={hideRatingModal}
        onRateOnGoogle={handleRateOnGoogle}
      />
      
      {/* Botão flutuante do WhatsApp */}
      <WhatsAppButton 
        phoneNumber="5582982183687" 
        message="Olá! Gostaria de agendar um horário na barbearia."
      />
    </div>
  );
}