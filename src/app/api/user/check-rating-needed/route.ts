import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/utils";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

interface JwtPayload {
  id: string;
  phone: string;
  role: string;
}

export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const token = (await cookieStore).get("barberToken");

    if (!token) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    // Verificar e decodificar o token
    let decoded: JwtPayload;
    try {
      const secret = process.env.JWT_SECRET || "X7GmP9LqT2VwZ8B5nK1Y4CdR6FsJ3NxAoMHQDpWtCU";
      decoded = jwt.verify(token.value, secret) as JwtPayload;
    } catch (jwtError) {
      console.error("Erro ao verificar token JWT:", jwtError);
      return NextResponse.json({ error: "Token inválido" }, { status: 401 });
    }

    if (!decoded || !decoded.id) {
      return NextResponse.json({ error: "Token inválido" }, { status: 401 });
    }

    // Buscar o usuário
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        hasRatedOnGoogle: true,
        lastRatingModalShown: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });
    }

    // Se já avaliou, não precisa mostrar o modal
    if (user.hasRatedOnGoogle) {
      return NextResponse.json({ 
        shouldShowRatingModal: false,
        reason: "already_rated"
      }, { status: 200 });
    }

    // Verificar se o modal já foi exibido hoje
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (user.lastRatingModalShown && user.lastRatingModalShown >= today) {
      return NextResponse.json({ 
        shouldShowRatingModal: false,
        reason: "already_shown_today",
        lastShown: user.lastRatingModalShown
      }, { status: 200 });
    }

    // Verificar se teve um corte concluído nos últimos 5 minutos
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    
    const recentHistory = await prisma.history.findFirst({
      where: {
        userId: decoded.id,
        createdAt: {
          gte: fiveMinutesAgo
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    const shouldShowRatingModal = !!recentHistory;

    // Se deve mostrar o modal, registrar que foi exibido hoje
    if (shouldShowRatingModal) {
      await prisma.user.update({
        where: { id: decoded.id },
        data: {
          lastRatingModalShown: new Date()
        }
      });
    }

    return NextResponse.json({ 
      shouldShowRatingModal,
      reason: shouldShowRatingModal ? "recent_service_completed" : "no_recent_service",
      lastServiceDate: recentHistory?.createdAt || null
    }, { status: 200 });

  } catch (error) {
    console.error("Erro ao verificar necessidade de avaliação:", error);
    return NextResponse.json(
      { error: "Erro interno no servidor" },
      { status: 500 }
    );
  }
}