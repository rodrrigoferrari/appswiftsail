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
  Smartphone
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
  formato: 'carousel' | 'reels' | 'image' | string;
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

  useEffect(() => {
    setCurrentSlide(0);
    setIsPlaying(false);
    setLiked(false);
    setSaved(false);
    setCopied(false);
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

  // Normalização do formato
  const formatoNorm =
    creative.formato?.toLowerCase().includes('reels') || creative.formato?.toLowerCase().includes('vídeo')
      ? 'reels'
      : creative.formato?.toLowerCase().includes('carrossel') || creative.slides?.length
      ? 'carousel'
      : 'image';

  // Slides padrão caso não informados
  const slides: CreativeSlide[] = creative.slides || [
    {
      num: 1,
      bg: 'linear-gradient(135deg, #1e3a8a, #3b82f6)',
      icon: '🏢✨',
      title: '1. Localização Nobre & Valorização',
      desc: 'Plantas exclusivas no melhor endereço da região, com fácil acesso e alto potencial de valorização.',
      imgUrl: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=600&auto=format&fit=crop&q=80',
    },
    {
      num: 2,
      bg: 'linear-gradient(135deg, #0f766e, #06b6d4)',
      icon: '📐🌿',
      title: '2. Plantas Inteligentes & Acabamento Premium',
      desc: 'Espaços amplos planejados para o máximo conforto da sua família com acabamento impecável.',
      imgUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&auto=format&fit=crop&q=80',
    },
    {
      num: 3,
      bg: 'linear-gradient(135deg, #581c87, #a855f7)',
      icon: '🏊‍♂️🏋️',
      title: '3. Lazer Completo Equipado e Decorado',
      desc: 'Estrutura completa de lazer, piscinas, espaço gourmet e academia de ponta sem sair de casa.',
      imgUrl: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=600&auto=format&fit=crop&q=80',
    },
    {
      num: 4,
      bg: 'linear-gradient(135deg, #064e3b, #10b981)',
      icon: '📲🔑',
      title: '4. Condição Especial de Negociação',
      desc: 'Valores promocionais de tabela e fluxo de pagamento facilitado direto com a incorporadora.',
      imgUrl: 'https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?w=600&auto=format&fit=crop&q=80',
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
    if (creative.ctaLink) {
      window.open(creative.ctaLink, '_blank');
    } else {
      window.open('https://wa.me/5511987654321?text=Ol%C3%A1%2C%20vi%20o%20an%C3%BAncio%20e%20gostaria%20de%20mais%20informa%C3%A7%C3%B5es!', '_blank');
    }
  };

  const accountHandle = creative.accountHandle || 'swiftsail.midia';
  const accountName = creative.accountName || 'Swiftsail Mídia';
  const defaultHeadline =
    creative.headline || 'Oportunidade Exclusiva • Alto Padrão e Localização Nobre';
  const defaultCopy =
    creative.copy ||
    'Descubra plantas inteligentes com acabamento premium e localização privilegiada. Fale direto com a nossa equipe no WhatsApp para receber o material completo e condições especiais de lançamento.';
  const defaultCta = creative.ctaText || '💬 Enviar Mensagem no WhatsApp';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-fadeIn overflow-y-auto">
      <div
        className="relative w-full max-w-4xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header Bar */}
        <div className="flex items-center justify-between px-5 py-4 bg-slate-950/80 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <span className="p-2 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Sparkles className="w-4 h-4" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white truncate max-w-md">{creative.nome}</h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 uppercase">
                  {formatoNorm === 'carousel' ? 'Carrossel 1:1' : formatoNorm === 'reels' ? 'Reels 9:16' : 'Estático 1:1'}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono">
                ID Anúncio Meta: <span className="text-slate-300">{creative.id}</span> • Posicionamento: Feed, Stories & Reels
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {(creative.preview_link || creative.link_permanente) && (
              <a
                href={creative.preview_link || creative.link_permanente}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 rounded-lg text-xs bg-blue-600/20 hover:bg-blue-600/40 text-blue-300 transition-all flex items-center gap-1.5 border border-blue-500/30 font-semibold"
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
              <span>{copied ? 'Copiado!' : 'Copiar Copy'}</span>
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
        <div className="grid grid-cols-1 lg:grid-cols-12 max-h-[80vh] overflow-y-auto">
          {/* Coluna Esquerda: Mockup Realista de Anúncio Meta (Feed / Reels) */}
          <div className="lg:col-span-7 p-6 bg-slate-950 flex flex-col items-center justify-center border-b lg:border-b-0 lg:border-r border-slate-800">
            {/* CAROUSEL MOCKUP */}
            {formatoNorm === 'carousel' && (
              <div className="w-full max-w-[420px] bg-[#121212] border border-white/10 rounded-xl overflow-hidden shadow-2xl text-white font-sans">
                {/* Header Instagram */}
                <div className="flex items-center justify-between p-3 border-b border-white/5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-sm font-bold shadow">
                      {creative.accountAvatar || '🏢'}
                    </div>
                    <div>
                      <div className="text-xs font-bold leading-tight hover:underline cursor-pointer">{accountHandle}</div>
                      <div className="text-[10px] text-zinc-400 flex items-center gap-1">
                        Patrocinado • <span>🌐</span>
                      </div>
                    </div>
                  </div>
                  <span className="text-zinc-400 text-xs font-mono tracking-widest cursor-pointer hover:text-white">•••</span>
                </div>

                {/* Área da Imagem / Slide do Carrossel */}
                <div className="relative aspect-square w-full overflow-hidden bg-zinc-900 select-none group">
                  {/* Slide Atual */}
                  <div
                    className="w-full h-full flex flex-col justify-end p-6 text-white relative transition-all duration-300"
                    style={{
                      backgroundImage: slides[currentSlide]?.imgUrl
                        ? `linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.2) 60%, rgba(0,0,0,0.1) 100%), url(${slides[currentSlide].imgUrl})`
                        : slides[currentSlide]?.bg || 'linear-gradient(135deg, #1e3a8a, #3b82f6)',
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                    }}
                  >
                    <div className="relative z-10 space-y-2">
                      <span className="text-4xl filter drop-shadow-md">{slides[currentSlide]?.icon}</span>
                      <h4 className="text-lg font-black leading-tight text-white drop-shadow-md">
                        {slides[currentSlide]?.title}
                      </h4>
                      <p className="text-xs text-white/90 leading-snug drop-shadow">
                        {slides[currentSlide]?.desc}
                      </p>
                      <div className="pt-2">
                        <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-black/60 text-white backdrop-blur-md border border-white/20">
                          Card {slides[currentSlide]?.num || currentSlide + 1} de {slides.length}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Botões de Navegação do Carrossel */}
                  {currentSlide > 0 && (
                    <button
                      onClick={handlePrevSlide}
                      className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center backdrop-blur-sm transition-all border border-white/20 shadow-lg"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                  )}
                  {currentSlide < slides.length - 1 && (
                    <button
                      onClick={handleNextSlide}
                      className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center backdrop-blur-sm transition-all border border-white/20 shadow-lg"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  )}

                  {/* Dots de Paginação */}
                  <div className="absolute top-3 right-3 flex items-center gap-1 bg-black/50 px-2 py-1 rounded-full backdrop-blur-sm">
                    {slides.map((_, idx) => (
                      <div
                        key={idx}
                        onClick={() => setCurrentSlide(idx)}
                        className={`w-1.5 h-1.5 rounded-full transition-all cursor-pointer ${
                          idx === currentSlide ? 'bg-blue-400 w-3' : 'bg-white/40'
                        }`}
                      />
                    ))}
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
                  <div className="text-[11px] font-bold text-zinc-200">1.842 curtidas</div>

                  {/* Legenda formatada */}
                  <div className="text-xs text-zinc-300 leading-relaxed">
                    <span className="font-bold text-white mr-1.5">{accountHandle}</span>
                    <span>{defaultCopy}</span>
                  </div>
                  <div className="text-[10px] text-zinc-500 pt-1 cursor-pointer hover:underline">
                    Ver todos os 64 comentários
                  </div>
                </div>
              </div>
            )}

            {/* REELS 9:16 VERTICAL PHONE MOCKUP */}
            {formatoNorm === 'reels' && (
              <div className="w-full max-w-[340px] aspect-[9/16] bg-zinc-950 border-4 border-zinc-800 rounded-[32px] overflow-hidden shadow-2xl relative flex flex-col justify-between p-4 select-none">
                {/* Notch / Speaker Simulator */}
                <div className="absolute top-2 left-1/2 -translate-x-1/2 w-20 h-4 bg-zinc-900 rounded-full z-30" />

                {/* Background Video Poster / Gradient */}
                <div
                  className="absolute inset-0 bg-cover bg-center z-0"
                  style={{
                    backgroundImage: creative.imageUrl || creative.thumbUrl
                      ? `linear-gradient(180deg, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.1) 40%, rgba(0,0,0,0.85) 100%), url(${creative.imageUrl || creative.thumbUrl})`
                      : 'linear-gradient(180deg, #1e1b4b 0%, #0f172a 60%, #020617 100%)',
                  }}
                >
                  {/* Central Play/Pause Action */}
                  <div
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="w-full h-full flex flex-col items-center justify-center cursor-pointer group"
                  >
                    <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-md border border-white/40 flex items-center justify-center text-white shadow-2xl group-hover:scale-110 transition-transform">
                      {isPlaying ? <Pause className="w-7 h-7" /> : <Play className="w-7 h-7 ml-1" />}
                    </div>
                    <span className="mt-3 px-3 py-1 rounded-full text-[10px] font-bold bg-black/60 text-white backdrop-blur-sm border border-white/20">
                      {isPlaying ? '▶️ Vídeo em Reprodução' : '▶️ Clique para Reproduzir Vídeo Real'}
                    </span>
                  </div>
                </div>

                {/* Top Reels Bar */}
                <div className="relative z-20 flex items-center justify-between pt-3 text-white">
                  <span className="text-sm font-bold flex items-center gap-1.5">
                    <Flame className="w-4 h-4 text-orange-400" /> Reels
                  </span>
                  <button
                    onClick={() => setIsMuted(!isMuted)}
                    className="p-1.5 rounded-full bg-black/40 backdrop-blur-sm hover:bg-black/60 transition-colors"
                  >
                    {isMuted ? <VolumeX className="w-4 h-4 text-zinc-300" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
                  </button>
                </div>

                {/* Sidebar Right Actions */}
                <div className="absolute right-3 bottom-24 z-20 flex flex-col items-center gap-4 text-white text-xs">
                  <button
                    onClick={() => setLiked(!liked)}
                    className="flex flex-col items-center gap-1 group"
                  >
                    <div className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Heart className={`w-5 h-5 ${liked ? 'text-red-500 fill-red-500' : 'text-white'}`} />
                    </div>
                    <span className="text-[10px] font-bold">1.4K</span>
                  </button>

                  <button className="flex flex-col items-center gap-1 group">
                    <div className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center group-hover:scale-110 transition-transform">
                      <MessageCircle className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-[10px] font-bold">84</span>
                  </button>

                  <button className="flex flex-col items-center gap-1 group">
                    <div className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Share2 className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-[10px] font-bold">Compart.</span>
                  </button>

                  <button
                    onClick={() => setSaved(!saved)}
                    className="flex flex-col items-center gap-1 group"
                  >
                    <div className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Bookmark className={`w-5 h-5 ${saved ? 'text-amber-400 fill-amber-400' : 'text-white'}`} />
                    </div>
                  </button>
                </div>

                {/* Bottom Overlay Info & CTA */}
                <div className="relative z-20 space-y-2.5 max-w-[80%]">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-cyan-500 flex items-center justify-center text-xs font-bold text-white shadow">
                      {creative.accountAvatar || '🏢'}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white">{accountHandle}</div>
                      <span className="text-[10px] text-zinc-300">Patrocinado</span>
                    </div>
                  </div>

                  <p className="text-xs text-white leading-snug font-medium line-clamp-2 drop-shadow">
                    {defaultHeadline}
                  </p>

                  <button
                    onClick={handleOpenCTA}
                    className="w-full py-2 px-3 rounded-lg bg-emerald-500 hover:bg-emerald-400 font-bold text-xs text-slate-950 flex items-center justify-center gap-1.5 shadow-xl transition-all"
                  >
                    <span>{defaultCta}</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </div>
              </div>
            )}

            {/* ESTÁTICO 1:1 IMAGE MOCKUP */}
            {formatoNorm === 'image' && (
              <div className="w-full max-w-[420px] bg-[#121212] border border-white/10 rounded-xl overflow-hidden shadow-2xl text-white font-sans">
                {/* Header Instagram */}
                <div className="flex items-center justify-between p-3 border-b border-white/5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-600 flex items-center justify-center text-sm font-bold shadow">
                      {creative.accountAvatar || '💎'}
                    </div>
                    <div>
                      <div className="text-xs font-bold leading-tight hover:underline cursor-pointer">{accountHandle}</div>
                      <div className="text-[10px] text-zinc-400 flex items-center gap-1">
                        Patrocinado • <span>🌐</span>
                      </div>
                    </div>
                  </div>
                  <span className="text-zinc-400 text-xs font-mono tracking-widest cursor-pointer hover:text-white">•••</span>
                </div>

                {/* Imagem 1:1 Feed com Overlay de Oferta */}
                <div
                  className="relative aspect-square w-full overflow-hidden bg-cover bg-center flex flex-col justify-end p-6 select-none"
                  style={{
                    backgroundImage: creative.imageUrl || creative.thumbUrl
                      ? `linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.1) 60%), url(${creative.imageUrl || creative.thumbUrl})`
                      : 'linear-gradient(135deg, #065f46, #047857)',
                  }}
                >
                  <div className="space-y-2 relative z-10">
                    <span className="inline-block px-3 py-1 rounded-lg text-xs font-black bg-emerald-500 text-slate-950 shadow-lg">
                      {creative.offerBadge || 'CONDIÇÃO ESPECIAL DE LANÇAMENTO'}
                    </span>
                    <h4 className="text-xl font-black text-white leading-tight drop-shadow-md">
                      {creative.imageTitle || defaultHeadline}
                    </h4>
                    <p className="text-xs text-white/90 leading-snug drop-shadow">
                      {creative.imageDesc || 'Condição exclusiva direto com a incorporadora via atendimento digital.'}
                    </p>
                  </div>
                </div>

                {/* Botão de Ação CTA Oficial Meta */}
                <div className="p-3 bg-zinc-900 border-t border-b border-white/5">
                  <button
                    onClick={handleOpenCTA}
                    className="w-full py-2.5 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-500 font-bold text-xs text-white flex items-center justify-center gap-2 shadow-lg transition-all active:scale-[0.98]"
                  >
                    <span>{defaultCta}</span>
                    <ExternalLink className="w-3.5 h-3.5 opacity-80" />
                  </button>
                </div>

                {/* Barra de Engajamento */}
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
                  <div className="text-[11px] font-bold text-zinc-200">920 curtidas</div>
                  <div className="text-xs text-zinc-300 leading-relaxed">
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
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    ● {creative.status || 'Ativo no Meta Ads'}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">
                    CTR: <b className="text-white">{creative.ctr || '2.84%'}</b>
                  </span>
                </div>
              </div>

              {/* Grid de KPIs do Criativo */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 space-y-1">
                  <span className="text-[10px] text-slate-400 flex items-center gap-1">
                    <BarChart3 className="w-3 h-3 text-cyan-400" /> Gasto Acumulado
                  </span>
                  <div className="text-sm font-black text-white font-mono">{formatBRL(creative.gasto || 980)}</div>
                </div>

                <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 space-y-1">
                  <span className="text-[10px] text-slate-400 flex items-center gap-1">
                    <Flame className="w-3 h-3 text-emerald-400" /> Conversas / Leads
                  </span>
                  <div className="text-sm font-black text-cyan-300 font-mono">
                    {creative.leads || creative.conversas || 28} contatos
                  </div>
                </div>

                <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 space-y-1">
                  <span className="text-[10px] text-slate-400">Custo por Contato</span>
                  <div className="text-sm font-black text-emerald-400 font-mono">
                    {formatBRL(creative.cpl || (creative.gasto && creative.leads ? creative.gasto / creative.leads : 35.0))}
                  </div>
                </div>

                <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 space-y-1">
                  <span className="text-[10px] text-slate-400">Taxa de Cliques (CTR)</span>
                  <div className="text-sm font-black text-amber-300 font-mono">{creative.ctr || '2.84%'}</div>
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
                <div className="flex items-center justify-between text-slate-400">
                  <span>Público Alvo:</span>
                  <span className="font-semibold text-slate-200">Segmentado (Geo + Interesses)</span>
                </div>
              </div>

              {/* Headline & Copy Text Box */}
              <div className="p-3 bg-slate-950/40 rounded-xl border border-slate-800/80 space-y-1.5">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Headline Utilizada
                </div>
                <div className="text-xs text-slate-200 font-medium italic">"{defaultHeadline}"</div>
              </div>
            </div>

            {/* Ações Inferiores */}
            <div className="pt-4 border-t border-slate-800 space-y-2">
              <button
                onClick={handleOpenCTA}
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 font-bold text-xs text-slate-950 flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/10 transition-all"
              >
                <span>Testar Fluxo no WhatsApp Oficial</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>

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
