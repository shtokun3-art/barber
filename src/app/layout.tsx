import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google"; 
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/lib/AuthContext";
import { UsersProvider } from "@/lib/context/UserContext";
import { LogoutWrapper } from "./_components/logoutWrapper";

// Inicializar serviços do servidor
import "@/lib/startup";


const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});


export const metadata: Metadata = {
  title: "Barber App",
  description: "Sistema de agendamento para barbearia",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta
          name="format-detection"
          content="telephone=no, date=no, email=no, address=no"
        />
      </head>
      <body className={` ${inter.variable} antialiased`}>
        <UsersProvider>
        <AuthProvider>
          <LogoutWrapper>
            {children}
          </LogoutWrapper>
          <Toaster richColors position="top-right" />
        </AuthProvider>
        </UsersProvider>
      </body>
    </html>
  );
}