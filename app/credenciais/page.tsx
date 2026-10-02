'use client';

import React, { useState, useEffect } from 'react';
import { useTenant } from '@/components/TenantProvider';
import {
  KeyRound,
  ShieldCheck,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Save,
  Server,
  Database,
  Radio,
  Sparkles,
  Bot,
  Zap,
  Check,
  Search,
  CreditCard,
  KanbanSquare,
  Building,
  FolderTree,
  MessageSquare,
} from 'lucide-react';

export default function CredenciaisPage() {
  const { clients, activeClient, selectedClientId, setSelectedClientId, activeClientAdAccounts } = useTenant();

  const [activeScope, setActiveScope] = useState<'admin' | 'cliente'>('admin');
  const [activeAdminTab, setActiveAdminTab] = useState<'meta' | 'google' | 'uazapi' | 'asaas' | 'ai'>('meta');

  // Master Admin Credentials State
  const [adminCreds, setAdminCreds] = useState({
    meta_bm_id: '791208745012339',
    meta_access_token: '',
    meta_app_secret: '',
    google_mcc_id: '262-638-1700',
    google_developer_token: '',
    google_client_id: '',
    google_client_secret: '',
    google_refresh_token: '',
    uazapi_url: 'https://api.uazapi.com',
    uazapi_token: '',
    uazapi_instance: 'inst_swiftsail_live',
    asaas_api_key: '',
    asaas_environment: 'production',
    openrouter_api_key: '',
    ai_default_model: 'deepseek/deepseek-v4-pro',
  });

  // Client Specific Kommo CRM Credentials State
  const [clientCreds, setClientCreds] = useState<{
    [clientId: string]: { subdomain: string; token: string; pipelineId: string };
  }>({});

  const [currentClientSubdomain, setCurrentClientSubdomain] = useState('');
  const [currentClientToken, setCurrentClientToken] = useState('');
  const [currentClientPipeline, setCurrentClientPipeline] = useState('');

  const [showKeys, setShowKeys] = useState<{ [key: string]: boolean }>({});
  const [isSavingAdmin, setIsSavingAdmin] = useState(false);
  const [isSavingClient, setIsSavingClient] = useState(false);
  const [adminFeedback, setAdminFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [clientFeedback, setClientFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Testing Connection
  const [testingService, setTestingService] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{
    [service: string]: { success: boolean; message: string; latency?: number };
  }>({});

  // Load Admin credentials from API
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
  }, []);

  // Update client form when client selection changes
  useEffect(() => {
    if (selectedClientId && selectedClientId !== 'ALL') {
      const saved = clientCreds[selectedClientId] || {
        subdomain: selectedClientId.toLowerCase().replace('_', ''),
        token: '',
        pipelineId: '',
      };
      setCurrentClientSubdomain(saved.subdomain);
      setCurrentClientToken(saved.token);
      setCurrentClientPipeline(saved.pipelineId);
    }
  }, [selectedClientId, clientCreds]);

  const toggleShow = (key: string) => {
    setShowKeys((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSaveAdmin = async () => {
    setIsSavingAdmin(true);
    setAdminFeedback(null);
    try {
      const res = await fetch('/api/credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credentials: adminCreds }),
      });
      const data = await res.json();
      if (data.success) {
        setAdminFeedback({ type: 'success', text: 'Credenciais Master salvas com sucesso no Supabase.' });
      } else {
        setAdminFeedback({ type: 'error', text: data.error || 'Erro ao salvar.' });
      }
    } catch {
      setAdminFeedback({ type: 'error', text: 'Falha de comunicação com o servidor.' });
    } finally {
      setIsSavingAdmin(false);
    }
  };

  const handleSaveClientKommo = async () => {
    if (!selectedClientId || selectedClientId === 'ALL') {
      alert('Selecione um cliente específico para salvar suas credenciais Kommo CRM.');
      return;
    }
    setIsSavingClient(true);
    setClientFeedback(null);
    try {
      const res = await fetch('/api/credentials/client', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cliente_id: selectedClientId,
          kommo_subdomain: currentClientSubdomain,
          kommo_token: currentClientToken,
          kommo_pipeline_id: currentClientPipeline,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setClientFeedback({ type: 'success', text: data.message });
        setClientCreds((prev) => ({
          ...prev,
          [selectedClientId]: {
            subdomain: currentClientSubdomain,
            token: currentClientToken,
            pipelineId: currentClientPipeline,
          },
        }));
      } else {
        setClientFeedback({ type: 'error', text: data.error || 'Erro ao salvar.' });
      }
    } catch {
      setClientFeedback({ type: 'error', text: 'Falha ao salvar credenciais do cliente.' });
    } finally {
      setIsSavingClient(false);
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

  const metaAccounts = activeClientAdAccounts.filter((a) => a.plataforma === 'meta');
  const googleAccounts = activeClientAdAccounts.filter((a) => a.plataforma === 'google');

  return (
    <div className="space-y-6">
      {/* Scope Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-cyan-400" />
            Gerenciamento de Credenciais
          </h2>
          <p className="text-xs text-slate-400">
            Separação estrita: Chaves Globais da Agência vs Credenciais de CRM Kommo por Cliente
          </p>
        </div>

        {/* Scope Switcher */}
        <div className="flex bg-slate-900/90 border border-slate-800 rounded-xl p-1 text-xs">
          <button
            onClick={() => setActiveScope('admin')}
            className={`px-4 py-1.5 rounded-lg font-bold transition-all flex items-center gap-2 ${
              activeScope === 'admin'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Server className="w-3.5 h-3.5" />
            1. Credenciais Master Admin (Swiftsail)
          </button>
          <button
            onClick={() => setActiveScope('cliente')}
            className={`px-4 py-1.5 rounded-lg font-bold transition-all flex items-center gap-2 ${
              activeScope === 'cliente'
                ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-lg shadow-amber-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Building className="w-3.5 h-3.5" />
            2. Credenciais de Clientes (Kommo CRM)
          </button>
        </div>
      </div>

      {/* ================= SCOPE 1: MASTER ADMIN CREDENTIALS ================= */}
      {activeScope === 'admin' ? (
        <div className="space-y-6">
          <div className="glass-card p-4 border-cyan-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-cyan-400" />
                Acesso Global da Agência Swiftsail
              </h3>
              <p className="text-[11px] text-slate-400">
                Seu BM e sua MCC gerenciam todas as contas dos 14 clientes. O cliente não precisa fornecer chaves de Meta/Google Ads.
              </p>
            </div>
            <button
              onClick={handleSaveAdmin}
              disabled={isSavingAdmin}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 flex items-center gap-1.5 transition-colors shadow-lg shadow-cyan-500/20"
            >
              {isSavingAdmin ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              Salvar Chaves Master no Supabase
            </button>
          </div>

          {adminFeedback && (
            <div
              className={`p-3.5 rounded-xl text-xs font-semibold flex items-center gap-2 border ${
                adminFeedback.type === 'success'
                  ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                  : 'bg-rose-500/10 text-rose-300 border-rose-500/30'
              }`}
            >
              {adminFeedback.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-400" />
              )}
              <span>{adminFeedback.text}</span>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Admin Tabs Left */}
            <div className="lg:col-span-4 space-y-1">
              <div className="glass-card p-2 space-y-1">
                <button
                  onClick={() => setActiveAdminTab('meta')}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    activeAdminTab === 'meta'
                      ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Zap className="w-4 h-4 text-blue-400" />
                    <span>BM Parceiro Meta (Global)</span>
                  </div>
                  {adminCreds.meta_access_token && <Check className="w-3.5 h-3.5 text-blue-400" />}
                </button>

                <button
                  onClick={() => setActiveAdminTab('google')}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    activeAdminTab === 'google'
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Search className="w-4 h-4 text-cyan-400" />
                    <span>MCC Gerenciador Google Ads</span>
                  </div>
                  {adminCreds.google_developer_token && <Check className="w-3.5 h-3.5 text-cyan-400" />}
                </button>

                <button
                  onClick={() => setActiveAdminTab('uazapi')}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    activeAdminTab === 'uazapi'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Radio className="w-4 h-4 text-emerald-400" />
                    <span>Uazapi WhatsApp Server</span>
                  </div>
                  {adminCreds.uazapi_token && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                </button>

                <button
                  onClick={() => setActiveAdminTab('asaas')}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    activeAdminTab === 'asaas'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <CreditCard className="w-4 h-4 text-emerald-400" />
                    <span>Asaas Financeiro (Agência)</span>
                  </div>
                  {adminCreds.asaas_api_key && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                </button>

                <button
                  onClick={() => setActiveAdminTab('ai')}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    activeAdminTab === 'ai'
                      ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Bot className="w-4 h-4 text-purple-400" />
                    <span>OpenRouter / Grok AI</span>
                  </div>
                  {adminCreds.openrouter_api_key && <Check className="w-3.5 h-3.5 text-purple-400" />}
                </button>
              </div>
            </div>

            {/* Admin Form Right */}
            <div className="lg:col-span-8">
              {/* META BM TAB */}
              {activeAdminTab === 'meta' && (
                <div className="glass-card p-6 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div>
                      <h3 className="text-sm font-bold text-white flex items-center gap-2">
                        <Zap className="w-4 h-4 text-blue-400" />
                        Meta Ads BM Parceiro Swiftsail
                      </h3>
                      <p className="text-xs text-slate-400">Acesso global a todas as 36 contas de clientes vinculadas</p>
                    </div>
                    <button
                      onClick={() => handleTestConnection('meta')}
                      disabled={testingService === 'meta'}
                      className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-blue-400 border border-blue-500/20 flex items-center gap-1.5 transition-colors"
                    >
                      {testingService === 'meta' ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
                      Testar Graph API
                    </button>
                  </div>

                  {testResult['meta'] && (
                    <div className={`p-3 rounded-xl text-xs border ${testResult['meta'].success ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30' : 'bg-rose-500/10 text-rose-300 border-rose-500/30'}`}>
                      <p className="font-semibold">{testResult['meta'].message}</p>
                    </div>
                  )}

                  <div className="space-y-4 text-xs">
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">ID do BM Parceiro</label>
                      <input
                        type="text"
                        value={adminCreds.meta_bm_id}
                        onChange={(e) => setAdminCreds({ ...adminCreds, meta_bm_id: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">System User Access Token (Global)</label>
                      <div className="relative">
                        <input
                          type={showKeys['meta'] ? 'text' : 'password'}
                          value={adminCreds.meta_access_token}
                          onChange={(e) => setAdminCreds({ ...adminCreds, meta_access_token: e.target.value })}
                          placeholder="EAA..."
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 pr-10 text-white font-mono"
                        />
                        <button onClick={() => toggleShow('meta')} className="absolute right-3 top-2.5 text-slate-400 hover:text-white">
                          {showKeys['meta'] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* GOOGLE MCC TAB */}
              {activeAdminTab === 'google' && (
                <div className="glass-card p-6 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div>
                      <h3 className="text-sm font-bold text-white flex items-center gap-2">
                        <Search className="w-4 h-4 text-cyan-400" />
                        Google Ads MCC Gerenciador Swiftsail
                      </h3>
                      <p className="text-xs text-slate-400">Acesso mestre a todos os Customer IDs de clientes</p>
                    </div>
                    <button
                      onClick={() => handleTestConnection('google')}
                      disabled={testingService === 'google'}
                      className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-cyan-400 border border-cyan-500/20 flex items-center gap-1.5 transition-colors"
                    >
                      {testingService === 'google' ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
                      Testar Google API
                    </button>
                  </div>

                  <div className="space-y-4 text-xs">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-slate-300 font-semibold mb-1">MCC ID Swiftsail</label>
                        <input
                          type="text"
                          value={adminCreds.google_mcc_id}
                          onChange={(e) => setAdminCreds({ ...adminCreds, google_mcc_id: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-300 font-semibold mb-1">Developer Token</label>
                        <input
                          type="password"
                          value={adminCreds.google_developer_token}
                          onChange={(e) => setAdminCreds({ ...adminCreds, google_developer_token: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* UAZAPI TAB */}
              {activeAdminTab === 'uazapi' && (
                <div className="glass-card p-6 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div>
                      <h3 className="text-sm font-bold text-white flex items-center gap-2">
                        <Radio className="w-4 h-4 text-emerald-400" />
                        Servidor Uazapi Socket Swiftsail
                      </h3>
                      <p className="text-xs text-slate-400">Instância global para conexões e disparos</p>
                    </div>
                    <button
                      onClick={() => handleTestConnection('uazapi')}
                      disabled={testingService === 'uazapi'}
                      className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5 transition-colors"
                    >
                      {testingService === 'uazapi' ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
                      Testar Uazapi
                    </button>
                  </div>

                  <div className="space-y-4 text-xs">
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">URL do Servidor Uazapi</label>
                      <input
                        type="text"
                        value={adminCreds.uazapi_url}
                        onChange={(e) => setAdminCreds({ ...adminCreds, uazapi_url: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Token de Admin Global</label>
                      <div className="relative">
                        <input
                          type={showKeys['uazapi'] ? 'text' : 'password'}
                          value={adminCreds.uazapi_token}
                          onChange={(e) => setAdminCreds({ ...adminCreds, uazapi_token: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 pr-10 text-white font-mono"
                        />
                        <button onClick={() => toggleShow('uazapi')} className="absolute right-3 top-2.5 text-slate-400 hover:text-white">
                          {showKeys['uazapi'] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ASAAS TAB */}
              {activeAdminTab === 'asaas' && (
                <div className="glass-card p-6 space-y-4">
                  <div className="border-b border-slate-800 pb-3">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-emerald-400" />
                      Asaas Pagamentos & Faturamento
                    </h3>
                    <p className="text-xs text-slate-400">Conta da Swiftsail para geração de PIX e faturas de clientes</p>
                  </div>

                  <div className="space-y-4 text-xs">
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Chave de API Asaas ($aact_...)</label>
                      <input
                        type="password"
                        value={adminCreds.asaas_api_key}
                        onChange={(e) => setAdminCreds({ ...adminCreds, asaas_api_key: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* AI TAB */}
              {activeAdminTab === 'ai' && (
                <div className="glass-card p-6 space-y-4">
                  <div className="border-b border-slate-800 pb-3">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <Bot className="w-4 h-4 text-purple-400" />
                      OpenRouter & Grok AI
                    </h3>
                    <p className="text-xs text-slate-400">Motor de IA da agência para criativos e automações</p>
                  </div>

                  <div className="space-y-4 text-xs">
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Chave de API OpenRouter / xAI</label>
                      <input
                        type="password"
                        value={adminCreds.openrouter_api_key}
                        onChange={(e) => setAdminCreds({ ...adminCreds, openrouter_api_key: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* ================= SCOPE 2: CLIENT KOMMO CRM CREDENTIALS ================= */
        <div className="space-y-6">
          {/* Client Picker */}
          <div className="glass-card p-5 space-y-3 border-amber-500/30">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Building className="w-4 h-4 text-amber-400" />
                  Selecione o Cliente para Configurar o Kommo CRM
                </h3>
                <p className="text-[11px] text-slate-400">
                  O cliente possui seu próprio CRM Kommo com pipeline e leads isolados.
                </p>
              </div>
              <select
                value={selectedClientId}
                onChange={(e) => setSelectedClientId(e.target.value)}
                className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-white focus:border-amber-500 focus:outline-none min-w-[240px]"
              >
                {clients.map((c) => (
                  <option key={c.cliente_id} value={c.cliente_id}>
                    {c.nome} ({c.cliente_id})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {clientFeedback && (
            <div
              className={`p-3.5 rounded-xl text-xs font-semibold flex items-center gap-2 border ${
                clientFeedback.type === 'success'
                  ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                  : 'bg-rose-500/10 text-rose-300 border-rose-500/30'
              }`}
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>{clientFeedback.text}</span>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Kommo Form */}
            <div className="lg:col-span-7 glass-card p-6 space-y-4">
              <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <KanbanSquare className="w-4 h-4 text-amber-400" />
                    Kommo CRM de {activeClient?.nome || selectedClientId}
                  </h3>
                  <p className="text-xs text-slate-400">Tokens e pipelines do CRM do cliente</p>
                </div>
                <button
                  onClick={handleSaveClientKommo}
                  disabled={isSavingClient}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 flex items-center gap-1.5 transition-colors shadow-lg shadow-amber-500/20"
                >
                  {isSavingClient ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  Salvar Kommo do Cliente
                </button>
              </div>

              <div className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Subdomínio Kommo do Cliente</label>
                  <input
                    type="text"
                    value={currentClientSubdomain}
                    onChange={(e) => setCurrentClientSubdomain(e.target.value)}
                    placeholder="ex: dabol, adriatica (sem .kommo.com)"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Long-Lived Access Token (Kommo)</label>
                  <div className="relative">
                    <input
                      type={showKeys['client_kommo'] ? 'text' : 'password'}
                      value={currentClientToken}
                      onChange={(e) => setCurrentClientToken(e.target.value)}
                      placeholder="eyJ0eXAi..."
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 pr-10 text-white font-mono focus:border-amber-500 focus:outline-none"
                    />
                    <button
                      onClick={() => toggleShow('client_kommo')}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-white"
                    >
                      {showKeys['client_kommo'] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">ID do Pipeline Principal</label>
                  <input
                    type="text"
                    value={currentClientPipeline}
                    onChange={(e) => setCurrentClientPipeline(e.target.value)}
                    placeholder="ex: 889210"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Client Metadata Card (Supabase Linked Accounts) */}
            <div className="lg:col-span-5 glass-card p-6 space-y-4">
              <div className="border-b border-slate-800 pb-3">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Database className="w-4 h-4 text-cyan-400" />
                  Recursos do Cliente no Supabase
                </h3>
                <p className="text-[11px] text-slate-400">Atribuídos pelo BM e MCC da Swiftsail</p>
              </div>

              <div className="space-y-3 text-xs">
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase font-bold flex items-center gap-1.5">
                    <MessageSquare className="w-3 h-3 text-emerald-400" /> Grupo WhatsApp
                  </span>
                  <p className="font-mono text-cyan-300 truncate">
                    {activeClient?.grupo_whatsapp_id || 'Nenhum grupo vinculado'}
                  </p>
                </div>

                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase font-bold flex items-center gap-1.5">
                    <FolderTree className="w-3 h-3 text-amber-400" /> Google Drive Folder
                  </span>
                  <p className="font-mono text-slate-300 truncate">
                    {activeClient?.drive_folder_id || 'Nenhuma pasta vinculada'}
                  </p>
                </div>

                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                  <span className="text-[10px] text-slate-400 uppercase font-bold flex items-center gap-1.5">
                    <Zap className="w-3 h-3 text-blue-400" /> Contas Atribuídas no BM / MCC
                  </span>
                  <div className="space-y-1 font-mono text-[11px]">
                    {metaAccounts.map((a) => (
                      <div key={a.id} className="text-blue-300 truncate">
                        • [Meta] {a.account_name} ({a.account_id})
                      </div>
                    ))}
                    {googleAccounts.map((a) => (
                      <div key={a.id} className="text-cyan-300 truncate">
                        • [Google] {a.account_name} ({a.account_id})
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
