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
    <aside className="w-64 bg-[#0B0F19]/90 backdrop-blur-xl border-r border-slate-800/80 flex flex-col h-screen sticky top-0 z-40 select-none">
      {/* Brand Header */}
      <div className="p-4 border-b border-slate-800/80 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center overflow-hidden p-1 shadow-lg shadow-cyan-500/10">
            <img src="/logo.png" alt="Swiftsail Logo" className="w-full h-full object-contain" />
          </div>
          <div>
            <h1 className="font-bold text-slate-100 text-sm leading-tight tracking-wide">SWIFTSAIL</h1>
            <p className="text-[9px] text-cyan-400 font-medium tracking-wider uppercase">Enterprise OS</p>
          </div>
        </Link>
      </div>

      {/* Mode Switcher Tabs: Admin Master vs Cliente */}
      <div className="p-3 border-b border-slate-800/60 bg-slate-950/40">
        <div className="flex rounded-xl bg-slate-900/90 border border-slate-800 p-1">
          <button
            onClick={switchToAdminHQ}
            className={`flex-1 py-1.5 px-2 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all ${
              viewMode === 'admin'
                ? 'bg-gradient-to-r from-rose-500/20 to-amber-500/20 text-amber-300 border border-amber-500/30 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Crown className="w-3 h-3 text-amber-400" />
            <span>Admin HQ</span>
          </button>

          <button
            onClick={() => {
              setViewMode('client');
              if (selectedClientId === 'ALL' && clients.length > 0) {
                setSelectedClientId(clients[0].cliente_id);
              }
            }}
            className={`flex-1 py-1.5 px-2 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all ${
              viewMode === 'client'
                ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-300 border border-cyan-500/30 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Building className="w-3 h-3 text-cyan-400" />
            <span>Clientes</span>
          </button>
        </div>
      </div>

      {/* Dynamic Header / Selector according to Mode */}
      {viewMode === 'client' && (
        <div className="px-3 py-2.5 border-b border-slate-800/60 bg-cyan-950/10">
          <label className="block text-[10px] font-bold text-cyan-400 uppercase tracking-wider mb-1 flex items-center gap-1">
            <Building className="w-3 h-3" />
            Workspace Ativo
          </label>
          <select
            value={selectedClientId}
            onChange={(e) => setSelectedClientId(e.target.value)}
            className="w-full bg-slate-950 text-xs font-semibold text-slate-200 border border-cyan-500/30 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-cyan-400 transition-colors"
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
        <div className="px-4 py-2 border-b border-slate-800/40 bg-amber-950/10">
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-amber-300 uppercase tracking-wider">
            <ShieldCheck className="w-3 h-3 text-amber-400" />
            <span>Controle Master Agência</span>
          </div>
        </div>
      )}

      {/* Navigation Links */}
      <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-1">
        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-2 pb-1">
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
                  ? 'bg-gradient-to-r from-cyan-500/15 to-blue-500/10 text-cyan-300 border border-cyan-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={`w-4 h-4 transition-colors ${
                    isActive ? 'text-cyan-400' : 'text-slate-400 group-hover:text-slate-200'
                  }`}
                />
                <span>{item.label}</span>
              </div>
              {isActive && <ChevronRight className="w-3.5 h-3.5 text-cyan-400" />}
            </Link>
          );
        })}
      </nav>

      {/* Mode Switch Helper Footer */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-950/40 space-y-2">
        {viewMode === 'client' ? (
          <button
            onClick={switchToAdminHQ}
            className="w-full py-1.5 px-2 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all"
          >
            <Crown className="w-3.5 h-3.5 text-amber-400" />
            <span>Voltar ao Master Admin</span>
          </button>
        ) : (
          <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
            <span className="flex items-center gap-1">
              <Bot className="w-3.5 h-3.5 text-emerald-400" />
              <span>Sinapse IA</span>
            </span>
            <span className="text-[10px] text-emerald-400 font-mono">Pronto</span>
          </div>
        )}
      </div>
    </aside>
  );
}

