'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Megaphone,
  MessageSquare,
  Sparkles,
  KanbanSquare,
  CreditCard,
  KeyRound,
  ShieldCheck,
  ChevronRight,
  ChevronDown,
  Bot,
  Building,
  Crown,
  UserPlus,
  Radio,
  Search,
  Settings,
  Users2,
  Sliders,
  Send,
  Smartphone,
  PhoneCall,
} from 'lucide-react';

import { useTenant } from './TenantProvider';
import { getClientSlug } from '@/lib/clientSlug';

function SidebarContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const {
    clients,
    selectedClientId,
    setSelectedClientId,
    viewMode,
    setViewMode,
    activeClient,
    switchToAdminHQ,
  } = useTenant();

  // Submenu toggle states
  const [openSubmenus, setOpenSubmenus] = useState<Record<string, boolean>>({
    trafego: true,
    meta: true,
    google: true,
    whatsapp: true,
    credenciais: true,
  });

  const toggleSubmenu = (key: string) => {
    setOpenSubmenus((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const currentPlataforma = searchParams?.get('plataforma');
  const currentTab = searchParams?.get('tab');

  return (
    <aside className="w-64 bg-white border-r border-[#E2E8F0] flex flex-col h-screen sticky top-0 z-40 select-none font-sans">
      {/* Brand Header */}
      <div className="p-4 border-b border-[#E2E8F0] flex items-center justify-between">
        <Link
          href={viewMode === 'admin' ? '/admin' : activeClient ? `/client/${getClientSlug(activeClient)}` : '/client'}
          className="flex items-center gap-3"
        >
          <div className="w-9 h-9 rounded-xl bg-[#EFF4FF] border border-[#BFDBFE] flex items-center justify-center overflow-hidden p-1 shadow-xs">
            <img src="/logo.png" alt="Swiftsail Logo" className="w-full h-full object-contain" />
          </div>
          <div>
            <h1 className="font-bold text-[#0F172A] text-sm leading-tight tracking-wide">SWIFTSAIL</h1>
            <p className="text-[9px] text-[#0050FF] font-bold tracking-wider uppercase">Enterprise OS</p>
          </div>
        </Link>
      </div>

      {/* Mode Switcher Tabs: Apenas 2 Hierarquias (Admin e Cliente) conforme Seção 2 */}
      <div className="p-3 border-b border-[#E2E8F0] bg-[#F8FAFC]">
        <div className="flex rounded-xl bg-[#F1F5F9] border border-[#E2E8F0] p-1">
          <button
            onClick={() => {
              switchToAdminHQ();
              router.push('/admin');
            }}
            className={`flex-1 py-1.5 px-2 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              viewMode === 'admin'
                ? 'bg-white text-[#0F172A] border border-[#E2E8F0] shadow-xs'
                : 'text-[#64748B] hover:text-[#0F172A]'
            }`}
          >
            <Crown className="w-3.5 h-3.5 text-[#0050FF]" />
            <span>Admin</span>
          </button>

          <button
            onClick={() => {
              setViewMode('client');
              const target = activeClient || (clients.length > 0 ? clients[0] : undefined);
              if (target) {
                setSelectedClientId(target.cliente_id);
                router.push(`/client/${getClientSlug(target)}`);
              } else {
                router.push('/client');
              }
            }}
            className={`flex-1 py-1.5 px-2 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              viewMode === 'client'
                ? 'bg-white text-[#0050FF] border border-[#BFDBFE] shadow-xs'
                : 'text-[#64748B] hover:text-[#0F172A]'
            }`}
          >
            <Building className="w-3.5 h-3.5 text-[#0050FF]" />
            <span>Cliente</span>
          </button>
        </div>
      </div>

      {/* Workspace Selector (Exibido no Modo Cliente) */}
      {viewMode === 'client' && (
        <div className="px-3 py-2.5 border-b border-[#E2E8F0] bg-[#EFF4FF]/30">
          <label className="block text-[10px] font-bold text-[#0050FF] uppercase tracking-wider mb-1 flex items-center gap-1">
            <Building className="w-3 h-3" />
            Workspace Ativo
          </label>
          <select
            value={selectedClientId}
            onChange={(e) => {
              setSelectedClientId(e.target.value);
              const target = clients.find((c) => c.cliente_id === e.target.value);
              if (target) {
                router.push(`/client/${getClientSlug(target)}`);
              }
            }}
            className="w-full bg-white text-xs font-semibold text-[#0F172A] border border-[#CBD5E1] rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-[#0050FF] transition-colors cursor-pointer shadow-xs"
          >
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
        </div>
      )}

      {/* Navigation Links */}
      <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-1">
        {viewMode === 'admin' ? (
          /* =========================================================
             ÁREA ADMIN (Alinhada com Seção 3.1 das Diretrizes):
             - REMOVER: Dashboard Master
             - MANTER: Gestão de Clientes
             - REMOVER: Usuários e Convites da área Admin
             - MANTER: Credenciais Master Admin
             - MUDAR: Integrações e CRM de clientes para Credenciais Admin
             - MANTER/CRIAR: Área de IA & Prompts de Calibração
             ========================================================= */
          <div className="space-y-1">
            <div className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider px-3 pb-1">
              Governança Master
            </div>

            {/* Gestão de Clientes */}
            <Link
              href="/admin/clientes"
              className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all group ${
                pathname === '/admin/clientes'
                  ? 'bg-[#EFF4FF] text-[#0050FF] font-semibold shadow-xs'
                  : 'text-[#475569] hover:text-[#0F172A] hover:bg-[#F8FAFC]'
              }`}
            >
              <div className="flex items-center gap-3">
                <Building className={`w-4 h-4 ${pathname === '/admin/clientes' ? 'text-[#0050FF]' : 'text-[#64748B]'}`} />
                <span>Gestão de Clientes</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-[#0050FF]" />
            </Link>

            {/* Credenciais Admin (com Submenu de Integrações CRM por Cliente) */}
            <div className="pt-1">
              <button
                onClick={() => toggleSubmenu('credenciais')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                  pathname.startsWith('/credenciais')
                    ? 'text-[#0050FF] font-semibold'
                    : 'text-[#475569] hover:text-[#0F172A] hover:bg-[#F8FAFC]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <KeyRound className="w-4 h-4 text-[#0050FF]" />
                  <span>Credenciais & Integrações</span>
                </div>
                {openSubmenus.credenciais ? (
                  <ChevronDown className="w-3.5 h-3.5 text-[#64748B]" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5 text-[#94A3B8]" />
                )}
              </button>

              {openSubmenus.credenciais && (
                <div className="ml-4 pl-3 border-l-2 border-[#E2E8F0] space-y-1 mt-1">
                  <Link
                    href="/credenciais/admin"
                    className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
                      pathname === '/credenciais/admin'
                        ? 'bg-[#EFF4FF] text-[#0050FF] font-semibold'
                        : 'text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC]'
                    }`}
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Master Admin (Globais)</span>
                  </Link>

                  <Link
                    href="/credenciais/cliente"
                    className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
                      pathname === '/credenciais/cliente'
                        ? 'bg-[#EFF4FF] text-[#0050FF] font-semibold'
                        : 'text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC]'
                    }`}
                  >
                    <Sliders className="w-3.5 h-3.5" />
                    <span>Integrações & CRM por Cliente</span>
                  </Link>
                </div>
              )}
            </div>

            {/* Módulo de IA (Tokens & Calibração de Prompts) */}
            <Link
              href="/admin/ia"
              className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all group ${
                pathname === '/admin/ia'
                  ? 'bg-[#EFF4FF] text-[#0050FF] font-semibold shadow-xs'
                  : 'text-[#475569] hover:text-[#0F172A] hover:bg-[#F8FAFC]'
              }`}
            >
              <div className="flex items-center gap-3">
                <Bot className={`w-4 h-4 ${pathname === '/admin/ia' ? 'text-[#0050FF]' : 'text-[#64748B]'}`} />
                <span>Módulo de IA & Prompts</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-[#0050FF]" />
            </Link>
          </div>
        ) : (
          /* =========================================================
             ÁREA CLIENTE (Alinhada com Seção 4.1 e 4.3 das Diretrizes):
             - Dashboard do Cliente
             - Tráfego e Anúncios com submenu de plataformas e configurações
             - Hub WhatsApp API (com submenu de instâncias, grupos e disparos)
             - Criativos e Landing Pages
             - Pipeline Kommo
             - Financeiro Asaas
             - Convidar Membro
             ========================================================= */
          <div className="space-y-1">
            <div className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider px-3 pb-1">
              Módulos
            </div>

            {/* Dashboard do Cliente */}
            <Link
              href={activeClient ? `/client/${getClientSlug(activeClient)}` : '/client'}
              className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all group ${
                pathname === '/' || pathname.startsWith('/client')
                  ? 'bg-[#EFF4FF] text-[#0050FF] font-semibold shadow-xs'
                  : 'text-[#475569] hover:text-[#0F172A] hover:bg-[#F8FAFC]'
              }`}
            >
              <div className="flex items-center gap-3">
                <LayoutDashboard className={`w-4 h-4 ${pathname === '/' || pathname.startsWith('/client') ? 'text-[#0050FF]' : 'text-[#64748B]'}`} />
                <span>Dashboard do Cliente</span>
              </div>
              {(pathname === '/' || pathname.startsWith('/client')) && <ChevronRight className="w-3.5 h-3.5 text-[#0050FF]" />}
            </Link>

            {/* Tráfego e Anúncios COM SUBMENU DAS PLATAFORMAS (Seção 4.1 e 4.3) */}
            <div>
              <button
                onClick={() => toggleSubmenu('trafego')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                  pathname === '/midia'
                    ? 'text-[#0050FF] font-semibold'
                    : 'text-[#475569] hover:text-[#0F172A] hover:bg-[#F8FAFC]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Megaphone className="w-4 h-4 text-[#0050FF]" />
                  <span>Tráfego & Anúncios</span>
                </div>
                {openSubmenus.trafego ? (
                  <ChevronDown className="w-3.5 h-3.5 text-[#64748B]" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5 text-[#94A3B8]" />
                )}
              </button>

              {openSubmenus.trafego && (
                <div className="ml-3 pl-2.5 border-l-2 border-[#E2E8F0] space-y-2 mt-1">
                  {/* PLATAFORMA: META ADS */}
                  <div className="space-y-0.5">
                    <button
                      type="button"
                      onClick={() => toggleSubmenu('meta')}
                      className={`w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                        pathname === '/midia' && (currentPlataforma === 'meta' || !currentPlataforma)
                          ? 'text-[#0050FF] bg-[#EFF4FF]/60'
                          : 'text-[#475569] hover:text-[#0F172A] hover:bg-[#F8FAFC]'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-blue-600 shrink-0" />
                        <span>Meta Ads</span>
                      </div>
                      {openSubmenus.meta ? (
                        <ChevronDown className="w-3 h-3 text-[#64748B]" />
                      ) : (
                        <ChevronRight className="w-3 h-3 text-[#94A3B8]" />
                      )}
                    </button>

                    {openSubmenus.meta && (
                      <div className="ml-3 pl-2 border-l border-[#CBD5E1] space-y-0.5 py-0.5">
                        <Link
                          href="/midia?plataforma=meta&tab=campaigns"
                          className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] transition-colors ${
                            pathname === '/midia' && (currentPlataforma === 'meta' || !currentPlataforma) && currentTab !== 'contas'
                              ? 'bg-[#EFF4FF] text-[#0050FF] font-semibold'
                              : 'text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC]'
                          }`}
                        >
                          <span className="text-[10px]">📁</span>
                          <span>Campanhas & Criativos</span>
                        </Link>

                        <Link
                          href="/midia?plataforma=meta&tab=contas"
                          className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] transition-colors ${
                            pathname === '/midia' && currentPlataforma === 'meta' && currentTab === 'contas'
                              ? 'bg-[#EFF4FF] text-[#0050FF] font-semibold'
                              : 'text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC]'
                          }`}
                        >
                          <span className="text-[10px]">💳</span>
                          <span>Faturamento & Contas</span>
                        </Link>
                      </div>
                    )}
                  </div>

                  {/* PLATAFORMA: GOOGLE ADS */}
                  <div className="space-y-0.5">
                    <button
                      type="button"
                      onClick={() => toggleSubmenu('google')}
                      className={`w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                        pathname === '/midia' && currentPlataforma === 'google'
                          ? 'text-[#0050FF] bg-[#EFF4FF]/60'
                          : 'text-[#475569] hover:text-[#0F172A] hover:bg-[#F8FAFC]'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                        <span>Google Ads</span>
                      </div>
                      {openSubmenus.google ? (
                        <ChevronDown className="w-3 h-3 text-[#64748B]" />
                      ) : (
                        <ChevronRight className="w-3 h-3 text-[#94A3B8]" />
                      )}
                    </button>

                    {openSubmenus.google && (
                      <div className="ml-3 pl-2 border-l border-[#CBD5E1] space-y-0.5 py-0.5">
                        <Link
                          href="/midia?plataforma=google&tab=campaigns"
                          className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] transition-colors ${
                            pathname === '/midia' && currentPlataforma === 'google' && (!currentTab || currentTab === 'campaigns')
                              ? 'bg-[#EFF4FF] text-[#0050FF] font-semibold'
                              : 'text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC]'
                          }`}
                        >
                          <span className="text-[10px]">📂</span>
                          <span>Campanhas</span>
                        </Link>

                        <Link
                          href="/midia?plataforma=google&tab=anuncios"
                          className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] transition-colors ${
                            pathname === '/midia' && currentPlataforma === 'google' && currentTab === 'anuncios'
                              ? 'bg-[#EFF4FF] text-[#0050FF] font-semibold'
                              : 'text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC]'
                          }`}
                        >
                          <span className="text-[10px]">📢</span>
                          <span>Anúncios & Destinos</span>
                        </Link>

                        <Link
                          href="/midia?plataforma=google&tab=recursos"
                          className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] transition-colors ${
                            pathname === '/midia' && currentPlataforma === 'google' && currentTab === 'recursos'
                              ? 'bg-[#EFF4FF] text-[#0050FF] font-semibold'
                              : 'text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC]'
                          }`}
                        >
                          <span className="text-[10px]">⚡</span>
                          <span>PMax Recursos</span>
                        </Link>

                        <Link
                          href="/midia?plataforma=google&tab=palavras"
                          className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] transition-colors ${
                            pathname === '/midia' && currentPlataforma === 'google' && currentTab === 'palavras'
                              ? 'bg-[#EFF4FF] text-[#0050FF] font-semibold'
                              : 'text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC]'
                          }`}
                        >
                          <span className="text-[10px]">🎯</span>
                          <span>Palavras-chave</span>
                        </Link>

                        <Link
                          href="/midia?plataforma=google&tab=termos"
                          className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] transition-colors ${
                            pathname === '/midia' && currentPlataforma === 'google' && currentTab === 'termos'
                              ? 'bg-[#EFF4FF] text-[#0050FF] font-semibold'
                              : 'text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC]'
                          }`}
                        >
                          <span className="text-[10px]">🔍</span>
                          <span>Termos de Busca</span>
                        </Link>

                        <Link
                          href="/midia?plataforma=google&tab=contas"
                          className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] transition-colors ${
                            pathname === '/midia' && currentPlataforma === 'google' && currentTab === 'contas'
                              ? 'bg-[#EFF4FF] text-[#0050FF] font-semibold'
                              : 'text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC]'
                          }`}
                        >
                          <span className="text-[10px]">💳</span>
                          <span>Faturamento & Contas</span>
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Hub WhatsApp API COM SUBMENU (Seção 4.4) */}
            <div>
              <button
                onClick={() => toggleSubmenu('whatsapp')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                  pathname === '/whatsapp'
                    ? 'text-[#0050FF] font-semibold'
                    : 'text-[#475569] hover:text-[#0F172A] hover:bg-[#F8FAFC]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <MessageSquare className="w-4 h-4 text-emerald-600" />
                  <span>Hub WhatsApp API</span>
                </div>
                {openSubmenus.whatsapp ? (
                  <ChevronDown className="w-3.5 h-3.5 text-[#64748B]" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5 text-[#94A3B8]" />
                )}
              </button>

              {openSubmenus.whatsapp && (
                <div className="ml-4 pl-3 border-l-2 border-[#E2E8F0] space-y-1 mt-1">
                  <Link
                    href="/whatsapp?tab=conexao"
                    className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
                      pathname === '/whatsapp' && (currentTab === 'conexao' || !currentTab)
                        ? 'bg-[#EFF4FF] text-[#0050FF] font-semibold'
                        : 'text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC]'
                    }`}
                  >
                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span>Conexão Uazapi</span>
                  </Link>

                  <Link
                    href="/whatsapp?tab=grupos"
                    className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
                      pathname === '/whatsapp' && currentTab === 'grupos'
                        ? 'bg-[#EFF4FF] text-[#0050FF] font-semibold'
                        : 'text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC]'
                    }`}
                  >
                    <Users2 className="w-3.5 h-3.5" />
                    <span>Coleta de Grupos</span>
                  </Link>

                  <Link
                    href="/whatsapp?tab=disparos"
                    className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
                      pathname === '/whatsapp' && currentTab === 'disparos'
                        ? 'bg-[#EFF4FF] text-[#0050FF] font-semibold'
                        : 'text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC]'
                    }`}
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Envio em Massa & Stats</span>
                  </Link>

                  <Link
                    href="/whatsapp?tab=ligacoes"
                    className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
                      pathname === '/whatsapp' && currentTab === 'ligacoes'
                        ? 'bg-[#EFF4FF] text-[#0050FF] font-semibold'
                        : 'text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC]'
                    }`}
                  >
                    <PhoneCall className="w-3.5 h-3.5 text-[#0050FF]" />
                    <span>Ligações & Kommo CRM</span>
                  </Link>
                </div>
              )}
            </div>

            {/* Criativos e Landing Pages */}
            <Link
              href="/criativos"
              className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all group ${
                pathname === '/criativos'
                  ? 'bg-[#EFF4FF] text-[#0050FF] font-semibold shadow-xs'
                  : 'text-[#475569] hover:text-[#0F172A] hover:bg-[#F8FAFC]'
              }`}
            >
              <div className="flex items-center gap-3">
                <Sparkles className={`w-4 h-4 ${pathname === '/criativos' ? 'text-[#0050FF]' : 'text-[#64748B]'}`} />
                <span>Criativos & Landing Pages</span>
              </div>
              {pathname === '/criativos' && <ChevronRight className="w-3.5 h-3.5 text-[#0050FF]" />}
            </Link>

            {/* Pipeline Kommo */}
            <Link
              href="/crm"
              className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all group ${
                pathname === '/crm'
                  ? 'bg-[#EFF4FF] text-[#0050FF] font-semibold shadow-xs'
                  : 'text-[#475569] hover:text-[#0F172A] hover:bg-[#F8FAFC]'
              }`}
            >
              <div className="flex items-center gap-3">
                <KanbanSquare className={`w-4 h-4 ${pathname === '/crm' ? 'text-[#0050FF]' : 'text-[#64748B]'}`} />
                <span>Pipeline CRM (Kommo)</span>
              </div>
              {pathname === '/crm' && <ChevronRight className="w-3.5 h-3.5 text-[#0050FF]" />}
            </Link>

            {/* Financeiro Asaas */}
            <Link
              href="/financeiro"
              className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all group ${
                pathname === '/financeiro'
                  ? 'bg-[#EFF4FF] text-[#0050FF] font-semibold shadow-xs'
                  : 'text-[#475569] hover:text-[#0F172A] hover:bg-[#F8FAFC]'
              }`}
            >
              <div className="flex items-center gap-3">
                <CreditCard className={`w-4 h-4 ${pathname === '/financeiro' ? 'text-[#0050FF]' : 'text-[#64748B]'}`} />
                <span>Financeiro (Asaas)</span>
              </div>
              {pathname === '/financeiro' && <ChevronRight className="w-3.5 h-3.5 text-[#0050FF]" />}
            </Link>

            {/* Convidar Membro (Permitido conforme Seção 5 das Diretrizes) */}
            <div className="pt-2 border-t border-[#F1F5F9]">
              <Link
                href="/admin/usuarios"
                className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all group ${
                  pathname === '/admin/usuarios'
                    ? 'bg-[#EFF4FF] text-[#0050FF] font-semibold shadow-xs'
                    : 'text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <UserPlus className="w-4 h-4 text-[#64748B]" />
                  <span>Convidar Membro</span>
                </div>
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* Footer Helper */}
      <div className="p-3 border-t border-[#E2E8F0] bg-[#F8FAFC] space-y-2">
        {viewMode === 'client' ? (
          <button
            onClick={() => {
              switchToAdminHQ();
              router.push('/admin');
            }}
            className="w-full py-1.5 px-2 rounded-lg bg-white hover:bg-slate-50 text-[#0F172A] border border-[#E2E8F0] shadow-xs text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
          >
            <Crown className="w-3.5 h-3.5 text-[#0050FF]" />
            <span>Painel Master Admin</span>
          </button>
        ) : (
          <div className="flex items-center justify-between text-[11px] text-[#64748B] px-1">
            <span className="flex items-center gap-1">
              <Bot className="w-3.5 h-3.5 text-[#0050FF]" />
              <span>Sinapse IA</span>
            </span>
            <span className="text-[10px] text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              Operacional
            </span>
          </div>
        )}

        <Link
          href="/login"
          className="w-full py-1.5 px-2 rounded-lg bg-white hover:bg-[#EFF4FF] text-[#64748B] hover:text-[#0050FF] border border-[#E2E8F0] hover:border-[#BFDBFE] shadow-xs text-[10px] font-semibold flex items-center justify-center gap-1.5 transition-all"
          title="Testar a tela de login"
        >
          <Smartphone className="w-3 h-3 text-[#0050FF]" />
          <span>Tela de Login (/login)</span>
        </Link>
      </div>
    </aside>
  );
}

export default function Sidebar() {
  return (
    <Suspense
      fallback={
        <aside className="w-64 bg-white border-r border-[#E2E8F0] flex flex-col h-screen sticky top-0 z-40 select-none font-sans" />
      }
    >
      <SidebarContent />
    </Suspense>
  );
}
