'use client';

import React, { useState } from 'react';
import { useTenant } from '@/components/TenantProvider';
import {
  CreditCard,
  QrCode,
  Download,
  CheckCircle2,
  Clock,
  DollarSign,
  Receipt,
  FileText,
  X,
  Sparkles,
} from 'lucide-react';

export default function FinanceiroPage() {
  const { activeClient } = useTenant();
  const [selectedInvoice, setSelectedInvoice] = useState<{
    id: string;
    description: string;
    value: string;
    dueDate: string;
    pixCode: string;
  } | null>(null);

  const invoices = [
    {
      id: 'fat_99201',
      description: 'Gestão de Tráfego & Inteligência de Mídia - Outubro/2026',
      value: 'R$ 7.500,00',
      dueDate: '10/10/2026',
      status: 'Pendente',
      pixCode: '00020126580014br.gov.bcb.pix0136swiftsail-asaas-pix-code-demo5204000053039865802BR5925SWIFTSAIL6009CURITIBA62070503***6304E8A2',
    },
    {
      id: 'fat_99182',
      description: 'Gestão de Tráfego & Inteligência de Mídia - Setembro/2026',
      value: 'R$ 7.500,00',
      dueDate: '10/09/2026',
      status: 'Pago',
      pixCode: '',
    },
    {
      id: 'fat_99144',
      description: 'Setup e Automação de Instâncias Uazapi Socket & CoEx',
      value: 'R$ 3.200,00',
      dueDate: '20/08/2026',
      status: 'Pago',
      pixCode: '',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-emerald-400" />
            Financeiro, Faturas & Asaas
          </h2>
          <p className="text-xs text-slate-400">
            Assinaturas ativas, emissão de boletos, PIX instantâneo e download de NFS-e
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Asaas Gateway Ativo
          </span>
        </div>
      </div>

      {/* Subscription Hero Card */}
      <div className="glass-card p-6 border-emerald-500/30 relative overflow-hidden bg-gradient-to-r from-slate-900/90 via-slate-900/60 to-emerald-950/20">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase tracking-wider">
              Plano Enterprise Retainer
            </span>
            <h3 className="text-2xl font-extrabold text-white">
              R$ 7.500,00 <span className="text-xs font-normal text-slate-400">/ mês</span>
            </h3>
            <p className="text-xs text-slate-400 max-w-xl">
              Inclui gestão ilimitada de canais (Meta + Google), infraestrutura de WhatsApp Uazapi sem limite de disparos, e CRM integrado.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <div className="bg-slate-950/80 border border-slate-800 px-4 py-3 rounded-xl text-right">
              <p className="text-[10px] text-slate-400 uppercase font-semibold">Próximo Vencimento</p>
              <p className="text-sm font-bold text-emerald-400 font-mono">10 de Outubro de 2026</p>
            </div>
          </div>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="glass-card p-6 space-y-4">
        <div className="border-b border-slate-800 pb-3">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Receipt className="w-4 h-4 text-cyan-400" />
            Histórico de Cobranças & Faturas
          </h3>
          <p className="text-xs text-slate-400">Comprovantes fiscais e links de pagamento</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="text-slate-400 border-b border-slate-800">
                <th className="pb-3 font-semibold">Identificador</th>
                <th className="pb-3 font-semibold">Descrição do Serviço</th>
                <th className="pb-3 font-semibold">Vencimento</th>
                <th className="pb-3 font-semibold">Valor</th>
                <th className="pb-3 font-semibold">Status</th>
                <th className="pb-3 font-semibold text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono text-slate-200">
              {invoices.map((inv) => (
                <tr key={inv.id}>
                  <td className="py-3 text-cyan-400">{inv.id}</td>
                  <td className="py-3 font-sans font-medium text-white">{inv.description}</td>
                  <td className="py-3 text-slate-400">{inv.dueDate}</td>
                  <td className="py-3 font-bold text-white">{inv.value}</td>
                  <td className="py-3">
                    <span
                      className={`px-2.5 py-0.5 rounded text-[10px] font-bold ${
                        inv.status === 'Pago'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      }`}
                    >
                      {inv.status}
                    </span>
                  </td>
                  <td className="py-3 text-right">
                    <div className="flex items-center justify-end gap-2 font-sans">
                      {inv.status === 'Pendente' ? (
                        <button
                          onClick={() => setSelectedInvoice(inv)}
                          className="px-3 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-[11px] transition-colors flex items-center gap-1.5"
                        >
                          <QrCode className="w-3.5 h-3.5" />
                          Pagar com PIX
                        </button>
                      ) : (
                        <button className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-[11px] transition-colors flex items-center gap-1.5">
                          <Download className="w-3.5 h-3.5" />
                          NFS-e (PDF)
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* PIX Modal */}
      {selectedInvoice && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#0f172a] border border-slate-700/80 rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-4 relative">
            <button
              onClick={() => setSelectedInvoice(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <QrCode className="w-4 h-4 text-emerald-400" />
                Pagamento Instantâneo via PIX (Asaas)
              </h3>
              <p className="text-xs text-slate-400">Escaneie o QR Code abaixo pelo app do seu banco</p>
            </div>

            <div className="flex flex-col items-center py-4 space-y-3">
              <div className="w-48 h-48 bg-white p-3 rounded-2xl flex items-center justify-center shadow-lg">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
                    selectedInvoice.pixCode
                  )}`}
                  alt="QR Code PIX"
                  className="w-full h-full"
                />
              </div>
              <p className="text-lg font-black text-white font-mono">{selectedInvoice.value}</p>
            </div>

            <div className="space-y-2">
              <label className="block text-[11px] font-bold text-slate-400 uppercase">Código Copia e Cola</label>
              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-[10px] font-mono text-cyan-300 break-all select-all">
                {selectedInvoice.pixCode}
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={() => setSelectedInvoice(null)}
                className="w-full py-2.5 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-600 text-white transition-colors"
              >
                Concluir Pagamento
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
