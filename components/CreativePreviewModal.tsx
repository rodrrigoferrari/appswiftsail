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
  ctr?: string;
  cpl?: number;
  status?: string;
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
  const [viewMode, setViewMode] = useState<'embed' | 'media'>('embed');

  useEffect(() => {
    setCurrentSlide(0);
    setIsPlaying(false);
    setLiked(false);
    setSaved(false);
    setCopied(false);
    setViewMode('embed');
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

  // URLs oficiais no Meta / Instagram
  const igUrl =
    creative.instagram_permalink_url ||
    (creative.link_permanente?.includes('instagram.com') ? creative.link_permanente : null);
  const fbUrl = creative.link_permanente?.includes('facebook.com') ? creative.link_permanente : null;
  const directMetaUrl = creative.preview_link || creative.link_permanente || igUrl || fbUrl;

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

  // URL da Thumbnail / Imagem Real
  const realImageUrl =
    creative.imageUrl ||
    creative.thumbUrl ||
    creative.thumbnail_storage_path ||
    (directMetaUrl ? `/api/meta/thumbnail?url=${encodeURIComponent(directMetaUrl)}` : null) ||
    'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=600&auto=format&fit=crop&q=80';

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
  const defaultHeadline = creative.headline || creative.nome || 'Anúncio Meta Ads';
  const defaultCopy =
    creative.copy ||
    `Campanha publicada no Meta Ads para ${creative.campanha || 'a conta oficial'}. Clique em "Ver no Meta" para conferir a publicação original.`;
  const defaultCta = creative.ctaText || '💬 Enviar Mensagem no WhatsApp';

  const isPaused =
    creative.status?.toUpperCase().includes('PAUS') || creative.status?.toUpperCase().includes('PAUSED');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-fadeIn overflow-y-auto">
      <div
        className="relative w-full max-w-4xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header Bar */}
        <div className="flex items-center justify-between px-5 py-4 bg-slate-950/90 border-b border-slate-800">
          <div className="flex items-center gap-3 min-w-0">
            <span className="p-2 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 shrink-0">
              <Sparkles className="w-4 h-4" />
            </span>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white truncate max-w-sm sm:max-w-md">{creative.nome}</h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 uppercase shrink-0">
                  {formatoNorm === 'carousel' ? 'Carrossel' : formatoNorm === 'reels' ? 'Reels 9:16' : 'Estático 1:1'}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono truncate">
                ID: <span className="text-slate-300">{creative.id}</span> • {creative.campanha || 'Meta Ads'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {directMetaUrl && (
              <a
                href={directMetaUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-1.5 rounded-lg text-xs bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white transition-all flex items-center gap-1.5 font-bold shadow-md shadow-blue-600/20"
                title="Abrir anúncio original publicado no Facebook / Instagram"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Ver no Meta / Insta</span>
              </a>
            )}
            <button
              onClick={handleCopyText}
              className="px-3 py-1.5 rounded-lg text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all flex items-center gap-1.5 border border-slate-700"
              title="Copiar Headline e Legenda"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{copied ? 'Copiado!' : 'Copiar Copy'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Fechar (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Main Content: Split Preview + Metrics */}
        <div className="grid grid-cols-1 lg:grid-cols-12 max-h-[82vh] overflow-y-auto">
          {/* Coluna Esquerda: Preview Real (Embed Oficial ou Mockup com Imagem Real) */}
          <div className="lg:col-span-7 p-5 bg-slate-950 flex flex-col items-center justify-center border-b lg:border-b-0 lg:border-r border-slate-800 min-h-[520px]">
            {/* Seletor de Modo quando há Embed disponível */}
            {hasEmbed && (
              <div className="w-full max-w-[420px] flex items-center justify-between mb-3 bg-slate-900/80 p-1 rounded-xl border border-slate-800 text-xs">
                <button
                  onClick={() => setViewMode('embed')}
                  className={`flex-1 py-1.5 px-3 rounded-lg font-bold transition-all flex items-center justify-center gap-1.5 ${
                    viewMode === 'embed'
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Globe className="w-3.5 h-3.5" />
                  <span>Publicação Oficial (Embed)</span>
                </button>
                <button
                  onClick={() => setViewMode('media')}
                  className={`flex-1 py-1.5 px-3 rounded-lg font-bold transition-all flex items-center justify-center gap-1.5 ${
                    viewMode === 'media'
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow'
                      : 'text-slate-400 hover:text-white'
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
                <iframe
                  src={igEmbedUrl || fbEmbedUrl!}
                  className="w-full h-[540px] rounded-2xl border border-slate-800 shadow-2xl bg-black"
                  frameBorder="0"
                  scrolling="yes"
                  allowTransparency={true}
                  allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
                />
                {directMetaUrl && (
                  <div className="mt-2.5 text-center">
                    <a
                      href={directMetaUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-cyan-400 hover:text-cyan-300 hover:underline flex items-center justify-center gap-1 font-semibold"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span>Abrir publicação diretamente no app do Instagram / Facebook</span>
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
                  className="relative aspect-square w-full overflow-hidden bg-zinc-950 flex flex-col justify-end p-5 select-none bg-cover bg-center"
                  style={{
                    backgroundImage: `linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.2) 60%), url(${realImageUrl})`,
                  }}
                >
                  <div className="space-y-1.5 relative z-10">
                    <span className="inline-block px-2.5 py-0.5 rounded text-[10px] font-black bg-cyan-500 text-slate-950 shadow">
                      {creative.badge || 'META ADS'}
                    </span>
                    <h4 className="text-base font-black text-white leading-tight drop-shadow-md">
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
          <div className="lg:col-span-5 p-6 space-y-5 bg-slate-900 flex flex-col justify-between">
            <div className="space-y-4">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-cyan-400 font-mono">
                  DIAGNÓSTICO DO CRIATIVO
                </span>
                <h4 className="text-base font-bold text-white mt-0.5">{creative.nome}</h4>
                <div className="flex items-center gap-2 mt-1">
                  {isPaused ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500/15 text-amber-300 border border-amber-500/40">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                      PAUSADO
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/15 text-emerald-300 border border-emerald-500/40">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
                      </span>
                      ATIVO
                    </span>
                  )}
                  <span className="text-xs text-slate-400 font-mono">
                    CTR: <b className="text-white">{creative.ctr || '—'}</b>
                  </span>
                </div>
              </div>

              {/* Grid de KPIs do Criativo */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 space-y-1">
                  <span className="text-[10px] text-slate-400 flex items-center gap-1">
                    <BarChart3 className="w-3 h-3 text-cyan-400" /> Gasto
                  </span>
                  <div className="text-sm font-black text-white font-mono">{formatBRL(creative.gasto || 0)}</div>
                </div>

                <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 space-y-1">
                  <span className="text-[10px] text-slate-400 flex items-center gap-1">
                    <Flame className="w-3 h-3 text-emerald-400" /> Retorno
                  </span>
                  <div className="text-sm font-black text-cyan-300 font-mono">
                    {creative.leads || creative.conversas || 0} contatos
                  </div>
                </div>

                <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 space-y-1">
                  <span className="text-[10px] text-slate-400">Custo por Lead/Conv.</span>
                  <div className="text-sm font-black text-emerald-400 font-mono">
                    {formatBRL(
                      creative.cpl ||
                        (creative.gasto && (creative.leads || creative.conversas)
                          ? creative.gasto / (creative.leads || creative.conversas || 1)
                          : 0)
                    )}
                  </div>
                </div>

                <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 space-y-1">
                  <span className="text-[10px] text-slate-400">Taxa de Cliques (CTR)</span>
                  <div className="text-sm font-black text-amber-300 font-mono">{creative.ctr || '—'}</div>
                </div>
              </div>

              {/* Estrutura de Origem */}
              <div className="p-3.5 bg-slate-950/50 rounded-xl border border-slate-800 space-y-2 text-xs">
                <div className="flex items-center justify-between text-slate-400">
                  <span>Campanha:</span>
                  <span className="font-semibold text-slate-200 truncate max-w-[200px]" title={creative.campanha}>
                    {creative.campanha || 'Campanha Principal Meta'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-400">
                  <span>Conjunto (AdSet):</span>
                  <span className="font-semibold text-slate-200 truncate max-w-[200px]" title={creative.adset}>
                    {creative.adset || 'Público Segmentado'}
                  </span>
                </div>
              </div>

              {/* Headline Utilizada */}
              <div className="p-3 bg-slate-950/40 rounded-xl border border-slate-800/80 space-y-1.5">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Headline / Título
                </div>
                <div className="text-xs text-slate-200 font-medium italic">"{defaultHeadline}"</div>
              </div>
            </div>

            {/* Ações Inferiores */}
            <div className="pt-4 border-t border-slate-800 space-y-2">
              {directMetaUrl ? (
                <a
                  href={directMetaUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 font-bold text-xs text-white flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 transition-all"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Abrir Anúncio Publicado no Meta</span>
                </a>
              ) : (
                <button
                  onClick={handleOpenCTA}
                  className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 font-bold text-xs text-slate-950 flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/10 transition-all"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Abrir Link de Destino</span>
                </button>
              )}

              <button
                onClick={onClose}
                className="w-full py-2 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 font-semibold text-xs text-slate-300 transition-colors"
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
