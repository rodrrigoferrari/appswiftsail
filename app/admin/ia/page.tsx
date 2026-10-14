'use client';

import React, { useState, useEffect } from 'react';
import {
  Bot,
  Sparkles,
  KeyRound,
  Save,
  CheckCircle2,
  Image as ImageIcon,
  Video,
  Globe,
  BrainCircuit,
  RefreshCw,
  Cpu,
  Eye,
  EyeOff,
  ExternalLink,
  Zap,
  Check,
  AlertCircle,
} from 'lucide-react';
import { getCategoryCatalog } from '@/lib/ai/models-catalog';

export const OPENROUTER_MODELS = [
  {
    provider: 'Anthropic (via OpenRouter)',
    models: [
      { id: 'anthropic/claude-3.5-sonnet', name: 'Claude 3.5 Sonnet (Recomendado para Análises & BI)', badge: 'Recomendado' },
      { id: 'anthropic/claude-3.5-haiku', name: 'Claude 3.5 Haiku (Ultrarrápido & Econômico)', badge: 'Velocidade' },
      { id: 'anthropic/claude-3-opus', name: 'Claude 3 Opus (Raciocínio Pesado)', badge: 'Opus' },
    ],
  },
  {
    provider: 'OpenAI (via OpenRouter)',
    models: [
      { id: 'openai/gpt-4o', name: 'GPT-4o (Multimodal & Criativos de Imagem)', badge: 'Multimodal' },
      { id: 'openai/gpt-4o-mini', name: 'GPT-4o Mini (Ágil & Leve)', badge: 'Mini' },
      { id: 'openai/o1', name: 'OpenAI o1 (Raciocínio Lógico Profundo)', badge: 'o1' },
      { id: 'openai/o3-mini', name: 'OpenAI o3-mini (Raciocínio Rápido & Código)', badge: 'o3-mini' },
    ],
  },
  {
    provider: 'Google Gemini (via OpenRouter)',
    models: [
      { id: 'google/gemini-2.0-flash-001', name: 'Gemini 2.0 Flash (Nova Geração Ultrarrápida)', badge: '2.0 Flash' },
      { id: 'google/gemini-pro-1.5', name: 'Gemini 1.5 Pro (Janela de 2M Tokens)', badge: '1.5 Pro' },
      { id: 'google/gemini-flash-1.5', name: 'Gemini 1.5 Flash (Econômico)', badge: '1.5 Flash' },
    ],
  },
  {
    provider: 'DeepSeek (via OpenRouter)',
    models: [
      { id: 'deepseek/deepseek-chat', name: 'DeepSeek V3 (671B - Alta Eficiência)', badge: 'V3' },
      { id: 'deepseek/deepseek-r1', name: 'DeepSeek R1 (Raciocínio Aberto SOTA)', badge: 'R1' },
    ],
  },
  {
    provider: 'Meta Llama (via OpenRouter)',
    models: [
      { id: 'meta-llama/llama-3.3-70b-instruct', name: 'Llama 3.3 70B Instruct (Open Source SOTA)', badge: '70B' },
      { id: 'meta-llama/llama-3.1-405b-instruct', name: 'Llama 3.1 405B Instruct (Maior Modelo Aberto)', badge: '405B' },
    ],
  },
  {
    provider: 'xAI Grok (via OpenRouter)',
    models: [
      { id: 'x-ai/grok-2', name: 'Grok 2 (xAI)', badge: 'Grok 2' },
      { id: 'x-ai/grok-beta', name: 'Grok Beta (xAI)', badge: 'Beta' },
    ],
  },
];

const ALL_MODEL_IDS = OPENROUTER_MODELS.flatMap((g) => g.models.map((m) => m.id));

interface FeatureAIConfig {
  id: string;
  name: string;
  category: 'imagem' | 'video' | 'landing_page' | 'analise';
  description: string;
  selectedProvider: string;
  selectedModel: string;
  temperature: number;
  maxTokens: number;
  systemPrompt: string;
}

