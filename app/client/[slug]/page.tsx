'use client';

import React, { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTenant } from '@/components/TenantProvider';
import { findClientBySlug, getClientSlug } from '@/lib/clientSlug';
import ClientDashboardView from '@/components/ClientDashboardView';
import { Building, AlertCircle, ArrowLeft, RefreshCw } from 'lucide-react';
import Link from 'next/link';

export default function ClientWorkspacePage() {
  const params = useParams();
  const router = useRouter();
  const slug = (params?.slug as string) || '';
  const { clients, setViewMode, setSelectedClientId } = useTenant();

  const client = findClientBySlug(clients, slug);

  useEffect(() => {
    setViewMode('client');
    if (client) {
      setSelectedClientId(client.cliente_id);
    }
  }, [client, setViewMode, setSelectedClientId]);

  if (!client && clients.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-white border border-[#E2E8F0] rounded-2xl shadow-xs space-y-3 font-sans">
        <RefreshCw className="w-6 h-6 animate-spin text-[#0050FF]" />
        <p className="text-xs font-semibold text-[#64748B]">Carregando workspace do cliente...</p>
      </div>
    );
  }

  if (!client && clients.length > 0) {
    return (
      <div className="p-8 bg-white border border-[#E2E8F0] rounded-2xl shadow-xs space-y-4 max-w-xl mx-auto font-sans select-none">
        <div className="flex items-center gap-3 text-amber-600">
          <AlertCircle className="w-6 h-6" />
          <h2 className="text-base font-bold text-[#0F172A]">Workspace não localizado</h2>
        </div>
        <p className="text-xs text-[#64748B] leading-relaxed">
          Nenhum cliente foi encontrado para o endereço <code className="text-[#0050FF] font-mono font-bold">"/client/{slug}"</code>.
        </p>

        <div className="pt-2">
          <p className="text-xs font-bold text-[#334155] mb-2">Workspaces disponíveis:</p>
          <div className="flex flex-wrap gap-2">
            {clients.map((c) => {
              const cSlug = getClientSlug(c);
              return (
                <Link
                  key={c.cliente_id}
                  href={`/client/${cSlug}`}
                  className="px-3 py-1.5 rounded-xl bg-[#EFF4FF] hover:bg-[#E0EAFF] border border-[#BFDBFE] text-xs font-semibold text-[#0050FF] transition-all"
                >
                  {c.nome === 'EMOVERE' ? 'Emovere' : c.nome}
                </Link>
              );
            })}
          </div>
        </div>

        <div className="pt-4 border-t border-[#F1F5F9]">
          <Link
            href="/client"
            className="inline-flex items-center gap-2 text-xs font-bold text-[#0050FF] hover:underline"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Ver todos os workspaces</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <ClientDashboardView currentClient={client} isAdminInspection={false} />
  );
}
