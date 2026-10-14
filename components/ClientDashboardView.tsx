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

  // Kommo CRM Funnel
  const totalLeadsKommo = Number(kommoData?.total_leads || 0);
  const leadsAbertos = Number(kommoData?.resumo_status?.aberta?.total || 0);
  const leadsGanhos = Number(kommoData?.resumo_status?.ganho?.total || 0);
  const leadsPerdidos = Number(kommoData?.resumo_status?.perda?.total || 0);

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
              <a
                href="#faturamento-meta-cliente"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-bold shadow-xs transition-colors cursor-pointer"
              >
                <span>Ver Contas Abaixo &darr;</span>
              </a>
            )}
            <Link
              href="/midia?plataforma=meta"
              className="text-[11px] font-bold text-rose-700 underline hover:text-rose-900"
            >
              Painel Completo &rarr;
            </Link>
          </div>
        </div>
      )}

      {/* Informações Financeiras e Faturamento das Contas Meta (public.painel_contas_ads) */}
      {metaContas.length > 0 && (
        <div id="faturamento-meta-cliente" className="bg-white border border-[#E2E8F0] p-4 rounded-2xl shadow-xs space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#F1F5F9] pb-2.5">
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-[#EFF4FF] border border-[#BFDBFE] text-[#0050FF] flex items-center justify-center shrink-0">
                <Wallet className="w-4 h-4 text-[#0050FF]" />
              </span>
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#0F172A] flex items-center gap-1.5">
                  Faturamento & Contas Meta Ads
                </h3>
                <p className="text-[11px] text-[#64748B]">
                  Saldo de contas pré-pagas, cartão e limite restante de gasto
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-[10px] text-[#64748B] font-medium bg-[#F8FAFC] px-2.5 py-1 rounded-full border border-[#E2E8F0] w-fit">
              <Clock className="w-3 h-3 text-[#0050FF]" />
              <span>Sync diário: Meta às 23:25 (BRT)</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {metaContas.map((c: any) => {
              const isPrePaga = c.tipo_pagamento === 'pre_paga';
              const isPosPaga = c.tipo_pagamento === 'pos_paga';
              const hasSaldo = c.saldo_disponivel !== null && c.saldo_disponivel !== undefined;
              const isSaldoBaixo = isPrePaga && hasSaldo && Number(c.saldo_disponivel) < 50;
              const hasLimite = c.limite_restante !== null && c.limite_restante !== undefined;
              const isLimiteBaixo = hasLimite && Number(c.limite_restante) < 50;
              const hasAlert = isSaldoBaixo || isLimiteBaixo;

              const cleanActId = String(c.account_id || '').replace(/^act_/, '').trim();
              const metaBillingUrl = cleanActId
                ? `https://adsmanager.facebook.com/ads/manager/billing/payment_settings?act=${cleanActId}`
                : 'https://adsmanager.facebook.com/ads/manager/billing/payment_settings';

              return (
                <div
                  key={c.account_id || c.id}
                  className={`p-3.5 rounded-xl border transition-all flex flex-col justify-between ${
                    hasAlert
                      ? 'bg-rose-50/70 border-rose-300 shadow-2xs'
                      : 'bg-[#F8FAFC] border-[#E2E8F0]'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-[#0F172A] truncate" title={c.nome || c.account_name}>
                          {c.nome || c.account_name}
                        </p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <p className="text-[10px] text-[#64748B] font-mono truncate">
                            ID: {c.account_id}
                          </p>
                          {cleanActId && (
                            <a
                              href={metaBillingUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[#64748B] hover:text-[#0050FF] transition-colors p-0.5 rounded hover:bg-white"
                              title="Abrir página de faturamento e abastecimento na Meta"
                            >
                              <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                          )}
                        </div>
                      </div>

                      {/* Badge Tipo Pagamento */}
                      {isPrePaga ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-50 text-sky-700 border border-sky-200 shrink-0">
                          Pré-Paga
                        </span>
                      ) : isPosPaga ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-violet-50 text-violet-700 border border-violet-200 shrink-0">
                          Pós-Paga
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600 shrink-0">
                          Meta Ads
                        </span>
                      )}
                    </div>

                    <div className="mt-2.5 pt-2 border-t border-[#E2E8F0]/70 space-y-1.5 text-xs">
                      {/* Conta Pré-Paga: Saldo Disponível */}
                      {isPrePaga && (
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] text-[#64748B]">Saldo Disponível:</span>
                          <span className={`font-mono font-bold ${isSaldoBaixo ? 'text-rose-700' : 'text-emerald-700'}`}>
                            {hasSaldo ? formatBRL(c.saldo_disponivel) : '—'}
                          </span>
                        </div>
                      )}

                      {/* Conta Pós-Paga: Cartão Final */}
                      {isPosPaga && (
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] text-[#64748B] flex items-center gap-1">
                            <CreditCard className="w-3 h-3 text-[#64748B]" /> Cartão:
                          </span>
                          <span className="font-mono font-bold text-[#0F172A]">
                            {formatCartao(c.cartao_final)}
                          </span>
                        </div>
                      )}

                      {/* Limite Restante */}
                      {hasLimite && (
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] text-[#64748B]">Limite Restante:</span>
                          <span className={`font-mono font-bold ${isLimiteBaixo ? 'text-rose-700' : 'text-[#0F172A]'}`}>
                            {formatBRL(c.limite_restante)}
                          </span>
                        </div>
                      )}

                      {!isPrePaga && !isPosPaga && !hasLimite && (
                        <p className="text-[10px] text-[#94A3B8] italic">
                          Aguardando primeira sincronização de pagamento.
                        </p>
                      )}

                      {/* Alerta em Vermelho quando saldo < 50 ou limite < 50 */}
                      {isSaldoBaixo && (
                        <div className="mt-1.5 p-1.5 rounded-lg bg-rose-100 border border-rose-300 text-[10px] font-bold text-rose-800 flex items-center gap-1.5">
                          <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                          <span>Alerta: Saldo disponível crítico (&lt; R$ 50,00).</span>
                        </div>
                      )}

                      {isLimiteBaixo && !isSaldoBaixo && (
                        <div className="mt-1.5 p-1.5 rounded-lg bg-rose-100 border border-rose-300 text-[10px] font-bold text-rose-800 flex items-center gap-1.5">
                          <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                          <span>Alerta: Limite restante crítico (&lt; R$ 50,00).</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Botão de Acesso Direto ao Abastecimento / Faturamento na Meta */}
                  <div className="mt-3 pt-2 border-t border-[#E2E8F0]/80">
                    <a
                      href={metaBillingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`w-full inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        hasAlert
                          ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-xs'
                          : 'bg-white hover:bg-[#EFF4FF] text-[#0050FF] border border-[#BFDBFE] hover:border-[#0050FF] shadow-2xs'
                      }`}
                      title={`Abrir página de pagamento da conta ${c.account_id} na Meta`}
                    >
                      <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                      <span>
                        {hasAlert
                          ? (isPrePaga ? 'Abastecer Saldo na Meta' : 'Ajustar Limite na Meta')
                          : (isPrePaga ? 'Abastecer Conta na Meta' : 'Gerenciar Pagamento na Meta')}
                      </span>
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Informações Financeiras e Faturamento das Contas Google Ads (public.painel_contas_ads) */}
      {googleContas.length > 0 && (
        <div id="faturamento-google-cliente" className="bg-white border border-[#E2E8F0] p-4 rounded-2xl shadow-xs space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#F1F5F9] pb-2.5">
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-[#EFF4FF] border border-[#BFDBFE] text-[#0050FF] flex items-center justify-center shrink-0">
                <Wallet className="w-4 h-4 text-[#0050FF]" />
              </span>
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#0F172A] flex items-center gap-1.5">
                  Faturamento & Contas Google Ads
                </h3>
                <p className="text-[11px] text-[#64748B]">
                  Tipo de orçamento, saldo estimado, conta de pagamento e limite restante
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-[10px] text-[#64748B] font-medium bg-[#F8FAFC] px-2.5 py-1 rounded-full border border-[#E2E8F0] w-fit">
              <Clock className="w-3 h-3 text-[#0050FF]" />
              <span>Sync diário: Google às 23:35 (BRT)</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {googleContas.map((c: any) => {
              const isLimiteOrcamento = c.tipo_pagamento === 'limite_orcamento';
              const isAutomatico = c.tipo_pagamento === 'automatico';
              const hasSaldo = c.saldo_disponivel !== null && c.saldo_disponivel !== undefined;
              const isSaldoBaixo = isLimiteOrcamento && hasSaldo && Number(c.saldo_disponivel) < 50;
              const hasLimite = c.limite_restante !== null && c.limite_restante !== undefined;
              const isLimiteBaixo = hasLimite && Number(c.limite_restante) < 50;
              const hasAlert = isSaldoBaixo || isLimiteBaixo;

              const cleanCustomerId = String(c.account_id || '').replace(/[^0-9]/g, '').trim();
              const googleBillingUrl = cleanCustomerId
                ? `https://ads.google.com/aw/billing/summary?ocid=${cleanCustomerId}`
                : 'https://ads.google.com/aw/billing/summary';

              return (
                <div
                  key={c.account_id || c.id}
                  className={`p-3.5 rounded-xl border transition-all flex flex-col justify-between ${
                    hasAlert
                      ? 'bg-rose-50/70 border-rose-300 shadow-2xs'
                      : 'bg-[#F8FAFC] border-[#E2E8F0]'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-[#0F172A] truncate" title={c.nome || c.account_name}>
                          {c.nome || c.account_name}
                        </p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <p className="text-[10px] text-[#64748B] font-mono truncate">
                            ID: {c.account_id}
                          </p>
                          {cleanCustomerId && (
                            <a
                              href={googleBillingUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[#64748B] hover:text-[#0050FF] transition-colors p-0.5 rounded hover:bg-white"
                              title="Abrir página de faturamento no Google Ads"
                            >
                              <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                          )}
                        </div>
                      </div>

                      {/* Badge Tipo Pagamento */}
                      {isLimiteOrcamento ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 shrink-0">
                          Teto Orçamento
                        </span>
                      ) : isAutomatico ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                          Automático
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600 shrink-0">
                          Google Ads
                        </span>
                      )}
                    </div>

                    <div className="mt-2.5 pt-2 border-t border-[#E2E8F0]/70 space-y-1.5 text-xs">
                      {/* Saldo Estimado (só em limite_orcamento) */}
                      {isLimiteOrcamento && (
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] text-[#64748B]">Saldo Estimado:</span>
                          <span className={`font-mono font-bold ${isSaldoBaixo ? 'text-rose-700' : 'text-emerald-700'}`}>
                            {hasSaldo ? formatBRL(c.saldo_disponivel) : '—'}
                          </span>
                        </div>
                      )}

                      {/* Conta de Pagamento Google */}
                      {c.conta_pagamento && (
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] text-[#64748B]">Conta Pagamento:</span>
                          <span className="font-semibold text-[#0F172A] truncate max-w-[140px]" title={c.conta_pagamento}>
                            {c.conta_pagamento}
                          </span>
                        </div>
                      )}

                      {/* Limite Restante (Orçamento da conta) */}
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-[#64748B]">Limite Restante:</span>
                        <span className={`font-mono font-bold ${isLimiteBaixo ? 'text-rose-700' : 'text-[#0F172A]'}`}>
                          {hasLimite ? formatBRL(c.limite_restante) : '—'}
                        </span>
                      </div>

                      {!isLimiteOrcamento && !isAutomatico && !hasLimite && !c.conta_pagamento && (
                        <p className="text-[10px] text-[#94A3B8] italic">
                          Aguardando sincronização de faturamento (Google às 23:35 BRT).
                        </p>
                      )}

                      {/* Alerta em Vermelho quando saldo < 50 ou limite < 50 */}
                      {isSaldoBaixo && (
                        <div className="mt-1.5 p-1.5 rounded-lg bg-rose-100 border border-rose-300 text-[10px] font-bold text-rose-800 flex items-center gap-1.5">
                          <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                          <span>Alerta: Saldo estimado crítico (&lt; R$ 50,00).</span>
                        </div>
                      )}

                      {isLimiteBaixo && !isSaldoBaixo && (
                        <div className="mt-1.5 p-1.5 rounded-lg bg-rose-100 border border-rose-300 text-[10px] font-bold text-rose-800 flex items-center gap-1.5">
                          <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                          <span>Alerta: Limite restante crítico (&lt; R$ 50,00).</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Botão de Acesso Direto ao Faturamento no Google Ads */}
                  <div className="mt-3 pt-2 border-t border-[#E2E8F0]/80">
                    <a
                      href={googleBillingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`w-full inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        hasAlert
                          ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-xs'
                          : 'bg-white hover:bg-[#EFF4FF] text-[#0050FF] border border-[#BFDBFE] hover:border-[#0050FF] shadow-2xs'
                      }`}
                      title={`Abrir página de faturamento da conta ${c.account_id} no Google Ads`}
                    >
                      <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                      <span>Gerenciar Faturamento no Google Ads</span>
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* KPI Metric Cards — Contrato Estrito: Leads e Conversas Separados */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Investimento Total em Anúncios (BRL) */}
        <div className="bg-white border border-[#E2E8F0] p-5 rounded-2xl shadow-xs relative space-y-2 hover:border-[#CBD5E1] transition-all">
          <div className="flex items-center justify-between text-[#64748B]">
            <span className="text-xs font-semibold uppercase tracking-wider">Investimento em Ads</span>
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

        {/* 2. Conversas WhatsApp / Direct (Métrica Distinta) */}
        <div className="bg-white border border-[#E2E8F0] p-5 rounded-2xl shadow-xs relative space-y-2 hover:border-[#CBD5E1] transition-all">
          <div className="flex items-center justify-between text-[#64748B]">
            <span className="text-xs font-semibold uppercase tracking-wider">Conversas Iniciadas</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200">
              <MessageSquare className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-emerald-700 tracking-tight">
            {loading ? <RefreshCw className="w-5 h-5 animate-spin text-[#0050FF] inline" /> : unavailable ? '—' : metaConversas.toLocaleString('pt-BR')}
          </p>
          <div className="text-[11px] text-[#64748B] flex items-center justify-between pt-2 border-t border-[#F1F5F9]">
            <span>Custo por Conversa:</span>
            <strong className="text-[#0F172A]">{metaConversas > 0 ? formatBRL(custoPorConversaMeta) : '—'}</strong>
          </div>
        </div>

        {/* 3. Leads de Formulário / Cadastros (Métrica Distinta) */}
        <div className="bg-white border border-[#E2E8F0] p-5 rounded-2xl shadow-xs relative space-y-2 hover:border-[#CBD5E1] transition-all">
          <div className="flex items-center justify-between text-[#64748B]">
            <span className="text-xs font-semibold uppercase tracking-wider">Cadastros & Leads Ads</span>
            <div className="p-2 rounded-xl bg-[#EFF4FF] text-[#0050FF] border border-[#BFDBFE]">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-[#0F172A] tracking-tight">
            {loading ? <RefreshCw className="w-5 h-5 animate-spin text-[#0050FF] inline" /> : unavailable ? '—' : (metaCadastros + googleConversions).toLocaleString('pt-BR')}
          </p>
          <div className="text-[11px] text-[#64748B] flex items-center justify-between pt-2 border-t border-[#F1F5F9]">
            <span>Meta: {metaCadastros} leads</span>
            <span>Google: {googleConversions} conv.</span>
          </div>
        </div>

        {/* 4. Kommo CRM Leads no Período */}
        <div className="bg-white border border-[#E2E8F0] p-5 rounded-2xl shadow-xs relative space-y-2 hover:border-[#CBD5E1] transition-all">
          <div className="flex items-center justify-between text-[#64748B]">
            <span className="text-xs font-semibold uppercase tracking-wider">Funil Kommo CRM</span>
            <div className="p-2 rounded-xl bg-purple-50 text-purple-600 border border-purple-200">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-[#0F172A] tracking-tight">
            {loading ? <RefreshCw className="w-5 h-5 animate-spin text-[#0050FF] inline" /> : totalLeadsKommo.toLocaleString('pt-BR')}
          </p>
          <div className="text-[11px] text-[#64748B] flex items-center justify-between pt-2 border-t border-[#F1F5F9]">
            <span className="text-emerald-600 font-semibold">{leadsGanhos} ganhos</span>
            <span className="text-blue-600 font-semibold">{leadsAbertos} abertos</span>
            <span className="text-rose-600 font-semibold">{leadsPerdidos} perda</span>
          </div>
        </div>
      </div>

      {/* ASAAS FINTECH OVERVIEW (Dados Reais do Banco de Cobranças) */}
      <div className="bg-white border border-[#E2E8F0] p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-[#EFF4FF] border border-[#BFDBFE] text-[#0050FF] flex items-center justify-center shrink-0">
            <CreditCard className="w-5 h-5 text-[#0050FF]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#0050FF] bg-[#EFF4FF] px-2.5 py-0.5 rounded-full border border-[#BFDBFE]">
                Financeiro Asaas
              </span>
              <span className="text-xs text-[#64748B]">
                {asaasData?.cobrancas?.length || 0} cobranças refletidas no Supabase
              </span>
            </div>
            <h3 className="text-sm sm:text-base font-bold text-[#0F172A] mt-0.5">
              Recebido Líquido: <span className="text-emerald-600">{formatBRL(asaasData?.totais?.recebido_liquido || 0)}</span> | Aguardando: <span className="text-amber-600">{formatBRL(asaasData?.totais?.aguardando || 0)}</span>
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/financeiro"
            className="px-5 py-2.5 rounded-full text-xs font-semibold bg-[#0050FF] hover:bg-[#0040D6] text-white flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
          >
            <span>Ver Cobranças & NFs</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Atalhos Rápidos dos Módulos do Cliente */}
      <div className="bg-white border border-[#E2E8F0] p-6 rounded-2xl shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-[#0F172A] flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-[#0050FF]" />
          Navegação Rápida nos Módulos de {clientName}
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <Link
            href="/midia"
            className="p-4 rounded-xl border border-[#E2E8F0] hover:border-[#0050FF] bg-[#F8FAFC] hover:bg-white transition-all group shadow-2xs"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-[#0F172A] group-hover:text-[#0050FF]">
                Gestão de Mídia & Ads
              </span>
              <ArrowRight className="w-3.5 h-3.5 text-[#64748B] group-hover:text-[#0050FF] group-hover:translate-x-1 transition-all" />
            </div>
            <p className="text-[11px] text-[#64748B]">
              Campanhas, AdSets e criativos detalhados com filtro de período.
            </p>
          </Link>

          <Link
            href="/crm"
            className="p-4 rounded-xl border border-[#E2E8F0] hover:border-[#0050FF] bg-[#F8FAFC] hover:bg-white transition-all group shadow-2xs"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-[#0F172A] group-hover:text-[#0050FF]">
                Kommo CRM & Funis
              </span>
              <ArrowRight className="w-3.5 h-3.5 text-[#64748B] group-hover:text-[#0050FF] group-hover:translate-x-1 transition-all" />
            </div>
            <p className="text-[11px] text-[#64748B]">
              Pipeline completo por etapa, origem de anúncio e contatos.
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
