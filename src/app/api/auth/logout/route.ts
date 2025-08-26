import { NextRequest, NextResponse } from "next/server";
import * as jwt from "jsonwebtoken";
import { prisma } from "@/lib/utils";
import { logger } from "@/lib/logger";

export async function POST(req: NextRequest) {
    try {
        // Obter token do cookie
        const token = req.cookies.get('barberToken')?.value;
        
        if (token && process.env.JWT_SECRET) {
            try {
                // Decodificar token para obter ID do usuário
                const decoded = jwt.verify(token, process.env.JWT_SECRET) as any;
                
                // Múltiplas sessões permitidas - não desmarcar sessão
                
                logger.info('Logout realizado', {
                    component: 'auth-logout',
                    function: 'POST',
                    userId: decoded.id
                });
            } catch (jwtError) {
                // Token inválido, mas ainda assim fazer logout
                console.log('Token inválido durante logout:', jwtError);
            }
        }
        
        const response = NextResponse.json({message: "Logout Bem Sucedido"})
        response.cookies.set('barberToken', "", {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: "strict",
            maxAge: 0,
            path: '/'
        })

        return response
    } catch (error) {
        logger.error('Erro durante logout', {
            component: 'auth-logout',
            function: 'POST',
            error: error
        });
        
        // Mesmo com erro, fazer logout do cookie
        const response = NextResponse.json({message: "Logout Bem Sucedido"})
        response.cookies.set('barberToken', "", {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: "strict",
            maxAge: 0,
            path: '/'
        })

        return response
    }
}