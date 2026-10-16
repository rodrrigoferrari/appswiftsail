'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  Volume2,
  VolumeX,
  Play,
  Pause,
  ExternalLink,
  Copy,
  Check,
  Sparkles,
  BarChart3,
  Layers,
  Flame,
  Smartphone,
  Globe
} from 'lucide-react';

export interface CreativeSlide {
  num: number;
  bg?: string;
  icon?: string;
  title: string;
  desc: string;
  imgUrl?: string;
}

export interface CreativePreviewItem {
  id: string;
  nome: string;
  formato?: 'carousel' | 'reels' | 'image' | string;
  badge?: string;
  thumbUrl?: string;
  campanha?: string;
  adset?: string;
  campaignId?: string;
  adsetId?: string;
  gasto?: number;
  leads?: number;
  conversas?: number;
  impressoes?: number;
  cliques?: number;
  ctr?: string;
  cpl?: number;
  custo_por_conversa?: number;
  objetivo?: string;
  objetivo_padrao?: string;
  campanha_gasto?: number;
  campanha_leads?: number;
  campanha_conversas?: number;
  campanha_ctr?: number;
  status?: string;
  effective_status?: string;
  headline?: string;
  copy?: string;
  ctaText?: string;
  ctaLink?: string;
  accountHandle?: string;
  accountName?: string;
  accountAvatar?: string;
  slides?: CreativeSlide[];
  videoTitle?: string;
  videoDesc?: string;
  imageTitle?: string;
  imageUrl?: string;
  offerBadge?: string;
  imageDesc?: string;
  preview_link?: string;
  link_permanente?: string;
  instagram_permalink_url?: string;
  thumbnail_storage_path?: string;
  midia_storage_path?: string;
  video_storage_path?: string;
}

interface CreativePreviewModalProps {
  creative: CreativePreviewItem | null;
  onClose: () => void;
}

