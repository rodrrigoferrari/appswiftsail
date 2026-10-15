'use client';

import React, { useState, useEffect, Suspense } from 'react';
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
  BarChart3,
  Palette,
  Globe,
  Target,
  Layers,
  BrainCircuit,
  Image as ImageIcon,
  Video,
  Cpu,
  X,
} from 'lucide-react';

import { useTenant } from './TenantProvider';
import { getClientSlug } from '@/lib/clientSlug';

export interface SidebarProps {
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

function SidebarContent({ isMobileOpen, onCloseMobile }: SidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const {
    clients,
    availableClients,
    isMasterAdmin,
    canAccessModule,
    selectedClientId,
    setSelectedClientId,
    viewMode,
    setViewMode,
    activeClient,
    switchToAdminHQ,
    restoreMasterAdmin,
  } = useTenant();

  // Submenu toggle states - inicializados de forma inteligente e compacta
  const [openSubmenus, setOpenSubmenus] = useState<Record<string, boolean>>({
    trafego: false,
    meta: false,
    google: false,
    whatsapp: false,
    credenciais: false,
    prompts: false,
    design: false,
    crm: false,
  });

  const toggleSubmenu = (key: string) => {
    setOpenSubmenus((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const currentPlataforma = searchParams?.get('plataforma');
  const currentTab = searchParams?.get('tab');

  // Mantém aberto apenas o submenu da página em que o usuário está navegando
  useEffect(() => {
    if (pathname === '/midia') {
      setOpenSubmenus((prev) => ({
        ...prev,
        trafego: true,
        meta: !currentPlataforma || currentPlataforma === 'meta',
        google: currentPlataforma === 'google',
      }));
    } else if (pathname === '/whatsapp') {
      setOpenSubmenus((prev) => ({ ...prev, whatsapp: true }));
    } else if (pathname === '/crm') {
      setOpenSubmenus((prev) => ({ ...prev, crm: true }));
    } else if (pathname === '/criativos') {
      setOpenSubmenus((prev) => ({ ...prev, design: true }));
    } else if (
      pathname.startsWith('/credenciais') ||
      pathname === '/admin/notificacoes' ||
      pathname === '/admin/openrouter'
    ) {
      setOpenSubmenus((prev) => ({ ...prev, credenciais: true }));
    } else if (pathname.startsWith('/admin/prompts') || pathname === '/admin/ia') {
      setOpenSubmenus((prev) => ({ ...prev, prompts: true }));
    }
  }, [pathname, currentPlataforma]);

  // Fecha o menu lateral automaticamente no mobile ao navegar
  useEffect(() => {
    if (isMobileOpen && onCloseMobile) {
      onCloseMobile();
    }
  }, [pathname, currentPlataforma, currentTab]);

  return (
    <>
      {/* Backdrop Mobile Escurecido com Blur */}
      {isMobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-40 md:hidden transition-opacity"
          aria-hidden="true"
        />
      )}

      <aside
        className={`w-64 bg-white border-r border-[#E2E8F0] flex flex-col h-screen select-none font-sans md:sticky md:top-0 md:z-30 md:translate-x-0 fixed inset-y-0 left-0 z-50 transition-transform duration-300 ease-in-out shadow-2xl md:shadow-none ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className="p-4 border-b border-[#E2E8F0] flex items-center justify-between">
          <Link
            href={viewMode === 'admin' && isMasterAdmin ? '/admin' : activeClient ? `/client/${getClientSlug(activeClient)}` : '/client'}
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

          {/* Botão de Fechar no Mobile */}
          <button
            type="button"
            onClick={onCloseMobile}
            className="p-1.5 rounded-lg text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9] md:hidden cursor-pointer transition-colors"
            title="Fechar menu lateral"
            aria-label="Fechar menu lateral"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

      {/* Mode Switcher Tabs: Exibido SOMENTE para Master Admin */}
      {isMasterAdmin && (
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
                const target = activeClient || (availableClients.length > 0 ? availableClients[0] : undefined);
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
      )}

      {/* Atalho Rápido de Inspecionar Cliente (Exibido no Modo Admin para Master Admin) */}
      {viewMode === 'admin' && isMasterAdmin && (
        <div className="px-3 py-2 border-b border-[#E2E8F0] bg-[#F8FAFC]">
          <label className="block text-[10px] font-bold text-[#64748B] uppercase tracking-wider mb-1 flex items-center justify-between">
            <span className="flex items-center gap-1">
              <Building className="w-3 h-3 text-[#0050FF]" />
              Inspecionar Cliente
            </span>
            <span className="text-[9px] text-[#0050FF] font-bold bg-[#EFF4FF] px-1 rounded">
              {clients.length} empresas
            </span>
          </label>
          <select
            value={selectedClientId}
            onChange={(e) => {
              const newId = e.target.value;
              setSelectedClientId(newId);
              if (newId !== 'ALL') {
                const target = clients.find((c) => c.cliente_id === newId);
                if (target) {
                  setViewMode('client');
                  router.push(`/client/${getClientSlug(target)}`);
                }
              }
            }}
            className="w-full bg-white text-xs font-semibold text-[#0F172A] border border-[#CBD5E1] rounded-lg px-2 py-1.5 focus:outline-none focus:border-[#0050FF] transition-colors cursor-pointer shadow-xs"
            title="Selecionar cliente para inspecionar workspace"
          >
            <option value="ALL">🏢 Ir para Workspace de Cliente...</option>
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

      {/* Workspace Selector (Exibido no Modo Cliente) */}
      {viewMode === 'client' && (
        <div className="px-3 py-2.5 border-b border-[#E2E8F0] bg-[#EFF4FF]/30">
          <label className="block text-[10px] font-bold text-[#0050FF] uppercase tracking-wider mb-1 flex items-center justify-between">
            <span className="flex items-center gap-1">
              <Building className="w-3 h-3" />
              Workspace Ativo
            </span>
            {isMasterAdmin ? (
              <span className="text-[9px] text-[#0050FF] bg-blue-100 font-bold px-1.5 py-0.2 rounded border border-[#BFDBFE]">
                Visão Admin
              </span>
            ) : (
              <span className="text-[9px] text-[#64748B] bg-white px-1.5 py-0.2 rounded border border-[#CBD5E1]">
                🔒 Atribuído
              </span>
            )}
          </label>

          {isMasterAdmin ? (
            /* ADMIN: Sempre tem acesso ao seletor completo com TODAS as empresas */
            <select
              value={selectedClientId}
              onChange={(e) => {
                const newId = e.target.value;
                setSelectedClientId(newId);
                const target = clients.find((c) => c.cliente_id === newId);
                if (target) {
                  if (pathname.startsWith('/client/')) {
                    router.push(`/client/${getClientSlug(target)}`);
                  } else if (pathname.startsWith('/admin/client/')) {
                    router.push(`/admin/client/${getClientSlug(target)}`);
                  }
                  // Em /midia, /crm, /whatsapp, etc. o usuário continua na página atual com os novos dados
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
          ) : availableClients.length <= 1 ? (
            /* Cliente comum com único workspace fixo */
            <div className="w-full bg-white text-xs font-bold text-[#0F172A] border border-[#CBD5E1] rounded-lg px-2.5 py-1.5 shadow-xs flex items-center gap-2">
              <span className="text-emerald-500">🟢</span>
              <span className="truncate">
                {availableClients[0]?.nome === 'EMOVERE' ? 'Emovere' : availableClients[0]?.nome || 'Meu Workspace'}
              </span>
            </div>
          ) : (
            /* Cliente comum com múltiplos workspaces designados */
            <select
              value={selectedClientId}
              onChange={(e) => {
                const newId = e.target.value;
                setSelectedClientId(newId);
                const target = availableClients.find((c) => c.cliente_id === newId);
                if (target) {
                  if (pathname.startsWith('/client/')) {
                    router.push(`/client/${getClientSlug(target)}`);
                  }
                }
              }}
              className="w-full bg-white text-xs font-semibold text-[#0F172A] border border-[#CBD5E1] rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-[#0050FF] transition-colors cursor-pointer shadow-xs"
            >
              {availableClients.map((c) => {
                const displayName = c.nome === 'EMOVERE' ? 'Emovere' : c.nome;
                const statusIcon = c.status === 'ativo' ? '🟢' : c.status === 'pausado' ? '🟡' : '🔴';
                return (
                  <option key={c.cliente_id} value={c.cliente_id}>
                    {statusIcon} {displayName}
                  </option>
                );
              })}
            </select>
          )}
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

            {/* Dashboard de Clientes */}
            <Link
              href="/admin/clientes"
              className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all group ${
                pathname === '/admin/clientes' || pathname === '/admin'
                  ? 'bg-[#EFF4FF] text-[#0050FF] font-semibold shadow-xs'
                  : 'text-[#475569] hover:text-[#0F172A] hover:bg-[#F8FAFC]'
              }`}
            >
              <div className="flex items-center gap-3">
                <LayoutDashboard className={`w-4 h-4 ${pathname === '/admin/clientes' || pathname === '/admin' ? 'text-[#0050FF]' : 'text-[#64748B]'}`} />
                <span>Dashboard de Clientes</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-[#EFF4FF] text-[#0050FF] border border-[#BFDBFE]">
                  {clients.length}
                </span>
                <ChevronRight className="w-3.5 h-3.5 text-[#0050FF]" />
              </div>
            </Link>

            {/* Credenciais & Integrações com Submenus (Notificações, Kommo, OpenRouter) */}
            <div className="pt-1">
              <button
                onClick={() => toggleSubmenu('credenciais')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                  pathname === '/admin/notificacoes' || pathname === '/admin/openrouter' || pathname.startsWith('/credenciais')
                    ? 'text-[#0050FF] font-semibold bg-[#EFF4FF]/50'
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
                  {/* Notificações (Uazapi) */}
                  <Link
                    href="/admin/notificacoes"
                    className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
                      pathname === '/admin/notificacoes'
                        ? 'bg-[#EFF4FF] text-[#0050FF] font-semibold'
                        : 'text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC]'
                    }`}
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Notificações</span>
                  </Link>

                  {/* Contas de Anúncio & Vínculos (Kommo/Ads) */}
                  <Link
                    href="/credenciais/cliente"
                    className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
                      pathname === '/credenciais/cliente'
                        ? 'bg-[#EFF4FF] text-[#0050FF] font-semibold'
                        : 'text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC]'
                    }`}
                  >
                    <Layers className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    <span>Contas & Vínculos</span>
                  </Link>

                  {/* OpenRouter (Token & Consumo) */}
                  <Link
                    href="/admin/openrouter"
                    className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
                      pathname === '/admin/openrouter'
                        ? 'bg-[#EFF4FF] text-[#0050FF] font-semibold'
                        : 'text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC]'
                    }`}
                  >
                    <Cpu className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                    <span>OpenRouter</span>
                  </Link>
                </div>
              )}
            </div>

            {/* Novo Menu de Prompts com Submenus Referentes a Cada Um Deles */}
            <div className="pt-1">
              <button
                onClick={() => toggleSubmenu('prompts')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                  pathname.startsWith('/admin/prompts') || pathname === '/admin/ia'
                    ? 'text-[#0050FF] font-semibold bg-[#EFF4FF]/50'
                    : 'text-[#475569] hover:text-[#0F172A] hover:bg-[#F8FAFC]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Sparkles className="w-4 h-4 text-purple-600" />
                  <span>Prompts</span>
                </div>
                {openSubmenus.prompts ? (
                  <ChevronDown className="w-3.5 h-3.5 text-[#64748B]" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5 text-[#94A3B8]" />
                )}
              </button>

              {openSubmenus.prompts && (
                <div className="ml-4 pl-3 border-l-2 border-[#E2E8F0] space-y-1 mt-1">
                  <Link
                    href="/admin/prompts?prompt=campaign_analysis"
                    className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
                      pathname === '/admin/prompts' && searchParams?.get('prompt') === 'campaign_analysis'
                        ? 'bg-[#EFF4FF] text-[#0050FF] font-semibold'
                        : 'text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC]'
                    }`}
                  >
                    <BrainCircuit className="w-3.5 h-3.5 text-[#0050FF] shrink-0" />
                    <span>Análise de Tráfego & BI</span>
                  </Link>

                  <Link
                    href="/admin/prompts?prompt=creative_image"
                    className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
                      pathname === '/admin/prompts' && searchParams?.get('prompt') === 'creative_image'
                        ? 'bg-[#EFF4FF] text-[#0050FF] font-semibold'
                        : 'text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC]'
                    }`}
                  >
                    <ImageIcon className="w-3.5 h-3.5 text-pink-600 shrink-0" />
                    <span>Criativos de Imagem</span>
                  </Link>

                  <Link
                    href="/admin/prompts?prompt=creative_video"
                    className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
                      pathname === '/admin/prompts' && searchParams?.get('prompt') === 'creative_video'
                        ? 'bg-[#EFF4FF] text-[#0050FF] font-semibold'
                        : 'text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC]'
                    }`}
                  >
                    <Video className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span>Criativos de Vídeo</span>
                  </Link>

