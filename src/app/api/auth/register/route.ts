import { NextResponse } from "next/server";
import * as bcrypt from "bcryptjs";
import * as jwt from "jsonwebtoken";
import { prisma } from "@/lib/utils";
import { logger, logAuthError, logValidationError } from "@/lib/logger";

const generateRandomColor = () => {
  const colors = [
    "bg-red-500",
    "bg-blue-500",
    "bg-green-500",
    "bg-yellow-500",
    "bg-purple-500",
    "bg-pink-500",
    "bg-indigo-500",
    "bg-teal-500",
    "bg-orange-500",
  ];
  const randomIndex = Math.floor(Math.random() * colors.length);
  return colors[randomIndex];
};

export async function POST(request: Request) {
  let body: any;
  try {
    body = await request.json();
    const { name, phone, email, password, role = "client" } = body;

    // Verificação de segurança: impedir criação de admin se já existe um
    
    if (role === "admin") {
      const existingAdmin = await prisma.user.findFirst({
        where: { role: "admin" },
      });
      if (existingAdmin) {
        return NextResponse.json(
          { error: "Não é possível criar outro administrador. Sistema já possui um administrador." },
          { status: 403 }
        );
      }
    }

    const existingUserByPhone = await prisma.user.findUnique({
      where: { phone },
    });
    if (existingUserByPhone) {
      return NextResponse.json(
        { error: "Telefone já cadastrado" },
        { status: 400 }
      );
    }

    if (email) {
      const existingUserByEmail = await prisma.user.findUnique({
        where: { email },
      });
      if (existingUserByEmail) {
        return NextResponse.json(
          { error: "Email já cadastrado" },
          { status: 400 }
        );
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name: name[0].toUpperCase() + name.slice(1),
        phone,
        email: email || null,
        password: hashedPassword,
        color: generateRandomColor(),
        role: role,
      },
    });

    // Validar JWT_SECRET
    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET não configurado');
      return NextResponse.json({ error: "Erro de configuração do servidor" }, { status: 500 });
    }

    // Criar token JWT automaticamente após registro
    const token = jwt.sign(
      { id: user.id, phone: user.phone, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "30d" }
    );

    const response = NextResponse.json(
      {
        message: "Usuário criado com sucesso",
        id: user.id,
        name: user.name,
        phone: user.phone,
        email: user.email,
        role: user.role,
        color: user.color,
      },
      { status: 201 }
    );

    // Definir cookie com token
    response.cookies.set("barberToken", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 30 * 24 * 60 * 60, // 30 dias
      path: "/",
    });

    return response;
  } catch (error) {
    logAuthError(error, {
      component: 'auth-register',
      function: 'POST',
      action: 'user_registration',
      email: body.email
    });
    return NextResponse.json(
      { error: "Erro interno no servidor" },
      { status: 500 }
    );
  }
}