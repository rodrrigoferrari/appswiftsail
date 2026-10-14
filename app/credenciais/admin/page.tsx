'use client';

import React, { useState, useEffect } from 'react';
import {
  KeyRound,
  ShieldCheck,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Save,
  Server,
  Radio,
  Zap,
  Check,
  Search,
  CreditCard,
  Bot,
  MessageSquare,
  QrCode,
  Smartphone,
  Send,
  Plus,
  Copy,
} from 'lucide-react';
import { WhatsAppConnectFlow } from '@/components/WhatsAppConnectFlow';

export default function AdminCredentialsPage() {
  const [activeTab, setActiveAdminTab] = useState<'meta' | 'google' | 'uazapi' | 'asaas' | 'ai'>('uazapi');

  const [adminCreds, setAdminCreds] = useState({
    uazapi_url: 'https://api.uazapi.com',
    uazapi_token: '',
    uazapi_service_instance: '',
    uazapi_service_instance_token: '',
    meta_bm_id: '791208745012339',
    meta_access_token: '',
    google_mcc_id: '262-638-1700',
    google_developer_token: '',
    asaas_api_key: '',
    openrouter_api_key: '',
    anthropic_key: '',
    ai_default_model: 'claude-3-5-sonnet-20241022',
  });

  const [availableInstances, setAvailableInstances] = useState<Array<{ name: string; status: string; token: string }>>([]);
  const [isLoadingInstances, setIsLoadingInstances] = useState(false);
  const [showConnectNewFlow, setShowConnectNewFlow] = useState(false);
  const [testNoticePhone, setTestNoticePhone] = useState('');
  const [isSendingTestNotice, setIsSendingTestNotice] = useState(false);
  const [testNoticeFeedback, setTestNoticeFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const [showKeys, setShowKeys] = useState<{ [key: string]: boolean }>({});
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [testingService, setTestingService] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{
    [service: string]: { success: boolean; message: string; latency?: number };
  }>({});

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
          setAdminCreds((prev) => ({ ...prev, ...data.credentials }));
        }
      } catch (err) {
        console.error('Failed to load admin credentials', err);
      }
    }
    loadAdminCreds();
    fetchAvailableInstances();
  }, []);

  const toggleShow = (key: string) => {
    setShowKeys((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    setFeedback(null);
    try {
      const res = await fetch('/api/credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credentials: adminCreds }),
      });
      const data = await res.json();
      if (data.success) {
        setFeedback({ type: 'success', text: 'Credenciais Master salvas com sucesso no Supabase.' });
      } else {
        setFeedback({ type: 'error', text: data.error || 'Erro ao salvar.' });
      }
    } catch {
      setFeedback({ type: 'error', text: 'Falha ao salvar credenciais.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestConnection = async (service: string) => {
    setTestingService(service);
    try {
      const res = await fetch('/api/credentials/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ service, payload: adminCreds }),
      });
      const data = await res.json();
      setTestResult((prev) => ({ ...prev, [service]: data }));
    } catch {
      setTestResult((prev) => ({
        ...prev,
        [service]: { success: false, message: 'Falha ao testar conexão.' },
      }));
    } finally {
      setTestingService(null);
    }
  };

  return (
    <div className="space-y-6 font-sans select-none">
      {/* Top Banner (Estilo Asaas: Branco Limpo, Borda Fina, Destaque Limpo) */}
      <div className="bg-white border border-[#E2E8F0] p-6 rounded-2xl shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-[#EFF4FF] text-[#0050FF] border border-[#BFDBFE] uppercase tracking-wider">
              Nível Administrador Global
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#0F172A] flex items-center gap-2.5">
            <Server className="w-6 h-6 text-[#0050FF]" />
            Credenciais Master Admin (Swiftsail)
          </h1>
          <p className="text-xs text-[#64748B] max-w-2xl leading-relaxed">
            Chaves mestras da agência para provisionar instâncias, gerenciar as 36 contas de anúncios via BM/MCC e executar automações. O cliente não possui acesso a estas chaves.
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={isSaving}
          className="bg-[#0050FF] hover:bg-[#0040D6] text-white px-5 py-2.5 rounded-full font-semibold text-xs sm:text-sm flex items-center gap-2 shadow-xs transition-all active:scale-95 cursor-pointer disabled:opacity-50 self-start md:self-auto"
        >
          {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          <span>Salvar Chaves Master</span>
        </button>
      </div>

      {feedback && (
        <div
          className={`p-4 rounded-xl text-xs font-semibold flex items-center gap-2 border ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : 'bg-rose-50 text-rose-700 border-rose-200'
          }`}
        >
          {feedback.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-rose-600" />}
          <span>{feedback.text}</span>
        </div>
      )}

      {/* Grid: Navigation Tabs + Settings Form */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Side Tabs */}
        <div className="lg:col-span-4 space-y-1">
          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-2 shadow-xs space-y-1">
            <button
              onClick={() => setActiveAdminTab('uazapi')}
              className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'uazapi'
                  ? 'bg-[#EFF4FF] text-[#0050FF] font-bold border border-[#BFDBFE] shadow-xs'
                  : 'text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Radio className="w-4 h-4 text-[#0050FF]" />
                <span>1. Uazapi Server & Admin Token</span>
              </div>
              {adminCreds.uazapi_token && <Check className="w-3.5 h-3.5 text-emerald-600" />}
            </button>

            <button
              onClick={() => setActiveAdminTab('meta')}
              className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'meta'
                  ? 'bg-[#EFF4FF] text-[#0050FF] font-bold border border-[#BFDBFE] shadow-xs'
                  : 'text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Zap className="w-4 h-4 text-blue-600" />
                <span>2. Meta Ads BM Parceiro (Global)</span>
              </div>
              {adminCreds.meta_access_token && <Check className="w-3.5 h-3.5 text-blue-600" />}
            </button>

            <button
              onClick={() => setActiveAdminTab('google')}
              className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'google'
                  ? 'bg-[#EFF4FF] text-[#0050FF] font-bold border border-[#BFDBFE] shadow-xs'
                  : 'text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Search className="w-4 h-4 text-sky-600" />
                <span>3. Google Ads MCC Gerenciador</span>
              </div>
              {adminCreds.google_developer_token && <Check className="w-3.5 h-3.5 text-sky-600" />}
            </button>

            <button
              onClick={() => setActiveAdminTab('asaas')}
              className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'asaas'
                  ? 'bg-[#EFF4FF] text-[#0050FF] font-bold border border-[#BFDBFE] shadow-xs'
                  : 'text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <CreditCard className="w-4 h-4 text-emerald-600" />
                <span>4. Asaas Financeiro (Swiftsail)</span>
              </div>
              {adminCreds.asaas_api_key && <Check className="w-3.5 h-3.5 text-emerald-600" />}
            </button>

            <button
              onClick={() => setActiveAdminTab('ai')}
              className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'ai'
                  ? 'bg-[#EFF4FF] text-[#0050FF] font-bold border border-[#BFDBFE] shadow-xs'
                  : 'text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Bot className="w-4 h-4 text-purple-600" />
                <span>5. IA (OpenRouter / Grok)</span>
              </div>
              {adminCreds.openrouter_api_key && <Check className="w-3.5 h-3.5 text-purple-600" />}
            </button>
          </div>
        </div>

        {/* Right Side Form Content */}
        <div className="lg:col-span-8">
          {/* UAZAPI TAB */}
          {activeTab === 'uazapi' && (
            <div className="space-y-6">
              {/* Card 1: Servidor & Admin Token Master */}
              <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-xs space-y-5">
                <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-[#0F172A] flex items-center gap-2">
                      <Radio className="w-4 h-4 text-[#0050FF]" />
                      Uazapi Server URL & Admin Token Master
                    </h3>
                    <p className="text-xs text-[#64748B]">
                      O <b>admintoken</b> é o precursor mestre que cria, gerencia e audita instâncias de todos os clientes
                    </p>
                  </div>
                  <button
                    onClick={() => handleTestConnection('uazapi')}
                    disabled={testingService === 'uazapi'}
                    className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#EFF4FF] hover:bg-[#E0EAFF] text-[#0050FF] border border-[#BFDBFE] flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                  >
                    {testingService === 'uazapi' ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
                    Testar Servidor
                  </button>
                </div>

                {testResult['uazapi'] && (
                  <div
                    className={`p-3.5 rounded-xl text-xs border ${
                      testResult['uazapi'].success
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-rose-50 text-rose-700 border-rose-200'
                    }`}
                  >
                    <p className="font-semibold">{testResult['uazapi'].message}</p>
                    {testResult['uazapi'].latency && (
                      <p className="text-[10px] opacity-80 mt-0.5">Latência: {testResult['uazapi'].latency}ms</p>
                    )}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block text-[#475569] font-semibold mb-1">Server URL da Uazapi</label>
                    <input
                      type="text"
                      value={adminCreds.uazapi_url}
                      onChange={(e) => setAdminCreds({ ...adminCreds, uazapi_url: e.target.value })}
                      placeholder="https://api.uazapi.com ou https://seu-servidor.com"
                      className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl px-3 py-2 text-[#0F172A] font-mono focus:border-[#0050FF] focus:bg-white focus:outline-none transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-[#475569] font-semibold mb-1">
                      Admin Token Global (Header: <code>admintoken</code>)
                    </label>
                    <div className="relative">
                      <input
                        type={showKeys['uazapi_admin'] ? 'text' : 'password'}
                        value={adminCreds.uazapi_token}
                        onChange={(e) => setAdminCreds({ ...adminCreds, uazapi_token: e.target.value })}
                        placeholder="Insira o admintoken da sua conta administrativa Uazapi"
                        className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl px-3 py-2 pr-10 text-[#0F172A] font-mono focus:border-[#0050FF] focus:bg-white focus:outline-none transition-colors"
                      />
                      <button
                        onClick={() => toggleShow('uazapi_admin')}
                        className="absolute right-3 top-2.5 text-[#94A3B8] hover:text-[#0F172A] cursor-pointer"
                      >
                        {showKeys['uazapi_admin'] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 2: Instância Dedicada para Notificações de Serviço (Seletor ou Conectar Nova) */}
              <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-xs space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#F1F5F9] pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-[#0F172A] flex items-center gap-2">
                        <MessageSquare className="w-4 h-4 text-emerald-600" />
                        Instância de Notificações de Serviço
                      </h3>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        WhatsApp Alertas
                      </span>
                    </div>
                    <p className="text-xs text-[#64748B] mt-0.5">
                      Instância utilizada pela Swiftsail para alertas operacionais, avisos de sistema e notificações transacionais.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShowConnectNewFlow(!showConnectNewFlow)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs border ${
                        showConnectNewFlow
                          ? 'bg-[#EFF4FF] text-[#0050FF] border-[#BFDBFE]'
                          : 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600'
                      }`}
                    >
                      {showConnectNewFlow ? (
                        <>
                          <Radio className="w-3.5 h-3.5" />
                          <span>Voltar ao Seletor</span>
                        </>
                      ) : (
                        <>
                          <Plus className="w-3.5 h-3.5" />
                          <span>Conectar Nova Instância</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* VISÃO 1: FLUXO HIGHLANDER PARA CONECTAR NOVA INSTÂNCIA */}
                {showConnectNewFlow ? (
                  <div className="space-y-4">
                    <div className="p-3.5 rounded-xl bg-[#EFF4FF]/60 border border-[#BFDBFE] text-xs text-[#1E3A8A] flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <QrCode className="w-4 h-4 text-[#0050FF] shrink-0" />
                        <span>
                          Escaneie o QR Code ou gere o código de 8 dígitos para conectar uma <b>nova linha de serviço</b>.
                        </span>
                      </div>
                      <button
                        onClick={() => setShowConnectNewFlow(false)}
                        className="text-[11px] font-bold text-[#0050FF] hover:underline cursor-pointer"
                      >
                        Cancelar
                      </button>
                    </div>

                    <WhatsAppConnectFlow
                      clienteId="swiftsail_service"
                      onStatusChange={(status, inst) => {
                        if (status === 'connected') {
                          fetchAvailableInstances();
                          if (inst?.name) {
                            setAdminCreds((prev) => ({
                              ...prev,
                              uazapi_service_instance: inst.name,
                              uazapi_service_instance_token: inst.token || prev.uazapi_service_instance_token,
                            }));
                          }
                        }
                      }}
                    />
                  </div>
                ) : (
                  /* VISÃO 2: SELETOR DE INSTÂNCIA EXISTENTE */
                  <div className="space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                      <div className="md:col-span-2 space-y-1.5">
                        <label className="block text-xs font-bold text-[#0F172A] flex items-center justify-between">
                          <span>Selecionar Instância Ativa na Uazapi:</span>
                          <span className="text-[10px] text-[#64748B] font-normal">
                            {availableInstances.length} instâncias mapeadas
                          </span>
                        </label>
                        <select
                          value={adminCreds.uazapi_service_instance}
                          onChange={(e) => {
                            const selectedName = e.target.value;
                            const found = availableInstances.find((i) => i.name === selectedName);
                            setAdminCreds({
                              ...adminCreds,
                              uazapi_service_instance: selectedName,
                              uazapi_service_instance_token: found?.token || adminCreds.uazapi_service_instance_token,
                            });
                          }}
                          className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl px-3 py-2 text-xs font-semibold text-[#0F172A] focus:border-[#0050FF] focus:bg-white focus:outline-none transition-colors shadow-2xs cursor-pointer"
                        >
                          <option value="">Selecione uma instância para Notificações de Serviço...</option>
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
                          className="w-full py-2 px-3 rounded-xl border border-[#CBD5E1] bg-white hover:bg-[#F8FAFC] text-[#475569] font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs cursor-pointer transition disabled:opacity-50"
                        >
                          <RefreshCw className={`w-3.5 h-3.5 ${isLoadingInstances ? 'animate-spin text-[#0050FF]' : ''}`} />
                          <span>Atualizar Lista</span>
                        </button>
                      </div>
                    </div>

                    {/* Resumo da Instância Selecionada */}
                    {adminCreds.uazapi_service_instance && (
                      <div className="p-4 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] flex flex-col md:flex-row md:items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-white border border-[#E2E8F0] flex items-center justify-center text-emerald-600 shadow-xs">
                            <Smartphone className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-[#0F172A]">
                                {adminCreds.uazapi_service_instance}
                              </span>
                              {availableInstances.find((i) => i.name === adminCreds.uazapi_service_instance)?.status === 'connected' ? (
                                <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                                  <CheckCircle2 className="w-3 h-3" />
                                  Conectada & Pronta
                                </span>
                              ) : (
                                <span className="flex items-center gap-1 text-[10px] font-bold text-slate-600 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full">
                                  <AlertCircle className="w-3 h-3" />
                                  Desconectada ou Aguardando QR
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
                              const found = availableInstances.find((i) => i.name === adminCreds.uazapi_service_instance);
                              if (found?.token) {
                                navigator.clipboard.writeText(found.token);
                                alert('Token da instância copiado com sucesso!');
                              }
                            }}
                            className="px-3 py-1.5 rounded-lg border border-[#CBD5E1] bg-white text-xs font-semibold text-[#475569] hover:bg-slate-50 flex items-center gap-1.5 shadow-xs cursor-pointer"
                            title="Copiar token da instância"
                          >
                            <Copy className="w-3 h-3 text-[#64748B]" />
                            <span>Copiar Token</span>
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Teste de Notificação Rápida */}
                    <div className="p-4 rounded-xl border border-[#BFDBFE]/60 bg-[#EFF4FF]/30 space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-[#1E3A8A] flex items-center gap-1.5">
                          <Send className="w-3.5 h-3.5 text-[#0050FF]" />
                          Testar Envio de Alerta de Serviço (WhatsApp)
                        </label>
                        <span className="text-[10px] text-[#64748B]">Simula notificação em tempo real</span>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-2">
                        <input
                          type="text"
                          value={testNoticePhone}
                          onChange={(e) => setTestNoticePhone(e.target.value)}
                          placeholder="Ex: 5511999998888 (com DDI e DDD)"
                          className="flex-1 bg-white border border-[#CBD5E1] rounded-xl px-3 py-2 text-xs font-mono text-[#0F172A] focus:border-[#0050FF] focus:outline-none shadow-2xs"
                        />
                        <button
                          type="button"
                          disabled={isSendingTestNotice || !testNoticePhone}
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
                                  message: 'Mensagem de teste de serviço enviada com sucesso no WhatsApp!',
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
                          className="px-4 py-2 rounded-xl text-xs font-bold bg-[#0050FF] hover:bg-[#0040D6] text-white flex items-center justify-center gap-1.5 shadow-xs cursor-pointer transition disabled:opacity-50"
                        >
                          {isSendingTestNotice ? (
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Send className="w-3.5 h-3.5" />
                          )}
                          <span>Disparar Teste</span>
                        </button>
                      </div>

                      {testNoticeFeedback && (
                        <div
                          className={`p-2.5 rounded-lg text-xs font-semibold border ${
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
            </div>
          )}

          {/* META BM TAB */}
          {activeTab === 'meta' && (
            <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-xs space-y-5">
              <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-3">
                <div>
                  <h3 className="text-sm font-bold text-[#0F172A] flex items-center gap-2">
                    <Zap className="w-4 h-4 text-[#0050FF]" />
                    BM Parceiro Meta (Global)
                  </h3>
                  <p className="text-xs text-[#64748B]">
                    Acessa e gerencia as contas de anúncios de todos os clientes cadastrados
                  </p>
                </div>
                <button
                  onClick={() => handleTestConnection('meta')}
                  disabled={testingService === 'meta'}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#EFF4FF] hover:bg-[#E0EAFF] text-[#0050FF] border border-[#BFDBFE] flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                >
                  {testingService === 'meta' ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
                  Testar Graph API
                </button>
              </div>

              {testResult['meta'] && (
                <div
                  className={`p-3.5 rounded-xl text-xs border ${
                    testResult['meta'].success
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-rose-50 text-rose-700 border-rose-200'
                  }`}
                >
                  <p className="font-semibold">{testResult['meta'].message}</p>
                </div>
              )}

              <div className="space-y-4 text-xs">
                <div>
                  <label className="block text-[#475569] font-semibold mb-1">ID do BM Parceiro Swiftsail</label>
                  <input
                    type="text"
                    value={adminCreds.meta_bm_id}
                    onChange={(e) => setAdminCreds({ ...adminCreds, meta_bm_id: e.target.value })}
                    className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl px-3 py-2 text-[#0F172A] font-mono focus:border-[#0050FF] focus:bg-white focus:outline-none transition-colors"
                  />
                  <p className="text-[10px] text-[#64748B] mt-1">BM ID Swiftsail: 791208745012339</p>
                </div>

                <div>
                  <label className="block text-[#475569] font-semibold mb-1">
                    System User Access Token (Permissões de Gerenciamento)
                  </label>
                  <div className="relative">
                    <input
                      type={showKeys['meta'] ? 'text' : 'password'}
                      value={adminCreds.meta_access_token}
                      onChange={(e) => setAdminCreds({ ...adminCreds, meta_access_token: e.target.value })}
                      placeholder="EAA..."
                      className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl px-3 py-2 pr-10 text-[#0F172A] font-mono focus:border-[#0050FF] focus:bg-white focus:outline-none transition-colors"
                    />
                    <button
                      onClick={() => toggleShow('meta')}
                      className="absolute right-3 top-2.5 text-[#94A3B8] hover:text-[#0F172A] cursor-pointer"
                    >
                      {showKeys['meta'] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* GOOGLE MCC TAB */}
          {activeTab === 'google' && (
            <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-xs space-y-5">
              <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-3">
                <div>
                  <h3 className="text-sm font-bold text-[#0F172A] flex items-center gap-2">
                    <Search className="w-4 h-4 text-sky-600" />
                    Google Ads MCC Gerenciador Swiftsail
                  </h3>
                  <p className="text-xs text-[#64748B]">Conta gerente para todas as contas de clientes vinculadas</p>
                </div>
                <button
                  onClick={() => handleTestConnection('google')}
                  disabled={testingService === 'google'}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#EFF4FF] hover:bg-[#E0EAFF] text-[#0050FF] border border-[#BFDBFE] flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                >
                  {testingService === 'google' ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
                  Testar Google API
                </button>
              </div>

              <div className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[#475569] font-semibold mb-1">MCC ID Swiftsail</label>
                    <input
                      type="text"
                      value={adminCreds.google_mcc_id}
                      onChange={(e) => setAdminCreds({ ...adminCreds, google_mcc_id: e.target.value })}
                      className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl px-3 py-2 text-[#0F172A] font-mono focus:border-[#0050FF] focus:bg-white focus:outline-none transition-colors"
                    />
                    <p className="text-[10px] text-[#64748B] mt-1">MCC Swiftsail: 262-638-1700</p>
                  </div>

                  <div>
                    <label className="block text-[#475569] font-semibold mb-1">Developer Token</label>
                    <input
                      type="password"
                      value={adminCreds.google_developer_token}
                      onChange={(e) => setAdminCreds({ ...adminCreds, google_developer_token: e.target.value })}
                      className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl px-3 py-2 text-[#0F172A] font-mono focus:border-[#0050FF] focus:bg-white focus:outline-none transition-colors"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ASAAS TAB */}
          {activeTab === 'asaas' && (
            <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-xs space-y-5">
              <div className="border-b border-[#F1F5F9] pb-3">
                <h3 className="text-sm font-bold text-[#0F172A] flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-emerald-600" />
                  Asaas Gateway de Cobranças (Swiftsail)
                </h3>
                <p className="text-xs text-[#64748B]">Conta da agência para emissão de PIX e faturas</p>
              </div>

              <div className="space-y-4 text-xs">
                <div>
                  <label className="block text-[#475569] font-semibold mb-1">Chave de API Asaas ($aact_...)</label>
                  <input
                    type="password"
                    value={adminCreds.asaas_api_key}
                    onChange={(e) => setAdminCreds({ ...adminCreds, asaas_api_key: e.target.value })}
                    className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl px-3 py-2 text-[#0F172A] font-mono focus:border-[#0050FF] focus:bg-white focus:outline-none transition-colors"
                  />
                </div>
              </div>
            </div>
          )}

          {/* AI TAB */}
          {activeTab === 'ai' && (
            <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-xs space-y-5">
              <div className="border-b border-[#F1F5F9] pb-3">
                <h3 className="text-sm font-bold text-[#0F172A] flex items-center gap-2">
                  <Bot className="w-4 h-4 text-purple-600" />
                  OpenRouter & Grok AI
                </h3>
                <p className="text-xs text-[#64748B]">Motor de IA da agência para criativos e automações</p>
              </div>

              <div className="space-y-4 text-xs">
                <div>
                  <label className="block text-[#475569] font-semibold mb-1">
                    Anthropic API Key (Claude 3.5 Sonnet / Haiku)
                  </label>
                  <div className="relative">
                    <input
                      type={showKeys['anthropic'] ? 'text' : 'password'}
                      value={adminCreds.anthropic_key}
                      onChange={(e) => setAdminCreds({ ...adminCreds, anthropic_key: e.target.value })}
                      placeholder="sk-ant-api03-..."
                      className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl px-3 py-2 pr-10 text-[#0F172A] font-mono focus:border-[#0050FF] focus:bg-white focus:outline-none transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => toggleShow('anthropic')}
                      className="absolute right-3 top-2.5 text-[#64748B] hover:text-[#0F172A]"
                    >
                      {showKeys['anthropic'] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <p className="text-[10px] text-[#64748B] mt-1">
                    Utilizada pelo botão &quot;Perguntar para IA&quot; nos dashboards dos clientes.
                  </p>
                </div>

                <div>
                  <label className="block text-[#475569] font-semibold mb-1">Chave de API OpenRouter / xAI</label>
                  <input
                    type="password"
                    value={adminCreds.openrouter_api_key}
                    onChange={(e) => setAdminCreds({ ...adminCreds, openrouter_api_key: e.target.value })}
                    className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl px-3 py-2 text-[#0F172A] font-mono focus:border-[#0050FF] focus:bg-white focus:outline-none transition-colors"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