                  <Link
                    href="/admin/prompts?prompt=landing_pages"
                    className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
                      pathname === '/admin/prompts' && searchParams?.get('prompt') === 'landing_pages'
                        ? 'bg-[#EFF4FF] text-[#0050FF] font-semibold'
                        : 'text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC]'
                    }`}
                  >
                    <Globe className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Landing Pages</span>
                  </Link>
                </div>
              )}
            </div>

            {/* Membros & Convites da Equipe Master */}
            <Link
              href="/admin/usuarios"
              className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all group ${
                pathname === '/admin/usuarios'
                  ? 'bg-[#EFF4FF] text-[#0050FF] font-semibold shadow-xs'
                  : 'text-[#475569] hover:text-[#0F172A] hover:bg-[#F8FAFC]'
              }`}
            >
              <div className="flex items-center gap-3">
                <UserPlus className={`w-4 h-4 ${pathname === '/admin/usuarios' ? 'text-[#0050FF]' : 'text-[#64748B]'}`} />
                <span>Membros & Convites</span>
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
            {canAccessModule('midia') && (
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
            )}

            {/* Hub WhatsApp API COM SUBMENU (Seção 4.4) */}
            {canAccessModule('whatsapp') && (
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
                      <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
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
                      <Users2 className="w-3.5 h-3.5 shrink-0" />
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
                      <Send className="w-3.5 h-3.5 shrink-0" />
                      <span>Envio em Massa</span>
                    </Link>

                    <Link
                      href="/whatsapp?tab=tracking"
                      className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
                        pathname === '/whatsapp' && currentTab === 'tracking'
                          ? 'bg-[#EFF4FF] text-[#0050FF] font-semibold'
                          : 'text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC]'
                      }`}
                    >
                      <BarChart3 className="w-3.5 h-3.5 shrink-0" />
                      <span>Dashboard de Transmissões</span>
                    </Link>

                    <Link
                      href="/whatsapp?tab=ligacoes"
                      className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
                        pathname === '/whatsapp' && currentTab === 'ligacoes'
                          ? 'bg-[#EFF4FF] text-[#0050FF] font-semibold'
                          : 'text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC]'
                      }`}
                    >
                      <PhoneCall className="w-3.5 h-3.5 text-[#0050FF] shrink-0" />
                      <span>Ligações & Kommo CRM</span>
                    </Link>
                  </div>
                )}
              </div>
            )}

            {/* Design (Submenu: Landing Page & Criativos) */}
            {canAccessModule('criativos') && (
              <div>
                <button
                  onClick={() => toggleSubmenu('design')}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                    pathname === '/criativos'
                      ? 'text-[#0050FF] font-semibold'
                      : 'text-[#475569] hover:text-[#0F172A] hover:bg-[#F8FAFC]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Palette className={`w-4 h-4 ${pathname === '/criativos' ? 'text-[#0050FF]' : 'text-purple-600'}`} />
                    <span>Design</span>
                  </div>
                  {openSubmenus.design ? (
                    <ChevronDown className="w-3.5 h-3.5 text-[#64748B]" />
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5 text-[#94A3B8]" />
                  )}
                </button>

                {openSubmenus.design && (
                  <div className="ml-4 pl-3 border-l-2 border-[#E2E8F0] space-y-1 mt-1">
                    <Link
                      href="/criativos?tab=landing_page"
                      className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
                        pathname === '/criativos' && (currentTab === 'landing_page' || !currentTab)
                          ? 'bg-[#EFF4FF] text-[#0050FF] font-semibold'
                          : 'text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC]'
                      }`}
                    >
                      <Globe className="w-3.5 h-3.5 shrink-0" />
                      <span>Landing Page</span>
                    </Link>

                    <Link
                      href="/criativos?tab=criativos"
                      className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
                        pathname === '/criativos' && currentTab === 'criativos'
                          ? 'bg-[#EFF4FF] text-[#0050FF] font-semibold'
                          : 'text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC]'
                      }`}
                    >
                      <Sparkles className="w-3.5 h-3.5 shrink-0" />
                      <span>Criativos</span>
                    </Link>
                  </div>
                )}
              </div>
            )}

            {/* Pipeline CRM (Kommo) com Submenu */}
            {canAccessModule('crm') && (
              <div>
                <button
                  onClick={() => toggleSubmenu('crm')}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                    pathname === '/crm'
                      ? 'text-[#0050FF] font-semibold'
                      : 'text-[#475569] hover:text-[#0F172A] hover:bg-[#F8FAFC]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <KanbanSquare className={`w-4 h-4 ${pathname === '/crm' ? 'text-[#0050FF]' : 'text-blue-600'}`} />
                    <span>Pipeline CRM (Kommo)</span>
                  </div>
                  {openSubmenus.crm ? (
                    <ChevronDown className="w-3.5 h-3.5 text-[#64748B]" />
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5 text-[#94A3B8]" />
                  )}
                </button>

                {openSubmenus.crm && (
                  <div className="ml-4 pl-3 border-l-2 border-[#E2E8F0] space-y-1 mt-1">
                    {/* Visão Geral & Funil Principal */}
                    <Link
                      href="/crm"
                      className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
                        pathname === '/crm' && (!currentTab || currentTab === 'pipeline' || currentTab === 'funil')
                          ? 'bg-[#EFF4FF] text-[#0050FF] font-semibold'
                          : 'text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC]'
                      }`}
                    >
                      <KanbanSquare className="w-3.5 h-3.5 shrink-0" />
                      <span>Visão Geral & Funil</span>
                    </Link>

                    {/* Atribuição: Origem */}
                    <Link
                      href="/crm?tab=origem"
                      className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
                        pathname === '/crm' && currentTab === 'origem'
                          ? 'bg-[#EFF4FF] text-[#0050FF] font-semibold'
                          : 'text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC]'
                      }`}
                    >
                      <Globe className="w-3.5 h-3.5 shrink-0" />
                      <span>Atribuição: Origem</span>
                    </Link>

                    {/* Atribuição: Campanha */}
                    <Link
                      href="/crm?tab=campanha"
                      className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
                        pathname === '/crm' && currentTab === 'campanha'
                          ? 'bg-[#EFF4FF] text-[#0050FF] font-semibold'
                          : 'text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC]'
                      }`}
                    >
                      <Target className="w-3.5 h-3.5 shrink-0" />
                      <span>Atribuição: Campanha</span>
                    </Link>

                    {/* Atribuição: Conjunto */}
                    <Link
                      href="/crm?tab=conjunto"
                      className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
                        pathname === '/crm' && currentTab === 'conjunto'
                          ? 'bg-[#EFF4FF] text-[#0050FF] font-semibold'
                          : 'text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC]'
                      }`}
                    >
                      <Layers className="w-3.5 h-3.5 shrink-0" />
                      <span>Atribuição: Conjunto</span>
                    </Link>

                    {/* Atribuição: Criativo */}
                    <Link
                      href="/crm?tab=criativo"
                      className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
                        pathname === '/crm' && currentTab === 'criativo'
                          ? 'bg-[#EFF4FF] text-[#0050FF] font-semibold'
                          : 'text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC]'
                      }`}
                    >
                      <Sparkles className="w-3.5 h-3.5 shrink-0" />
                      <span>Atribuição: Criativo</span>
                    </Link>

                    {/* Atribuição: Termo de Busca */}
                    <Link
                      href="/crm?tab=termo"
                      className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
                        pathname === '/crm' && currentTab === 'termo'
                          ? 'bg-[#EFF4FF] text-[#0050FF] font-semibold'
                          : 'text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC]'
                      }`}
                    >
                      <Search className="w-3.5 h-3.5 shrink-0" />
                      <span>Atribuição: Termo de Busca</span>
                    </Link>

                    {/* Atribuição: Responsável */}
                    <Link
                      href="/crm?tab=responsavel"
                      className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
                        pathname === '/crm' && currentTab === 'responsavel'
                          ? 'bg-[#EFF4FF] text-[#0050FF] font-semibold'
                          : 'text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC]'
                      }`}
                    >
                      <Users2 className="w-3.5 h-3.5 shrink-0" />
                      <span>Atribuição: Responsável</span>
                    </Link>
                  </div>
                )}
              </div>
            )}

            {/* Financeiro Asaas */}
            {canAccessModule('financeiro') && (
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
            )}

            {/* Convidar Membro (Permitido conforme Seção 5 das Diretrizes) */}
            {isMasterAdmin && (
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
            )}
          </div>
        )}
      </nav>

      {/* Footer Helper */}
      <div className="p-3 border-t border-[#E2E8F0] bg-[#F8FAFC] space-y-2">
        {viewMode === 'client' ? (
          isMasterAdmin ? (
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
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px] text-[#64748B] px-1">
                <span className="flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Portal do Cliente</span>
                </span>
                <span className="text-[10px] text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  Ativo
                </span>
              </div>
            </div>
          )
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

        {isMasterAdmin && (
          <Link
            href="/login"
            className="w-full py-1.5 px-2 rounded-lg bg-white hover:bg-[#EFF4FF] text-[#64748B] hover:text-[#0050FF] border border-[#E2E8F0] hover:border-[#BFDBFE] shadow-xs text-[10px] font-semibold flex items-center justify-center gap-1.5 transition-all"
            title="Testar a tela de login"
          >
            <Smartphone className="w-3 h-3 text-[#0050FF]" />
            <span>Tela de Login (/login)</span>
          </Link>
        )}
      </div>
    </aside>
    </>
  );
}

export default function Sidebar({ isMobileOpen, onCloseMobile }: SidebarProps) {
  return (
    <Suspense
      fallback={
        <aside className="w-64 bg-white border-r border-[#E2E8F0] hidden md:flex flex-col h-screen sticky top-0 z-40 select-none font-sans" />
      }
    >
      <SidebarContent isMobileOpen={isMobileOpen} onCloseMobile={onCloseMobile} />
    </Suspense>
  );
}
