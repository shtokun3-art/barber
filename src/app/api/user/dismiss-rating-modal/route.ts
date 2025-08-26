import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/utils";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

interface JwtPayload {
  id: string;
  phone: string;
  role: string;
}

export async function POST(request: NextRequest) {
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

    // Registrar que o modal foi dispensado hoje
    await prisma.user.update({
      where: { id: decoded.id },
      data: {
        lastRatingModalShown: new Date()
      }
    });

    return NextResponse.json({ 
      success: true,
      message: "Modal dispensado com sucesso"
    }, { status: 200 });

  } catch (error) {
    console.error("Erro ao dispensar modal de avaliação:", error);
    return NextResponse.json(
      { error: "Erro interno no servidor" },
      { status: 500 }
    );
  }
}