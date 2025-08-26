import { MenuIcon, LogOut, User } from "lucide-react";
import Image from "next/image";
import { useAuth } from "@/lib/AuthContext";
import { motion } from "framer-motion";
import { useState, useEffect, useRef, memo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { UserInitialsAvatar } from "@/app/_components/userInitialsAvatar";
import { getImageUrl } from "@/lib/imageUtils";

interface HeaderProps {
  setMenu: () => void;
}

export const Header = memo(({ setMenu }: HeaderProps) => {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleLogout = useCallback(async () => {
    await logout();
  }, [logout]);

  const handleProfileClick = useCallback(() => {
    router.push('/client/profile');
    setDropdownOpen(false);
  }, [router]);

  const toggleDropdown = useCallback(() => {
    setDropdownOpen(prev => !prev);
  }, []);



  // Fechar dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <motion.header 
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="fixed top-0 left-0 right-0 z-30 flex items-center h-16 bg-zinc-900/80 backdrop-blur-xl border-b border-orange-500/20 shadow-2xl"
    >
      {/* Menu Button - Mobile Only */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={setMenu}
        className="p-3 ml-2 text-zinc-200 hover:text-orange-500 lg:hidden transition-colors duration-200 rounded-lg hover:bg-zinc-800/50"
      >
        <MenuIcon size={24} />
      </motion.button>

      {/* Logo and Brand */}
      <div className="flex-1 flex items-center justify-center lg:justify-start lg:ml-6">
        <motion.div 
          whileHover={{ scale: 1.05 }}
          className="flex items-center gap-3"
        >
          <div className="relative overflow-hidden">
            <Image
              src={getImageUrl("/img/barber_logo.png")}
              alt="Logo"
              width={40}
              height={40}
              className="rounded-lg relative z-10"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-amber-500 rounded-lg blur opacity-20 scale-110" />
          </div>
          <div className="hidden sm:block">
            <h1 className="text-xl font-bold text-zinc-100">WE Barbearia</h1>
            <p className="text-xs text-orange-400">Área do Cliente</p>
          </div>
        </motion.div>
      </div>

      {/* User Dropdown */}
      <div ref={dropdownRef} className="relative mr-6">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="hover:shadow-lg transition-all duration-200"
        >
          <UserInitialsAvatar 
            name={user?.name}
            size={40}
            className="bg-gradient-to-br from-orange-500 to-amber-500"
            profileImage={user?.profileImage}
            userId={user?.id}
          />
        </motion.button>

        {/* Dropdown Menu */}
        {dropdownOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="absolute right-0 top-12 w-56 bg-zinc-900/95 backdrop-blur-xl border border-zinc-700/50 rounded-xl shadow-2xl z-50"
          >
            <div className="p-3">
              {/* User Info */}
              <div className="px-3 py-3 border-b border-zinc-700/30">
                <p className="text-xs text-zinc-400 uppercase tracking-wide">Conectado como</p>
                <p className="text-sm font-semibold text-orange-400 mt-1">{user?.name}</p>
              </div>
              
              {/* Menu Options */}
              <div className="pt-2 space-y-2">
                {/* Profile Button */}
                <button 
                  onClick={handleProfileClick}
                  className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-zinc-200 bg-gradient-to-r from-orange-600/20 to-orange-500/20 border border-orange-500/30 rounded-lg hover:from-orange-600/40 hover:to-orange-500/40 hover:border-orange-400/50 hover:text-white transition-all duration-300 group"
                >
                  <span className="flex items-center gap-3">
                    <User className="w-4 h-4 group-hover:scale-110 transition-transform" />
                    Configurações do Perfil
                  </span>
                </button>
                
                {/* Logout Button */}
                <button 
                  onClick={handleLogout}
                  className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-zinc-200 bg-gradient-to-r from-red-600/20 to-red-500/20 border border-red-500/30 rounded-lg hover:from-red-600/40 hover:to-red-500/40 hover:border-red-400/50 hover:text-white transition-all duration-300 group"
                >
                  <span className="flex items-center gap-3">
                    <LogOut className="w-4 h-4 group-hover:scale-110 transition-transform" />
                    Sair da conta
                  </span>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </motion.header>
  );
});