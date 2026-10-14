'use client';

import React, { useState, useEffect } from 'react';
import { useTenant } from '@/components/TenantProvider';
import { Cliente } from '@/types/database';
import { getClientSlug } from '@/lib/clientSlug';
import {
  DollarSign,
  TrendingUp,
  Users,
  Target,
  ArrowUpRight,
  ShieldCheck,
  Zap,
  Sparkles,
  BarChart3,
  ExternalLink,
  Crown,
  Building,
  UserPlus,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  RefreshCw,
  Search,
  MessageSquare,
  CreditCard,
  Eye,
  Sliders,
  ChevronRight,
  Clock,
  Layers,
  Wallet,
  Activity,
  Palette,
  Check,
  Bot,
  Send,
  Copy,
  RotateCcw,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface ClientDashboardViewProps {
  currentClient?: Cliente;
  isAdminInspection?: boolean;
}

export default function ClientDashboardView({
  currentClient,
  isAdminInspection = false,
}: ClientDashboardViewProps) {
  const router = useRouter();
  const {
    selectedClientId,
    activeClient: contextActiveClient,
    clients,
    dateRange,
    viewMode,
    activeClientAdAccounts,
  } = useTenant();

  const client = currentClient || contextActiveClient;
  const isAggregated = !client && (viewMode === 'admin' || selectedClientId === 'ALL');
  const clientName = client?.nome === 'EMOVERE' ? 'Emovere' : client?.nome || 'Workspace';
  const clientSlug = client ? getClientSlug(client) : '';

  // Real Dynamic Metrics State
  const [loading, setLoading] = useState(false);
  const [metaData, setMetaData] = useState<any>(null);
  const [googleData, setGoogleData] = useState<any>(null);
  const [kommoData, setKommoData] = useState<any>(null);
  const [asaasData, setAsaasData] = useState<any>(null);
  const [syncStatus, setSyncStatus] = useState<any>(null);
  const [unavailable, setUnavailable] = useState<string | null>(null);

  // AI Assistant State (Anthropic Claude 3.5 Sonnet)
  const [aiQuestion, setAiQuestion] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const [copiedResponse, setCopiedResponse] = useState(false);

  const handleAskAI = async (customPrompt?: string) => {
    const questionToSend = (customPrompt || aiQuestion).trim();
    if (!questionToSend || aiLoading) return;

    if (customPrompt) {
      setAiQuestion(customPrompt);
    }

    setAiLoading(true);
    setAiError(null);
    setAiResponse(null);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clienteId: client?.cliente_id || selectedClientId,
          clienteNome: clientName,
          pergunta: questionToSend,
          dateRange: dateRange,
          metricsContext: {
            investimento_total: totalSpend,
            gasto_meta: metaSpend,
            gasto_google: googleSpend,
            conversas_whatsapp: metaConversas,
            cadastros_leads: metaCadastros,
            conversoes_google: googleConversions,
            total_oportunidades: totalOportunidades,
            custo_medio_por_oportunidade: custoPorOportunidade,
            crm_total_leads: totalLeadsKommo,
            crm_leads_ganhos: leadsGanhos,
            crm_leads_abertos: leadsAbertos,
            crm_leads_perdidos: leadsPerdidos,
            crm_taxa_conversao: `${taxaConversaoCrm.toFixed(1)}%`,
            contas_conectadas: activeClientAdAccounts.map((a) => `${a.plataforma}: ${a.account_name}`),
            asaas_recebido_liquido: asaasData?.totais?.recebido_liquido || 0,
          },
        }),
      });

      const data = await res.json();
      if (data.success && data.resposta) {
        setAiResponse(data.resposta);
      } else {
        setAiError(data.error || 'Não foi possível obter resposta da IA.');
      }
    } catch (err: any) {
      console.error('Error asking AI:', err);
      setAiError('Falha ao comunicar com o assistente de IA.');
    } finally {
      setAiLoading(false);
    }
  };

  const handleCopyAiResponse = () => {
    if (!aiResponse) return;
    navigator.clipboard.writeText(aiResponse);
    setCopiedResponse(true);
    setTimeout(() => setCopiedResponse(false), 2500);
  };

  useEffect(() => {
    async function fetchRealMetrics() {
      setLoading(true);
      try {
        const targetId = client?.cliente_id || (isAggregated ? 'ALL' : selectedClientId);
        const [resMeta, resGoogle, resKommo, resAsaas, resSync] = await Promise.all([
          fetch(`/api/clientes/${targetId}/meta?from=${dateRange.start}&to=${dateRange.end}`),
          fetch(`/api/clientes/${targetId}/google?from=${dateRange.start}&to=${dateRange.end}`),
          fetch(`/api/clientes/${targetId}/kommo?from=${dateRange.start}&to=${dateRange.end}`),
          fetch(`/api/clientes/${targetId}/asaas`),
          fetch('/api/sync-status'),
        ]);

        const [dataMeta, dataGoogle, dataKommo, dataAsaas, dataSync] = await Promise.all([
          resMeta.json(),
          resGoogle.json(),
          resKommo.json(),
          resAsaas.json(),
          resSync.json(),
        ]);

        const falha = [dataMeta, dataGoogle, dataKommo].find((d) => !d.success);
        setUnavailable(falha ? falha.motivo || falha.error || 'Fonte de dados indisponível' : null);
        setMetaData(dataMeta.success ? dataMeta : null);
        setGoogleData(dataGoogle.success ? dataGoogle : null);
        setKommoData(dataKommo.success ? dataKommo : null);
        setAsaasData(dataAsaas.success ? dataAsaas : null);
        if (dataSync.success) setSyncStatus(dataSync.fontes);
      } catch (err) {
        console.error('Error fetching dashboard real metrics:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchRealMetrics();
  }, [client?.cliente_id, selectedClientId, isAggregated, dateRange]);

  // Regra de Negócio: BRL, fuso da conta (BRT)
  const metaSpend = Number(metaData?.totais?.gasto || 0);
  const googleSpend = Number(googleData?.totais?.gasto || 0);
  const totalSpend = metaSpend + googleSpend;

  // Regra de Negócio Crítica (Meta):
  // leads (formulário) e conversas_iniciadas (WhatsApp/Direct) são eventos distintos — NUNCA SOMAR
  const metaCadastros = Number(metaData?.totais?.leads || 0);
  const metaConversas = Number(metaData?.totais?.conversas_iniciadas || 0);
  const googleConversions = Number(googleData?.totais?.conversoes || 0);

  const metaClicks = Number(metaData?.totais?.cliques || 0);
  const googleClicks = Number(googleData?.totais?.cliques || 0);
  const totalClicks = metaClicks + googleClicks;

  const metaImpressions = Number(metaData?.totais?.impressoes || 0);
  const googleImpressions = Number(googleData?.totais?.impressoes || 0);
  const totalImpressions = metaImpressions + googleImpressions;

  const custoPorConversaMeta = metaConversas > 0 ? metaSpend / metaConversas : 0;
  const custoPorLeadMeta = metaCadastros > 0 ? metaSpend / metaCadastros : 0;

  // Total consolidado de oportunidades de negócio (Conversas WhatsApp + Cadastros)
  const totalOportunidades = metaConversas + metaCadastros + googleConversions;
  const custoPorOportunidade = totalOportunidades > 0 ? totalSpend / totalOportunidades : 0;

  // Kommo CRM Funnel
  const totalLeadsKommo = Number(kommoData?.total_leads || 0);
  const leadsAbertos = Number(kommoData?.resumo_status?.aberta?.total || 0);
  const leadsGanhos = Number(kommoData?.resumo_status?.ganho?.total || 0);
  const leadsPerdidos = Number(kommoData?.resumo_status?.perda?.total || 0);
  const taxaConversaoCrm = totalLeadsKommo > 0 ? (leadsGanhos / totalLeadsKommo) * 100 : 0;

  // Proporção de investimento por canal
  const metaSpendPercent = totalSpend > 0 ? Math.round((metaSpend / totalSpend) * 100) : 50;
  const googleSpendPercent = totalSpend > 0 ? 100 - metaSpendPercent : 50;

  // Contas ativas do cliente
  const metaAccounts = activeClientAdAccounts.filter((a) => a.plataforma === 'meta');
  const googleAccounts = activeClientAdAccounts.filter((a) => a.plataforma === 'google');

  // Alerta em vermelho quando saldo_disponivel < 50 ou limite_restante < 50 nas contas Meta
  const criticalMetaAccounts = metaAccounts.filter((a) => {
    const isPrePaga = a.tipo_pagamento === 'pre_paga';
    const isSaldoBaixo = isPrePaga && a.saldo_disponivel !== null && a.saldo_disponivel !== undefined && Number(a.saldo_disponivel) < 50;
    const isLimiteBaixo = a.limite_restante !== null && a.limite_restante !== undefined && Number(a.limite_restante) < 50;
    return isSaldoBaixo || isLimiteBaixo;
  });

  const metaContas = (metaData?.contas && metaData.contas.length > 0)
    ? metaData.contas
    : metaAccounts;

  const googleContas = (googleData?.contas && googleData.contas.length > 0)
    ? googleData.contas
    : googleAccounts;

  const formatCartao = (digitos?: string | null) => {
    if (!digitos) return '—';
    return `•••• ${digitos}`;
  };

  // Format currency helpers
  const formatBRL = (val: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  // Formata timestamp do sync para America/Sao_Paulo
  const formatSyncTime = (isoString?: string | null) => {
    if (!isoString) return 'Nunca sincronizado';
    return new Date(isoString).toLocaleString('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-6 font-sans select-none">
      {/* ADMIN INSPECTION BAR (Exibido exclusivamente quando o Admin está inspecionando este cliente) */}
      {isAdminInspection && client && (
        <div className="bg-white border-2 border-[#0050FF]/30 p-4 rounded-2xl shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#EFF4FF] border border-[#BFDBFE] text-[#0050FF] flex items-center justify-center shrink-0">
              <Crown className="w-5 h-5 text-[#0050FF]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#0050FF] bg-[#EFF4FF] px-2.5 py-0.5 rounded-full border border-[#BFDBFE]">
                  Inspeção Admin
                </span>
                <span className="text-xs text-[#64748B]">
                  Operando no escopo do cliente: <strong className="text-[#0F172A] font-bold">{clientName}</strong>
                </span>
              </div>
              <p className="text-xs text-[#475569] mt-0.5">
                Você tem visibilidade total das métricas e dados exatamente como o cliente visualiza.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Troca rápida de cliente no modo inspeção */}
            <select
              value={client.cliente_id}
              onChange={(e) => {
                const target = clients.find((c) => c.cliente_id === e.target.value);
                if (target) {
                  router.push(`/admin/client/${getClientSlug(target)}`);
                }
              }}
              className="bg-white text-xs font-semibold text-[#0F172A] border border-[#CBD5E1] rounded-xl px-3 py-2 focus:outline-none focus:border-[#0050FF] shadow-xs cursor-pointer"
            >
              {clients.map((c) => (
                <option key={c.cliente_id} value={c.cliente_id}>
                  {c.nome === 'EMOVERE' ? 'Emovere' : c.nome}
                </option>
              ))}
            </select>

            <Link
              href={`/client/${clientSlug}`}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-[#EFF4FF] hover:bg-[#E0EAFF] text-[#0050FF] border border-[#BFDBFE] flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
              title="Testar a perspectiva do cliente"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Ver como Cliente</span>
            </Link>

            <Link
              href="/admin"
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-[#0F172A] hover:bg-[#1E293B] text-white flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
            >
              <Crown className="w-3.5 h-3.5" />
              <span>Voltar ao Admin HQ</span>
            </Link>
          </div>
        </div>
      )}

      {/* Top Banner / Welcome (Estilo Asaas Light Fintech) */}
      <div className="bg-white border border-[#E2E8F0] p-6 rounded-2xl shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-[10px] font-bold border uppercase tracking-wider flex items-center gap-1.5 bg-[#EFF4FF] text-[#0050FF] border-[#BFDBFE]">
              <Sparkles className="w-3.5 h-3.5 text-[#0050FF]" />
              {isAdminInspection ? 'Visão Admin no Cliente' : 'Painel de Performance & Vendas'}
            </span>
            <span className="text-xs text-[#64748B] font-medium">| Período: {dateRange.label}</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-[#0F172A] tracking-tight">{clientName}</h2>
          <p className="text-xs text-[#64748B] max-w-xl leading-relaxed">
            Painel consolidado de {clientName} alimentado diretamente pelo banco de dados Cleide (Supabase). Dados refletidos da noite anterior.
          </p>
        </div>

        {/* Status de Sincronização em Horário de Brasília */}
        {syncStatus && (
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 bg-[#F8FAFC] border border-[#E2E8F0] p-3 rounded-xl text-xs">
            <Clock className="w-4 h-4 text-[#0050FF] shrink-0" />
            <div>
              <p className="text-[11px] font-bold text-[#0F172A]">Última sincronização geral:</p>
              <p className="text-[10px] text-[#64748B]">
                Meta: {formatSyncTime(syncStatus.meta?.ultima_rodada_em)} • Google: {formatSyncTime(syncStatus.google?.ultima_rodada_em)} • CRM: {formatSyncTime(syncStatus.kommo?.ultima_rodada_em)}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Alerta de Desatualização se alguma fonte tiver > 26h ou status parcial/erro */}
      {syncStatus && (
        <div className="space-y-2">
          {Object.values(syncStatus as Record<string, any>)
            .filter((s: any) => s.desatualizado && s.motivo_alerta)
            .map((s: any) => (
              <div
                key={s.fonte}
                className="p-3.5 rounded-xl text-xs font-semibold flex items-center justify-between border bg-amber-50 text-amber-800 border-amber-200"
              >
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>
                    Fonte <strong>{s.fonte.toUpperCase()}</strong>: {s.motivo_alerta}
                  </span>
                </div>
                <span className="text-[10px] text-amber-600 font-mono">
                  Última ok: {formatSyncTime(s.ultima_rodada_em)}
                </span>
              </div>
            ))}
        </div>
      )}

      {unavailable && (
        <div className="p-4 rounded-xl text-xs font-semibold flex items-start gap-2 border bg-amber-50 text-amber-800 border-amber-200">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <span>
            Investimento, leads e métricas indisponíveis: {unavailable}
          </span>
        </div>
      )}

      {/* Alerta em Vermelho para Contas Meta com Saldo ou Limite Crítico (< R$ 50) */}
      {criticalMetaAccounts.length > 0 && (
        <div className="p-3.5 rounded-xl text-xs font-semibold flex flex-col md:flex-row md:items-center justify-between gap-3 border bg-rose-50 text-rose-800 border-rose-300 shadow-2xs">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>
              <strong>Alerta Financeiro Meta Ads:</strong>{' '}
              {criticalMetaAccounts.length === 1
                ? `Conta "${criticalMetaAccounts[0].account_name}" com saldo disponível ou limite restante abaixo de R$ 50,00.`
                : `${criticalMetaAccounts.length} contas com saldo disponível ou limite restante abaixo de R$ 50,00.`}
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {criticalMetaAccounts.length === 1 ? (
              <a
                href={`https://adsmanager.facebook.com/ads/manager/billing/payment_settings?act=${String(criticalMetaAccounts[0].account_id || '').replace(/^act_/, '').trim()}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-bold shadow-xs transition-colors cursor-pointer"
                title={`Abrir página de faturamento da conta ${criticalMetaAccounts[0].account_name} diretamente na Meta`}
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Abastecer na Meta</span>
              </a>
            ) : (
              <Link
                href="/midia?plataforma=meta&tab=contas"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-bold shadow-xs transition-colors cursor-pointer"
              >
                <span>Ver Faturamento & Contas &rarr;</span>
              </Link>
            )}
            <Link
              href="/midia?plataforma=meta&tab=contas"
              className="text-[11px] font-bold text-rose-700 underline hover:text-rose-900"
            >
              Faturamento & Contas &rarr;
            </Link>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. RESUMO EXECUTIVO DO CLIENTE (DIAGNÓSTICO INTERPRETATIVO & FÁCIL DE ENTENDER) */}
      {/* ========================================================================= */}
      <div className="bg-white border border-[#E2E8F0] p-6 rounded-2xl shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#F1F5F9] pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#EFF4FF] border border-[#BFDBFE] text-[#0050FF] flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5 text-[#0050FF]" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#0F172A] flex items-center gap-2">
                Resumo Executivo da Operação
              </h3>
              <p className="text-xs text-[#64748B]">
                Diagnóstico de geração de demanda e eficiência comercial no período selecionado
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 w-fit">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Operação Ativa & Normalizada</span>
          </div>
        </div>

        {/* Parágrafo interpretativo e humano */}
        <div className="bg-[#F8FAFC] border border-[#E2E8F0] p-4 rounded-xl text-xs sm:text-sm text-[#334155] leading-relaxed">
          {loading ? (
            <div className="flex items-center gap-2 text-xs text-[#64748B]">
              <RefreshCw className="w-4 h-4 animate-spin text-[#0050FF]" />
              <span>Consolidando dados em tempo real...</span>
            </div>
          ) : unavailable ? (
            <p className="text-xs text-[#64748B] italic">
              Algumas métricas estão temporariamente indisponíveis no momento: {unavailable}.
            </p>
          ) : (
            <p>
              No período de <strong className="text-[#0F172A] font-bold">{dateRange.label}</strong>, a operação de{' '}
              <strong className="text-[#0050FF] font-bold">{clientName}</strong> investiu{' '}
              <strong className="text-[#0F172A] font-bold">{formatBRL(totalSpend)}</strong> em campanhas de mídia paga, gerando{' '}
              <strong className="text-emerald-700 font-bold">{totalOportunidades} novas oportunidades comerciais</strong>{' '}
              ({metaConversas} conversas diretas no WhatsApp e {metaCadastros + googleConversions} cadastros).{' '}
              Cada contato qualificado foi conquistado com um custo médio de{' '}
              <strong className="text-[#0F172A] font-bold">{formatBRL(custoPorOportunidade)}</strong>. No funil comercial (Kommo CRM),{' '}
              <strong className="text-[#0F172A] font-bold">{leadsGanhos} negócios</strong> foram marcados como ganhos.
            </p>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SEÇÃO: PERGUNTAR PARA IA (ANTHROPIC CLAUDE - RESTRITO AO CLIENTE) */}
      {/* ========================================================================= */}
      <div className="bg-white border border-[#E2E8F0] p-6 rounded-2xl shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#F1F5F9] pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-50 border border-purple-200 text-purple-600 flex items-center justify-center shrink-0">
              <Bot className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#0F172A] flex items-center gap-2">
                Perguntar para IA • Agente Especialista
              </h3>
              <p className="text-xs text-[#64748B]">
                Consultoria analítica em tempo real alimentada por IA e restrita aos dados de <strong className="text-[#0F172A]">{clientName}</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200 flex items-center gap-1.5 w-fit">
              <Sparkles className="w-3 h-3 text-purple-600" />
              <span>Anthropic Claude 3.5 Sonnet</span>
            </span>
            <span className="text-[10px] text-[#64748B] font-mono bg-[#F8FAFC] px-2 py-1 rounded-md border border-[#E2E8F0] hidden md:inline">
              Foco: {clientName}
            </span>
          </div>
        </div>

        {/* Sugestões Rápidas de Perguntas */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-bold text-[#64748B] mr-1">Sugestões rápidas:</span>
          {[
            '💡 Como foi a eficiência do investimento neste período?',
            '📊 Qual canal gerou mais oportunidades: Meta ou Google?',
            '💬 Como podemos baratear o custo por conversa no WhatsApp?',
            '🎯 Qual é o diagnóstico das etapas e perdas no funil do CRM?',
          ].map((sugestao, idx) => (
            <button
              key={idx}
              type="button"
              disabled={aiLoading}
              onClick={() => handleAskAI(sugestao)}
              className="text-[11px] bg-[#F8FAFC] hover:bg-[#EFF4FF] hover:text-[#0050FF] text-[#475569] border border-[#E2E8F0] hover:border-[#BFDBFE] px-3 py-1.5 rounded-full transition-all cursor-pointer font-medium text-left"
            >
              {sugestao}
            </button>
          ))}
        </div>

        {/* Formulário de Pergunta */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleAskAI();
          }}
          className="flex flex-col sm:flex-row items-stretch gap-2.5 pt-1"
        >
          <div className="relative flex-1">
            <input
              type="text"
              value={aiQuestion}
              onChange={(e) => setAiQuestion(e.target.value)}
              placeholder={`Pergunte algo sobre o tráfego, campanhas ou vendas de ${clientName}...`}
              disabled={aiLoading}
              className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl px-4 py-3 text-xs sm:text-sm text-[#0F172A] placeholder-[#94A3B8] focus:bg-white focus:border-[#0050FF] focus:outline-none transition-all pr-10 shadow-2xs"
            />
            {aiQuestion && !aiLoading && (
              <button
                type="button"
                onClick={() => setAiQuestion('')}
                className="absolute right-3 top-3 text-[#94A3B8] hover:text-[#0F172A] text-xs cursor-pointer"
                title="Limpar texto"
              >
                ✕
              </button>
            )}
          </div>

          <button
            type="submit"
            disabled={aiLoading || !aiQuestion.trim()}
            className="px-6 py-3 rounded-xl bg-[#0050FF] hover:bg-[#0040D6] disabled:bg-[#94A3B8] text-white text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer disabled:cursor-not-allowed shrink-0"
          >
            {aiLoading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Analisando Dados...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Perguntar para IA</span>
              </>
            )}
          </button>
        </form>

        {/* Mensagem de Erro com Ação se faltar a Chave */}
        {aiError && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{aiError}</span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Link
                href="/admin/ia"
                className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-bold shadow-xs transition-colors"
              >
                Configurar Token no Admin &rarr;
              </Link>
            </div>
          </div>
        )}

        {/* Resposta Gerada pela IA */}
        {aiResponse && (
          <div className="p-5 rounded-2xl bg-[#F8FAFC] border border-[#CBD5E1] space-y-3.5 shadow-2xs animate-in fade-in duration-300">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-2.5">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-purple-100 border border-purple-300 text-purple-700 flex items-center justify-center font-bold text-xs">
                  AI
                </span>
                <div>
                  <h4 className="text-xs font-bold text-[#0F172A]">Diagnóstico Especialista Swiftsail</h4>
                  <p className="text-[10px] text-[#64748B]">
                    Dados avaliados: {dateRange.label} • Escopo exclusivo: {clientName}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleCopyAiResponse}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-white hover:bg-[#EFF4FF] text-[#475569] hover:text-[#0050FF] border border-[#CBD5E1] hover:border-[#BFDBFE] flex items-center gap-1 transition-all cursor-pointer shadow-2xs"
                  title="Copiar texto da análise"
                >
                  {copiedResponse ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-600" />
                      <span className="text-emerald-600">Copiado!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copiar</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setAiResponse(null);
                    setAiQuestion('');
                  }}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-white hover:bg-rose-50 text-[#64748B] hover:text-rose-700 border border-[#CBD5E1] hover:border-rose-200 flex items-center gap-1 transition-all cursor-pointer shadow-2xs"
                  title="Fechar resposta"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Nova Pergunta</span>
                </button>
              </div>
            </div>

            {/* Texto Formatado */}
            <div className="text-xs sm:text-sm text-[#1E293B] leading-relaxed whitespace-pre-wrap font-sans space-y-2">
              {aiResponse}
            </div>

            <div className="pt-2 border-t border-[#E2E8F0] flex items-center justify-between text-[10px] text-[#64748B]">
              <span>Geração baseada em métricas reais do banco de dados Cleide.</span>
              <span className="italic">Respostas isoladas sem compartilhamento entre workspaces.</span>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 2. OS 4 PILARES ESTRATÉGICOS (MÉTRICAS MACRO NÃO REDUNDANTES) */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Pilar 1: Investimento Total Consolidado */}
        <div className="bg-white border border-[#E2E8F0] p-5 rounded-2xl shadow-xs space-y-3 hover:border-[#CBD5E1] transition-all">
          <div className="flex items-center justify-between text-[#64748B]">
            <span className="text-xs font-semibold uppercase tracking-wider">Investimento em Mídia</span>
            <div className="p-2 rounded-xl bg-[#EFF4FF] text-[#0050FF] border border-[#BFDBFE]">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className="text-2xl font-bold text-[#0F172A] tracking-tight">
              {loading ? <RefreshCw className="w-5 h-5 animate-spin text-[#0050FF] inline" /> : unavailable ? '—' : formatBRL(totalSpend)}
            </p>
            {/* Barra visual de proporção */}
            {totalSpend > 0 && (
              <div className="w-full bg-[#E2E8F0] h-1.5 rounded-full overflow-hidden flex mt-2">
                <div className="bg-[#0050FF] h-full" style={{ width: `${metaSpendPercent}%` }} title={`Meta: ${metaSpendPercent}%`} />
                <div className="bg-sky-500 h-full" style={{ width: `${googleSpendPercent}%` }} title={`Google: ${googleSpendPercent}%`} />
              </div>
            )}
          </div>
          <div className="text-[11px] text-[#64748B] flex items-center justify-between pt-2 border-t border-[#F1F5F9]">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[#0050FF]" /> Meta: {formatBRL(metaSpend)}
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-sky-500" /> Google: {formatBRL(googleSpend)}
            </span>
          </div>
        </div>

        {/* Pilar 2: Oportunidades Comerciais Totais */}
        <div className="bg-white border border-[#E2E8F0] p-5 rounded-2xl shadow-xs space-y-3 hover:border-[#CBD5E1] transition-all">
          <div className="flex items-center justify-between text-[#64748B]">
            <span className="text-xs font-semibold uppercase tracking-wider">Oportunidades Geradas</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className="text-2xl font-bold text-emerald-700 tracking-tight">
              {loading ? <RefreshCw className="w-5 h-5 animate-spin text-[#0050FF] inline" /> : unavailable ? '—' : totalOportunidades.toLocaleString('pt-BR')}
            </p>
            <p className="text-[11px] text-[#64748B] mt-1">Contatos comerciais iniciados</p>
          </div>
          <div className="text-[11px] text-[#64748B] flex items-center justify-between pt-2 border-t border-[#F1F5F9]">
            <span>{metaConversas} no WhatsApp</span>
            <span>{metaCadastros + googleConversions} cadastros</span>
          </div>
        </div>

        {/* Pilar 3: Custo por Oportunidade (CPA Geral) */}
        <div className="bg-white border border-[#E2E8F0] p-5 rounded-2xl shadow-xs space-y-3 hover:border-[#CBD5E1] transition-all">
          <div className="flex items-center justify-between text-[#64748B]">
            <span className="text-xs font-semibold uppercase tracking-wider">Custo Médio / Contato</span>
            <div className="p-2 rounded-xl bg-[#EFF4FF] text-[#0050FF] border border-[#BFDBFE]">
              <Target className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className="text-2xl font-bold text-[#0F172A] tracking-tight">
              {loading ? <RefreshCw className="w-5 h-5 animate-spin text-[#0050FF] inline" /> : unavailable ? '—' : formatBRL(custoPorOportunidade)}
            </p>
            <p className="text-[11px] text-[#64748B] mt-1">Eficiência de atração por lead</p>
          </div>
          <div className="text-[11px] text-[#64748B] flex items-center justify-between pt-2 border-t border-[#F1F5F9]">
            <span>Meta: {metaConversas > 0 ? formatBRL(custoPorConversaMeta) : '—'}/conv.</span>
            <span>Leads: {metaCadastros > 0 ? formatBRL(custoPorLeadMeta) : '—'}</span>
          </div>
        </div>

        {/* Pilar 4: Fechamentos & Funil CRM (Kommo) */}
        <div className="bg-white border border-[#E2E8F0] p-5 rounded-2xl shadow-xs space-y-3 hover:border-[#CBD5E1] transition-all">
          <div className="flex items-center justify-between text-[#64748B]">
            <span className="text-xs font-semibold uppercase tracking-wider">Conversão de Vendas</span>
            <div className="p-2 rounded-xl bg-purple-50 text-purple-600 border border-purple-200">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className="text-2xl font-bold text-[#0F172A] tracking-tight">
              {loading ? <RefreshCw className="w-5 h-5 animate-spin text-[#0050FF] inline" /> : `${leadsGanhos} ganhos`}
            </p>
            <p className="text-[11px] text-[#64748B] mt-1">
              Taxa de conversão: <strong className="text-emerald-700">{taxaConversaoCrm.toFixed(1)}%</strong>
            </p>
          </div>
          <div className="text-[11px] text-[#64748B] flex items-center justify-between pt-2 border-t border-[#F1F5F9]">
            <span className="text-blue-600 font-semibold">{leadsAbertos} em negociação</span>
            <span className="text-slate-500">{totalLeadsKommo} no funil</span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. COCKPIT 360° DE SAÚDE DOS CANAIS (SEM REPETIÇÃO DE DADOS TÉCNICOS) */}
      {/* ========================================================================= */}
      <div className="bg-white border border-[#E2E8F0] p-6 rounded-2xl shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#F1F5F9] pb-3">
          <div>
            <h3 className="text-sm font-bold text-[#0F172A] flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Saúde Operacional dos Canais Integrados
            </h3>
            <p className="text-xs text-[#64748B]">
              Status de conectividade, prontidão de atendimento e faturamento das ferramentas
            </p>
          </div>
          <span className="text-xs text-[#64748B] font-mono">
            {activeClientAdAccounts.length} contas conectadas
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {/* Canal 1: WhatsApp Uazapi */}
          <div className="p-4 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center shrink-0">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[#0F172A]">WhatsApp & Atendimento</h4>
                  <p className="text-[10px] text-[#64748B]">Uazapi API & Atendimento</p>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                Pronto
              </span>
            </div>
            <p className="text-xs text-[#475569]">
              Recepção imediata de conversas de anúncios e disparos automáticos operando.
            </p>
            <div className="pt-2 border-t border-[#E2E8F0] flex items-center justify-between">
              <Link
                href="/whatsapp"
                className="text-[11px] font-bold text-[#0050FF] hover:underline flex items-center gap-1"
              >
                <span>Acessar WhatsApp Hub</span>
                <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
          </div>

          {/* Canal 2: Meta Ads */}
          <div className="p-4 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#EFF4FF] border border-[#BFDBFE] text-[#0050FF] flex items-center justify-center shrink-0">
                  <Zap className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[#0F172A]">Meta Ads</h4>
                  <p className="text-[10px] text-[#64748B]">{metaAccounts.length} conta(s) sincronizada(s)</p>
                </div>
              </div>
              {criticalMetaAccounts.length > 0 ? (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                  Atenção Saldo
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Saudável
                </span>
              )}
            </div>
            <p className="text-xs text-[#475569]">
              {criticalMetaAccounts.length > 0
                ? 'Saldo ou limite crítico em conta. Abasteça para evitar interrupções.'
                : 'Campanhas rodando normalmente com orçamento e saldo disponíveis.'}
            </p>
            <div className="pt-2 border-t border-[#E2E8F0] flex items-center justify-between">
              <Link
                href="/midia?plataforma=meta&tab=campaigns"
                className="text-[11px] font-bold text-[#0050FF] hover:underline flex items-center gap-1"
              >
                <span>Ver campanhas Meta</span>
                <ChevronRight className="w-3 h-3" />
              </Link>
              <Link
                href="/midia?plataforma=meta&tab=contas"
                className="text-[10px] text-[#64748B] hover:text-[#0F172A]"
              >
                Faturamento & Contas &rarr;
              </Link>
            </div>
          </div>

          {/* Canal 3: Google Ads */}
          <div className="p-4 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-sky-50 border border-sky-200 text-sky-600 flex items-center justify-center shrink-0">
                  <Search className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[#0F172A]">Google Ads</h4>
                  <p className="text-[10px] text-[#64748B]">{googleAccounts.length} conta(s) sincronizada(s)</p>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                Ativo
              </span>
            </div>
            <p className="text-xs text-[#475569]">
              Campanhas de pesquisa e Performance Max ativas com ingestão sincronizada.
            </p>
            <div className="pt-2 border-t border-[#E2E8F0] flex items-center justify-between">
              <Link
                href="/midia?plataforma=google&tab=campaigns"
                className="text-[11px] font-bold text-[#0050FF] hover:underline flex items-center gap-1"
              >
                <span>Ver campanhas Google</span>
                <ChevronRight className="w-3 h-3" />
              </Link>
              <Link
                href="/midia?plataforma=google&tab=contas"
                className="text-[10px] text-[#64748B] hover:text-[#0F172A]"
              >
                Faturamento & Contas &rarr;
              </Link>
            </div>
          </div>

          {/* Canal 4: Kommo CRM */}
          <div className="p-4 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-purple-50 border border-purple-200 text-purple-600 flex items-center justify-center shrink-0">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[#0F172A]">Pipeline Kommo CRM</h4>
                  <p className="text-[10px] text-[#64748B]">{totalLeadsKommo} leads no funil</p>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                Sincronizado
              </span>
            </div>
            <p className="text-xs text-[#475569]">
              Atribuição por origem, campanha e vendedor rastreados de ponta a ponta.
            </p>
            <div className="pt-2 border-t border-[#E2E8F0] flex items-center justify-between">
              <Link
                href="/crm"
                className="text-[11px] font-bold text-[#0050FF] hover:underline flex items-center gap-1"
              >
                <span>Ver Pipeline & Atribuição</span>
                <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
          </div>

          {/* Canal 5: Financeiro Asaas */}
          <div className="p-4 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center shrink-0">
                  <CreditCard className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[#0F172A]">Financeiro Asaas</h4>
                  <p className="text-[10px] text-[#64748B]">{asaasData?.cobrancas?.length || 0} cobrança(s)</p>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                Regular
              </span>
            </div>
            <p className="text-xs text-[#475569]">
              Recebido líquido: <strong className="text-emerald-700">{formatBRL(asaasData?.totais?.recebido_liquido || 0)}</strong>.
            </p>
            <div className="pt-2 border-t border-[#E2E8F0] flex items-center justify-between">
              <Link
                href="/financeiro"
                className="text-[11px] font-bold text-[#0050FF] hover:underline flex items-center gap-1"
              >
                <span>Ver Cobranças & NFs</span>
                <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
          </div>

          {/* Canal 6: Design & Criativos */}
          <div className="p-4 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center shrink-0">
                  <Palette className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[#0F172A]">Design & Criativos</h4>
                  <p className="text-[10px] text-[#64748B]">Landing Pages & Criativos</p>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                Ativo
              </span>
            </div>
            <p className="text-xs text-[#475569]">
              Acervo de criativos e landing pages prontas para teste e escala.
            </p>
            <div className="pt-2 border-t border-[#E2E8F0] flex items-center justify-between">
              <Link
                href="/criativos"
                className="text-[11px] font-bold text-[#0050FF] hover:underline flex items-center gap-1"
              >
                <span>Ver Landing Pages & Criativos</span>
                <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. ATALHOS RÁPIDOS DE NAVEGAÇÃO NOS MÓDULOS DE {clientName} */}
      {/* ========================================================================= */}
      <div className="bg-white border border-[#E2E8F0] p-6 rounded-2xl shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-[#0F172A] flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-[#0050FF]" />
          Navegação Rápida nos Módulos de {clientName}
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <Link
            href="/midia"
            className="p-4 rounded-xl border border-[#E2E8F0] hover:border-[#0050FF] bg-[#F8FAFC] hover:bg-white transition-all group shadow-2xs"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-[#0F172A] group-hover:text-[#0050FF]">
                Tráfego & Anúncios
              </span>
              <ArrowRight className="w-3.5 h-3.5 text-[#64748B] group-hover:text-[#0050FF] group-hover:translate-x-1 transition-all" />
            </div>
            <p className="text-[11px] text-[#64748B]">
              Campanhas, criativos, palavras-chave e termos de busca detalhados.
            </p>
          </Link>

          <Link
            href="/crm"
            className="p-4 rounded-xl border border-[#E2E8F0] hover:border-[#0050FF] bg-[#F8FAFC] hover:bg-white transition-all group shadow-2xs"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-[#0F172A] group-hover:text-[#0050FF]">
                Pipeline CRM (Kommo)
              </span>
              <ArrowRight className="w-3.5 h-3.5 text-[#64748B] group-hover:text-[#0050FF] group-hover:translate-x-1 transition-all" />
            </div>
            <p className="text-[11px] text-[#64748B]">
              Funil de vendas, etapas e relatório de atribuição de mídia.
            </p>
          </Link>

          <Link
            href="/whatsapp"
            className="p-4 rounded-xl border border-[#E2E8F0] hover:border-[#0050FF] bg-[#F8FAFC] hover:bg-white transition-all group shadow-2xs"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-[#0F172A] group-hover:text-[#0050FF]">
                WhatsApp Uazapi
              </span>
              <ArrowRight className="w-3.5 h-3.5 text-[#64748B] group-hover:text-[#0050FF] group-hover:translate-x-1 transition-all" />
            </div>
            <p className="text-[11px] text-[#64748B]">
              Instâncias conectadas, QR Code e disparos de atendimento.
            </p>
          </Link>

          <Link
            href="/criativos"
            className="p-4 rounded-xl border border-[#E2E8F0] hover:border-[#0050FF] bg-[#F8FAFC] hover:bg-white transition-all group shadow-2xs"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-[#0F172A] group-hover:text-[#0050FF]">
                Design & Criativos
              </span>
              <ArrowRight className="w-3.5 h-3.5 text-[#64748B] group-hover:text-[#0050FF] group-hover:translate-x-1 transition-all" />
            </div>
            <p className="text-[11px] text-[#64748B]">
              Landing pages hospedadas e peças criativas de alta conversão.
            </p>
          </Link>

          <Link
            href="/financeiro"
            className="p-4 rounded-xl border border-[#E2E8F0] hover:border-[#0050FF] bg-[#F8FAFC] hover:bg-white transition-all group shadow-2xs"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-[#0F172A] group-hover:text-[#0050FF]">
                Financeiro Asaas
              </span>
              <ArrowRight className="w-3.5 h-3.5 text-[#64748B] group-hover:text-[#0050FF] group-hover:translate-x-1 transition-all" />
            </div>
            <p className="text-[11px] text-[#64748B]">
              Consulta de cobranças, vencimentos e notas fiscais emitidas.
            </p>
          </Link>
        </div>
      </div>
    </div>
  );
}
