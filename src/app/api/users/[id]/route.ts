import { prisma } from '@/lib/utils';
import { NextRequest, NextResponse } from 'next/server';

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  try {
    const user = await prisma.user.delete({
      where: { id },
    });
    return NextResponse.json({ message: 'Usuário deletado com sucesso', user }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao deletar usuário' }, { status: 500 });
  }
}