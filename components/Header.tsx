'use client';

import React, { useState } from 'react';
import { Calendar, RefreshCw, Crown, Building, ArrowLeftRight, Check } from 'lucide-react';
import { useTenant } from './TenantProvider';

export default function Header() {
  const {
    dateRange,
    setDateRange,
    activeClient,
    selectedClientId,
    viewMode,
    setViewMode,
    switchToAdminHQ,
  } = useTenant();

  const [showCustomModal, setShowCustomModal] = useState(false);
  const [customStart, setCustomStart] = useState(dateRange.start);
  const [customEnd, setCustomEnd] = useState(dateRange.end);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleApplyCustomDate = () => {
    setDateRange({
      start: customStart,
      end: customEnd,
      label: `Personalizado: ${customStart} até ${customEnd}`,
    });
    setShowCustomModal(false);
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
    }, 800);
  };

  return (
    <header className="h-16 border-b border-slate-800/80 bg-[#0B0F19]/80 backdrop-blur-xl px-6 flex items-center justify-between sticky top-0 z-30">
      {/* Active Mode Indicator / Breadcrumb */}
      <div className="flex items-center gap-3">
        {viewMode === 'admin' ? (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/30 text-amber-300">
            <Crown className="w-4 h-4 text-amber-400 animate-pulse" />
            <span className="text-xs font-black uppercase tracking-wider">
              👑 Modo Master Admin — Swiftsail HQ (Visão Geral)
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500/15 via-blue-500/10 to-transparent border border-cyan-500/30 text-cyan-300">
              <Building className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-bold">
                Workspace: {activeClient?.nome || selectedClientId}
              </span>
            </div>

            <button
              onClick={switchToAdminHQ}
              className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 text-[11px] font-semibold text-slate-300 hover:text-amber-300 hover:border-amber-500/40 transition-all flex items-center gap-1.5"
              title="Retornar para o painel de governança da agência"
            >
              <Crown className="w-3 h-3 text-amber-400" />
              <span>Voltar ao Admin</span>
            </button>
          </div>
        )}
      </div>

      {/* Date Range & Controls */}
      <div className="flex items-center gap-3">
        {/* Date Filter Quick Selector */}
        <div className="flex items-center bg-slate-900/90 border border-slate-800 rounded-xl p-1 text-xs">
          <button
            onClick={() =>
              setDateRange({
                start: '2026-10-02',
                end: '2026-10-02',
                label: 'Hoje',
              })
            }
            className={`px-3 py-1 rounded-lg font-medium transition-all ${
              dateRange.label === 'Hoje'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Hoje
          </button>
          <button
            onClick={() =>
              setDateRange({
                start: '2026-09-25',
                end: '2026-10-02',
                label: 'Últimos 7 Dias',
              })
            }
            className={`px-3 py-1 rounded-lg font-medium transition-all ${
              dateRange.label === 'Últimos 7 Dias'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            7D
          </button>
          <button
            onClick={() =>
              setDateRange({
                start: '2026-09-01',
                end: '2026-10-02',
                label: 'Últimos 30 Dias',
              })
            }
            className={`px-3 py-1 rounded-lg font-medium transition-all ${
              dateRange.label === 'Últimos 30 Dias'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            30D
          </button>
          <button
            onClick={() => setShowCustomModal(true)}
            className={`px-3 py-1 rounded-lg font-medium flex items-center gap-1.5 transition-all ${
              dateRange.label.startsWith('Personalizado')
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>{dateRange.label.startsWith('Personalizado') ? 'Custom' : 'Personalizar'}</span>
          </button>
        </div>

        {/* Sync / Refresh Button */}
        <button
          onClick={handleRefresh}
          className="p-2 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-400 hover:text-cyan-400 hover:border-cyan-500/40 transition-all"
          title="Sincronizar dados com Supabase"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-cyan-400' : ''}`} />
        </button>

        {/* User Pill */}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500/20 via-cyan-500/20 to-blue-500/20 border border-amber-500/30 flex items-center justify-center text-amber-300 font-bold text-xs">
            RF
          </div>
          <div className="hidden lg:block text-left">
            <p className="text-xs font-semibold text-slate-200 leading-tight">Rodrigo Ferrari</p>
            <p className="text-[10px] text-amber-400 font-mono font-semibold">Master Admin</p>
          </div>
        </div>
      </div>

      {/* Custom Date Modal */}
      {showCustomModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0f172a] border border-slate-700/80 rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-cyan-400" />
                Definir Período Personalizado
              </h3>
              <button
                onClick={() => setShowCustomModal(false)}
                className="text-slate-400 hover:text-slate-200 text-sm"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">De (Data Início)</label>
                <input
                  type="date"
                  value={customStart}
                  onChange={(e) => setCustomStart(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Até (Data Fim)</label>
                <input
                  type="date"
                  value={customEnd}
                  onChange={(e) => setCustomEnd(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => setShowCustomModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleApplyCustomDate}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/20 hover:opacity-95 transition-opacity"
              >
                Aplicar Filtro
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

