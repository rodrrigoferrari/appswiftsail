'use client';

import React, { useState } from 'react';
import {
  Bot,
  Sparkles,
  KeyRound,
  FileText,
  Save,
  CheckCircle2,
  Sliders,
  Image as ImageIcon,
  Video,
  Globe,
  BrainCircuit,
  ShieldCheck,
  RefreshCw,
  Cpu,
} from 'lucide-react';

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
  const [tokens, setTokens] = useState({
    openai_key: 'sk-proj-••••••••••••••••••••••••••••••',
    anthropic_key: 'sk-ant-••••••••••••••••••••••••••••••',
    gemini_key: 'AIzaSy••••••••••••••••••••••••••••••',
    openrouter_key: 'sk-or-v1-••••••••••••••••••••••••••••••',
  });

  const [features, setFeatures] = useState<FeatureAIConfig[]>([
    {
      id: 'creative_image',
      name: 'Geração de Criativos de Imagem',
      category: 'imagem',
      description: 'Gera conceitos visuais, briefings de design e variações de anúncios de alta conversão.',
      selectedProvider: 'OpenAI',
      selectedModel: 'dall-e-3 / gpt-4o',
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
      selectedProvider: 'Anthropic',
      selectedModel: 'claude-3-5-sonnet-20241022',
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
      selectedProvider: 'Anthropic',
      selectedModel: 'claude-3-5-sonnet-20241022',
      temperature: 0.6,
      maxTokens: 4096,
      systemPrompt:
        'Você é o mestre de Conversion Rate Optimization (CRO). Todas as landing pages devem ter hierarquia clara: Headline magnética, Subheadline esclarecedora, 3 Benefícios tangíveis, Prova Social, Oferta Irrecusável e FAQ com quebra de objeções.',
    },
    {
      id: 'campaign_analysis',
      name: 'Agente Sinapse: Análise de Tráfego & Recomendações',
      category: 'analise',
      description: 'Audita campanhas de Meta Ads e Google Ads no Supabase e sugere otimizações e remanejamento de verba.',
      selectedProvider: 'Google Gemini',
      selectedModel: 'gemini-1.5-pro',
      temperature: 0.3,
      maxTokens: 3000,
      systemPrompt:
        'Você é o auditor de mídia paga e BI da Swiftsail. Analise métricas reais (CPA, CTR, ROAS, Gasto) e faça diagnósticos frios e matemáticos sem alucinação. Nunca invente dados.',
    },
  ]);

  const [activeTab, setActiveTab] = useState<'models' | 'tokens'>('models');
  const [selectedFeatureId, setSelectedFeatureId] = useState<string>('creative_image');
  const [isSaving, setIsSaving] = useState(false);
  const [savedFeedback, setSavedFeedback] = useState(false);

  const selectedFeature = features.find((f) => f.id === selectedFeatureId) || features[0];

  const handleUpdateFeature = (field: keyof FeatureAIConfig, value: any) => {
    setFeatures((prev) =>
      prev.map((f) => (f.id === selectedFeatureId ? { ...f, [field]: value } : f))
    );
  };

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      setSavedFeedback(true);
      setTimeout(() => setSavedFeedback(false), 3000);
    }, 600);
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
      {/* Top Banner (Estilo Asaas: Limpo, Fundo Branco, Bordas #E2E8F0, Sombra Suave) */}
      <div className="bg-white border border-[#E2E8F0] p-6 rounded-2xl shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-[#EFF4FF] text-[#0050FF] border border-[#BFDBFE] uppercase tracking-wider">
              Governança de Inteligência Artificial — Seção 3.1
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#0F172A] flex items-center gap-2.5">
            <Bot className="w-6 h-6 text-[#0050FF]" />
            Módulo de IA & Calibração de Prompts
          </h1>
          <p className="text-xs text-[#64748B] max-w-2xl leading-relaxed">
            Configure os tokens e modelos de linguagem (LLMs) dedicados a cada funcionalidade da plataforma (imagens, vídeos, landing pages e análises) e calibre os prompts mestres de execução.
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
          <span>{savedFeedback ? 'Calibrações Salvas!' : 'Salvar Alterações'}</span>
        </button>
      </div>

      {/* Tabs Switcher: Modelos por Funcionalidade vs Tokens Globais */}
      <div className="flex items-center gap-2 border-b border-[#E2E8F0] pb-1">
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

        <button
          onClick={() => setActiveTab('tokens')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'tokens'
              ? 'bg-[#EFF4FF] text-[#0050FF] border border-[#BFDBFE] shadow-xs'
              : 'text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC]'
          }`}
        >
          <KeyRound className="w-4 h-4" />
          <span>Tokens de Provedores de IA</span>
        </button>
      </div>

      {activeTab === 'models' ? (
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
                      <span className="bg-[#F1F5F9] px-2 py-0.5 rounded-md font-semibold text-[#0050FF]">
                        {feature.selectedProvider}
                      </span>
                      <span className="truncate max-w-[140px] text-right text-[#64748B]">
                        {feature.selectedModel}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Coluna Direita: Editor de Modelo e Prompt de Calibração */}
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
                Calibração Ativa
              </span>
            </div>

            {/* Configurações de Modelo */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#475569] mb-1.5">
                  Provedor de IA
                </label>
                <select
                  value={selectedFeature.selectedProvider}
                  onChange={(e) => handleUpdateFeature('selectedProvider', e.target.value)}
                  className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl px-3 py-2 text-xs font-semibold text-[#0F172A] focus:outline-none focus:border-[#0050FF] cursor-pointer"
                >
                  <option value="Anthropic">Anthropic (Claude 3.5 Sonnet / Opus)</option>
                  <option value="OpenAI">OpenAI (GPT-4o / GPT-4o Mini / DALL-E 3)</option>
                  <option value="Google Gemini">Google Gemini (1.5 Pro / Flash)</option>
                  <option value="OpenRouter">OpenRouter (Multi-modelos)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#475569] mb-1.5">
                  Modelo Escolhido (LLM)
                </label>
                <input
                  type="text"
                  value={selectedFeature.selectedModel}
                  onChange={(e) => handleUpdateFeature('selectedModel', e.target.value)}
                  className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl px-3 py-2 text-xs font-semibold text-[#0F172A] focus:outline-none focus:border-[#0050FF]"
                  placeholder="ex: claude-3-5-sonnet-20241022"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#475569] mb-1.5 flex items-center justify-between">
                  <span>Temperatura (Criatividade)</span>
                  <span className="font-bold text-[#0050FF]">{selectedFeature.temperature}</span>
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
                  <span>Mais Preciso (0.0)</span>
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
                  className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl px-3 py-2 text-xs font-semibold text-[#0F172A] focus:outline-none focus:border-[#0050FF]"
                />
              </div>
            </div>

            {/* Prompt de Calibração */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[#0F172A] flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#0050FF]" />
                Prompt de Calibração Específico (System Prompt)
              </label>
              <p className="text-[11px] text-[#64748B]">
                Define o comportamento, as regras de negócio, tom de voz e critérios de saída específicos desta funcionalidade.
              </p>
              <textarea
                rows={8}
                value={selectedFeature.systemPrompt}
                onChange={(e) => handleUpdateFeature('systemPrompt', e.target.value)}
                className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl p-3 text-xs text-[#0F172A] leading-relaxed font-mono focus:outline-none focus:border-[#0050FF] resize-y"
                placeholder="Insira o prompt mestre de calibração para esta funcionalidade..."
              />
            </div>
          </div>
        </div>
      ) : (
        /* Painel de Tokens */
        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-xs max-w-3xl space-y-5">
          <div className="flex items-center gap-2.5 border-b border-[#E2E8F0] pb-4">
            <KeyRound className="w-5 h-5 text-[#0050FF]" />
            <div>
              <h2 className="text-base font-bold text-[#0F172A]">Chaves e Tokens de Acesso aos Provedores</h2>
              <p className="text-xs text-[#64748B]">
                Os tokens são armazenados com segurança e nunca expostos no frontend público.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#475569] mb-1">
                OpenAI API Key
              </label>
              <input
                type="password"
                value={tokens.openai_key}
                onChange={(e) => setTokens({ ...tokens, openai_key: e.target.value })}
                className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl px-3 py-2 text-xs font-mono text-[#0F172A] focus:outline-none focus:border-[#0050FF]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#475569] mb-1">
                Anthropic API Key (Claude)
              </label>
              <input
                type="password"
                value={tokens.anthropic_key}
                onChange={(e) => setTokens({ ...tokens, anthropic_key: e.target.value })}
                className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl px-3 py-2 text-xs font-mono text-[#0F172A] focus:outline-none focus:border-[#0050FF]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#475569] mb-1">
                Google Gemini API Key
              </label>
              <input
                type="password"
                value={tokens.gemini_key}
                onChange={(e) => setTokens({ ...tokens, gemini_key: e.target.value })}
                className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl px-3 py-2 text-xs font-mono text-[#0F172A] focus:outline-none focus:border-[#0050FF]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#475569] mb-1">
                OpenRouter API Key
              </label>
              <input
                type="password"
                value={tokens.openrouter_key}
                onChange={(e) => setTokens({ ...tokens, openrouter_key: e.target.value })}
                className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl px-3 py-2 text-xs font-mono text-[#0F172A] focus:outline-none focus:border-[#0050FF]"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
