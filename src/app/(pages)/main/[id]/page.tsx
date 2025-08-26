"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import { motion, AnimatePresence } from "framer-motion"
import { Spinner } from "@/app/_components/spinner";
import { NavBarMainPage } from "@/app/_components/main/navigationBar";
import { API_URL } from "@/lib/utils";
import { HeaderMainPageMobile } from "@/app/_components/main/header";
import { QueueAdmin } from "@/app/_components/layouts/queueAdmin";
import { SettingsAdmin } from "@/app/_components/layouts/settings";
import { HistoryAdmin } from "@/app/_components/layouts/history";
import { BarbersProvider } from "@/lib/context/BarbersContext";
import { ItemsProvider } from "@/lib/context/ItemsContext";
import { ClientsAdmin } from "@/app/_components/layouts/clients";
import { DashboardAdmin } from "@/app/_components/layouts/dashboard";
import { AuthLoadingScreen, RedirectingScreen } from "@/app/_components/loadingScreen";

export type PageSelected = "dashboard" | "history" | "queue" | "settings" | "clients"

export default function MainPage() {
  const { user, loading, logout, redirectToCorrectPage } = useAuth()
  const router = useRouter()
  const [page, setPage] = useState<PageSelected>("queue")
  const [openSide, setOpenSide] = useState<boolean>(false)
  const [isRedirecting, setIsRedirecting] = useState(false)

  useEffect(() => {
    if (!loading && !user) {
      router.replace(`/auth/login`)
    }

    if (user?.role === 'client' && !isRedirecting) {
      setIsRedirecting(true)
      setTimeout(() => {
        redirectToCorrectPage(user)
      }, 1000)
    }
  }, [loading, user, router, redirectToCorrectPage, isRedirecting])

  if (loading) {
    return <AuthLoadingScreen />;
  }

  if (user?.role === 'client' && isRedirecting) {
    return <RedirectingScreen target="client" userName={user.name} />;
  }

  return (
    
    <div className="relative h-dvh w-screen flex flex-col lg:flex-row bg-gradient-dark text-white overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 25% 25%, #f97316 0%, transparent 50%), 
                           radial-gradient(circle at 75% 75%, #ea580c 0%, transparent 50%)`,
          backgroundSize: '400px 400px'
        }} />
      </div>


      <AnimatePresence>
        {openSide && (
          <>
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed top-0 left-0 h-full w-[280px] max-w-[80vw] shadow-lg z-50 lg:hidden"
            >
              <NavBarMainPage setPage={setPage} page={page} className="absolute top-0 left-0 w-full"/>
            </motion.div>


            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="fixed top-0 left-0 w-full h-full bg-black/60 z-40 lg:hidden"
              onClick={() => setOpenSide(false)}
            />
          </>
        )}
      </AnimatePresence>

        {/* Header apenas no mobile */}
      <HeaderMainPageMobile openSide={openSide} setOpenSide={setOpenSide}/>

      <NavBarMainPage 
      setPage={setPage} 
      page={page}
      className="hidden lg:flex lg:w-[280px] xl:w-[300px] lg:min-w-[250px] lg:shadow-md lg:flex-shrink-0"
      />

      


      <main
      className="flex-1 pt-16 sm:pt-20 pb-4 lg:pt-6 lg:pb-6 w-full min-w-0"
      >
        <BarbersProvider>
          {page === 'dashboard' && <DashboardAdmin/>}

          {page === 'queue' && <QueueAdmin/>}

          {page === 'history' && (
            <ItemsProvider>
              <HistoryAdmin/>
            </ItemsProvider>
          )}

          {page === 'settings' && <SettingsAdmin/>}

          {page === 'clients' && <ClientsAdmin/>}
        </BarbersProvider>
      </main>

    </div>
  )
}