"use client";

import { useState, useEffect, Suspense } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
import { InputAuthLogin } from "@/app/_components/InputAuthLogin";
import { Spinner } from "@/app/_components/spinner";
import Image from "next/image";
import { ArrowLeft, CheckCircle } from "lucide-react";
import { ButtonComp } from "@/app/_components/buttonPattern";
import { AuthWrapper } from "@/app/_components/authWrapper";
import { Success } from "@/app/_components/toasts/success";
import { UserNotFounded } from "@/app/_components/toasts/error";
import { getImageUrl } from "@/lib/imageUtils";
import { z } from "zod";

const resetPasswordSchema = z.object({
  password: z.string().min(4, "Senha deve ter pelo menos 4 caracteres"),
  confirmPassword: z.string().min(4, "Confirmação de senha é obrigatória")
}).refine((data) => data.password === data.confirmPassword, {
  message: "Senhas não coincidem",
  path: ["confirmPassword"]
});

type ResetPasswordForm = z.infer<typeof resetPasswordSchema>;

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordForm>({
    resolver: zodResolver(resetPasswordSchema),
  });

  useEffect(() => {
    if (!token) {
      router.push('/auth/forgot-password');
    }
  }, [token, router]);

  const onSubmit = async (data: ResetPasswordForm) => {
    setLoading(true);
    try {
      const response = await fetch(`${window.location.origin}/api/auth/reset-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token, password: data.password }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Erro ao redefinir senha");
      }

      setSuccess(true);
      Success({ text: "Senha alterada com sucesso!" });
      
      // Aguardar 5 segundos e redirecionar para login
      setTimeout(() => {
        router.push('/auth/login');
      }, 5000);
    } catch (error: any) {
      UserNotFounded({ error });
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return null;
  }

  if (success) {
    return (
      <AuthWrapper>
        <div className="w-full xl:w-[50%] min-w-[300px] flex flex-col justify-center items-center relative max-h-[60%] lg:max-h-full lg:h-full">
          <div className="text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-zinc-100 mb-2 font-inter">
              Senha Alterada!
            </h1>
            <p className="text-zinc-400 text-sm mb-6">
              Sua senha foi alterada com sucesso.
            </p>
            <p className="text-zinc-500 text-xs">
              Redirecionando para o login em 5 segundos...
            </p>
          </div>
        </div>

        <div className="hidden xl:bg-[url('/bg_alternative.svg')] xl:h-full xl:bg-no-repeat xl:bg-center xl:bg-cover xl:flex-1 xl:flex xl:items-center xl:justify-center xl:rounded-4xl xl:shadow-lg">
          <Image
            src={getImageUrl('/img/barber_logo.png')}
            alt="Logo da Barbearia"
            width={450}
            height={450}
          />
        </div>
      </AuthWrapper>
    );
  }

  return (
    <AuthWrapper>
      <span
        onClick={() => router.push(`/auth/login`)}
        className="absolute cursor-pointer ease-in-out duration-200 hover:bg-orange-500 active:bg-orange-500/50 left-4 top-4 bg-zinc-600 p-2 rounded-lg"
      >
        <ArrowLeft />
      </span>

      <div className="w-full xl:w-[50%] min-w-[300px] flex flex-col justify-center items-center relative max-h-[60%] lg:max-h-full lg:h-full">
        <Image
          src={getImageUrl('/img/barber_logo.png')}
          alt="Logo da barbearia"
          width={100}
          height={100}
          className="mb-2"
        />
        <h1 className="text-2xl font-bold text-zinc-100 mb-2 font-inter text-center">
          Nova Senha
        </h1>
        <p className="text-zinc-400 text-sm text-center mb-6 max-w-md">
          Digite sua nova senha. Certifique-se de que seja segura e fácil de lembrar.
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 w-full lg:w-[70%]">
          <InputAuthLogin
            errors={errors.password}
            message={errors.password?.message}
            id="password"
            register={register}
            type={showPassword ? "text" : "password"}
            text="Nova Senha"
            placeholder="Digite sua nova senha"
          />

          <InputAuthLogin
            errors={errors.confirmPassword}
            message={errors.confirmPassword?.message}
            id="confirmPassword"
            register={register}
            type={showPassword ? "text" : "password"}
            text="Confirmar Nova Senha"
            placeholder="Confirme sua nova senha"
          />

          <div className="flex items-center space-x-2 w-full">
            <input
              type="checkbox"
              id="showPassword"
              checked={showPassword}
              onChange={() => setShowPassword(!showPassword)}
              className="h-4 w-4 text-zinc-500 bg-zinc-700 border-zinc-600 rounded focus:ring-zinc-500 cursor-pointer"
            />
            <label htmlFor="showPassword" className="text-zinc-400 text-sm">
              {showPassword ? "Esconder Senhas" : "Mostrar Senhas"}
            </label>
          </div>

          {loading ? (
            <Spinner />
          ) : (
            <ButtonComp.root type="submit">
              Alterar Senha
            </ButtonComp.root>
          )}
        </form>
      </div>

      <div className="hidden xl:bg-[url('/bg_alternative.svg')] xl:h-full xl:bg-no-repeat xl:bg-center xl:bg-cover xl:flex-1 xl:flex xl:items-center xl:justify-center xl:rounded-4xl xl:shadow-lg">
        <Image
          src={getImageUrl('/img/barber_logo.png')}
          alt="Logo da Barbearia"
          width={450}
          height={450}
        />
      </div>
    </AuthWrapper>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div>Carregando...</div>}>
      <ResetPasswordContent />
    </Suspense>
  );
}