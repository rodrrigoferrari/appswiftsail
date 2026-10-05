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
} from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
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

  const isAggregated = viewMode === 'admin' || selectedClientId === 'ALL';
  const clientName = isAggregated
    ? 'Painel Master — Swiftsail HQ'
    : (activeClient?.nome === 'EMOVERE' ? 'Emovere' : activeClient?.nome) || selectedClientId;

  // Real Dynamic Metrics State
  const [loading, setLoading] = useState(false);
  const [metaData, setMetaData] = useState<any>(null);
  const [googleData, setGoogleData] = useState<any>(null);
  const [kommoData, setKommoData] = useState<any>(null);

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

        if (dataMeta.success) setMetaData(dataMeta);
        if (dataGoogle.success) setGoogleData(dataGoogle);
        if (dataKommo.success) setKommoData(dataKommo);
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

  const metaLeads = Number(metaData?.totais?.leads || 0);
  const googleConversions = Number(googleData?.totais?.conversoes || 0);
  const kommoLeads = Number(kommoData?.total_leads || 0);
  const totalLeads = metaLeads + googleConversions + kommoLeads;

  const metaClicks = Number(metaData?.totais?.cliques || 0);
  const googleClicks = Number(googleData?.totais?.cliques || 0);
  const totalClicks = metaClicks + googleClicks;

  const metaImpressions = Number(metaData?.totais?.impressoes || 0);
  const googleImpressions = Number(googleData?.totais?.impressoes || 0);
  const totalImpressions = metaImpressions + googleImpressions;

  const cpaReal = totalLeads > 0 ? totalSpend / totalLeads : 0;
  const ctrReal = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;

  // Active accounts breakdown
  const metaAccounts = activeClientAdAccounts.filter((a) => a.plataforma === 'meta');
  const googleAccounts = activeClientAdAccounts.filter((a) => a.plataforma === 'google');

  // Format currency helpers
  const formatBRL = (val: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  return (
    <div className="space-y-6">
      {/* Top Banner / Welcome */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900/90 via-slate-900/60 to-cyan-950/30 border border-slate-800 p-6 rounded-2xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-full bg-radial from-cyan-500/10 via-transparent to-transparent pointer-events-none" />
        <div className="space-y-1.5 z-10">
          <div className="flex items-center gap-2">
            <span
              className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border flex items-center gap-1.5 ${
                isAggregated
                  ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                  : 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30'
              }`}
            >
              {isAggregated ? <Crown className="w-3.5 h-3.5 text-amber-400" /> : <Sparkles className="w-3.5 h-3.5 text-cyan-400" />}
              {isAggregated ? 'Governança & Gestão Global' : 'Inteligência de Tráfego & IA'}
            </span>
            <span className="text-xs text-slate-400 font-mono">| Período: {dateRange.label}</span>
          </div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight">{clientName}</h2>
          <p className="text-xs text-slate-400 max-w-xl">
            {isAggregated
              ? 'Consolidado global da carteira ativa. Gestão unificada de contas Meta Ads, Google Ads, CRM e CS.'
              : `Visão operacional em tempo real de ${clientName}. Contas conectadas, saúde de atendimento e ingestão Sinapse.`}
          </p>
        </div>

        <div className="flex items-center gap-3 z-10">
          {isAggregated ? (
            <div className="flex items-center gap-2">
              <Link
                href="/admin/usuarios"
                className="px-3.5 py-2 rounded-xl text-xs font-bold bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border border-cyan-500/30 flex items-center gap-1.5 transition-all"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Convidar Usuário</span>
              </Link>
              <Link
                href="/admin/clientes"
                className="px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white border border-slate-700 flex items-center gap-1.5 transition-all"
              >
                <Building className="w-3.5 h-3.5" />
                <span>Ver Carteira</span>
              </Link>
            </div>
          ) : (
            <div className="bg-slate-950/90 border border-slate-800 p-3.5 rounded-xl text-right max-w-md">
              <div className="flex items-center justify-between gap-4 mb-1">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                  Saúde CS (Agente @CS)
                </span>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-black uppercase border ${
                    activeClientCsStatus?.nivel === 'saudavel'
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                      : activeClientCsStatus?.nivel === 'atencao'
                      ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                      : activeClientCsStatus?.nivel === 'em_risco'
                      ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                      : 'bg-slate-800 text-slate-400 border-slate-700'
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
              <p className="text-[11px] text-slate-300 leading-snug line-clamp-2 text-left">
                {activeClientCsStatus?.sinais?.nota || 'Diagnóstico operacional normalizado sem alertas abertos.'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* KPI Metric Cards — 100% Dynamic Real Data */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Investimento Real */}
        <div className="glass-card p-5 glass-card-hover relative space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Investimento em Anúncios</span>
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-white">
            {loading ? <RefreshCw className="w-5 h-5 animate-spin text-cyan-400 inline" /> : formatBRL(totalSpend)}
          </p>
          <div className="text-[11px] text-slate-400 flex items-center justify-between pt-1 border-t border-slate-800/80">
            <span>Meta: {formatBRL(metaSpend)}</span>
            <span>Google: {formatBRL(googleSpend)}</span>
          </div>
        </div>

        {/* Leads & Conversões Reais */}
        <div className="glass-card p-5 glass-card-hover relative space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Leads & Conversões</span>
            <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-white">
            {loading ? <RefreshCw className="w-5 h-5 animate-spin text-cyan-400 inline" /> : totalLeads.toLocaleString('pt-BR')}
          </p>
          <div className="text-[11px] text-slate-400 flex items-center justify-between pt-1 border-t border-slate-800/80">
            <span>Meta: {metaLeads} leads</span>
            <span>Google: {googleConversions} conv</span>
          </div>
        </div>

        {/* CPA Real */}
        <div className="glass-card p-5 glass-card-hover relative space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">CPA Médio</span>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Target className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-white">
            {totalLeads > 0 ? formatBRL(cpaReal) : 'R$ 0,00'}
          </p>
          <div className="text-[11px] text-slate-400 pt-1 border-t border-slate-800/80">
            <span>Custo por lead/conversa gerada</span>
          </div>
        </div>

        {/* Contas Ativas em Operação */}
        <div className="glass-card p-5 glass-card-hover relative space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Contas Conectadas</span>
            <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-white">
            {activeClientAdAccounts.length} <span className="text-xs font-normal text-slate-400">contas</span>
          </p>
          <div className="text-[11px] text-slate-400 flex items-center justify-between pt-1 border-t border-slate-800/80">
            <span className="text-blue-400 font-bold">{metaAccounts.length} Meta</span>
            <span className="text-cyan-400 font-bold">{googleAccounts.length} Google</span>
          </div>
        </div>
      </div>

      {/* ADMIN EXCLUSIVE SECTION: Multi-tenant Clients Quick Matrix */}
      {isAggregated && (
        <div className="glass-card p-6 space-y-4 border-cyan-500/20">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Building className="w-4 h-4 text-cyan-400" />
                Carteira de Clientes Ativos ({clients.filter((c) => c.status === 'ativo').length})
              </h3>
              <p className="text-xs text-slate-400">
                Selecione qualquer cliente para entrar diretamente no seu workspace individual
              </p>
            </div>

            <Link
              href="/admin/clientes"
              className="text-xs font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
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
                  className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-cyan-500/40 hover:bg-slate-900/90 cursor-pointer transition-all group flex items-center justify-between"
                >
                  <div className="space-y-1 min-w-0 pr-2">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                      <h4 className="font-bold text-white text-xs truncate group-hover:text-cyan-300 transition-colors">
                        {client.nome === 'EMOVERE' ? 'Emovere' : client.nome}
                      </h4>
                    </div>
                    <p className="text-[11px] text-slate-400 font-mono truncate">
                      {client.grupo_whatsapp_id ? '📱 WhatsApp Vinculado' : 'Sem grupo'} • {clientUsersCount} usuários
                    </p>
                  </div>

                  <div className="p-2 rounded-lg bg-slate-800 text-slate-400 group-hover:text-cyan-400 group-hover:bg-cyan-500/10 transition-colors">
                    <ExternalLink className="w-3.5 h-3.5" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* CLIENT SPECIFIC: Connected Accounts & Real Assets Matrix */}
      {!isAggregated && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Ad Accounts List */}
          <div className="lg:col-span-2 glass-card p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Zap className="w-4 h-4 text-cyan-400" />
                  Contas de Tráfego Conectadas ({activeClientAdAccounts.length})
                </h3>
                <p className="text-xs text-slate-400">Ativos cadastrados no BM Parceiro e Google MCC</p>
              </div>
              <Link
                href="/midia"
                className="text-xs font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
              >
                <span>Ver Mídia</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {activeClientAdAccounts.length === 0 ? (
              <div className="p-8 text-center space-y-2 border border-dashed border-slate-800 rounded-xl">
                <AlertTriangle className="w-8 h-8 text-amber-400 mx-auto" />
                <p className="text-xs font-bold text-white">Nenhuma conta vinculada a este cliente</p>
                <p className="text-[11px] text-slate-400">
                  Cadastre o grupo de WhatsApp ou vincule o account_id em <code>group_ad_accounts</code>.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {activeClientAdAccounts.map((acc) => (
                  <div
                    key={acc.id}
                    className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 flex items-start justify-between gap-3"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-1.5 py-0.2 rounded text-[9px] font-bold uppercase ${
                            acc.plataforma === 'meta'
                              ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                              : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                          }`}
                        >
                          {acc.plataforma}
                        </span>
                        <span className="text-[10px] text-emerald-400 font-bold">🟢 ATIVA</span>
                      </div>
                      <h4 className="text-xs font-bold text-white truncate">{acc.account_name}</h4>
                      <p className="text-[10px] font-mono text-slate-400 truncate">{acc.account_id}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Operational Health & Communication */}
          <div className="glass-card p-6 space-y-4">
            <div className="border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                Saúde & Comunicação
              </h3>
              <p className="text-xs text-slate-400">Status dos canais e integrações</p>
            </div>

            <div className="space-y-3 pt-1 text-xs">
              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <MessageSquare className="w-4 h-4 text-emerald-400" />
                  <div>
                    <p className="font-bold text-white">Grupo WhatsApp</p>
                    <p className="text-[10px] font-mono text-slate-400 truncate max-w-[140px]">
                      {activeClient?.grupo_whatsapp_id || 'Sem grupo'}
                    </p>
                  </div>
                </div>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  activeClient?.grupo_whatsapp_id ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-800 text-slate-400'
                }`}>
                  {activeClient?.grupo_whatsapp_id ? 'Conectado' : 'Pendente'}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Zap className="w-4 h-4 text-blue-400" />
                  <div>
                    <p className="font-bold text-white">Meta Graph API</p>
                    <p className="text-[10px] text-slate-400">BM 791208745012339</p>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400">
                  {metaAccounts.length > 0 ? 'Conectado' : 'Sem contas'}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Search className="w-4 h-4 text-cyan-400" />
                  <div>
                    <p className="font-bold text-white">Google Ads API</p>
                    <p className="text-[10px] text-slate-400">MCC 262-638-1700</p>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400">
                  {googleAccounts.length > 0 ? 'Conectado' : 'Sem contas'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
