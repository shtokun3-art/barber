"use client";

import { useState } from "react";
import { PanelBottom, Filter, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { DashboardCards } from "./cards";
import { DashboardMetrics } from "./metrics";
import { CommissionsChart } from "./charts/commissionsChart";

export type PeriodFilter = "1d" | "today" | "7d" | "14d" | "30d" | "3m" | "6m" | "1y" | "2y" | "3y";

export const DashboardAdmin = () => {
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodFilter>("30d");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const periodOptions = [
    { value: "1d" as PeriodFilter, label: "Hoje" },
    { value: "today" as PeriodFilter, label: "Hoje (Atual)" },
    { value: "7d" as PeriodFilter, label: "7 dias" },
    { value: "14d" as PeriodFilter, label: "14 dias" },
    { value: "30d" as PeriodFilter, label: "30 dias" },
    { value: "3m" as PeriodFilter, label: "3 meses" },
    { value: "6m" as PeriodFilter, label: "6 meses" },
    { value: "1y" as PeriodFilter, label: "1 ano" },
    { value: "2y" as PeriodFilter, label: "2 anos" },
    { value: "3y" as PeriodFilter, label: "3 anos" },
  ];

  return (
    <section className="w-full h-full overflow-auto px-6 py-4 custom-scrollbar relative">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8 relative">
        <div className="flex items-center gap-4 mb-4 lg:mb-0">
          <div className="p-3 rounded-xl bg-gradient-primary shadow-glow">
            <PanelBottom size={32} className="text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gradient-primary">Dashboard</h1>
            <p className="text-zinc-400">Análise de rendimento e performance em tempo real</p>
          </div>
        </div>

        {/* Period Filter Dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-2 px-4 py-3 glass-card text-zinc-300 rounded-lg hover:bg-white/10 hover:text-white smooth-transition focus-ring shadow-glow"
          >
            <Filter size={16} />
            {periodOptions.find(option => option.value === selectedPeriod)?.label}
            <ChevronDown size={16} className={`transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
          </button>
          
          <AnimatePresence>
            {isDropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="absolute top-full mt-2 right-0 glass-card-dark rounded-lg shadow-glow-lg z-50 min-w-[150px] overflow-hidden"
              >
                {periodOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => {
                      setSelectedPeriod(option.value);
                      setIsDropdownOpen(false);
                    }}
                    className={`w-full text-left px-4 py-3 text-sm smooth-transition ${
                      selectedPeriod === option.value
                        ? "bg-gradient-primary text-white shadow-glow"
                        : "text-zinc-300 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Dashboard Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <DashboardCards period={selectedPeriod} />
      </motion.div>

      {/* Dashboard Metrics */}
      <DashboardMetrics period={selectedPeriod} />

      {/* Commissions Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="mt-8"
      >
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gradient-primary mb-2">Comissões dos Barbeiros</h2>
          <p className="text-zinc-400">Análise detalhada de ganhos e performance individual</p>
        </div>
        <CommissionsChart period={selectedPeriod} />
      </motion.div>

    </section>
  );
};