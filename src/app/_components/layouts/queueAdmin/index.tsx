import { Clock3Icon, RefreshCw } from "lucide-react";
import { BarberSelector } from "../../barberSelector";
import { QueueAdminTable } from "../../queueAdminTable";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useQueue } from "@/lib/hooks/useQueue";
import { useBarbersContext } from "@/lib/context/BarbersContext";
import { ServicesProvider } from "@/lib/context/servicesContext";
import { ItemsProvider } from "@/lib/context/ItemsContext";

export const QueueAdmin = () => {
  const { barbers } = useBarbersContext();
  const [selectedBarber, setSelectedBarber] = useState<string | null>(null);
  const { refetch, loading } = useQueue();

  return (
    <section className="w-full h-full overflow-clip">
      <header className="flex flex-col gap-6 justify-between glass-card-dark p-4 lg:p-6 mb-6 mx-2 lg:mx-6 mt-2 rounded-xl">
        <div className="flex gap-4 items-center">
          <div className="p-3 rounded-xl bg-gradient-primary shadow-glow">
            <Clock3Icon className="lg:size-8 size-6 text-white" />
          </div>
          <h1 className="font-bold lg:text-3xl text-gradient-primary">Gerenciamento de Fila</h1>
          <Button
            onClick={() => refetch()}
            disabled={loading}
            className="btn-glass flex items-center justify-center w-12 h-12 rounded-xl ml-auto focus-ring disabled:opacity-50"
          >
            <RefreshCw
              className={`text-orange-500 ${loading ? "animate-spin" : ""}`}
              size={20}
            />
          </Button>
        </div>

        <BarberSelector
          barbers={barbers}
          onChange={setSelectedBarber}
          value={selectedBarber}
          placeholder="Barbeiro"
          searchPlaceholder="Pesquisar..."
          className="w-full lg:max-w-[300px]"
        />
      </header>

      <main className="px-2 lg:px-6 pb-6 overflow-auto custom-scrollbar w-full h-full">
        <ServicesProvider>
          <ItemsProvider>
            <QueueAdminTable selectedBarber={selectedBarber} />
          </ItemsProvider>
        </ServicesProvider>
      </main>
    </section>
  );
};