"use client";

import { motion } from "framer-motion";
import { EditProfile } from "../../../editProfile";

export const ProfileSettingPage = () => {
  return (
    <div className="w-full h-full p-6 overflow-y-auto custom-orange-scrollbar">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="max-w-4xl mx-auto"
      >
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-2">Meu Perfil</h2>
          <p className="text-zinc-400">Gerencie suas informações pessoais e configurações da conta</p>
        </div>
        
        <EditProfile />
      </motion.div>
    </div>
  );
};