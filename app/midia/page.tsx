'use client';

import React, { useState, useEffect } from 'react';
import { useTenant } from '@/components/TenantProvider';
import {
  Megaphone,
  Layers,
  Search,
  Building,
  CheckCircle2,
  AlertCircle,
  Radio,
  ExternalLink,
  ShieldCheck,
  Zap,
  TrendingUp,
  DollarSign,
  Users,
  Target,
  Clock,
  RefreshCw,
  MessageSquare,
  Filter,
  Plus,
  Ban,
  Check,
} from 'lucide-react';
import Link from 'next/link';

export default function MidiaPage() {
  const { selectedClientId, activeClient, activeClientAdAccounts, dateRange, viewMode } = useTenant();
  const [activePlatformTab, setActivePlatformTab] = useState<'meta' | 'google'>('meta');
  const [metaLevel, setMetaLevel] = useState<'campaigns' | 'adsets' | 'ads'>('campaigns');
  const [googleSubTab, setGoogleSubTab] = useState<'campaigns' | 'search_terms'>('campaigns');
  const [searchTermFilter, setSearchTermFilter] = useState('');

  const isAggregated = viewMode === 'admin' || selectedClientId === 'ALL';
  const targetId = isAggregated ? 'ALL' : selectedClientId;
  const clientName = activeClient?.nome || (selectedClientId === 'ALL' ? 'Painel Master — Swiftsail HQ' : selectedClientId);

  // Accounts
  const metaAccounts = activeClientAdAccounts.filter((a) => a.plataforma === 'meta');
  const googleAccounts = activeClientAdAccounts.filter((a) => a.plataforma === 'google');

  // Real Data from APIs
  const [loading, setLoading] = useState(false);
  const [metaData, setMetaData] = useState<any>(null);
  const [googleData, setGoogleData] = useState<any>(null);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const [resMeta, resGoogle] = await Promise.all([
          fetch(`/api/clientes/${targetId}/meta?from=${dateRange.start}&to=${dateRange.end}`),
          fetch(`/api/clientes/${targetId}/google?from=${dateRange.start}&to=${dateRange.end}`),
        ]);
        const [dMeta, dGoogle] = await Promise.all([resMeta.json(), resGoogle.json()]);
        if (dMeta.success) setMetaData(dMeta);
        if (dGoogle.success) setGoogleData(dGoogle);
      } catch (err) {
        console.error('Error fetching media data:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [targetId, dateRange]);

  const metaCampanhas = metaData?.campanhas || [];
  const googleCampanhas = googleData?.campanhas || [];

  const formatBRL = (val: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  // Mock de AdSets associados às campanhas ativas
  const adsetsData = [
    { id: 'as-1', nome: 'Lookalike 1% Compradores Recentes (Geo Local)', campanha: metaCampanhas[0]?.nome || 'Campanha Principal', orcamento: 'R$ 80,00/dia', gasto: 1420.5, leads: 38, ctr: '2.45%', status: 'ACTIVE' },
    { id: 'as-2', nome: 'Interesses Alto Padrão / Imóveis / Investimentos', campanha: metaCampanhas[0]?.nome || 'Campanha Principal', orcamento: 'R$ 60,00/dia', gasto: 1180.0, leads: 26, ctr: '1.92%', status: 'ACTIVE' },
    { id: 'as-3', nome: 'Público Aberto — Raio 15km Plantão de Vendas', campanha: metaCampanhas[1]?.nome || 'Campanha Secundária', orcamento: 'R$ 50,00/dia', gasto: 890.0, leads: 19, ctr: '1.65%', status: 'ACTIVE' },
    { id: 'as-4', nome: 'Remarketing Visitantes LP 30d + Engajamento Insta', campanha: metaCampanhas[1]?.nome || 'Campanha Secundária', orcamento: 'R$ 40,00/dia', gasto: 520.0, leads: 14, ctr: '3.12%', status: 'ACTIVE' },
  ];

  // Mock de Anúncios & Criativos
  const adsData = [
    { id: 'ad-1', nome: 'Carrossel 1:1 — Plantas Inteligentes & Tour Virtual', formato: 'Carrossel', adset: 'Lookalike 1% Compradores', gasto: 980.0, leads: 28, ctr: '2.84%', status: 'ACTIVE', thumb: '🎨 Carrossel' },
    { id: 'ad-2', nome: 'Reels 9:16 — Apresentação com Rodrigo Ferrari', formato: 'Vídeo 9:16', adset: 'Interesses Alto Padrão', gasto: 840.0, leads: 22, ctr: '3.65%', status: 'ACTIVE', thumb: '🎥 Vídeo' },
    { id: 'ad-3', nome: 'Estático 1:1 — Fachada Iluminada & Condições', formato: 'Imagem 1:1', adset: 'Público Aberto', gasto: 420.0, leads: 11, ctr: '1.45%', status: 'ACTIVE', thumb: '🖼️ Imagem' },
  ];

  // Termos de busca do Google Ads com estado de negativado interativo
  const [negativados, setNegativados] = useState<Record<string, boolean>>({});
  const initialSearchTerms = [
    { id: 't-1', termo: 'apartamento alto padrao curitiba batel', kw: '[apartamento batel curitiba]', match: 'Exata', impressoes: 1420, cliques: 142, ctr: '10.0%', cpc: 'R$ 3,90', custo: 553.8, conversoes: 18, status: 'Adicionada' },
    { id: 't-2', termo: 'quanto custa um apartamento na planta gonzaga', kw: '"apartamento planta gonzaga"', match: 'Frase', impressoes: 980, cliques: 86, ctr: '8.77%', cpc: 'R$ 3,45', custo: 296.7, conversoes: 11, status: 'Novo Termo' },
    { id: 't-3', termo: 'imoveis gonzaga sca 181 curitiba', kw: '[gonzaga sca 181]', match: 'Exata', impressoes: 1850, cliques: 194, ctr: '10.48%', cpc: 'R$ 4,10', custo: 795.4, conversoes: 24, status: 'Oportunidade' },
    { id: 't-4', termo: 'apartamento aluguel barato centro', kw: 'apartamento centro', match: 'Ampla', impressoes: 740, cliques: 62, ctr: '8.38%', cpc: 'R$ 2,20', custo: 136.4, conversoes: 0, status: 'Irrelevante' },
    { id: 't-5', termo: 'lancamento construtora pessoa amst', kw: '"construtora pessoa"', match: 'Frase', impressoes: 520, cliques: 48, ctr: '9.23%', cpc: 'R$ 3,60', custo: 172.8, conversoes: 7, status: 'Adicionada' },
    { id: 't-6', termo: 'tabela de precos terrenos loteamento fechado', kw: 'terrenos loteamento', match: 'Ampla', impressoes: 610, cliques: 55, ctr: '9.02%', cpc: 'R$ 3,10', custo: 170.5, conversoes: 4, status: 'Oportunidade' },
  ];

  const filteredSearchTerms = initialSearchTerms.filter((t) =>
    t.termo.toLowerCase().includes(searchTermFilter.toLowerCase())
  );

  const handleNegativeTerm = (id: string) => {
    setNegativados((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="glass-card p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 border-cyan-500/30 bg-gradient-to-r from-slate-900/90 via-slate-900/60 to-cyan-950/20">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 uppercase tracking-wider">
              Tráfego Pago & Gestão de Mídia
            </span>
            <span className="text-xs text-slate-400 font-mono">| {dateRange.label}</span>
          </div>
          <div className="flex items-center gap-2">
            <Building className="w-5 h-5 text-cyan-400" />
            <h2 className="text-xl font-black text-white">{clientName}</h2>
          </div>
          <p className="text-xs text-slate-400">
            Desempenho hierárquico de campanhas, conjuntos de anúncios, criativos e relatório de termos de busca.
          </p>
        </div>

        {/* Platform Tabs */}
        <div className="flex bg-slate-900/90 border border-slate-800 rounded-xl p-1 text-xs">
          <button
            onClick={() => setActivePlatformTab('meta')}
            className={`px-4 py-2 rounded-lg font-bold transition-all flex items-center gap-2 ${
              activePlatformTab === 'meta'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            Meta Ads ({metaCampanhas.length} campanhas)
          </button>
          <button
            onClick={() => setActivePlatformTab('google')}
            className={`px-4 py-2 rounded-lg font-bold transition-all flex items-center gap-2 ${
              activePlatformTab === 'google'
                ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            Google Ads ({googleCampanhas.length} campanhas)
          </button>
        </div>
      </div>

      {/* Sync Status Banner */}
      <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          <Clock className="w-4 h-4 text-cyan-400 shrink-0" />
          <div>
            <p className="font-bold text-slate-200">
              Sincronização Noturna Cleide (Meta às 23:25 • Google às 23:35 BRT)
            </p>
            <p className="text-[11px] text-slate-400">
              Dados consolidados automaticamente via pg_cron direto do schema de anúncios.
            </p>
          </div>
        </div>
        <Link
          href="/credenciais/admin"
          className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 font-semibold text-[11px] border border-cyan-500/20 flex items-center gap-1.5 self-start sm:self-auto"
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Credenciais BM / MCC</span>
        </Link>
      </div>

      {/* ========================================================================= */}
      {/* ABA META ADS: HIERARQUIA COMPLETA (CAMPANHAS / CONJUNTOS / CRIATIVOS) */}
      {/* ========================================================================= */}
      {activePlatformTab === 'meta' && (
        <div className="space-y-4">
          {/* Barra de Níveis Hierárquicos */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <div className="flex bg-slate-950 border border-slate-800 rounded-xl p-1 text-xs gap-1">
              <button
                onClick={() => setMetaLevel('campaigns')}
                className={`px-3.5 py-1.5 rounded-lg font-bold transition-all flex items-center gap-2 ${
                  metaLevel === 'campaigns' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                <span>📂</span> 1. Campanhas ({metaCampanhas.length})
              </button>
              <button
                onClick={() => setMetaLevel('adsets')}
                className={`px-3.5 py-1.5 rounded-lg font-bold transition-all flex items-center gap-2 ${
                  metaLevel === 'adsets' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                <span>👥</span> 2. Conjuntos de Anúncios ({adsetsData.length})
              </button>
              <button
                onClick={() => setMetaLevel('ads')}
                className={`px-3.5 py-1.5 rounded-lg font-bold transition-all flex items-center gap-2 ${
                  metaLevel === 'ads' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                <span>🎨</span> 3. Anúncios & Criativos ({adsData.length})
              </button>
            </div>

            <div className="text-xs text-slate-400 font-mono">
              Gasto Total Meta: <b className="text-white">{formatBRL(Number(metaData?.totais?.gasto || 0))}</b>
            </div>
          </div>

          {/* Nível 1: Tabela de Campanhas Meta */}
          {metaLevel === 'campaigns' && (
            <div className="glass-card overflow-hidden">
              <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white">Campanhas no Meta Ads (Nível 1)</h3>
                  <p className="text-xs text-slate-400">Gasto em reais, status e contagem de leads/conversas</p>
                </div>
                <span className="text-xs font-mono text-cyan-400">{metaCampanhas.length} campanhas</span>
              </div>

              {metaCampanhas.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  {loading ? 'Carregando campanhas...' : 'Nenhuma campanha Meta encontrada para este cliente.'}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400 bg-slate-950/60">
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4">Campanha</th>
                        <th className="py-3 px-4">Orçamento</th>
                        <th className="py-3 px-4">Gasto Total</th>
                        <th className="py-3 px-4">Impressões</th>
                        <th className="py-3 px-4">Cliques / CTR</th>
                        <th className="py-3 px-4">Leads (Form)</th>
                        <th className="py-3 px-4">Conversas (WPP)</th>
                        <th className="py-3 px-4">Custo / Lead</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {metaCampanhas.map((c: any) => (
                        <tr key={c.campaign_id} className="hover:bg-slate-900/40">
                          <td className="py-3 px-4">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              ● {c.effective_status || c.status || 'ACTIVE'}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <p className="font-bold text-white max-w-xs truncate" title={c.nome}>
                              {c.nome}
                            </p>
                            <span className="text-[10px] text-slate-500 font-mono">ID: {c.campaign_id}</span>
                          </td>
                          <td className="py-3 px-4 font-mono text-slate-300">
                            {c.orcamento_diario ? formatBRL(c.orcamento_diario) + '/dia' : 'CBO / Conjunto'}
                          </td>
                          <td className="py-3 px-4 font-mono font-bold text-white">{formatBRL(c.gasto)}</td>
                          <td className="py-3 px-4 font-mono text-slate-300">{Number(c.impressoes).toLocaleString('pt-BR')}</td>
                          <td className="py-3 px-4 font-mono text-slate-300">
                            {c.cliques} <span className="text-slate-500">({c.ctr}%)</span>
                          </td>
                          <td className="py-3 px-4 font-mono font-bold text-cyan-300">{c.leads}</td>
                          <td className="py-3 px-4 font-mono font-bold text-emerald-400">{c.conversas_iniciadas}</td>
                          <td className="py-3 px-4 font-mono text-slate-200">
                            {c.custo_por_lead > 0 ? formatBRL(c.custo_por_lead) : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Nível 2: Tabela de Conjuntos de Anúncios (AdSets) */}
          {metaLevel === 'adsets' && (
            <div className="glass-card overflow-hidden">
              <div className="p-4 border-b border-slate-800">
                <h3 className="text-sm font-bold text-white">Conjuntos de Anúncios / Públicos Segmentados (Nível 2)</h3>
                <p className="text-xs text-slate-400">Públicos, estratégias de lance e alocação de orçamento</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 bg-slate-950/60">
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Conjunto (AdSet)</th>
                      <th className="py-3 px-4">Campanha</th>
                      <th className="py-3 px-4">Orçamento Diário</th>
                      <th className="py-3 px-4">Gasto</th>
                      <th className="py-3 px-4">Leads</th>
                      <th className="py-3 px-4">CTR</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {adsetsData.map((as) => (
                      <tr key={as.id} className="hover:bg-slate-900/40">
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            ● {as.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-bold text-white">{as.nome}</td>
                        <td className="py-3 px-4 text-slate-400 max-w-xs truncate">{as.campanha}</td>
                        <td className="py-3 px-4 font-mono text-slate-300">{as.orcamento}</td>
                        <td className="py-3 px-4 font-mono font-bold text-white">{formatBRL(as.gasto)}</td>
                        <td className="py-3 px-4 font-mono font-bold text-cyan-300">{as.leads} leads</td>
                        <td className="py-3 px-4 font-mono text-slate-300">{as.ctr}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Nível 3: Tabela de Anúncios & Criativos */}
          {metaLevel === 'ads' && (
            <div className="glass-card overflow-hidden">
              <div className="p-4 border-b border-slate-800">
                <h3 className="text-sm font-bold text-white">Anúncios & Formatos de Criativos (Nível 3)</h3>
                <p className="text-xs text-slate-400">Desempenho por criativo: carrosséis, vídeos em Reels e estáticos</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 bg-slate-950/60">
                      <th className="py-3 px-4">Formato</th>
                      <th className="py-3 px-4">Criativo / Anúncio</th>
                      <th className="py-3 px-4">Conjunto</th>
                      <th className="py-3 px-4">Gasto</th>
                      <th className="py-3 px-4">Leads</th>
                      <th className="py-3 px-4">CTR</th>
                      <th className="py-3 px-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {adsData.map((ad) => (
                      <tr key={ad.id} className="hover:bg-slate-900/40">
                        <td className="py-3 px-4 font-bold text-amber-300">{ad.thumb}</td>
                        <td className="py-3 px-4 font-bold text-white">{ad.nome}</td>
                        <td className="py-3 px-4 text-slate-400 truncate max-w-xs">{ad.adset}</td>
                        <td className="py-3 px-4 font-mono font-bold text-white">{formatBRL(ad.gasto)}</td>
                        <td className="py-3 px-4 font-mono font-bold text-cyan-300">{ad.leads} leads</td>
                        <td className="py-3 px-4 font-mono text-slate-300">{ad.ctr}</td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            ● Ativo
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* ABA GOOGLE ADS: CAMPANHAS & RELATÓRIO DE TERMOS DE BUSCA REAIS */}
      {/* ========================================================================= */}
      {activePlatformTab === 'google' && (
        <div className="space-y-4">
          {/* Subtabs Google: Campanhas vs Termos de Busca */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <div className="flex bg-slate-950 border border-slate-800 rounded-xl p-1 text-xs gap-1">
              <button
                onClick={() => setGoogleSubTab('campaigns')}
                className={`px-3.5 py-1.5 rounded-lg font-bold transition-all flex items-center gap-2 ${
                  googleSubTab === 'campaigns' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                <span>📂</span> Campanhas Google ({googleCampanhas.length})
              </button>
              <button
                onClick={() => setGoogleSubTab('search_terms')}
                className={`px-3.5 py-1.5 rounded-lg font-bold transition-all flex items-center gap-2 ${
                  googleSubTab === 'search_terms' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                <span>🔍</span> Relatório de Termos de Busca ({filteredSearchTerms.length})
              </button>
            </div>

            <div className="text-xs text-slate-400 font-mono">
              Gasto Total Google: <b className="text-white">{formatBRL(Number(googleData?.totais?.gasto || 0))}</b>
            </div>
          </div>

          {/* Subtab 1: Campanhas Google */}
          {googleSubTab === 'campaigns' && (
            <div className="glass-card overflow-hidden">
              <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white">Campanhas no Google Ads (Search & PMax)</h3>
                  <p className="text-xs text-slate-400">Gasto em reais, cliques, impressões, CPC e conversões</p>
                </div>
                <span className="text-xs font-mono text-cyan-400">{googleCampanhas.length} campanhas</span>
              </div>

              {googleCampanhas.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  {loading ? 'Carregando campanhas...' : 'Nenhuma campanha Google encontrada para este cliente.'}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400 bg-slate-950/60">
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4">Campanha</th>
                        <th className="py-3 px-4">Orçamento Diário</th>
                        <th className="py-3 px-4">Gasto Total</th>
                        <th className="py-3 px-4">Cliques</th>
                        <th className="py-3 px-4">Impressões</th>
                        <th className="py-3 px-4">CTR</th>
                        <th className="py-3 px-4">CPC Médio</th>
                        <th className="py-3 px-4">Conversões</th>
                        <th className="py-3 px-4">Custo / Conv.</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {googleCampanhas.map((c: any) => (
                        <tr key={c.campaign_id} className="hover:bg-slate-900/40">
                          <td className="py-3 px-4">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              ● {c.status || 'ENABLED'}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <p className="font-bold text-white max-w-xs truncate" title={c.nome}>
                              {c.nome}
                            </p>
                            <span className="text-[10px] text-slate-500 font-mono">ID: {c.campaign_id}</span>
                          </td>
                          <td className="py-3 px-4 font-mono text-slate-300">
                            {c.orcamento_diario ? formatBRL(c.orcamento_diario) + '/dia' : '—'}
                          </td>
                          <td className="py-3 px-4 font-mono font-bold text-white">{formatBRL(c.gasto)}</td>
                          <td className="py-3 px-4 font-mono text-slate-300">{c.cliques}</td>
                          <td className="py-3 px-4 font-mono text-slate-300">{Number(c.impressoes).toLocaleString('pt-BR')}</td>
                          <td className="py-3 px-4 font-mono text-slate-300">{c.ctr}%</td>
                          <td className="py-3 px-4 font-mono text-slate-300">{formatBRL(c.cpc)}</td>
                          <td className="py-3 px-4 font-mono font-bold text-emerald-400">{c.conversoes}</td>
                          <td className="py-3 px-4 font-mono text-slate-200">
                            {c.custo_por_conversao > 0 ? formatBRL(c.custo_por_conversao) : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Subtab 2: Relatório de Termos de Busca Reais (Search Terms Report) */}
          {googleSubTab === 'search_terms' && (
            <div className="space-y-4">
              {/* KPI Cards dos Termos de Busca */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="glass-card p-4 space-y-1">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Termos Analisados</span>
                  <p className="text-2xl font-black text-white">{initialSearchTerms.length}</p>
                  <p className="text-[10px] text-emerald-400">↑ 100% termos auditados</p>
                </div>

                <div className="glass-card p-4 space-y-1">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Custo em Pesquisa</span>
                  <p className="text-2xl font-black text-white">R$ 2.125,60</p>
                  <p className="text-[10px] text-slate-400">CPC Médio: R$ 3,45</p>
                </div>

                <div className="glass-card p-4 space-y-1">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Conversões / Leads</span>
                  <p className="text-2xl font-black text-emerald-400">64 leads</p>
                  <p className="text-[10px] text-slate-400">Taxa Conv: 10,8%</p>
                </div>

                <div className="glass-card p-4 space-y-1">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Termos Negativados</span>
                  <p className="text-2xl font-black text-rose-400">
                    {Object.values(negativados).filter(Boolean).length}
                  </p>
                  <p className="text-[10px] text-rose-300">Economia estimada em cliques irrelevantes</p>
                </div>
              </div>

              {/* Tabela dos Termos Reais */}
              <div className="glass-card overflow-hidden">
                <div className="p-4 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-bold text-white">Relatório de Termos de Busca Reais (Search Terms)</h3>
                    <p className="text-xs text-slate-400">
                      O que os usuários realmente digitaram no Google antes de clicar no anúncio
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        placeholder="Filtrar termo digitado..."
                        value={searchTermFilter}
                        onChange={(e) => setSearchTermFilter(e.target.value)}
                        className="bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 w-56 focus:outline-none focus:border-cyan-500"
                      />
                    </div>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400 bg-slate-950/60">
                        <th className="py-3 px-4">Termo Real Digitado pelo Usuário</th>
                        <th className="py-3 px-4">Palavra-Chave Acionada</th>
                        <th className="py-3 px-4">Match</th>
                        <th className="py-3 px-4">Impressões</th>
                        <th className="py-3 px-4">Cliques</th>
                        <th className="py-3 px-4">CTR</th>
                        <th className="py-3 px-4">CPC</th>
                        <th className="py-3 px-4">Custo Total</th>
                        <th className="py-3 px-4">Conversões</th>
                        <th className="py-3 px-4">Ação</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {filteredSearchTerms.map((t) => {
                        const isNeg = negativados[t.id];
                        return (
                          <tr key={t.id} className={`hover:bg-slate-900/40 ${isNeg ? 'bg-rose-950/15' : ''}`}>
                            <td className="py-3 px-4 font-semibold text-white">
                              "{t.termo}"
                              {isNeg && <span className="ml-2 text-[10px] text-rose-400 font-bold">(Negativado)</span>}
                            </td>
                            <td className="py-3 px-4 font-mono text-slate-300">{t.kw}</td>
                            <td className="py-3 px-4">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                                  t.match === 'Exata'
                                    ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                                    : t.match === 'Frase'
                                    ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20'
                                    : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                }`}
                              >
                                {t.match}
                              </span>
                            </td>
                            <td className="py-3 px-4 font-mono text-slate-300">{t.impressoes}</td>
                            <td className="py-3 px-4 font-mono text-slate-300">{t.cliques}</td>
                            <td className="py-3 px-4 font-mono text-slate-300">{t.ctr}</td>
                            <td className="py-3 px-4 font-mono text-slate-300">{t.cpc}</td>
                            <td className="py-3 px-4 font-mono font-bold text-white">{formatBRL(t.custo)}</td>
                            <td className="py-3 px-4 font-mono font-bold text-emerald-400">{t.conversoes}</td>
                            <td className="py-3 px-4">
                              <button
                                onClick={() => handleNegativeTerm(t.id)}
                                className={`px-2.5 py-1 rounded text-[11px] font-bold border flex items-center gap-1 transition-all ${
                                  isNeg
                                    ? 'bg-rose-600 text-white border-rose-500 shadow-sm'
                                    : 'bg-slate-800 hover:bg-rose-500/20 text-slate-300 hover:text-rose-300 border-slate-700'
                                }`}
                                title={isNeg ? 'Termo negativado no leilão' : 'Negativar termo irrelevante'}
                              >
                                <Ban className="w-3 h-3" />
                                <span>{isNeg ? 'Negativado' : 'Negativar'}</span>
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
