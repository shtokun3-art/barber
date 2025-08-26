import { createContext, useContext, ReactNode } from "react";
import { useServices } from "@/lib/hooks/useServices";

interface ServicesContextType {
  services: { id: string; name: string; price: number; averageTime: number }[];
  loading: boolean;
  error: string | null;
  success: string | null;
  isSubmitting: boolean;
  deletingServiceId: string | null;
  refetch: () => Promise<void>;
  deleteService: (id: string) => Promise<void>;
  addService: (name: string, price: string, averageTime: string) => Promise<void>;
}

const ServicesContext = createContext<ServicesContextType | undefined>(undefined);

export const useServicesContext = () => {
  const context = useContext(ServicesContext);
  if (!context) {
    throw new Error("useServicesContext must be used within a ServicesProvider");
  }
  return context;
};

export const ServicesProvider = ({ children }: { children: ReactNode }) => {
  const servicesHook = useServices();

  return (
    <ServicesContext.Provider value={servicesHook}>
      {children}
    </ServicesContext.Provider>
  );
};