'use client'

import { useAuth } from "@/lib/AuthContext";
import { LogoutScreen } from "../loadingScreen";
import { ReactNode } from "react";

interface LogoutWrapperProps {
  children: ReactNode;
}

export function LogoutWrapper({ children }: LogoutWrapperProps) {
  const { loggingOut } = useAuth();

  if (loggingOut) {
    return <LogoutScreen />;
  }

  return <>{children}</>;
}