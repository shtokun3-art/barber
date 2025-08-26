// Manter conexões ativas
const connections = new Set<ReadableStreamDefaultController>();

// Função para adicionar conexão
export function addConnection(controller: ReadableStreamDefaultController) {
  connections.add(controller);
}

// Função para remover conexão
export function removeConnection(controller: ReadableStreamDefaultController) {
  connections.delete(controller);
}

// Função para notificar todas as conexões
export function notifyQueueUpdate() {
  connections.forEach(controller => {
    try {
      controller.enqueue(`data: ${JSON.stringify({ type: 'queue_update', timestamp: Date.now() })}\n\n`);
    } catch (error) {
      // Remove conexões mortas
      connections.delete(controller);
    }
  });
}