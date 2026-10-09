'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Search,
  Download,
  Filter,
  ExternalLink,
  MessageCircle,
  User,
  Mail,
  Phone,
  Calendar,
  CheckCircle2,
  Clock,
  FileText,
  Sparkles,
  ClipboardList
} from 'lucide-react';

export interface FormLeadItem {
  id?: string;
  nome: string;
  telefone: string;
  email: string;
  data: string;
  anuncio: string;
  perguntas: string;
  statusCrm: string;
  statusColor?: string;
}

interface LeadsDrilldownModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  type?: 'form' | 'whatsapp';
  leadsCount?: number;
  initialLeads?: FormLeadItem[];
}

export default function LeadsDrilldownModal({
  isOpen,
  onClose,
  title,
  type = 'form',
  leadsCount = 28,
  initialLeads,
}: LeadsDrilldownModalProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Base padrão realista de leads capturados no formulário nativo Meta / WPP (sincronizada com Kommo CRM)
  const defaultFormLeads: FormLeadItem[] = [
    {
      id: 'f-1',
      nome: 'Rachel Lewin',
      telefone: '+55 41 98844-2233',
      email: 'rachel.lewin@gmail.com',
      data: 'Hoje às 10:18',
      anuncio: '[Lead Ad] Plantão Batel • Apartamentos Alto Padrão',
      perguntas: 'Interesse: Planta 3 Suítes • Finalidade: Moradia • Turno: Tarde',
      statusCrm: 'Aguardando Atendimento',
      statusColor: 'cyan',
    },
    {
      id: 'f-2',
      nome: 'Rodrigo Teles',
      telefone: '+55 41 99122-3344',
      email: 'rodrigo.teles@yahoo.com.br',
      data: 'Hoje às 08:50',
      anuncio: '[Lead Ad] Lançamento Residencial • Tabela de Lançamento',
      perguntas: 'Interesse: Cobertura Duplex • Garagem: 2 a 3 vagas • Horário: Manhã',
      statusCrm: 'Em Contato',
      statusColor: 'amber',
    },
    {
      id: 'f-3',
      nome: 'Thiago Caetano',
      telefone: '+55 41 98733-4455',
      email: 'thiago.caetano@outlook.com',
      data: 'Ontem às 19:40',
      anuncio: '[Carrossel] Apresentação Fachada & Áreas Comuns',
      perguntas: 'Interesse: Garden Privativo • Financiamento: Direto com Construtora',
      statusCrm: 'Visita Agendada',
      statusColor: 'emerald',
    },
    {
      id: 'f-4',
      nome: 'Aline França Burdzinski',
      telefone: '+55 41 99244-5566',
      email: 'aline.burdzinski@empresa.com.br',
      data: 'Ontem às 15:25',
      anuncio: '[Reels 9:16] Tour Virtual Apartamento Decorado',
      perguntas: 'Interesse: 3 Quartos • Previsão de Mudança: 6 a 12 meses',
      statusCrm: 'Agendamento Confirmado',
      statusColor: 'emerald',
    },
    {
      id: 'f-5',
      nome: 'Andressa Titz',
      telefone: '+55 41 99655-6677',
      email: 'andressa.titz@gmail.com',
      data: 'Ontem às 11:10',
      anuncio: '[Lead Ad] Tour Decorado & Condições Exclusivas',
      perguntas: 'Interesse: Investimento para Locação • Região: Batel / Mercês',
      statusCrm: 'Visita Realizada',
      statusColor: 'emerald',
    },
    {
      id: 'f-6',
      nome: 'Sérgio Coraiola',
      telefone: '+55 41 99123-8877',
      email: 'sergio.coraiola@uol.com.br',
      data: '28/09 às 16:42',
      anuncio: '[Estático 1:1] Perspectiva Fachada e Bairro',
      perguntas: 'Interesse: Cobertura ou Andar Alto • Entrada facilitada',
      statusCrm: 'Em Negociação',
      statusColor: 'purple',
    },
    {
      id: 'f-7',
      nome: 'Heda Guzzo',
      telefone: '+55 41 98234-1100',
      email: 'heda.guzzo@advocacia.com',
      data: '28/09 às 14:15',
      anuncio: '[Lead Ad] Formulário VIP Plantão de Vendas',
      perguntas: 'Interesse: 2 ou 3 Vagas de Garagem • Aceita permuta',
      statusCrm: 'Proposta Comercial Enviada',
      statusColor: 'emerald',
    },
    {
      id: 'f-8',
      nome: 'Carlos Eduardo Silveira',
      telefone: '+55 41 98456-2299',
      email: 'carlos.silveira@gmail.com',
      data: '27/09 às 18:05',
      anuncio: '[Lead Ad] Tabela Direta Construtora',
      perguntas: 'Interesse: Apartamento Tipo • Visita no final de semana',
      statusCrm: 'Novo Lead',
      statusColor: 'blue',
    },
  ];

  const leadsList = (initialLeads && initialLeads.length > 0) ? initialLeads : defaultFormLeads;

  const filteredLeads = leadsList.filter((lead) => {
    const matchesSearch =
      lead.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.telefone.includes(searchTerm) ||
      lead.perguntas.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === 'ALL' ||
      lead.statusCrm.toLowerCase().includes(statusFilter.toLowerCase());

    return matchesSearch && matchesStatus;
  });

  const handleExportCSV = () => {
    const headers = ['Nome', 'Telefone', 'Email', 'Data', 'Criativo', 'Respostas', 'Status CRM'];
    const rows = filteredLeads.map((l) => [
      `"${l.nome}"`,
      `"${l.telefone}"`,
      `"${l.email}"`,
      `"${l.data}"`,
      `"${l.anuncio}"`,
      `"${l.perguntas.replace(/"/g, '""')}"`,
      `"${l.statusCrm}"`,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `leads_formulario_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/40 backdrop-blur-xs animate-fadeIn overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-5xl bg-white border border-[#E2E8F0] rounded-2xl shadow-2xl overflow-hidden my-auto max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header do Modal (Asaas Light) */}
        <div className="p-5 bg-white border-b border-[#E2E8F0] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="p-2.5 rounded-xl bg-[#EFF4FF] text-[#0050FF] border border-[#BFDBFE]">
              <ClipboardList className="w-5 h-5" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-[#0F172A]">
                  Lista de Leads & Respostas do Formulário
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#EFF4FF] text-[#0050FF] border border-[#BFDBFE]">
                  {filteredLeads.length} contatos
                </span>
              </div>
              <p className="text-xs text-[#64748B]">
                Origem: <b className="text-[#0F172A]">{title}</b> • Dados sincronizados via Meta Instant Forms & Webhooks
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center">
            <button
              onClick={handleExportCSV}
              className="px-3 py-1.5 rounded-xl bg-white hover:bg-[#F8FAFC] text-[#0F172A] text-xs font-semibold flex items-center gap-1.5 border border-[#CBD5E1] transition-colors shadow-xs"
            >
              <Download className="w-3.5 h-3.5 text-[#0050FF]" />
              <span>Exportar CSV</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9] transition-colors"
              title="Fechar (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Barra de Filtro e Busca Rápida */}
        <div className="p-4 bg-[#F8FAFC] border-b border-[#E2E8F0] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-[#94A3B8] absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Buscar por nome do lead, e-mail, telefone ou resposta..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white border border-[#CBD5E1] rounded-xl pl-9 pr-3 py-1.5 text-xs text-[#0F172A] placeholder-[#94A3B8] focus:outline-none focus:border-[#0050FF]"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-[#64748B]">Status CRM:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-white border border-[#CBD5E1] rounded-xl px-2.5 py-1.5 text-xs text-[#0F172A] focus:outline-none focus:border-[#0050FF] font-semibold cursor-pointer shadow-xs"
            >
              <option value="ALL">Todos os Status</option>
              <option value="Agendamento">Agendados</option>
              <option value="Venda">Vendas Fechadas</option>
              <option value="Qualificação">Em Qualificação</option>
              <option value="Novo">Novos Leads</option>
            </select>
          </div>
        </div>

        {/* Tabela de Leads com Nome, Contato e Respostas */}
        <div className="flex-1 overflow-auto p-4 bg-white">
          {filteredLeads.length === 0 ? (
            <div className="p-12 text-center text-[#64748B] text-xs font-medium">
              Nenhum lead encontrado com o filtro aplicado.
            </div>
          ) : (
            <div className="border border-[#E2E8F0] rounded-xl overflow-hidden bg-white shadow-xs">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-[#E2E8F0] text-[#64748B] bg-[#F8FAFC] font-bold">
                    <th className="py-3 px-4">Nome do Lead / Paciente</th>
                    <th className="py-3 px-4">E-mail</th>
                    <th className="py-3 px-4">Data de Envio</th>
                    <th className="py-3 px-4">Respostas do Formulário Meta</th>
                    <th className="py-3 px-4">Status no Kommo CRM</th>
                    <th className="py-3 px-4 text-right">Ação Direta</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0]">
                  {filteredLeads.map((lead, idx) => {
                    const cleanPhone = lead.telefone.replace(/\D/g, '');
                    return (
                      <tr key={lead.id || idx} className="hover:bg-[#F8FAFC] transition-colors">
                        {/* Nome & Telefone */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-full bg-[#EFF4FF] text-[#0050FF] font-bold flex items-center justify-center text-xs shrink-0 border border-[#BFDBFE]">
                              {lead.nome.charAt(0)}
                            </div>
                            <div>
                              <strong className="text-[#0F172A] font-bold block">{lead.nome}</strong>
                              <span className="text-[11px] text-[#64748B] font-mono flex items-center gap-1 mt-0.5">
                                <Phone className="w-3 h-3 text-emerald-600" />
                                {lead.telefone}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Email */}
                        <td className="py-3 px-4 font-mono text-[#475569] max-w-[180px] truncate" title={lead.email}>
                          {lead.email}
                        </td>

                        {/* Data */}
                        <td className="py-3 px-4 font-mono text-[#64748B] whitespace-nowrap">
                          {lead.data}
                        </td>

                        {/* Respostas do Formulário */}
                        <td className="py-3 px-4 text-[#0F172A] max-w-xs">
                          <div className="p-2 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] text-[11px] leading-relaxed text-[#334155]">
                            {lead.perguntas}
                          </div>
                        </td>

                        {/* Status no CRM */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                              lead.statusColor === 'emerald' || lead.statusCrm.includes('Confirmado') || lead.statusCrm.includes('Venda')
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : lead.statusColor === 'cyan' || lead.statusCrm.includes('Qualificação')
                                ? 'bg-blue-50 text-blue-700 border-blue-200'
                                : lead.statusColor === 'amber'
                                ? 'bg-amber-50 text-amber-700 border-amber-200'
                                : 'bg-slate-100 text-slate-700 border-slate-200'
                            }`}
                          >
                            ● {lead.statusCrm}
                          </span>
                        </td>

                        {/* Ações */}
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            <a
                              href={`https://wa.me/${cleanPhone}?text=Ol%C3%A1%20${encodeURIComponent(
                                lead.nome.split(' ')[0]
                              )}%2C%20recebemos%20seu%20cadastro%20e%20gostaria%20de%20conversar!`}
                              target="_blank"
                              rel="noreferrer"
                              className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] flex items-center gap-1 shadow-xs transition-all"
                              title="Iniciar conversa no WhatsApp"
                            >
                              <MessageCircle className="w-3 h-3" />
                              <span>WhatsApp</span>
                            </a>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3.5 bg-[#F8FAFC] border-t border-[#E2E8F0] flex items-center justify-between text-xs text-[#64748B]">
          <span>Sincronização em tempo real via Meta Graph API & Webhook Kommo</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-white border border-[#CBD5E1] hover:bg-[#F1F5F9] text-[#0F172A] font-semibold transition-colors shadow-xs"
          >
            Fechar Janela
          </button>
        </div>
      </div>
    </div>
  );
}
