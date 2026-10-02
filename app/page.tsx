'use client';

import React from 'react';
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
    csStatusList,
    users,
  } = useTenant();

  const isAggregated = viewMode === 'admin' || selectedClientId === 'ALL';
  const clientTitle = isAggregated
    ? 'Painel Master — Swiftsail HQ'
    : activeClient?.nome || selectedClientId;

  // Mock computed data dynamically responding to selected tenant
  const investment = isAggregated ? 'R$ 148.520,00' : 'R$ 18.450,00';
  const leads = isAggregated ? '2.840' : '312';
  const cpa = isAggregated ? 'R$ 52,29' : 'R$ 59,13';
  const roas = isAggregated ? '4.8x' : '5.2x';
  const revenue = isAggregated ? 'R$ 712.896,00' : 'R$ 95.940,00';

  return (
    <div className="space-y-6">
      {/* Top Banner / Welcome */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900/90 via-slate-900/60 to-cyan-950/30 border border-slate-800 p-6 rounded-2xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-full bg-radial from-cyan-500/10 via-transparent to-transparent pointer-events-none" />
        <div className="space-y-1 z-10">
          <div className="flex items-center gap-2">
            <span
              className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border flex items-center gap-1 ${
                isAggregated
                  ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                  : 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30'
              }`}
            >
              {isAggregated ? <Crown className="w-3 h-3 text-amber-400" /> : <Sparkles className="w-3 h-3 text-cyan-400" />}
              {isAggregated ? 'Governança & Gestão Global' : 'Inteligência de Tráfego & IA'}
            </span>
            <span className="text-xs text-slate-400 font-mono">| Período: {dateRange.label}</span>
          </div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight">{clientTitle}</h2>
          <p className="text-xs text-slate-400 max-w-xl">
            {isAggregated
              ? 'Consolidado global de faturamento, leads gerados por tráfego pago, automações de WhatsApp e saúde operacional da carteira de clientes.'
              : `Visão unificada de performance de anúncios, conversões de WhatsApp, pipeline de vendas e faturamento de ${activeClient?.nome || selectedClientId}.`}
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
                <span>Ver Clientes</span>
              </Link>
            </div>
          ) : (
            <div className="bg-slate-950/80 border border-slate-800 px-4 py-2.5 rounded-xl text-right max-w-sm">
              <p className="text-[10px] uppercase font-semibold tracking-wider text-slate-400">
                Saúde CS (Agente @CS)
              </p>
              <div className="flex items-center justify-end gap-1.5 mt-0.5">
                <span
                  className={`w-2 h-2 rounded-full ${
                    activeClientCsStatus?.nivel === 'saudavel'
                      ? 'bg-emerald-400 animate-pulse'
                      : activeClientCsStatus?.nivel === 'atencao'
                      ? 'bg-amber-400'
                      : 'bg-rose-400'
                  }`}
                />
                <p
                  className={`text-xs font-bold uppercase ${
                    activeClientCsStatus?.nivel === 'saudavel'
                      ? 'text-emerald-400'
                      : activeClientCsStatus?.nivel === 'atencao'
                      ? 'text-amber-400'
                      : 'text-rose-400'
                  }`}
                >
                  {activeClientCsStatus?.nivel || 'Saudável'}
                </p>
              </div>
              {activeClientCsStatus?.sinais?.nota && (
                <p className="text-[10px] text-slate-400 truncate mt-0.5 max-w-[220px]">
                  {String(activeClientCsStatus.sinais.nota)}
                </p>
              )}
            </div>
          )}
        </div>
      </div>


      {/* KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Investimento */}
        <div className="glass-card p-5 glass-card-hover relative">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Investimento</span>
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-white">{investment}</p>
          <div className="flex items-center gap-1 mt-2 text-[11px] text-emerald-400 font-medium">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>+12.4% vs mês anterior</span>
          </div>
        </div>

        {/* Leads Gerados */}
        <div className="glass-card p-5 glass-card-hover relative">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Leads WhatsApp</span>
            <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-white">{leads}</p>
          <div className="flex items-center gap-1 mt-2 text-[11px] text-emerald-400 font-medium">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>+18.7% de qualificação</span>
          </div>
        </div>

        {/* CPA Médio */}
        <div className="glass-card p-5 glass-card-hover relative">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">CPA Médio</span>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Target className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-white">{cpa}</p>
          <div className="flex items-center gap-1 mt-2 text-[11px] text-cyan-400 font-medium">
            <span>Dentro da meta de eficiência</span>
          </div>
        </div>

        {/* ROAS Estimado */}
        <div className="glass-card p-5 glass-card-hover relative">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">ROAS Blended</span>
            <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-white">{roas}</p>
          <div className="flex items-center gap-1 mt-2 text-[11px] text-purple-400 font-medium">
            <span>Meta x Google Atribuídos</span>
          </div>
        </div>

        {/* Faturamento */}
        <div className="glass-card p-5 glass-card-hover relative">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Faturamento CRM</span>
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-white">{revenue}</p>
          <div className="flex items-center gap-1 mt-2 text-[11px] text-emerald-400 font-medium">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>Fechamentos validados</span>
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
                Visão Rápida da Carteira de Clientes ({clients.length})
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
            {clients.slice(0, 6).map((client) => {
              const clientUsersCount = users.filter((u) => u.cliente_id === client.cliente_id).length;
              return (
                <div
                  key={client.cliente_id}
                  onClick={() => selectClientAndSwitchToWorkspace(client.cliente_id)}
                  className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-cyan-500/40 hover:bg-slate-900/90 cursor-pointer transition-all group flex items-center justify-between"
                >
                  <div className="space-y-1 min-w-0 pr-2">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-400" />
                      <h4 className="font-bold text-white text-xs truncate group-hover:text-cyan-300 transition-colors">
                        {client.nome}
                      </h4>
                    </div>
                    <p className="text-[11px] text-slate-400 font-mono truncate">
                      {client.grupo_whatsapp_id ? '📱 WhatsApp OK' : 'Sem grupo'} • {clientUsersCount} usuários
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

      {/* Funnel Attribution Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Funil Visual de Conversão */}
        <div className="lg:col-span-2 glass-card p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-cyan-400" />
                Funil de Atribuição & Eficiência Comercial
              </h3>
              <p className="text-xs text-slate-400">Jornada do anúncio até o fechamento no Kommo CRM</p>
            </div>
            <span className="text-xs font-mono text-cyan-400 bg-cyan-500/10 px-2.5 py-1 rounded-lg border border-cyan-500/20">
              Conversão Geral: 3.4%
            </span>
          </div>

          <div className="space-y-3 pt-2">
            {/* Step 1 */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-medium">
                <span className="text-slate-300">1. Impressões & Alcance (Meta + Google)</span>
                <span className="text-slate-400 font-mono">485.200 views (100%)</span>
              </div>
              <div className="w-full bg-slate-900 rounded-full h-3 overflow-hidden border border-slate-800">
                <div className="bg-gradient-to-r from-blue-500 to-cyan-400 h-full rounded-full w-full" />
              </div>
            </div>

            {/* Step 2 */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-medium">
                <span className="text-slate-300">2. Cliques no Link / Anúncio</span>
                <span className="text-slate-400 font-mono">14.556 cliques (3.0% CTR)</span>
              </div>
              <div className="w-full bg-slate-900 rounded-full h-3 overflow-hidden border border-slate-800">
                <div className="bg-gradient-to-r from-cyan-500 to-teal-400 h-full rounded-full w-[65%]" />
              </div>
            </div>

            {/* Step 3 */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-medium">
                <span className="text-slate-300">3. Conversas Iniciadas no WhatsApp</span>
                <span className="text-slate-400 font-mono">{leads} conversas (19.5% CR)</span>
              </div>
              <div className="w-full bg-slate-900 rounded-full h-3 overflow-hidden border border-slate-800">
                <div className="bg-gradient-to-r from-teal-500 to-emerald-400 h-full rounded-full w-[42%]" />
              </div>
            </div>

            {/* Step 4 */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-medium">
                <span className="text-slate-300">4. Leads Qualificados por SDR (Kommo)</span>
                <span className="text-slate-400 font-mono">420 qualificados (14.8%)</span>
              </div>
              <div className="w-full bg-slate-900 rounded-full h-3 overflow-hidden border border-slate-800">
                <div className="bg-gradient-to-r from-emerald-500 to-green-400 h-full rounded-full w-[24%]" />
              </div>
            </div>

            {/* Step 5 */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-medium">
                <span className="text-slate-300">5. Vendas Concluídas & Contrato Assinado</span>
                <span className="text-emerald-400 font-mono font-bold">28 contratos ({revenue})</span>
              </div>
              <div className="w-full bg-slate-900 rounded-full h-3 overflow-hidden border border-slate-800">
                <div className="bg-gradient-to-r from-emerald-400 to-lime-400 h-full rounded-full w-[12%]" />
              </div>
            </div>
          </div>
        </div>

        {/* Live Channel Split */}
        <div className="glass-card p-6 space-y-4">
          <div className="border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-blue-400" />
              Distribuição por Canal
            </h3>
            <p className="text-xs text-slate-400">Origem de tráfego e leads</p>
          </div>

          <div className="space-y-4 pt-2">
            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                <div>
                  <p className="text-xs font-bold text-slate-200">Meta Ads (Instagram & FB)</p>
                  <p className="text-[11px] text-slate-400">Reels & Carrosséis</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs font-bold text-white">68%</p>
                <p className="text-[10px] text-emerald-400 font-mono">1.931 leads</p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-cyan-400"></div>
                <div>
                  <p className="text-xs font-bold text-slate-200">Google Ads (Search & PMax)</p>
                  <p className="text-[11px] text-slate-400">Fundo de Funil & Palavras-chave</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs font-bold text-white">24%</p>
                <p className="text-[10px] text-cyan-400 font-mono">681 leads</p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-purple-400"></div>
                <div>
                  <p className="text-xs font-bold text-slate-200">Disparos WhatsApp (Uazapi)</p>
                  <p className="text-[11px] text-slate-400">Base Ativa & Listas</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs font-bold text-white">8%</p>
                <p className="text-[10px] text-purple-400 font-mono">228 leads</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

