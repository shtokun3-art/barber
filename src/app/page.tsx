"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { Clock, Users, Scissors, Star, MapPin, Phone, UserPlus } from "lucide-react";
import { getImageUrl } from "@/lib/imageUtils";

interface TopService {
  name: string;
  count: number;
  price: number;
  percentage: number;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [isVisible, setIsVisible] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [topServices, setTopServices] = useState<TopService[]>([]);
  const [servicesLoading, setServicesLoading] = useState(true);
  const [isNavigating, setIsNavigating] = useState(false);
  const [navigationTarget, setNavigationTarget] = useState<string>('');
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!loading && user) {
      router.push(`/main/${user.id}`);
    }
  }, [loading, user, router]);

  useEffect(() => {
    setIsVisible(true);
    fetchTopServices();
  }, []);

  const fetchTopServices = async () => {
    try {
      const baseUrl = window.location.origin;
      const response = await fetch(`${baseUrl}/api/dashboard/services`);
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          setTopServices(result.data.slice(0, 3)); // Get top 3 services
        }
      }
    } catch (error) {
      console.error('Error fetching top services:', error);
    } finally {
      setServicesLoading(false);
    }
  };

  // Track mouse movement
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setMousePosition({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top
        });
      }
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('mousemove', handleMouseMove);
      return () => container.removeEventListener('mousemove', handleMouseMove);
    }
  }, []);

  const handleNavigation = async (path: string, target: string) => {
    setIsNavigating(true);
    setNavigationTarget(target);
    
    // Simulate loading time for better UX
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    router.push(path);
  };

  if (loading) {
    return (
      <div className="h-dvh w-screen flex items-center justify-center bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-16 h-16 border-4 border-zinc-600 border-t-zinc-300 rounded-full animate-spin"></div>
          <p className="text-2xl font-bold text-zinc-200 animate-pulse">Carregando...</p>
        </div>
      </div>
    );
  }

  if (isNavigating) {
    return (
      <div className="h-dvh w-screen flex items-center justify-center bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900">
        <div className="flex flex-col items-center space-y-6">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-zinc-600 border-t-orange-500 rounded-full animate-spin"></div>
            <div className="absolute inset-0 w-20 h-20 border-4 border-transparent border-r-orange-400 rounded-full animate-spin" style={{animationDirection: 'reverse', animationDuration: '1.5s'}}></div>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-zinc-200 mb-2">Redirecionando...</p>
            <p className="text-lg text-zinc-400 animate-pulse">
              {navigationTarget === 'login' ? 'Preparando tela de login' : 'Preparando tela de registro'}
            </p>
          </div>
          <div className="flex space-x-1">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="w-2 h-2 bg-orange-500 rounded-full animate-bounce"
                style={{animationDelay: `${i * 0.2}s`}}
              ></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="min-h-dvh w-screen relative overflow-x-hidden overflow-y-auto bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900">
      {/* Background animated elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-zinc-700/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-zinc-700/20 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-zinc-700/20 rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>
      </div>

      {/* Falling particles animation */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(30)].map((_, i) => {
          const delay = Math.random() * 10;
          const duration = 8 + Math.random() * 4;
          const size = 2 + Math.random() * 3;
          const opacity = 0.2 + Math.random() * 0.4;
          
          return (
            <div
              key={i}
              className="absolute rounded-full bg-gradient-to-b from-orange-400/60 to-orange-600/40"
              style={{
                left: `${Math.random() * 100}%`,
                width: `${size}px`,
                height: `${size}px`,
                opacity: opacity,
                animation: `fall ${duration}s linear ${delay}s infinite`
              }}
            ></div>
          );
        })}
      </div>
      
      {/* CSS for falling animation */}
      <style jsx>{`
        @keyframes fall {
          0% {
            transform: translateY(-100vh) rotate(0deg);
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          90% {
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(360deg);
            opacity: 0;
          }
        }
      `}</style>

      {/* Main content */}
      <div className="relative z-10 min-h-dvh flex flex-col items-center justify-center px-6 py-12">
        {/* Logo section */}
        <div className={`transform transition-all duration-1000 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
          <div className="relative mb-8 group">
            <div className="absolute inset-0 bg-gradient-to-r from-zinc-600 to-zinc-400 rounded-full blur-xl opacity-50 group-hover:opacity-75 transition-opacity duration-300 animate-pulse"></div>
            <div className="relative bg-zinc-800/80 backdrop-blur-sm p-6 rounded-full border border-zinc-600/50 shadow-2xl">
              <Image
                src={getImageUrl("/img/barber_logo.png")}
                alt="Barber Logo"
                width={120}
                height={120}
                className="w-24 h-24 md:w-32 md:h-32 object-contain filter drop-shadow-lg transform group-hover:scale-105 transition-transform duration-300"
                priority
              />
            </div>
          </div>
        </div>

        {/* Title section */}
        <div className={`text-center mb-12 transform transition-all duration-1000 delay-300 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
          <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-zinc-200 via-zinc-100 to-zinc-300 bg-clip-text text-transparent">
            LA
            <span className="block text-4xl md:text-6xl bg-gradient-to-r from-zinc-400 to-zinc-500 bg-clip-text text-transparent">
              BARBEARIA WE
            </span>
          </h1>
          <p className="text-xl md:text-2xl text-zinc-300 font-light max-w-2xl mx-auto leading-relaxed text-center">
              Onde o <span className="text-zinc-200 font-semibold">clássico</span> encontra o <span className="text-zinc-200 font-semibold">estilo</span> – corte, barba e atitude com alma de vintage.
            </p>
        </div>

        {/* Buttons section */}
         <div className={`flex flex-col sm:flex-row gap-6 w-full max-w-md mx-auto justify-center items-center transform transition-all duration-1000 delay-500 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
          <Button
             onClick={() => handleNavigation('/auth/login', 'login')}
             disabled={isNavigating}
             className="group relative overflow-hidden bg-gradient-to-r from-zinc-700 to-zinc-600 hover:from-zinc-600 hover:to-zinc-500 text-white font-bold py-6 px-12 rounded-2xl border border-zinc-500/50 shadow-2xl transform hover:scale-110 transition-all duration-500 hover:shadow-zinc-500/25 min-w-[200px] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
           >
             <div className="absolute inset-0 bg-gradient-to-r from-zinc-500 to-zinc-400 opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
             <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-700 ease-in-out"></div>
             <span className="relative z-10 text-xl">Entrar</span>
           </Button>

          <Button
             onClick={() => handleNavigation('/auth/register', 'register')}
             disabled={isNavigating}
             className="group relative overflow-hidden bg-transparent hover:bg-zinc-800/50 text-zinc-200 font-bold py-6 px-12 rounded-2xl border-2 border-zinc-500 hover:border-zinc-400 shadow-2xl transform hover:scale-110 transition-all duration-500 hover:shadow-zinc-400/25 min-w-[200px] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
           >
             <div className="absolute inset-0 bg-gradient-to-r from-zinc-600 to-zinc-500 opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
             <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full bg-gradient-to-r from-transparent via-zinc-300/40 to-transparent transition-transform duration-700 ease-in-out"></div>
             <span className="relative z-10 text-xl">Registrar</span>
           </Button>
        </div>

        {/* Features section */}
        <div className={`mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl w-full transform transition-all duration-1000 delay-700 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
          {[
            { 
              icon: <Scissors className="w-8 h-8" />, 
              title: "Cortes Profissionais", 
              desc: "Estilos clássicos e modernos com técnicas refinadas",
              color: "from-orange-500 to-red-500"
            },
            { 
              icon: <Users className="w-8 h-8" />, 
              title: "Experiência Premium", 
              desc: "Atendimento personalizado em ambiente acolhedor",
              color: "from-blue-500 to-purple-500"
            },
            { 
              icon: <Star className="w-8 h-8" />, 
              title: "Tradição & Qualidade", 
              desc: "Anos de experiência com os melhores produtos",
              color: "from-yellow-500 to-orange-500"
            }
          ].map((feature, index) => (
            <div
              key={index}
              className="group bg-zinc-800/60 backdrop-blur-sm p-8 rounded-2xl border border-zinc-600/40 hover:border-zinc-500/60 transition-all duration-500 hover:bg-zinc-700/60 transform hover:scale-105 hover:shadow-2xl"
            >
              <div className={`inline-flex p-4 rounded-xl bg-gradient-to-r ${feature.color} mb-6 transform group-hover:scale-110 transition-transform duration-300`}>
                <div className="text-white">
                  {feature.icon}
                </div>
              </div>
              <h3 className="text-xl font-bold text-zinc-100 mb-3">{feature.title}</h3>
              <p className="text-zinc-300 text-base leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </div>
        
        {/* Services section - Only show if there are services or loading */}
        {(servicesLoading || topServices.length > 0) && (
          <div className={`mt-20 max-w-6xl w-full transform transition-all duration-1000 delay-900 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-zinc-100 mb-4">
                {servicesLoading ? 'Nossos Serviços' : 'Top 3 Serviços Mais Procurados'}
              </h2>
              <p className="text-zinc-300 text-lg max-w-2xl mx-auto">
                {servicesLoading ? 'Carregando serviços...' : 'Os serviços mais populares baseados nos agendamentos recentes'}
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {servicesLoading ? (
                // Loading skeleton
                [...Array(3)].map((_, index) => (
                  <div key={index} className="bg-zinc-800/50 backdrop-blur-sm p-6 rounded-xl border border-zinc-600/30 animate-pulse">
                    <div className="h-6 bg-zinc-700 rounded mb-4"></div>
                    <div className="flex justify-between items-center">
                      <div className="h-8 w-20 bg-zinc-700 rounded"></div>
                      <div className="h-4 w-16 bg-zinc-700 rounded"></div>
                    </div>
                  </div>
                ))
              ) : (
                topServices.map((service, index) => (
                  <div key={index} className="bg-zinc-800/50 backdrop-blur-sm p-6 rounded-xl border border-zinc-600/30 hover:border-orange-500/50 transition-all duration-300 group relative">
                    <div className="absolute top-3 right-3 bg-orange-500/20 text-orange-400 text-xs px-2 py-1 rounded-full">
                      #{index + 1} Mais Popular
                    </div>
                    <h4 className="text-lg font-semibold text-zinc-100 mb-2 group-hover:text-orange-400 transition-colors pr-20">{service.name}</h4>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-2xl font-bold text-orange-500">R$ {service.price.toFixed(2)}</span>
                      <div className="flex items-center text-zinc-400 text-sm">
                        <Users className="w-4 h-4 mr-1" />
                        {service.count} agendamentos
                      </div>
                    </div>
                    <div className="w-full bg-zinc-700 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-orange-500 to-orange-400 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${service.percentage}%` }}
                      ></div>
                    </div>
                    <p className="text-zinc-400 text-xs mt-2">{service.percentage.toFixed(1)}% dos agendamentos</p>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
        
        {/* Contact section */}
        <div className={`mt-20 max-w-4xl w-full transform transition-all duration-1000 delay-1000 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
          <div className="bg-gradient-to-r from-zinc-800/80 to-zinc-700/80 backdrop-blur-sm p-8 md:p-12 rounded-2xl border border-zinc-600/40">
            <div className="text-center mb-8">
              <h2 className="text-3xl md:text-4xl font-bold text-zinc-100 mb-4">Visite Nossa Barbearia</h2>
              <p className="text-zinc-300 text-lg">Estamos localizados no coração da cidade, prontos para atendê-lo</p>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="bg-orange-500/20 p-3 rounded-lg">
                    <MapPin className="w-6 h-6 text-orange-500" />
                  </div>
                  <div>
                    <h4 className="text-zinc-100 font-semibold">Endereço</h4>
                    <p className="text-zinc-300">Avenida Francisco Lima, Porto da Rua</p>
                    <p className="text-zinc-300">São Miguel dos Milagres - AL, 57940000</p>
                    <p className="text-zinc-300">Brasil</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <div className="bg-orange-500/20 p-3 rounded-lg">
                    <Phone className="w-6 h-6 text-orange-500" />
                  </div>
                  <div>
                    <h4 className="text-zinc-100 font-semibold">Telefone</h4>
                    <p className="text-zinc-300">(82) 98218-3687</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <div className="bg-orange-500/20 p-3 rounded-lg">
                    <Clock className="w-6 h-6 text-orange-500" />
                  </div>
                  <div>
                    <h4 className="text-zinc-100 font-semibold">Horário</h4>
                    <p className="text-zinc-300">Seg à Sáb: 08:00 às 20:00</p>
                    <p className="text-zinc-300">Dom: Fechado</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-zinc-800/80 p-6 rounded-xl">
                <h4 className="text-zinc-100 font-semibold mb-4">Por que escolher a WE Barbearia?</h4>
                <ul className="space-y-2 text-zinc-300">
                  <li className="flex items-center space-x-2">
                    <Star className="w-4 h-4 text-orange-500" />
                    <span>Profissionais experientes</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <Star className="w-4 h-4 text-orange-500" />
                    <span>Produtos de alta qualidade</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <Star className="w-4 h-4 text-orange-500" />
                    <span>Ambiente acolhedor</span>
                  </li>
                </ul>
              </div>
            </div>
            
            {/* Google Maps Integration */}
            <div className="mt-8">
              <div className="p-4 rounded-xl text-center space-y-4">
                <a
                  href="https://maps.app.goo.gl/VNFyqmnoQZmHRh9T9?g_st=awb"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-2 bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg transition-colors duration-200 font-medium"
                >
                  <MapPin className="w-5 h-5" />
                  <span>Abrir no Google Maps</span>
                </a>
              </div>
            </div>
          </div>
        </div>
        
      </div>
      
      {/* Seção Criar Conta */}
      <div className="py-16 bg-zinc-900">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="bg-zinc-800/50 p-8 rounded-2xl border border-zinc-700">
            <h3 className="text-2xl font-bold text-white mb-4">
              Não tem uma Conta?
            </h3>
            <p className="text-zinc-300 mb-6">
              Crie sua conta agora e tenha acesso completo ao nosso sistema de agendamento
            </p>
            <a
              href="/auth/register"
              className="inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-orange-500/25"
            >
              <UserPlus className="w-5 h-5 mr-2" />
              Criar Conta
            </a>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-zinc-950 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center text-zinc-400 text-sm mb-6">
            <p>&copy; {new Date().getFullYear()} Barbearia WE. Todos os direitos reservados.</p>
          </div>
          
          {/* Botão Voltar ao Topo */}
          <div className="text-center">
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="inline-flex items-center justify-center px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white rounded-lg transition-all duration-300 transform hover:scale-105 border border-zinc-700 hover:border-zinc-600"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
              </svg>
              Voltar ao Topo
            </button>
          </div>
        </div>
      </div>
      
      {/* WhatsApp Floating Button - Mobile Only */}
       <div className="fixed bottom-6 right-6 z-50 md:hidden">
         <a
           href="https://wa.me/5582982183687"
           target="_blank"
           rel="noopener noreferrer"
           className="bg-green-500 hover:bg-green-600 text-white p-3 rounded-full shadow-lg transition-all duration-300 transform hover:scale-110 animate-bounce w-12 h-12 flex items-center justify-center"
           style={{
             animation: 'bounce 2s infinite'
           }}
         >
           <svg
             className="w-5 h-5"
             fill="currentColor"
             viewBox="0 0 24 24"
             xmlns="http://www.w3.org/2000/svg"
           >
             <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.465 3.488"/>
           </svg>
         </a>
       </div>
    </div>
  );
}