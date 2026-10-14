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
        {/* Switcher de Visão para Master Admin */}
        {isMasterAdmin && (
          <div className="flex rounded-xl bg-[#F1F5F9] border border-[#E2E8F0] p-0.5">
            <button
              onClick={() => {
                switchToAdminHQ();
                router.push('/admin');
              }}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'admin'
                  ? 'bg-white text-[#0F172A] border border-[#E2E8F0] shadow-xs'
                  : 'text-[#64748B] hover:text-[#0F172A]'
              }`}
              title="Acessar o Painel Master Admin"
            >
              <Crown className="w-3.5 h-3.5 text-[#0050FF]" />
              <span className="hidden sm:inline">Admin</span>
            </button>

            <button
              onClick={() => {
                setViewMode('client');
                const target = activeClient || (availableClients.length > 0 ? availableClients[0] : clients[0]);
                if (target) {
                  setSelectedClientId(target.cliente_id);
                  if (pathname.startsWith('/admin')) {
                    router.push(`/client/${getClientSlug(target)}`);
                  }
                }
              }}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'client'
                  ? 'bg-white text-[#0050FF] border border-[#BFDBFE] shadow-xs'
                  : 'text-[#64748B] hover:text-[#0F172A]'
              }`}
              title="Acessar a Visão de Workspace do Cliente"
            >
              <Building className="w-3.5 h-3.5 text-[#0050FF]" />
              <span className="hidden sm:inline">Cliente</span>
            </button>
          </div>
        )}

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

        {/* Alerta de Simulação de Cliente com Botão de Restauração Imediata */}
        {isSimulatingClient && (
          <button
            onClick={() => {
              restoreMasterAdmin();
              router.push('/admin');
            }}
            className="hidden lg:flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 text-xs font-bold transition-all shadow-xs cursor-pointer animate-pulse"
            title="Voltar para a conta Master Admin de Rodrigo Ferrari"
          >
            <Crown className="w-3.5 h-3.5 text-amber-600" />
            <span>Restaurar Perfil Admin (Rodrigo)</span>
          </button>
        )}
      </div>

      {/* Lado Direito: Sync / Refresh + Perfil + Restauração */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Sync / Refresh Button */}
        <button
          onClick={handleRefresh}
          className="p-2 rounded-xl bg-white border border-[#E2E8F0] text-[#64748B] hover:text-[#0050FF] hover:border-[#BFDBFE] transition-all shadow-xs cursor-pointer"
          title="Sincronizar dados em tempo real"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-[#0050FF]' : ''}`} />
        </button>

        {/* Botão de Restauração para telas menores */}
        {isSimulatingClient && (
          <button
            onClick={() => {
              restoreMasterAdmin();
              router.push('/admin');
            }}
            className="flex lg:hidden p-2 rounded-xl bg-amber-100 border border-amber-300 text-amber-900 text-xs font-bold cursor-pointer"
            title="Restaurar Admin"
          >
            <Crown className="w-4 h-4 text-amber-700" />
          </button>
        )}

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
