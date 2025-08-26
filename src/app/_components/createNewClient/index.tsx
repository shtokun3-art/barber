"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { API_URL } from "@/lib/utils";
import { InputAuth } from "../inputAuth";
import { Spinner } from "../spinner";
import { registerSchema, RegisterForm } from "@/lib/schemas/registerSchema";
import { ButtonComp } from "../buttonPattern";
import { UserNotFounded } from "../toasts/error";
import { Success } from "../toasts/success";
import { UserPlus, CheckCircle } from "lucide-react";
import { motion } from "framer-motion";

export const CreateNewClient = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState("");
  const [loadingRegister, setLoadingRegister] = useState(false);
  interface CreatedUser {
    id: string;
    name: string;
    phone: string;
    email?: string;
  }

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
      
      // Limpar mensagem de sucesso após 6 segundos para dar tempo de visualizar
      setTimeout(() => {
        setCreatedUser(null);
      }, 6000);
      
    } catch (error: unknown) {
      setLoadingRegister(false);
      UserNotFounded({ error });
    }
  };

  if (createdUser) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col items-center justify-center h-full space-y-6"
      >
        <div className="glass-card-dark p-8 rounded-xl text-center max-w-md relative overflow-hidden">
          {/* Efeito de confete animado */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 pointer-events-none"
          >
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ y: -20, opacity: 0, rotate: 0 }}
                animate={{ 
                  y: [0, 100, 200], 
                  opacity: [0, 1, 0],
                  rotate: [0, 180, 360]
                }}
                transition={{ 
                  duration: 2,
                  delay: i * 0.1,
                  repeat: Infinity,
                  repeatDelay: 3
                }}
                className="absolute w-2 h-2 bg-gradient-to-r from-orange-400 to-yellow-400 rounded-full"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 20}%`
                }}
              />
            ))}
          </motion.div>
          
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.3, type: "spring", stiffness: 200, damping: 10 }}
            className="w-24 h-24 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg"
          >
            <CheckCircle size={48} className="text-white" />
          </motion.div>
          
          <motion.h2 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-3xl font-bold bg-gradient-to-r from-green-400 to-emerald-500 bg-clip-text text-transparent mb-3"
          >
            🎉 Cliente Criado!
          </motion.h2>
          
          <motion.p 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="text-zinc-300 mb-6 text-lg"
          >
            <strong className="text-orange-400">{createdUser.name}</strong> foi cadastrado com sucesso no sistema!
          </motion.p>
          
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.9 }}
            className="bg-gradient-to-r from-zinc-800 to-zinc-700 p-4 rounded-lg space-y-3 text-sm border border-zinc-600"
          >
            <div className="flex justify-between items-center">
              <span className="text-zinc-400">ID do Cliente:</span>
              <span className="font-mono text-orange-400">{createdUser.id.slice(0, 8)}...</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-zinc-400">Telefone:</span>
              <span className="text-green-400">{createdUser.phone}</span>
            </div>
            {createdUser.email && (
              <div className="flex justify-between items-center">
                <span className="text-zinc-400">Email:</span>
                <span className="text-blue-400">{createdUser.email}</span>
              </div>
            )}
            <div className="flex justify-between items-center">
              <span className="text-zinc-400">Status:</span>
              <span className="text-green-400 font-semibold">✅ Ativo</span>
            </div>
          </motion.div>
          
          <motion.button
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 1.1 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setCreatedUser(null)}
            className="mt-6 px-8 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg hover:from-orange-600 hover:to-orange-700 transition-all duration-200 font-semibold shadow-lg"
          >
            ➕ Criar Outro Cliente
          </motion.button>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col">
      <div className="glass-card-dark p-6 rounded-xl mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-gradient-primary">
            <UserPlus size={24} className="text-white" />
          </div>
          <h2 className="text-xl font-bold text-gradient-primary">
            {name ? `Cadastrando ${name}` : "Criar Novo Cliente"}
          </h2>
        </div>
        
        <p className="text-zinc-400 text-sm">
          Preencha os dados abaixo para criar um novo cliente no sistema.
        </p>
      </div>

      <div className="glass-card-dark p-6 rounded-xl flex-1">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-4xl mx-auto">
          {/* Nome completo - ocupa toda a largura */}
          <div className="w-full">
            <InputAuth
              onChange={(e) => setName(e.target.value)}
              value={name}
              errors={errors.name}
              message={errors.name?.message}
              id="name"
              register={register}
              type="text"
              text="Nome Completo"
              placeholder="Digite o nome do cliente"
            />
          </div>
          
          {/* Primeira linha - Telefone e Email */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputAuth
              placeholder="Telefone: (XX) X XXXX-XXXX"
              errors={errors.phone}
              id="phone"
              text="Telefone"
              message={errors.phone?.message}
              register={register}
              type="text"
            />
            
            <InputAuth
              placeholder="Email (opcional)"
              text="Email"
              message={errors.email?.message}
              errors={errors.email}
              id="email"
              register={register}
              type="email"
            />
          </div>
          
          {/* Segunda linha - Senha e Confirmar Senha */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputAuth
              placeholder="Senha para o cliente"
              text="Senha"
              message={errors.password?.message}
              errors={errors.password}
              id="password"
              register={register}
              type={showPassword ? "text" : "password"}
              showPassword={showPassword}
            />
            
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

          <div className="pt-4">
            <ButtonComp.root
              disable={loadingRegister}
              type="submit"
              className="w-full bg-gradient-primary text-white py-3 rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {loadingRegister ? (
                <div className="flex items-center justify-center gap-2">
                  <Spinner />
                  <span>Criando Cliente...</span>
                </div>
              ) : (
                "Criar Cliente"
              )}
            </ButtonComp.root>
          </div>
        </form>
      </div>
    </div>
  );
}