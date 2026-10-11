'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Smartphone, ArrowRight, ShieldCheck, Crown, Building, CheckCircle2 } from 'lucide-react';
import { useTenant } from '@/components/TenantProvider';
import { getClientSlug } from '@/lib/clientSlug';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const { clients } = useTenant();
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState(false);

  // Formata o telefone dinamicamente no padrão brasileiro (XX) 9XXXX-XXXX
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let digits = e.target.value.replace(/\D/g, '');
    if (digits.length > 11) digits = digits.slice(0, 11);

    let formatted = digits;
    if (digits.length > 2) {
      formatted = `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    }
    if (digits.length > 7) {
      formatted = `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
    }
    setPhone(formatted);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const rawDigits = phone.replace(/\D/g, '');
    if (rawDigits.length < 10) {
      alert('Por favor, informe seu celular com DDD (mínimo 10 dígitos).');
      return;
    }

    setIsLoading(true);
    // Salva no localStorage para simulação de sessão
    try {
      localStorage.setItem('swiftsail_user_phone', rawDigits);
    } catch {}

    setTimeout(() => {
      setIsLoading(false);
      setSuccessMsg(true);
      // Redireciona para o admin ou cliente por padrão
      setTimeout(() => {
        router.push('/admin');
      }, 700);
    }, 600);
  };

  return (
    <div className="w-full min-h-screen flex items-center justify-center p-4 sm:p-6 bg-[#F8FAFC] font-sans select-none">
      <div className="w-full max-w-md space-y-6">
        {/* Brand & Logo */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#EFF4FF] border border-[#BFDBFE] p-2 shadow-xs mb-1">
            <img src="/logo.png" alt="Swiftsail Logo" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[#0F172A]">SWIFTSAIL</h1>
          <p className="text-xs font-semibold text-[#0050FF] uppercase tracking-wider">
            Enterprise OS • Portal de Acesso
          </p>
        </div>

        {/* Main Login Card */}
        <div className="bg-white border border-[#E2E8F0] p-6 sm:p-8 rounded-3xl shadow-sm space-y-6">
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-[#0F172A]">Identificação</h2>
            <p className="text-xs text-[#64748B]">
              Informe seu celular com DDD para acessar a plataforma.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="celular" className="block text-xs font-bold text-[#334155] uppercase tracking-wider">
                Celular com DDD
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#94A3B8]">
                  <Smartphone className="w-4 h-4 text-[#0050FF]" />
                </div>
                <input
                  id="celular"
                  type="tel"
                  placeholder="(11) 98765-4321"
                  value={phone}
                  onChange={handlePhoneChange}
                  autoFocus
                  required
                  className="w-full pl-10 pr-4 py-3 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl text-sm font-semibold text-[#0F172A] placeholder-[#94A3B8] focus:bg-white focus:outline-none focus:border-[#0050FF] focus:ring-2 focus:ring-[#0050FF]/20 transition-all"
                />
              </div>
              <p className="text-[11px] text-[#94A3B8]">
                Apenas números com DDD (ex: 11 98888-7777).
              </p>
            </div>

            {successMsg && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs font-semibold text-emerald-800">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Identificação validada! Entrando na plataforma...</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading || successMsg}
              className="w-full py-3 px-4 rounded-xl font-bold text-xs bg-[#0050FF] hover:bg-[#0040D6] active:bg-[#0038B8] text-white flex items-center justify-center gap-2 transition-all shadow-xs disabled:opacity-60 cursor-pointer"
            >
              {isLoading ? (
                <span>Validando acesso...</span>
              ) : (
                <>
                  <span>Acessar Plataforma</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Atalhos Rápidos para Testar Todas as Views */}
          <div className="pt-4 border-t border-[#F1F5F9] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider">
                Ambiente de Testes (URLs Diretas)
              </span>
              <span className="text-[10px] bg-[#EFF4FF] text-[#0050FF] font-bold px-2 py-0.5 rounded-full border border-[#BFDBFE]">
                Livre
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <Link
                href="/admin"
                className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] hover:border-[#0050FF] hover:bg-[#EFF4FF]/40 transition-all flex flex-col items-center text-center gap-1.5 group cursor-pointer"
              >
                <div className="w-7 h-7 rounded-lg bg-white border border-[#E2E8F0] flex items-center justify-center text-[#0050FF] shadow-xs">
                  <Crown className="w-3.5 h-3.5" />
                </div>
                <div>
                  <span className="text-xs font-bold text-[#0F172A] block">Visão Admin</span>
                  <span className="text-[10px] text-[#64748B]">/admin</span>
                </div>
              </Link>

              <Link
                href="/client"
                className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] hover:border-[#0050FF] hover:bg-[#EFF4FF]/40 transition-all flex flex-col items-center text-center gap-1.5 group cursor-pointer"
              >
                <div className="w-7 h-7 rounded-lg bg-white border border-[#E2E8F0] flex items-center justify-center text-[#0050FF] shadow-xs">
                  <Building className="w-3.5 h-3.5" />
                </div>
                <div>
                  <span className="text-xs font-bold text-[#0F172A] block">Visão Cliente</span>
                  <span className="text-[10px] text-[#64748B]">/client</span>
                </div>
              </Link>
            </div>

            {/* Testes diretos por cliente */}
            {clients && clients.length > 0 && (
              <div className="pt-2">
                <p className="text-[10px] font-semibold text-[#64748B] mb-1.5">
                  Testar direto por cliente cadastrado:
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {clients.slice(0, 4).map((c) => {
                    const slug = getClientSlug(c);
                    return (
                      <Link
                        key={c.cliente_id}
                        href={`/client/${slug}`}
                        className="px-2.5 py-1 rounded-lg bg-[#F1F5F9] hover:bg-[#EFF4FF] border border-[#E2E8F0] hover:border-[#BFDBFE] text-[10px] font-semibold text-[#334155] hover:text-[#0050FF] transition-all"
                      >
                        {c.nome === 'EMOVERE' ? 'Emovere' : c.nome}
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Security Footer */}
        <div className="flex items-center justify-center gap-2 text-[11px] text-[#94A3B8]">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Swiftsail OS • Governança Segura Multi-tenant</span>
        </div>
      </div>
    </div>
  );
}
