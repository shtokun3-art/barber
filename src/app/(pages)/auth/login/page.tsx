"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { API_URL } from "@/lib/utils";
import { useAuth } from "@/lib/AuthContext";
import { InputAuthLogin } from "@/app/_components/InputAuthLogin";
import { Spinner } from "@/app/_components/spinner";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";
import { ButtonComp } from "@/app/_components/buttonPattern";
import { AuthWrapper } from "@/app/_components/authWrapper";
import { Success } from "@/app/_components/toasts/success";
import { UserNotFounded } from "@/app/_components/toasts/error";
import { loginSchema, LoginForm } from "@/lib/schemas/loginSchema";
import { AuthLoadingScreen, RedirectingScreen } from "@/app/_components/loadingScreen";
import { getImageUrl } from "@/lib/imageUtils";

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const { setUser, user, loading, redirectToCorrectPage } = useAuth();
  const [loadingLog, setLoadingLog] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [redirectTarget, setRedirectTarget] = useState<'client' | 'admin'>('client');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  useEffect(() => {
    if (user && !isRedirecting) {
      setIsRedirecting(true);
      setRedirectTarget(user.role === 'client' ? 'client' : 'admin');
      
      // Pequeno delay para mostrar a tela de redirecionamento
      setTimeout(() => {
        redirectToCorrectPage(user);
      }, 1500);
    }
  }, [user, loading, redirectToCorrectPage, isRedirecting]);

  if (loading) {
    return <AuthLoadingScreen />;
  }

  if (user && isRedirecting) {
    return <RedirectingScreen target={redirectTarget} userName={user.name} />;
  }

  const onSubmit = async (data: LoginForm) => {
    setLoadingLog(true);
    try {
      const response = await fetch(`${window.location.origin}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
        credentials: "include",
      });

      const result = await response.json();

      if (!response.ok) {
        setLoadingLog(false);
        throw new Error(result.error || "Erro ao fazer login");
      }

      const userData = {
        id: result.id,
        name: result.name,
        phone: result.phone,
        email: result.email || null,
        role: result.role,
      };
      
      setUser(userData);
      setLoadingLog(false);
      Success({ text: `Login Bem Sucedido, Seja Bem Vindo(a) ${result.name}` });
      
      // O redirecionamento será feito pelo useEffect
    } catch (error: any) {
      setLoadingLog(false);
      UserNotFounded({ error });
    }
  };

  return (
    <AuthWrapper>
      <span
        onClick={() => router.push(`/`)}
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
        <h1 className="text-2xl font-bold text-zinc-100 mb-6 font-inter text-center">
          Bem Vindo de Volta!
        </h1>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 w-full lg:w-[70%]">
          <InputAuthLogin
            errors={errors.identifier}
            message={errors.identifier?.message}
            id="identifier"
            register={register}
            type="text"
            text="Email ou Telefone"
            placeholder="Digite seu email ou telefone"
          />
          <InputAuthLogin
            errors={errors.password}
            message={errors.password?.message}
            id="password"
            register={register}
            type={showPassword ? "text" : "password"}
            text="Senha"
            placeholder="Digite sua senha"
            showPassword={showPassword}
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
              {showPassword ? "Esconder Senha" : "Mostrar Senha"}
            </label>
          </div>

          {loadingLog ? (
            <Spinner />
          ) : (
            <ButtonComp.root type="submit">
              Entrar
            </ButtonComp.root>
          )}
        </form>

        <div className="mt-4 text-sm cursor-pointer space-y-2">
          <div>
            <Link href={`/auth/register`}>
              Não tem uma conta? <b className="text-orange-500">Registrar</b>
            </Link>
          </div>
          <div>
            <Link href={`/auth/forgot-password`}>
              <span className="text-zinc-400 hover:text-orange-500 transition-colors duration-200">Esqueci minha senha</span>
            </Link>
          </div>
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