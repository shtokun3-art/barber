import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/utils";
import { logger, logAuthError } from "@/lib/logger";
import * as jwt from "jsonwebtoken";

export async function POST(request: NextRequest) {
  let body: any;
  try {
    body = await request.json();
    const { phone, code } = body;

    if (!phone || !code) {
      return NextResponse.json(
        { error: "Telefone e código são obrigatórios" },
        { status: 400 }
      );
    }

    // Validar formato do código (6 dígitos)
    const codeRegex = /^\d{6}$/;
    if (!codeRegex.test(code)) {
      return NextResponse.json(
        { error: "Código deve ter 6 dígitos" },
        { status: 400 }
      );
    }

    // Buscar usuário com o telefone e código
    const user = await prisma.user.findFirst({
      where: {
        phone,
        tokenId: code,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Código inválido ou telefone não encontrado" },
        { status: 400 }
      );
    }

    // Verificar se o código não expirou
    if (!user.tokenExpiration || new Date() > user.tokenExpiration) {
      // Limpar token expirado
      await prisma.user.update({
        where: { id: user.id },
        data: {
          tokenId: null,
          tokenExpiration: null,
        },
      });

      return NextResponse.json(
        { error: "Código expirado. Solicite um novo código." },
        { status: 400 }
      );
    }

    // Validar JWT_SECRET
    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET não configurado');
      return NextResponse.json({ error: "Erro de configuração do servidor" }, { status: 500 });
    }

    // Gerar token temporário para redefinição de senha (válido por 10 minutos)
    const resetToken = jwt.sign(
      { 
        userId: user.id, 
        phone: user.phone, 
        purpose: 'password_reset' 
      },
      process.env.JWT_SECRET,
      { expiresIn: "10m" }
    );

    // Limpar o código de verificação do banco (já foi usado)
    await prisma.user.update({
      where: { id: user.id },
      data: {
        tokenId: null,
        tokenExpiration: null,
      },
    });

    logger.info('Código verificado com sucesso', {
      component: 'auth-verify-code',
      function: 'POST',
      userId: user.id,
      phone: phone
    });

    return NextResponse.json({
      message: "Código verificado com sucesso",
      token: resetToken
    });

  } catch (error) {
    logAuthError(error, {
      component: 'auth-verify-code',
      function: 'POST',
      action: 'verify_code',
      phone: body?.phone
    });
    return NextResponse.json(
      { error: "Erro interno no servidor" },
      { status: 500 }
    );
  }
}