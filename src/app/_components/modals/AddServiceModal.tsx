"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "../spinner";
import { Success } from "../toasts/success";
import { UserNotFounded } from "../toasts/error";
import { useServicesContext } from "@/lib/context/servicesContext";

interface AddServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddServiceModal = ({ isOpen, onClose }: AddServiceModalProps) => {
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
      onClose();
    } else {
      UserNotFounded({ error });
    }
  };

  const handleClose = () => {
    setName("");
    setPrice("");
    setAverageTime("");
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            onClick={handleClose}
          />
          
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="bg-zinc-800 rounded-xl border border-zinc-700/50 p-6 w-full max-w-md">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-500/20 rounded-lg">
                    <Plus size={20} className="text-orange-500" />
                  </div>
                  <h3 className="text-xl font-semibold text-white">Adicionar Serviço</h3>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClose}
                  className="text-zinc-400 hover:text-white hover:bg-zinc-700"
                >
                  <X size={20} />
                </Button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="service-name" className="block text-sm font-medium text-zinc-300 mb-2">
                    Nome do Serviço
                  </label>
                  <Input
                    id="service-name"
                    placeholder="Ex: Corte Simples"
                    className="w-full bg-zinc-700/50 border-zinc-600 text-white placeholder-zinc-400 focus:border-orange-500"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="service-price" className="block text-sm font-medium text-zinc-300 mb-2">
                      Valor (R$)
                    </label>
                    <Input
                      id="service-price"
                      type="number"
                      placeholder="25.00"
                      className="w-full bg-zinc-700/50 border-zinc-600 text-white placeholder-zinc-400 focus:border-orange-500"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      step="0.01"
                      min="0"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="service-time" className="block text-sm font-medium text-zinc-300 mb-2">
                      Tempo (min)
                    </label>
                    <Input
                      id="service-time"
                      type="number"
                      placeholder="30"
                      className="w-full bg-zinc-700/50 border-zinc-600 text-white placeholder-zinc-400 focus:border-orange-500"
                      value={averageTime}
                      onChange={(e) => setAverageTime(e.target.value)}
                      min="1"
                      required
                    />
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleClose}
                    className="flex-1 border-zinc-600 text-zinc-300 hover:bg-zinc-700 hover:text-white"
                    disabled={isSubmitting}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 bg-orange-500 hover:bg-orange-600 text-white"
                    disabled={isSubmitting || !name || !price || !averageTime}
                  >
                    {isSubmitting ? (
                      <>
                        <Spinner className="w-4 h-4 mr-2" />
                        Salvando...
                      </>
                    ) : (
                      "Adicionar Serviço"
                    )}
                  </Button>
                </div>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};