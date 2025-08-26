"use client";

import { useState, useEffect, Suspense } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { InputAuthLogin } from "@/app/_components/InputAuthLogin";
import { Spinner } from "@/app/_components/spinner";
import Image from "next/image";
import { ArrowLeft, Clock } from "lucide-react";
import { ButtonComp } from "@/app/_components/buttonPattern";
import { AuthWrapper } from "@/app/_components/authWrapper";
import { Success } from "@/app/_components/toasts/success";
import { UserNotFounded } from "@/app/_components/toasts/error";
import { getImageUrl } from "@/lib/imageUtils";
import { z } from "zod";

const verifyCodeSchema = z.object({
  code: z.string().min(6, "Código deve ter 6 dígitos").max(6, "Código deve ter 6 dígitos")
    .regex(/^\d{6}$/, "Código deve conter apenas números")
});

type VerifyCodeForm = z.infer<typeof verifyCodeSchema>;

function VerifyCodeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const phone = searchParams.get('phone');
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60);
  const [canResend, setCanResend] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<VerifyCodeForm>({
    resolver: zodResolver(verifyCodeSchema),
  });

  useEffect(() => {
    if (!phone) {
      router.push('/auth/forgot-password');
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setCanResend(true);
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [phone, router]);

  const onSubmit = async (data: VerifyCodeForm) => {
    setLoading(true);
    try {
      const response = await fetch(`${window.location.origin}/api/auth/verify-code`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ phone, code: data.code }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Código inválido");
      }

      Success({ text: "Código verificado com sucesso!" });
      router.push(`/auth/reset-password?token=${result.token}`);
    } catch (error: any) {
      UserNotFounded({ error });
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (!canResend) return;
    
    setResendLoading(true);
    try {
      const response = await fetch(`${window.location.origin}/api/auth/forgot-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ phone }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Erro ao reenviar código");
      }

      Success({ text: "Novo código enviado para seu WhatsApp!" });
      setTimeLeft(60);
      setCanResend(false);
    } catch (error: any) {
      UserNotFounded({ error });
    } finally {
      setResendLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!phone) {
    return null;
  }

  return (
    <AuthWrapper>
      <span
        onClick={() => router.push(`/auth/forgot-password`)}
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
          Verificar Código
        </h1>
        <p className="text-zinc-400 text-sm text-center mb-6 max-w-md">
          Digite o código de 6 dígitos que enviamos para o WhatsApp do número <span className="text-orange-500 font-medium">+55{phone}</span>
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 w-full lg:w-[70%]">
          <InputAuthLogin
            errors={errors.code}
            message={errors.code?.message}
            id="code"
            register={register}
            type="text"
            text="Código de Verificação"
            placeholder="Digite o código de 6 dígitos"
            maxLength={6}
          />

          {!canResend && (
            <div className="flex items-center justify-center text-zinc-500 text-sm">
              <Clock className="w-4 h-4 mr-2" />
              Reenviar código em {formatTime(timeLeft)}
            </div>
          )}

          {canResend && (
            <div className="text-center">
              <button
                type="button"
                onClick={handleResendCode}
                disabled={resendLoading}
                className="text-orange-500 hover:text-orange-400 text-sm underline disabled:opacity-50"
              >
                {resendLoading ? "Reenviando..." : "Reenviar código"}
              </button>
            </div>
          )}

          {loading ? (
            <Spinner />
          ) : (
            <ButtonComp.root type="submit">
              Verificar Código
            </ButtonComp.root>
          )}
        </form>

        <div className="mt-4 text-sm cursor-pointer">
          <Link href={`/auth/forgot-password`}>
            <span className="text-zinc-400 hover:text-orange-500 transition-colors duration-200">Voltar</span>
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

export default function VerifyCodePage() {
  return (
    <Suspense fallback={<div>Carregando...</div>}>
      <VerifyCodeContent />
    </Suspense>
  );
}