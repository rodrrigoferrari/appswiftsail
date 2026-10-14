'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { RefreshCw, Crown, Building, Smartphone, ArrowLeft, ChevronDown, Check } from 'lucide-react';
import { useTenant } from './TenantProvider';
import { getClientSlug } from '@/lib/clientSlug';

export default function Header() {
  const {
    clients,
    availableClients,
    activeClient,
    selectedClientId,
    setSelectedClientId,
    viewMode,
    setViewMode,
    switchToAdminHQ,
    isMasterAdmin,
    currentUser,
    restoreMasterAdmin,
  } = useTenant();

  const router = useRouter();
  const pathname = usePathname();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      window.location.reload();
    }, 400);
  };

  const handleWorkspaceChange = (newClientId: string) => {
    if (!isMasterAdmin) {
      if (newClientId === 'ALL' || !availableClients.some((c) => c.cliente_id === newClientId)) {
        return;
      }
    }

    setSelectedClientId(newClientId);
    if (newClientId === 'ALL') {
      switchToAdminHQ();
      if (pathname.startsWith('/client/')) {
        router.push('/admin');
      }
      return;
    }

    const target = clients.find((c) => c.cliente_id === newClientId);
    if (target) {
      const slug = getClientSlug(target);
      if (pathname.startsWith('/client/')) {
        router.push(`/client/${slug}`);
      } else if (pathname.startsWith('/admin/client/')) {
        router.push(`/admin/client/${slug}`);
      }
    }
  };

  const isSimulatingClient = currentUser && currentUser.role !== 'master_admin';

  return (
    <header className="h-16 border-b border-[#E2E8F0] bg-white px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 select-none">
      {/* Lado Esquerdo: Modo (Admin / Cliente) + Seletor de Workspace */}
      <div className="flex items-center gap-2 sm:gap-3">


        {/* SELETOR DE WORKSPACE INTERATIVO */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#F8FAFC] border border-[#CBD5E1] text-[#0F172A] shadow-xs hover:border-[#0050FF] transition-colors">
            <Building className="w-3.5 h-3.5 text-[#0050FF] shrink-0" />
            <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider hidden md:inline">
              Workspace:
            </span>

            {isMasterAdmin ? (
              <select
                value={selectedClientId}
                onChange={(e) => handleWorkspaceChange(e.target.value)}
                className="text-xs font-bold text-[#0F172A] bg-transparent border-none focus:outline-none cursor-pointer pr-1 truncate max-w-[160px] sm:max-w-[220px]"
                title="Alternar Workspace de Cliente"
              >
                <option value="ALL">🏢 Swiftsail HQ (Todos os Clientes)</option>
                {clients.map((c) => {
                  const displayName = c.nome === 'EMOVERE' ? 'Emovere' : c.nome;
                  const statusIcon = c.status === 'ativo' ? '🟢' : c.status === 'pausado' ? '🟡' : '🔴';
                  return (
                    <option key={c.cliente_id} value={c.cliente_id}>
                      {statusIcon} {displayName}
                    </option>
                  );
                })}
              </select>
            ) : availableClients.length > 1 ? (
              <select
                value={selectedClientId}
                onChange={(e) => handleWorkspaceChange(e.target.value)}
                className="text-xs font-bold text-[#0F172A] bg-transparent border-none focus:outline-none cursor-pointer pr-1 truncate max-w-[160px] sm:max-w-[220px]"
                title="Alternar Workspace"
              >
                {availableClients.map((c) => {
                  const displayName = c.nome === 'EMOVERE' ? 'Emovere' : c.nome;
                  const statusIcon = c.status === 'ativo' ? '🟢' : '🟡';
                  return (
                    <option key={c.cliente_id} value={c.cliente_id}>
                      {statusIcon} {displayName}
                    </option>
                  );
                })}
              </select>
            ) : (
              <span className="text-xs font-bold text-[#0F172A] truncate max-w-[160px]">
                {activeClient?.nome === 'EMOVERE' ? 'Emovere' : activeClient?.nome || selectedClientId}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Lado Direito: Sync / Refresh + Perfil */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Sync / Refresh Button */}
        <button
          onClick={handleRefresh}
          className="p-2 rounded-xl bg-white border border-[#E2E8F0] text-[#64748B] hover:text-[#0050FF] hover:border-[#BFDBFE] transition-all shadow-xs cursor-pointer"
          title="Sincronizar dados em tempo real"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-[#0050FF]' : ''}`} />
        </button>

        {/* User Pill */}
        <div className="flex items-center gap-2 sm:gap-2.5 pl-2 border-l border-[#E2E8F0]">
          <div className="w-8 h-8 rounded-full bg-[#EFF4FF] border border-[#BFDBFE] flex items-center justify-center text-[#0050FF] font-bold text-xs shadow-xs">
            {currentUser?.nome
              ? currentUser.nome
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .substring(0, 2)
                  .toUpperCase()
              : 'RF'}
          </div>
          <div className="hidden sm:block text-left">
            <p className="text-xs font-bold text-[#0F172A] leading-tight truncate max-w-[120px]">
              {currentUser?.nome || 'Rodrigo Ferrari'}
            </p>
            <p className="text-[10px] text-[#64748B]">
              {isMasterAdmin ? 'Master Admin' : 'Cliente Convidado'}
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
