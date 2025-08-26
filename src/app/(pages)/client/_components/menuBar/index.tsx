'use client'

import { Spinner } from "@/app/_components/spinner";
import { useAuth } from "@/lib/AuthContext";
import { API_URL } from "@/lib/utils";
import { Clock, LogOut, Users, History, User } from "lucide-react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { memo, useCallback, useMemo } from "react";

interface MenuBarProps {
  page: 'queue' | 'hist' | 'form' | 'queueStatus';
  setPage: (val: 'queue' | 'hist') => void;
  menuOpen: boolean;
  onMouse: (val: boolean) => void;
}

export const MenuBar = memo(({ menuOpen, onMouse, page, setPage }: MenuBarProps) => {
  const { logout, loading, user } = useAuth();
  const router = useRouter();

  const logoutAcc = useCallback(async () => {
    console.log("Iniciando logout");
    try {
      await logout();
      console.log("Logout concluído");
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
    }
  }, [logout]);

  const menuItems = useMemo(() => [
    {
      id: 'queue',
      label: 'Fila',
      icon: Users,
      onClick: () => setPage('queue'),
      active: page === 'queue'
    },
    {
      id: 'hist',
      label: 'Histórico',
      icon: History,
      onClick: () => setPage('hist'),
      active: page === 'hist'
    }
  ], [page, setPage]);

  return (
    <motion.div
      initial={{ x: '-100%' }}
      animate={{ x: menuOpen ? 0 : '-100%' }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      onMouseEnter={() => onMouse(true)}
      onMouseLeave={() => onMouse(false)}
      className={`fixed left-0 top-0 h-full w-80 max-w-[85vw] bg-zinc-900/95 backdrop-blur-xl border-r border-orange-500/30 z-40 lg:hidden shadow-2xl`}
    >
      {/* Header */}
      <div className="p-6 border-b border-zinc-700/50">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-center"
        >
          <h1 className="text-2xl font-bold text-zinc-100 mb-1">
            WE Barbearia
          </h1>
          <p className="text-orange-400 text-sm font-medium">Área do Cliente</p>
        </motion.div>
        

      </div>

      {/* Navigation */}
      <div className="flex-1 p-6">
        <nav className="space-y-3">
          {menuItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <motion.button
                key={item.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + index * 0.1 }}
                whileHover={{ scale: 1.02, x: 4 }}
                whileTap={{ scale: 0.98 }}
                onClick={item.onClick}
                className={`w-full p-4 rounded-xl flex items-center gap-4 transition-all duration-300 ${
                  item.active
                    ? 'bg-gradient-to-r from-orange-500/20 to-amber-500/20 border border-orange-500/30 text-orange-400 shadow-lg'
                    : 'bg-zinc-800/30 hover:bg-zinc-800/50 text-zinc-300 hover:text-orange-400 border border-transparent hover:border-orange-500/20'
                }`}
              >
                <div className={`p-2 rounded-lg ${
                  item.active 
                    ? 'bg-orange-500/20 text-orange-400' 
                    : 'bg-zinc-700/50 text-zinc-400 group-hover:text-orange-400'
                }`}>
                  <Icon size={20} />
                </div>
                <span className="font-medium text-lg">{item.label}</span>
                {item.active && (
                  <motion.div
                    layoutId="activeIndicator"
                    className="ml-auto w-2 h-2 bg-orange-500 rounded-full"
                  />
                )}
              </motion.button>
            );
          })}
        </nav>
      </div>
    </motion.div>
  );
});