'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { RefreshCw, Crown, Building, Smartphone, ArrowLeft } from 'lucide-react';
import { useTenant } from './TenantProvider';

export default function Header() {
  const {
    activeClient,
    selectedClientId,
    viewMode,
  } = useTenant();

  const [isRefreshing, setIsRefreshing] = useState(false);

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
          selectedClientId !== 'ALL' && activeClient ? (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#EFF4FF] border border-[#BFDBFE] text-[#0050FF]">
                <Crown className="w-4 h-4 text-[#0050FF]" />
                <span className="text-xs font-bold uppercase tracking-wider">
                  Admin • Inspecionando: {activeClient.nome === 'EMOVERE' ? 'Emovere' : activeClient.nome}
                </span>
              </div>

              <Link
                href="/admin"
                className="px-2.5 py-1 rounded-lg bg-white border border-[#E2E8F0] text-[11px] font-semibold text-[#64748B] hover:text-[#0050FF] hover:border-[#BFDBFE] transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
                title="Retornar para o Painel Geral do Admin"
              >
                <ArrowLeft className="w-3 h-3 text-[#0050FF]" />
                <span>Voltar ao Admin HQ</span>
              </Link>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#EFF4FF] border border-[#BFDBFE] text-[#0050FF]">
              <Crown className="w-4 h-4 text-[#0050FF]" />
              <span className="text-xs font-bold uppercase tracking-wider">
                Painel Master Admin — Swiftsail
              </span>
            </div>
          )
        ) : (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#F8FAFC] border border-[#E2E8F0] text-[#0F172A]">
              <Building className="w-4 h-4 text-[#0050FF]" />
              <span className="text-xs font-bold">
                Workspace: {activeClient?.nome === 'EMOVERE' ? 'Emovere' : activeClient?.nome || selectedClientId}
              </span>
            </div>

            <Link
              href="/admin"
              className="px-2.5 py-1 rounded-lg bg-white border border-[#E2E8F0] text-[11px] font-semibold text-[#64748B] hover:text-[#0050FF] hover:border-[#BFDBFE] transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
              title="Retornar para o painel de administração"
            >
              <Crown className="w-3 h-3 text-[#0050FF]" />
              <span>Voltar ao Admin</span>
            </Link>
          </div>
        )}
      </div>

      {/* Controls & User Profile */}
      <div className="flex items-center gap-3">
        {/* Sync / Refresh Button */}
        <button
          onClick={handleRefresh}
          className="p-2 rounded-xl bg-white border border-[#E2E8F0] text-[#64748B] hover:text-[#0050FF] hover:border-[#BFDBFE] transition-all shadow-xs cursor-pointer"
          title="Sincronizar dados em tempo real"
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

          <Link
            href="/login"
            className="p-1.5 rounded-lg bg-[#F8FAFC] hover:bg-[#EFF4FF] border border-[#E2E8F0] hover:border-[#BFDBFE] text-[#64748B] hover:text-[#0050FF] transition-all cursor-pointer shadow-xs ml-1"
            title="Ir para tela de Login (/login)"
          >
            <Smartphone className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </header>
  );
}
