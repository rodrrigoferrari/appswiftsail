'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useTenant } from '@/components/TenantProvider';
import {
  CreditCard,
  DollarSign,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Search,
  FileText,
  Building,
  ShieldCheck,
  Receipt,
  Database,
  RefreshCw,
  Eye,
  Download,
  ExternalLink,
  X,
  FileCheck,
  AlertCircle,
} from 'lucide-react';

interface CobrancaItem {
  id: string;
  descricao: string;
  cliente: string;
  clienteId: string;
  vencimento: string;
  pagamento?: string;
  valorBruto: number;
  valorLiquido: number;
  formaPagamento: 'PIX' | 'BOLETO' | 'CARTAO';
  status: 'RECEBIDA' | 'CONFIRMADA' | 'AGUARDANDO' | 'VENCIDA';
  nfNumero?: string;
  nfStatus?: string;
  notaId?: string;
  hasPdf: boolean;
  pdfStoragePath?: string;
}

interface NfModalState {
  isOpen: boolean;
  loading: boolean;
  signedUrl?: string;
  nfNumero?: string;
  notaId?: string;
  status?: string;
  cliente?: string;
  valor?: number;
  dataEmissao?: string;
  filename?: string;
  mensagem?: string;
  error?: string;
}

export default function FinanceiroPage() {
  const { activeClient, selectedClientId, currentUser, isMasterAdmin, availableClients, clients } = useTenant();

  const effectiveClientId = !isMasterAdmin
    ? (currentUser?.cliente_id || (availableClients.length > 0 ? availableClients[0].cliente_id : 'ADRIATICA_INCORPORADORA'))
    : (activeClient?.cliente_id || selectedClientId || 'ALL');

  const currentClient = clients.find((c) => c.cliente_id === effectiveClientId) || activeClient;
  const clientDisplayName =
    currentClient?.nome === 'EMOVERE'
      ? 'Emovere'
      : currentClient?.nome || (effectiveClientId === 'ALL' ? 'Visão Geral HQ' : effectiveClientId);

  // Filtros de busca e status para consulta
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'TODOS' | 'RECEBIDA' | 'CONFIRMADA' | 'AGUARDANDO' | 'VENCIDA'>('TODOS');
  const [nfFilter, setNfFilter] = useState<'TODAS' | 'COM_NF' | 'SEM_NF'>('TODAS');

  // Estado dinâmico real do Supabase
  const [loading, setLoading] = useState(true);
  const [cobrancasData, setCobrancasData] = useState<CobrancaItem[]>([]);
  const [totaisApi, setTotaisApi] = useState<{
    recebido_liquido: number;
    aguardando: number;
    vencido: number;
    faturado_total: number;
  }>({
    recebido_liquido: 0,
    aguardando: 0,
    vencido: 0,
    faturado_total: 0,
  });

  // Estado do Modal de Preview e Download da Nota Fiscal
  const [nfModal, setNfModal] = useState<NfModalState>({
    isOpen: false,
    loading: false,
  });

  // Carrega cobranças reais do Supabase (Cleide) via API Route do servidor
  useEffect(() => {
    async function loadAsaasData() {
      setLoading(true);
      try {
        const targetId = effectiveClientId;
        const res = await fetch(`/api/clientes/${targetId}/asaas`);
        const json = await res.json();
        if (json.success) {
          const mapped: CobrancaItem[] = (json.cobrancas || []).map((c: any) => ({
            id: c.id,
            descricao: c.descricao || 'Serviços de Marketing & Tráfego Pago',
            cliente: c.cliente,
            clienteId: c.cliente_id,
            vencimento: c.vencimento ? new Date(c.vencimento + 'T12:00:00').toLocaleDateString('pt-BR') : '—',
            pagamento: c.data_pagamento ? new Date(c.data_pagamento + 'T12:00:00').toLocaleDateString('pt-BR') : undefined,
            valorBruto: Number(c.valor) || 0,
            valorLiquido: Number(c.valor_liquido) || Number(c.valor) || 0,
            formaPagamento: (c.forma_pagamento || 'BOLETO').toUpperCase() as any,
            status: c.status,
            nfNumero: c.nf_numero || undefined,
            nfStatus: c.nf_status || undefined,
            notaId: c.nota_id || undefined,
            hasPdf: Boolean(c.has_pdf),
            pdfStoragePath: c.pdf_storage_path || undefined,
          }));
          setCobrancasData(mapped);
          if (json.totais) {
            setTotaisApi(json.totais);
          }
        }
      } catch (err) {
        console.error('Erro ao buscar cobranças reais do Asaas no Supabase:', err);
      } finally {
        setLoading(false);
      }
    }

    loadAsaasData();
  }, [activeClient?.cliente_id, selectedClientId]);

  // Abre Preview / Download da Nota Fiscal
  const handleOpenNf = async (cob: CobrancaItem) => {
    if (!cob.notaId) return;

    setNfModal({
      isOpen: true,
      loading: true,
      nfNumero: cob.nfNumero,
      notaId: cob.notaId,
      status: cob.nfStatus,
      cliente: cob.cliente,
      valor: cob.valorBruto,
    });

    try {
      const targetId = cob.clienteId || activeClient?.cliente_id || 'ALL';
      const res = await fetch(`/api/clientes/${targetId}/nf/${cob.notaId}/pdf`);
      const data = await res.json();

      if (data.success && data.url) {
        setNfModal((prev) => ({
          ...prev,
          loading: false,
          signedUrl: data.url,
          filename: data.filename || `NF-e-${cob.nfNumero || cob.notaId}.pdf`,
          dataEmissao: data.data_emissao ? new Date(data.data_emissao + 'T12:00:00').toLocaleDateString('pt-BR') : undefined,
          mensagem: undefined,
          error: undefined,
        }));
      } else {
        setNfModal((prev) => ({
          ...prev,
          loading: false,
          signedUrl: undefined,
          mensagem: data.mensagem || 'PDF ainda não disponível no banco.',
          error: undefined,
        }));
      }
    } catch (err) {
      setNfModal((prev) => ({
        ...prev,
        loading: false,
        error: 'Erro de comunicação ao carregar a nota fiscal.',
      }));
    }
  };

  const closeNfModal = () => {
    setNfModal({ isOpen: false, loading: false });
  };

  // Contadores para o Dashboard Resumido
  const totaisCalculados = useMemo(() => {
    let qtdRecebidas = 0;
    let qtdAguardando = 0;
    let qtdVencidas = 0;

    cobrancasData.forEach((c) => {
      if (c.status === 'RECEBIDA' || c.status === 'CONFIRMADA') {
        qtdRecebidas += 1;
      } else if (c.status === 'AGUARDANDO') {
        qtdAguardando += 1;
      } else if (c.status === 'VENCIDA') {
        qtdVencidas += 1;
      }
    });

    return {
      qtdRecebidas,
      qtdAguardando,
      qtdVencidas,
      totalCobrancas: cobrancasData.length,
    };
  }, [cobrancasData]);

  // Filtragem da Lista de Consulta
  const filteredCobrancas = useMemo(() => {
    return cobrancasData.filter((c) => {
      const matchesSearch =
        c.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.cliente.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.nfNumero && c.nfNumero.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesStatus =
        statusFilter === 'TODOS' ||
        c.status === statusFilter ||
        (statusFilter === 'RECEBIDA' && c.status === 'CONFIRMADA');

      const matchesNf =
        nfFilter === 'TODAS' ||
        (nfFilter === 'COM_NF' && c.nfNumero && c.nfNumero.startsWith('NF')) ||
        (nfFilter === 'SEM_NF' && (!c.nfNumero || !c.nfNumero.startsWith('NF')));

      return matchesSearch && matchesStatus && matchesNf;
    });
  }, [cobrancasData, searchTerm, statusFilter, nfFilter]);

  const formatBRL = (val: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  return (
    <div className="space-y-6 font-sans select-none">
      {/* 1. Header de Consulta (Sem botões gerenciáveis) */}
      <div className="bg-white border border-[#E2E8F0] p-6 rounded-2xl shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-3 py-0.5 rounded-full text-[10px] font-bold bg-[#EFF4FF] text-[#0050FF] border border-[#BFDBFE] uppercase tracking-wider flex items-center gap-1.5">
              <CreditCard className="w-3.5 h-3.5 text-[#0050FF]" />
              Financeiro Asaas • Modo Consulta
            </span>
            <span className="text-xs text-[#64748B]">• Sincronizado do Supabase</span>
          </div>
          <div className="flex items-center gap-2">
            <Building className="w-5 h-5 text-[#0050FF]" />
            <h1 className="text-xl sm:text-2xl font-bold text-[#0F172A] tracking-tight">
              Financeiro — {clientDisplayName}
            </h1>
          </div>
          <p className="text-xs text-[#64748B] max-w-xl">
            Consulta consolidada das cobranças e notas fiscais vinculadas ao cliente no Supabase (Cleide).
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <span className="px-3 py-1.5 rounded-xl bg-[#F8FAFC] text-[#475569] border border-[#E2E8F0] text-xs font-semibold flex items-center gap-1.5 shadow-2xs">
            <Database className="w-3.5 h-3.5 text-[#0050FF]" />
            <span>Refletido do Supabase</span>
          </span>
          {loading && <RefreshCw className="w-4 h-4 text-[#0050FF] animate-spin" />}
        </div>
      </div>

      {/* 2. DASHBOARD TOTAL RESUMIDO (VALORES REAIS DO SUPABASE) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Pago (Líquido) */}
        <div className="bg-white border border-[#E2E8F0] p-5 rounded-2xl shadow-xs space-y-2">
          <div className="flex items-center justify-between text-[#64748B]">
            <span className="text-xs font-semibold uppercase tracking-wider">Pagas</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-[#0F172A] tracking-tight">
            {loading ? '—' : formatBRL(totaisApi.recebido_liquido)}
          </p>
          <div className="text-[11px] text-[#64748B] flex items-center justify-between pt-2 border-t border-[#F1F5F9]">
            <span className="text-emerald-700 font-semibold">{totaisCalculados.qtdRecebidas} liquidadas</span>
            <span>Total pago</span>
          </div>
        </div>

        {/* Aguardando Pagamento */}
        <div className="bg-white border border-[#E2E8F0] p-5 rounded-2xl shadow-xs space-y-2">
          <div className="flex items-center justify-between text-[#64748B]">
            <span className="text-xs font-semibold uppercase tracking-wider">Aguardando Pagamento</span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600 border border-amber-200">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-[#0F172A] tracking-tight">
            {loading ? '—' : formatBRL(totaisApi.aguardando)}
          </p>
          <div className="text-[11px] text-[#64748B] flex items-center justify-between pt-2 border-t border-[#F1F5F9]">
            <span className="text-amber-700 font-semibold">{totaisCalculados.qtdAguardando} pendentes</span>
            <span>A vencer</span>
          </div>
        </div>

        {/* Vencidas */}
        <div className="bg-white border border-[#E2E8F0] p-5 rounded-2xl shadow-xs space-y-2">
          <div className="flex items-center justify-between text-[#64748B]">
            <span className="text-xs font-semibold uppercase tracking-wider">Vencidas</span>
            <div className="p-2 rounded-xl bg-rose-50 text-rose-600 border border-rose-200">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-rose-600 tracking-tight">
            {loading ? '—' : formatBRL(totaisApi.vencido)}
          </p>
          <div className="text-[11px] text-[#64748B] flex items-center justify-between pt-2 border-t border-[#F1F5F9]">
            <span className="text-rose-700 font-semibold">{totaisCalculados.qtdVencidas} em atraso</span>
            <span>Cobrança em aberto</span>
          </div>
        </div>

        {/* Total Pago */}
        <div className="bg-white border border-[#E2E8F0] p-5 rounded-2xl shadow-xs space-y-2">
          <div className="flex items-center justify-between text-[#64748B]">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Pago</span>
            <div className="p-2 rounded-xl bg-[#EFF4FF] text-[#0050FF] border border-[#BFDBFE]">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-[#0F172A] tracking-tight">
            {loading ? '—' : formatBRL(totaisApi.faturado_total)}
          </p>
          <div className="text-[11px] text-[#64748B] flex items-center justify-between pt-2 border-t border-[#F1F5F9]">
            <span>{totaisCalculados.totalCobrancas} cobranças</span>
            <span className="text-[#0050FF] font-semibold">Fonte: Supabase</span>
          </div>
        </div>
      </div>

      {/* 3. LISTA DE COBRANÇAS EM MODO CONSULTA (DADOS REAIS: DATA, STATUS, NF, VALOR) */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl shadow-xs overflow-hidden">
        {/* Filtros e Busca da Consulta */}
        <div className="p-5 border-b border-[#F1F5F9] flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-[#0F172A] flex items-center gap-2">
              <Receipt className="w-4 h-4 text-[#0050FF]" />
              Cobranças do Cliente ({filteredCobrancas.length})
            </h2>
            <p className="text-xs text-[#64748B]">
              Histórico com data de vencimento, pagamento, status atual e nota fiscal para preview/download
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Campo de Busca */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
              <input
                type="text"
                placeholder="Buscar por descrição, ID ou NF..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl focus:bg-white focus:outline-none focus:border-[#0050FF] shadow-2xs w-48 sm:w-56"
              />
            </div>

            {/* Filtro de Status */}
            <div className="flex bg-[#F1F5F9] border border-[#E2E8F0] rounded-xl p-1 text-xs">
              {(['TODOS', 'RECEBIDA', 'AGUARDANDO', 'VENCIDA'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-2.5 py-1 rounded-lg font-semibold cursor-pointer transition-all ${
                    statusFilter === st
                      ? 'bg-white text-[#0050FF] shadow-xs'
                      : 'text-[#64748B] hover:text-[#0F172A]'
                  }`}
                >
                  {st === 'TODOS'
                    ? 'Todas'
                    : st === 'RECEBIDA'
                    ? 'Pagas'
                    : st === 'AGUARDANDO'
                    ? 'Aguardando'
                    : 'Vencidas'}
                </button>
              ))}
            </div>

            {/* Filtro de NF */}
            <div className="flex bg-[#F1F5F9] border border-[#E2E8F0] rounded-xl p-1 text-xs">
              <button
                onClick={() => setNfFilter('TODAS')}
                className={`px-2.5 py-1 rounded-lg font-semibold cursor-pointer transition-all ${
                  nfFilter === 'TODAS'
                    ? 'bg-white text-[#0050FF] shadow-xs'
                    : 'text-[#64748B] hover:text-[#0F172A]'
                }`}
              >
                Todas NF
              </button>
              <button
                onClick={() => setNfFilter('COM_NF')}
                className={`px-2.5 py-1 rounded-lg font-semibold cursor-pointer transition-all ${
                  nfFilter === 'COM_NF'
                    ? 'bg-white text-emerald-600 shadow-xs'
                    : 'text-[#64748B] hover:text-[#0F172A]'
                }`}
              >
                Com NF
              </button>
            </div>
          </div>
        </div>

        {/* Tabela Read-Only com Dados Reais */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[#64748B] uppercase font-semibold tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Identificador & Descrição</th>
                <th className="py-3 px-4">Data Vencimento</th>
                <th className="py-3 px-4">Data Pagamento</th>
                <th className="py-3 px-4">Valor</th>
                <th className="py-3 px-4">Forma</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Nota Fiscal (Clique p/ Preview)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F1F5F9]">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-[#94A3B8]">
                    <RefreshCw className="w-5 h-5 text-[#0050FF] animate-spin inline mb-2" />
                    <p>Consultando dados reais de cobranças no Supabase...</p>
                  </td>
                </tr>
              ) : filteredCobrancas.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-[#94A3B8]">
                    Nenhuma cobrança localizada para este cliente no Supabase.
                  </td>
                </tr>
              ) : (
                filteredCobrancas.map((cob) => {
                  return (
                    <tr
                      key={cob.id}
                      className="hover:bg-[#F8FAFC] transition-colors"
                    >
                      {/* Descrição & ID */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-[#0F172A] leading-tight">
                          {cob.descricao}
                        </div>
                        <div className="text-[10px] text-[#64748B] font-mono mt-0.5">
                          {cob.id}
                        </div>
                      </td>

                      {/* Vencimento */}
                      <td className="py-3.5 px-4 font-medium text-[#334155] whitespace-nowrap">
                        {cob.vencimento}
                      </td>

                      {/* Pagamento */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {cob.pagamento ? (
                          <span className="font-semibold text-emerald-700">
                            {cob.pagamento}
                          </span>
                        ) : (
                          <span className="text-[#94A3B8]">—</span>
                        )}
                      </td>

                      {/* Valor */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-bold text-[#0F172A]">
                          {formatBRL(cob.valorBruto)}
                        </div>
                        {cob.valorLiquido !== cob.valorBruto && (
                          <div className="text-[10px] text-[#64748B]">
                            Líq: {formatBRL(cob.valorLiquido)}
                          </div>
                        )}
                      </td>

                      {/* Forma de Pagamento */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#F1F5F9] text-[#475569] border border-[#E2E8F0]">
                          {cob.formaPagamento}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border inline-flex items-center gap-1.5 ${
                            cob.status === 'RECEBIDA' || cob.status === 'CONFIRMADA'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : cob.status === 'AGUARDANDO'
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : cob.status === 'VENCIDA'
                              ? 'bg-rose-50 text-rose-700 border-rose-200'
                              : 'bg-sky-50 text-sky-700 border-sky-200'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              cob.status === 'RECEBIDA' || cob.status === 'CONFIRMADA'
                                ? 'bg-emerald-500'
                                : cob.status === 'AGUARDANDO'
                                ? 'bg-amber-500'
                                : cob.status === 'VENCIDA'
                                ? 'bg-rose-500'
                                : 'bg-sky-500'
                            }`}
                          />
                          {cob.status === 'RECEBIDA'
                            ? 'Paga'
                            : cob.status === 'CONFIRMADA'
                            ? 'Paga'
                            : cob.status === 'AGUARDANDO'
                            ? 'Aguardando'
                            : 'Vencida'}
                        </span>
                      </td>

                      {/* Nota Fiscal com Botão Interativo de Preview/Download */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {cob.nfNumero ? (
                          cob.hasPdf ? (
                            <button
                              type="button"
                              onClick={() => handleOpenNf(cob)}
                              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#EFF4FF] hover:bg-[#E0EAFF] text-[#0050FF] font-bold text-[11px] border border-[#BFDBFE] hover:border-[#0050FF] shadow-2xs transition-all cursor-pointer group"
                              title="Clique para abrir o preview e fazer download do PDF da Nota Fiscal"
                            >
                              <FileCheck className="w-3.5 h-3.5 text-[#0050FF] group-hover:scale-110 transition-transform" />
                              <span>{cob.nfNumero}</span>
                              <Eye className="w-3 h-3 text-[#0050FF]/70 ml-0.5" />
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleOpenNf(cob)}
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-all cursor-pointer ${
                                cob.nfStatus === 'CANCELED'
                                  ? 'bg-slate-100 text-[#64748B] border-slate-200 hover:bg-slate-200'
                                  : cob.nfStatus === 'SCHEDULED'
                                  ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                                  : 'bg-blue-50/70 text-[#0050FF] border-blue-200 hover:bg-blue-100'
                              }`}
                              title={
                                cob.nfStatus === 'CANCELED'
                                  ? 'Nota cancelada (sem PDF)'
                                  : cob.nfStatus === 'SCHEDULED'
                                  ? 'Nota agendada (sem PDF)'
                                  : 'Clique para verificar o status do PDF'
                              }
                            >
                              <FileText className="w-3.5 h-3.5" />
                              <span>{cob.nfNumero}</span>
                              <span className="text-[9px] opacity-75">
                                {cob.nfStatus === 'CANCELED'
                                  ? '(Cancelada)'
                                  : cob.nfStatus === 'SCHEDULED'
                                  ? '(Agendada)'
                                  : '(Em fila)'}
                              </span>
                            </button>
                          )
                        ) : (
                          <span className="text-[10px] text-[#94A3B8]">
                            — Sem NF
                          </span>
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

      {/* 4. MODAL DE PREVIEW E DOWNLOAD DA NOTA FISCAL (SIGNED URL DO BUCKET notas-asaas) */}
      {nfModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white border border-[#CBD5E1] rounded-2xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Header do Modal */}
            <div className="p-4 sm:p-5 border-b border-[#E2E8F0] bg-[#F8FAFC] flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#EFF4FF] border border-[#BFDBFE] text-[#0050FF] flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5 text-[#0050FF]" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-[#0F172A] leading-tight">
                      Nota Fiscal {nfModal.nfNumero || 'Asaas'}
                    </h3>
                    {nfModal.status && (
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                          nfModal.status === 'AUTHORIZED'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : nfModal.status === 'CANCELED'
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}
                      >
                        {nfModal.status === 'AUTHORIZED'
                          ? 'Autorizada'
                          : nfModal.status === 'CANCELED'
                          ? 'Cancelada'
                          : 'Agendada'}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#64748B] mt-0.5">
                    Cliente: <strong>{nfModal.cliente}</strong> • Valor: <strong>{nfModal.valor ? formatBRL(nfModal.valor) : '—'}</strong>
                    {nfModal.dataEmissao && ` • Emissão: ${nfModal.dataEmissao}`}
                  </p>
                </div>
              </div>

              {/* Botões de Ação */}
              <div className="flex items-center gap-2">
                {nfModal.signedUrl && (
                  <>
                    <a
                      href={nfModal.signedUrl}
                      download={nfModal.filename || 'NotaFiscal.pdf'}
                      className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-[#0050FF] hover:bg-[#0040D6] text-white flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                      title="Fazer download do PDF da Nota Fiscal"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Baixar PDF</span>
                    </a>

                    <a
                      href={nfModal.signedUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-xl bg-white border border-[#CBD5E1] hover:border-[#0050FF] text-[#475569] hover:text-[#0050FF] transition-all shadow-xs cursor-pointer"
                      title="Abrir PDF em nova aba"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </>
                )}

                <button
                  type="button"
                  onClick={closeNfModal}
                  className="p-2 rounded-xl bg-white border border-[#CBD5E1] hover:bg-slate-100 text-[#64748B] hover:text-[#0F172A] transition-all shadow-xs cursor-pointer ml-1"
                  title="Fechar"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Corpo do Modal: Preview Iframe ou Aviso Informativo */}
            <div className="flex-1 p-4 sm:p-6 overflow-y-auto bg-slate-50 min-h-[420px] flex items-center justify-center">
              {nfModal.loading ? (
                <div className="text-center py-12 space-y-3">
                  <RefreshCw className="w-8 h-8 text-[#0050FF] animate-spin mx-auto" />
                  <p className="text-sm font-semibold text-[#0F172A]">Gerando link seguro de visualização...</p>
                  <p className="text-xs text-[#64748B]">Assinando URL temporária (validade de 5 minutos)</p>
                </div>
              ) : nfModal.signedUrl ? (
                <div className="w-full h-[620px] bg-white border border-[#E2E8F0] rounded-xl overflow-hidden shadow-xs flex flex-col">
                  <iframe
                    src={nfModal.signedUrl}
                    title={`Visualização ${nfModal.nfNumero}`}
                    className="w-full h-full border-0"
                  />
                </div>
              ) : (
                <div className="max-w-md w-full bg-white border border-[#E2E8F0] rounded-2xl p-6 text-center space-y-4 shadow-sm">
                  <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto">
                    <AlertCircle className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-base font-bold text-[#0F172A]">
                      {nfModal.status === 'CANCELED'
                        ? 'Nota Fiscal Cancelada'
                        : nfModal.status === 'SCHEDULED'
                        ? 'Nota Fiscal Agendada'
                        : 'PDF ainda não disponível'}
                    </h4>
                    <p className="text-xs text-[#64748B] leading-relaxed">
                      {nfModal.mensagem ||
                        'Os arquivos PDF das notas fiscais do Asaas estão sendo salvos no Supabase gradualmente (~25 por noite) para respeitar os limites de requisição da API.'}
                    </p>
                  </div>

                  <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-left text-xs space-y-1">
                    <p className="font-semibold text-[#334155]">Detalhes do registro:</p>
                    <p className="text-[11px] text-[#64748B] font-mono">
                      ID: {nfModal.notaId} • Status: {nfModal.status}
                    </p>
                    <p className="text-[11px] text-[#64748B]">
                      Assim que o download noturno concluir esta nota, o preview e download ficarão disponíveis automaticamente.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={closeNfModal}
                    className="w-full py-2.5 rounded-xl text-xs font-semibold bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#0F172A] transition-all cursor-pointer"
                  >
                    Fechar
                  </button>
                </div>
              )}
            </div>

            {/* Footer do Modal */}
            <div className="px-5 py-3 border-t border-[#E2E8F0] bg-white flex items-center justify-between text-xs text-[#64748B]">
              <span>Bucket: <strong>notas-asaas</strong> (Supabase Storage)</span>
              <span>Link seguro assinado por 5 minutos</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
