import { prisma } from '@/lib/utils';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const users = await prisma.user.findMany({
      orderBy: { name: 'desc' }, 
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        role: true,
        profileImage: true,
        createdAt: true,
      }, 
    });
    return NextResponse.json(users, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao listar usuários' }, { status: 500 });
  }
}