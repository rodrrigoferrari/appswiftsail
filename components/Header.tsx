'use client';

import React, { useState } from 'react';
import { Calendar, RefreshCw, Crown, Building, ArrowLeftRight, Check } from 'lucide-react';
import { useTenant } from './TenantProvider';
import { hojeBRT, diasAtrasBRT } from '@/lib/date';

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
    <header className="h-16 border-b border-[#E2E8F0] bg-white px-6 flex items-center justify-between sticky top-0 z-30 select-none">
      {/* Active Mode Indicator / Breadcrumb */}
      <div className="flex items-center gap-3">
        {viewMode === 'admin' ? (
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#EFF4FF] border border-[#BFDBFE] text-[#0050FF]">
            <Crown className="w-4 h-4 text-[#0050FF]" />
            <span className="text-xs font-bold uppercase tracking-wider">
              Modo Master Admin — Swiftsail HQ
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#F8FAFC] border border-[#E2E8F0] text-[#0F172A]">
              <Building className="w-4 h-4 text-[#0050FF]" />
              <span className="text-xs font-bold">
                Workspace: {activeClient?.nome || selectedClientId}
              </span>
            </div>

            <button
              onClick={switchToAdminHQ}
              className="px-2.5 py-1 rounded-lg bg-white border border-[#E2E8F0] text-[11px] font-semibold text-[#64748B] hover:text-[#0050FF] hover:border-[#BFDBFE] transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
              title="Retornar para o painel de governança da agência"
            >
              <Crown className="w-3 h-3 text-[#0050FF]" />
              <span>Voltar ao Admin</span>
            </button>
          </div>
        )}
      </div>

      {/* Date Range & Controls */}
      <div className="flex items-center gap-3">
        {/* Date Filter Quick Selector */}
        <div className="flex items-center bg-[#F1F5F9] border border-[#E2E8F0] rounded-xl p-1 text-xs">
          <button
            onClick={() =>
              setDateRange({
                start: hojeBRT(),
                end: hojeBRT(),
                label: 'Hoje',
              })
            }
            className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
              dateRange.label === 'Hoje'
                ? 'bg-white text-[#0050FF] shadow-xs border border-[#E2E8F0]'
                : 'text-[#64748B] hover:text-[#0F172A]'
            }`}
          >
            Hoje
          </button>
          <button
            onClick={() =>
              setDateRange({
                start: diasAtrasBRT(6),
                end: hojeBRT(),
                label: 'Últimos 7 Dias',
              })
            }
            className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
              dateRange.label === 'Últimos 7 Dias'
                ? 'bg-white text-[#0050FF] shadow-xs border border-[#E2E8F0]'
                : 'text-[#64748B] hover:text-[#0F172A]'
            }`}
          >
            7D
          </button>
          <button
            onClick={() =>
              setDateRange({
                start: diasAtrasBRT(29),
                end: hojeBRT(),
                label: 'Últimos 30 Dias',
              })
            }
            className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
              dateRange.label === 'Últimos 30 Dias'
                ? 'bg-white text-[#0050FF] shadow-xs border border-[#E2E8F0]'
                : 'text-[#64748B] hover:text-[#0F172A]'
            }`}
          >
            30D
          </button>
          <button
            onClick={() => setShowCustomModal(true)}
            className={`px-3 py-1 rounded-lg font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              dateRange.label.startsWith('Personalizado')
                ? 'bg-white text-[#0050FF] shadow-xs border border-[#E2E8F0]'
                : 'text-[#64748B] hover:text-[#0F172A]'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>{dateRange.label.startsWith('Personalizado') ? 'Custom' : 'Personalizar'}</span>
          </button>
        </div>

        {/* Sync / Refresh Button */}
        <button
          onClick={handleRefresh}
          className="p-2 rounded-xl bg-white border border-[#E2E8F0] text-[#64748B] hover:text-[#0050FF] hover:border-[#BFDBFE] transition-all shadow-xs cursor-pointer"
          title="Sincronizar dados com Supabase"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-[#0050FF]' : ''}`} />
        </button>

        {/* User Pill */}
        <div className="flex items-center gap-2.5 pl-2 border-l border-[#E2E8F0]">
          <div className="w-8 h-8 rounded-full bg-[#EFF4FF] border border-[#BFDBFE] flex items-center justify-center text-[#0050FF] font-bold text-xs shadow-xs">
            RF
          </div>
          <div className="hidden lg:block text-left">
            <p className="text-xs font-bold text-[#0F172A] leading-tight">Rodrigo Ferrari</p>
            <p className="text-[10px] text-[#0050FF] font-semibold">Master Admin</p>
          </div>
        </div>
      </div>

      {/* Custom Date Modal */}
      {showCustomModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-3">
              <h3 className="text-sm font-bold text-[#0F172A] flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#0050FF]" />
                Definir Período Personalizado
              </h3>
              <button
                onClick={() => setShowCustomModal(false)}
                className="text-[#94A3B8] hover:text-[#0F172A] text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#475569] mb-1">De (Data Início)</label>
                <input
                  type="date"
                  value={customStart}
                  onChange={(e) => setCustomStart(e.target.value)}
                  className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-3 py-2 text-xs text-[#0F172A] focus:outline-none focus:border-[#0050FF]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#475569] mb-1">Até (Data Fim)</label>
                <input
                  type="date"
                  value={customEnd}
                  onChange={(e) => setCustomEnd(e.target.value)}
                  className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-3 py-2 text-xs text-[#0F172A] focus:outline-none focus:border-[#0050FF]"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-[#F1F5F9]">
              <button
                onClick={() => setShowCustomModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-[#64748B] hover:text-[#0F172A] hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleApplyCustomDate}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#0050FF] hover:bg-[#0040D6] text-white shadow-xs transition-colors cursor-pointer"
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

