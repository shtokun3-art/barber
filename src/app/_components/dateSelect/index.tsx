"use client";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CalendarIcon } from "lucide-react";
import { ReactNode } from "react";

interface DateSelectProps {
  formatDate: (arg: Date) => ReactNode;
  startDate: Date | undefined;
  endDate: Date | undefined;
  onStartDateChange: (arg: Date | undefined) => void;
  onEndDateChange: (arg: Date | undefined) => void;
}

export const DateSelect = ({
  formatDate,
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
}: DateSelectProps) => {
  const formatDateForInput = (date: Date | undefined) => {
    if (!date) return "";
    const offset = date.getTimezoneOffset();
    const adjustedDate = new Date(date.getTime() + offset * 60 * 1000);
    return adjustedDate.toISOString().split("T")[0];
  };

  const adjustDateToLocal = (dateString: string) => {
    const [year, month, day] = dateString.split("-").map(Number);
    const date = new Date(year, month - 1, day);
    const offset = date.getTimezoneOffset();
    return new Date(date.getTime() - offset * 60 * 1000);
  };

  const formatStartDateWithPlusOneDay = (date: Date | undefined) => {
    if (!date) return "Data inicial";
    const newDate = new Date(date);
    newDate.setDate(newDate.getDate() + 1);
    return formatDate(newDate);
  };

  const formatEndDateWithPlusOneDay = (date: Date | undefined) => {
    if (!date) return "Data final";
    const newDate = new Date(date);
    newDate.setDate(newDate.getDate() + 1);
    return formatDate(newDate);
  };

  const getButtonText = () => {
    if (!startDate && !endDate) return "Selecionar período";
    if (!startDate) return `Até ${formatEndDateWithPlusOneDay(endDate)}`;
    if (!endDate) return `A partir de ${formatStartDateWithPlusOneDay(startDate)}`;
    return `${formatStartDateWithPlusOneDay(startDate)} - ${formatEndDateWithPlusOneDay(endDate)}`;
  };

  return (
    <div className="flex items-center space-x-2">
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="bg-zinc-700 h-12 overflow-clip border-zinc-600 w-full text-zinc-200 hover:bg-zinc-600 hover:text-zinc-100 cursor-pointer"
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {getButtonText()}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 bg-zinc-800 border-zinc-600 text-zinc-200">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Data Inicial</label>
              <Input
                type="date"
                value={formatDateForInput(startDate)}
                onChange={(e) => onStartDateChange(e.target.value ? adjustDateToLocal(e.target.value) : undefined)}
                className="bg-zinc-700 cursor-pointer w-full border-zinc-600 text-zinc-200 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Data Final</label>
              <Input
                type="date"
                value={formatDateForInput(endDate)}
                onChange={(e) => onEndDateChange(e.target.value ? adjustDateToLocal(e.target.value) : undefined)}
                className="bg-zinc-700 border-zinc-600 w-full cursor-pointer text-zinc-200 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};