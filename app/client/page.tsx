'use client';

import React, { useEffect } from 'react';
import { useTenant } from '@/components/TenantProvider';
import { getClientSlug } from '@/lib/clientSlug';
import {
  Building,
  ArrowRight,
  Crown,
  Zap,
  MessageSquare,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import Link from 'next/link';

export default function ClientPortalDirectoryPage() {
  const { clients, adAccounts, setViewMode } = useTenant();

  useEffect(() => {
    setViewMode('client');
  }, [setViewMode]);

  const activeClients = clients.filter((c) => c.status === 'ativo');
  const firstClient = activeClients[0] || clients[0];
  const firstSlug = firstClient ? getClientSlug(firstClient) : '';

  return (
    <div className="space-y-6 font-sans select-none">
      {/* Top Banner / Portal do Cliente */}
      <div className="bg-white border border-[#E2E8F0] p-6 rounded-2xl shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-[10px] font-bold border uppercase tracking-wider flex items-center gap-1.5 bg-[#EFF4FF] text-[#0050FF] border-[#BFDBFE]">
              <Building className="w-3.5 h-3.5 text-[#0050FF]" />
              Portal do Cliente • Swiftsail
            </span>
            <span className="text-xs text-[#64748B]">Ambiente de Testes de Views</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#0F172A] tracking-tight">
            Workspaces dos Clientes
          </h1>
          <p className="text-xs text-[#64748B] max-w-xl leading-relaxed">
            Selecione o workspace do cliente que deseja testar para visualizar a experiência individual completa.
          </p>
        </div>

        {firstClient && (
          <Link
            href={`/client/${firstSlug}`}
            className="px-5 py-2.5 rounded-full text-xs font-semibold bg-[#0050FF] hover:bg-[#0040D6] text-white flex items-center gap-2 transition-all shadow-xs cursor-pointer self-start md:self-auto"
          >
            <span>Acessar {firstClient.nome === 'EMOVERE' ? 'Emovere' : firstClient.nome}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        )}
      </div>

      {/* Grid de Workspaces */}
      <div className="bg-white border border-[#E2E8F0] p-6 rounded-2xl shadow-xs space-y-4">
        <div className="border-b border-[#F1F5F9] pb-3 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-[#0F172A] flex items-center gap-2">
              <Building className="w-4 h-4 text-[#0050FF]" />
              Clientes Disponíveis ({clients.length})
            </h2>
            <p className="text-xs text-[#64748B]">
              Clique em qualquer card para abrir a URL hierárquica correspondente
            </p>
          </div>

          <Link
            href="/admin"
            className="text-xs font-bold text-[#64748B] hover:text-[#0050FF] flex items-center gap-1.5 transition-colors"
          >
            <Crown className="w-3.5 h-3.5 text-[#0050FF]" />
            <span>Voltar ao Admin HQ</span>
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
          {clients.map((client) => {
            const slug = getClientSlug(client);
            const clientAccounts = adAccounts.filter(
              (a) => a.cliente_id === client.cliente_id || a.group_jid === client.grupo_whatsapp_id
            );

            return (
              <Link
                key={client.cliente_id}
                href={`/client/${slug}`}
                className="p-5 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] hover:border-[#0050FF] hover:bg-[#EFF4FF]/20 transition-all group flex flex-col justify-between gap-4 cursor-pointer shadow-xs"
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
                    <span className="text-[10px] font-mono text-[#0050FF] group-hover:underline">
                      /client/{slug}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-bold text-[#0F172A] text-sm group-hover:text-[#0050FF] transition-colors">
                      {client.nome === 'EMOVERE' ? 'Emovere' : client.nome}
                    </h3>
                    <p className="text-[11px] text-[#64748B] mt-0.5">
                      Identificador: <span className="font-mono">{client.cliente_id}</span>
                    </p>
                  </div>
                </div>

                <div className="pt-2 border-t border-[#E2E8F0] flex items-center justify-between text-xs font-semibold text-[#0050FF]">
                  <div className="flex items-center gap-2 text-[11px] text-[#64748B]">
                    <span>{clientAccounts.length} contas de anúncio</span>
                  </div>
                  <div className="flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                    <span>Acessar Workspace</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
