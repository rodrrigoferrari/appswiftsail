'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Sparkles,
  Bot,
  Image as ImageIcon,
  Video,
  Globe,
  BrainCircuit,
  Save,
  CheckCircle2,
  RefreshCw,
  Cpu,
  Sliders,
  RotateCcw,
  SlidersHorizontal,
} from 'lucide-react';
import { OPENROUTER_MODELS } from '../ia/page';
import { CATEGORY_AI_CATALOG, getCategoryCatalog, ModelOption } from '@/lib/ai/models-catalog';

interface PromptConfig {
  id: string;
  name: string;
  category: 'analise' | 'imagem' | 'video' | 'landing_page';
  description: string;
  iconName: string;
  selectedModel: string;
  temperature: number;
  maxTokens: number;
  systemPrompt: string;
}

const DEFAULT_PROMPTS: PromptConfig[] = [
  {
    id: 'campaign_analysis',
    name: 'Análise de Tráfego & BI (Sinapse)',
    category: 'analise',
    iconName: 'BrainCircuit',
    description: 'Audita campanhas de Meta Ads e Google Ads, responde dúvidas do cliente e diagnostica CPA, CTR e ROAS.',
    selectedModel: 'anthropic/claude-3.5-sonnet',
    temperature: 0.3,
    maxTokens: 3000,
    systemPrompt:
      'Você é o auditor sênior de mídia paga e BI da Swiftsail. Analise métricas reais (CPA, CTR, ROAS, Gasto) e faça diagnósticos frios e matemáticos sem alucinação. Nunca invente dados. Destaque pontos de atenção e recomende remanejamento de verba com base nos dados do cliente.',
  },
  {
    id: 'creative_image',
    name: 'Criativos de Imagem & Banners',
    category: 'imagem',
    iconName: 'ImageIcon',
    description: 'Gera conceitos visuais, briefings de design e variações de anúncios de alta conversão para feed e stories.',
    selectedModel: 'openai/gpt-4o',
    temperature: 0.7,
    maxTokens: 2048,
    systemPrompt:
      'Você é o Diretor de Arte e Copywriter Especialista da Swiftsail. Sua missão é criar anúncios visuais de alta conversão seguindo a psicologia de cores e regras das plataformas de tráfego (Meta e Google). Enfatize contraste, proposta de valor clara e sem elementos genéricos.',
  },
  {
    id: 'creative_video',
    name: 'Criativos de Vídeo & Roteiros',
    category: 'video',
    iconName: 'Video',
    description: 'Elabora roteiros dinâmicos (Hooks, Corpo, CTA) e prompts cinemáticos para Reels, TikTok Ads e Shorts.',
    selectedModel: 'anthropic/claude-3.5-sonnet',
    temperature: 0.8,
    maxTokens: 3000,
    systemPrompt:
      'Você é especialista em retenção e scripts de vídeo para Reels e TikTok Ads. O gancho inicial (primeiros 3 segundos) deve reter 70%+ do público com quebra de padrão ou pergunta de alta identificação. Estruture em: Hook (0-3s), Problema/Agitação (3-15s), Solução (15-45s) e Chamada para Ação (CTA).',
  },
  {
    id: 'landing_pages',
    name: 'Landing Pages & Copy CRO',
    category: 'landing_page',
    iconName: 'Globe',
    description: 'Estrutura seções de páginas de captura, headlines persuasivas, quebra de objeções e ofertas de conversão.',
    selectedModel: 'anthropic/claude-3.5-sonnet',
    temperature: 0.6,
    maxTokens: 4096,
    systemPrompt:
      'Você é o mestre de Conversion Rate Optimization (CRO) da Swiftsail. Todas as landing pages devem ter hierarquia clara: Headline magnética, Subheadline esclarecedora, 3 Benefícios tangíveis, Prova Social, Oferta Irrecusável e FAQ com quebra de objeções. Escreva textos diretos e orientados à conversão.',
  },
];

function PromptIcon({ id }: { id: string }) {
  switch (id) {
    case 'campaign_analysis':
      return <BrainCircuit className="w-5 h-5 text-[#0050FF]" />;
    case 'creative_image':
      return <ImageIcon className="w-5 h-5 text-pink-600" />;
    case 'creative_video':
      return <Video className="w-5 h-5 text-amber-600" />;
    case 'landing_pages':
      return <Globe className="w-5 h-5 text-emerald-600" />;
    default:
      return <Sparkles className="w-5 h-5 text-purple-600" />;
  }
}

function AdminPromptsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [prompts, setPrompts] = useState<PromptConfig[]>(DEFAULT_PROMPTS);
  const [selectedPromptId, setSelectedPromptId] = useState<string>('campaign_analysis');
  const [isSaving, setIsSaving] = useState(false);
  const [savedFeedback, setSavedFeedback] = useState(false);
  const [existingCreds, setExistingCreds] = useState<Record<string, any>>({});

  // Sincroniza com query param ?prompt=
  useEffect(() => {
    const pParam = searchParams.get('prompt');
    if (pParam && DEFAULT_PROMPTS.some((p) => p.id === pParam)) {
      setSelectedPromptId(pParam);
    }
  }, [searchParams]);

  // Carrega configurações salvas do Supabase
  useEffect(() => {
    async function loadPrompts() {
      try {
        const res = await fetch('/api/credentials');
        const data = await res.json();
        if (data.success && data.credentials) {
          setExistingCreds(data.credentials);
          if (data.credentials.ai_prompts && Array.isArray(data.credentials.ai_prompts)) {
            setPrompts(data.credentials.ai_prompts);
          }
        }
      } catch (err) {
        console.error('Falha ao carregar prompts', err);
      }
    }
    loadPrompts();
  }, []);

  const activePrompt = prompts.find((p) => p.id === selectedPromptId) || prompts[0];

  const handleUpdate = (field: keyof PromptConfig, value: any) => {
    setPrompts((prev) =>
      prev.map((p) => (p.id === selectedPromptId ? { ...p, [field]: value } : p))
    );
  };

  const handleResetDefault = () => {
    const original = DEFAULT_PROMPTS.find((p) => p.id === selectedPromptId);
    if (original && confirm('Deseja restaurar as configurações padrão deste prompt?')) {
      setPrompts((prev) =>
        prev.map((p) => (p.id === selectedPromptId ? { ...original } : p))
      );
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSavedFeedback(false);
    try {
      const payload = {
        ...existingCreds,
        ai_prompts: prompts,
      };

      const res = await fetch('/api/credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credentials: payload }),
      });
      const data = await res.json();
      if (data.success) {
        setExistingCreds(payload);
        setSavedFeedback(true);
        setTimeout(() => setSavedFeedback(false), 3500);
      }
    } catch {
      alert('Erro ao salvar calibração do prompt.');
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
              Governança Master • Calibração Sinapse
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#0F172A] flex items-center gap-2.5">
            <Sparkles className="w-6 h-6 text-purple-600" />
            Calibração de Prompts do Sistema
          </h1>
          <p className="text-xs text-[#64748B] max-w-2xl leading-relaxed">
            Ajuste fino dos System Prompts, hiperparâmetros (temperatura, limites de tokens) e modelos da OpenRouter para cada especialidade da inteligência artificial.
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={isSaving}
          className="px-5 py-2.5 rounded-xl text-xs font-bold bg-[#0050FF] hover:bg-[#0040D6] text-white flex items-center gap-2 shadow-xs cursor-pointer transition disabled:opacity-50 self-start md:self-auto"
        >
          {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          <span>Salvar Calibração</span>
        </button>
      </div>

      {savedFeedback && (
        <div className="p-3.5 rounded-xl text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-2 shadow-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Calibração do prompt salva com sucesso no Supabase!</span>
        </div>
      )}

      {/* Tabs / Seletor Superior dos 4 Prompts */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {prompts.map((p) => {
          const isSelected = p.id === selectedPromptId;
          return (
            <button
              key={p.id}
              onClick={() => {
                setSelectedPromptId(p.id);
                router.push(`/admin/prompts?prompt=${p.id}`);
              }}
              className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer shadow-xs flex flex-col justify-between gap-2 ${
                isSelected
                  ? 'bg-white border-[#0050FF] ring-2 ring-[#0050FF]/10 shadow-sm'
                  : 'bg-white border-[#E2E8F0] hover:border-[#CBD5E1] hover:bg-[#F8FAFC]'
              }`}
            >
              <div className="flex items-center justify-between">
                <PromptIcon id={p.id} />
                <span className="text-[10px] font-bold text-[#64748B] uppercase font-mono">
                  {p.selectedModel.split('/')[1] || p.selectedModel}
                </span>
              </div>
              <div>
                <p className={`text-xs font-bold leading-tight ${isSelected ? 'text-[#0050FF]' : 'text-[#0F172A]'}`}>
                  {p.name}
                </p>
                <p className="text-[10px] text-[#64748B] mt-0.5 line-clamp-1">{p.description}</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Card Principal de Edição do Prompt Selecionado */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#F1F5F9] pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#EFF4FF] border border-[#BFDBFE] flex items-center justify-center shrink-0">
              <PromptIcon id={activePrompt.id} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#0F172A]">{activePrompt.name}</h3>
              <p className="text-xs text-[#64748B] mt-0.5">{activePrompt.description}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleResetDefault}
            className="text-xs font-bold text-[#64748B] hover:text-[#0F172A] flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#CBD5E1] hover:bg-slate-50 transition cursor-pointer self-start sm:self-auto"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restaurar Padrão</span>
          </button>
        </div>

        {/* Modelo e Parâmetros */}
        {(() => {
          const catalog = getCategoryCatalog(activePrompt.id);
          const isKnownInCatalog =
            catalog.recommendedModels.some((m) => m.id === activePrompt.selectedModel) ||
            catalog.groups.some((g) => g.models.some((m) => m.id === activePrompt.selectedModel)) ||
            OPENROUTER_MODELS.some((g) => g.models.some((m) => m.id === activePrompt.selectedModel));

          return (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Modelo OpenRouter / Motor de IA Customizado */}
                <div className="md:col-span-1 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-[#0F172A] flex items-center gap-1">
                      <Cpu className="w-3.5 h-3.5 text-[#0050FF]" />
                      <span>Motor de IA ({catalog.categoryLabel})</span>
                    </label>
                    <span className="text-[10px] font-bold text-[#0050FF] bg-[#EFF4FF] px-2 py-0.5 rounded-full border border-[#BFDBFE]">
                      Especializado
                    </span>
                  </div>

                  <select
                    value={isKnownInCatalog ? activePrompt.selectedModel : '__custom__'}
                    onChange={(e) => {
                      if (e.target.value !== '__custom__') {
                        handleUpdate('selectedModel', e.target.value);
                      }
                    }}
                    className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl px-3 py-2 text-xs font-semibold text-[#0F172A] focus:border-[#0050FF] focus:bg-white focus:outline-none transition shadow-2xs cursor-pointer"
                  >
                    {/* 1. Melhores Recomendações desta Função */}
                    <optgroup label={`⭐ Recomendações de Topo para ${catalog.categoryLabel}`}>
                      {catalog.recommendedModels.map((m) => (
                        <option key={`rec-${m.id}`} value={m.id}>
                          ⭐ {m.name} [{m.badge}]
                        </option>
                      ))}
                    </optgroup>

                    {/* 2. Grupos Especializados da Categoria (Vídeo, Imagem, CRO ou BI) */}
                    {catalog.groups.map((group) => (
                      <optgroup key={group.groupName} label={group.groupName}>
                        {group.models.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.name}
                          </option>
                        ))}
                      </optgroup>
                    ))}

                    {/* 3. Todos os Modelos Gerais de Chat/LLM */}
                    {OPENROUTER_MODELS.map((group) => (
                      <optgroup key={`general-${group.provider}`} label={`🌐 ${group.provider}`}>
                        {group.models.map((m) => (
                          <option key={`gen-${m.id}`} value={m.id}>
                            {m.name}
                          </option>
                        ))}
                      </optgroup>
                    ))}

                    {/* 4. Opção de Modelo Customizado */}
                    <optgroup label="⚙️ Customizado">
                      <option value="__custom__">Digitar ID de Modelo Personalizado...</option>
                    </optgroup>
                  </select>

                  {/* Input caso seja modelo customizado */}
                  {!isKnownInCatalog && (
                    <div className="pt-1">
                      <input
                        type="text"
                        value={activePrompt.selectedModel}
                        onChange={(e) => handleUpdate('selectedModel', e.target.value)}
                        placeholder="Ex: heygen/interactive-avatar ou openai/sora"
                        className="w-full bg-white border border-[#0050FF] rounded-xl px-3 py-1.5 text-xs font-mono font-bold text-[#0050FF] focus:outline-none shadow-2xs"
                      />
                      <p className="text-[10px] text-[#64748B] mt-0.5">
                        ID manual ativo para o motor de IA.
                      </p>
                    </div>
                  )}
                </div>

                {/* Temperatura */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-[#0F172A] flex items-center gap-1">
                      <Sliders className="w-3.5 h-3.5 text-[#0050FF]" />
                      <span>Temperatura</span>
                    </label>
                    <span className="text-xs font-bold text-[#0050FF] font-mono">
                      {activePrompt.temperature}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={activePrompt.temperature}
                    onChange={(e) => handleUpdate('temperature', parseFloat(e.target.value))}
                    className="w-full accent-[#0050FF] cursor-pointer mt-2"
                  />
                  <div className="flex justify-between text-[10px] text-[#94A3B8] font-semibold mt-1">
                    <span>0.0 (Frio/Exato)</span>
                    <span>1.0 (Criativo)</span>
                  </div>
                </div>

                {/* Max Tokens */}
                <div>
                  <label className="block text-xs font-bold text-[#0F172A] mb-1.5 flex items-center gap-1">
                    <SlidersHorizontal className="w-3.5 h-3.5 text-[#0050FF]" />
                    <span>Limite de Tokens de Resposta</span>
                  </label>
                  <input
                    type="number"
                    min="512"
                    max="8192"
                    step="256"
                    value={activePrompt.maxTokens}
                    onChange={(e) => handleUpdate('maxTokens', parseInt(e.target.value) || 2048)}
                    className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl px-3 py-2 text-xs font-mono font-semibold text-[#0F172A] focus:border-[#0050FF] focus:bg-white focus:outline-none transition shadow-2xs"
                  />
                  <p className="text-[10px] text-[#64748B] mt-1">
                    Ex: 2048 (~1.500 palavras), 4096 (~3.000 palavras)
                  </p>
                </div>
              </div>

              {/* Cards Interativos de Sugestão de Topo para esta Categoria */}
              <div className="bg-[#EFF4FF]/40 border border-[#BFDBFE] rounded-xl p-3.5 space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <span className="text-xs font-bold text-[#0050FF] flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#0050FF]" />
                    <span>Melhores Motores & LLMs para {catalog.categoryLabel}:</span>
                  </span>
                  <span className="text-[10px] text-[#64748B]">Clique em uma sugestão para aplicar</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
                  {catalog.recommendedModels.map((rec) => {
                    const isCurrent = activePrompt.selectedModel === rec.id;
                    return (
                      <button
                        key={`rec-btn-${rec.id}`}
                        type="button"
                        onClick={() => handleUpdate('selectedModel', rec.id)}
                        className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer flex flex-col justify-between ${
                          isCurrent
                            ? 'bg-white border-[#0050FF] ring-2 ring-[#0050FF]/20 shadow-xs'
                            : 'bg-white/80 border-[#CBD5E1] hover:border-[#0050FF] hover:bg-white'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <span className="text-xs font-bold text-[#0F172A] truncate" title={rec.name}>
                            {rec.name.split(' (')[0]}
                          </span>
                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${
                              isCurrent
                                ? 'bg-[#0050FF] text-white'
                                : rec.isSpecialized
                                ? 'bg-purple-100 text-purple-800 border border-purple-200'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {isCurrent ? 'Ativo' : rec.badge}
                          </span>
                        </div>
                        <p className="text-[10px] text-[#64748B] leading-tight line-clamp-2" title={rec.description}>
                          {rec.description}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          );
        })()}

        {/* Editor de System Prompt */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-[#0F172A] flex items-center gap-1.5">
              <Bot className="w-4 h-4 text-[#0050FF]" />
              <span>System Prompt (Instruções Comportamentais)</span>
            </label>
            <span className="text-[10px] text-[#64748B] font-mono">
              {activePrompt.systemPrompt.length} caracteres
            </span>
          </div>
          <textarea
            rows={8}
            value={activePrompt.systemPrompt}
            onChange={(e) => handleUpdate('systemPrompt', e.target.value)}
            className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl p-3.5 text-xs text-[#0F172A] font-mono leading-relaxed focus:border-[#0050FF] focus:bg-white focus:outline-none transition shadow-2xs"
            placeholder="Defina o comportamento do modelo, restrições e regras de negócio..."
          />
        </div>

        <div className="flex justify-end pt-2">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-5 py-2.5 rounded-xl text-xs font-bold bg-[#0050FF] hover:bg-[#0040D6] text-white flex items-center gap-2 shadow-xs cursor-pointer transition disabled:opacity-50"
          >
            {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>Salvar Calibração ({activePrompt.name})</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminPromptsPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-xs text-[#64748B] flex items-center justify-center gap-2">
          <RefreshCw className="w-4 h-4 animate-spin text-[#0050FF]" />
          <span>Carregando calibrações de prompt...</span>
        </div>
      }
    >
      <AdminPromptsContent />
    </Suspense>
  );
}
