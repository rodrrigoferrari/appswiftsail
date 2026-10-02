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
} from 'lucide-react';

export default function AdminCredentialsPage() {
  const [activeTab, setActiveAdminTab] = useState<'meta' | 'google' | 'uazapi' | 'asaas' | 'ai'>('uazapi');

  const [adminCreds, setAdminCreds] = useState({
    uazapi_url: 'https://api.uazapi.com',
    uazapi_token: '',
    meta_bm_id: '791208745012339',
    meta_access_token: '',
    google_mcc_id: '262-638-1700',
    google_developer_token: '',
    asaas_api_key: '',
    openrouter_api_key: '',
    ai_default_model: 'deepseek/deepseek-v4-pro',
  });

  const [showKeys, setShowKeys] = useState<{ [key: string]: boolean }>({});
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [testingService, setTestingService] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{
    [service: string]: { success: boolean; message: string; latency?: number };
  }>({});

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
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="glass-card p-6 border-cyan-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900/90 via-slate-900/60 to-cyan-950/20">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 uppercase tracking-wider">
              Nível Administrador Global
            </span>
          </div>
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            <Server className="w-5 h-5 text-cyan-400" />
            Credenciais Master Admin (Swiftsail)
          </h2>
          <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
            Chaves mestras da agência para provisionar instâncias, gerenciar as 36 contas de anúncios via BM/MCC e executar automações. O cliente não possui acesso a estas chaves.
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={isSaving}
          className="px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-lg shadow-cyan-500/20 flex items-center gap-2 transition-all self-start md:self-auto"
        >
          {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Salvar Chaves Master no Supabase
        </button>
      </div>

      {feedback && (
        <div
          className={`p-4 rounded-xl text-xs font-semibold flex items-center gap-2 border ${
            feedback.type === 'success'
              ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
              : 'bg-rose-500/10 text-rose-300 border-rose-500/30'
          }`}
        >
          {feedback.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <AlertCircle className="w-4 h-4 text-rose-400" />}
          <span>{feedback.text}</span>
        </div>
      )}

      {/* Grid: Navigation Tabs + Settings Form */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Side Tabs */}
        <div className="lg:col-span-4 space-y-1">
          <div className="glass-card p-2 space-y-1">
            <button
              onClick={() => setActiveAdminTab('uazapi')}
              className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'uazapi'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Radio className="w-4 h-4 text-emerald-400" />
                <span>1. Uazapi Server & Admin Token</span>
              </div>
              {adminCreds.uazapi_token && <Check className="w-3.5 h-3.5 text-emerald-400" />}
            </button>

            <button
              onClick={() => setActiveAdminTab('meta')}
              className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'meta'
                  ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Zap className="w-4 h-4 text-blue-400" />
                <span>2. Meta Ads BM Parceiro (Global)</span>
              </div>
              {adminCreds.meta_access_token && <Check className="w-3.5 h-3.5 text-blue-400" />}
            </button>

            <button
              onClick={() => setActiveAdminTab('google')}
              className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'google'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Search className="w-4 h-4 text-cyan-400" />
                <span>3. Google Ads MCC Gerenciador</span>
              </div>
              {adminCreds.google_developer_token && <Check className="w-3.5 h-3.5 text-cyan-400" />}
            </button>

            <button
              onClick={() => setActiveAdminTab('asaas')}
              className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'asaas'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <CreditCard className="w-4 h-4 text-emerald-400" />
                <span>4. Asaas Financeiro (Swiftsail)</span>
              </div>
              {adminCreds.asaas_api_key && <Check className="w-3.5 h-3.5 text-emerald-400" />}
            </button>

            <button
              onClick={() => setActiveAdminTab('ai')}
              className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'ai'
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Bot className="w-4 h-4 text-purple-400" />
                <span>5. IA (OpenRouter / Grok)</span>
              </div>
              {adminCreds.openrouter_api_key && <Check className="w-3.5 h-3.5 text-purple-400" />}
            </button>
          </div>
        </div>

        {/* Right Side Form Content */}
        <div className="lg:col-span-8">
          {/* UAZAPI TAB */}
          {activeTab === 'uazapi' && (
            <div className="glass-card p-6 space-y-5">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Radio className="w-4 h-4 text-emerald-400" />
                    Uazapi Server URL & Admin Token
                  </h3>
                  <p className="text-xs text-slate-400">
                    O <b>admintoken</b> é o precursor que cria e gerencia instâncias de cada cliente automaticamente
                  </p>
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

              {testResult['uazapi'] && (
                <div
                  className={`p-3.5 rounded-xl text-xs border ${
                    testResult['uazapi'].success
                      ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                      : 'bg-rose-500/10 text-rose-300 border-rose-500/30'
                  }`}
                >
                  <p className="font-semibold">{testResult['uazapi'].message}</p>
                  {testResult['uazapi'].latency && (
                    <p className="text-[10px] opacity-80 mt-0.5">Latência: {testResult['uazapi'].latency}ms</p>
                  )}
                </div>
              )}

              <div className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Server URL da Uazapi</label>
                  <input
                    type="text"
                    value={adminCreds.uazapi_url}
                    onChange={(e) => setAdminCreds({ ...adminCreds, uazapi_url: e.target.value })}
                    placeholder="https://api.uazapi.com ou https://seu-servidor.com"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Admin Token Global (Header: <code>admintoken</code>)
                  </label>
                  <div className="relative">
                    <input
                      type={showKeys['uazapi_admin'] ? 'text' : 'password'}
                      value={adminCreds.uazapi_token}
                      onChange={(e) => setAdminCreds({ ...adminCreds, uazapi_token: e.target.value })}
                      placeholder="Insira o admintoken da sua conta administrativa Uazapi"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 pr-10 text-white font-mono focus:border-emerald-500 focus:outline-none"
                    />
                    <button
                      onClick={() => toggleShow('uazapi_admin')}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-white"
                    >
                      {showKeys['uazapi_admin'] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">
                    Permite criar instâncias isoladas com <code>POST /instance/create</code> para qualquer cliente.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* META BM TAB */}
          {activeTab === 'meta' && (
            <div className="glass-card p-6 space-y-5">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Zap className="w-4 h-4 text-blue-400" />
                    BM Parceiro Meta (Global)
                  </h3>
                  <p className="text-xs text-slate-400">
                    Acessa e gerencia as contas de anúncios de todos os clientes cadastrados
                  </p>
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
                <div
                  className={`p-3.5 rounded-xl text-xs border ${
                    testResult['meta'].success
                      ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                      : 'bg-rose-500/10 text-rose-300 border-rose-500/30'
                  }`}
                >
                  <p className="font-semibold">{testResult['meta'].message}</p>
                </div>
              )}

              <div className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">ID do BM Parceiro Swiftsail</label>
                  <input
                    type="text"
                    value={adminCreds.meta_bm_id}
                    onChange={(e) => setAdminCreds({ ...adminCreds, meta_bm_id: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:border-blue-500 focus:outline-none"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">BM ID Swiftsail: 791208745012339</p>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    System User Access Token (Permissões de Gerenciamento)
                  </label>
                  <div className="relative">
                    <input
                      type={showKeys['meta'] ? 'text' : 'password'}
                      value={adminCreds.meta_access_token}
                      onChange={(e) => setAdminCreds({ ...adminCreds, meta_access_token: e.target.value })}
                      placeholder="EAA..."
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 pr-10 text-white font-mono focus:border-blue-500 focus:outline-none"
                    />
                    <button
                      onClick={() => toggleShow('meta')}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-white"
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
            <div className="glass-card p-6 space-y-5">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Search className="w-4 h-4 text-cyan-400" />
                    Google Ads MCC Gerenciador Swiftsail
                  </h3>
                  <p className="text-xs text-slate-400">Conta gerente para todas as contas de clientes vinculadas</p>
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
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">MCC ID Swiftsail</label>
                    <input
                      type="text"
                      value={adminCreds.google_mcc_id}
                      onChange={(e) => setAdminCreds({ ...adminCreds, google_mcc_id: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:border-cyan-500 focus:outline-none"
                    />
                    <p className="text-[10px] text-slate-500 mt-1">MCC Swiftsail: 262-638-1700</p>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Developer Token</label>
                    <input
                      type="password"
                      value={adminCreds.google_developer_token}
                      onChange={(e) => setAdminCreds({ ...adminCreds, google_developer_token: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:border-cyan-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ASAAS TAB */}
          {activeTab === 'asaas' && (
            <div className="glass-card p-6 space-y-5">
              <div className="border-b border-slate-800 pb-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-emerald-400" />
                  Asaas Gateway de Cobranças (Swiftsail)
                </h3>
                <p className="text-xs text-slate-400">Conta da agência para emissão de PIX e faturas</p>
              </div>

              <div className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Chave de API Asaas ($aact_...)</label>
                  <input
                    type="password"
                    value={adminCreds.asaas_api_key}
                    onChange={(e) => setAdminCreds({ ...adminCreds, asaas_api_key: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* AI TAB */}
          {activeTab === 'ai' && (
            <div className="glass-card p-6 space-y-5">
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
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:border-purple-500 focus:outline-none"
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
