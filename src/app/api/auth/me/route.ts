// src/app/api/auth/me/route.ts
import { NextRequest, NextResponse } from "next/server";
import * as jwt from "jsonwebtoken";
import { prisma } from "@/lib/utils";
import { logger, logAuthError } from "@/lib/logger";

export async function GET(request: NextRequest) {
  const token = request.cookies.get("barberToken")?.value;
  
  if (!process.env.JWT_SECRET) {
    logger.error('JWT_SECRET não configurado', {
      component: 'auth-me',
      function: 'GET'
    });
    return NextResponse.json({ error: "Erro de configuração do servidor" }, { status: 500 });
  }
  
  const secret = process.env.JWT_SECRET;

  if (!token) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  try {
    const decoded = jwt.verify(token, secret) as { id: string; phone: string; role: string };

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        role: true, 
        color: true,
        profileImage: true,
        // Remove hasRatedOnGoogle since it's not defined in UserSelect type
      },
    });

    if (!user) {
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    logAuthError(error, {
      component: 'auth-me',
      function: 'GET',
      action: 'token_verification'
    });
    return NextResponse.json({ error: "Token inválido" }, { status: 401 });
  }
}