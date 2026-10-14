'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
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
  Sparkles,
  Eye,
  BarChart3,
  ChevronDown,
  ChevronRight,
  CreditCard,
  Wallet,
  Link2,
} from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import CreativePreviewModal, { CreativePreviewItem } from '@/components/CreativePreviewModal';
import GoogleAdDetailModal from '@/components/GoogleAdDetailModal';
import LeadsDrilldownModal from '@/components/LeadsDrilldownModal';
import DateRangePicker from '@/components/DateRangePicker';

function MidiaContent() {
  const searchParams = useSearchParams();
  const { selectedClientId, activeClient, activeClientAdAccounts, dateRange, viewMode } = useTenant();
  const [activePlatformTab, setActivePlatformTab] = useState<'meta' | 'google'>('meta');
  const [metaLevel, setMetaLevel] = useState<'tree' | 'campaigns' | 'adsets' | 'ads'>('tree');
  const [metaObjectiveFilter, setMetaObjectiveFilter] = useState<'all' | 'messages' | 'forms' | 'conversions' | 'reach' | 'traffic'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'paused'>('all');
  const [googleSubTab, setGoogleSubTab] = useState<'campaigns' | 'anuncios' | 'grupos_recursos' | 'palavras_chave' | 'search_terms'>('campaigns');
  const [searchTermFilter, setSearchTermFilter] = useState('');
  const [adsSearchFilter, setAdsSearchFilter] = useState('');
  const [keywordsSearchFilter, setKeywordsSearchFilter] = useState('');
  const [assetGroupsSearchFilter, setAssetGroupsSearchFilter] = useState('');
  const [selectedCreativeModal, setSelectedCreativeModal] = useState<CreativePreviewItem | null>(null);
  const [selectedGoogleAdModal, setSelectedGoogleAdModal] = useState<any | null>(null);

  useEffect(() => {
    const plat = searchParams?.get('plataforma');
    const tab = searchParams?.get('tab');
    if (plat === 'meta' || plat === 'google') {
      setActivePlatformTab(plat);
    }
    if (tab === 'termos' || tab === 'search_terms') {
      setGoogleSubTab('search_terms');
    } else if (tab === 'anuncios') {
      setGoogleSubTab('anuncios');
    } else if (tab === 'recursos' || tab === 'grupos_recursos') {
      setGoogleSubTab('grupos_recursos');
    } else if (tab === 'palavras' || tab === 'palavras_chave') {
      setGoogleSubTab('palavras_chave');
    } else if (tab === 'campaigns') {
      setGoogleSubTab('campaigns');
    }
    if (tab === 'contas') {
      const elId = plat === 'google' ? 'faturamento-google-midia' : 'faturamento-meta-midia';
      setTimeout(() => {
        const el = document.getElementById(elId);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 150);
    }
  }, [searchParams]);
  const [leadsDrilldown, setLeadsDrilldown] = useState<{
    isOpen: boolean;
    title: string;
    type: 'form' | 'whatsapp';
    count: number;
    initialLeads?: any[];
  } | null>(null);

  const [expandedCampaigns, setExpandedCampaigns] = useState<Record<string, boolean>>({});
  const [expandedAdSets, setExpandedAdSets] = useState<Record<string, boolean>>({});

  const toggleCampaign = (id: string) => {
    setExpandedCampaigns((prev) => ({ ...prev, [id]: !prev[id] }));
  };
  const toggleAdSet = (id: string) => {
    setExpandedAdSets((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const isAggregated = selectedClientId === 'ALL';
  const targetId = selectedClientId;
  const clientName = activeClient?.nome || (selectedClientId === 'ALL' ? 'Painel Master — Swiftsail HQ' : selectedClientId);

  // Real Data from APIs
  const [loading, setLoading] = useState(false);
  const [metaData, setMetaData] = useState<any>(null);
  const [googleData, setGoogleData] = useState<any>(null);
  const [kommoData, setKommoData] = useState<any>(null);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const [resMeta, resGoogle, resKommo] = await Promise.all([
          fetch(`/api/clientes/${targetId}/meta?from=${dateRange.start}&to=${dateRange.end}`),
          fetch(`/api/clientes/${targetId}/google?from=${dateRange.start}&to=${dateRange.end}`),
          fetch(`/api/clientes/${targetId}/kommo?from=${dateRange.start}&to=${dateRange.end}`),
        ]);
        const [dMeta, dGoogle, dKommo] = await Promise.all([
          resMeta.json(),
          resGoogle.json(),
          resKommo.json(),
        ]);
        if (dMeta.success) setMetaData(dMeta);
        if (dGoogle.success) setGoogleData(dGoogle);
        if (dKommo.success) setKommoData(dKommo);
      } catch (err) {
        console.error('Error fetching media data:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [targetId, dateRange]);

  const metaCampanhas = metaData?.campanhas || [];
  const metaContas = (metaData?.contas && metaData.contas.length > 0)
    ? metaData.contas
    : activeClientAdAccounts.filter((a) => a.plataforma === 'meta');
  const googleCampanhas = googleData?.campanhas || [];
  const googleContas = (googleData?.contas && googleData.contas.length > 0)
    ? googleData.contas
    : activeClientAdAccounts.filter((a) => a.plataforma === 'google');
  const googleAnuncios = googleData?.anuncios || [];
  const googleGruposRecursos = googleData?.grupos_recursos || [];
  const googlePalavrasChave = googleData?.palavras_chave || [];

  const formatCartao = (digitos?: string | null) => {
    if (!digitos) return '—';
    return `•••• ${digitos}`;
  };

  const renderUrlsList = (urls: any, badgeText?: string) => {
    const list = Array.isArray(urls) ? urls : urls ? [urls] : [];
    if (list.length === 0) {
      return <span className="text-[#94A3B8] font-mono text-[11px]">—</span>;
    }
    return (
      <div className="flex flex-col gap-1 max-w-xs">
        {badgeText && (
          <span className="text-[9px] font-semibold text-[#0050FF] bg-[#EFF4FF] px-1.5 py-0.5 rounded border border-[#BFDBFE] w-fit">
            {badgeText}
          </span>
        )}
        {list.map((u: string, idx: number) => (
          <a
            key={idx}
            href={u}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#0050FF] hover:underline font-mono text-[11px] truncate flex items-center gap-1 group"
            title={u}
          >
            <span className="truncate">{u}</span>
            <ExternalLink className="w-3 h-3 shrink-0 opacity-70 group-hover:opacity-100" />
          </a>
        ))}
      </div>
    );
  };

  const formatBRL = (val: number | null | undefined) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(val) || 0);

  const openLeadsDrilldown = (
    title: string,
    type: 'form' | 'whatsapp',
    count: number,
    filterCriteria?: string | { criativo?: string; campanha?: string; conjunto?: string; filterTerm?: string }
  ) => {
    let initialLeads: any[] | undefined = undefined;
    if (kommoData?.leads_amostra && kommoData.leads_amostra.length > 0) {
      const normalize = (str?: string | null) =>
        (str || '')
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .toLowerCase()
          .trim();

      const options =
        typeof filterCriteria === 'string'
          ? { filterTerm: filterCriteria }
          : filterCriteria || {};

      const term = normalize(options.filterTerm || title);
      const optCamp = normalize(options.campanha);
      const optCriat = normalize(options.criativo);
      const optConj = normalize(options.conjunto);

      let filtered = kommoData.leads_amostra.filter((l: any) => {
        const lCamp = normalize(l.campanha);
        const lCriat = normalize(l.criativo);
        const lConj = normalize(l.conjunto);

        // Se especificou criativo exato
        if (optCriat && lCriat && (lCriat.includes(optCriat) || optCriat.includes(lCriat))) {
          return true;
        }
        // Se especificou conjunto exato
        if (optConj && lConj && (lConj.includes(optConj) || optConj.includes(lConj))) {
          return true;
        }
        // Se especificou campanha exata
        if (optCamp && lCamp && (lCamp.includes(optCamp) || optCamp.includes(lCamp))) {
          return true;
        }

        // Busca flexível pelo termo geral
        if (term) {
          if (lCriat && (lCriat.includes(term) || term.includes(lCriat))) return true;
          if (lCamp && (lCamp.includes(term) || term.includes(lCamp))) return true;
          if (lConj && (lConj.includes(term) || term.includes(lConj))) return true;
        }

        return false;
      });

      // Se a filtragem específica não retornou (ex: variações de UTM do criativo), tenta fallback por campanha
      if (filtered.length === 0 && optCamp) {
        filtered = kommoData.leads_amostra.filter((l: any) => {
          const lCamp = normalize(l.campanha);
          return lCamp && (lCamp.includes(optCamp) || optCamp.includes(lCamp));
        });
      }

      // Se ainda não encontrou e o termo geral falhou, usa a amostra do período do cliente
      const list = filtered.length > 0 ? filtered : kommoData.leads_amostra;

      initialLeads = list.map((l: any, i: number) => {
        const urlFinal =
          l.url_lead ||
          l.urlLead ||
          (l.conta && l.lead_id
            ? `https://${l.conta}.kommo.com/leads/detail/${l.lead_id}`
            : l.lead_id
            ? `https://kommo.com/leads/detail/${l.lead_id}`
            : null);

        return {
          id: String(l.lead_id || `l-${i}`),
          nome: l.nome || l.contato_principal_nome || 'Lead sem nome registrado',
          telefone: l.telefone || '',
          email: l.email || '',
          data: l.criado_em
            ? new Date(l.criado_em).toLocaleDateString('pt-BR') + ' às ' + new Date(l.criado_em).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
            : 'Data recente',
          anuncio: l.criativo || l.campanha || title,
          perguntas: `Origem: ${l.origem || 'Tráfego Pago'} • Etapa Comercial: ${l.etapa || 'Em atendimento'}`,
          statusCrm: l.etapa || 'Em atendimento',
          statusColor: (l.conta_como === 'ganho' || (l.etapa && l.etapa.toLowerCase().includes('ganh')))
            ? 'emerald'
            : (l.conta_como === 'perda' || (l.etapa && (l.etapa.toLowerCase().includes('perd') || l.etapa.toLowerCase().includes('desqual'))))
            ? 'rose'
            : 'cyan',
          pipelineNome: l.pipeline_nome || l.pipelineNome,
          etapaNome: l.etapa || l.etapaNome,
          valor: Number(l.valor || 0),
          origem: l.origem,
          campanha: l.campanha,
          urlLead: urlFinal,
          diasEstagnados: l.dias_estagnados !== null && l.dias_estagnados !== undefined ? Number(l.dias_estagnados) : null,
          responsavel: l.responsavel_nome || (l.responsavel_id ? `Responsável #${l.responsavel_id}` : null),
        };
      });
    }

    setLeadsDrilldown({
      isOpen: true,
      title,
      type,
      count,
      initialLeads,
    });
  };

  // Helper visual para exibição evidente de Status (ATIVO pulsante vs PAUSADO âmbar)
  const renderStatusBadge = (statusRaw?: string) => {
    const s = String(statusRaw || '').toUpperCase();
    const isPaused = s.includes('PAUS') || s.includes('PAUSED');
    const isArchived = s.includes('ARCHIV') || s.includes('DELETED') || s.includes('REMOVED');

    if (isPaused) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500/15 text-amber-300 border border-amber-500/40 shadow-sm shadow-amber-500/10">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
          PAUSADO
        </span>
      );
    }

    if (isArchived) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-slate-800 text-slate-400 border border-slate-700">
          <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
          ARQUIVADO
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/15 text-emerald-300 border border-emerald-500/40 shadow-sm shadow-emerald-500/10">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
        </span>
        ATIVO
      </span>
    );
  };

  // Mapeamento dinâmico de objetivo para cada campanha
  const getCampaignObjective = (camp: any): 'messages' | 'forms' | 'conversions' | 'reach' | 'traffic' => {
    const nome = (camp.nome || '').toLowerCase();
    const obj = (camp.objective || camp.objetivo || '').toLowerCase();
    if (obj.includes('msg') || obj.includes('message') || nome.includes('whats') || nome.includes('wpp') || nome.includes('msg') || camp.conversas_iniciadas > 0) {
      return 'messages';
    }
    if (obj.includes('lead') || nome.includes('form') || nome.includes('cadastro') || camp.leads > 0) {
      return 'forms';
    }
    if (obj.includes('conv') || obj.includes('sale') || nome.includes('venda') || nome.includes('site') || nome.includes('pixel')) {
      return 'conversions';
    }
    if (obj.includes('reach') || obj.includes('brand') || nome.includes('alcance') || nome.includes('reconhecimento') || nome.includes('video')) {
      return 'reach';
    }
    if (obj.includes('traffic') || nome.includes('trafego') || nome.includes('clique') || nome.includes('visita')) {
      return 'traffic';
    }
    return 'messages';
  };

  const objectiveConfigs = {
    all: {
      icon: '🌐',
      title: 'Visão Geral Multi-Objetivo (Métricas Consolidadas)',
      desc: 'Exibição completa de todas as campanhas com adaptação inteligente dos indicadores de retorno por objetivo.',
      border: 'border-blue-500/60',
      color: 'text-blue-400',
      badge: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      label: 'Multi-Objetivo',
    },
    messages: {
      icon: '💬',
      title: 'Modo: Campanhas de Mensagens & Leads (Click to WhatsApp)',
      desc: 'Métricas adaptadas para conversas iniciadas no WhatsApp, custo por conversa (CPMsg), taxa de início e agendamentos no CRM.',
      border: 'border-emerald-500/60',
      color: 'text-emerald-400',
      badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      label: '💬 Mensagens WPP',
    },
    forms: {
      icon: '📋',
      title: 'Modo: Formulários Nativos & Cadastros (Lead Ads)',
      desc: 'Métricas adaptadas para envio de formulário nativo Meta, Custo por Lead (CPL), taxa de preenchimento e qualificação no CRM.',
      border: 'border-cyan-500/60',
      color: 'text-cyan-400',
      badge: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
      label: '📋 Formulários Lead',
    },
    conversions: {
      icon: '🎯',
      title: 'Modo: Campanhas de Conversões & Vendas no Site (Pixel & ROAS)',
      desc: 'Métricas adaptadas para compras e agendamentos confirmados no site via Pixel/CAPI, Custo por Aquisição (CPA) e ROAS.',
      border: 'border-indigo-500/60',
      color: 'text-indigo-400',
      badge: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
      label: '🎯 Conversões Site',
    },
    reach: {
      icon: '📢',
      title: 'Modo: Campanhas de Reconhecimento & Alcance (Branding / Vídeo)',
      desc: 'Métricas adaptadas para alcance único de pessoas, frequência média de veiculação, CPM e visualizações de vídeo (ThruPlay).',
      border: 'border-amber-500/60',
      color: 'text-amber-400',
      badge: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
      label: '📢 Alcance & Vídeo',
    },
    traffic: {
      icon: '🌐',
      title: 'Modo: Campanhas de Tráfego & Visitas na Landing Page',
      desc: 'Métricas adaptadas para volume de cliques no link, CTR de saída, CPC médio e visualizações de página de destino (LPV).',
      border: 'border-teal-500/60',
      color: 'text-teal-400',
      badge: 'bg-teal-500/10 text-teal-400 border-teal-500/20',
      label: '🌐 Tráfego / Cliques',
    },
  };

  const currentObjConfig = objectiveConfigs[metaObjectiveFilter] || objectiveConfigs.all;

  // 1. Filtragem estrita por atividade no período selecionado (só o que rodou na data)
  const activePeriodMetaCampanhas = useMemo(() => {
    return metaCampanhas.filter((c: any) => {
      const g = Number(c.gasto || 0);
      const imp = Number(c.impressoes || 0);
      const clk = Number(c.cliques || 0);
      const l = Number(c.leads || 0);
      const conv = Number(c.conversas_iniciadas || 0);
      return g > 0 || imp > 0 || clk > 0 || l > 0 || conv > 0;
    });
  }, [metaCampanhas]);

  // 2. Filtragem de campanhas por objetivo e status (Ativo vs Pausado)
  const filteredMetaCampanhas = useMemo(() => {
    return activePeriodMetaCampanhas.filter((c: any) => {
      if (metaObjectiveFilter !== 'all' && getCampaignObjective(c) !== metaObjectiveFilter) {
        return false;
      }
      if (statusFilter !== 'all') {
        const s = String(c.effective_status || c.status || '').toUpperCase();
        const isPaused = s.includes('PAUS') || s.includes('PAUSED');
        if (statusFilter === 'active' && isPaused) return false;
        if (statusFilter === 'paused' && !isPaused) return false;
      }
      return true;
    });
  }, [activePeriodMetaCampanhas, metaObjectiveFilter, statusFilter]);

  // Filtragem de campanhas Google (atividade no período + status)
  const filteredGoogleCampanhas = useMemo(() => {
    return googleCampanhas.filter((c: any) => {
      const g = Number(c.gasto || 0);
      const imp = Number(c.impressoes || 0);
      const clk = Number(c.cliques || 0);
      const conv = Number(c.conversoes || 0);
      const hasActivity = g > 0 || imp > 0 || clk > 0 || conv > 0;
      if (!hasActivity) return false;

      if (statusFilter !== 'all') {
        const s = String(c.status || '').toUpperCase();
        const isPaused = s.includes('PAUS') || s.includes('PAUSED');
        if (statusFilter === 'active' && isPaused) return false;
        if (statusFilter === 'paused' && !isPaused) return false;
      }
      return true;
    });
  }, [googleCampanhas, statusFilter]);

  const filteredGoogleAnuncios = useMemo(() => {
    return googleAnuncios.filter((a: any) => {
      if (statusFilter !== 'all') {
        const s = String(a.status || '').toUpperCase();
        const isPaused = s.includes('PAUS');
        if (statusFilter === 'active' && isPaused) return false;
        if (statusFilter === 'paused' && !isPaused) return false;
      }
      if (!adsSearchFilter.trim()) return true;
      const term = adsSearchFilter.toLowerCase().trim();
      return (
        (a.campanha_nome || a.campanha || '').toLowerCase().includes(term) ||
        (a.grupo_nome || a.grupo || '').toLowerCase().includes(term) ||
        String(a.ad_id || '').includes(term) ||
        (Array.isArray(a.titulos) ? a.titulos.join(' ') : String(a.titulos || '')).toLowerCase().includes(term)
      );
    });
  }, [googleAnuncios, adsSearchFilter, statusFilter]);

  const filteredGoogleGruposRecursos = useMemo(() => {
    return googleGruposRecursos.filter((g: any) => {
      if (statusFilter !== 'all') {
        const s = String(g.status || '').toUpperCase();
        const isPaused = s.includes('PAUS');
        if (statusFilter === 'active' && isPaused) return false;
        if (statusFilter === 'paused' && !isPaused) return false;
      }
      if (!assetGroupsSearchFilter.trim()) return true;
      const term = assetGroupsSearchFilter.toLowerCase().trim();
      return (
        (g.nome || '').toLowerCase().includes(term) ||
        (g.campanha_nome || '').toLowerCase().includes(term) ||
        String(g.asset_group_id || '').includes(term)
      );
    });
  }, [googleGruposRecursos, assetGroupsSearchFilter, statusFilter]);

  const filteredGooglePalavrasChave = useMemo(() => {
    return googlePalavrasChave.filter((p: any) => {
      if (statusFilter !== 'all') {
        const s = String(p.status || '').toUpperCase();
        const isPaused = s.includes('PAUS');
        if (statusFilter === 'active' && isPaused) return false;
        if (statusFilter === 'paused' && !isPaused) return false;
      }
      if (!keywordsSearchFilter.trim()) return true;
      const term = keywordsSearchFilter.toLowerCase().trim();
      return (
        (p.texto || '').toLowerCase().includes(term) ||
        (p.campanha_nome || '').toLowerCase().includes(term) ||
        (p.grupo_nome || '').toLowerCase().includes(term)
      );
    });
  }, [googlePalavrasChave, keywordsSearchFilter, statusFilter]);

  // Geração hierárquica dinâmica 100% conectada às campanhas reais do Supabase
  const hierarchyData = useMemo(() => {
    if (!filteredMetaCampanhas || filteredMetaCampanhas.length === 0) return [];

    return filteredMetaCampanhas.map((c: any, cIdx: number) => {
      const campGasto = Number(c.gasto || 0);
      const campLeads = Number(c.leads || 0);
      const campConversas = Number(c.conversas_iniciadas || 0);
      const campCliques = Number(c.cliques || 0);
      const campImpressões = Number(c.impressoes || 0);
      const campNome = c.nome || `Campanha ${cIdx + 1}`;
      const campId = String(c.campaign_id);
      const status = c.effective_status || c.status || 'ACTIVE';
      const orcDiario = c.orcamento_diario ? Number(c.orcamento_diario) : null;
      const brand = clientName || 'Swiftsail Mídia';

      // Se a campanha possui conjuntos e anúncios reais carregados do Supabase, utiliza-os diretamente
      if (c.adsets && c.adsets.length > 0) {
        return {
          ...c,
          adsets: c.adsets.map((as: any) => ({
            id: as.id,
            nome: as.nome,
            campanhaId: campId,
            campanhaNome: campNome,
            segmentacao: as.segmentacao || as.nome,
            orcamento: as.orcamento || (orcDiario ? formatBRL(orcDiario) + '/dia (CBO)' : 'CBO'),
            gasto: as.gasto,
            leads: as.leads,
            conversas: as.conversas,
            cliques: as.cliques,
            impressoes: as.impressoes,
            ctr: as.ctr !== null && as.ctr !== undefined ? `${as.ctr}%` : null,
            status: as.status || status,
            objetivo: getCampaignObjective(c),
            criativos: (as.criativos || []).map((cr: any) => {
              const targetLink = cr.instagram_permalink_url || cr.link_permanente || cr.preview_link;
              const realThumb = cr.thumbnail_storage_path
                ? cr.thumbnail_storage_path
                : targetLink
                ? `/api/meta/thumbnail?url=${encodeURIComponent(targetLink)}`
                : `/api/meta/thumbnail?url=default`;
              const fNorm = cr.criativo_tipo === 'VIDEO' ? ('reels' as const) : cr.criativo_tipo === 'SHARE' ? ('carousel' as const) : ('image' as const);
              return {
                id: cr.id,
                campaignId: campId,
                adsetId: as.id,
                nome: cr.nome,
                formato: fNorm,
                badge: cr.criativo_tipo || (fNorm === 'reels' ? 'REELS' : fNorm === 'carousel' ? 'CARROSSEL' : '1:1'),
                thumbUrl: realThumb,
                adset: as.nome,
                campanha: campNome,
                gasto: cr.gasto,
                leads: cr.leads,
                conversas: cr.conversas,
                ctr: cr.ctr !== null && cr.ctr !== undefined ? `${cr.ctr}%` : null,
                cpl: cr.cpl,
                status: cr.status || status,
                headline: cr.criativo_titulo || cr.nome,
                copy: cr.criativo_nome || '',
                ctaText: '💬 Falar no WhatsApp',
                accountHandle: `${brand.toLowerCase().replace(/[^a-z0-9]/g, '')}`,
                accountName: brand,
                accountAvatar: '🏢',
                preview_link: cr.preview_link,
                link_permanente: cr.link_permanente || cr.instagram_permalink_url,
                instagram_permalink_url: cr.instagram_permalink_url,
                thumbnail_storage_path: cr.thumbnail_storage_path,
                imageUrl: realThumb,
                slides: realThumb
                  ? [{ num: 1, title: cr.criativo_titulo || cr.nome, desc: cr.criativo_nome || '', imgUrl: realThumb }]
                  : undefined,
              };
            }),
          })),
        };
      }

      // Se não há adsets carregados para a campanha no período, retorna lista vazia sem inventar dados
      return {
        ...c,
        adsets: [],
      };
    });
  }, [filteredMetaCampanhas, clientName]);

  // Lista achatada de conjuntos derivados das campanhas reais
  const adsetsData = useMemo(() => {
    return hierarchyData.flatMap((c: any) => c.adsets);
  }, [hierarchyData]);

  // Lista achatada de criativos derivados das campanhas reais
  const adsData = useMemo(() => {
    return hierarchyData.flatMap((c: any) => c.adsets.flatMap((as: any) => as.criativos));
  }, [hierarchyData]);

  const toggleAll = (expand: boolean) => {
    const newCamps: Record<string, boolean> = {};
    const newAdSets: Record<string, boolean> = {};
    hierarchyData.forEach((c: any) => {
      newCamps[c.campaign_id] = expand;
      c.adsets.forEach((as: any) => {
        newAdSets[as.id] = expand;
      });
    });
    setExpandedCampaigns(newCamps);
    setExpandedAdSets(newAdSets);
  };

  // Termos de busca do Google Ads com estado de negativado interativo
  const [negativados, setNegativados] = useState<Record<string, boolean>>({});

  const searchTermsSource = useMemo(() => {
    if (googleData?.termos_busca && googleData.termos_busca.length > 0) {
      return googleData.termos_busca.map((t: any) => ({
        id: t.id,
        termo: t.termo,
        campanha: t.campanha,
        kw: t.palavra_chave || '—',
        match:
          t.correspondencia === 'EXACT'
            ? 'Exata'
            : t.correspondencia === 'PHRASE'
            ? 'Frase'
            : t.correspondencia === 'BROAD'
            ? 'Ampla'
            : t.correspondencia || '—',
        status_termo: t.status_termo,
        sugestao: t.sugestao,
        impressoes: Number(t.impressoes || 0),
        cliques: Number(t.cliques || 0),
        ctr: t.ctr > 0 ? `${t.ctr}%` : '—',
        cpc: t.cpc > 0 ? formatBRL(t.cpc) : '—',
        custo: Number(t.gasto || 0),
        conversoes: Number(t.conversoes || 0),
        custoPorConversao: t.custo_por_conversao > 0 ? formatBRL(t.custo_por_conversao) : '—',
      }));
    }
    return [];
  }, [googleData?.termos_busca]);

  const filteredSearchTerms = searchTermsSource.filter((t: any) =>
    t.termo.toLowerCase().includes(searchTermFilter.toLowerCase())
  );

  const handleNegativeTerm = (id: string) => {
    setNegativados((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="space-y-6">
      {/* Header Bar (Estilo Asaas: Branco, Bordas #E2E8F0, Sombra Suave) */}
      <div className="bg-white border border-[#E2E8F0] p-6 rounded-2xl shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-3 py-0.5 rounded-full text-[10px] font-bold bg-[#EFF4FF] text-[#0050FF] border border-[#BFDBFE] uppercase tracking-wider">
                Tráfego & Anúncios • Campanhas
              </span>
              <span className="text-xs text-[#64748B] font-medium">• {dateRange.label}</span>
            </div>
            <div className="flex items-center gap-2">
              <Building className="w-5 h-5 text-[#0050FF]" />
              <h2 className="text-xl font-bold text-[#0F172A]">{clientName}</h2>
            </div>
            <p className="text-xs text-[#64748B]">
              Desempenho de campanhas, conjuntos de anúncios, criativos e relatório de termos de busca.
            </p>
          </div>

          {/* Seletor de Período para Campanhas */}
          <div className="self-start lg:self-auto">
            <DateRangePicker />
          </div>
        </div>

        {/* Platform Tabs */}
        <div className="flex items-center justify-between pt-2 border-t border-[#F1F5F9]">
          <div className="flex bg-[#F1F5F9] border border-[#E2E8F0] rounded-xl p-1 text-xs">
            <button
              onClick={() => setActivePlatformTab('meta')}
              className={`px-4 py-2 rounded-lg font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activePlatformTab === 'meta'
                  ? 'bg-white text-[#0050FF] shadow-xs border border-[#E2E8F0]'
                  : 'text-[#64748B] hover:text-[#0F172A]'
              }`}
            >
              <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
              <span>Meta Ads (Facebook & Instagram)</span>
            </button>
            <button
              onClick={() => setActivePlatformTab('google')}
              className={`px-4 py-2 rounded-lg font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activePlatformTab === 'google'
                  ? 'bg-white text-[#0050FF] shadow-xs border border-[#E2E8F0]'
                  : 'text-[#64748B] hover:text-[#0F172A]'
              }`}
            >
              <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <span>Google Ads (Search & PMax)</span>
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* ABA META ADS: HIERARQUIA COMPLETA & OBJETIVOS ADAPTATIVOS */}
      {/* ========================================================================= */}
      {activePlatformTab === 'meta' && (
        <div className="space-y-4">
          {/* Informações Financeiras e Faturamento das Contas Meta (public.painel_contas_ads) */}
          {metaContas.length > 0 && (
            <div id="faturamento-meta-midia" className="bg-white border border-[#E2E8F0] p-4 rounded-2xl shadow-xs space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#F1F5F9] pb-2.5">
                <div className="flex items-center gap-2">
                  <span className="w-8 h-8 rounded-lg bg-[#EFF4FF] border border-[#BFDBFE] text-[#0050FF] flex items-center justify-center shrink-0">
                    <Wallet className="w-4 h-4 text-[#0050FF]" />
                  </span>
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#0F172A] flex items-center gap-1.5">
                      Faturamento & Contas Meta Ads
                    </h3>
                    <p className="text-[11px] text-[#64748B]">
                      Saldo de contas pré-pagas, cartão e limite restante de gasto
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-[#64748B] font-medium bg-[#F8FAFC] px-2.5 py-1 rounded-full border border-[#E2E8F0] w-fit">
                  <Clock className="w-3 h-3 text-[#0050FF]" />
                  <span>Sync diário: Meta às 23:25 (BRT)</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {metaContas.map((c: any) => {
                  const isPrePaga = c.tipo_pagamento === 'pre_paga';
                  const isPosPaga = c.tipo_pagamento === 'pos_paga';
                  const hasSaldo = c.saldo_disponivel !== null && c.saldo_disponivel !== undefined;
                  const isSaldoBaixo = isPrePaga && hasSaldo && Number(c.saldo_disponivel) < 50;
                  const hasLimite = c.limite_restante !== null && c.limite_restante !== undefined;
                  const isLimiteBaixo = hasLimite && Number(c.limite_restante) < 50;
                  const hasAlert = isSaldoBaixo || isLimiteBaixo;

                  const cleanActId = String(c.account_id || '').replace(/^act_/, '').trim();
                  const metaBillingUrl = cleanActId
                    ? `https://adsmanager.facebook.com/ads/manager/billing/payment_settings?act=${cleanActId}`
                    : 'https://adsmanager.facebook.com/ads/manager/billing/payment_settings';

                  return (
                    <div
                      key={c.account_id || c.id}
                      className={`p-3.5 rounded-xl border transition-all flex flex-col justify-between ${
                        hasAlert
                          ? 'bg-rose-50/70 border-rose-300 shadow-2xs'
                          : 'bg-[#F8FAFC] border-[#E2E8F0]'
                      }`}
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-[#0F172A] truncate" title={c.nome || c.account_name}>
                              {c.nome || c.account_name}
                            </p>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <p className="text-[10px] text-[#64748B] font-mono truncate">
                                ID: {c.account_id}
                              </p>
                              {cleanActId && (
                                <a
                                  href={metaBillingUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[#64748B] hover:text-[#0050FF] transition-colors p-0.5 rounded hover:bg-white"
                                  title="Abrir página de faturamento e abastecimento na Meta"
                                >
                                  <ExternalLink className="w-2.5 h-2.5" />
                                </a>
                              )}
                            </div>
                          </div>

                          {/* Badge Tipo Pagamento */}
                          {isPrePaga ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-50 text-sky-700 border border-sky-200 shrink-0">
                              Pré-Paga
                            </span>
                          ) : isPosPaga ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-violet-50 text-violet-700 border border-violet-200 shrink-0">
                              Pós-Paga
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600 shrink-0">
                              Meta Ads
                            </span>
                          )}
                        </div>

                        <div className="mt-2.5 pt-2 border-t border-[#E2E8F0]/70 space-y-1.5 text-xs">
                          {/* Conta Pré-Paga: Saldo Disponível */}
                          {isPrePaga && (
                            <div className="flex items-center justify-between">
                              <span className="text-[11px] text-[#64748B]">Saldo Disponível:</span>
                              <span className={`font-mono font-bold ${isSaldoBaixo ? 'text-rose-700' : 'text-emerald-700'}`}>
                                {hasSaldo ? formatBRL(c.saldo_disponivel) : '—'}
                              </span>
                            </div>
                          )}

                          {/* Conta Pós-Paga: Cartão Final */}
                          {isPosPaga && (
                            <div className="flex items-center justify-between">
                              <span className="text-[11px] text-[#64748B] flex items-center gap-1">
                                <CreditCard className="w-3 h-3 text-[#64748B]" /> Cartão:
                              </span>
                              <span className="font-mono font-bold text-[#0F172A]">
                                {formatCartao(c.cartao_final)}
                              </span>
                            </div>
                          )}

                          {/* Limite Restante */}
                          {hasLimite && (
                            <div className="flex items-center justify-between">
                              <span className="text-[11px] text-[#64748B]">Limite Restante:</span>
                              <span className={`font-mono font-bold ${isLimiteBaixo ? 'text-rose-700' : 'text-[#0F172A]'}`}>
                                {formatBRL(c.limite_restante)}
                              </span>
                            </div>
                          )}

                          {!isPrePaga && !isPosPaga && !hasLimite && (
                            <p className="text-[10px] text-[#94A3B8] italic">
                              Aguardando primeira sincronização de pagamento.
                            </p>
                          )}

                          {/* Alerta em Vermelho quando saldo < 50 ou limite < 50 */}
                          {isSaldoBaixo && (
                            <div className="mt-1.5 p-1.5 rounded-lg bg-rose-100 border border-rose-300 text-[10px] font-bold text-rose-800 flex items-center gap-1.5">
                              <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                              <span>Alerta: Saldo disponível crítico (&lt; R$ 50,00).</span>
                            </div>
                          )}

                          {isLimiteBaixo && !isSaldoBaixo && (
                            <div className="mt-1.5 p-1.5 rounded-lg bg-rose-100 border border-rose-300 text-[10px] font-bold text-rose-800 flex items-center gap-1.5">
                              <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                              <span>Alerta: Limite restante crítico (&lt; R$ 50,00).</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Botão de Acesso Direto ao Abastecimento / Faturamento na Meta */}
                      <div className="mt-3 pt-2 border-t border-[#E2E8F0]/80">
                        <a
                          href={metaBillingUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`w-full inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            hasAlert
                              ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-xs'
                              : 'bg-white hover:bg-[#EFF4FF] text-[#0050FF] border border-[#BFDBFE] hover:border-[#0050FF] shadow-2xs'
                          }`}
                          title={`Abrir página de pagamento da conta ${c.account_id} na Meta`}
                        >
                          <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                          <span>
                            {hasAlert
                              ? (isPrePaga ? 'Abastecer Saldo na Meta' : 'Ajustar Limite na Meta')
                              : (isPrePaga ? 'Abastecer Conta na Meta' : 'Gerenciar Pagamento na Meta')}
                          </span>
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Barra de Níveis Hierárquicos & Filtro de Objetivo Adaptativo */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-[#E2E8F0] pb-3">
            {/* Níveis da Estrutura Meta */}
            <div className="flex flex-wrap bg-[#F1F5F9] border border-[#E2E8F0] rounded-xl p-1 text-xs gap-1">
              <button
                onClick={() => setMetaLevel('tree')}
                className={`px-3.5 py-1.5 rounded-lg font-bold transition-all flex items-center gap-2 cursor-pointer ${
                  metaLevel === 'tree' ? 'bg-white text-[#0050FF] shadow-xs border border-[#BFDBFE]' : 'text-[#64748B] hover:text-[#0F172A]'
                }`}
              >
                <span>🌳</span> Visão Unificada (Campanha ➔ AdSet ➔ Criativo)
              </button>
              <button
                onClick={() => setMetaLevel('campaigns')}
                className={`px-3.5 py-1.5 rounded-lg font-bold transition-all flex items-center gap-2 cursor-pointer ${
                  metaLevel === 'campaigns' ? 'bg-white text-[#0050FF] shadow-xs border border-[#BFDBFE]' : 'text-[#64748B] hover:text-[#0F172A]'
                }`}
              >
                <span>📂</span> 1. Campanhas ({hierarchyData.length})
              </button>
              <button
                onClick={() => setMetaLevel('adsets')}
                className={`px-3.5 py-1.5 rounded-lg font-bold transition-all flex items-center gap-2 cursor-pointer ${
                  metaLevel === 'adsets' ? 'bg-white text-[#0050FF] shadow-xs border border-[#BFDBFE]' : 'text-[#64748B] hover:text-[#0F172A]'
                }`}
              >
                <span>👥</span> 2. Conjuntos ({adsetsData.length})
              </button>
              <button
                onClick={() => setMetaLevel('ads')}
                className={`px-3.5 py-1.5 rounded-lg font-bold transition-all flex items-center gap-2 cursor-pointer ${
                  metaLevel === 'ads' ? 'bg-white text-[#0050FF] shadow-xs border border-[#BFDBFE]' : 'text-[#64748B] hover:text-[#0F172A]'
                }`}
              >
                <span>🎨</span> 3. Criativos ({adsData.length})
              </button>
            </div>

            {/* Filtros: Status & Objetivo / Tipo */}
            <div className="flex flex-wrap items-center gap-2.5">
              {/* Filtro de Status Ativo vs Pausado */}
              <div className="flex items-center gap-1 bg-[#F1F5F9] p-1 rounded-xl border border-[#E2E8F0] text-xs">
                <button
                  onClick={() => setStatusFilter('all')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                    statusFilter === 'all'
                      ? 'bg-white text-[#0F172A] shadow-xs border border-[#E2E8F0]'
                      : 'text-[#64748B] hover:text-[#0F172A]'
                  }`}
                >
                  Todos ({activePeriodMetaCampanhas.length})
                </button>
                <button
                  onClick={() => setStatusFilter('active')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    statusFilter === 'active'
                      ? 'bg-white text-emerald-700 shadow-xs border border-emerald-200'
                      : 'text-[#64748B] hover:text-emerald-600'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Ativos
                </button>
                <button
                  onClick={() => setStatusFilter('paused')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    statusFilter === 'paused'
                      ? 'bg-white text-amber-700 shadow-xs border border-amber-200'
                      : 'text-[#64748B] hover:text-amber-600'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  Pausados
                </button>
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={metaObjectiveFilter}
                  onChange={(e: any) => setMetaObjectiveFilter(e.target.value)}
                  className="bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg px-3 py-1.5 text-xs text-[#0F172A] focus:outline-none focus:border-[#0050FF] font-semibold cursor-pointer shadow-xs"
                >
                  <option value="all">🌐 Todos os Objetivos</option>
                  <option value="messages">💬 Mensagens / WhatsApp (Leads)</option>
                  <option value="forms">📋 Formulários Nativos / Cadastros (Lead Ads)</option>
                  <option value="conversions">🎯 Conversões / Vendas no Site (Pixel & ROAS)</option>
                  <option value="reach">📢 Reconhecimento & Alcance (Branding / Vídeo)</option>
                  <option value="traffic">🌐 Tráfego / Cliques & Landing Page Views</option>
                </select>
              </div>

              <div className="hidden sm:block text-xs text-[#64748B] font-medium ml-1 border-l border-[#E2E8F0] pl-3">
                Gasto Meta: <b className="text-[#0F172A] font-bold">{formatBRL(Number(metaData?.totais?.gasto || 0))}</b>
              </div>
            </div>
          </div>

          {/* Banner Informativo de Métricas Adaptadas ao Objetivo */}
          <div className={`bg-white border border-[#E2E8F0] p-4 rounded-2xl shadow-xs border-l-4 ${currentObjConfig.border} flex items-center justify-between gap-4`}>
            <div className="flex items-center gap-3">
              <span className="text-2xl">{currentObjConfig.icon}</span>
              <div>
                <strong className={`text-xs sm:text-sm font-bold ${currentObjConfig.color}`}>
                  {currentObjConfig.title}
                </strong>
                <p className="text-[11px] text-[#64748B]">
                  {currentObjConfig.desc}
                </p>
              </div>
            </div>
            <div className="hidden sm:flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-[#EFF4FF] border border-[#BFDBFE] text-[#0050FF]">
                KPIs Dinâmicos Ativos
              </span>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* MODO TREE: VISÃO HIERÁRQUICA UNIFICADA (CAMPANHA ➔ CONJUNTO ➔ CRIATIVO) */}
          {/* ========================================================================= */}
          {metaLevel === 'tree' && (
            <div className="space-y-4">
              {/* Header com ações de expandir/recolher tudo */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white border border-[#E2E8F0] p-4 rounded-2xl shadow-xs">
                <div>
                  <h3 className="text-sm font-bold text-[#0F172A] flex items-center gap-2">
                    <span>🌳 Árvore Hierárquica Completa</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#EFF4FF] text-[#0050FF] border border-[#BFDBFE]">
                      Campanha ➔ Conjunto ➔ Criativo
                    </span>
                  </h3>
                  <p className="text-xs text-[#64748B] mt-0.5">
                    Visualize todos os níveis de mídia integrados com dados reais do Supabase, alocação de orçamento e prévias de criativos
                  </p>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <button
                    onClick={() => toggleAll(true)}
                    className="px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-[#0F172A] text-xs font-semibold border border-[#CBD5E1] shadow-xs transition-colors cursor-pointer"
                  >
                    Expandir Todos
                  </button>
                  <button
                    onClick={() => toggleAll(false)}
                    className="px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-[#0F172A] text-xs font-semibold border border-[#CBD5E1] shadow-xs transition-colors cursor-pointer"
                  >
                    Recolher Todos
                  </button>
                </div>
              </div>

              {/* Lista das Campanhas com nós filhos */}
              {hierarchyData.length === 0 ? (
                <div className="bg-white border border-[#E2E8F0] p-12 rounded-2xl text-center text-[#64748B] text-xs shadow-xs">
                  {loading ? 'Carregando dados das campanhas...' : 'Nenhuma campanha encontrada no período selecionado.'}
                </div>
              ) : (
                hierarchyData.map((camp: any) => {
                  const isCampExpanded = expandedCampaigns[camp.campaign_id] ?? true;
                  const objCfg = objectiveConfigs[getCampaignObjective(camp)];
                  const totalAdsInCamp = camp.adsets.reduce((acc: number, as: any) => acc + as.criativos.length, 0);

                  return (
                    <div key={camp.campaign_id} className="bg-white border border-[#E2E8F0] rounded-2xl shadow-xs overflow-hidden transition-all">
                      {/* Linha Cabeçalho da Campanha (Nível 1) */}
                      <div
                        onClick={() => toggleCampaign(camp.campaign_id)}
                        className="p-4 bg-[#F8FAFC] hover:bg-slate-100/70 cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors border-b border-[#E2E8F0]"
                      >
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            className="w-7 h-7 rounded-lg bg-white border border-[#CBD5E1] shadow-xs flex items-center justify-center text-[#475569] hover:text-[#0F172A] shrink-0"
                          >
                            {isCampExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                          </button>
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#EFF4FF] text-[#0050FF] border border-[#BFDBFE]">
                                📂 Nível 1 • Campanha
                              </span>
                              {renderStatusBadge(camp.effective_status || camp.status)}
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${objCfg.badge}`}>
                                {objCfg.label}
                              </span>
                            </div>
                            <h4 className="text-sm font-bold text-[#0F172A] mt-1 hover:text-[#0050FF] transition-colors">
                              {camp.nome}
                            </h4>
                            <span className="text-[10px] text-[#64748B] font-mono">ID: {camp.campaign_id}</span>
                          </div>
                        </div>

                        {/* Métricas Principais da Campanha */}
                        <div className="flex flex-wrap items-center gap-4 text-xs font-mono">
                          <div className="text-right">
                            <span className="text-[10px] text-[#64748B] block uppercase font-sans font-semibold">Orçamento</span>
                            <span className="text-[#0F172A] font-bold">
                              {camp.orcamento_diario ? formatBRL(camp.orcamento_diario) + '/dia' : 'CBO'}
                            </span>
                          </div>
                          <div className="text-right border-l border-[#E2E8F0] pl-4">
                            <span className="text-[10px] text-[#64748B] block uppercase font-sans font-semibold">Gasto Total</span>
                            <span className="text-[#0F172A] font-bold">{formatBRL(camp.gasto)}</span>
                          </div>
                          <div className="text-right border-l border-[#E2E8F0] pl-4">
                            <span className="text-[10px] text-[#64748B] block uppercase font-sans font-semibold">Leads / WPP</span>
                            <div className="flex items-center gap-2">
                              {camp.leads > 0 && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openLeadsDrilldown(camp.nome, 'form', camp.leads, { campanha: camp.nome });
                                  }}
                                  className="text-[#0050FF] font-bold hover:underline cursor-pointer"
                                  title="Ver leads capturados no formulário"
                                >
                                  📋 {camp.leads}
                                </button>
                              )}
                              {camp.conversas_iniciadas > 0 && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openLeadsDrilldown(camp.nome, 'whatsapp', camp.conversas_iniciadas, { campanha: camp.nome });
                                  }}
                                  className="text-emerald-600 font-bold hover:underline cursor-pointer"
                                  title="Ver conversas iniciadas no WhatsApp"
                                >
                                  💬 {camp.conversas_iniciadas}
                                </button>
                              )}
                              {camp.leads === 0 && camp.conversas_iniciadas === 0 && (
                                <span className="text-[#64748B]">0 contatos</span>
                              )}
                            </div>
                          </div>
                          <div className="text-right border-l border-[#E2E8F0] pl-4">
                            <span className="text-[10px] text-[#64748B] block uppercase font-sans font-semibold">CTR Médio</span>
                            <span className="text-[#475569]">{camp.ctr}%</span>
                          </div>
                          <div className="border-l border-[#E2E8F0] pl-4">
                            <span className="px-2 py-1 rounded bg-[#F1F5F9] border border-[#E2E8F0] text-[10px] text-[#475569] font-sans font-semibold">
                              {camp.adsets.length} AdSets • {totalAdsInCamp} Criativos
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Conteúdo Aninhado: Conjuntos e Criativos */}
                      {isCampExpanded && (
                        <div className="p-4 sm:p-5 bg-[#F8FAFC] space-y-4">
                          {camp.adsets.map((adset: any, asIdx: number) => {
                            const isAdSetExpanded = expandedAdSets[adset.id] ?? true;
                            return (
                              <div key={adset.id} className="rounded-xl border border-[#E2E8F0] bg-white overflow-hidden shadow-xs">
                                {/* Barra do Conjunto (Nível 2) */}
                                <div
                                  onClick={() => toggleAdSet(adset.id)}
                                  className="p-3.5 bg-white hover:bg-slate-50 cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E2E8F0] transition-colors"
                                >
                                  <div className="flex items-center gap-2.5">
                                    <button
                                      type="button"
                                      className="w-5 h-5 rounded bg-slate-100 border border-[#CBD5E1] flex items-center justify-center text-[#475569] hover:text-[#0F172A] shrink-0 text-xs"
                                    >
                                      {isAdSetExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                                    </button>
                                    <div>
                                      <div className="flex items-center gap-2">
                                        <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                                          👥 Nível 2 • Conjunto {asIdx + 1}
                                        </span>
                                        <h5 className="text-xs font-bold text-[#0F172A] hover:text-[#0050FF] transition-colors">
                                          {adset.nome}
                                        </h5>
                                      </div>
                                      <p className="text-[10px] text-[#64748B] mt-0.5">
                                        🎯 Segmentação: <span className="text-[#0F172A] font-mono">{adset.segmentacao}</span>
                                      </p>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-3 text-xs font-mono">
                                    <span className="text-[#64748B]">Gasto: <b className="text-[#0F172A]">{adset.gasto !== null && adset.gasto !== undefined && adset.gasto > 0 ? formatBRL(adset.gasto) : 'CBO'}</b></span>
                                    <span className="text-[#64748B] border-l border-[#E2E8F0] pl-3">
                                      Retorno:{' '}
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          openLeadsDrilldown(
                                            `${adset.nome} • ${camp.nome}`,
                                            adset.leads > 0 ? 'form' : 'whatsapp',
                                            adset.leads || adset.conversas || 0,
                                            { conjunto: adset.nome, campanha: camp.nome }
                                          );
                                        }}
                                        className="text-[#0050FF] font-bold hover:underline cursor-pointer"
                                        title="Ver contatos deste conjunto sincronizados do Kommo"
                                      >
                                        {adset.leads > 0 ? `${adset.leads} leads` : `${adset.conversas} conversas`}
                                      </button>
                                    </span>
                                    <span className="text-[#64748B] border-l border-[#E2E8F0] pl-3">
                                      CTR: <b className="text-[#0F172A]">{adset.ctr}</b>
                                    </span>
                                    <span className="px-2 py-0.5 rounded bg-[#F1F5F9] text-[10px] text-[#475569] font-sans border border-[#E2E8F0] ml-1">
                                      {adset.criativos.length} Criativos
                                    </span>
                                  </div>
                                </div>

                                {/* Grade de Criativos do Conjunto (Nível 3) */}
                                {isAdSetExpanded && (
                                  <div className="p-3.5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 bg-[#F8FAFC]">
                                    {adset.criativos.map((criat: any) => (
                                      <div
                                        key={criat.id}
                                        className="p-3 bg-white rounded-xl border border-[#E2E8F0] hover:border-[#BFDBFE] hover:shadow-xs transition-all flex flex-col justify-between space-y-2.5 group shadow-xs"
                                      >
                                        <div className="flex gap-3">
                                          {/* Thumbnail */}
                                          <div
                                            onClick={() => setSelectedCreativeModal(criat)}
                                            className="relative w-14 h-14 rounded-lg overflow-hidden cursor-pointer border border-[#E2E8F0] shadow-xs group-hover:scale-105 shrink-0 transition-transform"
                                            style={{
                                              backgroundImage: `url(${criat.thumbUrl})`,
                                              backgroundSize: 'cover',
                                              backgroundPosition: 'center',
                                            }}
                                            title="Clique para ver o anúncio real"
                                          >
                                            <div className="absolute inset-0 bg-black/20 group-hover:bg-[#0050FF]/20 transition-colors flex items-center justify-center">
                                              {criat.formato === 'reels' && (
                                                <div className="w-5 h-5 rounded-full bg-white/90 text-[#0F172A] flex items-center justify-center text-[10px] shadow">
                                                  ▶
                                                </div>
                                              )}
                                            </div>
                                            <span className="absolute bottom-0.5 right-0.5 px-1 rounded text-[7px] font-black bg-black/80 text-white backdrop-blur-xs">
                                              {criat.badge}
                                            </span>
                                          </div>

                                          {/* Infos do Criativo */}
                                          <div className="space-y-1 min-w-0">
                                            <div className="flex items-center gap-1.5 flex-wrap">
                                              <span className="px-1.5 py-0.2 rounded text-[8px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                                🎨 Nível 3
                                              </span>
                                              <span className="text-[9px] font-bold text-[#0050FF]">
                                                {criat.formato === 'carousel' ? 'Carrossel' : criat.formato === 'reels' ? 'Reels 9:16' : 'Estático'}
                                              </span>
                                            </div>
                                            <h6
                                              onClick={() => setSelectedCreativeModal(criat)}
                                              className="text-xs font-bold text-[#0F172A] hover:text-[#0050FF] cursor-pointer truncate transition-colors"
                                              title={criat.nome}
                                            >
                                              {criat.nome}
                                            </h6>
                                            <p className="text-[10px] text-[#64748B] line-clamp-1">
                                              {criat.headline}
                                            </p>
                                          </div>
                                        </div>

                                        {/* Métricas e Botão de Ação */}
                                        <div className="pt-2 border-t border-[#E2E8F0] flex items-center justify-between text-[11px] font-mono">
                                          <div>
                                            <span className="text-[#64748B] text-[9px] block font-sans">Gasto</span>
                                            <span className="text-[#0F172A] font-bold">{criat.gasto !== null && criat.gasto !== undefined && criat.gasto > 0 ? formatBRL(criat.gasto) : '—'}</span>
                                          </div>
                                          <div>
                                            <span className="text-[#64748B] text-[9px] block font-sans">Retorno</span>
                                            <button
                                              onClick={() =>
                                                openLeadsDrilldown(
                                                  `${criat.nome} • ${camp.nome}`,
                                                  criat.leads > 0 ? 'form' : 'whatsapp',
                                                  criat.leads || criat.conversas || 0,
                                                  { criativo: criat.nome, campanha: camp.nome, conjunto: adset.nome }
                                                )
                                              }
                                              className="text-[#0050FF] font-bold hover:underline cursor-pointer"
                                              title="Ver contatos capturados deste criativo no Kommo"
                                            >
                                              {criat.leads > 0 ? `${criat.leads} leads` : `${criat.conversas} conv.`}
                                            </button>
                                          </div>
                                          <div>
                                            <span className="text-[#64748B] text-[9px] block font-sans">CTR</span>
                                            <span className="text-[#475569]">{criat.ctr}</span>
                                          </div>
                                          <div className="flex items-center gap-1.5">
                                            <button
                                              onClick={() => setSelectedCreativeModal(criat)}
                                              className="px-2.5 py-1 rounded-lg bg-[#EFF4FF] hover:bg-[#DBEAFE] text-[#0050FF] border border-[#BFDBFE] text-[10px] font-semibold transition-all flex items-center gap-1 cursor-pointer"
                                            >
                                              <Eye className="w-3 h-3" />
                                              <span>Ver</span>
                                            </button>
                                            {(criat.preview_link || criat.link_permanente) && (
                                              <a
                                                href={criat.preview_link || criat.link_permanente}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                onClick={(e) => e.stopPropagation()}
                                                className="p-1.5 rounded-lg bg-[#F1F5F9] hover:bg-slate-200 text-[#475569] hover:text-[#0F172A] border border-[#E2E8F0] text-[10px] transition-all"
                                                title="Abrir diretamente no Meta Ads / Instagram"
                                              >
                                                <ExternalLink className="w-3 h-3" />
                                              </a>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* NÍVEL 1: TABELA DE CAMPANHAS META (MÉTRICAS ADAPTATIVAS & ACORDEÃO) */}
          {/* ========================================================================= */}
          {metaLevel === 'campaigns' && (
            <div className="bg-white border border-[#E2E8F0] rounded-2xl shadow-xs overflow-hidden">
              <div className="p-4 border-b border-[#E2E8F0] flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-[#0F172A]">Campanhas no Meta Ads (Nível 1)</h3>
                  <p className="text-xs text-[#64748B]">
                    Isolamento por conta de anúncio • Métricas ajustadas de acordo com o objetivo selecionado
                  </p>
                </div>
                <span className="text-xs font-mono text-[#0050FF] font-bold bg-[#EFF4FF] px-2.5 py-0.5 rounded-full border border-[#BFDBFE]">
                  {hierarchyData.length} campanhas
                </span>
              </div>

              {hierarchyData.length === 0 ? (
                <div className="p-8 text-center text-[#64748B] text-xs">
                  {loading ? 'Carregando campanhas...' : 'Nenhuma campanha Meta encontrada para este objetivo no período.'}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className="border-b border-[#E2E8F0] text-[#64748B] bg-[#F8FAFC]">
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4">Campanha</th>
                        <th className="py-3 px-4">Objetivo / Tipo</th>
                        <th className="py-3 px-4">Orçamento</th>
                        <th className="py-3 px-4">Gasto Total</th>

                        {/* COLUNAS ADAPTATIVAS BASEADAS NO OBJETIVO (100% DADOS REAIS) */}
                        {metaObjectiveFilter === 'messages' && (
                          <>
                            <th className="py-3 px-4 text-emerald-400">Conversas (WPP)</th>
                            <th className="py-3 px-4 text-emerald-400">Custo / Conversa</th>
                            <th className="py-3 px-4 text-emerald-400">Cliques no Link</th>
                            <th className="py-3 px-4 text-emerald-400">Taxa Conversa / Clique</th>
                          </>
                        )}

                        {metaObjectiveFilter === 'forms' && (
                          <>
                            <th className="py-3 px-4 text-cyan-400">Formulários (Leads)</th>
                            <th className="py-3 px-4 text-cyan-400">Custo / Lead (CPL)</th>
                            <th className="py-3 px-4 text-cyan-400">Cliques no Link</th>
                            <th className="py-3 px-4 text-cyan-400">Taxa Lead / Clique</th>
                          </>
                        )}

                        {metaObjectiveFilter === 'conversions' && (
                          <>
                            <th className="py-3 px-4 text-indigo-400">Contatos Totais</th>
                            <th className="py-3 px-4 text-indigo-400">Custo / Contato</th>
                            <th className="py-3 px-4 text-indigo-400">Cliques</th>
                            <th className="py-3 px-4 text-indigo-400">CTR</th>
                          </>
                        )}

                        {metaObjectiveFilter === 'reach' && (
                          <>
                            <th className="py-3 px-4 text-amber-400">Impressões</th>
                            <th className="py-3 px-4 text-amber-400">CPM (Custo / Mil)</th>
                            <th className="py-3 px-4 text-amber-400">Cliques</th>
                            <th className="py-3 px-4 text-amber-400">CTR</th>
                          </>
                        )}

                        {metaObjectiveFilter === 'traffic' && (
                          <>
                            <th className="py-3 px-4 text-teal-400">Cliques no Link</th>
                            <th className="py-3 px-4 text-teal-400">CTR Link</th>
                            <th className="py-3 px-4 text-teal-400">CPC Médio</th>
                            <th className="py-3 px-4 text-teal-400">Impressões</th>
                          </>
                        )}

                        {metaObjectiveFilter === 'all' && (
                          <>
                            <th className="py-3 px-4">Impressões</th>
                            <th className="py-3 px-4">Cliques / CTR</th>
                            <th className="py-3 px-4 text-cyan-300">Leads (Form)</th>
                            <th className="py-3 px-4 text-emerald-400">Conversas (WPP)</th>
                            <th className="py-3 px-4">Custo / Contato</th>
                          </>
                        )}

                        <th className="py-3 px-4">Hierarquia</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E2E8F0] bg-white">
                      {hierarchyData.map((c: any) => {
                        const obj = getCampaignObjective(c);
                        const objCfg = objectiveConfigs[obj];
                        const conversas = Number(c.conversas_iniciadas || 0);
                        const leads = Number(c.leads || 0);
                        const cliques = Number(c.cliques || 0);
                        const gasto = Number(c.gasto || 0);
                        const cpMsg = conversas > 0 ? gasto / conversas : 0;
                        const cpl = leads > 0 ? gasto / leads : 0;
                        const isExpanded = expandedCampaigns[c.campaign_id] ?? false;

                        return (
                          <React.Fragment key={c.campaign_id}>
                            <tr className="hover:bg-[#F8FAFC] transition-colors">
                              {/* Status */}
                              <td className="py-3 px-4">
                                {renderStatusBadge(c.effective_status || c.status)}
                              </td>

                              {/* Campanha Nome & ID */}
                              <td className="py-3 px-4">
                                <p className="font-bold text-[#0F172A] max-w-xs truncate" title={c.nome}>
                                  {c.nome}
                                </p>
                                <span className="text-[10px] text-[#64748B] font-mono">ID: {c.campaign_id}</span>
                              </td>

                              {/* Tag de Objetivo */}
                              <td className="py-3 px-4">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${objCfg.badge}`}>
                                  {objCfg.label}
                                </span>
                              </td>

                              {/* Orçamento */}
                              <td className="py-3 px-4 font-mono text-[#0F172A] font-semibold">
                                {c.orcamento_diario ? formatBRL(c.orcamento_diario) + '/dia' : 'CBO'}
                              </td>

                              {/* Gasto Total */}
                              <td className="py-3 px-4 font-mono font-bold text-[#0F172A]">{formatBRL(gasto)}</td>

                              {/* DADOS ADAPTATIVOS DA LINHA (100% REAIS) */}
                              {metaObjectiveFilter === 'messages' && (
                                <>
                                  <td className="py-3 px-4 font-mono font-bold text-emerald-400">
                                    <button
                                      onClick={() => openLeadsDrilldown(c.nome, 'whatsapp', conversas, { campanha: c.nome })}
                                      className="hover:underline hover:text-emerald-300 transition-colors flex items-center gap-1.5 cursor-pointer text-left font-bold font-mono"
                                      title="Clique para ver a lista de conversas no WhatsApp"
                                    >
                                      <span>💬 {conversas}</span>
                                      <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1 py-0.2 rounded border border-emerald-500/30">👁️</span>
                                    </button>
                                  </td>
                                  <td className="py-3 px-4 font-mono font-bold text-slate-200">
                                    {cpMsg > 0 ? formatBRL(cpMsg) : '—'}
                                  </td>
                                  <td className="py-3 px-4 font-mono text-slate-300">
                                    {cliques}
                                  </td>
                                  <td className="py-3 px-4 font-mono text-emerald-300">
                                    {cliques > 0 ? ((conversas / cliques) * 100).toFixed(1) + '%' : '—'}
                                  </td>
                                </>
                              )}

                              {metaObjectiveFilter === 'forms' && (
                                <>
                                  <td className="py-3 px-4 font-mono font-bold text-cyan-300">
                                    <button
                                      onClick={() => openLeadsDrilldown(c.nome, 'form', leads, { campanha: c.nome })}
                                      className="hover:underline hover:text-cyan-200 transition-colors flex items-center gap-1.5 cursor-pointer text-left font-bold font-mono"
                                      title="Clique para ver os nomes completos capturados"
                                    >
                                      <span>📋 {leads}</span>
                                      <span className="text-[10px] bg-cyan-500/20 text-cyan-300 px-1.5 py-0.5 rounded border border-cyan-500/30 font-bold">👁️ Nomes</span>
                                    </button>
                                  </td>
                                  <td className="py-3 px-4 font-mono font-bold text-slate-200">
                                    {cpl > 0 ? formatBRL(cpl) : '—'}
                                  </td>
                                  <td className="py-3 px-4 font-mono text-slate-300">
                                    {cliques}
                                  </td>
                                  <td className="py-3 px-4 font-mono text-cyan-300">
                                    {cliques > 0 ? ((leads / cliques) * 100).toFixed(1) + '%' : '—'}
                                  </td>
                                </>
                              )}

                              {metaObjectiveFilter === 'conversions' && (
                                <>
                                  <td className="py-3 px-4 font-mono font-bold text-indigo-300">
                                    {leads + conversas > 0 ? `${leads + conversas} contatos` : '0 contatos'}
                                  </td>
                                  <td className="py-3 px-4 font-mono font-bold text-slate-200">
                                    {(leads + conversas) > 0 ? formatBRL(gasto / (leads + conversas)) : '—'}
                                  </td>
                                  <td className="py-3 px-4 font-mono text-slate-200">
                                    {cliques}
                                  </td>
                                  <td className="py-3 px-4 font-mono font-bold text-indigo-300">
                                    {c.ctr ? `${c.ctr}%` : '—'}
                                  </td>
                                </>
                              )}

                              {metaObjectiveFilter === 'reach' && (
                                <>
                                  <td className="py-3 px-4 font-mono font-bold text-amber-300">
                                    {Number(c.impressoes || 0).toLocaleString('pt-BR')}
                                  </td>
                                  <td className="py-3 px-4 font-mono text-slate-300">
                                    {Number(c.impressoes || 0) > 0 ? formatBRL((gasto / Number(c.impressoes)) * 1000) : '—'}
                                  </td>
                                  <td className="py-3 px-4 font-mono text-slate-300">
                                    {cliques}
                                  </td>
                                  <td className="py-3 px-4 font-mono text-amber-300">
                                    {c.ctr ? `${c.ctr}%` : '—'}
                                  </td>
                                </>
                              )}

                              {metaObjectiveFilter === 'traffic' && (
                                <>
                                  <td className="py-3 px-4 font-mono font-bold text-teal-300">
                                    {cliques} cliques
                                  </td>
                                  <td className="py-3 px-4 font-mono text-slate-300">{c.ctr ? `${c.ctr}%` : '—'}</td>
                                  <td className="py-3 px-4 font-mono text-slate-300">
                                    {cliques > 0 ? formatBRL(gasto / cliques) : '—'}
                                  </td>
                                  <td className="py-3 px-4 font-mono text-teal-300">
                                    {Number(c.impressoes || 0).toLocaleString('pt-BR')}
                                  </td>
                                </>
                              )}

                              {metaObjectiveFilter === 'all' && (
                                <>
                                  <td className="py-3 px-4 font-mono text-slate-300">
                                    {Number(c.impressoes).toLocaleString('pt-BR')}
                                  </td>
                                  <td className="py-3 px-4 font-mono text-slate-300">
                                    {c.cliques} <span className="text-slate-500">({c.ctr}%)</span>
                                  </td>
                                  <td className="py-3 px-4 font-mono font-bold text-cyan-300">
                                    <button
                                      onClick={() => openLeadsDrilldown(c.nome, 'form', leads, { campanha: c.nome })}
                                      className="hover:underline hover:text-cyan-200 transition-colors flex items-center gap-1 cursor-pointer font-bold font-mono"
                                      title="Clique para ver os nomes capturados no formulário"
                                    >
                                      <span>📋 {leads}</span>
                                      <span className="text-[9px] text-cyan-400">👁️</span>
                                    </button>
                                  </td>
                                  <td className="py-3 px-4 font-mono font-bold text-emerald-400">
                                    <button
                                      onClick={() => openLeadsDrilldown(c.nome, 'whatsapp', conversas, { campanha: c.nome })}
                                      className="hover:underline hover:text-emerald-300 transition-colors flex items-center gap-1 cursor-pointer font-bold font-mono"
                                      title="Clique para ver as conversas no WhatsApp"
                                    >
                                      <span>💬 {conversas}</span>
                                      <span className="text-[9px] text-emerald-400">👁️</span>
                                    </button>
                                  </td>
                                  <td className="py-3 px-4 font-mono text-slate-200">
                                    {c.custo_por_lead > 0 ? formatBRL(c.custo_por_lead) : '—'}
                                  </td>
                                </>
                              )}

                              {/* Ação: Acordeão de AdSets & Criativos */}
                              <td className="py-3 px-4">
                                <button
                                  onClick={() => toggleCampaign(c.campaign_id)}
                                  className={`px-2.5 py-1 rounded text-xs font-semibold transition-all flex items-center gap-1.5 border cursor-pointer ${
                                    isExpanded
                                      ? 'bg-[#0050FF] text-white border-[#0050FF] shadow-xs'
                                      : 'bg-white hover:bg-slate-50 text-[#475569] border-[#CBD5E1]'
                                  }`}
                                  title="Expandir AdSets e Criativos deste anúncio"
                                >
                                  {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                                  <span>{c.adsets.length} AdSets</span>
                                </button>
                              </td>
                            </tr>

                            {/* Acordeão Inline: AdSets e Criativos da Campanha */}
                            {isExpanded && (
                              <tr className="bg-[#F8FAFC]">
                                <td colSpan={metaObjectiveFilter === 'all' ? 11 : 10} className="p-4">
                                  <div className="rounded-xl border border-[#BFDBFE] bg-white p-4 space-y-3 shadow-xs">
                                    <div className="flex items-center justify-between">
                                      <h5 className="text-xs font-bold text-[#0F172A] flex items-center gap-2">
                                        <span className="text-[#0050FF]">📂 {c.nome}</span>
                                        <span className="text-[#CBD5E1]">•</span>
                                        <span className="text-[#64748B] font-normal">
                                          {c.adsets.length} Conjuntos de Anúncios vinculados
                                        </span>
                                      </h5>
                                      <button
                                        onClick={() => setMetaLevel('tree')}
                                        className="text-[11px] text-[#0050FF] hover:underline font-semibold cursor-pointer"
                                      >
                                        Abrir na Árvore Completa ➔
                                      </button>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                      {c.adsets.map((as: any) => (
                                        <div key={as.id} className="p-3 bg-[#F8FAFC] rounded-lg border border-[#E2E8F0] space-y-2">
                                          <div className="flex items-center justify-between text-xs font-bold text-[#0F172A]">
                                            <span className="truncate">{as.nome}</span>
                                            <span className="text-[#0050FF] font-mono text-[11px]">{as.gasto !== null && as.gasto !== undefined && as.gasto > 0 ? formatBRL(as.gasto) : 'CBO'}</span>
                                          </div>
                                          <div className="space-y-1">
                                            {as.criativos.map((cr: any) => (
                                              <div
                                                key={cr.id}
                                                onClick={() => setSelectedCreativeModal(cr)}
                                                className="p-1.5 rounded bg-white hover:bg-slate-50 cursor-pointer flex items-center justify-between text-[11px] transition-colors border border-[#E2E8F0]"
                                              >
                                                <div className="flex items-center gap-2 truncate">
                                                  <span className="text-[10px]">🎨</span>
                                                  <span className="text-[#0F172A] hover:text-[#0050FF] truncate font-medium">{cr.nome}</span>
                                                </div>
                                                <span className="text-[#0050FF] text-[10px] font-mono font-bold shrink-0">
                                                  {cr.leads > 0 ? `${cr.leads} leads` : `${cr.conversas} conv.`}
                                                </span>
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* NÍVEL 2: TABELA DE CONJUNTOS DE ANÚNCIOS (ADSETS COM CAMPANHA EXPLICITA) */}
          {/* ========================================================================= */}
          {metaLevel === 'adsets' && (
            <div className="bg-white border border-[#E2E8F0] rounded-2xl shadow-xs overflow-hidden">
              <div className="p-4 border-b border-[#E2E8F0] flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-[#0F172A]">Conjuntos de Anúncios / Públicos Segmentados (Nível 2)</h3>
                  <p className="text-xs text-[#64748B]">Públicos, estratégias de lance e alocação de orçamento com vínculo de campanha</p>
                </div>
                <button
                  onClick={() => setMetaLevel('ads')}
                  className="px-3 py-1.5 rounded-lg bg-[#EFF4FF] hover:bg-[#DBEAFE] text-[#0050FF] border border-[#BFDBFE] font-semibold text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <span>Ver Anúncios & Criativos ➔</span>
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="border-b border-[#E2E8F0] text-[#64748B] bg-[#F8FAFC]">
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Conjunto (AdSet)</th>
                      <th className="py-3 px-4">Campanha (Nível 1)</th>
                      <th className="py-3 px-4">Orçamento Diário</th>
                      <th className="py-3 px-4">Gasto</th>
                      <th className="py-3 px-4">
                        {metaObjectiveFilter === 'traffic'
                          ? 'Cliques'
                          : metaObjectiveFilter === 'reach'
                          ? 'Alcance Estimado'
                          : metaObjectiveFilter === 'conversions'
                          ? 'Vendas / Conv.'
                          : 'Leads / Conversas'}
                      </th>
                      <th className="py-3 px-4">CTR</th>
                      <th className="py-3 px-4">Criativos</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E2E8F0] bg-white">
                    {adsetsData.map((as: any) => {
                      const isAdSetExp = expandedAdSets[as.id] ?? false;
                      return (
                        <React.Fragment key={as.id}>
                          <tr className="hover:bg-[#F8FAFC] transition-colors">
                            <td className="py-3 px-4">
                              {renderStatusBadge(as.status)}
                            </td>
                            <td className="py-3 px-4 font-bold text-[#0F172A]">{as.nome}</td>
                            <td className="py-3 px-4">
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#EFF4FF] text-[#0050FF] border border-[#BFDBFE]">
                                📂 {as.campanhaNome}
                              </span>
                            </td>
                            <td className="py-3 px-4 font-mono text-[#475569]">{as.orcamento}</td>
                            <td className="py-3 px-4 font-mono font-bold text-[#0F172A]">{as.gasto !== null && as.gasto !== undefined && as.gasto > 0 ? formatBRL(as.gasto) : 'CBO'}</td>
                            <td className="py-3 px-4 font-mono font-bold text-[#0050FF]">
                              <button
                                onClick={() => openLeadsDrilldown(`${as.nome} • ${as.campanhaNome}`, as.leads > 0 ? 'form' : 'whatsapp', as.leads || as.conversas || 0, { conjunto: as.nome, campanha: as.campanhaNome })}
                                className="hover:underline transition-colors flex items-center gap-1 cursor-pointer font-bold font-mono"
                                title="Clique para ver os nomes e contatos capturados neste público"
                              >
                                <span>{as.leads > 0 ? `${as.leads} leads` : as.conversas > 0 ? `${as.conversas} conversas` : '—'}</span>
                                <span className="text-[9px]">👁️</span>
                              </button>
                            </td>
                            <td className="py-3 px-4 font-mono text-[#475569]">{as.ctr || '—'}</td>
                            <td className="py-3 px-4">
                              <button
                                onClick={() => toggleAdSet(as.id)}
                                className={`px-2.5 py-1 rounded text-xs font-semibold transition-all flex items-center gap-1 border cursor-pointer ${
                                  isAdSetExp
                                    ? 'bg-[#0050FF] text-white border-[#0050FF]'
                                    : 'bg-white hover:bg-slate-50 text-[#475569] border-[#CBD5E1]'
                                }`}
                              >
                                {isAdSetExp ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                                <span>{as.criativos.length} Criativos</span>
                              </button>
                            </td>
                          </tr>

                          {/* Acordeão Inline de Criativos do AdSet */}
                          {isAdSetExp && (
                            <tr className="bg-[#F8FAFC]">
                              <td colSpan={8} className="p-4">
                                <div className="p-3 bg-white rounded-xl border border-[#E2E8F0] grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 shadow-xs">
                                  {as.criativos.map((cr: any) => (
                                    <div
                                      key={cr.id}
                                      onClick={() => setSelectedCreativeModal(cr)}
                                      className="p-3 bg-[#F8FAFC] rounded-lg border border-[#E2E8F0] hover:border-[#BFDBFE] cursor-pointer flex items-center gap-3 transition-all"
                                    >
                                      <div
                                        className="w-12 h-12 rounded-lg bg-cover bg-center shrink-0 border border-[#E2E8F0]"
                                        style={{ backgroundImage: `url(${cr.thumbUrl})` }}
                                      />
                                      <div className="min-w-0">
                                        <p className="text-xs font-bold text-[#0F172A] truncate">{cr.nome}</p>
                                        <p className="text-[10px] text-[#64748B] font-mono mt-0.5">
                                          Gasto: {cr.gasto !== null && cr.gasto !== undefined && cr.gasto > 0 ? formatBRL(cr.gasto) : '—'} • Retorno: {cr.leads > 0 ? `${cr.leads} leads` : `${cr.conversas} conv.`}
                                        </p>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* NÍVEL 3: TABELA DE ANÚNCIOS & CRIATIVOS (CAMPANHA + CONJUNTO EXPLICITOS) */}
          {/* ========================================================================= */}
          {metaLevel === 'ads' && (
            <div className="bg-white border border-[#E2E8F0] rounded-2xl shadow-xs overflow-hidden">
              <div className="p-4 border-b border-[#E2E8F0] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-[#0F172A] flex items-center gap-2">
                    <span>Anúncios & Formatos de Criativos (Nível 3)</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#EFF4FF] text-[#0050FF] border border-[#BFDBFE]">
                      Prévia Real Interativa
                    </span>
                  </h3>
                  <p className="text-xs text-[#64748B]">
                    Hierarquia completa exibida: Campanha ➔ Conjunto ➔ Criativo. Clique na miniatura para abrir a prévia real.
                  </p>
                </div>
                <span className="text-xs font-mono text-[#0050FF] font-bold bg-[#EFF4FF] px-2.5 py-0.5 rounded-full border border-[#BFDBFE]">
                  {adsData.length} criativos ativos
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="border-b border-[#E2E8F0] text-[#64748B] bg-[#F8FAFC]">
                      <th className="py-3 px-4">Thumbnail</th>
                      <th className="py-3 px-4">Criativo / Anúncio</th>
                      <th className="py-3 px-4">Campanha (Nível 1)</th>
                      <th className="py-3 px-4">Conjunto (Nível 2)</th>
                      <th className="py-3 px-4">Gasto Total</th>
                      <th className="py-3 px-4">
                        {metaObjectiveFilter === 'traffic'
                          ? 'Cliques Link'
                          : metaObjectiveFilter === 'reach'
                          ? 'Alcance Único'
                          : metaObjectiveFilter === 'conversions'
                          ? 'Compras / Conv.'
                          : 'Leads / Conversas'}
                      </th>
                      <th className="py-3 px-4">CTR</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Ação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E2E8F0] bg-white">
                    {adsData.map((ad: any) => (
                      <tr key={ad.id} className="hover:bg-[#F8FAFC] transition-colors">
                        {/* THUMBNAIL REAL COM BADGE E EFEITO HOVER */}
                        <td className="py-3 px-4">
                          <div
                            onClick={() => setSelectedCreativeModal(ad)}
                            className="relative w-14 h-14 rounded-lg overflow-hidden cursor-pointer border border-[#E2E8F0] shadow-xs group shrink-0 transition-all hover:scale-105 hover:border-[#0050FF]"
                            title="Clique para abrir e interagir com o anúncio real"
                            style={{
                              backgroundImage: `url(${ad.thumbUrl})`,
                              backgroundSize: 'cover',
                              backgroundPosition: 'center',
                            }}
                          >
                            <div className="absolute inset-0 bg-black/20 group-hover:bg-[#0050FF]/20 transition-colors flex items-center justify-center">
                              {ad.formato === 'reels' && (
                                <div className="w-5 h-5 rounded-full bg-white/90 text-[#0F172A] flex items-center justify-center text-[10px] shadow group-hover:scale-110 transition-transform">
                                  ▶
                                </div>
                              )}
                            </div>
                            <span className="absolute bottom-1 right-1 px-1 py-0.2 rounded text-[8px] font-black bg-black/80 text-white backdrop-blur-xs">
                              {ad.badge || (ad.formato === 'reels' ? 'REELS' : ad.formato === 'carousel' ? 'CARDS' : '1:1')}
                            </span>
                          </div>
                        </td>

                        {/* CRIATIVO / ANÚNCIO (CLICÁVEL) */}
                        <td className="py-3 px-4">
                          <p
                            onClick={() => setSelectedCreativeModal(ad)}
                            className="font-bold text-[#0F172A] hover:text-[#0050FF] cursor-pointer transition-colors max-w-xs truncate"
                            title="Clique para ver prévia completa"
                          >
                            {ad.nome}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] text-[#64748B] font-mono">ID: {ad.id}</span>
                            <span className="text-[10px] text-[#0050FF] font-medium">
                              • {ad.formato === 'carousel' ? 'Carrossel' : ad.formato === 'reels' ? 'Reels' : 'Estático'}
                            </span>
                          </div>
                        </td>

                        {/* CAMPANHA */}
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#EFF4FF] text-[#0050FF] border border-[#BFDBFE] truncate max-w-[150px] inline-block" title={ad.campanha}>
                            📂 {ad.campanha}
                          </span>
                        </td>

                        {/* CONJUNTO */}
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 truncate max-w-[150px] inline-block" title={ad.adset}>
                            👥 {ad.adset}
                          </span>
                        </td>

                        {/* GASTO */}
                        <td className="py-3 px-4 font-mono font-bold text-[#0F172A]">{ad.gasto !== null && ad.gasto !== undefined && ad.gasto > 0 ? formatBRL(ad.gasto) : '—'}</td>

                        {/* RETORNO ADAPTATIVO POR OBJETIVO */}
                        <td className="py-3 px-4 font-mono font-bold text-[#0050FF]">
                          <button
                            onClick={() => openLeadsDrilldown(`${ad.nome} • ${ad.adset}`, ad.leads > 0 ? 'form' : 'whatsapp', ad.leads || ad.conversas || 0, { criativo: ad.nome, conjunto: ad.adset })}
                            className="hover:underline transition-colors flex items-center gap-1 cursor-pointer font-bold font-mono"
                            title="Clique para ver os nomes e contatos capturados neste criativo"
                          >
                            <span>
                              {ad.leads > 0 ? `${ad.leads} leads` : ad.conversas > 0 ? `${ad.conversas} conv.` : '—'}
                            </span>
                            <span className="text-[9px]">👁️</span>
                          </button>
                        </td>

                        {/* CTR */}
                        <td className="py-3 px-4 font-mono text-[#475569]">{ad.ctr || '—'}</td>

                        {/* STATUS */}
                        <td className="py-3 px-4">
                          {renderStatusBadge(ad.status)}
                        </td>

                        {/* AÇÃO: VER ANÚNCIO REAL */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => setSelectedCreativeModal(ad)}
                              className="px-2.5 py-1 rounded-lg bg-[#EFF4FF] hover:bg-[#DBEAFE] text-[#0050FF] border border-[#BFDBFE] font-semibold text-[11px] transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                              title="Abrir prévia interativa do anúncio"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>Ver Criativo</span>
                            </button>
                            {(ad.preview_link || ad.link_permanente) && (
                              <a
                                href={ad.preview_link || ad.link_permanente}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1.5 rounded-lg bg-[#F1F5F9] hover:bg-slate-200 text-[#475569] hover:text-[#0F172A] border border-[#E2E8F0] text-[11px] transition-all"
                                title="Abrir diretamente no Meta Ads / Instagram"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            )}
                          </div>
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
          {/* Informações Financeiras e Faturamento das Contas Google (public.painel_contas_ads) */}
          {googleContas.length > 0 && (
            <div id="faturamento-google-midia" className="bg-white border border-[#E2E8F0] p-4 rounded-2xl shadow-xs space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#F1F5F9] pb-2.5">
                <div className="flex items-center gap-2">
                  <span className="w-8 h-8 rounded-lg bg-[#EFF4FF] border border-[#BFDBFE] text-[#0050FF] flex items-center justify-center shrink-0">
                    <Wallet className="w-4 h-4 text-[#0050FF]" />
                  </span>
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#0F172A] flex items-center gap-1.5">
                      Faturamento & Contas Google Ads
                    </h3>
                    <p className="text-[11px] text-[#64748B]">
                      Tipo de orçamento, saldo estimado, conta de pagamento e limite restante
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-[#64748B] font-medium bg-[#F8FAFC] px-2.5 py-1 rounded-full border border-[#E2E8F0] w-fit">
                  <Clock className="w-3 h-3 text-[#0050FF]" />
                  <span>Sync diário: Google às 23:35 (BRT)</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {googleContas.map((c: any) => {
                  const isLimiteOrcamento = c.tipo_pagamento === 'limite_orcamento';
                  const isAutomatico = c.tipo_pagamento === 'automatico';
                  const hasSaldo = c.saldo_disponivel !== null && c.saldo_disponivel !== undefined;
                  const isSaldoBaixo = isLimiteOrcamento && hasSaldo && Number(c.saldo_disponivel) < 50;
                  const hasLimite = c.limite_restante !== null && c.limite_restante !== undefined;
                  const isLimiteBaixo = hasLimite && Number(c.limite_restante) < 50;
                  const hasAlert = isSaldoBaixo || isLimiteBaixo;

                  const cleanCustomerId = String(c.account_id || '').replace(/[^0-9]/g, '').trim();
                  const googleBillingUrl = cleanCustomerId
                    ? `https://ads.google.com/aw/billing/summary?ocid=${cleanCustomerId}`
                    : 'https://ads.google.com/aw/billing/summary';

                  return (
                    <div
                      key={c.account_id || c.id}
                      className={`p-3.5 rounded-xl border transition-all flex flex-col justify-between ${
                        hasAlert
                          ? 'bg-rose-50/70 border-rose-300 shadow-2xs'
                          : 'bg-[#F8FAFC] border-[#E2E8F0]'
                      }`}
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-[#0F172A] truncate" title={c.nome || c.account_name}>
                              {c.nome || c.account_name}
                            </p>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <p className="text-[10px] text-[#64748B] font-mono truncate">
                                ID: {c.account_id}
                              </p>
                              {cleanCustomerId && (
                                <a
                                  href={googleBillingUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[#64748B] hover:text-[#0050FF] transition-colors p-0.5 rounded hover:bg-white"
                                  title="Abrir página de faturamento no Google Ads"
                                >
                                  <ExternalLink className="w-2.5 h-2.5" />
                                </a>
                              )}
                            </div>
                          </div>

                          {/* Badge Tipo Pagamento */}
                          {isLimiteOrcamento ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 shrink-0">
                              Teto Orçamento
                            </span>
                          ) : isAutomatico ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                              Automático
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600 shrink-0">
                              Google Ads
                            </span>
                          )}
                        </div>

                        <div className="mt-2.5 pt-2 border-t border-[#E2E8F0]/70 space-y-1.5 text-xs">
                          {/* Saldo Estimado (só em limite_orcamento) */}
                          {isLimiteOrcamento && (
                            <div className="flex items-center justify-between">
                              <span className="text-[11px] text-[#64748B]">Saldo Estimado:</span>
                              <span className={`font-mono font-bold ${isSaldoBaixo ? 'text-rose-700' : 'text-emerald-700'}`}>
                                {hasSaldo ? formatBRL(c.saldo_disponivel) : '—'}
                              </span>
                            </div>
                          )}

                          {/* Conta de Pagamento Google */}
                          {c.conta_pagamento && (
                            <div className="flex items-center justify-between">
                              <span className="text-[11px] text-[#64748B]">Conta Pagamento:</span>
                              <span className="font-semibold text-[#0F172A] truncate max-w-[140px]" title={c.conta_pagamento}>
                                {c.conta_pagamento}
                              </span>
                            </div>
                          )}

                          {/* Limite Restante (Orçamento da conta) */}
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] text-[#64748B]">Limite Restante:</span>
                            <span className={`font-mono font-bold ${isLimiteBaixo ? 'text-rose-700' : 'text-[#0F172A]'}`}>
                              {hasLimite ? formatBRL(c.limite_restante) : '—'}
                            </span>
                          </div>

                          {!isLimiteOrcamento && !isAutomatico && !hasLimite && !c.conta_pagamento && (
                            <p className="text-[10px] text-[#94A3B8] italic">
                              Aguardando sincronização de faturamento (Google às 23:35 BRT).
                            </p>
                          )}

                          {/* Alerta em Vermelho quando saldo < 50 ou limite < 50 */}
                          {isSaldoBaixo && (
                            <div className="mt-1.5 p-1.5 rounded-lg bg-rose-100 border border-rose-300 text-[10px] font-bold text-rose-800 flex items-center gap-1.5">
                              <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                              <span>Alerta: Saldo estimado crítico (&lt; R$ 50,00).</span>
                            </div>
                          )}

                          {isLimiteBaixo && !isSaldoBaixo && (
                            <div className="mt-1.5 p-1.5 rounded-lg bg-rose-100 border border-rose-300 text-[10px] font-bold text-rose-800 flex items-center gap-1.5">
                              <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                              <span>Alerta: Limite restante crítico (&lt; R$ 50,00).</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Botão de Acesso Direto ao Faturamento no Google Ads */}
                      <div className="mt-3 pt-2 border-t border-[#E2E8F0]/80">
                        <a
                          href={googleBillingUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full py-1.5 px-2.5 rounded-lg bg-white hover:bg-[#EFF4FF] border border-[#CBD5E1] hover:border-[#BFDBFE] text-[#0050FF] font-semibold text-[11px] transition-all flex items-center justify-center gap-1.5 shadow-2xs group cursor-pointer"
                        >
                          <span>Faturamento no Google Ads</span>
                          <ExternalLink className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Subtabs Google: Campanhas, Anúncios & Destinos, PMax Recursos, Palavras-chave, Termos de Busca */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-[#E2E8F0] pb-3">
            <div className="flex flex-wrap bg-[#F1F5F9] border border-[#E2E8F0] rounded-xl p-1 text-xs gap-1">
              <button
                onClick={() => setGoogleSubTab('campaigns')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  googleSubTab === 'campaigns'
                    ? 'bg-white text-[#0050FF] border border-[#BFDBFE] shadow-xs'
                    : 'text-[#64748B] hover:text-[#0F172A]'
                }`}
              >
                <span>📂</span> Campanhas ({filteredGoogleCampanhas.length})
              </button>
              <button
                onClick={() => setGoogleSubTab('anuncios')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  googleSubTab === 'anuncios'
                    ? 'bg-white text-[#0050FF] border border-[#BFDBFE] shadow-xs'
                    : 'text-[#64748B] hover:text-[#0F172A]'
                }`}
              >
                <span>📢</span> Anúncios & Destinos ({filteredGoogleAnuncios.length})
              </button>
              <button
                onClick={() => setGoogleSubTab('grupos_recursos')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  googleSubTab === 'grupos_recursos'
                    ? 'bg-white text-[#0050FF] border border-[#BFDBFE] shadow-xs'
                    : 'text-[#64748B] hover:text-[#0F172A]'
                }`}
              >
                <span>⚡</span> PMax Recursos ({filteredGoogleGruposRecursos.length})
              </button>
              <button
                onClick={() => setGoogleSubTab('palavras_chave')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  googleSubTab === 'palavras_chave'
                    ? 'bg-white text-[#0050FF] border border-[#BFDBFE] shadow-xs'
                    : 'text-[#64748B] hover:text-[#0F172A]'
                }`}
              >
                <span>🎯</span> Palavras-chave ({filteredGooglePalavrasChave.length})
              </button>
              <button
                onClick={() => setGoogleSubTab('search_terms')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  googleSubTab === 'search_terms'
                    ? 'bg-white text-[#0050FF] border border-[#BFDBFE] shadow-xs'
                    : 'text-[#64748B] hover:text-[#0F172A]'
                }`}
              >
                <span>🔍</span> Termos de Busca ({filteredSearchTerms.length})
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-xs">
              <span className="text-[10px] text-[#64748B] font-medium bg-[#F8FAFC] px-2.5 py-1 rounded-full border border-[#E2E8F0]">
                Sync diário: Google às 23:35 (BRT)
              </span>
              <div className="text-[#64748B] font-mono">
                Gasto Total Google: <b className="text-[#0F172A]">{formatBRL(Number(googleData?.totais?.gasto || 0))}</b>
              </div>
            </div>
          </div>

          {/* Subtab 1: Campanhas Google */}
          {googleSubTab === 'campaigns' && (
            <div className="bg-white border border-[#E2E8F0] rounded-2xl shadow-xs overflow-hidden">
              <div className="p-4 border-b border-[#E2E8F0] flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-[#0F172A]">Campanhas no Google Ads (Search & PMax)</h3>
                  <p className="text-xs text-[#64748B]">Gasto em reais, cliques, impressões, CPC e conversões</p>
                </div>
                <span className="text-xs font-mono text-[#0050FF] font-bold bg-[#EFF4FF] px-2.5 py-0.5 rounded-full border border-[#BFDBFE]">
                  {filteredGoogleCampanhas.length} campanhas
                </span>
              </div>

              {filteredGoogleCampanhas.length === 0 ? (
                <div className="p-8 text-center text-[#64748B] text-xs">
                  {loading ? 'Carregando campanhas...' : 'Nenhuma campanha Google encontrada para este cliente.'}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className="border-b border-[#E2E8F0] text-[#64748B] bg-[#F8FAFC]">
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
                    <tbody className="divide-y divide-[#E2E8F0] bg-white">
                      {filteredGoogleCampanhas.map((c: any) => (
                        <tr key={c.campaign_id} className="hover:bg-[#F8FAFC] transition-colors">
                          <td className="py-3 px-4">
                            {renderStatusBadge(c.status)}
                          </td>
                          <td className="py-3 px-4">
                            <p className="font-bold text-[#0F172A] max-w-xs truncate" title={c.nome}>
                              {c.nome}
                            </p>
                            <span className="text-[10px] text-[#64748B] font-mono">ID: {c.campaign_id}</span>
                          </td>
                          <td className="py-3 px-4 font-mono text-[#475569]">
                            {c.orcamento_diario ? formatBRL(c.orcamento_diario) + '/dia' : '—'}
                          </td>
                          <td className="py-3 px-4 font-mono font-bold text-[#0F172A]">{formatBRL(c.gasto)}</td>
                          <td className="py-3 px-4 font-mono text-[#475569]">{c.cliques}</td>
                          <td className="py-3 px-4 font-mono text-[#475569]">{Number(c.impressoes).toLocaleString('pt-BR')}</td>
                          <td className="py-3 px-4 font-mono text-[#475569]">{c.ctr}%</td>
                          <td className="py-3 px-4 font-mono text-[#475569]">{formatBRL(c.cpc)}</td>
                          <td className="py-3 px-4 font-mono font-bold text-emerald-600">{c.conversoes}</td>
                          <td className="py-3 px-4 font-mono text-[#0F172A]">
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

          {/* Subtab 2: Anúncios do Google Ads (public.painel_google_anuncios) */}
          {googleSubTab === 'anuncios' && (
            <div className="bg-white border border-[#E2E8F0] rounded-2xl shadow-xs overflow-hidden space-y-4">
              <div className="p-4 border-b border-[#E2E8F0] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-[#0F172A] flex items-center gap-2">
                    <span>📢</span> Anúncios do Google Ads & Destinos (URLs Finais)
                  </h3>
                  <p className="text-xs text-[#64748B]">
                    Títulos, descrições, URL de destino final e modelo de rastreamento de cada anúncio
                  </p>
                </div>

                <div className="relative w-full sm:w-72">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-[#94A3B8]" />
                  <input
                    type="text"
                    value={adsSearchFilter}
                    onChange={(e) => setAdsSearchFilter(e.target.value)}
                    placeholder="Filtrar por anúncio, campanha ou título..."
                    className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl pl-8 pr-3 py-1.5 text-xs text-[#0F172A] focus:outline-none focus:border-[#0050FF]"
                  />
                </div>
              </div>

              {filteredGoogleAnuncios.length === 0 ? (
                <div className="p-8 text-center text-[#64748B] text-xs">
                  {loading ? 'Carregando anúncios...' : 'Nenhum anúncio Google encontrado para este cliente.'}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className="border-b border-[#E2E8F0] text-[#64748B] bg-[#F8FAFC]">
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4">Campanha / Grupo</th>
                        <th className="py-3 px-4">Anúncio</th>
                        <th className="py-3 px-4">Títulos & Descrições</th>
                        <th className="py-3 px-4">URL Final (Destino)</th>
                        <th className="py-3 px-4">URL Mobile</th>
                        <th className="py-3 px-4">Rastreamento</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E2E8F0] bg-white">
                      {filteredGoogleAnuncios.map((ad: any, idx: number) => {
                        const titulosList = Array.isArray(ad.titulos) ? ad.titulos : ad.titulos ? [ad.titulos] : [];
                        const descList = Array.isArray(ad.descricoes) ? ad.descricoes : ad.descricoes ? [ad.descricoes] : [];
                        const isEnabled = String(ad.status).toUpperCase() === 'ENABLED';

                        return (
                          <tr key={ad.ad_id || idx} className="hover:bg-[#F8FAFC] transition-colors">
                            <td className="py-3 px-4">
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
                            </td>

                            <td className="py-3 px-4 max-w-xs">
                              <p className="font-bold text-[#0F172A] truncate" title={ad.campanha_nome || ad.campanha}>
                                {ad.campanha_nome || ad.campanha || 'Campanha'}
                              </p>
                              <p className="text-[11px] text-[#64748B] truncate" title={ad.grupo_nome || ad.grupo}>
                                📁 {ad.grupo_nome || ad.grupo || 'Grupo'}
                              </p>
                            </td>

                            <td className="py-3 px-4">
                              <p className="font-mono text-[#0F172A] font-bold">ID: {ad.ad_id}</p>
                              <span className="text-[10px] font-semibold text-[#0050FF] bg-[#EFF4FF] px-2 py-0.5 rounded border border-[#BFDBFE]">
                                {ad.tipo || 'RESPONSIVE_SEARCH_AD'}
                              </span>
                            </td>

                            <td className="py-3 px-4 min-w-[280px] max-w-sm space-y-1.5">
                              {titulosList.length > 0 && (
                                <div className="space-y-0.5">
                                  <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748B]">Títulos:</span>
                                    <span className="text-[10px] font-semibold text-[#0050FF] bg-[#EFF4FF] px-1.5 py-0.5 rounded border border-[#BFDBFE]">
                                      {titulosList.length} títulos
                                    </span>
                                  </div>
                                  <p className="text-[#0F172A] font-medium leading-snug truncate" title={titulosList.join(' • ')}>
                                    {titulosList.slice(0, 2).join(' • ')}
                                  </p>
                                </div>
                              )}
                              {descList.length > 0 && (
                                <div className="space-y-0.5">
                                  <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748B]">Descrições:</span>
                                    <span className="text-[10px] font-semibold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                                      {descList.length} descrições
                                    </span>
                                  </div>
                                  <p className="text-[#475569] text-[11px] italic leading-snug truncate" title={descList.join(' • ')}>
                                    {descList[0]}
                                  </p>
                                </div>
                              )}
                              {titulosList.length === 0 && descList.length === 0 ? (
                                <span className="text-[#94A3B8] font-mono text-[11px]">—</span>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => setSelectedGoogleAdModal(ad)}
                                  className="mt-1 w-full inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-[#EFF4FF] hover:bg-[#DBEAFE] text-[#0050FF] border border-[#BFDBFE] transition-all shadow-2xs cursor-pointer group"
                                  title="Abrir popup com todos os títulos e descrições completos e simulação de busca"
                                >
                                  <Eye className="w-3.5 h-3.5 text-[#0050FF] group-hover:scale-110 transition-transform" />
                                  <span>Ver Títulos & Descrições ({titulosList.length + descList.length})</span>
                                </button>
                              )}
                            </td>

                            <td className="py-3 px-4">
                              {renderUrlsList(ad.urls_finais)}
                            </td>

                            <td className="py-3 px-4">
                              {renderUrlsList(ad.urls_mobile)}
                            </td>

                            <td className="py-3 px-4 max-w-[180px]">
                              {ad.tracking_url_template ? (
                                <span
                                  className="font-mono text-[10px] bg-[#F1F5F9] border border-[#CBD5E1] px-2 py-1 rounded text-[#0F172A] truncate block"
                                  title={ad.tracking_url_template}
                                >
                                  {ad.tracking_url_template}
                                </span>
                              ) : (
                                <span className="text-[#94A3B8] font-mono text-[11px]">—</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Subtab 3: Grupos de Recursos Performance Max (public.painel_google_grupos_recursos) */}
          {googleSubTab === 'grupos_recursos' && (
            <div className="bg-white border border-[#E2E8F0] rounded-2xl shadow-xs overflow-hidden space-y-4">
              <div className="p-4 border-b border-[#E2E8F0] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-[#0F172A] flex items-center gap-2">
                    <span>⚡</span> Grupos de Recursos (Performance Max — PMax)
                  </h3>
                  <p className="text-xs text-[#64748B]">
                    Status de veiculação, força do anúncio (Ad Strength) e URLs finais configuradas
                  </p>
                </div>

                <div className="relative w-full sm:w-72">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-[#94A3B8]" />
                  <input
                    type="text"
                    value={assetGroupsSearchFilter}
                    onChange={(e) => setAssetGroupsSearchFilter(e.target.value)}
                    placeholder="Filtrar grupos de recursos ou campanha..."
                    className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl pl-8 pr-3 py-1.5 text-xs text-[#0F172A] focus:outline-none focus:border-[#0050FF]"
                  />
                </div>
              </div>

              {filteredGoogleGruposRecursos.length === 0 ? (
                <div className="p-8 text-center text-[#64748B] text-xs">
                  {loading ? 'Carregando grupos de recursos...' : 'Nenhum grupo de recursos PMax encontrado para este cliente.'}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className="border-b border-[#E2E8F0] text-[#64748B] bg-[#F8FAFC]">
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4">Campanha</th>
                        <th className="py-3 px-4">Grupo de Recursos</th>
                        <th className="py-3 px-4">Força do Anúncio (Strength)</th>
                        <th className="py-3 px-4">URLs Finais (Destino)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E2E8F0] bg-white">
                      {filteredGoogleGruposRecursos.map((gr: any, idx: number) => {
                        const isEnabled = String(gr.status).toUpperCase() === 'ENABLED';
                        const strength = String(gr.ad_strength || '').toUpperCase();

                        return (
                          <tr key={gr.asset_group_id || idx} className="hover:bg-[#F8FAFC] transition-colors">
                            <td className="py-3 px-4">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold border inline-flex items-center gap-1 ${
                                  isEnabled
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                    : 'bg-slate-100 text-slate-600 border-slate-200'
                                }`}
                              >
                                <span className={`w-1.5 h-1.5 rounded-full ${isEnabled ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                                {isEnabled ? 'Ativo' : gr.status || 'Pausado'}
                              </span>
                            </td>

                            <td className="py-3 px-4 font-bold text-[#0F172A]">
                              {gr.campanha_nome || 'Campanha PMax'}
                            </td>

                            <td className="py-3 px-4">
                              <p className="font-bold text-[#0050FF]">{gr.nome || 'Grupo de Recursos'}</p>
                              <span className="text-[10px] text-[#64748B] font-mono">ID: {gr.asset_group_id}</span>
                            </td>

                            <td className="py-3 px-4">
                              <span
                                className={`px-2.5 py-1 rounded-md text-[10px] font-bold border ${
                                  strength === 'EXCELLENT'
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                    : strength === 'GOOD'
                                    ? 'bg-blue-50 text-blue-700 border-blue-200'
                                    : strength === 'AVERAGE'
                                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                                    : strength === 'POOR'
                                    ? 'bg-rose-50 text-rose-700 border-rose-200'
                                    : 'bg-slate-100 text-slate-700 border-slate-200'
                                }`}
                              >
                                {strength || 'PENDENTE'}
                              </span>
                            </td>

                            <td className="py-3 px-4">
                              {renderUrlsList(gr.urls_finais)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Subtab 4: Palavras-chave do Google Ads (public.painel_google_palavras_chave) */}
          {googleSubTab === 'palavras_chave' && (
            <div className="bg-white border border-[#E2E8F0] rounded-2xl shadow-xs overflow-hidden space-y-4">
              <div className="p-4 border-b border-[#E2E8F0] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-[#0F172A] flex items-center gap-2">
                    <span>🎯</span> Palavras-chave do Google Ads & Destinos
                  </h3>
                  <p className="text-xs text-[#64748B]">
                    Correspondência, qualidade e URL de destino (quando vazia, herda o link do anúncio do grupo)
                  </p>
                </div>

                <div className="relative w-full sm:w-72">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-[#94A3B8]" />
                  <input
                    type="text"
                    value={keywordsSearchFilter}
                    onChange={(e) => setKeywordsSearchFilter(e.target.value)}
                    placeholder="Filtrar por palavra-chave, campanha ou grupo..."
                    className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl pl-8 pr-3 py-1.5 text-xs text-[#0F172A] focus:outline-none focus:border-[#0050FF]"
                  />
                </div>
              </div>

              {filteredGooglePalavrasChave.length === 0 ? (
                <div className="p-8 text-center text-[#64748B] text-xs">
                  {loading ? 'Carregando palavras-chave...' : 'Nenhuma palavra-chave encontrada para este cliente.'}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className="border-b border-[#E2E8F0] text-[#64748B] bg-[#F8FAFC]">
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4">Palavra-chave</th>
                        <th className="py-3 px-4">Correspondência</th>
                        <th className="py-3 px-4">Campanha / Grupo</th>
                        <th className="py-3 px-4">Índice de Qualidade</th>
                        <th className="py-3 px-4">URL de Destino Final</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E2E8F0] bg-white">
                      {filteredGooglePalavrasChave.map((pk: any, idx: number) => {
                        const isEnabled = String(pk.status).toUpperCase() === 'ENABLED';
                        const isHerdado = pk.origem_url === 'herdada_grupo';

                        return (
                          <tr key={pk.criterion_id || idx} className="hover:bg-[#F8FAFC] transition-colors">
                            <td className="py-3 px-4">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold border inline-flex items-center gap-1 ${
                                  isEnabled
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                    : 'bg-slate-100 text-slate-600 border-slate-200'
                                }`}
                              >
                                <span className={`w-1.5 h-1.5 rounded-full ${isEnabled ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                                {isEnabled ? 'Ativa' : pk.status || 'Pausada'}
                              </span>
                            </td>

                            <td className="py-3 px-4">
                              <p className="font-bold text-[#0F172A] font-mono">{pk.texto}</p>
                              <span className="text-[10px] text-[#64748B] font-mono">ID: {pk.criterion_id}</span>
                            </td>

                            <td className="py-3 px-4">
                              <span className="px-2 py-0.5 rounded font-mono font-semibold text-[10px] bg-[#F1F5F9] text-[#475569] border border-[#CBD5E1]">
                                {pk.match_type || 'BROAD'}
                              </span>
                            </td>

                            <td className="py-3 px-4 max-w-xs">
                              <p className="font-bold text-[#0F172A] truncate" title={pk.campanha_nome}>
                                {pk.campanha_nome || 'Campanha'}
                              </p>
                              <p className="text-[11px] text-[#64748B] truncate" title={pk.grupo_nome}>
                                📁 {pk.grupo_nome || 'Grupo'}
                              </p>
                            </td>

                            <td className="py-3 px-4">
                              {pk.quality_score ? (
                                <span className="font-bold text-[#0F172A] font-mono bg-[#F8FAFC] px-2 py-0.5 rounded border border-[#E2E8F0]">
                                  {pk.quality_score}/10
                                </span>
                              ) : (
                                <span className="text-[#94A3B8] font-mono text-[11px]">—</span>
                              )}
                            </td>

                            <td className="py-3 px-4">
                              {renderUrlsList(
                                pk.urls_finais,
                                isHerdado ? '🔗 Destino herdado do grupo' : undefined
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Subtab 5: Relatório de Termos de Busca Reais (Search Terms Report) */}
          {googleSubTab === 'search_terms' && (
            <div className="space-y-4">
              {/* KPI Cards dos Termos de Busca Reais */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white border border-[#E2E8F0] p-4 rounded-2xl shadow-xs space-y-1">
                  <span className="text-xs font-semibold text-[#64748B] uppercase tracking-wider">Termos no Período</span>
                  <p className="text-2xl font-black text-[#0F172A]">{filteredSearchTerms.length}</p>
                  <p className="text-[10px] text-emerald-600 font-semibold">↑ {searchTermsSource.length} termos auditados no leilão</p>
                </div>

                <div className="bg-white border border-[#E2E8F0] p-4 rounded-2xl shadow-xs space-y-1">
                  <span className="text-xs font-semibold text-[#64748B] uppercase tracking-wider">Custo em Pesquisa</span>
                  <p className="text-2xl font-black text-[#0F172A]">
                    {formatBRL(searchTermsSource.reduce((acc: number, t: any) => acc + (t.custo || 0), 0))}
                  </p>
                  <p className="text-[10px] text-[#64748B]">
                    CPC Médio: {formatBRL(Number(googleData?.totais?.cpc || 0))}
                  </p>
                </div>

                <div className="bg-white border border-[#E2E8F0] p-4 rounded-2xl shadow-xs space-y-1">
                  <span className="text-xs font-semibold text-[#64748B] uppercase tracking-wider">Conversões Diretas</span>
                  <p className="text-2xl font-black text-emerald-600">
                    {searchTermsSource.reduce((acc: number, t: any) => acc + (t.conversoes || 0), 0).toLocaleString('pt-BR')}
                  </p>
                  <p className="text-[10px] text-[#64748B]">
                    Taxa Conv. Média: {googleData?.totais?.ctr ? `${googleData.totais.ctr}%` : '—'}
                  </p>
                </div>

                <div className="bg-white border border-[#E2E8F0] p-4 rounded-2xl shadow-xs space-y-1">
                  <span className="text-xs font-semibold text-[#64748B] uppercase tracking-wider">Possível Negativar</span>
                  <p className="text-2xl font-black text-rose-600">
                    {searchTermsSource.filter((t: any) => t.sugestao === 'possivel_negativar').length}
                  </p>
                  <p className="text-[10px] text-rose-600 font-medium">Com gasto no período e 0 conversões</p>
                </div>
              </div>

              {/* Tabela dos Termos Reais */}
              <div className="bg-white border border-[#E2E8F0] rounded-2xl shadow-xs overflow-hidden">
                <div className="p-4 border-b border-[#E2E8F0] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-bold text-[#0F172A]">Relatório de Termos de Busca Reais (Search Terms)</h3>
                      {googleData?.atualizado_em && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-[#F1F5F9] text-[#475569] border border-[#CBD5E1]">
                          Atualizado: {new Date(googleData.atualizado_em).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo', dateStyle: 'short', timeStyle: 'short' })}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[#64748B] mt-0.5">
                      Termos reais digitados no Google que acionaram anúncios de pesquisa no período selecionado (sem dados fictícios).
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-[#64748B] absolute left-3 top-2.5" />
                      <input
                        type="text"
                        placeholder="Filtrar termo digitado..."
                        value={searchTermFilter}
                        onChange={(e) => setSearchTermFilter(e.target.value)}
                        className="bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg pl-8 pr-3 py-1.5 text-xs text-[#0F172A] placeholder-[#94A3B8] w-56 focus:outline-none focus:border-[#0050FF]"
                      />
                    </div>
                  </div>
                </div>

                {filteredSearchTerms.length === 0 ? (
                  <div className="p-12 text-center text-[#64748B] text-xs">
                    Nenhum termo de busca com veiculação registrada para este cliente no período selecionado.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead>
                        <tr className="border-b border-[#E2E8F0] text-[#64748B] bg-[#F8FAFC]">
                          <th className="py-3 px-4">Termo Real Digitado</th>
                          <th className="py-3 px-4">Campanha</th>
                          <th className="py-3 px-4">Palavra-Chave Acionada</th>
                          <th className="py-3 px-4">Match</th>
                          <th className="py-3 px-4">Impressões</th>
                          <th className="py-3 px-4">Cliques</th>
                          <th className="py-3 px-4">CTR</th>
                          <th className="py-3 px-4">CPC</th>
                          <th className="py-3 px-4">Gasto Total</th>
                          <th className="py-3 px-4">Conversões</th>
                          <th className="py-3 px-4">Diagnóstico</th>
                          <th className="py-3 px-4">Ação</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E2E8F0] bg-white">
                        {filteredSearchTerms.map((t: any) => {
                          const isNeg = negativados[t.id];
                          return (
                            <tr key={t.id} className={`hover:bg-[#F8FAFC] transition-colors ${isNeg ? 'bg-rose-50/50' : ''}`}>
                              {/* TERMO REAL DIGITADO */}
                              <td className="py-3 px-4 font-semibold text-[#0F172A]">
                                "{t.termo}"
                                {isNeg && <span className="ml-2 text-[10px] text-rose-600 font-bold">(Negativado)</span>}
                              </td>

                              {/* CAMPANHA */}
                              <td className="py-3 px-4">
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#EFF4FF] text-[#0050FF] border border-[#BFDBFE] inline-block max-w-[140px] truncate" title={t.campanha}>
                                  {t.campanha}
                                </span>
                              </td>

                              {/* PALAVRA-CHAVE */}
                              <td className="py-3 px-4 font-mono text-[#475569]">{t.kw}</td>

                              {/* CORRESPONDENCIA */}
                              <td className="py-3 px-4">
                                <span
                                  className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                                    t.match === 'Exata'
                                      ? 'bg-[#EFF4FF] text-[#0050FF] border-[#BFDBFE]'
                                      : t.match === 'Frase'
                                      ? 'bg-blue-50 text-blue-700 border-blue-200'
                                      : 'bg-amber-50 text-amber-700 border-amber-200'
                                  }`}
                                >
                                  {t.match}
                                </span>
                              </td>

                              {/* MÉTRICAS */}
                              <td className="py-3 px-4 font-mono text-[#475569]">{t.impressoes}</td>
                              <td className="py-3 px-4 font-mono text-[#475569]">{t.cliques}</td>
                              <td className="py-3 px-4 font-mono text-[#475569]">{t.ctr}</td>
                              <td className="py-3 px-4 font-mono text-[#475569]">{t.cpc}</td>
                              <td className="py-3 px-4 font-mono font-bold text-[#0F172A]">{formatBRL(t.custo)}</td>
                              <td className="py-3 px-4 font-mono font-bold text-emerald-600">{t.conversoes}</td>

                              {/* DIAGNÓSTICO / SUGESTÃO INTELIGENTE */}
                              <td className="py-3 px-4">
                                {t.sugestao === 'possivel_negativar' ? (
                                  <span
                                    className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 whitespace-nowrap"
                                    title="Termo com gasto e zero conversões no período (sugestão visual)"
                                  >
                                    ⚠️ Possível Negativar
                                  </span>
                                ) : t.sugestao === 'possivel_nova_kw' ? (
                                  <span
                                    className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 whitespace-nowrap"
                                    title="Termo com conversão e ainda não adicionado como palavra-chave (sugestão visual)"
                                  >
                                    ⭐ Nova Palavra
                                  </span>
                                ) : t.sugestao === 'adicionada' ? (
                                  <span
                                    className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#EFF4FF] text-[#0050FF] border border-[#BFDBFE] whitespace-nowrap"
                                    title="Termo já cadastrado como palavra-chave na conta"
                                  >
                                    ✓ Na Conta
                                  </span>
                                ) : (
                                  <span className="text-[#94A3B8] font-mono text-[11px]">—</span>
                                )}
                              </td>

                              {/* AÇÃO: MARCAR NEGATIVADO LOCAL */}
                              <td className="py-3 px-4">
                                <button
                                  onClick={() => handleNegativeTerm(t.id)}
                                  className={`px-2.5 py-1 rounded text-[11px] font-bold border flex items-center gap-1 transition-all cursor-pointer ${
                                    isNeg
                                      ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                                      : 'bg-white hover:bg-rose-50 text-[#475569] hover:text-rose-600 border-[#CBD5E1]'
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
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* POPUP MODAL COM PRÉVIA DO ANÚNCIO REAL (CARROSSEL, REELS E ESTÁTICO) */}
      <CreativePreviewModal
        creative={selectedCreativeModal}
        onClose={() => setSelectedCreativeModal(null)}
      />

      {/* POPUP MODAL COM TÍTULOS E DESCRIÇÕES COMPLETOS DO GOOGLE ADS */}
      <GoogleAdDetailModal
        ad={selectedGoogleAdModal}
        onClose={() => setSelectedGoogleAdModal(null)}
      />

      {/* POPUP MODAL COM LISTA DETALHADA DE LEADS E NOMES DE FORMULÁRIO */}
      {leadsDrilldown && (
        <LeadsDrilldownModal
          isOpen={leadsDrilldown.isOpen}
          onClose={() => setLeadsDrilldown(null)}
          title={leadsDrilldown.title}
          type={leadsDrilldown.type}
          leadsCount={leadsDrilldown.count}
          initialLeads={leadsDrilldown.initialLeads}
        />
      )}
    </div>
  );
}

export default function MidiaPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-xs font-semibold text-[#64748B]">
          Carregando Tráfego & Mídia...
        </div>
      }
    >
      <MidiaContent />
    </Suspense>
  );
}
