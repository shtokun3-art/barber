"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Calendar, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

interface CustomCalendarProps {
  startDate?: Date;
  endDate?: Date;
  onStartDateChange: (date: Date | undefined) => void;
  onEndDateChange: (date: Date | undefined) => void;
}

export const CustomCalendar = ({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
}: CustomCalendarProps) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [isSelectingStart, setIsSelectingStart] = useState(true);
  const [isOpen, setIsOpen] = useState(false);

  const monthNames = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ];

  const dayNames = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];

    // Dias do mês anterior
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const prevDate = new Date(year, month, -i);
      days.push({ date: prevDate, isCurrentMonth: false });
    }

    // Dias do mês atual
    for (let day = 1; day <= daysInMonth; day++) {
      days.push({ date: new Date(year, month, day), isCurrentMonth: true });
    }

    // Dias do próximo mês para completar a grade
    const remainingDays = 42 - days.length;
    for (let day = 1; day <= remainingDays; day++) {
      const nextDate = new Date(year, month + 1, day);
      days.push({ date: nextDate, isCurrentMonth: false });
    }

    return days;
  };

  const isDateInRange = (date: Date) => {
    if (!startDate || !endDate) return false;
    return date >= startDate && date <= endDate;
  };

  const isDateSelected = (date: Date) => {
    if (!startDate && !endDate) return false;
    return (
      (startDate && date.toDateString() === startDate.toDateString()) ||
      (endDate && date.toDateString() === endDate.toDateString())
    );
  };

  const handleDateClick = (date: Date) => {
    if (isSelectingStart) {
      onStartDateChange(date);
      onEndDateChange(undefined);
      setIsSelectingStart(false);
    } else {
      if (startDate && date < startDate) {
        onStartDateChange(date);
        onEndDateChange(startDate);
      } else {
        onEndDateChange(date);
      }
      setIsSelectingStart(true);
    }
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  const formatDateRange = () => {
    if (!startDate && !endDate) return "Selecionar período";
    if (startDate && !endDate) return `A partir de ${startDate.toLocaleDateString('pt-BR')}`;
    if (!startDate && endDate) return `Até ${endDate.toLocaleDateString('pt-BR')}`;
    if (startDate && endDate) {
      return `${startDate.toLocaleDateString('pt-BR')} - ${endDate.toLocaleDateString('pt-BR')}`;
    }
    return "Selecionar período";
  };

  const clearDates = () => {
    onStartDateChange(undefined);
    onEndDateChange(undefined);
    setIsSelectingStart(true);
  };

  const days = getDaysInMonth(currentMonth);

  return (
    <>
      <Button
        variant="outline"
        className="bg-zinc-700 h-12 border-zinc-600 w-full text-zinc-200 hover:bg-zinc-600 hover:text-zinc-100 justify-start"
        onClick={() => setIsOpen(true)}
      >
        <Calendar className="mr-2 h-4 w-4" />
        {formatDateRange()}
      </Button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-[9998]"
              onClick={() => setIsOpen(false)}
            />
            
            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 bg-zinc-800 border border-zinc-600 text-zinc-200 rounded-lg shadow-2xl z-[9999]"
            >
        <div className="p-4">
          {/* Header do calendário */}
          <div className="flex items-center justify-between mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigateMonth('prev')}
              className="text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <h3 className="text-lg font-semibold text-zinc-100">
              {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
            </h3>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigateMonth('next')}
                className="text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
                className="text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Dias da semana */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {dayNames.map((day) => (
              <div key={day} className="text-center text-xs font-medium text-zinc-400 p-2">
                {day}
              </div>
            ))}
          </div>

          {/* Grade de dias */}
          <div className="grid grid-cols-7 gap-1">
            {days.map((day, index) => {
              const isSelected = isDateSelected(day.date);
              const isInRange = isDateInRange(day.date);
              const isToday = day.date.toDateString() === new Date().toDateString();

              return (
                <button
                  key={index}
                  onClick={() => day.isCurrentMonth && handleDateClick(day.date)}
                  disabled={!day.isCurrentMonth}
                  className={`
                    h-8 w-8 text-sm rounded-md transition-all duration-200
                    ${!day.isCurrentMonth 
                      ? 'text-zinc-600 cursor-not-allowed' 
                      : 'text-zinc-200 hover:bg-zinc-700 cursor-pointer'
                    }
                    ${isSelected 
                      ? 'bg-orange-500 text-white font-semibold hover:bg-orange-600' 
                      : ''
                    }
                    ${isInRange && !isSelected 
                      ? 'bg-orange-500/20 text-orange-300' 
                      : ''
                    }
                    ${isToday && !isSelected 
                      ? 'ring-2 ring-orange-500/50' 
                      : ''
                    }
                  `}
                >
                  {day.date.getDate()}
                </button>
              );
            })}
          </div>

          {/* Instruções e botões */}
          <div className="mt-4 space-y-3">
            <div className="text-xs text-zinc-400 text-center">
              {isSelectingStart 
                ? "Selecione a data de início" 
                : "Selecione a data de fim"
              }
            </div>
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={clearDates}
                className="flex-1 bg-zinc-700 border-zinc-600 text-zinc-300 hover:bg-zinc-600"
              >
                Limpar
              </Button>
              <Button
                size="sm"
                onClick={() => setIsSelectingStart(!isSelectingStart)}
                className="flex-1 bg-orange-500 text-white hover:bg-orange-600"
              >
                {isSelectingStart ? "Início" : "Fim"}
              </Button>
            </div>
          </div>
        </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};