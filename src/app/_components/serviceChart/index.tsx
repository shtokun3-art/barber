"use client";

import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

interface ServiceChartProps {
  startDate: Date;
  endDate: Date;
}

interface ChartData {
  date: string;
  services: number;
}

export const ServiceChart = ({ startDate, endDate }: ServiceChartProps) => {
  const router = useRouter();
  const [data, setData] = useState<ChartData[]>([]);

  const generateDateRange = (start: Date, end: Date) => {
    const dates = [];
    const currentDate = new Date(start);
    while (currentDate <= end) {
      dates.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }
    return dates;
  };

  const formatDateForAxis = (date: Date) => {
    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
    });
  };

  useEffect(() => {
    const dates = generateDateRange(startDate, endDate);
    const mockData: ChartData[] = dates.map((date, index) => ({
      date: formatDateForAxis(date),
      services: Math.floor((index * 17 + 23) % 100), // Deterministic mock data
    }));
    setData(mockData);
  }, [startDate, endDate]);

  return (
    <div className="w-full min-h-[400px] bg-zinc-700 rounded shadow p-4 mt-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-zinc-100">Tendência de Visitas</h2>
        <Button
          onClick={() => router.push("/admin/schedule")}
          className="bg-blue-600 hover:bg-blue-500"
        >
          + Agendamento
        </Button>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#52525b" />
          <XAxis dataKey="date" stroke="#a1a1aa" />
          <YAxis stroke="#a1a1aa" />
          <Tooltip
            contentStyle={{
              backgroundColor: "#27272a",
              borderColor: "#52525b",
              color: "#e4e4e7",
            }}
          />
          <Bar dataKey="services">
            {data.map((entry, index) => (
              <Cell key={`cell-${entry.date}-${entry.services}-${index}`} fill="#93c5fd" />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};