'use client';

import React, { useState, useEffect } from 'react';
import {
  Cpu,
  KeyRound,
  Eye,
  EyeOff,
  Save,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  ExternalLink,
  Coins,
  Gauge,
  Activity,
  Zap,
} from 'lucide-react';
import { OPENROUTER_MODELS } from '../ia/page';

export default function AdminOpenRouterPage() {
  const [openrouterKey, setOpenrouterKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [defaultModel, setDefaultModel] = useState('anthropic/claude-3.5-sonnet');
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Status e Consumo da Chave
  const [isLoadingUsage, setIsLoadingUsage] = useState(false);
  const [usageData, setUsageData] = useState<{
    label?: string;
    usage?: number;
    limit?: number | null;
    is_free_tier?: boolean;
    rate_limit?: { requests: number; interval: string };
  } | null>(null);
  const [latency, setLatency] = useState<number | null>(null);
  const [usageError, setUsageError] = useState<string | null>(null);

  const fetchUsage = async (keyOverride?: string) => {
    setIsLoadingUsage(true);
    setUsageError(null);
    try {
      const activeKey = keyOverride !== undefined ? keyOverride : openrouterKey;
      const url = activeKey ? `/api/openrouter/usage?key=${encodeURIComponent(activeKey)}` : '/api/openrouter/usage';
      const res = await fetch(url);
      const data = await res.json();
      if (data.success && data.data) {
        setUsageData(data.data);
        setLatency(data.latency);
      } else {
        setUsageError(data.error || 'Não foi possível obter dados de consumo.');
      }
    } catch {
      setUsageError('Erro ao consultar o serviço da OpenRouter.');
    } finally {
      setIsLoadingUsage(false);
    }
  };

  useEffect(() => {
    async function loadCreds() {
      try {
        const res = await fetch('/api/credentials');
        const data = await res.json();
        if (data.success && data.credentials) {
          if (data.credentials.openrouter_api_key) {
            setOpenrouterKey(data.credentials.openrouter_api_key);
            fetchUsage(data.credentials.openrouter_api_key);
          }
          if (data.credentials.ai_default_model) {
            setDefaultModel(data.credentials.ai_default_model);
          }
        }
      } catch (err) {
        console.error('Falha ao carregar credenciais da OpenRouter', err);
      }
    }
    loadCreds();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    setFeedback(null);
    try {
      const resCreds = await fetch('/api/credentials');
      const credsData = await resCreds.json();
      const merged = {
        ...(credsData.credentials || {}),
        openrouter_api_key: openrouterKey,
        ai_default_model: defaultModel,
      };

      const res = await fetch('/api/credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credentials: merged }),
      });
      const data = await res.json();
      if (data.success) {
        setFeedback({ type: 'success', text: 'Chave e configurações da OpenRouter salvas com sucesso!' });
        fetchUsage(openrouterKey);
      } else {
        setFeedback({ type: 'error', text: data.error || 'Erro ao salvar.' });
      }
    } catch {
      setFeedback({ type: 'error', text: 'Falha ao salvar credenciais da OpenRouter.' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 font-sans select-none max-w-5xl mx-auto">
      {/* Top Banner */}
      <div className="bg-white border border-[#E2E8F0] p-6 rounded-2xl shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-[#EFF4FF] text-[#0050FF] border border-[#BFDBFE] uppercase tracking-wider">
              Governança Master • Provedor de IA
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#0F172A] flex items-center gap-2.5">
            <Cpu className="w-6 h-6 text-purple-600" />
            OpenRouter: Token & Gestão de Consumo
          </h1>
          <p className="text-xs text-[#64748B] max-w-2xl leading-relaxed">
            A Swiftsail utiliza a OpenRouter como gateway unificado para LLMs (Claude 3.5 Sonnet, GPT-4o, Gemini 2.0, DeepSeek e Llama 3.3). Gerencie a chave de API e acompanhe o consumo em tempo real.
          </p>
        </div>

        <a
          href="https://openrouter.ai/settings/credits"
          target="_blank"
          rel="noopener noreferrer"
          className="px-4 py-2.5 rounded-xl text-xs font-bold bg-[#F8FAFC] hover:bg-[#EFF4FF] text-[#0050FF] border border-[#BFDBFE] flex items-center gap-1.5 shadow-xs cursor-pointer transition-all self-start md:self-auto"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          <span>Comprar Créditos OpenRouter</span>
        </a>
      </div>

      {feedback && (
        <div
          className={`p-3.5 rounded-xl text-xs font-semibold flex items-center gap-2 border ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : 'bg-rose-50 text-rose-700 border-rose-200'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{feedback.text}</span>
        </div>
      )}

      {/* Grid de Métricas de Consumo em Tempo Real */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {/* Consumo Acumulado */}
        <div className="bg-white border border-[#E2E8F0] p-5 rounded-2xl shadow-xs space-y-1">
          <div className="flex items-center justify-between text-[#64748B]">
            <span className="text-[11px] font-bold uppercase tracking-wider">Consumo da Chave</span>
            <Coins className="w-4 h-4 text-purple-600" />
          </div>
          <p className="text-2xl font-bold text-[#0F172A] mt-1 font-mono">
            {usageData?.usage !== undefined ? `$${Number(usageData.usage).toFixed(4)}` : '---'}
          </p>
          <p className="text-[10px] text-[#64748B]">Total consumido em dólares (USD)</p>
        </div>

        {/* Limite de Crédito */}
        <div className="bg-white border border-[#E2E8F0] p-5 rounded-2xl shadow-xs space-y-1">
          <div className="flex items-center justify-between text-[#64748B]">
            <span className="text-[11px] font-bold uppercase tracking-wider">Limite Definido</span>
            <Gauge className="w-4 h-4 text-[#0050FF]" />
          </div>
          <p className="text-2xl font-bold text-[#0F172A] mt-1 font-mono">
            {usageData?.limit ? `$${usageData.limit}` : 'Ilimitado'}
          </p>
          <p className="text-[10px] text-[#64748B]">Teto de gastos por chave</p>
        </div>

        {/* Categoria / Nível de Conta */}
        <div className="bg-white border border-[#E2E8F0] p-5 rounded-2xl shadow-xs space-y-1">
          <div className="flex items-center justify-between text-[#64748B]">
            <span className="text-[11px] font-bold uppercase tracking-wider">Nível de Conta</span>
            <Zap className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-xl font-bold text-[#0F172A] mt-1">
            {usageData ? (usageData.is_free_tier ? 'Free Tier' : 'Crédito Ativo') : '---'}
          </p>
          <p className="text-[10px] text-[#64748B]">
            {usageData?.rate_limit ? `${usageData.rate_limit.requests} req / ${usageData.rate_limit.interval}` : 'Taxa padrão'}
          </p>
        </div>

        {/* Latência / Status da Conexão */}
        <div className="bg-white border border-[#E2E8F0] p-5 rounded-2xl shadow-xs space-y-1">
          <div className="flex items-center justify-between text-[#64748B]">
            <span className="text-[11px] font-bold uppercase tracking-wider">Status API</span>
            <Activity className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="flex items-center gap-1.5 mt-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <p className="text-xl font-bold text-[#0F172A]">Operacional</p>
          </div>
          <p className="text-[10px] text-emerald-700 font-mono">
            {latency ? `Latência: ${latency}ms` : 'Pronto para inferência'}
          </p>
        </div>
      </div>

      {usageError && (
        <div className="p-3.5 rounded-xl text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{usageError}</span>
          </div>
          <button
            onClick={() => fetchUsage()}
            className="text-[11px] font-bold underline cursor-pointer"
          >
            Tentar Novamente
          </button>
        </div>
      )}

      {/* Formulário de Configuração do Token */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-xs space-y-5">
        <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-3">
          <div>
            <h3 className="text-sm font-bold text-[#0F172A] flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-[#0050FF]" />
              Chave de API OpenRouter
            </h3>
            <p className="text-xs text-[#64748B] mt-0.5">
              Utilizada para alimentar o Agente Sinapse, o chat de IA do cliente e os geradores de criativos.
            </p>
          </div>

          <button
            type="button"
            onClick={() => fetchUsage()}
            disabled={isLoadingUsage}
            className="px-3.5 py-1.5 rounded-xl border border-[#CBD5E1] bg-white hover:bg-[#F8FAFC] text-[#475569] font-bold text-xs flex items-center gap-1.5 shadow-xs cursor-pointer transition disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoadingUsage ? 'animate-spin text-[#0050FF]' : ''}`} />
            <span>Atualizar Métricas</span>
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-[#0F172A] mb-1">
              Token de Acesso (Bearer Key)
            </label>
            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                value={openrouterKey}
                onChange={(e) => setOpenrouterKey(e.target.value)}
                placeholder="sk-or-v1-..."
                className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl px-3.5 py-2.5 pr-10 text-xs font-mono text-[#0F172A] focus:border-[#0050FF] focus:bg-white focus:outline-none transition-colors shadow-2xs"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3 top-3 text-[#94A3B8] hover:text-[#0F172A] cursor-pointer"
              >
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {usageData?.label && (
              <p className="text-[11px] text-[#0050FF] font-semibold mt-1">
                Identificador da chave: <b>{usageData.label}</b>
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-[#0F172A] mb-1">
              Modelo Padrão Recomendado para Análises & BI
            </label>
            <select
              value={defaultModel}
              onChange={(e) => setDefaultModel(e.target.value)}
              className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl px-3 py-2.5 text-xs font-semibold text-[#0F172A] focus:border-[#0050FF] focus:bg-white focus:outline-none transition-colors shadow-2xs cursor-pointer"
            >
              {OPENROUTER_MODELS.map((group) => (
                <optgroup key={group.provider} label={group.provider}>
                  {group.models.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
            <p className="text-[10px] text-[#64748B] mt-1">
              Utilizado automaticamente quando nenhuma calibração de prompt específica sobrepõe o modelo.
            </p>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-[#0050FF] hover:bg-[#0040D6] text-white flex items-center gap-2 shadow-xs cursor-pointer transition disabled:opacity-50"
            >
              {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>Salvar Chave & Modelo</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
