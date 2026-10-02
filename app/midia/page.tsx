'use client';

import React, { useState } from 'react';
import { useTenant } from '@/components/TenantProvider';
import {
  Megaphone,
  Layers,
  Search,
  Building,
  CheckCircle2,
  AlertCircle,
  Radio,
  ExternalLink,
  ShieldCheck,
  Zap,
  TrendingUp,
  DollarSign,
  Users,
  Target,
  Clock,
  RefreshCw,
  MessageSquare,
} from 'lucide-react';
import Link from 'next/link';

export default function MidiaPage() {
  const { selectedClientId, activeClient, activeClientAdAccounts, dateRange } = useTenant();
  const [activeTab, setActiveTab] = useState<'meta' | 'google'>('meta');

  // Filter accounts by tab platform
  const metaAccounts = activeClientAdAccounts.filter((a) => a.plataforma === 'meta');
  const googleAccounts = activeClientAdAccounts.filter((a) => a.plataforma === 'google');

  const clientName = activeClient?.nome || (selectedClientId === 'ALL' ? 'Todos os Clientes' : selectedClientId);

  return (
    <div className="space-y-6">
      {/* Client Header Bar */}
      <div className="glass-card p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 border-cyan-500/30 bg-gradient-to-r from-slate-900/90 via-slate-900/60 to-cyan-950/20">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 uppercase tracking-wider">
              Tráfego Pago & Performance de Mídia
            </span>
            <span className="text-xs text-slate-400 font-mono">| {dateRange.label}</span>
          </div>
          <div className="flex items-center gap-2">
            <Building className="w-5 h-5 text-cyan-400" />
            <h2 className="text-xl font-black text-white">{clientName}</h2>
            {activeClient?.status && (
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase">
                {activeClient.status}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 flex items-center gap-2">
            <span>Contas de anúncio mapeadas no Supabase:</span>
            <b className="text-blue-300">{metaAccounts.length} Meta Ads</b>
            <span>•</span>
            <b className="text-cyan-300">{googleAccounts.length} Google Ads</b>
          </p>
        </div>

        {/* Platform Tabs */}
        <div className="flex bg-slate-900/90 border border-slate-800 rounded-xl p-1 text-xs">
          <button
            onClick={() => setActiveTab('meta')}
            className={`px-4 py-2 rounded-lg font-bold transition-all flex items-center gap-2 ${
              activeTab === 'meta'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            Meta Ads ({metaAccounts.length})
          </button>
          <button
            onClick={() => setActiveTab('google')}
            className={`px-4 py-2 rounded-lg font-bold transition-all flex items-center gap-2 ${
              activeTab === 'google'
                ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            Google Ads ({googleAccounts.length})
          </button>
        </div>
      </div>

      {/* Sync Status Alert Banner */}
      <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          <Clock className="w-4 h-4 text-cyan-400 shrink-0" />
          <div>
            <p className="font-bold text-slate-200">
              Rotina Noturna de Sincronização Cleide (pg_cron & Edge Functions)
            </p>
            <p className="text-[11px] text-slate-400">
              A extração automática roda diariamente às <b>23:25 (Meta)</b> e <b>23:35 (Google)</b> consolidando gastos, impressões e conversões.
            </p>
          </div>
        </div>
        <Link
          href="/credenciais/admin"
          className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 font-semibold text-[11px] border border-cyan-500/20 flex items-center gap-1.5 whitespace-nowrap self-start sm:self-auto"
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Credenciais BM / MCC</span>
        </Link>
      </div>

      {/* Meta Tab Content */}
      {activeTab === 'meta' ? (
        <div className="space-y-4">
          {metaAccounts.length === 0 ? (
            <div className="glass-card p-10 text-center space-y-3 border-slate-800">
              <Megaphone className="w-10 h-10 text-slate-600 mx-auto" />
              <h3 className="text-sm font-bold text-white">Nenhuma conta Meta Ads vinculada a este cliente</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                As contas são atribuídas automaticamente através da tabela <code>group_ad_accounts</code> e do grupo de WhatsApp do cliente no Supabase.
              </p>
            </div>
          ) : (
            metaAccounts.map((acc) => (
              <div key={acc.id} className="glass-card p-5 space-y-4 border border-slate-800 hover:border-blue-500/30 transition-all">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                          acc.ativo
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : 'bg-slate-800 text-slate-400 border-slate-700'
                        }`}
                      >
                        {acc.ativo ? '🟢 CONTA ATIVA' : '⚪ INATIVA'}
                      </span>
                      <span className="text-xs font-mono text-cyan-400 font-bold">{acc.account_id}</span>
                      <span className="text-[10px] text-slate-500 font-mono">BM Parceiro: 791208745012339</span>
                    </div>
                    <h3 className="text-base font-bold text-white">{acc.account_name}</h3>
                  </div>

                  <div className="flex items-center gap-2">
                    {acc.group_jid && (
                      <span className="px-2.5 py-1 rounded-lg bg-slate-900 text-[11px] font-mono text-slate-400 border border-slate-800 flex items-center gap-1.5">
                        <MessageSquare className="w-3 h-3 text-emerald-400" />
                        <span className="truncate max-w-[150px]">{acc.group_jid}</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Account Details & Tracking state */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Plataforma</span>
                    <p className="font-bold text-blue-400 mt-0.5">Meta Graph API</p>
                  </div>

                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80">
                    <span className="text-[10px] uppercase font-bold text-slate-400">ID da Conta</span>
                    <p className="font-mono text-slate-200 mt-0.5 truncate">{acc.account_id}</p>
                  </div>

                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Atribuição</span>
                    <p className="font-bold text-emerald-400 mt-0.5">WhatsApp / Leads</p>
                  </div>

                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Status Sync</span>
                    <p className="font-bold text-cyan-300 mt-0.5">Sincronizado</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        /* Google Tab Content */
        <div className="space-y-4">
          {googleAccounts.length === 0 ? (
            <div className="glass-card p-10 text-center space-y-3 border-slate-800">
              <Search className="w-10 h-10 text-slate-600 mx-auto" />
              <h3 className="text-sm font-bold text-white">Nenhuma conta Google Ads vinculada a este cliente</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                Vincule o Customer ID na tabela <code>group_ad_accounts</code> sob a conta gerenciadora MCC <b>262-638-1700</b>.
              </p>
            </div>
          ) : (
            googleAccounts.map((acc) => (
              <div key={acc.id} className="glass-card p-5 space-y-4 border border-slate-800 hover:border-cyan-500/30 transition-all">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                          acc.ativo
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : 'bg-slate-800 text-slate-400 border-slate-700'
                        }`}
                      >
                        {acc.ativo ? '🟢 CONTA ATIVA' : '⚪ INATIVA'}
                      </span>
                      <span className="text-xs font-mono text-cyan-300 font-bold">CID: {acc.account_id}</span>
                      <span className="text-[10px] text-slate-500 font-mono">MCC: 262-638-1700</span>
                    </div>
                    <h3 className="text-base font-bold text-white">{acc.account_name}</h3>
                  </div>

                  <div className="flex items-center gap-2">
                    {acc.group_jid && (
                      <span className="px-2.5 py-1 rounded-lg bg-slate-900 text-[11px] font-mono text-slate-400 border border-slate-800 flex items-center gap-1.5">
                        <MessageSquare className="w-3 h-3 text-emerald-400" />
                        <span className="truncate max-w-[150px]">{acc.group_jid}</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Account Details */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Plataforma</span>
                    <p className="font-bold text-cyan-400 mt-0.5">Google Ads API</p>
                  </div>

                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Customer ID</span>
                    <p className="font-mono text-slate-200 mt-0.5 truncate">{acc.account_id}</p>
                  </div>

                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Tipo de Campanha</span>
                    <p className="font-bold text-slate-300 mt-0.5">Search & PMax</p>
                  </div>

                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Status Sync</span>
                    <p className="font-bold text-cyan-300 mt-0.5">Sincronizado</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

