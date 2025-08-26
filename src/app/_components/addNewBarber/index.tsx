import { Input } from "@/components/ui/input";
import { ButtonComp } from "../buttonPattern";
import { FormEvent, useState } from "react";
import { Spinner } from "../spinner";
import { useBarbersContext } from "@/lib/context/BarbersContext";

export const AddNewBarber = () => {
  const [barberName, setBarberName] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const { addBarber, addingBarber, refetch } = useBarbersContext();

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
      await addBarber(formattedName);
      setBarberName("");
      setError(null);
      // Refetch após adicionar com sucesso
      await refetch();
    } catch (err) {
      setError("Erro ao adicionar barbeiro. Tente novamente.");
    }
  };

  return (
    <form
      onSubmit={handleOnSubmit}
      className="flex flex-col gap-4 max-h-[35%] max-w-[45%] min-w-[40%] items-center bg-zinc-800 p-4 rounded-lg"
    >
      <h1 className="text-xl font-bold mb-6">Adicionar Um Novo Barbeiro</h1>

      <Input
        value={barberName}
        onChange={(e) => {
          setBarberName(e.target.value);
          setError(null);
        }}
        placeholder="Nome do Barbeiro"
        disabled={addingBarber}
      />

      {error && <p className="text-red-500 text-sm">{error}</p>}

      <ButtonComp.root className="relative" disable={barberName.length < 2 || addingBarber}>
        {addingBarber ? <Spinner className="w-4 h-4" /> : "Adicionar"}
      </ButtonComp.root>
    </form>
  );
};