export default function CreativePreviewModal({
  creative,
  onClose,
}: CreativePreviewModalProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);
  const [viewMode, setViewMode] = useState<'embed' | 'media'>('media');

  const formatCtrDisplay = (val?: any) => {
    if (val == null || val === '' || val === '—') return '—';
    const s = String(val);
    if (s.includes('%')) return s;
    const n = Number(val);
    return isNaN(n) ? s : `${n.toFixed(2)}%`;
  };

  // URLs oficiais no Meta / Instagram
  const igUrl =
    creative?.instagram_permalink_url ||
    (creative?.link_permanente?.includes('instagram.com') ? creative.link_permanente : null) ||
    (creative?.preview_link?.includes('instagram.com') ? creative.preview_link : null);

  const fbUrl =
    creative?.link_permanente?.includes('facebook.com')
      ? creative.link_permanente
      : creative?.preview_link?.includes('facebook.com')
      ? creative.preview_link
      : null;

  const directMetaUrl = creative?.preview_link || creative?.link_permanente || igUrl || fbUrl;

  // Extrai shortcode para Embed Oficial do Instagram
  let igEmbedUrl: string | null = null;
  if (igUrl) {
    const match = igUrl.match(/instagram\.com\/(?:p|reel|tv)\/([^/?#&]+)/i);
    if (match && match[1]) {
      igEmbedUrl = `https://www.instagram.com/p/${match[1]}/embed/`;
    }
  }

  // Embed Oficial do Facebook Post Plugin
  let fbEmbedUrl: string | null = null;
  if (fbUrl) {
    fbEmbedUrl = `https://www.facebook.com/plugins/post.php?href=${encodeURIComponent(fbUrl)}&show_text=true&width=450`;
  }

  const hasEmbed = Boolean(igEmbedUrl || fbEmbedUrl);

  useEffect(() => {
    setCurrentSlide(0);
    setIsPlaying(false);
    setLiked(false);
    setSaved(false);
    setCopied(false);
    setViewMode('media');
  }, [creative]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (creative?.formato === 'carousel' || creative?.slides) {
        if (e.key === 'ArrowRight') handleNextSlide();
        if (e.key === 'ArrowLeft') handlePrevSlide();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [creative, currentSlide]);

  if (!creative) return null;

  const formatBRL = (val?: number) =>
    val != null
      ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)
      : 'R$ 0,00';

  // URL da Thumbnail / Imagem Real
  const realImageUrl =
    creative.imageUrl ||
    creative.thumbUrl ||
    creative.thumbnail_storage_path ||
    (creative.midia_storage_path ? `/api/meta/media?path=${encodeURIComponent(creative.midia_storage_path)}` : null) ||
    (directMetaUrl ? `/api/meta/thumbnail?url=${encodeURIComponent(directMetaUrl)}` : null) ||
    '/api/meta/thumbnail?url=default';

  // Normalização do formato
  const formatoNorm =
    creative.formato?.toLowerCase().includes('reels') ||
    creative.formato?.toLowerCase().includes('vídeo') ||
    creative.formato?.toLowerCase().includes('video')
      ? 'reels'
      : creative.formato?.toLowerCase().includes('carrossel') || creative.slides?.length
      ? 'carousel'
      : 'image';

  // Slides do anúncio
  const slides: CreativeSlide[] = creative.slides && creative.slides.length > 0 ? creative.slides : [
    {
      num: 1,
      title: creative.headline || creative.nome || 'Anúncio Publicado',
      desc: creative.copy || '',
      imgUrl: realImageUrl,
    },
  ];

  const handleNextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const handlePrevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const handleCopyText = () => {
    const text = `${creative.headline || ''}\n\n${creative.copy || ''}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenCTA = () => {
    if (directMetaUrl) {
      window.open(directMetaUrl, '_blank');
    } else if (creative.ctaLink) {
      window.open(creative.ctaLink, '_blank');
    } else {
      window.open(
        `https://wa.me/5541998243310?text=${encodeURIComponent(
          `Olá, gostaria de mais informações sobre o anúncio ${creative.nome}`
        )}`,
        '_blank'
      );
    }
  };

  const accountHandle = creative.accountHandle || 'swiftsail.midia';
  const defaultHeadline = creative.headline?.trim() || creative.nome || 'Anúncio Meta Ads';
  const defaultCopy =
    creative.copy ||
    `Campanha publicada no Meta Ads para ${creative.campanha || 'a conta oficial'}. Clique em "Ver no Meta" para conferir a publicação original.`;
  const defaultCta = creative.ctaText || '💬 Enviar Mensagem no WhatsApp';
  const rawStatus = (creative.effective_status || creative.status || '').toUpperCase();
  const isPaused =
    rawStatus.includes('PAUS') ||
    rawStatus.includes('ARCHIV') ||
    rawStatus.includes('INACTIV');
  const statusLabel = rawStatus.includes('CAMPAIGN_PAUSED')
    ? 'CAMPANHA PAUSADA'
    : rawStatus.includes('ADSET_PAUSED')
    ? 'CONJUNTO PAUSADO'
    : rawStatus.includes('ARCHIV')
    ? 'ARQUIVADO'
    : isPaused
    ? 'PAUSADO'
    : 'ATIVO';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/40 backdrop-blur-xs animate-fadeIn overflow-y-auto">
      <div
        className="relative w-full max-w-4xl bg-white border border-[#E2E8F0] rounded-2xl shadow-2xl overflow-hidden my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header Bar */}
        <div className="flex items-center justify-between px-5 py-4 bg-white border-b border-[#E2E8F0]">
          <div className="flex items-center gap-3 min-w-0">
            <span className="p-2 rounded-xl bg-[#EFF4FF] text-[#0050FF] border border-[#BFDBFE] shrink-0">
              <Sparkles className="w-4 h-4" />
            </span>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-[#0F172A] truncate max-w-sm sm:max-w-md">{creative.nome}</h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#EFF4FF] text-[#0050FF] border border-[#BFDBFE] uppercase shrink-0">
                  {formatoNorm === 'carousel' ? 'Carrossel' : formatoNorm === 'reels' ? 'Reels 9:16' : 'Estático 1:1'}
                </span>
              </div>
              <p className="text-xs text-[#64748B] font-mono truncate">
                ID: <span className="text-[#0F172A]">{creative.id}</span> • {creative.campanha || 'Meta Ads'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {directMetaUrl && (
              <a
                href={directMetaUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-1.5 rounded-xl text-xs bg-[#0050FF] hover:bg-[#0040D6] text-white transition-all flex items-center gap-1.5 font-bold shadow-xs cursor-pointer"
                title="Abrir anúncio original publicado no Facebook / Instagram"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Ver no Meta / Insta</span>
              </a>
            )}
            <button
              onClick={handleCopyText}
              className="px-3 py-1.5 rounded-xl text-xs bg-white hover:bg-[#F8FAFC] text-[#0F172A] transition-all flex items-center gap-1.5 border border-[#CBD5E1] shadow-xs cursor-pointer"
              title="Copiar Headline e Legenda"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-[#64748B]" />}
              <span className="hidden sm:inline">{copied ? 'Copiado!' : 'Copiar Copy'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9] transition-colors cursor-pointer"
              title="Fechar (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Main Content: Split Preview + Metrics */}
        <div className="grid grid-cols-1 lg:grid-cols-12 max-h-[82vh] overflow-y-auto">
          {/* Coluna Esquerda: Preview Real (Embed Oficial ou Mockup com Imagem Real) */}
          <div className="lg:col-span-7 p-5 bg-[#F8FAFC] flex flex-col items-center justify-center border-b lg:border-b-0 lg:border-r border-[#E2E8F0] min-h-[520px]">
            {/* Seletor de Modo quando há Embed disponível */}
            {hasEmbed && (
              <div className="w-full max-w-[420px] flex items-center justify-between mb-3 bg-[#F1F5F9] p-1 rounded-xl border border-[#E2E8F0] text-xs">
                <button
                  onClick={() => setViewMode('embed')}
                  className={`flex-1 py-1.5 px-3 rounded-lg font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    viewMode === 'embed'
                      ? 'bg-white text-[#0050FF] shadow-xs border border-[#BFDBFE]'
                      : 'text-[#64748B] hover:text-[#0F172A]'
                  }`}
                >
                  <Globe className="w-3.5 h-3.5" />
                  <span>Publicação Oficial (Embed)</span>
                </button>
                <button
                  onClick={() => setViewMode('media')}
                  className={`flex-1 py-1.5 px-3 rounded-lg font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    viewMode === 'media'
                      ? 'bg-white text-[#0050FF] shadow-xs border border-[#BFDBFE]'
                      : 'text-[#64748B] hover:text-[#0F172A]'
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>Mídia & Mockup</span>
                </button>
              </div>
            )}

            {/* MODO 1: IFRAME INCORPORADO REAL DO INSTAGRAM / FACEBOOK */}
            {hasEmbed && viewMode === 'embed' ? (
              <div className="w-full max-w-[440px] flex flex-col items-center">
                <div className="w-full mb-2.5 p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-800 flex items-start gap-2">
                  <span className="text-base shrink-0">💡</span>
                  <span>
                    Caso o Instagram bloqueie a exibição incorporada por políticas da Meta, utilize <b>"Ver no Meta / Insta"</b> acima ou alterne para a aba <b>"Mídia & Mockup"</b> para visualizar a foto/vídeo real.
                  </span>
                </div>
                <div className="w-full h-[520px] rounded-2xl border border-[#CBD5E1] shadow-xl overflow-hidden bg-white flex items-center justify-center">
                  <iframe
                    src={igEmbedUrl || fbEmbedUrl!}
                    className="w-full h-full border-0"
                    frameBorder="0"
                    scrolling="yes"
                    allowTransparency={true}
                    allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
                  />
                </div>
                {directMetaUrl && (
                  <div className="mt-3 text-center">
                    <a
                      href={directMetaUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-[#0050FF] hover:underline flex items-center justify-center gap-1.5 font-semibold"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Abrir publicação original no Meta / Instagram ↗</span>
                    </a>
                  </div>
                )}
              </div>
            ) : (
              /* MODO 2: CARD COM IMAGEM REAL E COPY */
              <div className="w-full max-w-[420px] bg-[#121212] border border-white/10 rounded-xl overflow-hidden shadow-2xl text-white font-sans">
                {/* Header Instagram */}
                <div className="flex items-center justify-between p-3 border-b border-white/5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-sm font-bold shadow">
                      {creative.accountAvatar || '🏢'}
                    </div>
                    <div>
                      <div className="text-xs font-bold leading-tight hover:underline cursor-pointer">
                        {accountHandle}
                      </div>
                      <div className="text-[10px] text-zinc-400 flex items-center gap-1">
                        Patrocinado • <span>🌐</span>
                      </div>
                    </div>
                  </div>
                  <span className="text-zinc-400 text-xs font-mono tracking-widest cursor-pointer hover:text-white">
                    •••
                  </span>
                </div>

                {/* Área da Imagem Real com Overlay */}
                <div
                  className={`relative w-full overflow-hidden bg-zinc-950 flex flex-col justify-end p-5 select-none ${
                    formatoNorm === 'reels' ? 'aspect-[9/14] sm:aspect-[9/15]' : 'aspect-square'
                  }`}
                >
                  {/* Imagem de Capa Real do Anúncio */}
                  {realImageUrl && (
                    <img
                      src={realImageUrl}
                      alt={defaultHeadline}
                      className="absolute inset-0 w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/api/meta/thumbnail?url=default';
                      }}
                    />
                  )}

                  {/* Gradiente para Legibilidade dos Textos */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-black/30 pointer-events-none" />

                  {/* Botão Central de Play para Vídeos / Reels */}
                  {formatoNorm === 'reels' && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <button
                        onClick={hasEmbed ? () => setViewMode('embed') : (directMetaUrl ? () => window.open(directMetaUrl, '_blank') : handleOpenCTA)}
                        className="w-14 h-14 rounded-full bg-white/90 hover:bg-white text-zinc-900 flex items-center justify-center shadow-2xl backdrop-blur-xs transition-transform hover:scale-110 active:scale-95 cursor-pointer pl-1 group"
                        title={hasEmbed ? 'Assistir no Embed Oficial Interativo' : 'Ver vídeo completo no Instagram / Meta'}
                      >
                        <Play className="w-6 h-6 fill-zinc-900 text-zinc-900" />
                      </button>
                    </div>
                  )}

                  <div className="space-y-1.5 relative z-10">
                    <div className="flex items-center gap-2">
                      <span className="inline-block px-2.5 py-0.5 rounded text-[10px] font-black bg-cyan-500 text-slate-950 shadow">
                        {creative.badge || (formatoNorm === 'reels' ? 'REELS' : 'META ADS')}
                      </span>
                      {formatoNorm === 'reels' && (
                        <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-black/60 text-white backdrop-blur-xs">
                          Vídeo Oficial
                        </span>
                      )}
                    </div>
                    <h4 className="text-base font-black !text-white leading-tight drop-shadow-md" style={{ color: '#ffffff' }}>
                      {defaultHeadline}
                    </h4>
                  </div>
                </div>

                {/* Botão de Ação CTA Oficial Meta */}
                <div className="p-3 bg-zinc-900 border-t border-b border-white/5">
                  <button
                    onClick={handleOpenCTA}
                    className="w-full py-2.5 px-4 rounded-lg bg-blue-600 hover:bg-blue-500 font-bold text-xs text-white flex items-center justify-center gap-2 shadow-lg transition-all active:scale-[0.98]"
                  >
                    <span>{defaultCta}</span>
                    <ExternalLink className="w-3.5 h-3.5 opacity-80" />
                  </button>
                </div>

                {/* Barra de Engajamento Instagram */}
                <div className="p-3 space-y-2">
                  <div className="flex items-center justify-between text-zinc-300">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setLiked(!liked)}
                        className={`transition-colors ${liked ? 'text-red-500' : 'hover:text-red-400'}`}
                      >
                        <Heart className="w-5 h-5" fill={liked ? 'currentColor' : 'none'} />
                      </button>
                      <button className="hover:text-white transition-colors">
                        <MessageCircle className="w-5 h-5" />
                      </button>
                      <button className="hover:text-white transition-colors">
                        <Share2 className="w-5 h-5" />
                      </button>
                    </div>
                    <button
                      onClick={() => setSaved(!saved)}
                      className={`transition-colors ${saved ? 'text-amber-400' : 'hover:text-white'}`}
                    >
                      <Bookmark className="w-5 h-5" fill={saved ? 'currentColor' : 'none'} />
                    </button>
                  </div>

                  {/* Legenda formatada */}
                  <div className="text-xs text-zinc-300 leading-relaxed max-h-24 overflow-y-auto">
                    <span className="font-bold text-white mr-1.5">{accountHandle}</span>
                    <span>{defaultCopy}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Coluna Direita: Métricas de Performance & Diagnóstico de Tráfego */}
          <div className="lg:col-span-5 p-6 space-y-5 bg-white flex flex-col justify-between">
            <div className="space-y-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#0050FF]">
                  DIAGNÓSTICO DO CRIATIVO
                </span>
                <h4 className="text-base font-bold text-[#0F172A] mt-0.5">{creative.nome}</h4>
                <div className="flex items-center gap-2 mt-1">
                  {isPaused ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                      {statusLabel}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                      </span>
                      ATIVO
                    </span>
                  )}
                  <span className="text-xs text-[#64748B] font-mono">
                    CTR: <b className="text-[#0F172A]">{formatCtrDisplay(creative.ctr)}</b>
                  </span>
                </div>
              </div>

              {/* Grid de KPIs do Criativo Adaptado ao Objetivo */}
              {(() => {
                const cGastoRaw = Number(creative.gasto || 0);
                const campGastoRaw = Number(creative.campanha_gasto || 0);
                const isCboFallback = cGastoRaw === 0 && campGastoRaw > 0;
                const cGasto = cGastoRaw > 0 ? cGastoRaw : campGastoRaw;

                const cLeadsRaw = Math.max(0, Number(creative.leads || 0));
                const campLeadsRaw = Math.max(0, Number(creative.campanha_leads || 0));
                const cLeads = cLeadsRaw > 0 ? cLeadsRaw : (isCboFallback ? campLeadsRaw : 0);

                const cConvRaw = Math.max(0, Number(creative.conversas || 0));
                const campConvRaw = Math.max(0, Number(creative.campanha_conversas || 0));
                const cConv = cConvRaw > 0 ? cConvRaw : (isCboFallback ? campConvRaw : 0);

                const cImp = Math.max(0, Number(creative.impressoes || 0));
                const cCliques = Math.max(0, Number(creative.cliques || 0));
                const cCtr = creative.ctr || (creative.campanha_ctr ? `${creative.campanha_ctr}%` : null);

                const padrao = String(creative.objetivo_padrao || '').toUpperCase();
                let cObj = creative.objetivo;
                if (!cObj) {
                  if (padrao === 'MENSAGENS') cObj = 'messages';
                  else if (padrao === 'LEADS') cObj = cConv > 0 && cLeads === 0 ? 'messages' : 'forms';
                  else if (padrao === 'TRAFEGO') cObj = 'traffic';
                  else if (padrao === 'RECONHECIMENTO') cObj = 'reach';
                  else if (padrao === 'VENDAS') cObj = 'conversions';
                  else cObj = cLeads > 0 && cConv === 0 ? 'forms' : cConv > 0 ? 'messages' : cImp > 5000 ? 'reach' : cCliques > 10 ? 'traffic' : 'forms';
                }

                let retLabel = `${cLeads} leads`;
                let retColor = 'text-[#0050FF]';
                let custoLabel = 'CPL (Custo / Lead)';
                let custoVal = cLeads > 0 && cGasto > 0 ? formatBRL(cGasto / cLeads) : creative.cpl ? formatBRL(creative.cpl) : '—';
                let custoColor = 'text-cyan-700';

                if (cObj === 'messages') {
                  retLabel = `${cConv} conversas WPP`;
                  retColor = 'text-emerald-600';
                  custoLabel = 'CPMsg (Custo / Conv.)';
                  custoVal = cConv > 0 && cGasto > 0 ? formatBRL(cGasto / cConv) : creative.custo_por_conversa ? formatBRL(creative.custo_por_conversa) : '—';
                  custoColor = 'text-emerald-700';
                } else if (cObj === 'reach') {
                  retLabel = `${cImp.toLocaleString('pt-BR')} imp.`;
                  retColor = 'text-amber-700';
                  custoLabel = 'CPM (Custo / Mil)';
                  custoVal = cImp > 0 && cGasto > 0 ? formatBRL((cGasto / cImp) * 1000) : '—';
                  custoColor = 'text-amber-700';
                } else if (cObj === 'traffic') {
                  retLabel = `${cCliques} cliques no link`;
                  retColor = 'text-teal-700';
                  custoLabel = 'CPC (Custo / Clique)';
                  custoVal = cCliques > 0 && cGasto > 0 ? formatBRL(cGasto / cCliques) : '—';
                  custoColor = 'text-teal-700';
                }

                return (
                  <div className="space-y-2 pt-2">
                    {isCboFallback && (
                      <div className="px-2.5 py-1 bg-blue-50 border border-blue-200 rounded-lg text-[10px] text-blue-700 flex items-center justify-between font-sans">
                        <span>⚡ Orçamento CBO gerenciado na campanha mãe</span>
                        <span className="font-bold uppercase font-mono">Campanha LIV</span>
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0] space-y-1">
                        <span className="text-[10px] text-[#64748B] flex items-center justify-between font-semibold uppercase">
                          <span className="flex items-center gap-1"><BarChart3 className="w-3 h-3 text-[#0050FF]" /> Gasto</span>
                          {isCboFallback && <span className="text-[9px] text-[#0050FF] font-mono">CBO</span>}
                        </span>
                        <div className="text-sm font-bold text-[#0F172A] font-mono">{cGasto > 0 ? formatBRL(cGasto) : '—'}</div>
                      </div>

                      <div className="p-3 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0] space-y-1">
                        <span className="text-[10px] text-[#64748B] flex items-center justify-between font-semibold uppercase">
                          <span className="flex items-center gap-1"><Flame className="w-3 h-3 text-emerald-600" /> Retorno</span>
                          {isCboFallback && <span className="text-[9px] text-emerald-600 font-mono">Campanha</span>}
                        </span>
                        <div className={`text-sm font-bold ${retColor} font-mono`}>{retLabel}</div>
                      </div>

                      <div className="p-3 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0] space-y-1">
                        <span className="text-[10px] text-[#64748B] font-semibold uppercase">{custoLabel}</span>
                        <div className={`text-sm font-bold ${custoColor} font-mono`}>{custoVal}</div>
                      </div>

                      <div className="p-3 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0] space-y-1">
                        <span className="text-[10px] text-[#64748B] font-semibold uppercase">CTR</span>
                        <div className="text-sm font-bold text-[#0F172A] font-mono">{formatCtrDisplay(cCtr)}</div>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Estrutura de Origem */}
              <div className="p-3.5 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0] space-y-2 text-xs">
                <div className="flex items-center justify-between text-[#64748B]">
                  <span>Campanha:</span>
                  <span className="font-semibold text-[#0F172A] truncate max-w-[200px]" title={creative.campanha}>
                    {creative.campanha || 'Campanha Principal Meta'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[#64748B]">
                  <span>Conjunto (AdSet):</span>
                  <span className="font-semibold text-[#0F172A] truncate max-w-[200px]" title={creative.adset}>
                    {creative.adset || 'Público Segmentado'}
                  </span>
                </div>
              </div>

              {/* Headline Utilizada */}
              <div className="p-3 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0] space-y-1">
                <div className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider">
                  Headline / Título
                </div>
                <div className="text-xs text-[#0F172A] font-medium italic">"{defaultHeadline}"</div>
              </div>
            </div>

            {/* Ações Inferiores */}
            <div className="pt-4 border-t border-[#E2E8F0] space-y-2">
              {directMetaUrl ? (
                <a
                  href={directMetaUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 px-4 rounded-xl bg-[#0050FF] hover:bg-[#0040D6] font-bold text-xs text-white flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Abrir Anúncio Publicado no Meta</span>
                </a>
              ) : (
                <button
                  onClick={handleOpenCTA}
                  className="w-full py-2.5 px-4 rounded-xl bg-[#0050FF] hover:bg-[#0040D6] font-bold text-xs text-white flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Abrir Link de Destino</span>
                </button>
              )}

              <button
                onClick={onClose}
                className="w-full py-2 px-4 rounded-xl bg-white border border-[#CBD5E1] hover:bg-[#F8FAFC] font-semibold text-xs text-[#0F172A] transition-colors shadow-xs cursor-pointer"
              >
                Fechar Visualização
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
