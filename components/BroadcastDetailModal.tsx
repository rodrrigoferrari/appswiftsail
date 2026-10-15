'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Search,
  Download,
  CheckCircle2,
  XCircle,
  Clock,
  Radio,
  MessageSquare,
  Users,
  Send,
  Phone,
  Filter,
  Sparkles,
  PhoneCall,
  Calendar,
  Layers,
  Check
} from 'lucide-react';

export interface BroadcastContactItem {
  id?: string;
  name: string;
  phone: string;
  status: 'enviado' | 'falhou' | 'pendente';
  sentAt?: string;
  errorReason?: string;
  copyUsed?: string;
}

export interface BroadcastCampaignItem {
  id: string;
  nome: string;
  data: string;
  timestamp: number;
  origem: 'scraped' | 'spreadsheet' | 'manual';
  origemDesc: string;
  instanciaNome: string;
  instanciaToken?: string;
  copies: string[];
  totalContatos: number;
  enviadosCount: number;
  falhasCount: number;
  status: 'concluido' | 'processando' | 'com_falhas';
  contacts: BroadcastContactItem[];
}

interface BroadcastDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  campaign: BroadcastCampaignItem | null;
  onCallContact?: (phone: string, name: string) => void;
}

export default function BroadcastDetailModal({
  isOpen,
  onClose,
  campaign,
  onCallContact,
}: BroadcastDetailModalProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'enviado' | 'falhou' | 'pendente'>('ALL');
  const [copiedPhone, setCopiedPhone] = useState<string | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Reseta filtros ao trocar de campanha
  useEffect(() => {
    if (isOpen) {
      setSearchTerm('');
      setStatusFilter('ALL');
    }
  }, [isOpen, campaign?.id]);

  const filteredContacts = useMemo(() => {
    if (!campaign) return [];
    const term = searchTerm.toLowerCase().trim();

    return campaign.contacts.filter((c) => {
      const matchesSearch =
        !term ||
        c.name.toLowerCase().includes(term) ||
        c.phone.replace(/\D/g, '').includes(term.replace(/\D/g, '')) ||
        (c.errorReason && c.errorReason.toLowerCase().includes(term));

      const matchesStatus = statusFilter === 'ALL' || c.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [campaign, searchTerm, statusFilter]);

  if (!isOpen || !campaign) return null;

  const successRate = campaign.totalContatos > 0
    ? ((campaign.enviadosCount / campaign.totalContatos) * 100).toFixed(1)
    : '0.0';

  const handleExportCsv = () => {
    if (!campaign.contacts || campaign.contacts.length === 0) return;

    const headers = ['Nome', 'Telefone', 'Status', 'Data/Hora Envio', 'Motivo da Falha'];
    const rows = campaign.contacts.map((c) => [
      `"${c.name.replace(/"/g, '""')}"`,
      `"${c.phone}"`,
      `"${c.status === 'enviado' ? 'Enviado' : c.status === 'falhou' ? 'Falhou' : 'Pendente'}"`,
      `"${c.sentAt || campaign.data}"`,
      `"${(c.errorReason || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `transmissao_${campaign.nome.replace(/\s+/g, '_')}_${campaign.data.replace(/[/ :]/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedPhone(text);
    setTimeout(() => setCopiedPhone(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-xs font-sans animate-in fade-in duration-200">
      <div className="bg-white border border-[#E2E8F0] rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Topo do Modal */}
        <div className="px-6 py-5 border-b border-[#E2E8F0] flex items-center justify-between bg-gradient-to-r from-white via-[#F8FAFC] to-[#EFF4FF]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#EFF4FF] border border-[#BFDBFE] flex items-center justify-center text-[#0050FF] shadow-xs">
              <Send className="w-5 h-5 text-[#0050FF]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#EFF4FF] text-[#0050FF] border border-[#BFDBFE] uppercase tracking-wider">
                  Detalhes da Transmissão
                </span>
                <span className="text-[11px] text-[#64748B] flex items-center gap-1 font-medium">
                  <Calendar className="w-3 h-3" />
                  {campaign.data}
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-bold text-[#0F172A] tracking-tight mt-0.5">
                {campaign.nome}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportCsv}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#CBD5E1] bg-white hover:bg-[#F8FAFC] text-xs font-bold text-[#334155] shadow-xs cursor-pointer transition-colors"
              title="Baixar lista completa em planilha CSV"
            >
              <Download className="w-3.5 h-3.5 text-[#64748B]" />
              <span>Exportar CSV</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9] transition-colors cursor-pointer"
              title="Fechar (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Corpo com Scroll */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Métricas Principais da Campanha */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
              <p className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider">Total de Destinatários</p>
              <p className="text-xl font-bold text-[#0F172A] mt-1">{campaign.totalContatos}</p>
              <p className="text-[11px] text-[#64748B] mt-0.5">{campaign.origemDesc}</p>
            </div>

            <div className="p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-200">
              <p className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">Enviadas com Sucesso</p>
              <p className="text-xl font-bold text-emerald-700 mt-1">{campaign.enviadosCount}</p>
              <p className="text-[11px] text-emerald-700 font-semibold mt-0.5">
                {successRate}% de entrega
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-rose-50/60 border border-rose-200">
              <p className="text-[10px] font-bold text-rose-800 uppercase tracking-wider">Falhas / Não Entregues</p>
              <p className="text-xl font-bold text-rose-700 mt-1">{campaign.falhasCount}</p>
              <p className="text-[11px] text-rose-700 font-medium mt-0.5">
                {campaign.falhasCount === 0 ? 'Zero falhas' : 'Falha na entrega'}
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-[#EFF4FF]/70 border border-[#BFDBFE]">
              <p className="text-[10px] font-bold text-[#0050FF] uppercase tracking-wider">Linha WhatsApp</p>
              <p className="text-sm font-bold text-[#0F172A] mt-1 truncate" title={campaign.instanciaNome}>
                {campaign.instanciaNome || 'WhatsApp Padrão'}
              </p>
              <p className="text-[11px] text-emerald-700 font-bold mt-0.5 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Disparo Finalizado
              </p>
            </div>
          </div>

          {/* Pré-visualização da Mensagem / Copies Rotacionadas */}
          {campaign.copies && campaign.copies.length > 0 && (
            <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#334155] flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-[#0050FF]" />
                  Mensagem Disparada ({campaign.copies.length} {campaign.copies.length > 1 ? 'variações rotacionadas' : 'variação'})
                </span>
                <span className="text-[10px] text-[#64748B]">Tag dinâmica: &#123;primeiro_nome&#125;</span>
              </div>

              <div className="space-y-2 max-h-32 overflow-y-auto">
                {campaign.copies.map((copy, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-lg bg-white border border-[#CBD5E1] text-xs text-[#0F172A] leading-relaxed font-sans shadow-2xs"
                  >
                    <span className="text-[10px] font-bold text-[#0050FF] mr-2">Variação #{idx + 1}:</span>
                    {copy}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Controles de Filtro e Busca da Lista de Contatos */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#0F172A]">Contatos da Lista:</span>
              <div className="flex items-center gap-1 bg-[#F1F5F9] p-1 rounded-xl text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setStatusFilter('ALL')}
                  className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                    statusFilter === 'ALL'
                      ? 'bg-white text-[#0050FF] shadow-xs font-bold'
                      : 'text-[#64748B] hover:text-[#0F172A]'
                  }`}
                >
                  Todos ({campaign.contacts.length})
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('enviado')}
                  className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer flex items-center gap-1 ${
                    statusFilter === 'enviado'
                      ? 'bg-white text-emerald-700 shadow-xs font-bold'
                      : 'text-[#64748B] hover:text-[#0F172A]'
                  }`}
                >
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  <span>Enviados ({campaign.enviadosCount})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('falhou')}
                  className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer flex items-center gap-1 ${
                    statusFilter === 'falhou'
                      ? 'bg-white text-rose-700 shadow-xs font-bold'
                      : 'text-[#64748B] hover:text-[#0F172A]'
                  }`}
                >
                  <XCircle className="w-3 h-3 text-rose-600" />
                  <span>Falhas ({campaign.falhasCount})</span>
                </button>
              </div>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar por nome ou número..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl text-xs text-[#0F172A] placeholder-[#94A3B8] focus:bg-white focus:outline-none focus:border-[#0050FF] transition-all shadow-2xs"
              />
            </div>
          </div>

          {/* Tabela de Contatos Detalhada */}
          <div className="border border-[#E2E8F0] rounded-xl overflow-hidden shadow-2xs">
            <div className="overflow-x-auto max-h-72">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[#64748B] text-[11px] font-bold uppercase tracking-wider sticky top-0 z-10">
                    <th className="py-2.5 px-4">#</th>
                    <th className="py-2.5 px-4">Nome do Contato</th>
                    <th className="py-2.5 px-4">WhatsApp / Telefone</th>
                    <th className="py-2.5 px-4">Status de Envio</th>
                    <th className="py-2.5 px-4">Horário / Detalhe</th>
                    <th className="py-2.5 px-4 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F1F5F9] bg-white">
                  {filteredContacts.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-xs text-[#64748B]">
                        Nenhum contato encontrado com os filtros aplicados.
                      </td>
                    </tr>
                  ) : (
                    filteredContacts.map((contact, idx) => {
                      const isSent = contact.status === 'enviado';
                      const isFailed = contact.status === 'falhou';

                      return (
                        <tr key={contact.id || idx} className="hover:bg-[#F8FAFC] transition-colors">
                          <td className="py-2.5 px-4 text-[#94A3B8] font-mono text-[11px]">
                            {idx + 1}
                          </td>

                          <td className="py-2.5 px-4 font-semibold text-[#0F172A]">
                            {contact.name || 'Contato'}
                          </td>

                          <td className="py-2.5 px-4 font-mono text-[11px] text-[#334155]">
                            <button
                              type="button"
                              onClick={() => copyToClipboard(contact.phone)}
                              className="hover:text-[#0050FF] hover:underline cursor-pointer inline-flex items-center gap-1"
                              title="Clique para copiar"
                            >
                              <span>{contact.phone}</span>
                              {copiedPhone === contact.phone ? (
                                <Check className="w-3 h-3 text-emerald-600" />
                              ) : null}
                            </button>
                          </td>

                          <td className="py-2.5 px-4">
                            {isSent ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <CheckCircle2 className="w-3 h-3" />
                                <span>Enviado</span>
                              </span>
                            ) : isFailed ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                                <XCircle className="w-3 h-3" />
                                <span>Falhou</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                <Clock className="w-3 h-3" />
                                <span>Pendente</span>
                              </span>
                            )}
                          </td>

                          <td className="py-2.5 px-4 text-[11px] text-[#64748B]">
                            {contact.sentAt ? (
                              <span className="font-mono">{contact.sentAt}</span>
                            ) : contact.errorReason ? (
                              <span className="text-rose-600 font-medium truncate max-w-[180px] inline-block" title={contact.errorReason}>
                                {contact.errorReason}
                              </span>
                            ) : (
                              <span className="text-[#94A3B8]">Registrado</span>
                            )}
                          </td>

                          <td className="py-2.5 px-4 text-right">
                            {onCallContact ? (
                              <button
                                type="button"
                                onClick={() => onCallContact(contact.phone, contact.name)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#EFF4FF] hover:bg-[#E0EAFF] text-[#0050FF] font-bold text-[10px] border border-[#BFDBFE] transition-colors cursor-pointer shadow-2xs"
                                title="Fazer ligação pelo discador web"
                              >
                                <PhoneCall className="w-3 h-3" />
                                <span>Ligar</span>
                              </button>
                            ) : (
                              <span className="text-[10px] text-[#94A3B8]">-</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Rodapé */}
        <div className="px-6 py-4 border-t border-[#E2E8F0] bg-[#F8FAFC] flex items-center justify-between">
          <p className="text-xs text-[#64748B]">
            Exibindo <span className="font-bold text-[#0F172A]">{filteredContacts.length}</span> de{' '}
            <span className="font-bold text-[#0F172A]">{campaign.contacts.length}</span> contatos desta transmissão.
          </p>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white border border-[#CBD5E1] text-xs font-bold text-[#334155] hover:bg-[#F1F5F9] transition-colors cursor-pointer shadow-xs"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
