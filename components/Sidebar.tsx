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
  Bot
} from 'lucide-react';
import { useTenant } from './TenantProvider';

const NAV_ITEMS = [
  { href: '/', label: 'Dashboard Executivo', icon: LayoutDashboard },
  { href: '/midia', label: 'Tráfego & Anúncios', icon: Megaphone },
  { href: '/whatsapp', label: 'Hub WhatsApp & Uazapi', icon: MessageSquare },
  { href: '/criativos', label: 'Criativos & Landing Pages', icon: Sparkles },

  { href: '/crm', label: 'Pipeline CRM (Kommo)', icon: KanbanSquare },
  { href: '/financeiro', label: 'Financeiro (Asaas)', icon: CreditCard },
  { href: '/credenciais', label: 'Credenciais & API Keys', icon: KeyRound },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { clients, selectedClientId, setSelectedClientId } = useTenant();

  return (
    <aside className="w-64 bg-[#0B0F19]/90 backdrop-blur-xl border-r border-slate-800/80 flex flex-col h-screen sticky top-0 z-40">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800/80 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center overflow-hidden p-1 shadow-lg shadow-cyan-500/10">
            <img src="/logo.png" alt="Swiftsail Logo" className="w-full h-full object-contain" />
          </div>
          <div>
            <h1 className="font-bold text-slate-100 text-base leading-tight tracking-wide">SWIFTSAIL</h1>
            <p className="text-[10px] text-cyan-400 font-medium tracking-wider uppercase">Enterprise OS</p>
          </div>
        </Link>
      </div>


      {/* Tenant Selector in Sidebar */}
      <div className="px-4 py-3 border-b border-slate-800/60 bg-slate-900/30">
        <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
          Cliente / Workspace
        </label>
        <select
          value={selectedClientId}
          onChange={(e) => setSelectedClientId(e.target.value)}
          className="w-full bg-slate-950/80 text-xs font-medium text-slate-200 border border-slate-700/80 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-cyan-500 transition-colors"
        >
          <option value="ALL">🏢 Todos os Clientes (Visão Geral)</option>
          {clients.map((c) => (
            <option key={c.cliente_id} value={c.cliente_id}>
              {c.nome} {c.status === 'ativo' ? '🟢' : '⚪'}
            </option>
          ))}
        </select>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all group ${
                isActive
                  ? 'bg-gradient-to-r from-cyan-500/15 to-blue-500/10 text-cyan-300 border border-cyan-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 transition-colors ${isActive ? 'text-cyan-400' : 'text-slate-400 group-hover:text-slate-200'}`} />
                <span>{item.label}</span>
              </div>
              {isActive && <ChevronRight className="w-3.5 h-3.5 text-cyan-400" />}
            </Link>
          );
        })}
      </nav>

      {/* Agent Status Footer */}
      <div className="p-4 border-t border-slate-800/80 bg-slate-950/40">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Bot className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-semibold text-slate-200">Sinapse Agente</span>
          </div>
          <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            Sincronizado
          </span>
        </div>
        <p className="text-[11px] text-slate-400 truncate">Supabase Project: mabsjjdajusfbmbudptd</p>
      </div>
    </aside>
  );
}
