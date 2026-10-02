'use client';

import React, { useState } from 'react';
import { useTenant } from '@/components/TenantProvider';
import {
  Sparkles,
  Wand2,
  Globe,
  Smartphone,
  Monitor,
  Download,
  Copy,
  CheckCircle2,
  RefreshCw,
  Share2,
  MessageSquare,
  Building,
  Check,
  Zap,
} from 'lucide-react';

export default function CriativosPage() {
  const { selectedClientId, activeClient } = useTenant();
  const [activeModule, setActiveModule] = useState<'criativos' | 'landing_page'>('landing_page');

  // Client Name
  const clientName = activeClient?.nome || (selectedClientId === 'ALL' ? 'Todos os Clientes' : selectedClientId);

  // --- CREATIVE STUDIO STATE ---
  const [format, setFormat] = useState<'carousel' | 'reels' | 'static'>('carousel');
  const [creativeBriefing, setCreativeBriefing] = useState(
    `Criar anúncio para ${clientName}, destacando localização nobre, acabamento premium e condições de lançamento com atendimento VIP.`
  );
  const [isGeneratingCreative, setIsGeneratingCreative] = useState(false);
  const [generatedCreative, setGeneratedCreative] = useState({
    title: `${clientName} | Oportunidade Exclusiva`,
    hook: `Você já imaginou investir no metro quadrado com maior potencial de valorização?`,
    copy: `Plantas inteligentes com design assinado, infraestrutura completa e condições especiais de lançamento. Últimas unidades disponíveis.`,
    cta: 'Receber Apresentação VIP no WhatsApp',
    image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&auto=format&fit=crop&q=80',
  });

  // --- LANDING PAGE BUILDER STATE ---
  const [viewportMode, setViewportMode] = useState<'desktop' | 'mobile'>('desktop');
  const [lpBriefing, setLpBriefing] = useState(
    `Quero uma Landing Page de alta conversão para ${clientName}. O público busca alto padrão, rentabilidade e segurança. Destaque acabamento nobre, plantas flexíveis, parcelamento facilitado em até 24x e tour decorado. Inclua formulário rápido integrado ao Kommo CRM e botão de WhatsApp flutuante.`
  );
  const [isGeneratingLP, setIsGeneratingLP] = useState(false);
  const [lpData, setLpData] = useState({
    badge: `LANÇAMENTO EXCLUSIVO • ${clientName.toUpperCase()}`,
    heroTitle: `Viva com Exclusividade e Sofisticação no Empreendimento ${clientName}`,
    heroDesc: `Apartamentos de alto padrão com vista privilegiada, área de lazer completa e condições especiais de pré-lançamento.`,
    phone: '(41) 99824-3310',
    primaryColor: '#06b6d4',
  });

  // Feedback Loop Comments
  const [comments, setComments] = useState([
    {
      id: 1,
      author: `${clientName} (Diretoria Comercial)`,
      text: 'Por favor, destacar o parcelamento facilitado logo abaixo do título principal.',
      time: 'Hoje às 11:20',
      status: 'Pendente',
    },
    {
      id: 2,
      author: 'Rodrigo Ferrari (Swiftsail)',
      text: 'Formulário integrado ao Kommo CRM com disparo de notificação na Uazapi ativado.',
      time: 'Hoje às 12:40',
      status: 'Aplicado',
    },
  ]);

  const handleGenerateCreative = () => {
    setIsGeneratingCreative(true);
    setTimeout(() => {
      setIsGeneratingCreative(false);
      setGeneratedCreative({
        title: `${clientName} | Edição Limitada`,
        hook: `Procurando o imóvel perfeito para morar ou investir com rentabilidade comprovada?`,
        copy: `Conheça o novo lançamento da ${clientName}. Plantas de 2 a 4 suítes com acabamento em mármore e tecnologia integrada.`,
        cta: 'Falar com Consultor no WhatsApp',
        image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&auto=format&fit=crop&q=80',
      });
    }, 1000);
  };

  const handleGenerateLP = () => {
    setIsGeneratingLP(true);
    setTimeout(() => {
      setIsGeneratingLP(false);
      setLpData({
        badge: `LANÇAMENTO DE LUXO • ${clientName.toUpperCase()}`,
        heroTitle: `O Novo Ícone da Arquitetura e Conforto por ${clientName}`,
        heroDesc: `Projetado para quem valoriza sofisticação, localização estratégica e segurança total para a família.`,
        phone: '(41) 99824-3310',
        primaryColor: '#06b6d4',
      });
    }, 1200);
  };

  const handleExportHTML = () => {
    const htmlContent = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${lpData.heroTitle}</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-slate-950 text-white font-sans antialiased">
  <header class="p-6 border-b border-slate-800 flex justify-between items-center max-w-6xl mx-auto">
    <h1 class="font-bold text-xl">${clientName}</h1>
    <a href="https://wa.me/5541998243310" class="bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-2 px-4 rounded-xl text-sm">Falar no WhatsApp</a>
  </header>
  <main class="max-w-6xl mx-auto px-6 py-16 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
    <div>
      <span class="text-cyan-400 text-xs font-bold uppercase tracking-wider">${lpData.badge}</span>
      <h2 class="text-3xl md:text-5xl font-extrabold mt-3 leading-tight">${lpData.heroTitle}</h2>
      <p class="text-slate-400 mt-4 leading-relaxed">${lpData.heroDesc}</p>
    </div>
    <div class="bg-slate-900 border border-slate-800 p-8 rounded-2xl shadow-2xl">
      <h3 class="text-lg font-bold">Receba a Apresentação e Tabela de Valores</h3>
      <form class="mt-4 space-y-4">
        <input type="text" placeholder="Seu nome" class="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white" />
        <input type="tel" placeholder="Seu WhatsApp" class="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white" />
        <button type="button" class="w-full bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-3 rounded-xl">Quero Conhecer</button>
      </form>
    </div>
  </main>
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `landing_page_${clientName.toLowerCase().replace(/\s+/g, '_')}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-cyan-400" />
            Criação de Criativos & Landing Pages com IA
          </h2>
          <p className="text-xs text-slate-400">
            Cliente Selecionado: <b className="text-cyan-300">{clientName}</b>
          </p>
        </div>

        {/* Module Switcher */}
        <div className="flex bg-slate-900/90 border border-slate-800 rounded-xl p-1 text-xs">
          <button
            onClick={() => setActiveModule('landing_page')}
            className={`px-4 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-2 ${
              activeModule === 'landing_page'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            1. Construtor de Landing Page IA
          </button>
          <button
            onClick={() => setActiveModule('criativos')}
            className={`px-4 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-2 ${
              activeModule === 'criativos'
                ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-lg shadow-pink-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            2. Estúdio de Criativos (Carrossel / Reels)
          </button>
        </div>
      </div>

      {/* ================= LANDING PAGE BUILDER MODULE ================= */}
      {activeModule === 'landing_page' ? (
        <div className="space-y-6">
          {/* Action Topbar */}
          <div className="glass-card p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-xs font-semibold text-slate-200">
                Landing Page Builder • Conectado ao CRM Kommo & WhatsApp
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleExportHTML}
                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 transition-colors flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                Exportar Código HTML
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Briefing & AI Controls */}
            <div className="lg:col-span-4 glass-card p-5 space-y-4">
              <div className="border-b border-slate-800 pb-3">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Wand2 className="w-4 h-4 text-cyan-400" />
                  Briefing em Linguagem Natural
                </h3>
                <p className="text-[11px] text-slate-400">Instruções para a IA desenhar a estrutura e copy da LP</p>
              </div>

              <div>
                <textarea
                  value={lpBriefing}
                  onChange={(e) => setLpBriefing(e.target.value)}
                  rows={6}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-sans leading-relaxed"
                />
              </div>

              <button
                onClick={handleGenerateLP}
                disabled={isGeneratingLP}
                className="w-full py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-lg shadow-cyan-500/25 transition-all flex items-center justify-center gap-2"
              >
                {isGeneratingLP ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    Gerando Landing Page com IA...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    Gerar / Atualizar Landing Page
                  </>
                )}
              </button>

              {/* Feedback Loop Comments */}
              <div className="pt-3 border-t border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5 text-cyan-400" />
                    Feedback do Cliente
                  </h4>
                  <span className="text-[10px] text-slate-500">{comments.length} notas</span>
                </div>

                <div className="space-y-2">
                  {comments.map((c) => (
                    <div key={c.id} className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-1">
                      <div className="flex justify-between items-center text-[10px]">
                        <span className="font-bold text-white truncate max-w-[180px]">{c.author}</span>
                        <span
                          className={`px-1.5 py-0.2 rounded font-semibold ${
                            c.status === 'Aplicado'
                              ? 'bg-emerald-500/10 text-emerald-400'
                              : 'bg-amber-500/10 text-amber-400'
                          }`}
                        >
                          {c.status}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-300">{c.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column: Sandbox Browser Preview */}
            <div className="lg:col-span-8 glass-card p-5 space-y-4">
              {/* Browser Viewport Topbar */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-3 bg-slate-950/80 p-3 rounded-xl border">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-rose-500"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
                  <span className="text-[11px] font-mono text-slate-400 ml-2 truncate max-w-[240px]">
                    https://preview.swiftsail.co/lp/{clientName.toLowerCase().replace(/\s+/g, '-')}
                  </span>
                </div>

                <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-lg p-0.5">
                  <button
                    onClick={() => setViewportMode('desktop')}
                    className={`px-2.5 py-1 rounded text-xs font-semibold transition-all flex items-center gap-1 ${
                      viewportMode === 'desktop'
                        ? 'bg-cyan-500/20 text-cyan-300'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Monitor className="w-3.5 h-3.5" />
                    Desktop
                  </button>
                  <button
                    onClick={() => setViewportMode('mobile')}
                    className={`px-2.5 py-1 rounded text-xs font-semibold transition-all flex items-center gap-1 ${
                      viewportMode === 'mobile'
                        ? 'bg-cyan-500/20 text-cyan-300'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                    Mobile
                  </button>
                </div>
              </div>

              {/* Rendered Viewport Sandbox */}
              <div
                className={`mx-auto bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden transition-all duration-300 p-6 space-y-8 ${
                  viewportMode === 'mobile' ? 'max-w-sm' : 'w-full'
                }`}
              >
                {/* Navbar */}
                <div className="flex justify-between items-center pb-4 border-b border-slate-800">
                  <span className="font-extrabold text-sm tracking-wider text-white">{clientName}</span>
                  <button className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs">
                    💬 WhatsApp
                  </button>
                </div>

                {/* Hero Section */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                  <div className={viewportMode === 'mobile' ? 'space-y-3' : 'md:col-span-7 space-y-3'}>
                    <span className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                      {lpData.badge}
                    </span>
                    <h1 className="text-xl md:text-2xl font-black text-white leading-tight">
                      {lpData.heroTitle}
                    </h1>
                    <p className="text-xs text-slate-400 leading-relaxed">{lpData.heroDesc}</p>
                    <div className="flex flex-wrap gap-2 text-[11px] text-slate-300 pt-2">
                      <span className="flex items-center gap-1 text-cyan-400">✓ Alto Padrão</span>
                      <span className="flex items-center gap-1 text-cyan-400">✓ Parcelamento em 24x</span>
                      <span className="flex items-center gap-1 text-cyan-400">✓ Atendimento VIP</span>
                    </div>
                  </div>

                  {/* Form Box */}
                  <div
                    className={
                      viewportMode === 'mobile'
                        ? 'bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-3'
                        : 'md:col-span-5 bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-3'
                    }
                  >
                    <h3 className="text-xs font-bold text-white">Solicitar Apresentação Exclusiva</h3>
                    <div className="space-y-2">
                      <input
                        type="text"
                        placeholder="Seu nome completo"
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white"
                      />
                      <input
                        type="tel"
                        placeholder="WhatsApp com DDD"
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white"
                      />
                      <button className="w-full py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold text-xs">
                        Receber no WhatsApp
                      </button>
                    </div>
                  </div>
                </div>

                {/* Benefits */}
                <div className="grid grid-cols-3 gap-3 pt-4 border-t border-slate-800 text-center">
                  <div className="p-3 bg-slate-900/50 rounded-xl border border-slate-800">
                    <p className="text-sm">📍</p>
                    <p className="text-[11px] font-bold text-white mt-1">Localização Nobre</p>
                  </div>
                  <div className="p-3 bg-slate-900/50 rounded-xl border border-slate-800">
                    <p className="text-sm">🛡️</p>
                    <p className="text-[11px] font-bold text-white mt-1">Segurança Total</p>
                  </div>
                  <div className="p-3 bg-slate-900/50 rounded-xl border border-slate-800">
                    <p className="text-sm">📈</p>
                    <p className="text-[11px] font-bold text-white mt-1">Alta Rentabilidade</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* ================= CREATIVE STUDIO MODULE ================= */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Briefing Controls */}
          <div className="lg:col-span-5 glass-card p-6 space-y-5">
            <div className="border-b border-slate-800 pb-3">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Wand2 className="w-4 h-4 text-pink-400" />
                Briefing de Anúncios com IA
              </h3>
              <p className="text-[11px] text-slate-400">Produção de copies e formatos para Meta & Google</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">Formato de Saída</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => setFormat('carousel')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                    format === 'carousel'
                      ? 'badge-carousel border-cyan-500/50 shadow-md'
                      : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Carrossel 1:1
                </button>
                <button
                  onClick={() => setFormat('reels')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                    format === 'reels'
                      ? 'badge-reels border-pink-500/50 shadow-md'
                      : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Reels 9:16
                </button>
                <button
                  onClick={() => setFormat('static')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                    format === 'static'
                      ? 'badge-static border-emerald-500/50 shadow-md'
                      : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Estático 1:1
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">Instrução / Briefing</label>
              <textarea
                value={creativeBriefing}
                onChange={(e) => setCreativeBriefing(e.target.value)}
                rows={4}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-pink-500"
              />
            </div>

            <button
              onClick={handleGenerateCreative}
              disabled={isGeneratingCreative}
              className="w-full py-3 rounded-xl text-xs font-bold bg-gradient-to-r from-pink-500 via-purple-600 to-indigo-600 text-white shadow-lg shadow-pink-500/25 hover:opacity-95 transition-opacity flex items-center justify-center gap-2"
            >
              {isGeneratingCreative ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Criando Anúncio com IA...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Gerar Criativo Completo
                </>
              )}
            </button>
          </div>

          {/* Canvas Mockup */}
          <div className="lg:col-span-7 glass-card p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">Canvas de Visualização</h3>
              <span className="text-xs font-mono text-cyan-400">{format.toUpperCase()}</span>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-4">
              <div className="relative aspect-video rounded-xl overflow-hidden border border-slate-800">
                <img src={generatedCreative.image} alt="Mockup" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-5">
                  <h4 className="text-base font-bold text-white">{generatedCreative.title}</h4>
                </div>
              </div>

              <div className="space-y-2 text-xs">
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                  <p className="text-[10px] font-bold text-cyan-400 uppercase">Gancho (Hook)</p>
                  <p className="text-white mt-0.5">{generatedCreative.hook}</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Texto Principal</p>
                  <p className="text-slate-300 mt-0.5">{generatedCreative.copy}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
