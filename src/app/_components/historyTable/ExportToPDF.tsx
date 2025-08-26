"use client";

import { Button } from "@/components/ui/button";
import { FileText, Download } from "lucide-react";
import { HistoryEntry } from "@/lib/hooks/useHistory";
import jsPDF from 'jspdf';

interface ExportToPDFProps {
  filteredHistory: HistoryEntry[];
  searchTerm: string;
  selectedService: string;
  selectedProduct: string;
  selectedPaymentMethod: string;
  services: any[];
  items: any[];
  isHeaderButton?: boolean;
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
};

const generatePDF = (data: HistoryEntry[], filters: { searchTerm: string; selectedService: string; selectedProduct: string; selectedPaymentMethod: string; serviceName?: string; productName?: string; paymentMethodName?: string }) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  let yPosition = 20;
  
  // Cores
  const primaryColor: [number, number, number] = [255, 165, 0]; // Laranja
  const secondaryColor: [number, number, number] = [52, 73, 94]; // Azul escuro
  const lightGray: [number, number, number] = [245, 245, 245];
  const darkGray: [number, number, number] = [64, 64, 64];
  
  // Função para adicionar nova página se necessário
  const checkPageBreak = (requiredSpace: number) => {
    if (yPosition + requiredSpace > pageHeight - 20) {
      doc.addPage();
      yPosition = 20;
    }
  };
  
  // Cabeçalho principal
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, pageWidth, 40, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('RELATÓRIO DE HISTÓRICO', pageWidth / 2, 20, { align: 'center' });
  doc.setFontSize(16);
  doc.text('Sistema de Barbearia', pageWidth / 2, 30, { align: 'center' });
  
  yPosition = 60;
  
  // Informações gerais
  const totalValue = data.reduce((sum, entry) => sum + entry.totalValue, 0);
  const totalServices = data.reduce((sum, entry) => sum + entry.services.length, 0);
  const totalProducts = data.reduce((sum, entry) => sum + (entry.items ? entry.items.length : 0), 0);
  const currentDate = new Date().toLocaleString("pt-BR");
  
  doc.setTextColor(...darkGray);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  
  // Box de informações gerais
  doc.setFillColor(...lightGray);
  doc.rect(10, yPosition - 5, pageWidth - 20, 35, 'F');
  doc.setDrawColor(...primaryColor);
  doc.setLineWidth(2);
  doc.rect(10, yPosition - 5, pageWidth - 20, 35, 'S');
  
  doc.setFont('helvetica', 'bold');
  doc.text('RESUMO GERAL', 15, yPosition + 5);
  doc.setFont('helvetica', 'normal');
  doc.text(`Gerado em: ${currentDate}`, 15, yPosition + 15);
  doc.text(`Total de registros: ${data.length}`, 15, yPosition + 22);
  doc.text(`Valor total: ${formatCurrency(totalValue)}`, pageWidth / 2, yPosition + 15);
  doc.text(`Total de serviços: ${totalServices}`, pageWidth / 2, yPosition + 22);
  doc.text(`Total de produtos: ${totalProducts}`, 15, yPosition + 29);
  
  yPosition += 45;
  
  yPosition += 7;
  
  // Filtros aplicados
  if (filters.searchTerm || filters.selectedService !== "all" || filters.selectedProduct !== "all" || filters.selectedPaymentMethod !== "all") {
    checkPageBreak(30);
    doc.setFont('helvetica', 'bold');
    doc.text('FILTROS APLICADOS:', 15, yPosition);
    yPosition += 8;
    
    doc.setFont('helvetica', 'normal');
    if (filters.searchTerm) {
      doc.text(`• Cliente: ${filters.searchTerm}`, 20, yPosition);
      yPosition += 7;
    }
    if (filters.selectedService !== "all" && filters.serviceName) {
      doc.text(`• Serviço: ${filters.serviceName}`, 20, yPosition);
      yPosition += 7;
    }
    if (filters.selectedProduct !== "all" && filters.productName) {
      doc.text(`• Produto: ${filters.productName}`, 20, yPosition);
      yPosition += 7;
    }
    if (filters.selectedPaymentMethod !== "all" && filters.paymentMethodName) {
      doc.text(`• Método de Pagamento: ${filters.paymentMethodName}`, 20, yPosition);
      yPosition += 7;
    }
    yPosition += 10;
  }
  
  // Lista de atendimentos
  data.forEach((entry, index) => {
    checkPageBreak(60);
    
    // Cabeçalho do atendimento
    doc.setFillColor(...primaryColor);
    doc.rect(10, yPosition - 3, pageWidth - 20, 12, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text(`ATENDIMENTO #${index + 1}`, 15, yPosition + 5);
    doc.text(formatDate(entry.createdAt), pageWidth - 15, yPosition + 5, { align: 'right' });
    
    yPosition += 20;
    
    // Informações do atendimento
    doc.setTextColor(...darkGray);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    
    doc.setFont('helvetica', 'bold');
    doc.text('Cliente:', 15, yPosition);
    doc.setFont('helvetica', 'normal');
    doc.text(`${entry.user.name} (${entry.user.phone})`, 40, yPosition);
    
    doc.setFont('helvetica', 'bold');
    doc.text('Barbeiro:', pageWidth / 2, yPosition);
    doc.setFont('helvetica', 'normal');
    doc.text(entry.barber.name, pageWidth / 2 + 25, yPosition);
    
    yPosition += 10;
    
    // Método de Pagamento
    const getPaymentMethodName = (method: string) => {
      switch (method) {
        case 'cash': return 'Dinheiro';
        case 'pix': return 'PIX';
        case 'debit_card': return 'Cartão de Débito';
        case 'credit_card': return 'Cartão de Crédito';
        default: return method;
      }
    };
    
    doc.setFont('helvetica', 'bold');
    doc.text('Pagamento:', 15, yPosition);
    doc.setFont('helvetica', 'normal');
    let paymentText = getPaymentMethodName(entry.paymentMethod);
    if (entry.paymentMethod === 'credit_card' && entry.installments > 1) {
      paymentText += ` - ${entry.installments}x sem juros`;
    }
    doc.text(paymentText, 50, yPosition);
    
    // Taxa aplicada (se houver)
    if (entry.feeAmount > 0) {
      doc.setFont('helvetica', 'bold');
      doc.text('Taxa:', pageWidth / 2, yPosition);
      doc.setFont('helvetica', 'normal');
      doc.text(`${formatCurrency(entry.feeAmount)} (${(entry.feeRate * 100).toFixed(1)}%)`, pageWidth / 2 + 20, yPosition);
    }
    
    yPosition += 10;
    
    // Serviços
    doc.setFont('helvetica', 'bold');
    doc.text('Serviços realizados:', 15, yPosition);
    yPosition += 8;
    
    entry.services.forEach((service, serviceIndex) => {
      doc.setFont('helvetica', 'normal');
      doc.text(`${serviceIndex + 1}. ${service.service.name}`, 20, yPosition);
      doc.text(formatCurrency(service.service.price), pageWidth - 15, yPosition, { align: 'right' });
      yPosition += 6;
    });
    
    // Produtos utilizados
    if (entry.items && entry.items.length > 0) {
      yPosition += 3;
      doc.setFont('helvetica', 'bold');
      doc.text('Produtos utilizados:', 15, yPosition);
      yPosition += 8;
      
      entry.items.forEach((item, itemIndex) => {
        doc.setFont('helvetica', 'normal');
        doc.text(`${itemIndex + 1}. ${item.item.item} (Qtd: ${item.quantity})`, 20, yPosition);
        doc.text(formatCurrency(item.totalPrice), pageWidth - 15, yPosition, { align: 'right' });
        yPosition += 6;
      });
    }
    
    // Valor total do atendimento
    yPosition += 3;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('TOTAL:', pageWidth - 60, yPosition);
    doc.text(formatCurrency(entry.totalValue), pageWidth - 15, yPosition, { align: 'right' });
    
    // Linha separadora
    yPosition += 8;
    doc.setDrawColor(...lightGray);
    doc.setLineWidth(0.5);
    doc.line(15, yPosition, pageWidth - 15, yPosition);
    yPosition += 15;
  });
  
  // Rodapé
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setTextColor(...darkGray);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(`Página ${i} de ${pageCount}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
    doc.text('Sistema de Barbearia - Relatório Gerado Automaticamente', pageWidth / 2, pageHeight - 5, { align: 'center' });
  }
  
  return doc;
};

const downloadPDF = (doc: jsPDF, filename: string) => {
  try {
    doc.save(filename);
  } catch (error) {
    console.error('Erro ao gerar PDF:', error);
    alert('Erro ao gerar o PDF. Tente novamente.');
  }
};

export const ExportToPDF = ({ filteredHistory, searchTerm, selectedService, selectedProduct, selectedPaymentMethod, services, items, isHeaderButton = false }: ExportToPDFProps) => {
  const handleExport = () => {
    if (filteredHistory.length === 0) {
      alert('Não há dados para exportar.');
      return;
    }
    
    const serviceName = services.find(s => s.id === selectedService)?.name;
    const productName = items.find(i => i.id === selectedProduct)?.item;
    
    const getPaymentMethodName = (method: string) => {
      switch (method) {
        case 'cash': return 'Dinheiro';
        case 'pix': return 'PIX';
        case 'debit_card': return 'Cartão de Débito';
        case 'credit_card': return 'Cartão de Crédito';
        default: return undefined;
      }
    };
    
    const paymentMethodName = selectedPaymentMethod !== 'all' ? getPaymentMethodName(selectedPaymentMethod) : undefined;
    
    const filters = {
      searchTerm,
      selectedService,
      selectedProduct,
      selectedPaymentMethod,
      serviceName,
      productName,
      paymentMethodName
    };
    
    const doc = generatePDF(filteredHistory, filters);
    
    // Gerar nome do arquivo
    const currentDate = new Date().toISOString().split('T')[0];
    let filename = `historico-atendimentos-${currentDate}`;
    
    if (searchTerm) {
      filename += `-cliente-${searchTerm.replace(/\s+/g, '-').toLowerCase()}`;
    }
    
    if (selectedService !== "all" && serviceName) {
      filename += `-servico-${serviceName.replace(/\s+/g, '-').toLowerCase()}`;
    }
    
    if (selectedProduct !== "all" && productName) {
      filename += `-produto-${productName.replace(/\s+/g, '-').toLowerCase()}`;
    }
    
    if (selectedPaymentMethod !== "all" && paymentMethodName) {
      filename += `-pagamento-${paymentMethodName.replace(/\s+/g, '-').toLowerCase()}`;
    }
    
    filename += '.pdf';
    
    downloadPDF(doc, filename);
  };
  
  // Só mostrar o botão se há dados filtrados
  if (filteredHistory.length === 0) {
    return null;
  }
  
  if (isHeaderButton) {
    return (
      <Button
        onClick={handleExport}
        className="w-12 h-12 rounded-full bg-white hover:bg-gray-100 text-orange-500 hover:text-orange-600 border-none shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center"
        title="Gerar PDF"
      >
        <Download className="h-5 w-5" />
      </Button>
    );
  }
  
  return (
    <div className="flex justify-center mt-6">
      <Button
        onClick={handleExport}
        className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white border-none shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-2"
      >
        <FileText className="h-4 w-4" />
        <Download className="h-4 w-4" />
        Exportar Relatório
      </Button>
    </div>
  );
};