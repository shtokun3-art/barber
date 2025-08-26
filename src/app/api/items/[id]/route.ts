import { prisma } from '@/lib/utils';
import { NextRequest, NextResponse } from 'next/server';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { item, value, qtd } = await req.json();

  try {
    const updatedItem = await prisma.items.update({
      where: { id },
      data: {
        item,
        value: parseFloat(value),
        qtd: parseInt(qtd),
      },
    });
    return NextResponse.json(updatedItem, { status: 200 });
  } catch (error) {
    console.error('Erro ao atualizar item:', error);
    return NextResponse.json({ error: 'Erro ao atualizar item' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  try {
    // Soft delete: marcar o item como inativo em vez de deletar fisicamente
    const item = await prisma.items.update({
      where: { id },
      data: { active: false },
    });
    
    return NextResponse.json({ message: 'Item removido com sucesso', item }, { status: 200 });
  } catch (error) {
    console.error('Erro ao remover item:', error);
    return NextResponse.json({ error: 'Erro ao remover item' }, { status: 500 });
  }
}