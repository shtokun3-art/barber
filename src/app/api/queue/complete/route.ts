import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/utils";
import { cookies } from "next/headers";
import { notifyQueueUpdate } from "@/lib/queue-notifier";

interface ProductData {
  id: string;
  name: string;
  price: number;
  quantity: number;
  totalPrice: number;
}

interface ExtraServiceData {
  id: string;
  name: string;
  price: number;
  quantity: number;
  totalPrice: number;
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const token = (await cookieStore).get("barberToken");

    if (!token) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { queueId, services = [], products = [], paymentMethod, installments = 1, extraServices = [] } = await request.json();

    if (!queueId) {
      return NextResponse.json({ error: "ID da fila é obrigatório" }, { status: 400 });
    }

    if (!paymentMethod) {
      return NextResponse.json({ error: "Método de pagamento é obrigatório" }, { status: 400 });
    }

    // Buscar a entrada da fila
    const queueEntry = await prisma.queue.findUnique({
      where: { id: queueId },
      include: {
        queueServices: {
          include: {
            service: true
          }
        }
      }
    });

    if (!queueEntry) {
      return NextResponse.json({ error: "Entrada da fila não encontrada" }, { status: 404 });
    }

    if (queueEntry.status !== "waiting") {
      return NextResponse.json({ error: "Esta entrada não está na fila" }, { status: 400 });
    }

    // Calcular valor total dos serviços (usando os serviços enviados pelo frontend)
    const servicesValue = services.reduce((total: number, service: any) => {
      return total + (service.price || 0);
    }, 0);

    // Calcular valor total dos produtos
    const productsValue = products.reduce((total: number, product: ProductData) => {
      return total + (product.totalPrice || 0);
    }, 0);

    // Calcular valor total dos serviços extras
    const extraServicesValue = extraServices.reduce((total: number, service: ExtraServiceData) => {
      return total + (service.totalPrice || 0);
    }, 0);

    const totalValue = servicesValue + productsValue + extraServicesValue;

    // Buscar configurações de taxas do banco de dados
    let settings = await prisma.settings.findFirst();
    
    if (!settings) {
      // Criar configuração padrão se não existir
      settings = await prisma.settings.create({
        data: {
          commissionRate: 0.15,
          creditCardFee: 0.035,
          creditCardFee2x: 0.045,
          creditCardFee3x: 0.055,
          debitCardFee: 0.025,
          cashFee: 0.0,
          pixFee: 0.0
        }
      });
    }

    // Calcular taxa baseada no método de pagamento e parcelamento
    const getFeeRate = (method: string, installments: number): number => {
      switch (method) {
        case 'credit_card':
          if (installments === 1) {
            return settings!.creditCardFee;
          } else if (installments === 2) {
            return settings!.creditCardFee2x || settings!.creditCardFee;
          } else if (installments === 3) {
            return settings!.creditCardFee3x || settings!.creditCardFee;
          }
          return settings!.creditCardFee;
        case 'debit_card':
          return settings!.debitCardFee;
        case 'cash':
          return settings!.cashFee;
        case 'pix':
          return settings!.pixFee;
        default:
          return 0;
      }
    };

    const feeRate = getFeeRate(paymentMethod, installments);
    const feeAmount = totalValue * feeRate;
    const netAmount = totalValue - feeAmount;

    // Iniciar transação
    const result = await prisma.$transaction(async (tx) => {
      // Atualizar status da fila para completed
      await tx.queue.update({
        where: { id: queueId },
        data: { status: "completed" }
      });

      // Criar entrada no histórico
      const history = await tx.history.create({
        data: {
          userId: queueEntry.userId,
          barberId: queueEntry.barberId,
          totalValue: totalValue,
          paymentMethod: paymentMethod,
          installments: installments,
          feeRate: feeRate,
          feeAmount: feeAmount,
          netAmount: netAmount
        }
      });

      // Criar entradas dos serviços no histórico (usando os serviços enviados pelo frontend)
      for (const service of services) {
        await tx.historyService.create({
          data: {
            historyId: history.id,
            serviceId: service.serviceId
          }
        });
      }

      // Criar entradas dos serviços extras no histórico (considerando quantidade)
      for (const extraService of extraServices) {
        // Criar uma entrada para cada quantidade do serviço
        for (let i = 0; i < extraService.quantity; i++) {
          await tx.historyService.create({
            data: {
              historyId: history.id,
              serviceId: extraService.id,
              isExtra: true
            }
          });
        }
      }

      // Criar entradas dos produtos no histórico
      for (const product of products) {
        await tx.historyItem.create({
          data: {
            historyId: history.id,
            itemId: product.id,
            quantity: product.quantity,
            unitPrice: product.price,
            totalPrice: product.totalPrice
          }
        });

        // Atualizar estoque do produto
        await tx.items.update({
          where: { id: product.id },
          data: {
            qtd: {
              decrement: product.quantity
            }
          }
        });
      }

      return history;
    });

    // Notificar todas as conexões SSE sobre a atualização da fila
    notifyQueueUpdate();

    return NextResponse.json({ 
      message: "Serviço concluído com sucesso", 
      historyId: result.id,
      userId: queueEntry.userId // Incluir userId para notificação
    }, { status: 200 });

  } catch (error) {
    console.error("Erro ao concluir serviço:", error);
    return NextResponse.json(
      { error: "Erro interno no servidor" },
      { status: 500 }
    );
  }
}