"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { User, Scissors, Package, Settings, ShoppingBag, DollarSign } from "lucide-react";
import { ProfileSettingPage } from "./profile";
import { ServicesSettingsPage } from "./services";
import { BarbersSettingPage } from "./barbers";
import { ProductsSettingPage } from "./products";
import { FeesSettingPage } from "./fees";
import { ItemsProvider } from "@/lib/context/ItemsContext";

export type settings = "profile" | "services" | "barbers" | "items" | "fees";

interface TabConfig {
  id: settings;
  label: string;
  icon: React.ComponentType<{size?: number; className?: string}>;
  description: string;
}

const tabs: TabConfig[] = [
  {
    id: "profile",
    label: "Meu Perfil",
    icon: User,
    description: "Gerencie suas informações pessoais"
  },
  {
    id: "services",
    label: "Serviços",
    icon: Scissors,
    description: "Configure os serviços oferecidos"
  },
  {
    id: "barbers",
    label: "Barbeiros",
    icon: Settings,
    description: "Gerencie a equipe de barbeiros"
  },
  {
    id: "items",
    label: "Produtos",
    icon: ShoppingBag,
    description: "Controle o estoque de produtos"
  },
  {
    id: "fees",
    label: "Taxas",
    icon: DollarSign,
    description: "Configure taxas e comissões"
  }
];

export const SettingsAdmin = () => {
  const [selected, setSelected] = useState<settings>('profile');

  const renderContent = () => {
    switch (selected) {
      case 'profile':
        return <ProfileSettingPage />;
      case 'services':
        return <ServicesSettingsPage />;
      case 'barbers':
        return <BarbersSettingPage />;
      case 'items':
        return (
          <ItemsProvider>
            <ProductsSettingPage />
          </ItemsProvider>
        );
      case 'fees':
        return <FeesSettingPage />;
      default:
        return <ProfileSettingPage />;
    }
  };

  return (
    <section className="w-full h-full overflow-hidden px-6 py-4">
      {/* Header */}
      <motion.header 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center gap-4 mb-2">
          <div className="p-3 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 shadow-lg">
            <Settings size={28} className="text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">Configurações</h1>
            <p className="text-zinc-400">Gerencie sua conta e preferências</p>
          </div>
        </div>
      </motion.header>

      {/* Navigation Tabs */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex gap-2 mb-6 p-1 bg-zinc-800/50 rounded-xl backdrop-blur-sm"
      >
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = selected === tab.id;
          
          return (
            <button
              key={tab.id}
              onClick={() => setSelected(tab.id)}
              className={`
                relative flex items-center gap-3 px-6 py-3 rounded-lg transition-all duration-200
                ${isActive 
                  ? 'bg-orange-500 text-white shadow-lg' 
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-700/50'
                }
              `}
            >
              <Icon size={18} />
              <div className="text-left">
                <div className="font-medium">{tab.label}</div>
                <div className={`text-xs ${isActive ? 'text-orange-100' : 'text-zinc-500'}`}>
                  {tab.description}
                </div>
              </div>
              
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 bg-orange-500 rounded-lg -z-10"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
            </button>
          );
        })}
      </motion.div>

      {/* Content Area */}
      <motion.main 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="flex-1 h-[calc(100%-200px)] bg-zinc-900/50 rounded-xl backdrop-blur-sm border border-zinc-700/50 overflow-hidden"
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={selected}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="h-full"
          >
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </motion.main>
    </section>
  );
}