export default function AdminIAPage() {
  const [openrouterKey, setOpenrouterKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [existingAdminCreds, setExistingAdminCreds] = useState<Record<string, any>>({});

  const [features, setFeatures] = useState<FeatureAIConfig[]>([
    {
      id: 'campaign_analysis',
      name: 'Agente Sinapse: Análise de Tráfego & BI',
      category: 'analise',
      description: 'Audita campanhas de Meta Ads e Google Ads, responde dúvidas do cliente e sugere remanejamento de verba.',
      selectedProvider: 'OpenRouter',
      selectedModel: 'anthropic/claude-3.5-sonnet',
      temperature: 0.3,
      maxTokens: 3000,
      systemPrompt:
        'Você é o auditor de mídia paga e BI da Swiftsail. Analise métricas reais (CPA, CTR, ROAS, Gasto) e faça diagnósticos frios e matemáticos sem alucinação. Nunca invente dados.',
    },
    {
      id: 'creative_image',
      name: 'Geração de Criativos de Imagem',
      category: 'imagem',
      description: 'Gera conceitos visuais, briefings de design e variações de anúncios de alta conversão.',
      selectedProvider: 'OpenRouter',
      selectedModel: 'openai/gpt-4o',
      temperature: 0.7,
      maxTokens: 2048,
      systemPrompt:
        'Você é o Diretor de Arte e Copywriter Especialista da Swiftsail. Sua missão é criar anúncios visuais de alta conversão seguindo a psicologia de cores e regras das plataformas de tráfego (Meta e Google). Enfatize contraste, proposta de valor clara e sem elementos genéricos.',
    },
    {
      id: 'creative_video',
      name: 'Geração de Criativos de Vídeo',
      category: 'video',
      description: 'Elabora roteiros dinâmicos (Hooks, Corpo, CTA) e prompts cinemáticos para geradores de vídeo.',
      selectedProvider: 'OpenRouter',
      selectedModel: 'anthropic/claude-3.5-sonnet',
      temperature: 0.8,
      maxTokens: 3000,
      systemPrompt:
        'Você é especialista em retenção e scripts de vídeo para Reels e TikTok Ads. O gancho inicial (primeiros 3 segundos) deve reter 70%+ do público com quebra de padrão ou pergunta de alta identificação.',
    },
    {
      id: 'landing_pages',
      name: 'Geração de Landing Pages & Copy',
      category: 'landing_page',
      description: 'Estrutura seções de páginas de captura, headlines, quebra de objeções e ofertas irresistíveis.',
      selectedProvider: 'OpenRouter',
      selectedModel: 'anthropic/claude-3.5-sonnet',
      temperature: 0.6,
      maxTokens: 4096,
      systemPrompt:
        'Você é o mestre de Conversion Rate Optimization (CRO). Todas as landing pages devem ter hierarquia clara: Headline magnética, Subheadline esclarecedora, 3 Benefícios tangíveis, Prova Social, Oferta Irrecusável e FAQ com quebra de objeções.',
    },
  ]);

  const [activeTab, setActiveTab] = useState<'models' | 'tokens'>('tokens');
  const [selectedFeatureId, setSelectedFeatureId] = useState<string>('campaign_analysis');
  const [isSaving, setIsSaving] = useState(false);
  const [savedFeedback, setSavedFeedback] = useState(false);
  const [isTestingKey, setIsTestingKey] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; limit?: string } | null>(null);

  useEffect(() => {
    async function loadCreds() {
      try {
        const res = await fetch('/api/credentials');
        const data = await res.json();
        if (data.success && data.credentials) {
          setExistingAdminCreds(data.credentials);
          if (data.credentials.openrouter_api_key) {
            setOpenrouterKey(data.credentials.openrouter_api_key);
          }
          if (data.credentials.ai_default_model) {
            setFeatures((prev) =>
              prev.map((f) => (f.id === 'campaign_analysis' ? { ...f, selectedModel: data.credentials.ai_default_model } : f))
            );
          }
        }
      } catch (err) {
        console.error('Failed to load credentials in AdminIAPage', err);
      }
    }
    loadCreds();
  }, []);

  const selectedFeature = features.find((f) => f.id === selectedFeatureId) || features[0];
  const isCustomModel = !ALL_MODEL_IDS.includes(selectedFeature.selectedModel);

  const handleUpdateFeature = (field: keyof FeatureAIConfig, value: any) => {
    setFeatures((prev) =>
      prev.map((f) => (f.id === selectedFeatureId ? { ...f, [field]: value } : f))
    );
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSavedFeedback(false);
    try {
      const payload = {
        ...existingAdminCreds,
        openrouter_api_key: openrouterKey.trim(),
        ai_default_model: features.find((f) => f.id === 'campaign_analysis')?.selectedModel || 'anthropic/claude-3.5-sonnet',
      };

      const res = await fetch('/api/credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credentials: payload }),
      });
      const data = await res.json();
      if (data.success) {
        setExistingAdminCreds(payload);
        setSavedFeedback(true);
        setTimeout(() => setSavedFeedback(false), 3000);
      }
    } catch (err) {
      console.error('Failed to save AI credentials', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestOpenRouterKey = async () => {
    if (!openrouterKey.trim()) {
      setTestResult({ success: false, message: 'Digite uma chave OpenRouter antes de testar.' });
      return;
    }

    setIsTestingKey(true);
    setTestResult(null);

    try {
      const res = await fetch('https://openrouter.ai/api/v1/auth/key', {
        headers: {
          Authorization: `Bearer ${openrouterKey.trim()}`,
        },
      });

      const data = await res.json();
      if (res.ok && data.data) {
        const usage = data.data.usage ? ` (Uso: $${Number(data.data.usage).toFixed(2)})` : '';
        const limit = data.data.limit ? `Limite: $${Number(data.data.limit).toFixed(2)}` : 'Sem limite estrito';
        setTestResult({
          success: true,
          message: `Conexão bem-sucedida! Chave ativa e autorizada no OpenRouter.${usage}`,
          limit,
        });
      } else {
        setTestResult({
          success: false,
          message: data.error?.message || 'Chave inválida ou não autorizada pela OpenRouter.',
        });
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        message: 'Não foi possível validar a chave junto à API da OpenRouter.',
      });
    } finally {
      setIsTestingKey(false);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'imagem':
        return <ImageIcon className="w-4 h-4 text-[#0050FF]" />;
      case 'video':
        return <Video className="w-4 h-4 text-purple-600" />;
      case 'landing_page':
        return <Globe className="w-4 h-4 text-emerald-600" />;
      default:
        return <BrainCircuit className="w-4 h-4 text-amber-600" />;
    }
  };

  return (
    <div className="space-y-6 select-none font-sans">
      {/* Top Banner */}
      <div className="bg-white border border-[#E2E8F0] p-6 rounded-2xl shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-[#EFF4FF] text-[#0050FF] border border-[#BFDBFE] uppercase tracking-wider">
              Governança de Inteligência Artificial — OpenRouter Gateway
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#0F172A] flex items-center gap-2.5">
            <Bot className="w-6 h-6 text-[#0050FF]" />
            Módulo de IA & Calibração OpenRouter
          </h1>
          <p className="text-xs text-[#64748B] max-w-2xl leading-relaxed">
            Configure seu token único da <strong>OpenRouter</strong> para unificar o acesso a todos os modelos da plataforma (Claude 3.5 Sonnet, GPT-4o, Gemini 2.0, DeepSeek V3/R1 e Llama 3.3) com faturamento centralizado.
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={isSaving}
          className="bg-[#0050FF] hover:bg-[#0040D6] text-white px-5 py-2.5 rounded-full font-semibold text-xs sm:text-sm flex items-center gap-2 shadow-xs transition-all active:scale-95 cursor-pointer self-start md:self-auto"
        >
          {isSaving ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : savedFeedback ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-300" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          <span>{savedFeedback ? 'Configurações Salvas!' : 'Salvar Alterações'}</span>
        </button>
      </div>

      {/* Tabs Switcher */}
      <div className="flex items-center gap-2 border-b border-[#E2E8F0] pb-1">
        <button
          onClick={() => setActiveTab('tokens')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'tokens'
              ? 'bg-[#EFF4FF] text-[#0050FF] border border-[#BFDBFE] shadow-xs'
              : 'text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC]'
          }`}
        >
          <KeyRound className="w-4 h-4" />
          <span>Token de Acesso OpenRouter</span>
        </button>

        <button
          onClick={() => setActiveTab('models')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'models'
              ? 'bg-[#EFF4FF] text-[#0050FF] border border-[#BFDBFE] shadow-xs'
              : 'text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC]'
          }`}
        >
          <Cpu className="w-4 h-4" />
          <span>Modelos & Prompts por Funcionalidade</span>
        </button>
      </div>

      {/* ABA 1: TOKEN EXCLUSIVO OPENROUTER */}
      {activeTab === 'tokens' && (
        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-xs max-w-3xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#F1F5F9] pb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-200 text-purple-600 flex items-center justify-center shrink-0">
                <KeyRound className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h2 className="text-base font-bold text-[#0F172A]">Chave de API OpenRouter (Gateway Único)</h2>
                <p className="text-xs text-[#64748B]">
                  Uma única chave para alimentar todos os recursos de IA da agência e dos clientes
                </p>
              </div>
            </div>

            <a
              href="https://openrouter.ai/keys"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#F8FAFC] hover:bg-[#EFF4FF] text-[#0050FF] border border-[#E2E8F0] hover:border-[#BFDBFE] transition-colors w-fit shadow-2xs"
            >
              <span>Gerar chave na OpenRouter</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#475569] mb-1.5">
                OpenRouter API Key (sk-or-v1-...)
              </label>
              <div className="relative">
                <input
                  type={showKey ? 'text' : 'password'}
                  value={openrouterKey}
                  onChange={(e) => {
                    setOpenrouterKey(e.target.value);
                    setTestResult(null);
                  }}
                  placeholder="sk-or-v1-••••••••••••••••••••••••••••••••"
                  className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl px-3.5 py-2.5 pr-10 text-xs font-mono text-[#0F172A] focus:outline-none focus:border-[#0050FF] focus:bg-white shadow-2xs transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-3 top-2.5 text-[#94A3B8] hover:text-[#0F172A] cursor-pointer"
                  title={showKey ? 'Ocultar chave' : 'Exibir chave'}
                >
                  {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[11px] text-[#64748B] mt-1.5 leading-relaxed">
                Essa chave autoriza o módulo <strong>Perguntar para IA</strong> dos dashboards dos clientes, além dos geradores de copy, criativos e landing pages.
              </p>
            </div>

            {/* Ação de Teste de Conexão */}
            <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleTestOpenRouterKey}
                disabled={isTestingKey || !openrouterKey.trim()}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#EFF4FF] hover:bg-[#E0EAFF] text-[#0050FF] border border-[#BFDBFE] flex items-center gap-2 transition-all cursor-pointer shadow-xs disabled:opacity-50 disabled:cursor-not-allowed w-fit"
              >
                {isTestingKey ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Validando no OpenRouter...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-3.5 h-3.5" />
                    <span>Testar Conexão OpenRouter</span>
                  </>
                )}
              </button>

              <div className="text-[11px] text-[#64748B] flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>Compatível com Anthropic, OpenAI, Gemini, DeepSeek e Meta</span>
              </div>
            </div>

            {/* Feedback do Teste */}
            {testResult && (
              <div
                className={`p-4 rounded-xl border text-xs font-semibold flex items-start gap-2.5 animate-in fade-in duration-200 ${
                  testResult.success
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    : 'bg-rose-50 border-rose-200 text-rose-800'
                }`}
              >
                {testResult.success ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                )}
                <div>
                  <p>{testResult.message}</p>
                  {testResult.limit && <p className="text-[11px] font-normal mt-0.5 opacity-90">{testResult.limit}</p>}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ABA 2: MODELOS E PROMPTS POR FUNCIONALIDADE (CATÁLOGO OPENROUTER) */}
      {activeTab === 'models' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Coluna Esquerda: Lista de Funcionalidades */}
          <div className="lg:col-span-4 space-y-3">
            <p className="text-xs font-bold text-[#64748B] uppercase tracking-wider px-1">
              Funcionalidades da Plataforma
            </p>

            <div className="space-y-2">
              {features.map((feature) => {
                const isSelected = feature.id === selectedFeatureId;
                return (
                  <button
                    key={feature.id}
                    onClick={() => setSelectedFeatureId(feature.id)}
                    className={`w-full text-left p-4 rounded-2xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-white border-[#0050FF] shadow-sm ring-1 ring-[#0050FF]/20'
                        : 'bg-white border-[#E2E8F0] hover:border-[#CBD5E1] shadow-xs'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 mb-1.5">
                      <div className="p-1.5 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0]">
                        {getCategoryIcon(feature.category)}
                      </div>
                      <span className="font-bold text-xs text-[#0F172A]">{feature.name}</span>
                    </div>

                    <p className="text-[11px] text-[#64748B] line-clamp-2 mb-2 leading-relaxed">
                      {feature.description}
                    </p>

                    <div className="flex items-center justify-between text-[10px] text-[#475569] font-medium pt-2 border-t border-[#F1F5F9]">
                      <span className="bg-[#EFF4FF] px-2 py-0.5 rounded-md font-semibold text-[#0050FF]">
                        OpenRouter
                      </span>
                      <span className="truncate max-w-[170px] text-right font-mono font-bold text-[#0F172A]">
                        {feature.selectedModel}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Coluna Direita: Editor de Modelo e Prompt com Catálogo OpenRouter */}
          <div className="lg:col-span-8 bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-xs space-y-5">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-[#EFF4FF] border border-[#BFDBFE]">
                  {getCategoryIcon(selectedFeature.category)}
                </div>
                <div>
                  <h2 className="text-base font-bold text-[#0F172A]">{selectedFeature.name}</h2>
                  <p className="text-xs text-[#64748B]">{selectedFeature.description}</p>
                </div>
              </div>

              <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                Via OpenRouter
              </span>
            </div>

            {/* Configurações de Modelo OpenRouter */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#475569] mb-1.5 flex items-center justify-between">
                  <span>Modelo de Linguagem (Catálogo Oficial OpenRouter)</span>
                  <a
                    href="https://openrouter.ai/models"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] text-[#0050FF] hover:underline flex items-center gap-1 font-normal"
                  >
                    <span>Explorar catálogo OpenRouter</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </label>

                {/* Seletor Customizado por Função Especializada */}
                {(() => {
                  const mappedCat =
                    selectedFeature.category === 'imagem' ? 'foto' :
                    selectedFeature.category === 'video' ? 'video' :
                    selectedFeature.category === 'landing_page' ? 'site' : 'bi';
                  const catCatalog = getCategoryCatalog(mappedCat);

                  return (
                    <div className="space-y-2">
                      <select
                        value={selectedFeature.selectedModel}
                        onChange={(e) => handleUpdateFeature('selectedModel', e.target.value)}
                        className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl px-3 py-2.5 text-xs font-semibold text-[#0F172A] focus:outline-none focus:border-[#0050FF] cursor-pointer shadow-2xs"
                      >
                        {catCatalog.groups.map((group) => (
                          <optgroup key={group.groupName} label={group.groupName}>
                            {group.models.map((model) => (
                              <option key={model.id} value={model.id}>
                                {model.name} ({model.id})
                              </option>
                            ))}
                          </optgroup>
                        ))}
                      </select>

                      {/* Cards Rápidos de Recomendação */}
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        <span className="text-[10px] text-[#64748B] font-medium self-center mr-1">
                          Recomendados para {catCatalog.categoryLabel}:
                        </span>
                        {catCatalog.recommendedModels.map((rec) => {
                          const isSelected = selectedFeature.selectedModel === rec.id;
                          return (
                            <button
                              key={rec.id}
                              type="button"
                              onClick={() => handleUpdateFeature('selectedModel', rec.id)}
                              className={`px-2 py-1 rounded-lg text-[10px] font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                                isSelected
                                  ? 'bg-[#0050FF] text-white shadow-2xs'
                                  : 'bg-white border border-[#CBD5E1] text-[#334155] hover:border-[#0050FF] hover:text-[#0050FF]'
                              }`}
                            >
                              <span>{rec.name.split(' (')[0]}</span>
                              <span
                                className={`text-[9px] px-1 py-0.2 rounded font-bold ${
                                  isSelected
                                    ? 'bg-white/20 text-white'
                                    : 'bg-[#EFF4FF] text-[#0050FF]'
                                }`}
                              >
                                {rec.badge}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Input para Slug Customizado se aplicável */}
              {isCustomModel && (
                <div>
                  <label className="block text-xs font-semibold text-[#475569] mb-1">
                    Slug Exato do Modelo no OpenRouter
                  </label>
                  <input
                    type="text"
                    value={selectedFeature.selectedModel}
                    onChange={(e) => handleUpdateFeature('selectedModel', e.target.value.trim())}
                    placeholder="ex: mistralai/mistral-large-2411 ou qwen/qwen-2.5-72b-instruct"
                    className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl px-3.5 py-2 text-xs font-mono text-[#0F172A] focus:outline-none focus:border-[#0050FF] focus:bg-white shadow-2xs"
                  />
                  <p className="text-[10px] text-[#64748B] mt-1 font-mono">
                    Formato: provedor/nome-do-modelo (consulte openrouter.ai/models)
                  </p>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-[#475569] mb-1.5 flex items-center justify-between">
                    <span>Temperatura (Criatividade)</span>
                    <span className="font-bold text-[#0050FF] font-mono">{selectedFeature.temperature}</span>
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={selectedFeature.temperature}
                    onChange={(e) => handleUpdateFeature('temperature', parseFloat(e.target.value))}
                    className="w-full accent-[#0050FF] cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-[#94A3B8] mt-1">
                    <span>Mais Analítico (0.0)</span>
                    <span>Mais Criativo (1.0)</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#475569] mb-1.5">
                    Máximo de Tokens de Saída
                  </label>
                  <input
                    type="number"
                    value={selectedFeature.maxTokens}
                    onChange={(e) => handleUpdateFeature('maxTokens', parseInt(e.target.value) || 2048)}
                    className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl px-3 py-2 text-xs font-semibold text-[#0F172A] focus:outline-none focus:border-[#0050FF] font-mono shadow-2xs"
                  />
                </div>
              </div>

              {/* Prompt de Calibração */}
              <div className="pt-2">
                <label className="block text-xs font-semibold text-[#475569] mb-1">
                  Prompt Mestre de Calibração
                </label>
                <p className="text-[11px] text-[#64748B] mb-2">
                  Define o comportamento, regras de negócio e critérios analíticos da funcionalidade.
                </p>
                <textarea
                  rows={8}
                  value={selectedFeature.systemPrompt}
                  onChange={(e) => handleUpdateFeature('systemPrompt', e.target.value)}
                  className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl p-3 text-xs text-[#0F172A] leading-relaxed font-mono focus:outline-none focus:border-[#0050FF] focus:bg-white resize-y shadow-2xs"
                  placeholder="Insira o prompt mestre de calibração para esta funcionalidade..."
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
