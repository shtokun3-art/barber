import { useState, useEffect } from "react";
import { API_URL } from "@/lib/utils";

export interface Service {
  id: string;
  name: string;
  price: number;
  averageTime: number;
}

const isValidUUID = (id: string) => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
};

export const useServices = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [deletingServiceId, setDeletingServiceId] = useState<string | null>(null);

  const fetchServices = async () => {
    try {
      setLoading(true);
      const baseUrl = window.location.origin;
      const response = await fetch(`${baseUrl}/api/services`, {
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error(`Erro ao buscar serviços: ${response.status} ${response.statusText}`);
      }
      const data: Service[] = await response.json();

      const validServices = data.filter((service) => {
        if (!isValidUUID(service.id)) {
          console.warn(`ID inválido encontrado: ${service.id}`);
          return false;
        }
        return true;
      });

      setServices(validServices);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
    } finally {
      setLoading(false);
    }
  };

  const deleteService = async (id: string) => {
    try {
      if (!isValidUUID(id)) {
        throw new Error("ID inválido para exclusão");
      }

      setDeletingServiceId(id);
      setError(null);

      const baseUrl = window.location.origin;
      const response = await fetch(`${baseUrl}/api/services/${id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Erro ao apagar serviço: ${response.status} ${response.statusText}`);
      }

      await fetchServices();
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
    } finally {
      setDeletingServiceId(null);
    }
  };

  const addService = async (name: string, price: string, averageTime: string) => {
    try {
      setError(null);
      setSuccess(null);
      setIsSubmitting(true);

      if (!name.trim()) {
        throw new Error("Nome do serviço é obrigatório");
      }

      const priceValue = parseFloat(price);
      if (isNaN(priceValue) || priceValue <= 0) {
        throw new Error("Preço deve ser um número maior que 0");
      }

      const timeValue = parseInt(averageTime);
      if (isNaN(timeValue) || timeValue <= 0) {
        throw new Error("Tempo médio deve ser um número maior que 0");
      }

      const baseUrl = window.location.origin;
      const response = await fetch(`${baseUrl}/api/services`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
          price: priceValue,
          averageTime: timeValue,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Erro ao adicionar serviço");
      }

      setSuccess("Serviço adicionado com sucesso!");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  return {
    services,
    loading,
    error,
    success,
    isSubmitting,
    deletingServiceId,
    refetch: fetchServices,
    deleteService,
    addService,
  };
};