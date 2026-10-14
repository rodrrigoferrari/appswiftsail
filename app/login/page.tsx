'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import {
  MessageSquare,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Phone,
  KeyRound,
  ArrowLeft,
  Sparkles,
} from 'lucide-react';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [ddi, setDdi] = useState('+55');
  const [localNumber, setLocalNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [infoMessage, setInfoMessage] = useState('');
  const [countdown, setCountdown] = useState(0);

  // Preenche telefone se vier na URL (?phone=...)
  useEffect(() => {
    const queryPhone = searchParams.get('phone') || searchParams.get('whatsapp');
    if (queryPhone) {
      let clean = queryPhone.replace(/\D/g, '');
      if (clean.startsWith('55') && clean.length > 11) {
        clean = clean.slice(2);
      }
      setLocalNumber(formatPhone(clean));
    }
  }, [searchParams]);

  // Contagem regressiva para reenvio
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const formatPhone = (digits: string) => {
    let clean = digits.replace(/\D/g, '').slice(0, 11);
    if (clean.length > 7) {
      return `(${clean.slice(0, 2)}) ${clean.slice(2, 7)}-${clean.slice(7)}`;
    }
    if (clean.length > 2) {
      return `(${clean.slice(0, 2)}) ${clean.slice(2)}`;
    }
    return clean;
  };

  const handlePhoneInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalNumber(formatPhone(e.target.value));
  };

  const getFullPhone = () => {
    const rawLocal = localNumber.replace(/\D/g, '');
    const cleanDdi = ddi.replace(/\D/g, '');
    return `${cleanDdi}${rawLocal}`;
  };

  // Etapa 1: Solicitar código OTP via WhatsApp
  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const rawLocal = localNumber.replace(/\D/g, '');
    if (rawLocal.length < 10) {
      setErrorMessage('Por favor, informe seu celular com DDD (ex: 41 99233-2996).');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');
    setInfoMessage('');

    try {
      const fullPhone = getFullPhone();
      const res = await fetch('/api/auth/request-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: fullPhone }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Falha ao solicitar código no WhatsApp.');
      }

      setStep('otp');
      setCountdown(60);
      setInfoMessage(
        data.message || 'Código enviado! Verifique as mensagens no seu WhatsApp com o botão de cópia.'
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao enviar código de acesso.';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  // Etapa 2: Validar o código OTP e gravar a sessão no navegador
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = otp.replace(/\D/g, '').trim();
    if (cleanCode.length !== 6) {
      setErrorMessage('Digite o código de 6 dígitos recebido.');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    try {
      const fullPhone = getFullPhone();
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: fullPhone, code: cleanCode }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Código incorreto ou expirado.');
      }

      // Grava sessão no cliente Supabase via SSR
      if (data.session && process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        try {
          const supabase = createBrowserClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
          );
          await supabase.auth.setSession(data.session);
        } catch (sessionErr) {
          console.warn('[Supabase Session Warning]:', sessionErr);
        }
      }

      // Salva identificação local de backup
      try {
        localStorage.setItem('swiftsail_user_phone', fullPhone);
        if (data.user) {
          localStorage.setItem('swiftsail_user', JSON.stringify(data.user));
          if (data.user.role === 'master_admin') {
            localStorage.setItem('swiftsail_is_master_admin', 'true');
          } else {
            localStorage.removeItem('swiftsail_is_master_admin');
          }
        }
      } catch {}

      // Redireciona para o destino baseado no perfil
      const destination = data.redirectTo || (data.user?.role === 'master_admin' ? '/admin' : '/client');
      router.push(destination);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Falha ao validar código.';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
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
            Enterprise OS • Login Passwordless via WhatsApp
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-white border border-[#E2E8F0] p-6 sm:p-8 rounded-3xl shadow-sm space-y-6">
          {errorMessage && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-xs text-rose-800">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {infoMessage && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-2.5 text-xs text-emerald-800">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>{infoMessage}</span>
            </div>
          )}

          {step === 'phone' ? (
            /* ETAPA 1: SOLICITAR CÓDIGO */
            <form onSubmit={handleRequestOtp} className="space-y-4">
              <div className="space-y-1">
                <h2 className="text-lg font-bold text-[#0F172A]">Acesso à Plataforma</h2>
                <p className="text-xs text-[#64748B]">
                  Informe seu número de WhatsApp. Enviaremos um código de verificação instantâneo com botão de cópia.
                </p>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="celular" className="block text-xs font-bold text-[#334155] uppercase tracking-wider">
                  WhatsApp com DDD
                </label>
                <div className="flex gap-2">
                  <select
                    value={ddi}
                    onChange={(e) => setDdi(e.target.value)}
                    className="w-24 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl px-2 py-3 text-xs font-semibold text-[#0F172A] focus:bg-white focus:outline-none focus:border-[#0050FF]"
                  >
                    <option value="+55">🇧🇷 +55</option>
                    <option value="+1">🇺🇸 +1</option>
                    <option value="+351">🇵🇹 +351</option>
                  </select>

                  <div className="relative flex-1">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#94A3B8]">
                      <Phone className="w-4 h-4 text-[#0050FF]" />
                    </div>
                    <input
                      id="celular"
                      type="tel"
                      placeholder="(41) 99233-2996"
                      value={localNumber}
                      onChange={handlePhoneInputChange}
                      autoFocus
                      required
                      className="w-full pl-10 pr-4 py-3 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl text-sm font-semibold text-[#0F172A] placeholder-[#94A3B8] focus:bg-white focus:outline-none focus:border-[#0050FF] focus:ring-2 focus:ring-[#0050FF]/20 transition-all"
                    />
                  </div>
                </div>
              </div>



              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 px-4 rounded-xl font-bold text-xs bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center gap-2 transition-all shadow-xs disabled:opacity-60 cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Disparando código no WhatsApp...</span>
                  </>
                ) : (
                  <>
                    <MessageSquare className="w-4 h-4" />
                    <span>Receber Código no WhatsApp</span>
                  </>
                )}
              </button>
            </form>
          ) : (
            /* ETAPA 2: VALIDAR CÓDIGO OTP */
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold text-[#0F172A]">Digite o Código</h2>
                  <span className="text-[11px] font-mono font-bold text-[#0050FF] bg-[#EFF4FF] px-2 py-0.5 rounded-full border border-[#BFDBFE]">
                    {getFullPhone()}
                  </span>
                </div>
                <p className="text-xs text-[#64748B]">
                  Insira o código de 6 dígitos enviado para o seu WhatsApp.
                </p>
              </div>

              <div className="space-y-1.5">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#94A3B8]">
                    <KeyRound className="w-4 h-4 text-emerald-600" />
                  </div>
                  <input
                    type="text"
                    maxLength={6}
                    placeholder="000000"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    autoFocus
                    required
                    className="w-full pl-10 pr-4 py-3 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl text-center text-xl font-mono font-bold tracking-[0.4em] text-[#0F172A] focus:bg-white focus:outline-none focus:border-[#0050FF] focus:ring-2 focus:ring-[#0050FF]/20 transition-all"
                  />
                </div>
                <p className="text-[11px] text-[#94A3B8] text-center">
                  Válido por 5 minutos. Use o botão &quot;Copiar Código&quot; no WhatsApp.
                </p>
              </div>

              <button
                type="submit"
                disabled={isLoading || otp.length !== 6}
                className="w-full py-3.5 px-4 rounded-xl font-bold text-xs bg-[#0050FF] hover:bg-[#0040D6] text-white flex items-center justify-center gap-2 transition-all shadow-xs disabled:opacity-50 cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Validando e autenticando...</span>
                  </>
                ) : (
                  <>
                    <span>Confirmar e Entrar</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setStep('phone');
                    setOtp('');
                    setErrorMessage('');
                  }}
                  className="text-xs text-[#64748B] hover:text-[#0F172A] flex items-center gap-1.5 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Alterar número</span>
                </button>

                <button
                  type="button"
                  disabled={countdown > 0 || isLoading}
                  onClick={handleRequestOtp}
                  className="text-xs font-semibold text-[#0050FF] hover:underline disabled:text-[#94A3B8] disabled:no-underline cursor-pointer"
                >
                  {countdown > 0 ? `Reenviar em ${countdown}s` : 'Reenviar código'}
                </button>
              </div>
            </form>
          )}


        </div>

        {/* Security Footer */}
        <div className="flex items-center justify-center gap-2 text-[11px] text-[#94A3B8]">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Swiftsail OS • Autenticação Passwordless via WhatsApp & Supabase Auth</span>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="w-full min-h-screen flex items-center justify-center bg-[#F8FAFC]">
          <div className="w-8 h-8 border-2 border-[#0050FF] border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
