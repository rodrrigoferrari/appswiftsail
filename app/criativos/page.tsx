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
<body class="bg-[#F8FAFC] text-[#0F172A] font-sans antialiased">
  <header class="p-6 border-b border-[#E2E8F0] flex justify-between items-center max-w-6xl mx-auto bg-white">
    <h1 class="font-bold text-xl text-[#0F172A]">${clientName}</h1>
    <a href="https://wa.me/5541998243310" class="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-4 rounded-xl text-sm">Falar no WhatsApp</a>
  </header>
  <main class="max-w-6xl mx-auto px-6 py-16 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
    <div>
      <span class="text-[#0050FF] text-xs font-bold uppercase tracking-wider">${lpData.badge}</span>
      <h2 class="text-3xl md:text-5xl font-extrabold mt-3 leading-tight text-[#0F172A]">${lpData.heroTitle}</h2>
      <p class="text-[#64748B] mt-4 leading-relaxed">${lpData.heroDesc}</p>
    </div>
    <div class="bg-white border border-[#E2E8F0] p-8 rounded-2xl shadow-xl">
      <h3 class="text-lg font-bold text-[#0F172A]">Receba a Apresentação e Tabela de Valores</h3>
      <form class="mt-4 space-y-4">
        <input type="text" placeholder="Seu nome" class="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl p-3 text-sm text-[#0F172A]" />
        <input type="tel" placeholder="Seu WhatsApp" class="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl p-3 text-sm text-[#0F172A]" />
        <button type="button" class="w-full bg-[#0050FF] hover:bg-[#0040D6] text-white font-bold py-3 rounded-xl">Quero Conhecer</button>
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
    <div className="space-y-6 select-none font-sans">
      {/* Top Header */}
      <div className="bg-white border border-[#E2E8F0] p-6 rounded-2xl shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-3 py-0.5 rounded-full text-[10px] font-bold bg-[#EFF4FF] text-[#0050FF] border border-[#BFDBFE] uppercase tracking-wider">
              Módulo de Produção • Seção 4.5
            </span>
          </div>
          <h2 className="text-xl font-bold text-[#0F172A] flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#0050FF]" />
            Criação de Criativos & Landing Pages com IA
          </h2>
          <p className="text-xs text-[#64748B]">
            Cliente Selecionado: <b className="text-[#0F172A]">{clientName}</b>
          </p>
        </div>

        {/* Module Switcher */}
        <div className="flex bg-[#F1F5F9] border border-[#E2E8F0] rounded-xl p-1 text-xs">
          <button
            onClick={() => setActiveModule('landing_page')}
            className={`px-4 py-2 rounded-lg font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeModule === 'landing_page'
                ? 'bg-white text-[#0050FF] border border-[#BFDBFE] shadow-xs'
                : 'text-[#64748B] hover:text-[#0F172A]'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            1. Construtor de Landing Page IA
          </button>
          <button
            onClick={() => setActiveModule('criativos')}
            className={`px-4 py-2 rounded-lg font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeModule === 'criativos'
                ? 'bg-white text-[#0050FF] border border-[#BFDBFE] shadow-xs'
                : 'text-[#64748B] hover:text-[#0F172A]'
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
          <div className="bg-white border border-[#E2E8F0] p-4 rounded-2xl shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-xs font-semibold text-[#0F172A]">
                Landing Page Builder • Conectado ao CRM Kommo & WhatsApp
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleExportHTML}
                className="px-3.5 py-2 rounded-xl text-xs font-bold bg-[#EFF4FF] hover:bg-[#DBEAFE] text-[#0050FF] border border-[#BFDBFE] transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Download className="w-3.5 h-3.5" />
                Exportar Código HTML
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Briefing & AI Controls */}
            <div className="lg:col-span-4 bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-xs space-y-4">
              <div className="border-b border-[#E2E8F0] pb-3">
                <h3 className="text-xs font-bold text-[#0F172A] uppercase tracking-wider flex items-center gap-2">
                  <Wand2 className="w-4 h-4 text-[#0050FF]" />
                  Briefing em Linguagem Natural
                </h3>
                <p className="text-[11px] text-[#64748B]">Instruções para a IA desenhar a estrutura e copy da LP</p>
              </div>

              <div>
                <textarea
                  value={lpBriefing}
                  onChange={(e) => setLpBriefing(e.target.value)}
                  rows={6}
                  className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl p-3 text-xs text-[#0F172A] focus:outline-none focus:border-[#0050FF] focus:bg-white transition-all leading-relaxed"
                />
              </div>

              <button
                onClick={handleGenerateLP}
                disabled={isGeneratingLP}
                className="w-full py-2.5 rounded-xl text-xs font-bold bg-[#0050FF] hover:bg-[#0040D6] text-white shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
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
              <div className="pt-3 border-t border-[#E2E8F0] space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-[11px] font-bold text-[#0F172A] uppercase tracking-wider flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5 text-[#0050FF]" />
                    Feedback do Cliente
                  </h4>
                  <span className="text-[10px] text-[#64748B]">{comments.length} notas</span>
                </div>

                <div className="space-y-2">
                  {comments.map((c) => (
                    <div key={c.id} className="p-2.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-xs space-y-1">
                      <div className="flex justify-between items-center text-[10px]">
                        <span className="font-bold text-[#0F172A] truncate max-w-[180px]">{c.author}</span>
                        <span
                          className={`px-1.5 py-0.5 rounded font-semibold text-[9px] border ${
                            c.status === 'Aplicado'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}
                        >
                          {c.status}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#475569]">{c.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column: Sandbox Browser Preview */}
            <div className="lg:col-span-8 bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-xs space-y-4">
              {/* Browser Viewport Topbar */}
              <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3 bg-[#F8FAFC] p-3 rounded-xl border">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-rose-400"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-400"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-400"></div>
                  <span className="text-[11px] font-mono text-[#64748B] ml-2 truncate max-w-[240px]">
                    https://preview.swiftsail.co/lp/{clientName.toLowerCase().replace(/\s+/g, '-')}
                  </span>
                </div>

                <div className="flex items-center gap-1 bg-[#F1F5F9] border border-[#E2E8F0] rounded-lg p-0.5">
                  <button
                    onClick={() => setViewportMode('desktop')}
                    className={`px-2.5 py-1 rounded text-xs font-semibold transition-all flex items-center gap-1 cursor-pointer ${
                      viewportMode === 'desktop'
                        ? 'bg-white text-[#0050FF] shadow-xs'
                        : 'text-[#64748B] hover:text-[#0F172A]'
                    }`}
                  >
                    <Monitor className="w-3.5 h-3.5" />
                    Desktop
                  </button>
                  <button
                    onClick={() => setViewportMode('mobile')}
                    className={`px-2.5 py-1 rounded text-xs font-semibold transition-all flex items-center gap-1 cursor-pointer ${
                      viewportMode === 'mobile'
                        ? 'bg-white text-[#0050FF] shadow-xs'
                        : 'text-[#64748B] hover:text-[#0F172A]'
                    }`}
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                    Mobile
                  </button>
                </div>
              </div>

              {/* Rendered Viewport Sandbox */}
              <div
                className={`mx-auto bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl overflow-hidden transition-all duration-300 p-6 space-y-8 ${
                  viewportMode === 'mobile' ? 'max-w-sm' : 'w-full'
                }`}
              >
                {/* Navbar */}
                <div className="flex justify-between items-center pb-4 border-b border-[#E2E8F0]">
                  <span className="font-extrabold text-sm tracking-wider text-[#0F172A]">{clientName}</span>
                  <button className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs cursor-pointer shadow-xs">
                    💬 WhatsApp
                  </button>
                </div>

                {/* Hero Section */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                  <div className={viewportMode === 'mobile' ? 'space-y-3' : 'md:col-span-7 space-y-3'}>
                    <span className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-[#EFF4FF] text-[#0050FF] border border-[#BFDBFE]">
                      {lpData.badge}
                    </span>
                    <h1 className="text-xl md:text-2xl font-black text-[#0F172A] leading-tight">
                      {lpData.heroTitle}
                    </h1>
                    <p className="text-xs text-[#64748B] leading-relaxed">{lpData.heroDesc}</p>
                    <div className="flex flex-wrap gap-2 text-[11px] text-[#475569] pt-2">
                      <span className="flex items-center gap-1 text-[#0050FF] font-medium">✓ Alto Padrão</span>
                      <span className="flex items-center gap-1 text-[#0050FF] font-medium">✓ Parcelamento em 24x</span>
                      <span className="flex items-center gap-1 text-[#0050FF] font-medium">✓ Atendimento VIP</span>
                    </div>
                  </div>

                  {/* Form Box */}
                  <div
                    className={
                      viewportMode === 'mobile'
                        ? 'bg-white border border-[#E2E8F0] p-4 rounded-xl space-y-3 shadow-xs'
                        : 'md:col-span-5 bg-white border border-[#E2E8F0] p-4 rounded-xl space-y-3 shadow-xs'
                    }
                  >
                    <h3 className="text-xs font-bold text-[#0F172A]">Solicitar Apresentação Exclusiva</h3>
                    <div className="space-y-2">
                      <input
                        type="text"
                        placeholder="Seu nome completo"
                        className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg px-2.5 py-1.5 text-xs text-[#0F172A] focus:outline-none focus:border-[#0050FF]"
                      />
                      <input
                        type="tel"
                        placeholder="WhatsApp com DDD"
                        className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg px-2.5 py-1.5 text-xs text-[#0F172A] focus:outline-none focus:border-[#0050FF]"
                      />
                      <button className="w-full py-2 rounded-lg bg-[#0050FF] hover:bg-[#0040D6] text-white font-bold text-xs cursor-pointer shadow-xs">
                        Receber no WhatsApp
                      </button>
                    </div>
                  </div>
                </div>

                {/* Benefits */}
                <div className="grid grid-cols-3 gap-3 pt-4 border-t border-[#E2E8F0] text-center">
                  <div className="p-3 bg-white rounded-xl border border-[#E2E8F0] shadow-xs">
                    <p className="text-sm">📍</p>
                    <p className="text-[11px] font-bold text-[#0F172A] mt-1">Localização Nobre</p>
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-[#E2E8F0] shadow-xs">
                    <p className="text-sm">🛡️</p>
                    <p className="text-[11px] font-bold text-[#0F172A] mt-1">Segurança Total</p>
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-[#E2E8F0] shadow-xs">
                    <p className="text-sm">📈</p>
                    <p className="text-[11px] font-bold text-[#0F172A] mt-1">Alta Rentabilidade</p>
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
          <div className="lg:col-span-5 bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-xs space-y-5">
            <div className="border-b border-[#E2E8F0] pb-3">
              <h3 className="text-xs font-bold text-[#0F172A] uppercase tracking-wider flex items-center gap-2">
                <Wand2 className="w-4 h-4 text-[#0050FF]" />
                Briefing de Anúncios com IA
              </h3>
              <p className="text-[11px] text-[#64748B]">Produção de copies e formatos para Meta & Google</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#0F172A] mb-2">Formato de Saída</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => setFormat('carousel')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    format === 'carousel'
                      ? 'bg-[#EFF4FF] text-[#0050FF] border-[#BFDBFE] shadow-xs'
                      : 'bg-[#F8FAFC] border-[#E2E8F0] text-[#64748B] hover:text-[#0F172A]'
                  }`}
                >
                  Carrossel 1:1
                </button>
                <button
                  onClick={() => setFormat('reels')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    format === 'reels'
                      ? 'bg-purple-50 text-purple-700 border-purple-200 shadow-xs'
                      : 'bg-[#F8FAFC] border-[#E2E8F0] text-[#64748B] hover:text-[#0F172A]'
                  }`}
                >
                  Reels 9:16
                </button>
                <button
                  onClick={() => setFormat('static')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    format === 'static'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200 shadow-xs'
                      : 'bg-[#F8FAFC] border-[#E2E8F0] text-[#64748B] hover:text-[#0F172A]'
                  }`}
                >
                  Estático 1:1
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#0F172A] mb-2">Instrução / Briefing</label>
              <textarea
                value={creativeBriefing}
                onChange={(e) => setCreativeBriefing(e.target.value)}
                rows={4}
                className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl p-3 text-xs text-[#0F172A] focus:outline-none focus:border-[#0050FF] focus:bg-white transition-all"
              />
            </div>

            <button
              onClick={handleGenerateCreative}
              disabled={isGeneratingCreative}
              className="w-full py-3 rounded-xl text-xs font-bold bg-[#0050FF] hover:bg-[#0040D6] text-white shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
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
          <div className="lg:col-span-7 bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
              <h3 className="text-xs font-bold text-[#0F172A] uppercase tracking-wider">Canvas de Visualização</h3>
              <span className="text-xs font-mono text-[#0050FF] font-bold bg-[#EFF4FF] px-2.5 py-0.5 rounded-full border border-[#BFDBFE]">
                {format.toUpperCase()}
              </span>
            </div>

            <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl p-4 space-y-4">
              <div className="relative aspect-video rounded-xl overflow-hidden border border-[#E2E8F0] shadow-xs">
                <img src={generatedCreative.image} alt="Mockup" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-5">
                  <h4 className="text-base font-bold text-white">{generatedCreative.title}</h4>
                </div>
              </div>

              <div className="space-y-2 text-xs">
                <div className="p-3 rounded-xl bg-white border border-[#E2E8F0] shadow-xs">
                  <p className="text-[10px] font-bold text-[#0050FF] uppercase">Gancho (Hook)</p>
                  <p className="text-[#0F172A] font-semibold mt-0.5">{generatedCreative.hook}</p>
                </div>
                <div className="p-3 rounded-xl bg-white border border-[#E2E8F0] shadow-xs">
                  <p className="text-[10px] font-bold text-[#64748B] uppercase">Texto Principal</p>
                  <p className="text-[#475569] mt-0.5">{generatedCreative.copy}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
