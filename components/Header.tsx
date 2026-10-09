'use client';

import React, { useState } from 'react';
import { Calendar, RefreshCw, Crown, Building, ArrowLeftRight, Check, X } from 'lucide-react';
import { useTenant } from './TenantProvider';
import {
  hojeBRT,
  ontemBRT,
  semanaPassadaBRT,
  semanaAtualBRT,
  mesPassadoBRT,
  mesAtualBRT,
} from '@/lib/date';

export default function Header() {
  const {
    dateRange,
    setDateRange,
    activeClient,
    selectedClientId,
    viewMode,
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
              Painel Master Admin — Swiftsail
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
              title="Retornar para a gestão de clientes do Admin"
            >
              <Crown className="w-3 h-3 text-[#0050FF]" />
              <span>Voltar ao Admin</span>
            </button>
          </div>
        )}
      </div>

      {/* Date Range & Controls */}
      <div className="flex items-center gap-3">
        {/* Seletor de Datas: Visível no Modo Cliente conforme Seção 4.2 das Diretrizes:
            (Ontem, Semana passada, Semana atual, Mês passado, Mês atual, Personalizar período)
            Removido no Modo Admin conforme Seção 3.2 das Diretrizes. */}
        {viewMode === 'client' && (
          <div className="flex items-center bg-[#F1F5F9] border border-[#E2E8F0] rounded-xl p-1 text-xs overflow-x-auto">
            <button
              onClick={() => {
                const ont = ontemBRT();
                setDateRange({ start: ont, end: ont, label: 'Ontem' });
              }}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-all whitespace-nowrap cursor-pointer ${
                dateRange.label === 'Ontem'
                  ? 'bg-white text-[#0050FF] shadow-xs border border-[#E2E8F0]'
                  : 'text-[#64748B] hover:text-[#0F172A]'
              }`}
            >
              Ontem
            </button>

            <button
              onClick={() => {
                const sp = semanaPassadaBRT();
                setDateRange({ start: sp.start, end: sp.end, label: 'Semana passada' });
              }}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-all whitespace-nowrap cursor-pointer ${
                dateRange.label === 'Semana passada'
                  ? 'bg-white text-[#0050FF] shadow-xs border border-[#E2E8F0]'
                  : 'text-[#64748B] hover:text-[#0F172A]'
              }`}
            >
              Semana passada
            </button>

            <button
              onClick={() => {
                const sa = semanaAtualBRT();
                setDateRange({ start: sa.start, end: sa.end, label: 'Semana atual' });
              }}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-all whitespace-nowrap cursor-pointer ${
                dateRange.label === 'Semana atual'
                  ? 'bg-white text-[#0050FF] shadow-xs border border-[#E2E8F0]'
                  : 'text-[#64748B] hover:text-[#0F172A]'
              }`}
            >
              Semana atual
            </button>

            <button
              onClick={() => {
                const mp = mesPassadoBRT();
                setDateRange({ start: mp.start, end: mp.end, label: 'Mês passado' });
              }}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-all whitespace-nowrap cursor-pointer ${
                dateRange.label === 'Mês passado'
                  ? 'bg-white text-[#0050FF] shadow-xs border border-[#E2E8F0]'
                  : 'text-[#64748B] hover:text-[#0F172A]'
              }`}
            >
              Mês passado
            </button>

            <button
              onClick={() => {
                const ma = mesAtualBRT();
                setDateRange({ start: ma.start, end: ma.end, label: 'Mês atual' });
              }}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-all whitespace-nowrap cursor-pointer ${
                dateRange.label === 'Mês atual'
                  ? 'bg-white text-[#0050FF] shadow-xs border border-[#E2E8F0]'
                  : 'text-[#64748B] hover:text-[#0F172A]'
              }`}
            >
              Mês atual
            </button>

            <button
              onClick={() => setShowCustomModal(true)}
              className={`px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1 transition-all whitespace-nowrap cursor-pointer ${
                dateRange.label.startsWith('Personalizado')
                  ? 'bg-white text-[#0050FF] shadow-xs border border-[#E2E8F0]'
                  : 'text-[#64748B] hover:text-[#0F172A]'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Personalizar</span>
            </button>
          </div>
        )}

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
          <div className="hidden sm:block text-left">
            <p className="text-xs font-bold text-[#0F172A] leading-tight">Rodrigo Ferrari</p>
            <p className="text-[10px] text-[#64748B]">
              {viewMode === 'admin' ? 'Master Admin' : 'Gestão'}
            </p>
          </div>
        </div>
      </div>

      {/* Modal de Personalização de Período */}
      {showCustomModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[#E2E8F0] rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
              <h3 className="font-bold text-[#0F172A] text-sm flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#0050FF]" />
                Personalizar Período
              </h3>
              <button
                onClick={() => setShowCustomModal(false)}
                className="text-[#64748B] hover:text-[#0F172A] p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-[#64748B] mb-1">
                  Data Inicial
                </label>
                <input
                  type="date"
                  value={customStart}
                  onChange={(e) => setCustomStart(e.target.value)}
                  className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl px-3 py-2 text-xs font-semibold text-[#0F172A] focus:outline-none focus:border-[#0050FF]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#64748B] mb-1">
                  Data Final
                </label>
                <input
                  type="date"
                  value={customEnd}
                  onChange={(e) => setCustomEnd(e.target.value)}
                  className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl px-3 py-2 text-xs font-semibold text-[#0F172A] focus:outline-none focus:border-[#0050FF]"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E2E8F0]">
              <button
                onClick={() => setShowCustomModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-[#64748B] hover:bg-[#F1F5F9]"
              >
                Cancelar
              </button>
              <button
                onClick={handleApplyCustomDate}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-[#0050FF] hover:bg-[#0040D6] text-white shadow-xs"
              >
                Aplicar Período
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
