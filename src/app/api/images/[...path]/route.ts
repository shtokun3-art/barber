import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

export async function GET(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  try {
    const resolvedParams = await params;
    const imagePath = resolvedParams.path.join('/');
    const fullPath = join(process.cwd(), 'public', imagePath);
    
    // Verificar se o arquivo existe
    if (!existsSync(fullPath)) {
      return new NextResponse('Image not found', { status: 404 });
    }
    
    // Ler o arquivo
    const imageBuffer = await readFile(fullPath);
    
    // Determinar o tipo de conteúdo baseado na extensão
    const extension = imagePath.split('.').pop()?.toLowerCase();
    let contentType = 'image/jpeg'; // padrão
    
    switch (extension) {
      case 'png':
        contentType = 'image/png';
        break;
      case 'jpg':
      case 'jpeg':
        contentType = 'image/jpeg';
        break;
      case 'gif':
        contentType = 'image/gif';
        break;
      case 'svg':
        contentType = 'image/svg+xml';
        break;
      case 'webp':
        contentType = 'image/webp';
        break;
    }
    
    // Retornar a imagem com headers apropriados
    return new NextResponse(imageBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    console.error('Erro ao servir imagem:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}