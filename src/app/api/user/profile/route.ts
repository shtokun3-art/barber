import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const prisma = new PrismaClient();

export async function PUT(request: NextRequest) {
  try {
    const token = request.cookies.get("barberToken")?.value;
    
    if (!token) {
      return NextResponse.json(
        { error: "Token não encontrado" },
        { status: 401 }
      );
    }

    const secret = process.env.JWT_SECRET || "X7GmP9LqT2VwZ8B5nK1Y4CdR6FsJ3NxAoMHQDpWtCU";
    const decoded = jwt.verify(token, secret) as { id: string; phone: string; role: string };
    const userId = decoded.id;

    const body = await request.json();
    const { name, phone, email, currentPassword, newPassword, profileImage } = body;

    // Verificar se o usuário existe
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 }
      );
    }

    // Preparar dados para atualização
    const updateData: any = {};

    if (name && name !== user.name) {
      updateData.name = name;
    }

    if (phone && phone !== user.phone) {
      // Verificar se o telefone já está em uso por outro usuário
      const existingUser = await prisma.user.findFirst({
        where: {
          phone: phone,
          id: { not: userId }
        }
      });

      if (existingUser) {
        return NextResponse.json(
          { error: "Este telefone já está em uso por outro usuário" },
          { status: 400 }
        );
      }

      updateData.phone = phone;
    }

    if (email !== undefined && email !== user.email) {
      if (email) {
        // Verificar se o email já está em uso por outro usuário
        const existingUser = await prisma.user.findFirst({
          where: {
            email: email,
            id: { not: userId }
          }
        });

        if (existingUser) {
          return NextResponse.json(
            { error: "Este email já está em uso por outro usuário" },
            { status: 400 }
          );
        }
      }
      updateData.email = email;
    }

    if (profileImage !== undefined) {
      updateData.profileImage = profileImage;
    }

    // Se uma nova senha foi fornecida, verificar a senha atual
    if (newPassword) {
      if (!currentPassword) {
        return NextResponse.json(
          { error: "Senha atual é obrigatória para alterar a senha" },
          { status: 400 }
        );
      }

      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
      if (!isCurrentPasswordValid) {
        return NextResponse.json(
          { error: "Senha atual incorreta" },
          { status: 400 }
        );
      }

      const hashedNewPassword = await bcrypt.hash(newPassword, 10);
      updateData.password = hashedNewPassword;
    }

    // Atualizar o usuário
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        role: true,
        color: true,
        profileImage: true,
        createdAt: true
      }
    });

    return NextResponse.json({
      message: "Perfil atualizado com sucesso",
      user: updatedUser
    });

  } catch (error) {
    console.error("Erro ao atualizar perfil:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("barberToken")?.value;
    
    if (!token) {
      console.log("[DEBUG] Token não encontrado nos cookies");
      return NextResponse.json(
        { error: "Token não encontrado" },
        { status: 401 }
      );
    }

    const secret = process.env.JWT_SECRET || "X7GmP9LqT2VwZ8B5nK1Y4CdR6FsJ3NxAoMHQDpWtCU";
    
    let decoded;
    try {
      decoded = jwt.verify(token, secret) as { id: string; phone: string; role: string };
      console.log("[DEBUG] Token decodificado:", { id: decoded.id, phone: decoded.phone, role: decoded.role });
    } catch (jwtError) {
      console.error("[DEBUG] Erro ao verificar JWT:", jwtError);
      return NextResponse.json(
        { error: "Token inválido" },
        { status: 401 }
      );
    }
    
    const userId = decoded.id;
    console.log("[DEBUG] Buscando usuário com ID:", userId);

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        role: true,
        color: true,
        profileImage: true,
        createdAt: true
      }
    });

    console.log("[DEBUG] Usuário encontrado:", user ? "SIM" : "NÃO");
    if (user) {
      console.log("[DEBUG] Dados do usuário:", { id: user.id, name: user.name, phone: user.phone });
    }

    if (!user) {
      console.log("[DEBUG] Usuário não encontrado no banco de dados para ID:", userId);
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json({ user });

  } catch (error) {
    console.error("[DEBUG] Erro ao buscar perfil:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}