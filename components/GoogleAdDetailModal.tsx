'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  ExternalLink,
  Copy,
  Check,
  Search,
  Globe,
  Radio,
  FileText,
  Smartphone,
  Link2,
} from 'lucide-react';

interface GoogleAdDetailModalProps {
  ad: any | null;
  onClose: () => void;
}

export default function GoogleAdDetailModal({ ad, onClose }: GoogleAdDetailModalProps) {
  const [copiedIndex, setCopiedIndex] = useState<string | null>(null);

  // Fechar com a tecla ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (ad) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [ad, onClose]);

  if (!ad) return null;

  const titulosList: string[] = Array.isArray(ad.titulos)
    ? ad.titulos
    : ad.titulos
    ? [ad.titulos]
    : [];

  const descList: string[] = Array.isArray(ad.descricoes)
    ? ad.descricoes
    : ad.descricoes
    ? [ad.descricoes]
    : [];

  const urlsFinais: string[] = Array.isArray(ad.urls_finais)
    ? ad.urls_finais
    : ad.urls_finais
    ? [ad.urls_finais]
    : [];

  const urlsMobile: string[] = Array.isArray(ad.urls_mobile)
    ? ad.urls_mobile
    : ad.urls_mobile
    ? [ad.urls_mobile]
    : [];

  const isEnabled = String(ad.status).toUpperCase() === 'ENABLED';

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(id);
    setTimeout(() => setCopiedIndex(null), 1800);
  };

  // Extrai domínio limpo da primeira URL final para simular o Google Search
  const getDisplayDomain = (url?: string) => {
    if (!url) return 'https://www.google.com';
    try {
      const parsed = new URL(url);
      return `${parsed.protocol}//${parsed.hostname}`;
    } catch {
      return url;
    }
  };

  const primaryUrl = urlsFinais[0] || '';
  const displayDomain = getDisplayDomain(primaryUrl);

  return (
    <div
      className="fixed inset-0 z-50 bg-[#0F172A]/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 select-none animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl border border-[#E2E8F0] shadow-2xl max-w-3xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150 font-sans"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-[#F1F5F9] flex items-start justify-between gap-3 bg-[#F8FAFC]">
          <div className="space-y-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#EFF4FF] text-[#0050FF] border border-[#BFDBFE] flex items-center gap-1">
                <span>📢</span> Google Ads
              </span>
              <span className="text-[10px] font-mono font-bold text-[#64748B] bg-white px-2 py-0.5 rounded border border-[#E2E8F0]">
                ID: {ad.ad_id}
              </span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold border inline-flex items-center gap-1 ${
                  isEnabled
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-slate-100 text-slate-600 border-slate-200'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${isEnabled ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                {isEnabled ? 'Ativo' : ad.status || 'Pausado'}
              </span>
              <span className="text-[10px] font-semibold text-[#0050FF] bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                {ad.tipo || 'RESPONSIVE_SEARCH_AD'}
              </span>
            </div>

            <h2 className="text-base sm:text-lg font-bold text-[#0F172A] truncate" title={ad.campanha_nome || ad.campanha}>
              {ad.campanha_nome || ad.campanha || 'Campanha'}
            </h2>
            <p className="text-xs text-[#64748B] truncate">
              Grupo de Anúncios: <strong className="text-[#334155]">{ad.grupo_nome || ad.grupo || 'Grupo'}</strong>
            </p>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-white border border-[#E2E8F0] hover:bg-[#F1F5F9] text-[#64748B] hover:text-[#0F172A] flex items-center justify-center transition-all cursor-pointer shrink-0 shadow-xs"
            title="Fechar (ESC)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 select-text">
          {/* SIMULAÇÃO DE ANÚNCIO NO GOOGLE SEARCH */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[#0F172A] flex items-center gap-1.5">
                <Search className="w-3.5 h-3.5 text-[#0050FF]" />
                Prévia do Anúncio (Pesquisa Google)
              </span>
              <span className="text-[10px] text-[#64748B]">Simulação aproximada</span>
            </div>

            <div className="p-4 rounded-xl border border-[#E2E8F0] bg-white shadow-xs space-y-1.5">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-slate-100 border border-slate-300 flex items-center justify-center text-[9px] font-bold text-slate-700 shrink-0">
                  G
                </div>
                <div className="min-w-0 leading-tight">
                  <p className="text-[11px] text-[#202124] font-medium truncate">
                    {ad.campanha_nome || 'Anunciante'}
                  </p>
                  <p className="text-[11px] text-[#4d5156] font-mono truncate">
                    {displayDomain}
                  </p>
                </div>
              </div>

              {/* Título Estilo Google Search */}
              <h3 className="text-base sm:text-lg text-[#1a0dab] hover:underline font-medium leading-snug cursor-pointer pt-0.5">
                {titulosList.slice(0, 3).join(' | ') || 'Título do Anúncio'}
              </h3>

              {/* Descrição Estilo Google Search */}
              <p className="text-xs sm:text-sm text-[#4d5156] leading-relaxed">
                {descList.slice(0, 2).join(' ') || 'Descrição do anúncio cadastrada no Google Ads...'}
              </p>
            </div>
          </div>

          {/* SEÇÃO 1: TODOS OS TÍTULOS COMPLETOS */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[#0F172A] flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-[#0050FF]" />
                Todos os Títulos Cadastrados ({titulosList.length})
              </span>
              <span className="text-[10px] text-[#64748B]">Máx. 30 caracteres por título</span>
            </div>

            {titulosList.length === 0 ? (
              <p className="text-xs text-[#94A3B8] italic">Nenhum título cadastrado neste anúncio.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {titulosList.map((tit, index) => {
                  const id = `t-${index}`;
                  const isCopied = copiedIndex === id;
                  return (
                    <div
                      key={id}
                      className="p-3 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] hover:bg-white hover:border-[#BFDBFE] transition-all flex items-start justify-between gap-2 shadow-2xs group"
                    >
                      <div className="min-w-0 space-y-1">
                        <div className="flex items-center gap-1.5">
                          <span className="w-5 h-5 rounded-md bg-[#EFF4FF] border border-[#BFDBFE] text-[#0050FF] font-mono font-bold text-[10px] flex items-center justify-center shrink-0">
                            {index + 1}
                          </span>
                          <span className="text-[10px] text-[#64748B] font-mono">
                            {tit.length}/30 caracteres
                          </span>
                        </div>
                        <p className="text-xs font-semibold text-[#0F172A] leading-snug break-words">
                          {tit}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => copyToClipboard(tit, id)}
                        className="p-1.5 rounded-lg text-[#94A3B8] hover:text-[#0050FF] hover:bg-[#EFF4FF] transition-colors shrink-0 cursor-pointer"
                        title="Copiar título"
                      >
                        {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* SEÇÃO 2: TODAS AS DESCRIÇÕES COMPLETAS */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[#0F172A] flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-[#0050FF]" />
                Todas as Descrições Cadastradas ({descList.length})
              </span>
              <span className="text-[10px] text-[#64748B]">Máx. 90 caracteres por descrição</span>
            </div>

            {descList.length === 0 ? (
              <p className="text-xs text-[#94A3B8] italic">Nenhuma descrição cadastrada neste anúncio.</p>
            ) : (
              <div className="space-y-2">
                {descList.map((desc, index) => {
                  const id = `d-${index}`;
                  const isCopied = copiedIndex === id;
                  return (
                    <div
                      key={id}
                      className="p-3.5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] hover:bg-white hover:border-[#BFDBFE] transition-all flex items-start justify-between gap-3 shadow-2xs group"
                    >
                      <div className="min-w-0 space-y-1">
                        <div className="flex items-center gap-1.5">
                          <span className="w-5 h-5 rounded-md bg-purple-50 border border-purple-200 text-purple-700 font-mono font-bold text-[10px] flex items-center justify-center shrink-0">
                            {index + 1}
                          </span>
                          <span className="text-[10px] text-[#64748B] font-mono">
                            {desc.length}/90 caracteres
                          </span>
                        </div>
                        <p className="text-xs text-[#334155] leading-relaxed break-words font-medium">
                          {desc}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => copyToClipboard(desc, id)}
                        className="p-1.5 rounded-lg text-[#94A3B8] hover:text-[#0050FF] hover:bg-[#EFF4FF] transition-colors shrink-0 cursor-pointer"
                        title="Copiar descrição"
                      >
                        {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* SEÇÃO 3: DESTINOS (URLs FINAIS, MOBILE E RASTREAMENTO) */}
          <div className="space-y-2.5 pt-2 border-t border-[#F1F5F9]">
            <span className="text-xs font-bold uppercase tracking-wider text-[#0F172A] flex items-center gap-1.5">
              <Link2 className="w-3.5 h-3.5 text-[#0050FF]" />
              URLs de Destino & Rastreamento
            </span>

            <div className="space-y-2 text-xs">
              {/* URLs Finais */}
              <div className="p-3 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748B]">
                  URL Final de Destino (Desktop):
                </span>
                {urlsFinais.length === 0 ? (
                  <p className="text-xs text-[#94A3B8] font-mono">— Sem URL Final direta —</p>
                ) : (
                  <div className="space-y-1">
                    {urlsFinais.map((url, i) => (
                      <div key={i} className="flex items-center justify-between gap-2">
                        <a
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#0050FF] hover:underline font-mono text-[11px] truncate flex items-center gap-1"
                        >
                          <ExternalLink className="w-3 h-3 shrink-0" />
                          <span className="truncate">{url}</span>
                        </a>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(url, `url-${i}`)}
                          className="text-[10px] text-[#64748B] hover:text-[#0050FF] px-2 py-0.5 rounded bg-white border border-[#CBD5E1] shrink-0"
                        >
                          {copiedIndex === `url-${i}` ? 'Copiado!' : 'Copiar'}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* URLs Mobile */}
              {urlsMobile.length > 0 && (
                <div className="p-3 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] space-y-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748B] flex items-center gap-1">
                    <Smartphone className="w-3 h-3 text-[#0050FF]" /> URL Mobile Específica:
                  </span>
                  <div className="space-y-1">
                    {urlsMobile.map((url, i) => (
                      <div key={i} className="flex items-center justify-between gap-2">
                        <a
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#0050FF] hover:underline font-mono text-[11px] truncate flex items-center gap-1"
                        >
                          <ExternalLink className="w-3 h-3 shrink-0" />
                          <span className="truncate">{url}</span>
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tracking Template */}
              {ad.tracking_url_template && (
                <div className="p-3 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] space-y-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748B]">
                    Modelo de Rastreamento (Tracking Template):
                  </span>
                  <p className="font-mono text-[11px] text-[#334155] break-all bg-white p-2 rounded border border-[#E2E8F0]">
                    {ad.tracking_url_template}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-[#F1F5F9] bg-[#F8FAFC] flex items-center justify-between gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-white border border-[#E2E8F0] text-[#475569] hover:bg-[#F1F5F9] transition-all cursor-pointer shadow-xs"
          >
            Fechar
          </button>

          {primaryUrl && (
            <a
              href={primaryUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 rounded-xl text-xs font-bold bg-[#0050FF] hover:bg-[#0040D6] text-white flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
            >
              <span>Abrir URL de Destino</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
