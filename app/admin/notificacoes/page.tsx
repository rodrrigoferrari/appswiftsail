'use client';

import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  QrCode,
  Smartphone,
  Send,
  Plus,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Copy,
  Radio,
  ShieldCheck,
  Check,
} from 'lucide-react';
import { WhatsAppConnectFlow } from '@/components/WhatsAppConnectFlow';

export default function AdminNotificacoesPage() {
  const [adminCreds, setAdminCreds] = useState({
    uazapi_service_instance: '',
    uazapi_service_instance_token: '',
  });

  const [availableInstances, setAvailableInstances] = useState<Array<{ name: string; status: string; token: string }>>([]);
  const [isLoadingInstances, setIsLoadingInstances] = useState(false);
  const [showConnectNewFlow, setShowConnectNewFlow] = useState(false);
  const [testNoticePhone, setTestNoticePhone] = useState('');
  const [isSendingTestNotice, setIsSendingTestNotice] = useState(false);
  const [testNoticeFeedback, setTestNoticeFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveFeedback, setSaveFeedback] = useState<string | null>(null);

  const fetchAvailableInstances = async () => {
    setIsLoadingInstances(true);
    try {
      const res = await fetch('/api/uazapi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'list_instances', cliente_id: 'swiftsail' }),
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.instances)) {
        setAvailableInstances(data.instances);
      }
    } catch (e) {
      console.warn('Erro ao carregar instâncias Uazapi:', e);
    } finally {
      setIsLoadingInstances(false);
    }
  };

  useEffect(() => {
    async function loadAdminCreds() {
      try {
        const res = await fetch('/api/credentials');
        const data = await res.json();
        if (data.success && data.credentials) {
          setAdminCreds({
            uazapi_service_instance: data.credentials.uazapi_service_instance || '',
            uazapi_service_instance_token: data.credentials.uazapi_service_instance_token || '',
          });
        }
      } catch (err) {
        console.error('Failed to load admin credentials', err);
      }
    }
    loadAdminCreds();
    fetchAvailableInstances();
  }, []);

  const handleSaveSelection = async (newInstanceName?: string, newInstanceToken?: string) => {
    setIsSaving(true);
    setSaveFeedback(null);
    try {
      const targetName = newInstanceName !== undefined ? newInstanceName : adminCreds.uazapi_service_instance;
      const targetToken = newInstanceToken !== undefined ? newInstanceToken : adminCreds.uazapi_service_instance_token;

      // Puxa as credenciais atuais para mesclar sem sobrescrever nada
      const currentRes = await fetch('/api/credentials');
      const currentData = await currentRes.json();
      const merged = {
        ...(currentData.credentials || {}),
        uazapi_service_instance: targetName,
        uazapi_service_instance_token: targetToken,
      };

      const res = await fetch('/api/credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credentials: merged }),
      });
      const data = await res.json();
      if (data.success) {
        setSaveFeedback('Instância de serviço salva com sucesso.');
        setTimeout(() => setSaveFeedback(null), 4000);
      }
    } catch {
      setSaveFeedback('Falha ao salvar a instância.');
    } finally {
      setIsSaving(false);
    }
  };

  const selectedInstance = availableInstances.find((i) => i.name === adminCreds.uazapi_service_instance);
  const isSelectedConnected = selectedInstance?.status === 'connected';

  return (
    <div className="space-y-6 font-sans select-none max-w-5xl mx-auto">
      {/* Top Banner */}
      <div className="bg-white border border-[#E2E8F0] p-6 rounded-2xl shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-[#EFF4FF] text-[#0050FF] border border-[#BFDBFE] uppercase tracking-wider">
              Governança Master • Comunicações
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#0F172A] flex items-center gap-2.5">
            <MessageSquare className="w-6 h-6 text-emerald-600" />
            Notificações de Serviço (WhatsApp)
          </h1>
          <p className="text-xs text-[#64748B] max-w-2xl leading-relaxed">
            Selecione uma instância ativa da Uazapi ou conecte uma nova linha para envio automático de alertas do sistema, avisos aos clientes e notificações operacionais.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setShowConnectNewFlow(!showConnectNewFlow)}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-xs border ${
              showConnectNewFlow
                ? 'bg-[#EFF4FF] text-[#0050FF] border-[#BFDBFE]'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600'
            }`}
          >
            {showConnectNewFlow ? (
              <>
                <Radio className="w-4 h-4" />
                <span>Voltar ao Seletor</span>
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                <span>Conectar Nova Linha</span>
              </>
            )}
          </button>
        </div>
      </div>

      {saveFeedback && (
        <div className="p-3.5 rounded-xl text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{saveFeedback}</span>
        </div>
      )}

      {/* MODO 1: FLUXO DE CONEXÃO DE UMA NOVA INSTÂNCIA (QR CODE / 8 DÍGITOS) */}
      {showConnectNewFlow ? (
        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-xs space-y-5">
          <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-3">
            <div>
              <h3 className="text-sm font-bold text-[#0F172A] flex items-center gap-2">
                <QrCode className="w-4 h-4 text-[#0050FF]" />
                Conectar Nova Linha de Serviço (WhatsApp)
              </h3>
              <p className="text-xs text-[#64748B] mt-0.5">
                Escaneie o QR Code no seu aparelho ou use o código de pareamento de 8 dígitos.
              </p>
            </div>
            <button
              onClick={() => setShowConnectNewFlow(false)}
              className="text-xs font-bold text-[#64748B] hover:text-[#0F172A] cursor-pointer"
            >
              Fechar
            </button>
          </div>

          <WhatsAppConnectFlow
            clienteId="swiftsail_service"
            onStatusChange={(status, inst) => {
              if (status === 'connected') {
                fetchAvailableInstances();
                if (inst?.name) {
                  setAdminCreds({
                    uazapi_service_instance: inst.name,
                    uazapi_service_instance_token: inst.token || '',
                  });
                  handleSaveSelection(inst.name, inst.token || '');
                }
              }
            }}
          />
        </div>
      ) : (
        /* MODO 2: SELETOR DE INSTÂNCIA EXISTENTE & STATUS */
        <div className="space-y-6">
          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-xs space-y-5">
            <div className="border-b border-[#F1F5F9] pb-3">
              <h3 className="text-sm font-bold text-[#0F172A]">Seletor de Instância da Uazapi</h3>
              <p className="text-xs text-[#64748B] mt-0.5">
                Escolha qual linha conectada responderá pelos disparos de serviço do sistema.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              <div className="md:col-span-2 space-y-1.5">
                <label className="block text-xs font-bold text-[#0F172A] flex items-center justify-between">
                  <span>Instância Ativa para Notificações:</span>
                  <span className="text-[10px] text-[#64748B] font-normal">
                    {availableInstances.length} instâncias mapeadas
                  </span>
                </label>
                <select
                  value={adminCreds.uazapi_service_instance}
                  onChange={(e) => {
                    const selectedName = e.target.value;
                    const found = availableInstances.find((i) => i.name === selectedName);
                    const newToken = found?.token || '';
                    setAdminCreds({
                      uazapi_service_instance: selectedName,
                      uazapi_service_instance_token: newToken,
                    });
                    handleSaveSelection(selectedName, newToken);
                  }}
                  className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl px-3 py-2.5 text-xs font-semibold text-[#0F172A] focus:border-[#0050FF] focus:bg-white focus:outline-none transition-colors shadow-2xs cursor-pointer"
                >
                  <option value="">Selecione uma instância da Uazapi...</option>
                  {availableInstances.map((inst) => (
                    <option key={inst.name} value={inst.name}>
                      {inst.status === 'connected' ? '🟢' : '⚪'} {inst.name} ({inst.status === 'connected' ? 'Conectada' : 'Desconectada'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <button
                  type="button"
                  onClick={fetchAvailableInstances}
                  disabled={isLoadingInstances}
                  className="w-full py-2.5 px-3 rounded-xl border border-[#CBD5E1] bg-white hover:bg-[#F8FAFC] text-[#475569] font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs cursor-pointer transition disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoadingInstances ? 'animate-spin text-[#0050FF]' : ''}`} />
                  <span>Atualizar Instâncias</span>
                </button>
              </div>
            </div>

            {/* Card com Detalhes da Linha Selecionada */}
            {adminCreds.uazapi_service_instance && (
              <div className="p-4 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-white border border-[#E2E8F0] flex items-center justify-center text-emerald-600 shadow-xs shrink-0">
                    <Smartphone className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-[#0F172A]">
                        {adminCreds.uazapi_service_instance}
                      </span>
                      {isSelectedConnected ? (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                          <CheckCircle2 className="w-3 h-3" />
                          Linha Pronta & Operacional
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-slate-600 bg-slate-100 border border-slate-200 px-2.5 py-0.5 rounded-full">
                          <AlertCircle className="w-3 h-3" />
                          Desconectada
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-[#64748B] font-mono mt-0.5">
                      Token:{' '}
                      {adminCreds.uazapi_service_instance_token
                        ? `${adminCreds.uazapi_service_instance_token.slice(0, 10)}...${adminCreds.uazapi_service_instance_token.slice(-6)}`
                        : 'Token herdado via Highlander'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (adminCreds.uazapi_service_instance_token) {
                        navigator.clipboard.writeText(adminCreds.uazapi_service_instance_token);
                        alert('Token copiado!');
                      }
                    }}
                    className="px-3 py-1.5 rounded-lg border border-[#CBD5E1] bg-white text-xs font-semibold text-[#475569] hover:bg-slate-50 flex items-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5 text-[#64748B]" />
                    <span>Copiar Token</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Teste Imediato de Disparo */}
          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-3">
              <div>
                <h3 className="text-sm font-bold text-[#0F172A] flex items-center gap-2">
                  <Send className="w-4 h-4 text-[#0050FF]" />
                  Simular Disparo de Notificação de Serviço
                </h3>
                <p className="text-xs text-[#64748B] mt-0.5">
                  Teste o recebimento de mensagens de alerta no WhatsApp usando a instância configurada acima.
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={testNoticePhone}
                onChange={(e) => setTestNoticePhone(e.target.value)}
                placeholder="Ex: 5511999998888 (com DDI e DDD)"
                className="flex-1 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl px-3.5 py-2.5 text-xs font-mono text-[#0F172A] focus:border-[#0050FF] focus:bg-white focus:outline-none shadow-2xs"
              />
              <button
                type="button"
                disabled={isSendingTestNotice || !testNoticePhone || !adminCreds.uazapi_service_instance}
                onClick={async () => {
                  setIsSendingTestNotice(true);
                  setTestNoticeFeedback(null);
                  try {
                    const cleanPhone = testNoticePhone.replace(/\D/g, '');
                    const res = await fetch('/api/uazapi', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        action: 'send_message',
                        cliente_id: 'swiftsail',
                        phone: cleanPhone,
                        message: '🔔 [Swiftsail Alerta] Mensagem de teste de serviço enviada com sucesso pela instância configurada no Admin!',
                        instance_token: adminCreds.uazapi_service_instance_token || undefined,
                      }),
                    });
                    const data = await res.json();
                    if (data.success) {
                      setTestNoticeFeedback({
                        type: 'success',
                        message: 'Notificação de serviço disparada com sucesso no WhatsApp!',
                      });
                    } else {
                      setTestNoticeFeedback({
                        type: 'error',
                        message: data.error || 'Falha ao enviar mensagem de teste.',
                      });
                    }
                  } catch {
                    setTestNoticeFeedback({
                      type: 'error',
                      message: 'Erro de comunicação ao disparar notificação.',
                    });
                  } finally {
                    setIsSendingTestNotice(false);
                  }
                }}
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-[#0050FF] hover:bg-[#0040D6] text-white flex items-center justify-center gap-2 shadow-xs cursor-pointer transition disabled:opacity-50"
              >
                {isSendingTestNotice ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                <span>Disparar Notificação</span>
              </button>
            </div>

            {testNoticeFeedback && (
              <div
                className={`p-3 rounded-xl text-xs font-semibold border ${
                  testNoticeFeedback.type === 'success'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-rose-50 text-rose-700 border-rose-200'
                }`}
              >
                {testNoticeFeedback.message}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
