'use client';

import React, { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTenant } from '@/components/TenantProvider';
import { findClientBySlug, getClientSlug } from '@/lib/clientSlug';
import ClientDashboardView from '@/components/ClientDashboardView';
import { Crown, AlertCircle, ArrowLeft, RefreshCw, Building } from 'lucide-react';
import Link from 'next/link';

export default function AdminClientInspectPage() {
  const params = useParams();
  const router = useRouter();
  const slug = (params?.slug as string) || '';
  const { clients, isMasterAdmin, isAuthChecked, setViewMode, setSelectedClientId } = useTenant();

  const client = findClientBySlug(clients, slug);

  useEffect(() => {
    if (isMasterAdmin) {
      setViewMode('admin');
      if (client) {
        setSelectedClientId(client.cliente_id);
      }
    }
  }, [client, isMasterAdmin, setViewMode, setSelectedClientId]);

  if (!isAuthChecked || (!client && clients.length === 0)) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-white border border-[#E2E8F0] rounded-2xl shadow-xs space-y-3 font-sans">
        <RefreshCw className="w-6 h-6 animate-spin text-[#0050FF]" />
        <p className="text-xs font-semibold text-[#64748B]">Carregando dados da carteira...</p>
      </div>
    );
  }

  if (!isMasterAdmin) {
    return (
      <div className="p-8 bg-white border border-[#E2E8F0] rounded-2xl shadow-xs space-y-4 max-w-xl mx-auto font-sans select-none">
        <div className="flex items-center gap-3 text-rose-600">
          <AlertCircle className="w-6 h-6 text-rose-600" />
          <h2 className="text-base font-bold text-[#0F172A]">Acesso Restrito ao Master Admin</h2>
        </div>
        <p className="text-xs text-[#64748B] leading-relaxed">
          A inspeção administrativa de workspaces de clientes é exclusiva da equipe interna da agência Swiftsail.
        </p>
        <div className="pt-2 border-t border-[#F1F5F9]">
          <Link
            href="/client"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0050FF] hover:bg-[#0040D6] text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Voltar ao Portal do Cliente</span>
          </Link>
        </div>
      </div>
    );
  }

  if (!client && clients.length > 0) {
    return (
      <div className="p-8 bg-white border border-[#E2E8F0] rounded-2xl shadow-xs space-y-4 max-w-xl mx-auto font-sans select-none">
        <div className="flex items-center gap-3 text-amber-600">
          <AlertCircle className="w-6 h-6" />
          <h2 className="text-base font-bold text-[#0F172A]">Cliente não encontrado</h2>
        </div>
        <p className="text-xs text-[#64748B] leading-relaxed">
          Nenhum cliente foi localizado com o identificador <code className="text-[#0050FF] font-mono font-bold">"{slug}"</code>.
        </p>

        <div className="pt-2">
          <p className="text-xs font-bold text-[#334155] mb-2">Clientes disponíveis para teste:</p>
          <div className="flex flex-wrap gap-2">
            {clients.map((c) => {
              const cSlug = getClientSlug(c);
              return (
                <Link
                  key={c.cliente_id}
                  href={`/admin/client/${cSlug}`}
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
            href="/admin"
            className="inline-flex items-center gap-2 text-xs font-bold text-[#0050FF] hover:underline"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Voltar ao Painel Admin HQ</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <ClientDashboardView currentClient={client} isAdminInspection={true} />
  );
}
