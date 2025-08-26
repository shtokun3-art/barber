import { useState, FormEvent } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "../spinner";
import { useBarbersContext } from "@/lib/context/BarbersContext";

interface AddBarberModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddBarberModal = ({ isOpen, onClose }: AddBarberModalProps) => {
  const [barberName, setBarberName] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const { addBarber, addingBarber } = useBarbersContext();

  const handleOnSubmit = async (e: FormEvent) => {
    e.preventDefault();

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

    try {
      await addBarber(formattedName); // Usar comissão padrão de 20%
      setBarberName("");
      setError(null);
      onClose();
    } catch (err) {
      setError("Erro ao adicionar barbeiro. Tente novamente.");
    }
  };

  const handleClose = () => {
    setBarberName("");
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-zinc-800 rounded-lg p-6 w-full max-w-md mx-4 border border-zinc-700">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">Novo Barbeiro</h2>
          <Button
            onClick={handleClose}
            variant="ghost"
            size="sm"
            className="text-zinc-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        <form onSubmit={handleOnSubmit} className="space-y-4">
          <div>
            <Input
              value={barberName}
              onChange={(e) => {
                setBarberName(e.target.value);
                setError(null);
              }}
              placeholder="Nome do barbeiro"
              disabled={addingBarber}
              className="bg-zinc-900 border-zinc-600 text-white placeholder:text-zinc-400"
              autoFocus
            />
            {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
            <p className="text-xs text-zinc-500 mt-2">
              A comissão padrão será de 20%. Você pode editá-la após criar o barbeiro.
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              onClick={handleClose}
              variant="outline"
              className="flex-1 border-zinc-600 text-zinc-300 hover:bg-zinc-700"
              disabled={addingBarber}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={barberName.length < 2 || addingBarber}
              className="flex-1 bg-orange-500 hover:bg-orange-600 text-white disabled:opacity-50"
            >
              {addingBarber ? (
                <div className="flex items-center gap-2">
                  <Spinner className="w-4 h-4" />
                  <span>Adicionando...</span>
                </div>
              ) : (
                "Adicionar"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};