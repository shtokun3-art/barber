import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/utils";
import { logger, logAuthError } from "@/lib/logger";
import * as jwt from "jsonwebtoken";
import * as bcrypt from "bcryptjs";

interface ResetTokenPayload {
  userId: string;
  phone: string;
  purpose: string;
}

export async function POST(request: NextRequest) {
  let body: any;
  try {
    body = await request.json();
    const { token, password } = body;

    if (!token || !password) {
      return NextResponse.json(
        { error: "Token e nova senha são obrigatórios" },
        { status: 400 }
      );
    }

    // Validar senha
    if (password.length < 4) {
      return NextResponse.json(
        { error: "Senha deve ter pelo menos 4 caracteres" },
        { status: 400 }
      );
    }

    // Validar JWT_SECRET
    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET não configurado');
      return NextResponse.json({ error: "Erro de configuração do servidor" }, { status: 500 });
    }

    // Verificar e decodificar o token
    let decoded: ResetTokenPayload;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET) as ResetTokenPayload;
    } catch (jwtError) {
      return NextResponse.json(
        { error: "Token inválido ou expirado" },
        { status: 400 }
      );
    }

    // Verificar se o token é para redefinição de senha
    if (decoded.purpose !== 'password_reset') {
      return NextResponse.json(
        { error: "Token inválido para esta operação" },
        { status: 400 }
      );
    }

    // Verificar se o usuário ainda existe
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 }
      );
    }

    // Verificar se o telefone ainda é o mesmo (segurança adicional)
    if (user.phone !== decoded.phone) {
      return NextResponse.json(
        { error: "Token inválido" },
        { status: 400 }
      );
    }

    // Hash da nova senha
    const hashedPassword = await bcrypt.hash(password, 10);

    // Atualizar a senha no banco de dados
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        // Limpar qualquer token restante por segurança
        tokenId: null,
        tokenExpiration: null,
      },
    });

    logger.info('Senha redefinida com sucesso', {
      component: 'auth-reset-password',
      function: 'POST',
      userId: user.id,
      phone: user.phone
    });

    return NextResponse.json({
      message: "Senha redefinida com sucesso"
    });

  } catch (error) {
    logAuthError(error, {
      component: 'auth-reset-password',
      function: 'POST',
      action: 'reset_password',
      userId: body?.userId
    });
    return NextResponse.json(
      { error: "Erro interno no servidor" },
      { status: 500 }
    );
  }
}