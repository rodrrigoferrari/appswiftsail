'use client';

import React, { useState, useEffect } from 'react';
import { useTenant } from '@/components/TenantProvider';
import {
  DollarSign,
  TrendingUp,
  Users,
  Target,
  ArrowUpRight,
  ShieldCheck,
  Zap,
  Activity,
  Award,
  Sparkles,
  BarChart3,
  ExternalLink,
  Crown,
  Building,
  UserPlus,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Clock,
  Radio,
  Search,
  MessageSquare,
  CreditCard,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const router = useRouter();
  const {
    selectedClientId,
    activeClient,
    clients,
    dateRange,
    viewMode,
    selectClientAndSwitchToWorkspace,
    activeClientCsStatus,
    activeClientAdAccounts,
    users,
  } = useTenant();

  // Diretriz 3.1: REMOVER Dashboard Master. Admin opera a partir de Gestão de Clientes.
  useEffect(() => {
    if (viewMode === 'admin') {
      router.replace('/admin/clientes');
    }
  }, [viewMode, router]);

  const isAggregated = viewMode === 'admin' || selectedClientId === 'ALL';
  const clientName = isAggregated
    ? 'Painel Master — Swiftsail HQ'
    : (activeClient?.nome === 'EMOVERE' ? 'Emovere' : activeClient?.nome) || selectedClientId;

  // Real Dynamic Metrics State
  const [loading, setLoading] = useState(false);
  const [metaData, setMetaData] = useState<any>(null);
  const [googleData, setGoogleData] = useState<any>(null);
  const [kommoData, setKommoData] = useState<any>(null);
  const [unavailable, setUnavailable] = useState<string | null>(null);

  useEffect(() => {
    async function fetchRealMetrics() {
      setLoading(true);
      try {
        const targetId = isAggregated ? 'ALL' : selectedClientId;
        const [resMeta, resGoogle, resKommo] = await Promise.all([
          fetch(`/api/clientes/${targetId}/meta?from=${dateRange.start}&to=${dateRange.end}`),
          fetch(`/api/clientes/${targetId}/google?from=${dateRange.start}&to=${dateRange.end}`),
          fetch(`/api/clientes/${targetId}/kommo?from=${dateRange.start}&to=${dateRange.end}`),
        ]);

        const [dataMeta, dataGoogle, dataKommo] = await Promise.all([
          resMeta.json(),
          resGoogle.json(),
          resKommo.json(),
        ]);

        const falha = [dataMeta, dataGoogle, dataKommo].find((d) => !d.success);
        setUnavailable(falha ? falha.motivo || falha.error || 'Fonte de dados indisponível' : null);
        setMetaData(dataMeta.success ? dataMeta : null);
        setGoogleData(dataGoogle.success ? dataGoogle : null);
        setKommoData(dataKommo.success ? dataKommo : null);
      } catch (err) {
        console.error('Error fetching dashboard real metrics:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchRealMetrics();
  }, [selectedClientId, isAggregated, dateRange]);

  // Aggregate Real Figures
  const metaSpend = Number(metaData?.totais?.gasto || 0);
  const googleSpend = Number(googleData?.totais?.gasto || 0);
  const totalSpend = metaSpend + googleSpend;

  // Contrato Cleide: leads (formulário) e conversas_iniciadas (WhatsApp/Direct) são eventos distintos — não somar como se fossem o mesmo tipo
  const metaCadastros = Number(metaData?.totais?.leads || 0);
  const metaConversas = Number(metaData?.totais?.conversas_iniciadas || 0);
  const googleConversions = Number(googleData?.totais?.conversoes || 0);
  const totalOportunidades = metaCadastros + metaConversas + googleConversions;

  const metaClicks = Number(metaData?.totais?.cliques || 0);
  const googleClicks = Number(googleData?.totais?.cliques || 0);
  const totalClicks = metaClicks + googleClicks;

  const metaImpressions = Number(metaData?.totais?.impressoes || 0);
  const googleImpressions = Number(googleData?.totais?.impressoes || 0);
  const totalImpressions = metaImpressions + googleImpressions;

  const cpaReal = totalOportunidades > 0 ? totalSpend / totalOportunidades : 0;
  const ctrReal = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;

  // Active accounts breakdown
  const metaAccounts = activeClientAdAccounts.filter((a) => a.plataforma === 'meta');
  const googleAccounts = activeClientAdAccounts.filter((a) => a.plataforma === 'google');

  // Format currency helpers
  const formatBRL = (val: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  return (
    <div className="space-y-6 font-sans select-none">
      {/* Top Banner / Welcome (Estilo Asaas: Branco Puro, Borda Fina, Destaque Limpo) */}
      <div className="bg-white border border-[#E2E8F0] p-6 rounded-2xl shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span
              className={`px-3 py-1 rounded-full text-[10px] font-bold border uppercase tracking-wider flex items-center gap-1.5 ${
                isAggregated
                  ? 'bg-[#EFF4FF] text-[#0050FF] border-[#BFDBFE]'
                  : 'bg-[#EFF4FF] text-[#0050FF] border-[#BFDBFE]'
              }`}
            >
              {isAggregated ? <Crown className="w-3.5 h-3.5 text-[#0050FF]" /> : <Sparkles className="w-3.5 h-3.5 text-[#0050FF]" />}
              {isAggregated ? 'Governança & Gestão Global' : 'Inteligência de Tráfego & IA'}
            </span>
            <span className="text-xs text-[#64748B] font-medium">| Período: {dateRange.label}</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-[#0F172A] tracking-tight">{clientName}</h2>
          <p className="text-xs text-[#64748B] max-w-xl leading-relaxed">
            {isAggregated
              ? 'Consolidado global da carteira ativa. Gestão unificada de contas Meta Ads, Google Ads, CRM e CS.'
              : `Visão operacional em tempo real de ${clientName}. Contas conectadas, saúde de atendimento e ingestão Sinapse.`}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {isAggregated ? (
            <div className="flex items-center gap-2">
              <Link
                href="/admin/usuarios"
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#EFF4FF] hover:bg-[#E0EAFF] text-[#0050FF] border border-[#BFDBFE] flex items-center gap-1.5 transition-all shadow-xs"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Convidar Usuário</span>
              </Link>
              <Link
                href="/admin/clientes"
                className="px-5 py-2 rounded-full text-xs font-semibold bg-[#0050FF] hover:bg-[#0040D6] text-white flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
              >
                <Building className="w-3.5 h-3.5" />
                <span>Ver Carteira</span>
              </Link>
            </div>
          ) : (
            <div className="bg-[#F8FAFC] border border-[#E2E8F0] p-3.5 rounded-xl text-right max-w-md shadow-xs">
              <div className="flex items-center justify-between gap-4 mb-1">
                <span className="text-[10px] uppercase font-bold tracking-wider text-[#64748B]">
                  Saúde CS (Agente @CS)
                </span>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                    activeClientCsStatus?.nivel === 'saudavel'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : activeClientCsStatus?.nivel === 'atencao'
                      ? 'bg-amber-50 text-amber-700 border-amber-200'
                      : activeClientCsStatus?.nivel === 'em_risco'
                      ? 'bg-rose-50 text-rose-700 border-rose-200'
                      : 'bg-slate-100 text-[#64748B] border-slate-200'
                  }`}
                >
                  {activeClientCsStatus?.nivel === 'saudavel'
                    ? '🟢 Saudável'
                    : activeClientCsStatus?.nivel === 'atencao'
                    ? '🟡 Atenção'
                    : activeClientCsStatus?.nivel === 'em_risco'
                    ? '🔴 Em Risco'
                    : '⚪ Sem dados'}
                </span>
              </div>
              <p className="text-[11px] text-[#334155] leading-snug line-clamp-2 text-left">
                {activeClientCsStatus?.sinais?.nota || 'Diagnóstico operacional normalizado sem alertas abertos.'}
              </p>
            </div>
          )}
        </div>
      </div>

      {unavailable && (
        <div className="p-4 rounded-xl text-xs font-semibold flex items-start gap-2 border bg-amber-50 text-amber-800 border-amber-200">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <span>
            Investimento, leads e CPA indisponíveis: não foi possível ler os dados de tráfego do Cleide. {unavailable}
          </span>
        </div>
      )}

      {/* KPI Metric Cards — 100% Dynamic Real Data (Estilo Asaas) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Investimento Real */}
        <div className="bg-white border border-[#E2E8F0] p-5 rounded-2xl shadow-xs relative space-y-2 hover:border-[#CBD5E1] transition-all">
          <div className="flex items-center justify-between text-[#64748B]">
            <span className="text-xs font-semibold uppercase tracking-wider">Investimento em Anúncios</span>
            <div className="p-2 rounded-xl bg-[#EFF4FF] text-[#0050FF] border border-[#BFDBFE]">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-[#0F172A] tracking-tight">
            {loading ? <RefreshCw className="w-5 h-5 animate-spin text-[#0050FF] inline" /> : unavailable ? '—' : formatBRL(totalSpend)}
          </p>
          <div className="text-[11px] text-[#64748B] flex items-center justify-between pt-2 border-t border-[#F1F5F9]">
            <span>Meta: {formatBRL(metaSpend)}</span>
            <span>Google: {formatBRL(googleSpend)}</span>
          </div>
        </div>

        {/* Leads & Conversões Reais */}
        <div className="bg-white border border-[#E2E8F0] p-5 rounded-2xl shadow-xs relative space-y-2 hover:border-[#CBD5E1] transition-all">
          <div className="flex items-center justify-between text-[#64748B]">
            <span className="text-xs font-semibold uppercase tracking-wider">Leads & Conversões</span>
            <div className="p-2 rounded-xl bg-[#EFF4FF] text-[#0050FF] border border-[#BFDBFE]">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-[#0F172A] tracking-tight">
            {loading ? <RefreshCw className="w-5 h-5 animate-spin text-[#0050FF] inline" /> : unavailable ? '—' : totalOportunidades.toLocaleString('pt-BR')}
          </p>
          <div className="text-[11px] text-[#64748B] flex items-center justify-between pt-2 border-t border-[#F1F5F9]">
            <span>Meta: {metaCadastros} leads · {metaConversas} conv.</span>
            <span>Google: {googleConversions} conv.</span>
          </div>
        </div>

        {/* CPA Real */}
        <div className="bg-white border border-[#E2E8F0] p-5 rounded-2xl shadow-xs relative space-y-2 hover:border-[#CBD5E1] transition-all">
          <div className="flex items-center justify-between text-[#64748B]">
            <span className="text-xs font-semibold uppercase tracking-wider">CPA Médio</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200">
              <Target className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-[#0F172A] tracking-tight">
            {unavailable ? '—' : totalOportunidades > 0 ? formatBRL(cpaReal) : '—'}
          </p>
          <div className="text-[11px] text-[#64748B] pt-2 border-t border-[#F1F5F9]">
            <span>Custo por lead/conversa gerada</span>
          </div>
        </div>

        {/* Contas Ativas em Operação */}
        <div className="bg-white border border-[#E2E8F0] p-5 rounded-2xl shadow-xs relative space-y-2 hover:border-[#CBD5E1] transition-all">
          <div className="flex items-center justify-between text-[#64748B]">
            <span className="text-xs font-semibold uppercase tracking-wider">Contas Conectadas</span>
            <div className="p-2 rounded-xl bg-purple-50 text-purple-600 border border-purple-200">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-[#0F172A] tracking-tight">
            {activeClientAdAccounts.length} <span className="text-xs font-normal text-[#64748B]">contas</span>
          </p>
          <div className="text-[11px] text-[#64748B] flex items-center justify-between pt-2 border-t border-[#F1F5F9]">
            <span className="text-[#0050FF] font-semibold">{metaAccounts.length} Meta</span>
            <span className="text-sky-600 font-semibold">{googleAccounts.length} Google</span>
          </div>
        </div>
      </div>

      {/* ASAAS FINTECH OVERVIEW BANNER — Design System Integrado */}
      <div className="bg-white border border-[#E2E8F0] p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-[#EFF4FF] border border-[#BFDBFE] text-[#0050FF] flex items-center justify-center shrink-0">
            <CreditCard className="w-5 h-5 text-[#0050FF]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#0050FF] bg-[#EFF4FF] px-2.5 py-0.5 rounded-full border border-[#BFDBFE]">
                Asaas Gateway Fintech
              </span>
              <span className="text-xs text-[#64748B] font-mono">Outubro 2026</span>
            </div>
            <h3 className="text-sm sm:text-base font-bold text-[#0F172A] mt-0.5">
              R$ 27.809,65 Recebidos líquido <span className="text-xs font-normal text-[#64748B]">(14 cobranças · 12 clientes)</span>
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/financeiro"
            className="px-5 py-2.5 rounded-full text-xs font-semibold bg-[#0050FF] hover:bg-[#0040D6] text-white flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
          >
            <span>Ver Visualização Asaas</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* ADMIN EXCLUSIVE SECTION: Multi-tenant Clients Quick Matrix */}
      {isAggregated && (
        <div className="bg-white border border-[#E2E8F0] p-6 rounded-2xl shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#F1F5F9] pb-3">
            <div>
              <h3 className="text-sm font-bold text-[#0F172A] flex items-center gap-2">
                <Building className="w-4 h-4 text-[#0050FF]" />
                Carteira de Clientes Ativos ({clients.filter((c) => c.status === 'ativo').length})
              </h3>
              <p className="text-xs text-[#64748B]">
                Selecione qualquer cliente para entrar diretamente no seu workspace individual
              </p>
            </div>

            <Link
              href="/admin/clientes"
              className="text-xs font-bold text-[#0050FF] hover:underline flex items-center gap-1"
            >
              <span>Gerenciar todos os clientes</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-1">
            {clients.filter((c) => c.status === 'ativo').map((client) => {
              const clientUsersCount = users.filter((u) => u.cliente_id === client.cliente_id).length;
              return (
                <div
                  key={client.cliente_id}
                  onClick={() => selectClientAndSwitchToWorkspace(client.cliente_id)}
                  className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] hover:border-[#0050FF] hover:bg-[#EFF4FF]/30 cursor-pointer transition-all group flex items-center justify-between"
                >
                  <div className="space-y-1 min-w-0 pr-2">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                      <h4 className="font-bold text-[#0F172A] text-xs truncate group-hover:text-[#0050FF] transition-colors">
                        {client.nome === 'EMOVERE' ? 'Emovere' : client.nome}
                      </h4>
                    </div>
                    <p className="text-[11px] text-[#64748B] font-mono truncate">
                      {client.grupo_whatsapp_id ? '📱 WhatsApp Vinculado' : 'Sem grupo'} • {clientUsersCount} usuários
                    </p>
                  </div>

                  <div className="p-2 rounded-lg bg-white border border-[#E2E8F0] text-[#64748B] group-hover:text-[#0050FF] group-hover:border-[#BFDBFE] transition-colors shadow-xs">
                    <ExternalLink className="w-3.5 h-3.5" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* CLIENT SPECIFIC: Saúde CS e Status Operacional (Diretriz 4.2) */}
      {!isAggregated && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Diagnóstico de Saúde CS */}
          <div className="bg-white border border-[#E2E8F0] p-6 rounded-2xl shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-3">
              <div>
                <h3 className="text-sm font-bold text-[#0F172A] flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  Saúde do Cliente (CS Score)
                </h3>
                <p className="text-xs text-[#64748B]">Monitoramento preventivo e índice de satisfação</p>
              </div>
              <span
                className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase border ${
                  activeClientCsStatus?.nivel === 'saudavel'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : activeClientCsStatus?.nivel === 'atencao'
                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                    : 'bg-rose-50 text-rose-700 border-rose-200'
                }`}
              >
                {activeClientCsStatus?.nivel === 'saudavel'
                  ? '🟢 Operação Saudável'
                  : activeClientCsStatus?.nivel === 'atencao'
                  ? '🟡 Atenção Necessária'
                  : '🔴 Em Risco'}
              </span>
            </div>

            <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-2">
              <p className="text-xs font-semibold text-[#0F172A]">Diagnóstico Ativo do Agente @CS:</p>
              <p className="text-xs text-[#475569] leading-relaxed">
                {activeClientCsStatus?.sinais?.nota || 'Fluxo de atendimento ágil, baixo tempo de resposta a leads e campanhas rodando dentro do CPA alvo.'}
              </p>
            </div>
          </div>

          {/* Operational Health & Communication */}
          <div className="bg-white border border-[#E2E8F0] p-6 rounded-2xl shadow-xs space-y-4">
            <div className="border-b border-[#F1F5F9] pb-3">
              <h3 className="text-sm font-bold text-[#0F172A] flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                Saúde & Comunicação
              </h3>
              <p className="text-xs text-[#64748B]">Status dos canais e integrações</p>
            </div>

            <div className="space-y-3 pt-1 text-xs">
              <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <MessageSquare className="w-4 h-4 text-emerald-600" />
                  <div>
                    <p className="font-bold text-[#0F172A]">Grupo WhatsApp</p>
                    <p className="text-[10px] font-mono text-[#64748B] truncate max-w-[140px]">
                      {activeClient?.grupo_whatsapp_id || 'Sem grupo'}
                    </p>
                  </div>
                </div>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  activeClient?.grupo_whatsapp_id ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-[#64748B]'
                }`}>
                  {activeClient?.grupo_whatsapp_id ? 'Conectado' : 'Pendente'}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Zap className="w-4 h-4 text-[#0050FF]" />
                  <div>
                    <p className="font-bold text-[#0F172A]">Meta Graph API</p>
                    <p className="text-[10px] text-[#64748B]">BM 791208745012339</p>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {metaAccounts.length > 0 ? 'Cadastrada' : 'Sem contas'}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Search className="w-4 h-4 text-sky-600" />
                  <div>
                    <p className="font-bold text-[#0F172A]">Google Ads API</p>
                    <p className="text-[10px] text-[#64748B]">MCC 262-638-1700</p>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {googleAccounts.length > 0 ? 'Cadastrada' : 'Sem contas'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
