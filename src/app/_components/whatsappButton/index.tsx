'use client'

import { MessageCircle } from "lucide-react";
import { motion } from "framer-motion";

interface WhatsAppButtonProps {
  phoneNumber: string;
  message?: string;
}

export const WhatsAppButton = ({ phoneNumber, message = "" }: WhatsAppButtonProps) => {
  const handleWhatsAppClick = () => {
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${phoneNumber}?`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <motion.button
      onClick={handleWhatsAppClick}
      className="fixed bottom-6 right-6 z-50 bg-green-500 hover:bg-green-600 text-white p-4 rounded-full shadow-lg transition-all duration-300 group"
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.5, type: "spring", stiffness: 260, damping: 20 }}
      title="Fale conosco no WhatsApp"
    >
      <MessageCircle size={24} className="group-hover:animate-pulse" />
      
      {/* Efeito de ondas */}
      <div className="absolute inset-0 rounded-full bg-green-500 animate-ping opacity-20"></div>
      <div className="absolute inset-0 rounded-full bg-green-500 animate-ping opacity-10" style={{ animationDelay: '0.5s' }}></div>
    </motion.button>
  );
};