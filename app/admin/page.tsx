'use client';

import React, { useState, useEffect } from 'react';
import { useTenant } from '@/components/TenantProvider';
import { getClientSlug } from '@/lib/clientSlug';
import {
  Crown,
  Building,
  Users,
  Search,
  ExternalLink,
  Eye,
  ShieldCheck,
  KeyRound,
  Bot,
  Sliders,
  ArrowRight,
  CheckCircle2,
  Clock,
  Zap,
  MessageSquare,
} from 'lucide-react';
import Link from 'next/link';

export default function AdminHQPage() {
  const { clients, adAccounts, users, setViewMode, setSelectedClientId } = useTenant();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ativo' | 'pausado' | 'encerrado'>('ALL');

  // Assegura que o modo Admin está ativado ao acessar esta página
  useEffect(() => {
    setViewMode('admin');
  }, [setViewMode]);

  // Contadores
  const totalClients = clients.length;
  const activeClients = clients.filter((c) => c.status === 'ativo').length;
  const pausedClients = clients.filter((c) => c.status === 'pausado').length;
  const totalAccounts = adAccounts.length;

  const filteredClients = clients.filter((c) => {
    const matchesSearch =
      c.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.cliente_id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 font-sans select-none">
      {/* Top Banner / Governança Master Admin */}
      <div className="bg-white border border-[#E2E8F0] p-6 rounded-2xl shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-[10px] font-bold border uppercase tracking-wider flex items-center gap-1.5 bg-[#EFF4FF] text-[#0050FF] border-[#BFDBFE]">
              <Crown className="w-3.5 h-3.5 text-[#0050FF]" />
              Governança Master Admin
            </span>
            <span className="text-xs text-[#64748B]">Hierarquia Soberana • Swiftsail HQ</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#0F172A] tracking-tight">
            Painel Administrativo
          </h1>
          <p className="text-xs text-[#64748B] max-w-xl leading-relaxed">
            Controle unificado da carteira de clientes, permissões, credenciais e inspeção de workspaces.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            href="/admin/notificacoes"
            className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-[#F8FAFC] hover:bg-[#EFF4FF] text-[#0F172A] hover:text-[#0050FF] border border-[#E2E8F0] hover:border-[#BFDBFE] flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
          >
            <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
            <span>Notificações de Serviço</span>
          </Link>

          <Link
            href="/admin/ia"
            className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-[#F8FAFC] hover:bg-[#EFF4FF] text-[#0F172A] hover:text-[#0050FF] border border-[#E2E8F0] hover:border-[#BFDBFE] flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
          >
            <Bot className="w-3.5 h-3.5 text-[#0050FF]" />
            <span>Módulo de IA</span>
          </Link>

          <Link
            href="/admin/clientes"
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#0050FF] hover:bg-[#0040D6] text-white flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
          >
            <Building className="w-3.5 h-3.5" />
            <span>Gestão Completa</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards de Clientes */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-[#E2E8F0] p-5 rounded-2xl shadow-xs space-y-2">
          <div className="flex items-center justify-between text-[#64748B]">
            <span className="text-xs font-semibold uppercase tracking-wider">Total de Clientes</span>
            <Building className="w-4 h-4 text-[#0050FF]" />
          </div>
          <p className="text-2xl font-bold text-[#0F172A]">{totalClients}</p>
          <p className="text-[11px] text-[#64748B]">Cadastrados no banco</p>
        </div>

        <div className="bg-white border border-[#E2E8F0] p-5 rounded-2xl shadow-xs space-y-2">
          <div className="flex items-center justify-between text-[#64748B]">
            <span className="text-xs font-semibold uppercase tracking-wider">Clientes Ativos</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-bold text-emerald-600">{activeClients}</p>
          <p className="text-[11px] text-[#64748B]">Operações em andamento</p>
        </div>

        <div className="bg-white border border-[#E2E8F0] p-5 rounded-2xl shadow-xs space-y-2">
          <div className="flex items-center justify-between text-[#64748B]">
            <span className="text-xs font-semibold uppercase tracking-wider">Pausados / Encerrados</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-2xl font-bold text-amber-600">{pausedClients}</p>
          <p className="text-[11px] text-[#64748B]">Status temporário ou inativo</p>
        </div>

        <div className="bg-white border border-[#E2E8F0] p-5 rounded-2xl shadow-xs space-y-2">
          <div className="flex items-center justify-between text-[#64748B]">
            <span className="text-xs font-semibold uppercase tracking-wider">Contas de Tráfego</span>
            <Zap className="w-4 h-4 text-purple-600" />
          </div>
          <p className="text-2xl font-bold text-purple-600">{totalAccounts}</p>
          <p className="text-[11px] text-[#64748B]">Meta Ads & Google Ads</p>
        </div>
      </div>

      {/* Tabela / Cards de Clientes com Teste de URLs */}
      <div className="bg-white border border-[#E2E8F0] p-6 rounded-2xl shadow-xs space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#F1F5F9] pb-4">
          <div>
            <h2 className="text-sm font-bold text-[#0F172A] flex items-center gap-2">
              <Building className="w-4 h-4 text-[#0050FF]" />
              Carteira de Clientes & Acessos de Teste
            </h2>
            <p className="text-xs text-[#64748B]">
              Selecione se deseja acessar como <strong>Admin</strong> (inspeção) ou como <strong>Cliente</strong> (visão do cliente)
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
              <input
                type="text"
                placeholder="Buscar cliente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl focus:bg-white focus:outline-none focus:border-[#0050FF] shadow-xs"
              />
            </div>

            <div className="flex rounded-xl bg-[#F1F5F9] p-1 border border-[#E2E8F0] text-xs">
              <button
                onClick={() => setStatusFilter('ALL')}
                className={`px-2.5 py-1 rounded-lg font-semibold cursor-pointer ${
                  statusFilter === 'ALL' ? 'bg-white text-[#0050FF] shadow-xs' : 'text-[#64748B]'
                }`}
              >
                Todos
              </button>
              <button
                onClick={() => setStatusFilter('ativo')}
                className={`px-2.5 py-1 rounded-lg font-semibold cursor-pointer ${
                  statusFilter === 'ativo' ? 'bg-white text-emerald-600 shadow-xs' : 'text-[#64748B]'
                }`}
              >
                Ativos
              </button>
              <button
                onClick={() => setStatusFilter('pausado')}
                className={`px-2.5 py-1 rounded-lg font-semibold cursor-pointer ${
                  statusFilter === 'pausado' ? 'bg-white text-amber-600 shadow-xs' : 'text-[#64748B]'
                }`}
              >
                Pausados
              </button>
            </div>
          </div>
        </div>

        {/* Grade de Clientes */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredClients.map((client) => {
            const slug = getClientSlug(client);
            const clientAccounts = adAccounts.filter(
              (a) => a.cliente_id === client.cliente_id || a.group_jid === client.grupo_whatsapp_id
            );

            return (
              <div
                key={client.cliente_id}
                className="p-5 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] hover:border-[#BFDBFE] transition-all flex flex-col justify-between gap-4 shadow-xs"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                        client.status === 'ativo'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : client.status === 'pausado'
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-slate-100 text-[#64748B] border-slate-200'
                      }`}
                    >
                      {client.status}
                    </span>
                    <span className="text-[10px] font-mono text-[#94A3B8]">{client.cliente_id}</span>
                  </div>

                  <div>
                    <h3 className="font-bold text-[#0F172A] text-sm leading-snug">
                      {client.nome === 'EMOVERE' ? 'Emovere' : client.nome}
                    </h3>
                    <p className="text-[11px] text-[#64748B] mt-0.5">
                      Slug: <code className="text-[#0050FF] font-mono">{slug}</code>
                    </p>
                  </div>

                  <div className="flex items-center gap-3 pt-2 text-[11px] text-[#64748B] border-t border-[#E2E8F0]/70">
                    <div className="flex items-center gap-1">
                      <Zap className="w-3.5 h-3.5 text-[#0050FF]" />
                      <span>{clientAccounts.length} contas de anúncio</span>
                    </div>
                    {client.grupo_whatsapp_id && (
                      <div className="flex items-center gap-1 text-emerald-600">
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>WhatsApp</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Botões de Ação para Testar Hierarquia de URLs */}
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#E2E8F0]">
                  <Link
                    href={`/admin/client/${slug}`}
                    className="py-2 px-2.5 rounded-xl bg-white hover:bg-[#EFF4FF] border border-[#CBD5E1] hover:border-[#BFDBFE] text-[#0050FF] text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer"
                    title="Acessar com perfil de Administrador inspecionando este cliente"
                  >
                    <Crown className="w-3.5 h-3.5" />
                    <span>Admin View</span>
                  </Link>

                  <Link
                    href={`/client/${slug}`}
                    className="py-2 px-2.5 rounded-xl bg-[#0050FF] hover:bg-[#0040D6] text-white text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer"
                    title="Acessar exatamente na visão que o cliente possui"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Client View</span>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
