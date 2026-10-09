'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
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
  Bot,
  Building,
  Users,
  Layers,
  Crown,
  ArrowLeftRight,
} from 'lucide-react';

import { useTenant } from './TenantProvider';

const ADMIN_NAV_ITEMS = [
  { href: '/', label: 'Dashboard Master (HQ)', icon: LayoutDashboard },
  { href: '/admin/clientes', label: 'Gestão de Clientes', icon: Building },
  { href: '/admin/usuarios', label: 'Usuários & Convites', icon: Users },
  { href: '/credenciais/admin', label: 'Credenciais Master Admin', icon: KeyRound },
];

const CLIENT_NAV_ITEMS = [
  { href: '/', label: 'Dashboard do Cliente', icon: LayoutDashboard },
  { href: '/midia', label: 'Tráfego & Anúncios', icon: Megaphone },
  { href: '/whatsapp', label: 'Hub WhatsApp & Uazapi', icon: MessageSquare },
  { href: '/criativos', label: 'Criativos & Landing Pages', icon: Sparkles },
  { href: '/crm', label: 'Pipeline CRM (Kommo)', icon: KanbanSquare },
  { href: '/financeiro', label: 'Financeiro (Asaas)', icon: CreditCard },
  { href: '/credenciais/cliente', label: 'Configurações & CRM', icon: KeyRound },
];

export default function Sidebar() {
  const pathname = usePathname();
  const {
    clients,
    selectedClientId,
    setSelectedClientId,
    viewMode,
    setViewMode,
    activeClient,
    switchToAdminHQ,
  } = useTenant();

  return (
    <aside className="w-64 bg-white border-r border-[#E2E8F0] flex flex-col h-screen sticky top-0 z-40 select-none">
      {/* Brand Header */}
      <div className="p-4 border-b border-[#E2E8F0] flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#EFF4FF] border border-[#BFDBFE] flex items-center justify-center overflow-hidden p-1 shadow-xs">
            <img src="/logo.png" alt="Swiftsail Logo" className="w-full h-full object-contain" />
          </div>
          <div>
            <h1 className="font-bold text-[#0F172A] text-sm leading-tight tracking-wide">SWIFTSAIL</h1>
            <p className="text-[9px] text-[#0050FF] font-bold tracking-wider uppercase">Enterprise OS</p>
          </div>
        </Link>
      </div>

      {/* Mode Switcher Tabs: Admin Master vs Cliente */}
      <div className="p-3 border-b border-[#E2E8F0] bg-[#F8FAFC]">
        <div className="flex rounded-xl bg-[#F1F5F9] border border-[#E2E8F0] p-1">
          <button
            onClick={switchToAdminHQ}
            className={`flex-1 py-1.5 px-2 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              viewMode === 'admin'
                ? 'bg-white text-[#0F172A] border border-[#E2E8F0] shadow-xs'
                : 'text-[#64748B] hover:text-[#0F172A]'
            }`}
          >
            <Crown className="w-3 h-3 text-[#0050FF]" />
            <span>Admin HQ</span>
          </button>

          <button
            onClick={() => {
              setViewMode('client');
              if (selectedClientId === 'ALL' && clients.length > 0) {
                setSelectedClientId(clients[0].cliente_id);
              }
            }}
            className={`flex-1 py-1.5 px-2 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              viewMode === 'client'
                ? 'bg-white text-[#0050FF] border border-[#BFDBFE] shadow-xs'
                : 'text-[#64748B] hover:text-[#0F172A]'
            }`}
          >
            <Building className="w-3 h-3 text-[#0050FF]" />
            <span>Clientes</span>
          </button>
        </div>
      </div>

      {/* Dynamic Header / Selector according to Mode */}
      {viewMode === 'client' && (
        <div className="px-3 py-2.5 border-b border-[#E2E8F0] bg-[#EFF4FF]/40">
          <label className="block text-[10px] font-bold text-[#0050FF] uppercase tracking-wider mb-1 flex items-center gap-1">
            <Building className="w-3 h-3" />
            Workspace Ativo
          </label>
          <select
            value={selectedClientId}
            onChange={(e) => setSelectedClientId(e.target.value)}
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

      {viewMode === 'admin' && (
        <div className="px-4 py-2 border-b border-[#E2E8F0] bg-[#F8FAFC]">
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-[#475569] uppercase tracking-wider">
            <ShieldCheck className="w-3.5 h-3.5 text-[#0050FF]" />
            <span>Controle Master Agência</span>
          </div>
        </div>
      )}

      {/* Navigation Links (Estilo Asaas: Item ativo com fundo azul claro e borda esquerda) */}
      <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-1">
        <div className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider px-3 pb-1">
          {viewMode === 'admin' ? 'Módulos de Governança' : `Navegação: ${activeClient?.nome || 'Cliente'}`}
        </div>

        {(viewMode === 'admin' ? ADMIN_NAV_ITEMS : CLIENT_NAV_ITEMS).map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href + item.label}
              href={item.href}
              className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all group ${
                isActive
                  ? 'bg-[#EFF4FF] text-[#0050FF] font-semibold shadow-xs'
                  : 'text-[#475569] hover:text-[#0F172A] hover:bg-[#F8FAFC]'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={`w-4 h-4 transition-colors ${
                    isActive ? 'text-[#0050FF]' : 'text-[#64748B] group-hover:text-[#0F172A]'
                  }`}
                />
                <span>{item.label}</span>
              </div>
              {isActive ? (
                <ChevronRight className="w-3.5 h-3.5 text-[#0050FF]" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5 text-[#CBD5E1] opacity-0 group-hover:opacity-100 transition-opacity" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Mode Switch Helper Footer */}
      <div className="p-3 border-t border-[#E2E8F0] bg-[#F8FAFC] space-y-2">
        {viewMode === 'client' ? (
          <button
            onClick={switchToAdminHQ}
            className="w-full py-1.5 px-2 rounded-lg bg-white hover:bg-slate-50 text-[#0F172A] border border-[#E2E8F0] shadow-xs text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
          >
            <Crown className="w-3.5 h-3.5 text-[#0050FF]" />
            <span>Voltar ao Master Admin</span>
          </button>
        ) : (
          <div className="flex items-center justify-between text-[11px] text-[#64748B] px-1">
            <span className="flex items-center gap-1">
              <Bot className="w-3.5 h-3.5 text-emerald-500" />
              <span>Sinapse IA</span>
            </span>
            <span className="text-[10px] text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              Operacional
            </span>
          </div>
        )}
      </div>
    </aside>
  );
}

