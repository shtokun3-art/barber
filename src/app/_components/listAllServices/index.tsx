import { useServicesContext } from "@/lib/context/servicesContext";
import { ServiceComponent } from "../serviceComponent";
import { Spinner } from "../spinner";
import { Service } from "@/lib/hooks/useServices";

interface ListAllServicesProps {
  findService: string;
}

export const ListAllServices = ({ findService }: ListAllServicesProps) => {
  const { loading, services } = useServicesContext();

  const filteredServices = services?.filter((service: Service) =>
    service.name.toLowerCase().includes(findService.toLowerCase())
  );

  return (
    <main className="p-4 h-full w-[60%] rounded-lg max-h-[450px] bg-zinc-800 flex flex-col gap-2 overflow-auto custom-scrollbar">

      <header className="w-full flex justify-between px-3">
        <span className=" flex-1 max-w-[50%] text-xs text-zinc-500/80">Serviço</span>
        <span className="text-xs text-zinc-500/80 w-20">Valor R$</span>
        <span className="w-12 text-xs text-zinc-500/80">Tempo</span>
        <span className="text-xs text-zinc-500/80">Remover</span>
      </header>

      {loading ? (
        <Spinner />
      ) : filteredServices && filteredServices.length > 0 ? (
        filteredServices.map((service: Service) => {
          const formattedValue = service.price.toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL",
          });
          return (
            <ServiceComponent
              key={service.id}
              service={service}
              time={service.averageTime}
              value={formattedValue}
            />
          );
        })
      ) : (
        <p className="text-zinc-400 text-center">Serviço não encontrado</p>
      )}
    </main>
  );
};