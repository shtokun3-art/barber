"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion, AnimatePresence } from "framer-motion";
import { UserPlus, X, Eye, EyeOff } from "lucide-react";
import { registerSchema, RegisterForm } from "@/lib/schemas/registerSchema";
import { InputAuth } from "../inputAuth";
import { ButtonComp } from "../buttonPattern";
import { Spinner } from "../spinner";
import { Success } from "../toasts/success";
import { UserNotFounded } from "../toasts/error";

interface CreatedUser {
  name: string;
  email?: string;
  phone: string;
  id: string;
}

interface CreateClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onClientCreated?: (client: CreatedUser) => void;
}

export const CreateClientModal = ({ isOpen, onClose, onClientCreated }: CreateClientModalProps) => {
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState("");
  const [loadingRegister, setLoadingRegister] = useState(false);
  const [createdUser, setCreatedUser] = useState<CreatedUser | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterForm) => {
    setLoadingRegister(true);
    try {
      const response = await fetch(`${window.location.origin}/api/clients`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Erro ao Cadastrar");
      }

      // Feedback visual imediato
      setCreatedUser(result.user);
      setLoadingRegister(false);
      
      // Toast de sucesso personalizado com nome do usuário
      Success({ text: `🎉 Cliente ${result.user.name} foi criado com sucesso!` });
      
      // Reset completo do formulário
      reset({
        name: "",
        phone: "",
        email: "",
        password: "",
        confirmPassword: ""
      });
      setName("");
      
      // Callback para notificar o componente pai
      if (onClientCreated) {
        onClientCreated(result.user);
      }
      
      // Limpar mensagem de sucesso após 3 segundos
      setTimeout(() => {
        setCreatedUser(null);
        onClose();
      }, 3000);
      
    } catch (error: unknown) {
      setLoadingRegister(false);
      UserNotFounded({ error });
    }
  };

  const handleClose = () => {
    if (!loadingRegister) {
      reset();
      setName("");
      setCreatedUser(null);
      onClose();
    }
  };

  if (!isOpen) return null;

  // Tela de sucesso
  if (createdUser) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-zinc-900 rounded-xl p-8 max-w-md w-full border border-zinc-700 shadow-2xl"
        >
          <div className="text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4"
            >
              <UserPlus size={32} className="text-white" />
            </motion.div>
            
            <motion.h3
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-xl font-bold text-white mb-2"
            >
              Cliente Criado!
            </motion.h3>
            
            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="text-zinc-300 mb-6"
            >
              <span className="font-semibold text-orange-400">{createdUser.name}</span> foi adicionado com sucesso ao sistema.
            </motion.p>
            
            <motion.button
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.8 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                setCreatedUser(null);
                reset();
                setName("");
              }}
              className="px-6 py-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg hover:from-orange-600 hover:to-orange-700 transition-all duration-200 font-semibold shadow-lg mr-3"
            >
              ➕ Criar Outro
            </motion.button>
            
            <motion.button
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.8 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleClose}
              className="px-6 py-2 bg-zinc-700 text-white rounded-lg hover:bg-zinc-600 transition-all duration-200 font-semibold"
            >
              Fechar
            </motion.button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-zinc-900 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-zinc-700 shadow-2xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-zinc-700">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-r from-orange-500 to-orange-600">
                <UserPlus size={20} className="text-white" />
              </div>
              <h2 className="text-xl font-bold text-white">
                {name ? `Cadastrando ${name}` : "Criar Novo Cliente"}
              </h2>
            </div>
            <button
              onClick={handleClose}
              disabled={loadingRegister}
              className="p-2 hover:bg-zinc-700 rounded-lg transition-colors disabled:opacity-50"
            >
              <X size={20} className="text-zinc-400" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            <p className="text-zinc-400 text-sm mb-6">
              Preencha os dados abaixo para criar um novo cliente no sistema.
            </p>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* Nome completo */}
              <div className="w-full">
                <InputAuth
                  placeholder="Nome completo do cliente"
                  text="Nome Completo"
                  message={errors.name?.message}
                  errors={errors.name}
                  id="name"
                  register={register}
                  type="text"
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              {/* Telefone e Email */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InputAuth
                  placeholder="(11) 99999-9999"
                  text="Telefone"
                  message={errors.phone?.message}
                  errors={errors.phone}
                  id="phone"
                  register={register}
                  type="tel"
                />
                
                <InputAuth
                  placeholder="email@exemplo.com (opcional)"
                  text="Email"
                  message={errors.email?.message}
                  errors={errors.email}
                  id="email"
                  register={register}
                  type="email"
                />
              </div>

              {/* Senhas */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="relative">
                  <InputAuth
                    placeholder="Crie uma senha"
                    text="Senha"
                    message={errors.password?.message}
                    errors={errors.password}
                    id="password"
                    register={register}
                    type={showPassword ? "text" : "password"}
                  />
                </div>
                
                <div className="relative">
                  <InputAuth
                    placeholder="Confirme a senha"
                    text="Confirmar Senha"
                    message={errors.confirmPassword?.message}
                    errors={errors.confirmPassword}
                    id="confirmPassword"
                    register={register}
                    type={showPassword ? "text" : "password"}
                  />
                </div>
              </div>

              {/* Mostrar senha */}
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="showPassword"
                  checked={showPassword}
                  onChange={() => setShowPassword(!showPassword)}
                  className="h-4 w-4 text-orange-500 bg-zinc-700 border-zinc-600 rounded focus:ring-orange-500 focus:ring-2 cursor-pointer"
                />
                <label htmlFor="showPassword" className="text-zinc-400 text-sm cursor-pointer">
                  {showPassword ? "Esconder senhas" : "Mostrar senhas"}
                </label>
              </div>

              {/* Botões */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={loadingRegister}
                  className="flex-1 px-4 py-3 bg-zinc-700 text-white rounded-lg hover:bg-zinc-600 transition-colors disabled:opacity-50 font-medium"
                >
                  Cancelar
                </button>
                
                <ButtonComp.root
                  disable={loadingRegister}
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-orange-500 to-orange-600 text-white py-3 rounded-lg font-medium hover:from-orange-600 hover:to-orange-700 transition-all disabled:opacity-50"
                >
                  {loadingRegister ? (
                    <div className="flex items-center justify-center gap-2">
                      <Spinner />
                      <span>Criando...</span>
                    </div>
                  ) : (
                    "Criar Cliente"
                  )}
                </ButtonComp.root>
              </div>
            </form>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};