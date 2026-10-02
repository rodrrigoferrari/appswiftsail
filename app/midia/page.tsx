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
} from 'lucide-react';
import Link from 'next/link';

export default function MidiaPage() {
  const { selectedClientId, activeClient, activeClientAdAccounts } = useTenant();
  const [activeTab, setActiveTab] = useState<'meta' | 'google'>('meta');

  // Filter accounts by tab platform
  const metaAccounts = activeClientAdAccounts.filter((a) => a.plataforma === 'meta');
  const googleAccounts = activeClientAdAccounts.filter((a) => a.plataforma === 'google');

  const clientName = activeClient?.nome || (selectedClientId === 'ALL' ? 'Todos os Clientes' : selectedClientId);

  return (
    <div className="space-y-6">
      {/* Client Header Bar */}
      <div className="glass-card p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 border-cyan-500/30">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Building className="w-4 h-4 text-cyan-400" />
            <h2 className="text-lg font-bold text-white">{clientName}</h2>
            {activeClient?.status && (
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase">
                {activeClient.status}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 flex items-center gap-2">
            <span>Contas mapeadas no Supabase:</span>
            <b className="text-cyan-300">{metaAccounts.length} Meta Ads</b>
            <span>•</span>
            <b className="text-cyan-300">{googleAccounts.length} Google Ads</b>
          </p>
        </div>

        {/* Platform Tabs */}
        <div className="flex bg-slate-900/90 border border-slate-800 rounded-xl p-1 text-xs">
          <button
            onClick={() => setActiveTab('meta')}
            className={`px-4 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-2 ${
              activeTab === 'meta'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-blue-400"></span>
            Meta Ads ({metaAccounts.length})
          </button>
          <button
            onClick={() => setActiveTab('google')}
            className={`px-4 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-2 ${
              activeTab === 'google'
                ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
            Google Ads ({googleAccounts.length})
          </button>
        </div>
      </div>

      {/* Meta Tab Content */}
      {activeTab === 'meta' ? (
        <div className="space-y-4">
          {metaAccounts.length === 0 ? (
            <div className="glass-card p-8 text-center space-y-3">
              <Megaphone className="w-8 h-8 text-slate-500 mx-auto" />
              <h3 className="text-sm font-bold text-white">Nenhuma conta Meta Ads vinculada a este cliente</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Cadastre a conta de anúncio no Supabase ou verifique o vínculo de WhatsApp/BM em Credenciais.
              </p>
            </div>
          ) : (
            metaAccounts.map((acc) => (
              <div key={acc.id} className="glass-card p-5 space-y-4 border border-slate-800">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        {acc.ativo ? 'CONTA ATIVA' : 'INATIVA'}
                      </span>
                      <span className="text-xs font-mono text-cyan-400 font-bold">{acc.account_id}</span>
                    </div>
                    <h3 className="text-sm font-bold text-white">{acc.account_name}</h3>
                  </div>

                  <div className="flex items-center gap-3">
                    <Link
                      href="/credenciais"
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors flex items-center gap-1.5"
                    >
                      <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                      Gerenciar Token Meta API
                    </Link>
                  </div>
                </div>

                {/* Sincronização State */}
                <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="space-y-0.5">
                    <p className="text-slate-300 font-medium flex items-center gap-2">
                      <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                      Conta mapeada no Supabase ({acc.account_name})
                    </p>
                    <p className="text-[11px] text-slate-500">
                      ID: {acc.account_id} • As campanhas e criativos serão sincronizados diretamente pela Graph API assim que o token for autenticado.
                    </p>
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
            <div className="glass-card p-8 text-center space-y-3">
              <Search className="w-8 h-8 text-slate-500 mx-auto" />
              <h3 className="text-sm font-bold text-white">Nenhuma conta Google Ads vinculada a este cliente</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Vincule o Customer ID na tabela `group_ad_accounts` no Supabase.
              </p>
            </div>
          ) : (
            googleAccounts.map((acc) => (
              <div key={acc.id} className="glass-card p-5 space-y-3 border border-slate-800">
                <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                        GOOGLE ADS
                      </span>
                      <span className="text-xs font-mono text-cyan-300 font-bold">{acc.account_id}</span>
                    </div>
                    <h3 className="text-sm font-bold text-white mt-1">{acc.account_name}</h3>
                  </div>
                </div>
                <p className="text-xs text-slate-400">
                  Conta vinculada à MCC <b className="text-white">262-638-1700</b>.
                </p>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
