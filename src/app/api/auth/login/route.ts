import { NextResponse, NextRequest } from "next/server";
import * as bcrypt from "bcryptjs";
import * as jwt from "jsonwebtoken";
import { prisma } from "@/lib/utils";
import { logger, logAuthError, logValidationError } from "@/lib/logger";

export async function POST(request: NextRequest) {
  let body: any;
  try {
    body = await request.json();
    const { identifier, password } = body;

    const isEmail = identifier.includes("@");
    const user = await prisma.user.findFirst({
      where: isEmail ? { email: identifier } : { phone: identifier },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 }
      );
    }

    // Permitir múltiplas sessões ativas - verificação removida

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return NextResponse.json(
        { error: "Senha incorreta" },
        { status: 401 }
      );
    }

    // Validar JWT_SECRET
    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET não configurado');
      return NextResponse.json({ error: "Erro de configuração do servidor" }, { status: 500 });
    }

    // Múltiplas sessões permitidas - não marcar como ativa

    const token = jwt.sign(
      { id: user.id, phone: user.phone, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "30d" }
    );

    const response = NextResponse.json({
      id: user.id,
      name: user.name,
      phone: user.phone,
      email: user.email,
      role: user.role
    });

    response.cookies.set("barberToken", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 30 * 24 * 60 * 60,
      path: "/",
    });

    return response;
  } catch (error) {
    logAuthError(error, {
      component: 'auth-login',
      function: 'POST',
      action: 'login_attempt',
      identifier: body.identifier
    });
    return NextResponse.json(
      { error: "Erro interno no servidor" },
      { status: 500 }
    );
  }
}