import { useState, FormEvent, useEffect } from "react";
import { X, Edit3, Percent } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "../spinner";
import { useBarbersContext } from "@/lib/context/BarbersContext";
import { toast } from "sonner";

interface EditBarberModalProps {
  isOpen: boolean;
  onClose: () => void;
  barber: any;
}

export const EditBarberModal = ({ isOpen, onClose, barber }: EditBarberModalProps) => {
  const [barberName, setBarberName] = useState<string>("");
  const [commissionRate, setCommissionRate] = useState<number>(20);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { refetch } = useBarbersContext();

  // Populate form when barber changes
  useEffect(() => {
    if (barber) {
      setBarberName(barber.name || "");
      setCommissionRate((barber.commissionRate || 0.20) * 100); // Convert from decimal to percentage
    }
  }, [barber]);

  const handleOnSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!barber) return;

    const formattedName = barberName
      .toLowerCase()
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ")
      .trim();

    if (formattedName.length < 2) {
      setError("O nome deve ter pelo menos 2 caracteres");
      return;
    }

    if (commissionRate < 0 || commissionRate > 100) {
      setError("A comissão deve estar entre 0% e 100%");
      return;
    }

    setIsSubmitting(true);
    try {
      const baseUrl = window.location.origin;
      const response = await fetch(`${baseUrl}/api/barbers/${barber.id}`, {
        method: "PATCH",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          name: formattedName,
          commissionRate: commissionRate / 100 // Convert to decimal
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erro ao atualizar barbeiro");
      }

      toast.success("Barbeiro atualizado com sucesso!");
      await refetch(); // Refresh the barbers list
      handleClose();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Erro ao atualizar barbeiro";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setBarberName("");
    setCommissionRate(20);
    setError(null);
    onClose();
  };

  if (!isOpen || !barber) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-zinc-800 rounded-lg p-6 w-full max-w-md mx-4 border border-zinc-700">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Edit3 className="w-5 h-5 text-blue-500" />
            Editar Barbeiro
          </h2>
          <Button
            onClick={handleClose}
            variant="ghost"
            size="sm"
            className="text-zinc-400 hover:text-white"
            disabled={isSubmitting}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        <form onSubmit={handleOnSubmit} className="space-y-4">
          {/* Nome do Barbeiro */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              Nome do Barbeiro
            </label>
            <Input
              value={barberName}
              onChange={(e) => {
                setBarberName(e.target.value);
                setError(null);
              }}
              placeholder="Nome do barbeiro"
              disabled={isSubmitting}
              className="bg-zinc-900 border-zinc-600 text-white placeholder:text-zinc-400"
              autoFocus
            />
          </div>

          {/* Comissão */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              Taxa de Comissão (%)
            </label>
            <div className="relative">
              <Input
                type="number"
                value={commissionRate}
                onChange={(e) => {
                  const value = parseFloat(e.target.value);
                  if (!isNaN(value)) {
                    setCommissionRate(Math.max(0, Math.min(100, value)));
                  }
                  setError(null);
                }}
                placeholder="15.0"
                disabled={isSubmitting}
                className="bg-zinc-900 border-zinc-600 text-white placeholder:text-zinc-400 pr-8"
                min="0"
                max="100"
                step="0.1"
              />
              <Percent className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-zinc-400" />
            </div>
            <p className="text-xs text-zinc-500 mt-1">
              Valor atual: {commissionRate.toFixed(2)}% - Exemplo: R$ 100 de serviço = R$ {(commissionRate).toFixed(2)} de comissão
            </p>
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              onClick={handleClose}
              variant="outline"
              className="flex-1 border-zinc-600 text-zinc-300 hover:bg-zinc-700"
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={barberName.length < 2 || isSubmitting}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <Spinner className="w-4 h-4" />
                  <span>Salvando...</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Edit3 className="w-4 h-4" />
                  <span>Salvar Alterações</span>
                </div>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};