'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { useTenant } from '@/components/TenantProvider';
import { ShieldAlert, ArrowLeft, RefreshCw } from 'lucide-react';
import Link from 'next/link';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { isMasterAdmin, isAuthChecked, availableClients } = useTenant();

  // /admin/usuarios é permitido para cliente_admin gerenciar os membros da sua própria empresa
  const isUsuariosPage = pathname === '/admin/usuarios';

  if (!isAuthChecked) {
    return (
      <div className="flex items-center justify-center p-12 bg-white border border-[#E2E8F0] rounded-2xl shadow-xs">
        <RefreshCw className="w-5 h-5 animate-spin text-[#0050FF]" />
      </div>
    );
  }

  // Se não for Master Admin e tentar acessar qualquer página de governança, bloqueia e protege
  if (!isMasterAdmin && !isUsuariosPage) {
    return (
      <div className="p-8 bg-white border border-[#E2E8F0] rounded-2xl shadow-xs space-y-4 max-w-xl mx-auto font-sans select-none">
        <div className="flex items-center gap-3 text-rose-600">
          <ShieldAlert className="w-6 h-6 text-rose-600" />
          <h2 className="text-base font-bold text-[#0F172A]">Acesso Restrito à Agência</h2>
        </div>
        <p className="text-xs text-[#64748B] leading-relaxed">
          O painel de governança, chaves de API e configurações globais são de uso exclusivo da Administração Master da Swiftsail.
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

  return <>{children}</>;
}
