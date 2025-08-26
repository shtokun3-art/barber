"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { DollarSign, CreditCard, Banknote, Smartphone, Percent, Save, RefreshCw } from "lucide-react";
import { toast } from "sonner";

interface Settings {
  id: string;
  commissionRate: number;
  creditCardFee: number;
  creditCardFee2x: number;
  creditCardFee3x: number;
  debitCardFee: number;
  cashFee: number;
  pixFee: number;
}

export const FeesSettingPage = () => {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    commissionRate: 0,
    creditCardFee: 0,
    creditCardFee2x: 0,
    creditCardFee3x: 0,
    debitCardFee: 0,
    cashFee: 0,
    pixFee: 0
  });

  // Buscar configurações atuais
  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/settings', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      if (response.ok) {
        const data = await response.json();
        setSettings(data);
        setFormData({
          commissionRate: data.commissionRate * 100, // Converter para porcentagem
          creditCardFee: data.creditCardFee * 100,
          creditCardFee2x: (data.creditCardFee2x || data.creditCardFee) * 100,
          creditCardFee3x: (data.creditCardFee3x || data.creditCardFee) * 100,
          debitCardFee: data.debitCardFee * 100,
          cashFee: data.cashFee * 100,
          pixFee: data.pixFee * 100
        });
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('Erro na resposta:', response.status, errorData);
        toast.error(`Erro ao carregar configurações: ${errorData.error || 'Erro desconhecido'}`);
      }
    } catch (error) {
      console.error('Erro ao buscar configurações:', error);
      toast.error('Erro ao carregar configurações');
    } finally {
      setLoading(false);
    }
  };

  // Salvar configurações
  const handleSave = async () => {
    try {
      setSaving(true);
      const response = await fetch('/api/settings', {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          commissionRate: formData.commissionRate / 100, // Converter de volta para decimal
          creditCardFee: formData.creditCardFee / 100,
          creditCardFee2x: formData.creditCardFee2x / 100,
          creditCardFee3x: formData.creditCardFee3x / 100,
          debitCardFee: formData.debitCardFee / 100,
          cashFee: formData.cashFee / 100,
          pixFee: formData.pixFee / 100
        })
      });

      if (response.ok) {
        const updatedSettings = await response.json();
        setSettings(updatedSettings);
        toast.success('Configurações salvas com sucesso!');
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('Erro ao salvar:', response.status, errorData);
        toast.error(`Erro ao salvar configurações: ${errorData.error || 'Erro desconhecido'}`);
      }
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      toast.error('Erro ao salvar configurações');
    } finally {
      setSaving(false);
    }
  };

  // Resetar para valores padrão
  const handleReset = () => {
    setFormData({
      commissionRate: 15,
      creditCardFee: 3.5,
      creditCardFee2x: 4.0,
      creditCardFee3x: 4.5,
      debitCardFee: 2.5,
      cashFee: 0,
      pixFee: 0
    });
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    const numValue = parseFloat(value) || 0;
    if (numValue >= 0 && numValue <= 100) {
      setFormData(prev => ({
        ...prev,
        [field]: numValue
      }));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="w-full h-full p-6 overflow-y-auto">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="max-w-4xl mx-auto space-y-6"
      >
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">Configuração de Taxas</h2>
              <p className="text-zinc-400">Gerencie as taxas de pagamento e comissões da barbearia</p>
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={handleReset}
                variant="outline"
                className="border-zinc-600 text-zinc-300 hover:bg-zinc-700"
              >
                <RefreshCw size={16} className="mr-2" />
                Resetar
              </Button>
              <Button 
                onClick={handleSave}
                disabled={saving}
                className="bg-orange-500 hover:bg-orange-600 text-white"
              >
                {saving ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                ) : (
                  <Save size={16} className="mr-2" />
                )}
                Salvar
              </Button>
            </div>
          </div>
        </div>



        {/* Taxas de Pagamento */}
        <Card className="bg-zinc-800 border-zinc-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-blue-500" />
              Taxas de Métodos de Pagamento
            </CardTitle>
            <CardDescription className="text-zinc-400">
              Configure as taxas aplicadas para cada método de pagamento
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Dinheiro */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Banknote className="h-4 w-4 text-green-500" />
                  <Label htmlFor="cashFee" className="text-zinc-300 font-medium">
                    Dinheiro
                  </Label>
                </div>
                <Input
                  id="cashFee"
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={formData.cashFee}
                  onChange={(e) => handleInputChange('cashFee', e.target.value)}
                  className="bg-zinc-700 border-zinc-600 text-white"
                  placeholder="0.0"
                />
                <p className="text-xs text-zinc-500">
                  Taxa: {formData.cashFee.toFixed(2)}% - Geralmente sem taxa
                </p>
              </div>

              {/* PIX */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Smartphone className="h-4 w-4 text-purple-500" />
                  <Label htmlFor="pixFee" className="text-zinc-300 font-medium">
                    PIX
                  </Label>
                </div>
                <Input
                  id="pixFee"
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={formData.pixFee}
                  onChange={(e) => handleInputChange('pixFee', e.target.value)}
                  className="bg-zinc-700 border-zinc-600 text-white"
                  placeholder="0.0"
                />
                <p className="text-xs text-zinc-500">
                  Taxa: {formData.pixFee.toFixed(2)}% - Geralmente sem taxa
                </p>
              </div>

              {/* Cartão de Débito */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-blue-500" />
                  <Label htmlFor="debitCardFee" className="text-zinc-300 font-medium">
                    Cartão de Débito
                  </Label>
                </div>
                <Input
                  id="debitCardFee"
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={formData.debitCardFee}
                  onChange={(e) => handleInputChange('debitCardFee', e.target.value)}
                  className="bg-zinc-700 border-zinc-600 text-white"
                  placeholder="2.5"
                />
                <p className="text-xs text-zinc-500">
                  Taxa: {formData.debitCardFee.toFixed(2)}% - Exemplo: R$ 100 = R$ {(100 * formData.debitCardFee / 100).toFixed(2)} de taxa
                </p>
              </div>

              {/* Cartão de Crédito - À Vista */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-orange-500" />
                  <Label htmlFor="creditCardFee" className="text-zinc-300 font-medium">
                    Cartão de Crédito - À Vista
                  </Label>
                </div>
                <Input
                  id="creditCardFee"
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={formData.creditCardFee}
                  onChange={(e) => handleInputChange('creditCardFee', e.target.value)}
                  className="bg-zinc-700 border-zinc-600 text-white"
                  placeholder="3.5"
                />
                <p className="text-xs text-zinc-500">
                  Taxa: {formData.creditCardFee.toFixed(2)}% - Exemplo: R$ 100 = R$ {(100 * formData.creditCardFee / 100).toFixed(2)} de taxa
                </p>
              </div>
              
              {/* Cartão de Crédito - 2x */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-orange-600" />
                  <Label htmlFor="creditCardFee2x" className="text-zinc-300 font-medium">
                    Cartão de Crédito - 2x
                  </Label>
                </div>
                <Input
                  id="creditCardFee2x"
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={formData.creditCardFee2x}
                  onChange={(e) => handleInputChange('creditCardFee2x', e.target.value)}
                  className="bg-zinc-700 border-zinc-600 text-white"
                  placeholder="4.5"
                />
                <p className="text-xs text-zinc-500">
                  Taxa: {formData.creditCardFee2x.toFixed(2)}% - Exemplo: R$ 100 = R$ {(100 * formData.creditCardFee2x / 100).toFixed(2)} de taxa
                </p>
              </div>
              
              {/* Cartão de Crédito - 3x */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-orange-700" />
                  <Label htmlFor="creditCardFee3x" className="text-zinc-300 font-medium">
                    Cartão de Crédito - 3x
                  </Label>
                </div>
                <Input
                  id="creditCardFee3x"
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={formData.creditCardFee3x}
                  onChange={(e) => handleInputChange('creditCardFee3x', e.target.value)}
                  className="bg-zinc-700 border-zinc-600 text-white"
                  placeholder="5.5"
                />
                <p className="text-xs text-zinc-500">
                  Taxa: {formData.creditCardFee3x.toFixed(2)}% - Exemplo: R$ 100 = R$ {(100 * formData.creditCardFee3x / 100).toFixed(2)} de taxa
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Resumo */}
        <Card className="bg-gradient-to-r from-zinc-800 to-zinc-700 border-zinc-600">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-yellow-500" />
              Resumo das Configurações
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="bg-zinc-700/50 p-3 rounded-lg">
                <p className="text-zinc-400">Taxa Cartão Crédito À Vista</p>
                <p className="text-white font-bold text-lg">{formData.creditCardFee.toFixed(2)}%</p>
              </div>
              <div className="bg-zinc-700/50 p-3 rounded-lg">
                <p className="text-zinc-400">Taxa Cartão Crédito 2x</p>
                <p className="text-white font-bold text-lg">{formData.creditCardFee2x.toFixed(2)}%</p>
              </div>
              <div className="bg-zinc-700/50 p-3 rounded-lg">
                <p className="text-zinc-400">Taxa Cartão Crédito 3x</p>
                <p className="text-white font-bold text-lg">{formData.creditCardFee3x.toFixed(2)}%</p>
              </div>
              <div className="bg-zinc-700/50 p-3 rounded-lg">
                <p className="text-zinc-400">Métodos Sem Taxa</p>
                <p className="text-white font-bold text-lg">
                  {[formData.cashFee, formData.pixFee].filter(fee => fee === 0).length}/2
                </p>
              </div>
            </div>
            
            <Separator className="my-4 bg-zinc-600" />
            
            <div className="text-xs text-zinc-400 space-y-1">
              <p>💡 <strong>Dica:</strong> As taxas são aplicadas automaticamente no momento do pagamento</p>
              <p>📊 <strong>Relatórios:</strong> Você pode acompanhar o impacto das taxas no dashboard de métricas</p>
              <p>⚙️ <strong>Alterações:</strong> As mudanças entram em vigor imediatamente para novos atendimentos</p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};