'use client';

import React, { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTenant } from '@/components/TenantProvider';
import { findClientBySlug, getClientSlug } from '@/lib/clientSlug';
import ClientDashboardView from '@/components/ClientDashboardView';
import { Building, AlertCircle, ArrowLeft, RefreshCw, ShieldAlert } from 'lucide-react';
import Link from 'next/link';

export default function ClientWorkspacePage() {
  const params = useParams();
  const router = useRouter();
  const slug = (params?.slug as string) || '';
  const { clients, availableClients, isMasterAdmin, isAuthChecked, currentUser, setViewMode, setSelectedClientId } = useTenant();

  const client = findClientBySlug(clients, slug);

  // Validação segura de permissão com tolerância a case e correspondência direta com o perfil
  const isAllowed = Boolean(
    isMasterAdmin ||
    (client && (
      availableClients.some((c) => c.cliente_id.toUpperCase() === client.cliente_id.toUpperCase()) ||
      (currentUser?.cliente_id && (
        String(currentUser.cliente_id).toUpperCase() === client.cliente_id.toUpperCase() ||
        String(currentUser.cliente_id).toLowerCase().replace(/_/g, '-') === client.cliente_id.toLowerCase().replace(/_/g, '-')
      )) ||
      (Array.isArray(currentUser?.cliente_ids) && currentUser.cliente_ids.some((id) => (
        String(id).toUpperCase() === client.cliente_id.toUpperCase() ||
        String(id).toLowerCase().replace(/_/g, '-') === client.cliente_id.toLowerCase().replace(/_/g, '-')
      )))
    ))
  );

  useEffect(() => {
    setViewMode('client');
    if (client && isAllowed) {
      setSelectedClientId(client.cliente_id);
    }
  }, [client, isAllowed, setViewMode, setSelectedClientId]);

  // Se a verificação terminou e o usuário não está autenticado, redireciona imediatamente para o login
  useEffect(() => {
    if (isAuthChecked && !currentUser) {
      router.replace(`/login?redirect=${encodeURIComponent(`/client/${slug}`)}`);
    }
  }, [isAuthChecked, currentUser, router, slug]);

  // Aguarda carregamento da autenticação e lista de clientes
  if (!isAuthChecked || !currentUser || clients.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-white border border-[#E2E8F0] rounded-2xl shadow-xs space-y-3 font-sans">
        <RefreshCw className="w-6 h-6 animate-spin text-[#0050FF]" />
        <p className="text-xs font-semibold text-[#64748B]">Verificando acesso e carregando workspace...</p>
      </div>
    );
  }

  // Se o usuário estiver autenticado e for cliente comum tentando acessar outro cliente pela URL
  if (client && !isAllowed) {
    const assignedClient = availableClients[0];
    const assignedSlug = assignedClient ? getClientSlug(assignedClient) : '';

    return (
      <div className="p-8 bg-white border border-[#E2E8F0] rounded-2xl shadow-xs space-y-4 max-w-xl mx-auto font-sans select-none">
        <div className="flex items-center gap-3 text-rose-600">
          <ShieldAlert className="w-6 h-6" />
          <h2 className="text-base font-bold text-[#0F172A]">Acesso Restrito ao Workspace</h2>
        </div>
        <p className="text-xs text-[#64748B] leading-relaxed">
          Você não possui permissão para acessar o workspace correspondente ao endereço <code className="text-rose-600 font-mono font-bold">"/client/{slug}"</code>. Seu acesso é restrito aos workspaces atribuídos ao seu usuário.
        </p>

        {assignedClient && (
          <div className="pt-4 border-t border-[#F1F5F9]">
            <Link
              href={`/client/${assignedSlug}`}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0050FF] hover:bg-[#0040D6] text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Ir para meu Workspace ({assignedClient.nome === 'EMOVERE' ? 'Emovere' : assignedClient.nome})</span>
            </Link>
          </div>
        )}
      </div>
    );
  }

  if (!client && clients.length > 0) {
    const allowedList = isMasterAdmin ? clients : availableClients;

    return (
      <div className="p-8 bg-white border border-[#E2E8F0] rounded-2xl shadow-xs space-y-4 max-w-xl mx-auto font-sans select-none">
        <div className="flex items-center gap-3 text-amber-600">
          <AlertCircle className="w-6 h-6" />
          <h2 className="text-base font-bold text-[#0F172A]">Workspace não localizado</h2>
        </div>
        <p className="text-xs text-[#64748B] leading-relaxed">
          Nenhum cliente foi encontrado para o endereço <code className="text-[#0050FF] font-mono font-bold">"/client/{slug}"</code>.
        </p>

        {allowedList.length > 0 && (
          <div className="pt-2">
            <p className="text-xs font-bold text-[#334155] mb-2">Workspaces disponíveis para você:</p>
            <div className="flex flex-wrap gap-2">
              {allowedList.map((c) => {
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
        )}

        <div className="pt-4 border-t border-[#F1F5F9]">
          <Link
            href="/client"
            className="inline-flex items-center gap-2 text-xs font-bold text-[#0050FF] hover:underline"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Ver meus workspaces</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <ClientDashboardView currentClient={client} isAdminInspection={false} />
  );
}
