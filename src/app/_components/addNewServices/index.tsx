// src/app/_components/AddNewServices.tsx
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Spinner } from "../spinner";
import { Success } from "../toasts/success";
import { UserNotFounded } from "../toasts/error";
import { useServicesContext } from "@/lib/context/servicesContext";
import { Input } from "@/components/ui/input";

export const AddNewServices = () => {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [averageTime, setAverageTime] = useState("");
  const { addService, error, isSubmitting, refetch } = useServicesContext();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    await addService(name, price, averageTime);

    if (!error) {
      setName("");
      setPrice("");
      setAverageTime("");
      await refetch();
      Success({ text: "Serviço Criado Com Sucesso" });
    } else {
      UserNotFounded({ error });
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex-1 rounded-lg p-4 border-b border-zinc-200/50 flex justify-center flex-col items-center bg-zinc-800 max-h-[300px]"
    >
      <h2 className="font-semibold">Adicionar Um Novo Serviço</h2>

      <div className="w-full mt-6 flex flex-col gap-1">
        <Input
          id="service"
          placeholder="Nome do Serviço..."
          className=" w-full p-2 px-4 rounded-lg outline-none text-white"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>

      <div className="flex 2xl:flex-row flex-col w-full justify-between 2xl:gap-6">
        <div className="w-full mt-6 flex flex-col gap-1">
          <Input
            id="value"
            type="number"
            placeholder="Valor R$"
            className=" w-full p-2 px-4 rounded-lg outline-none text-white"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            step="0.01"
          />
        </div>

        <div className="w-full mt-6 flex flex-col gap-1">
          <Input
            id="averageTime"
            type="number"
            placeholder="Tempo em Minutos"
            className=" w-full p-2 px-4 rounded-lg outline-none text-white"
            value={averageTime}
            onChange={(e) => setAverageTime(e.target.value)}
          />
        </div>
      </div>

      <Button
        type="submit"
        className="w-full p-2 bg-orange-500 mt-6 cursor-pointer duration-200 ease-in-out hover:bg-orange-500/60 disabled:bg-orange-700 disabled:cursor-not-allowed"
        disabled={isSubmitting || name === '' || price === '' || averageTime === ''}
      >
        {isSubmitting ? <Spinner className="absolute top-1/2 left-1/2" /> : "Adicionar Serviço"}
      </Button>
    </form>
  );
};