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
    const decoded = jwt.verify(token.value, process.env.JWT_SECRET!) as JwtPayload;

    if (!decoded || !decoded.id) {
      return NextResponse.json({ error: "Token inválido" }, { status: 401 });
    }

    // Atualizar o usuário para marcar como avaliado no Google
    const updatedUser = await prisma.user.update({
      where: { id: decoded.id },
      data: { hasRatedOnGoogle: true },
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        color: true,
        profileImage: true,
        role: true,
        hasRatedOnGoogle: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ 
      message: "Usuário marcado como avaliado com sucesso",
      user: updatedUser 
    }, { status: 200 });

  } catch (error) {
    console.error("Erro ao marcar usuário como avaliado:", error);
    return NextResponse.json(
      { error: "Erro interno no servidor" },
      { status: 500 }
    );
  }
}