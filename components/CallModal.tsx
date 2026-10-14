'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Phone,
  PhoneOff,
  X,
  User,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Clock,
  MessageSquare,
  Sparkles,
} from 'lucide-react';

interface CallModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultPhone?: string;
  defaultContactName?: string;
  defaultLeadId?: string;
  defaultContactId?: string;
  clienteId?: string;
  onCallSaved?: () => void;
}

export function CallModal({
  isOpen,
  onClose,
  defaultPhone = '',
  defaultContactName = '',
  defaultLeadId = '',
  defaultContactId = '',
  clienteId = 'swiftsail',
  onCallSaved,
}: CallModalProps) {
  const [phone, setPhone] = useState(defaultPhone);
  const [contactName, setContactName] = useState(defaultContactName);
  const [callState, setCallState] = useState<
    'idle' | 'preparing' | 'dialing' | 'ringing' | 'in_progress' | 'ended' | 'feedback' | 'failed'
  >('idle');
  const [activeCallId, setActiveCallId] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedFeedback, setSelectedFeedback] = useState<string>('call_positiva');
  const [feedbackNote, setFeedbackNote] = useState<string>('');
  const [savingFeedback, setSavingFeedback] = useState(false);
  const [feedbackSuccess, setFeedbackSuccess] = useState(false);

  const ringingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const inProgressTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (defaultPhone) setPhone(defaultPhone);
    if (defaultContactName) setContactName(defaultContactName);
  }, [defaultPhone, defaultContactName]);

  useEffect(() => {
    return () => {
      if (ringingTimeoutRef.current) clearTimeout(ringingTimeoutRef.current);
      if (inProgressTimeoutRef.current) clearTimeout(inProgressTimeoutRef.current);
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, []);

  if (!isOpen) return null;

  const handleStartCall = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || callState !== 'idle') return;

    if (ringingTimeoutRef.current) clearTimeout(ringingTimeoutRef.current);
    if (inProgressTimeoutRef.current) clearTimeout(inProgressTimeoutRef.current);
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);

    setCallState('preparing');
    setErrorMessage(null);
    setDuration(0);

    try {
      const res = await fetch('/api/calls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone,
          contactName: contactName || 'Contato Lead',
          leadId: defaultLeadId || null,
          contactId: defaultContactId || null,
          cliente_id: clienteId,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setCallState('failed');
        setErrorMessage(data.error || 'Falha ao iniciar ligação');
        return;
      }

      setActiveCallId(data.call?.id || `call_${Date.now()}`);
      setCallState('dialing');

      timerIntervalRef.current = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);

      ringingTimeoutRef.current = setTimeout(() => {
        setCallState((prev) => (prev === 'dialing' ? 'ringing' : prev));
      }, 2000);

      inProgressTimeoutRef.current = setTimeout(() => {
        setCallState((prev) => (prev === 'ringing' || prev === 'dialing' ? 'in_progress' : prev));
      }, 4000);
    } catch (err: any) {
      setCallState('failed');
      setErrorMessage(err.message || 'Erro de comunicação');
    }
  };

  const handleEndCall = () => {
    // 1. Limpa IMEDIATAMENTE todos os timeouts para não sobrescrever o estado
    if (ringingTimeoutRef.current) {
      clearTimeout(ringingTimeoutRef.current);
      ringingTimeoutRef.current = null;
    }
    if (inProgressTimeoutRef.current) {
      clearTimeout(inProgressTimeoutRef.current);
      inProgressTimeoutRef.current = null;
    }
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }

    // 2. Abre imediatamente a tela de feedback no primeiro clique
    setCallState('feedback');

    // 3. Dispara o desligamento via /call/reject na UAZAPI em background
    if (activeCallId) {
      fetch(`/api/calls/${activeCallId}/hangup`, { method: 'POST' }).catch((e) => {
        console.error('Erro ao desligar chamada:', e);
      });
    }
  };

  const handleSaveModalFeedback = async () => {
    setSavingFeedback(true);
    setFeedbackSuccess(false);
    try {
      const res = await fetch('/api/calls/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          callId: activeCallId,
          leadId: defaultLeadId || null,
          contactId: defaultContactId || null,
          phone,
          durationSeconds: duration,
          feedback: selectedFeedback,
          note: feedbackNote,
          cliente_id: clienteId,
        }),
      });

      if (res.ok) {
        setFeedbackSuccess(true);
        setCallState('ended');
        if (onCallSaved) onCallSaved();
        setTimeout(() => {
          onClose();
          setCallState('idle');
          setDuration(0);
          setFeedbackNote('');
        }, 1500);
      } else {
        const err = await res.json();
        alert(err.error || 'Erro ao salvar no Kommo');
      }
    } catch {
      alert('Erro ao conectar com o servidor');
    } finally {
      setSavingFeedback(false);
    }
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4 select-none font-sans">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-xl border border-[#E2E8F0] overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-[#E2E8F0] flex items-center justify-between bg-[#F8FAFC]">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-[#EFF4FF] text-[#0050FF] border border-[#BFDBFE]">
              <Phone className="w-4 h-4" />
            </span>
            <div>
              <span className="font-bold text-[#0F172A] text-sm">Ligação WhatsApp (UAZAPI)</span>
              <p className="text-[10px] text-[#64748B]">Sincronização Direta Kommo CRM</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-[#64748B] hover:text-[#0F172A] rounded-lg hover:bg-[#E2E8F0] transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {callState === 'idle' ? (
            <form onSubmit={handleStartCall} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#475569] mb-1">
                  Nome do Lead / Contato
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-[#94A3B8] absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    placeholder="Ex: João da Silva"
                    className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl pl-9 pr-3 py-2 text-xs text-[#0F172A] focus:outline-none focus:border-[#0050FF]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#475569] mb-1">
                  Número de Telefone (WhatsApp)
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-[#94A3B8] absolute left-3 top-2.5" />
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+55 11 99999-9999"
                    className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl pl-9 pr-3 py-2 text-xs font-mono text-[#0F172A] focus:outline-none focus:border-[#0050FF]"
                  />
                </div>
                <p className="text-[10px] text-[#64748B] mt-1">
                  A UAZAPI disparará uma chamada de voz WhatsApp diretamente para o aparelho do lead.
                </p>
              </div>

              {defaultLeadId && (
                <div className="p-2.5 rounded-lg bg-[#EFF4FF] border border-[#BFDBFE] text-[11px] text-[#0050FF] font-medium flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 shrink-0" />
                  <span>Vinculado ao Lead #{defaultLeadId} do Kommo CRM</span>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl font-bold bg-[#0050FF] hover:bg-[#0040D6] text-white text-xs shadow-xs flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <Phone className="w-4 h-4" />
                <span>Iniciar Chamada WhatsApp</span>
              </button>
            </form>
          ) : callState === 'preparing' || callState === 'dialing' || callState === 'ringing' || callState === 'in_progress' ? (
            <div className="text-center py-6 space-y-5">
              <div className="relative inline-flex items-center justify-center">
                <div className="w-20 h-20 rounded-full bg-[#EFF4FF] border border-[#BFDBFE] flex items-center justify-center">
                  <Phone className="w-8 h-8 text-[#0050FF] animate-bounce" />
                </div>
                <span className="absolute -top-1 -right-1 flex h-4 w-4">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500"></span>
                </span>
              </div>

              <div>
                <h3 className="text-base font-bold text-[#0F172A]">{contactName || 'Contato Lead'}</h3>
                <p className="text-xs font-mono text-[#64748B] mt-0.5">{phone}</p>
                <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#F8FAFC] border border-[#E2E8F0]">
                  <Clock className="w-3.5 h-3.5 text-[#0050FF]" />
                  <span className="font-mono text-[#0F172A]">{formatTimer(duration)}</span>
                  <span className="text-[#64748B]">•</span>
                  <span className="text-emerald-700 capitalize font-medium">
                    {callState === 'preparing'
                      ? 'Iniciando...'
                      : callState === 'dialing'
                      ? 'Discando...'
                      : callState === 'ringing'
                      ? 'Chamando...'
                      : 'Em chamada'}
                  </span>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleEndCall}
                  className="px-6 py-2.5 rounded-xl font-bold bg-rose-600 hover:bg-rose-700 text-white text-xs shadow-xs flex items-center gap-2 mx-auto cursor-pointer transition active:scale-95"
                >
                  <PhoneOff className="w-4 h-4" />
                  <span>Desligar Chamada</span>
                </button>
              </div>
            </div>
          ) : callState === 'feedback' ? (
            /* POPUP OBRIGATÓRIO DE FEEDBACK PÓS-CHAMADA */
            <div className="space-y-4">
              <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl flex items-center justify-between">
                <div>
                  <p className="font-bold text-xs text-[#0F172A]">{contactName || 'Lead'}</p>
                  <p className="text-[11px] font-mono text-[#64748B]">{phone}</p>
                </div>
                <span className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-white border border-[#CBD5E1] text-[#0F172A]">
                  ⏱ {formatTimer(duration)}
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#0F172A] mb-2">
                  Qual foi o resultado da ligação?
                </label>
                <div className="grid grid-cols-1 gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedFeedback('lead_nao_atendeu')}
                    className={`p-3 rounded-xl border text-left flex items-center gap-3 transition cursor-pointer ${
                      selectedFeedback === 'lead_nao_atendeu'
                        ? 'border-rose-400 bg-rose-50 text-rose-900'
                        : 'border-[#E2E8F0] hover:bg-[#F8FAFC] text-[#475569]'
                    }`}
                  >
                    <span className="text-xl">📵</span>
                    <div>
                      <p className="text-xs font-bold">Lead não atendeu</p>
                      <p className="text-[10px] text-[#64748B]">Chamou até cair, caixa postal ou ocupado</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedFeedback('call_negativa')}
                    className={`p-3 rounded-xl border text-left flex items-center gap-3 transition cursor-pointer ${
                      selectedFeedback === 'call_negativa'
                        ? 'border-amber-400 bg-amber-50 text-amber-900'
                        : 'border-[#E2E8F0] hover:bg-[#F8FAFC] text-[#475569]'
                    }`}
                  >
                    <span className="text-xl">👎</span>
                    <div>
                      <p className="text-xs font-bold">Call foi negativa</p>
                      <p className="text-[10px] text-[#64748B]">Sem interesse, momento ruim ou objeção</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedFeedback('call_positiva')}
                    className={`p-3 rounded-xl border text-left flex items-center gap-3 transition cursor-pointer ${
                      selectedFeedback === 'call_positiva'
                        ? 'border-emerald-400 bg-emerald-50 text-emerald-900'
                        : 'border-[#E2E8F0] hover:bg-[#F8FAFC] text-[#475569]'
                    }`}
                  >
                    <span className="text-xl">🟢</span>
                    <div>
                      <p className="text-xs font-bold">Call foi positiva</p>
                      <p className="text-[10px] text-[#64748B]">Lead interessado, agendou ou proposta em andamento</p>
                    </div>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#475569] mb-1">
                  Observações adicionais (opcional)
                </label>
                <textarea
                  rows={2}
                  value={feedbackNote}
                  onChange={(e) => setFeedbackNote(e.target.value)}
                  placeholder="Ex: Pediu para retornar na sexta às 15h..."
                  className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl p-2.5 text-xs text-[#0F172A] focus:outline-none focus:border-[#0050FF]"
                />
              </div>

              <div className="pt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-2 rounded-xl text-xs font-semibold border border-[#CBD5E1] text-[#64748B] hover:bg-[#F8FAFC] cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={savingFeedback}
                  onClick={handleSaveModalFeedback}
                  className="flex-1 py-2 rounded-xl text-xs font-bold bg-[#0050FF] hover:bg-[#0040D6] text-white shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {savingFeedback ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                  <span>💾 Salvar no Kommo</span>
                </button>
              </div>
            </div>
          ) : callState === 'ended' ? (
            <div className="text-center py-6 space-y-3">
              <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
              <h3 className="font-bold text-sm text-[#0F172A]">Tarefa Registrada com Sucesso!</h3>
              <p className="text-xs text-[#64748B]">
                A ligação e o feedback foram sincronizados com a timeline e tarefas do Kommo CRM.
              </p>
            </div>
          ) : (
            <div className="text-center py-6 space-y-4">
              <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
              <h3 className="font-bold text-sm text-[#0F172A]">Falha na Ligação</h3>
              <p className="text-xs text-[#64748B]">{errorMessage || 'Não foi possível completar a chamada.'}</p>
              <button
                type="button"
                onClick={() => setCallState('idle')}
                className="px-4 py-2 rounded-xl font-bold bg-[#0050FF] text-white text-xs cursor-pointer"
              >
                Tentar Novamente
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
