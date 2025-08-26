import { NextResponse } from "next/server";
import * as bcrypt from "bcryptjs";
import { prisma } from "@/lib/utils";

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
  try {
    const body = await request.json();
    const { name, phone, email, password } = body;

    // Validações básicas
    if (!name || !phone || !password) {
      return NextResponse.json(
        { error: "Nome, telefone e senha são obrigatórios" },
        { status: 400 }
      );
    }

    // Verificar se o telefone já existe
    const existingUserByPhone = await prisma.user.findUnique({
      where: { phone },
    });
    if (existingUserByPhone) {
      return NextResponse.json(
        { error: "Telefone já cadastrado" },
        { status: 400 }
      );
    }

    // Verificar se o email já existe (se fornecido)
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

    // Hash da senha
    const hashedPassword = await bcrypt.hash(password, 10);

    // Criar o cliente
    const client = await prisma.user.create({
      data: {
        name: name[0].toUpperCase() + name.slice(1),
        phone,
        email: email || null,
        password: hashedPassword,
        color: generateRandomColor(),
        role: "client", // Garantir que seja sempre cliente
      },
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        role: true,
        color: true,
        createdAt: true,
      },
    });

    return NextResponse.json(
      {
        message: "Cliente criado com sucesso",
        user: client,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Erro ao criar cliente:", error);
    return NextResponse.json(
      { error: "Erro interno no servidor" },
      { status: 500 }
    );
  }
}

// GET para listar clientes (opcional)
export async function GET() {
  try {
    const clients = await prisma.user.findMany({
      where: {
        role: "client",
      },
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        color: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(clients);
  } catch (error) {
    console.error("Erro ao buscar clientes:", error);
    return NextResponse.json(
      { error: "Erro interno no servidor" },
      { status: 500 }
    );
  }
}