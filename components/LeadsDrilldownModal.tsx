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

  // Base padrão realista de leads capturados no formulário nativo Meta / WPP
  const defaultFormLeads: FormLeadItem[] = [
    {
      id: 'f-1',
      nome: 'Juliana Peixoto de Almeida',
      telefone: '+55 11 98111-2233',
      email: 'juliana.peixoto@gmail.com',
      data: 'Hoje às 10:18',
      anuncio: '[Lead Ad 01] Implante Carga Imediata',
      perguntas: 'Interesse: Alinhador Invisível • Turno preferido: Tarde • Já usou aparelho: Não',
      statusCrm: 'Agendamento Confirmado',
      statusColor: 'emerald',
    },
    {
      id: 'f-2',
      nome: 'Renato Albuquerque Silva',
      telefone: '+55 11 99222-3344',
      email: 'renato.albuquerque@yahoo.com.br',
      data: 'Hoje às 08:50',
      anuncio: '[Lead Ad 02] Formulário Condição Especial',
      perguntas: 'Interesse: Implante Dentário • Dentes a repor: 2 a 3 • Horário: Manhã',
      statusCrm: 'Venda Fechada (R$ 14.500)',
      statusColor: 'emerald',
    },
    {
      id: 'f-3',
      nome: 'Patrícia Lemes dos Santos',
      telefone: '+55 11 97333-4455',
      email: 'patricia.lemes@outlook.com',
      data: 'Ontem às 19:40',
      anuncio: '[Lead Ad 01] Implante Carga Imediata',
      perguntas: 'Interesse: Clareamento a Laser • Turno preferido: Noite',
      statusCrm: 'Em Qualificação SDR',
      statusColor: 'cyan',
    },
    {
      id: 'f-4',
      nome: 'Márcio Guimarães Carvalho',
      telefone: '+55 11 98444-5566',
      email: 'marcio.guimaraes@empresa.com.br',
      data: 'Ontem às 15:25',
      anuncio: '[Lead Ad 02] Formulário Condição Especial',
      perguntas: 'Interesse: Scanner 3D + Alinhador • Horário preferido: Sábado',
      statusCrm: 'Agendamento Confirmado',
      statusColor: 'emerald',
    },
    {
      id: 'f-5',
      nome: 'Sandra Regina Moraes',
      telefone: '+55 11 99555-6677',
      email: 'sandra.moraes@gmail.com',
      data: 'Ontem às 11:10',
      anuncio: '[Lead Ad 01] Implante Carga Imediata',
      perguntas: 'Interesse: Reabilitação Oral • Horário preferido: Manhã',
      statusCrm: 'Venda Fechada (R$ 11.800)',
      statusColor: 'emerald',
    },
    {
      id: 'f-6',
      nome: 'Carlos Eduardo Silveira',
      telefone: '+55 11 99123-8877',
      email: 'carlos.silveira@uol.com.br',
      data: '28/09 às 16:42',
      anuncio: '[Lead Ad 03] Carrossel 5 Benefícios',
      perguntas: 'Interesse: Alinhador Invisível • Forma de Pagamento: Parcelado Cartão',
      statusCrm: 'Em Atendimento',
      statusColor: 'amber',
    },
    {
      id: 'f-7',
      nome: 'Beatriz Nogueira Ramos',
      telefone: '+55 11 97234-1100',
      email: 'beatriz.ramos@advocacia.com',
      data: '28/09 às 14:15',
      anuncio: '[Lead Ad 03] Carrossel 5 Benefícios',
      perguntas: 'Interesse: Clareamento Dental • Horário preferido: Almoço',
      statusCrm: 'Agendamento Confirmado',
      statusColor: 'emerald',
    },
    {
      id: 'f-8',
      nome: 'Rodrigo Mendonça Prado',
      telefone: '+55 11 98456-2299',
      email: 'rodrigo.mendonca@gmail.com',
      data: '27/09 às 18:05',
      anuncio: '[Lead Ad 02] Formulário Condição Especial',
      perguntas: 'Interesse: Implante Unitário • Preferência: Jardins SP',
      statusCrm: 'Novo Lead',
      statusColor: 'blue',
    },
  ];

  const leadsList = initialLeads || defaultFormLeads;

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
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-fadeIn overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-5xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden my-auto max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header do Modal */}
        <div className="p-5 bg-slate-950/90 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <ClipboardList className="w-5 h-5" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">
                  Lista de Leads & Respostas do Formulário
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  {filteredLeads.length} contatos
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Origem: <b className="text-slate-200">{title}</b> • Dados sincronizados via Meta Instant Forms & Webhooks
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center">
            <button
              onClick={handleExportCSV}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" />
              <span>Exportar CSV</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Fechar (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Barra de Filtro e Busca Rápida */}
        <div className="p-4 bg-slate-900/60 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Buscar por nome do lead, e-mail, telefone ou resposta..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Status CRM:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500 font-medium"
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
        <div className="flex-1 overflow-auto p-4">
          {filteredLeads.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-xs">
              Nenhum lead encontrado com o filtro aplicado.
            </div>
          ) : (
            <div className="border border-slate-800 rounded-xl overflow-hidden shadow-inner bg-slate-950/40">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 bg-slate-950/80">
                    <th className="py-3 px-4">Nome do Lead / Paciente</th>
                    <th className="py-3 px-4">E-mail</th>
                    <th className="py-3 px-4">Data de Envio</th>
                    <th className="py-3 px-4">Respostas do Formulário Meta</th>
                    <th className="py-3 px-4">Status no Kommo CRM</th>
                    <th className="py-3 px-4 text-right">Ação Direta</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredLeads.map((lead, idx) => {
                    const cleanPhone = lead.telefone.replace(/\D/g, '');
                    return (
                      <tr key={lead.id || idx} className="hover:bg-slate-900/40 transition-colors">
                        {/* Nome & Telefone */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-full bg-cyan-500/20 text-cyan-300 font-bold flex items-center justify-center text-xs shrink-0 border border-cyan-500/30">
                              {lead.nome.charAt(0)}
                            </div>
                            <div>
                              <strong className="text-white font-bold block">{lead.nome}</strong>
                              <span className="text-[11px] text-slate-400 font-mono flex items-center gap-1 mt-0.5">
                                <Phone className="w-3 h-3 text-emerald-400" />
                                {lead.telefone}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Email */}
                        <td className="py-3 px-4 font-mono text-slate-300 max-w-[180px] truncate" title={lead.email}>
                          {lead.email}
                        </td>

                        {/* Data */}
                        <td className="py-3 px-4 font-mono text-slate-400 whitespace-nowrap">
                          {lead.data}
                        </td>

                        {/* Respostas do Formulário */}
                        <td className="py-3 px-4 text-slate-200 max-w-xs">
                          <div className="p-2 rounded bg-slate-900/80 border border-slate-800 text-[11px] leading-relaxed">
                            {lead.perguntas}
                          </div>
                        </td>

                        {/* Status no CRM */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                              lead.statusColor === 'emerald' || lead.statusCrm.includes('Confirmado') || lead.statusCrm.includes('Venda')
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                : lead.statusColor === 'cyan' || lead.statusCrm.includes('Qualificação')
                                ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20'
                                : lead.statusColor === 'amber'
                                ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
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
                              className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] flex items-center gap-1 shadow transition-all"
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
        <div className="p-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-500">
          <span>Sincronização em tempo real via Meta Graph API & Webhook Kommo</span>
          <button
            onClick={onClose}
            className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold transition-colors"
          >
            Fechar Janela
          </button>
        </div>
      </div>
    </div>
  );
}
