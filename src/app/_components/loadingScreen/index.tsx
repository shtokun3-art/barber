'use client'

import { motion } from "framer-motion";
import Image from "next/image";
import { getImageUrl } from "@/lib/imageUtils";

interface LoadingScreenProps {
  message?: string;
  submessage?: string;
  showLogo?: boolean;
}

export function LoadingScreen({ 
  message = "Carregando...", 
  submessage,
  showLogo = true 
}: LoadingScreenProps) {
  return (
    <div className="h-dvh w-screen flex items-center justify-center bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900">
      <motion.div 
        className="flex flex-col items-center space-y-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {showLogo && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <Image
              src={getImageUrl('/img/barber_logo.png')}
              alt="Logo da barbearia"
              width={80}
              height={80}
              className="mb-4"
            />
          </motion.div>
        )}
        
        <div className="relative">
          <div className="w-16 h-16 border-4 border-zinc-600 border-t-orange-500 rounded-full animate-spin"></div>
          <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-r-orange-400 rounded-full animate-spin" 
               style={{animationDirection: 'reverse', animationDuration: '1.5s'}}></div>
        </div>
        
        <div className="text-center">
          <motion.p 
            className="text-2xl font-bold text-zinc-200 mb-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.5 }}
          >
            {message}
          </motion.p>
          
          {submessage && (
            <motion.p 
              className="text-lg text-zinc-400 animate-pulse"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.5 }}
            >
              {submessage}
            </motion.p>
          )}
        </div>
        
        <div className="flex space-x-1">
          {[...Array(3)].map((_, i) => (
            <motion.div
              key={i}
              className="w-2 h-2 bg-orange-500 rounded-full"
              animate={{
                y: [0, -10, 0],
                opacity: [0.5, 1, 0.5]
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                delay: i * 0.2
              }}
            />
          ))}
        </div>
      </motion.div>
    </div>
  );
}

// Componente específico para redirecionamento
export function RedirectingScreen({ 
  target,
  userName 
}: { 
  target: 'client' | 'admin' | 'login' | 'register';
  userName?: string;
}) {
  const messages = {
    client: {
      message: "Redirecionando...",
      submessage: userName ? `Bem-vindo, ${userName}!` : "Preparando área do cliente"
    },
    admin: {
      message: "Redirecionando...",
      submessage: userName ? `Bem-vindo, ${userName}!` : "Preparando painel administrativo"
    },
    login: {
      message: "Redirecionando...",
      submessage: "Preparando tela de login"
    },
    register: {
      message: "Redirecionando...",
      submessage: "Preparando tela de registro"
    }
  };

  return (
    <LoadingScreen 
      message={messages[target].message}
      submessage={messages[target].submessage}
    />
  );
}

// Componente para autenticação
export function AuthLoadingScreen() {
  return (
    <LoadingScreen 
      message="Verificando autenticação..."
      submessage="Aguarde um momento"
    />
  );
}

// Componente para logout
export function LogoutScreen() {
  return (
    <LoadingScreen 
      message="Saindo..."
      submessage="Encerrando sua sessão"
    />
  );
}