"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { InputAuthLogin } from "@/app/_components/InputAuthLogin";
import { Spinner } from "@/app/_components/spinner";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";
import { ButtonComp } from "@/app/_components/buttonPattern";
import { AuthWrapper } from "@/app/_components/authWrapper";
import { Success } from "@/app/_components/toasts/success";
import { UserNotFounded } from "@/app/_components/toasts/error";
import { getImageUrl } from "@/lib/imageUtils";
import { z } from "zod";

const forgotPasswordSchema = z.object({
  phone: z.string().min(1, "Telefone é obrigatório")
    .regex(/^\d{10,11}$/, "Telefone deve ter 10 ou 11 dígitos"),
  email: z.string().min(1, "Email é obrigatório")
    .email("Email deve ter um formato válido")
});

type ForgotPasswordForm = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordForm>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordForm) => {
    setLoading(true);
    try {
      const response = await fetch(`${window.location.origin}/api/auth/forgot-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          phone: data.phone,
          email: data.email 
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Erro ao enviar código");
      }

      Success({ text: "Código enviado para seu email!" });
      router.push(`/auth/verify-code?phone=${encodeURIComponent(data.phone)}`);
    } catch (error: any) {
      UserNotFounded({ error });
    } finally {
      setLoading(false);
    }
  };

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
          Esqueci minha senha
        </h1>
        <p className="text-zinc-400 text-sm text-center mb-6 max-w-md">
          Digite seu telefone e email para receber o código de verificação
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 w-full lg:w-[70%]">
          <InputAuthLogin
            errors={errors.phone}
            message={errors.phone?.message}
            id="phone"
            register={register}
            type="text"
            text="Telefone"
            placeholder="Digite seu telefone (apenas números)"
          />

          <InputAuthLogin
            errors={errors.email}
            message={errors.email?.message}
            id="email"
            register={register}
            type="text"
            text="Email"
            placeholder="Digite seu email para receber o código"
          />

          <div className="text-xs text-zinc-500 text-center">
            Formato do telefone: 11999999999 (com DDD, sem espaços)<br/>
            O código será enviado para o email informado
          </div>

          {loading ? (
            <Spinner />
          ) : (
            <ButtonComp.root type="submit">
              Enviar Código
            </ButtonComp.root>
          )}
        </form>

        <div className="mt-4 text-sm cursor-pointer">
          <Link href={`/auth/login`}>
            <span className="text-zinc-400 hover:text-orange-500 transition-colors duration-200">Voltar para o login</span>
          </Link>
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