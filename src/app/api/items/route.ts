import { prisma } from '@/lib/utils';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const items = await prisma.items.findMany({
      where: { active: true },
      orderBy: { createdAt: 'asc' },
    });
    return NextResponse.json(items, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao listar itens' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { item, value, qtd } = await req.json();

    if (!item || item.length < 2) {
      return NextResponse.json(
        { error: 'O nome do item deve ter pelo menos 2 caracteres' },
        { status: 400 }
      );
    }
    if (typeof value !== 'number' || value <= 0) {
      return NextResponse.json(
        { error: 'O valor deve ser um número positivo' },
        { status: 400 }
      );
    }
    if (typeof qtd !== 'number' || qtd < 0) {
      return NextResponse.json(
        { error: 'A quantidade em estoque deve ser um número não negativo' },
        { status: 400 }
      );
    }

    const newItem = await prisma.items.create({
      data: {
        item,
        value,
        qtd,
      },
    });
    return NextResponse.json(newItem, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao cadastrar item' }, { status: 500 });
  }
}