'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTenant } from '@/components/TenantProvider';
import {
  Building,
  KanbanSquare,
  Save,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Eye,
  EyeOff,
  FolderTree,
  MessageSquare,
  Zap,
  Users,
  UserPlus,
  ExternalLink,
  ArrowLeft,
  Search,
  Filter,
  CreditCard,
  Wallet,
  AlertTriangle,
  Copy,
  Check,
  ChevronRight,
  Layers,
  ArrowUpRight,
  Sparkles,
} from 'lucide-react';
import Link from 'next/link';
import { ContaAdsPainel, Cliente, KommoPipelineResumo } from '@/types/database';

function ClientCredentialsContent() {
  const searchParams = useSearchParams();
  const {
    clients,
    activeClient,
    selectedClientId,
    setSelectedClientId,
    users,
    invites,
    isMasterAdmin,
    isAuthChecked,
  } = useTenant();

  // Estados principais
  const [allContasAds, setAllContasAds] = useState<ContaAdsPainel[]>([]);
  const [kommoPipelines, setKommoPipelines] = useState<KommoPipelineResumo[]>([]);
  const [isLoadingContas, setIsLoadingContas] = useState(true);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // Tabs de visualização da página
  const [mainView, setMainView] = useState<'matrix' | 'client_detail'>(
    selectedClientId === 'ALL' ? 'matrix' : 'client_detail'
  );

  // Filtros da Matriz Geral
  const [matrixFilterType, setMatrixFilterType] = useState<'all' | 'meta' | 'google' | 'crm' | 'whatsapp' | 'drive'>('all');
  const [matrixSearch, setMatrixSearch] = useState('');
  const [onlyAlerts, setOnlyAlerts] = useState(false);

  // Formulário Kommo CRM do cliente selecionado
  const [subdomain, setSubdomain] = useState('');
  const [token, setToken] = useState('');
  const [pipelineId, setPipelineId] = useState('');
  const [showToken, setShowToken] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Aba interna do detalhe do cliente
  const [clientDetailTab, setClientDetailTab] = useState<'ads' | 'crm' | 'channels' | 'team'>('ads');

  // Sincroniza query param inicial ?client=XYZ se existir
  useEffect(() => {
    const clientParam = searchParams.get('client');
    if (clientParam) {
      setSelectedClientId(clientParam);
      setMainView(clientParam === 'ALL' ? 'matrix' : 'client_detail');
    }
  }, [searchParams, setSelectedClientId]);

  // Carrega todas as contas de anúncio e funis do Kommo diretamente do bootstrap
  useEffect(() => {
    async function loadAllAccounts() {
      setIsLoadingContas(true);
      try {
        const res = await fetch('/api/bootstrap');
        const data = await res.json();
        if (data.success) {
          if (Array.isArray(data.contasAds)) setAllContasAds(data.contasAds);
          if (Array.isArray(data.kommoPipelines)) setKommoPipelines(data.kommoPipelines);
        }
      } catch (err) {
        console.error('Falha ao carregar contas de anúncio e Kommo:', err);
      } finally {
        setIsLoadingContas(false);
      }
    }
    loadAllAccounts();
  }, []);

  // Carrega credenciais Kommo do cliente selecionado
  useEffect(() => {
    if (selectedClientId && selectedClientId !== 'ALL') {
      setSubdomain(selectedClientId.toLowerCase().replace(/_/g, ''));
      setToken('');
      setPipelineId('');
      setFeedback(null);

      // Busca credenciais salvas no banco
      fetch(`/api/credentials/client?cliente_id=${encodeURIComponent(selectedClientId)}`)
        .then((r) => r.json())
        .then((d) => {
          if (d.success && d.credentials) {
            if (d.credentials.kommo_subdomain) setSubdomain(d.credentials.kommo_subdomain);
            if (d.credentials.kommo_token) setToken(d.credentials.kommo_token);
            if (d.credentials.kommo_pipeline_id) setPipelineId(d.credentials.kommo_pipeline_id);
          }
        })
        .catch(() => {});
    }
  }, [selectedClientId]);

  // Sincroniza visualização com o seletor
  const handleClientSelectChange = (newClientId: string) => {
    setSelectedClientId(newClientId);
    if (newClientId === 'ALL') {
      setMainView('matrix');
    } else {
      setMainView('client_detail');
    }
  };

  const handleCopy = (text: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const handleSaveKommo = async () => {
    if (!selectedClientId || selectedClientId === 'ALL') {
      alert('Selecione um cliente específico para salvar o Kommo CRM.');
      return;
    }
    setIsSaving(true);
    setFeedback(null);
    try {
      const res = await fetch('/api/credentials/client', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cliente_id: selectedClientId,
          kommo_subdomain: subdomain,
          kommo_token: token,
          kommo_pipeline_id: pipelineId,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setFeedback({ type: 'success', text: data.message });
      } else {
        setFeedback({ type: 'error', text: data.error || 'Erro ao salvar credenciais do Kommo.' });
      }
    } catch {
      setFeedback({ type: 'error', text: 'Falha de comunicação ao salvar credenciais do Kommo.' });
    } finally {
      setIsSaving(false);
    }
  };

  // Mapeamento rápido de cliente_id para objeto Cliente
  const clientsMap = useMemo(() => {
    const map = new Map<string, Cliente>();
    clients.forEach((c) => map.set(c.cliente_id, c));
    return map;
  }, [clients]);

  // Contas do cliente atualmente selecionado
  const selectedClientAccounts = useMemo(() => {
    if (!selectedClientId || selectedClientId === 'ALL') return [];
    return allContasAds.filter((a) => a.cliente_id === selectedClientId);
  }, [allContasAds, selectedClientId]);

  const selectedClientMeta = useMemo(
    () => selectedClientAccounts.filter((a) => a.plataforma === 'meta'),
    [selectedClientAccounts]
  );
  const selectedClientGoogle = useMemo(
    () => selectedClientAccounts.filter((a) => a.plataforma === 'google'),
    [selectedClientAccounts]
  );

  // Pipelines do cliente selecionado no Kommo
  const selectedClientKommoPipelines = useMemo(() => {
    if (!selectedClientId || selectedClientId === 'ALL') return [];
    return kommoPipelines.filter((k) => k.cliente_id === selectedClientId);
  }, [kommoPipelines, selectedClientId]);

  // Usuários e convites do cliente selecionado
  const clientUsers = useMemo(
    () => users.filter((u) => u.cliente_id === selectedClientId),
    [users, selectedClientId]
  );
  const clientInvites = useMemo(
    () => invites.filter((i) => i.cliente_id === selectedClientId),
    [invites, selectedClientId]
  );

  // Totais & Métricas Gerais para o Topo (KPIs)
  const stats = useMemo(() => {
    const totalContas = allContasAds.length;
    const totalMeta = allContasAds.filter((a) => a.plataforma === 'meta').length;
    const totalGoogle = allContasAds.filter((a) => a.plataforma === 'google').length;
    const totalKommo = kommoPipelines.length;
    const totalWhatsapp = clients.filter((c) => !!c.grupo_whatsapp_id).length;
    const totalDrive = clients.filter((c) => !!c.drive_folder_id).length;

    let alertasCount = 0;
    allContasAds.forEach((a) => {
      const isPre = a.tipo_pagamento === 'pre_paga' || a.tipo_pagamento === 'limite_orcamento';
      const saldo = Number(a.saldo_disponivel);
      const limite = Number(a.limite_restante);
      const saldoBaixo = isPre && a.saldo_disponivel !== null && a.saldo_disponivel !== undefined && saldo < 50;
      const limiteBaixo = a.limite_restante !== null && a.limite_restante !== undefined && limite < 50;
      if (saldoBaixo || limiteBaixo) alertasCount++;
    });

    return { totalContas, totalMeta, totalGoogle, totalKommo, totalWhatsapp, totalDrive, alertasCount };
  }, [allContasAds, kommoPipelines, clients]);

  // Lista da Matriz Geral com Filtros e Busca
  const matrixItems = useMemo(() => {
    const query = matrixSearch.trim().toLowerCase();

    // 1. Contas de Anúncio (Meta e Google)
    const adRows = allContasAds.map((a) => {
      const clientObj = clientsMap.get(a.cliente_id);
      const clientName = clientObj?.nome || a.cliente_id;
      const isPre = a.tipo_pagamento === 'pre_paga' || a.tipo_pagamento === 'limite_orcamento';
      const saldo = Number(a.saldo_disponivel);
      const limite = Number(a.limite_restante);
      const isSaldoBaixo = isPre && a.saldo_disponivel !== null && a.saldo_disponivel !== undefined && saldo < 50;
      const isLimiteBaixo = a.limite_restante !== null && a.limite_restante !== undefined && limite < 50;
      const hasAlert = isSaldoBaixo || isLimiteBaixo;

      // Link oficial de faturamento
      let billingUrl = '';
      if (a.plataforma === 'meta') {
        const cleanAct = String(a.account_id || '').replace(/^act_/, '').trim();
        billingUrl = `https://adsmanager.facebook.com/ads/manager/billing/payment_settings?act=${cleanAct}`;
      } else {
        const cleanCid = String(a.account_id || '').replace(/[^0-9]/g, '').trim();
        billingUrl = cleanCid ? `https://ads.google.com/aw/billing/summary?ocid=${cleanCid}` : 'https://ads.google.com/aw/billing/summary';
      }

      return {
        id: `ad_${a.plataforma}_${a.account_id}`,
        tipo: a.plataforma === 'meta' ? ('meta' as const) : ('google' as const),
        tipoLabel: a.plataforma === 'meta' ? 'Meta Ads' : 'Google Ads',
        nome: a.nome,
        identificador: a.account_id,
        clienteId: a.cliente_id,
        clienteNome: clientName,
        status: a.status || 'ACTIVE',
        tipoPagamento: a.tipo_pagamento,
        saldo: a.saldo_disponivel,
        limite: a.limite_restante,
        cartaoFinal: a.cartao_final,
        contaPagamento: a.conta_pagamento,
        hasAlert,
        billingUrl,
      };
    });

    // 2. Kommo CRM (Funis e Pipelines Mapeados no Supabase)
    const kommoRows = kommoPipelines.map((k) => {
      const clientObj = clientsMap.get(k.cliente_id);
      const clientName = clientObj?.nome || k.cliente_id;
      const sub = k.cliente_id.toLowerCase().replace(/_/g, '');
      return {
        id: `crm_${k.cliente_id}_${k.pipeline_id}`,
        tipo: 'crm' as const,
        tipoLabel: 'Kommo CRM',
        nome: `Funil: ${k.pipeline_nome}`,
        identificador: `Funil ID: ${k.pipeline_id}`,
        clienteId: k.cliente_id,
        clienteNome: clientName,
        status: 'ACTIVE',
        tipoPagamento: `${k.etapas_count} etapas mapeadas`,
        saldo: null,
        limite: null,
        cartaoFinal: null,
        contaPagamento: null,
        hasAlert: false,
        billingUrl: `https://${sub}.kommo.com/leads/pipeline/${k.pipeline_id}`,
      };
    });

    // 3. Grupos de WhatsApp
    const whatsappRows = clients
      .filter((c) => !!c.grupo_whatsapp_id)
      .map((c) => ({
        id: `wa_${c.cliente_id}`,
        tipo: 'whatsapp' as const,
        tipoLabel: 'WhatsApp Operação',
        nome: `Grupo WhatsApp - ${c.nome}`,
        identificador: c.grupo_whatsapp_id as string,
        clienteId: c.cliente_id,
        clienteNome: c.nome,
        status: c.status === 'ativo' ? 'ACTIVE' : 'INACTIVE',
        tipoPagamento: null,
        saldo: null,
        limite: null,
        cartaoFinal: null,
        contaPagamento: null,
        hasAlert: false,
        billingUrl: '',
      }));

    // 4. Pastas Google Drive
    const driveRows = clients
      .filter((c) => !!c.drive_folder_id)
      .map((c) => ({
        id: `drive_${c.cliente_id}`,
        tipo: 'drive' as const,
        tipoLabel: 'Google Drive',
        nome: `Pasta de Criativos - ${c.nome}`,
        identificador: c.drive_folder_id as string,
        clienteId: c.cliente_id,
        clienteNome: c.nome,
        status: 'ACTIVE',
        tipoPagamento: null,
        saldo: null,
        limite: null,
        cartaoFinal: null,
        contaPagamento: null,
        hasAlert: false,
        billingUrl: `https://drive.google.com/drive/folders/${c.drive_folder_id}`,
      }));

    // Une todos os recursos
    let combined = [...adRows, ...kommoRows, ...whatsappRows, ...driveRows];

    // Filtro por tipo selecionado
    if (matrixFilterType !== 'all') {
      combined = combined.filter((item) => item.tipo === matrixFilterType);
    }

    // Filtro apenas alertas
    if (onlyAlerts) {
      combined = combined.filter((item) => item.hasAlert);
    }

    // Busca textual
    if (query) {
      combined = combined.filter(
        (item) =>
          item.nome.toLowerCase().includes(query) ||
          item.identificador.toLowerCase().includes(query) ||
          item.clienteNome.toLowerCase().includes(query) ||
          item.clienteId.toLowerCase().includes(query)
      );
    }

    return combined;
  }, [allContasAds, kommoPipelines, clients, clientsMap, matrixFilterType, onlyAlerts, matrixSearch]);

  // Guardas de autenticação e permissão
  if (!isAuthChecked) {
    return (
      <div className="flex items-center justify-center p-16 bg-white border border-[#E2E8F0] rounded-2xl shadow-xs">
        <RefreshCw className="w-6 h-6 animate-spin text-[#0050FF]" />
      </div>
    );
  }

  if (!isMasterAdmin) {
    return (
      <div className="p-8 bg-white border border-[#E2E8F0] rounded-2xl shadow-xs space-y-4 max-w-xl mx-auto font-sans select-none">
        <div className="flex items-center gap-3 text-rose-600">
          <AlertCircle className="w-6 h-6 text-rose-600" />
          <h2 className="text-base font-bold text-[#0F172A]">Acesso Restrito ao Master Admin</h2>
        </div>
        <p className="text-xs text-[#64748B] leading-relaxed">
          O gerenciamento e a matriz de contas e credenciais são restritos à Administração Master da Swiftsail.
        </p>
        <div className="pt-2 border-t border-[#F1F5F9]">
          <Link
            href="/client"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0050FF] hover:bg-[#0040D6] text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Voltar ao Portal do Cliente</span>
          </Link>
        </div>
      </div>
    );
  }

  const clientName = activeClient?.nome || (selectedClientId === 'ALL' ? 'Todas as Contas' : selectedClientId);

  return (
    <div className="space-y-6 font-sans select-none">
      {/* Top Banner (Estilo Asaas: Branco Limpo, Borda Fina, Alta Legibilidade) */}
      <div className="bg-white border border-[#E2E8F0] p-6 rounded-2xl shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-5">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-[#EFF4FF] text-[#0050FF] border border-[#BFDBFE] uppercase tracking-wider">
              {selectedClientId === 'ALL' ? 'Governança Master Swiftsail' : 'Workspace & Governança do Cliente'}
            </span>
            {selectedClientId === 'ALL' && (
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                {stats.totalContas} Contas Ads + {stats.totalKommo} Funis Kommo
              </span>
            )}
          </div>

          <h1 className="text-xl sm:text-2xl font-bold text-[#0F172A] flex items-center gap-2.5">
            {selectedClientId === 'ALL' ? (
              <>
                <Layers className="w-6 h-6 text-[#0050FF]" />
                Matriz de Contas & Vínculos da Agência
              </>
            ) : (
              <>
                <Building className="w-6 h-6 text-[#0050FF]" />
                Configurações & Contas de {clientName}
              </>
            )}
          </h1>

          <p className="text-xs text-[#64748B] max-w-3xl leading-relaxed">
            {selectedClientId === 'ALL'
              ? 'Visualize todas as contas separadas por tipo (Meta Ads, Google Ads, Kommo CRM, WhatsApp e Drive) e confira exatamente a qual cliente cada uma está vinculada.'
              : `Gerencie as contas de anúncio, integrações do Kommo CRM, canais de WhatsApp, Drive e a equipe autorizada deste cliente.`}
          </p>
        </div>

        {/* Client Selector Dropdown */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 bg-[#F8FAFC] p-2.5 rounded-xl border border-[#E2E8F0] shadow-xs">
          <span className="text-xs font-semibold text-[#64748B] whitespace-nowrap">Selecionar Vista:</span>
          <select
            value={selectedClientId}
            onChange={(e) => handleClientSelectChange(e.target.value)}
            className="bg-white border border-[#CBD5E1] rounded-lg px-3 py-2 text-xs font-bold text-[#0F172A] focus:border-[#0050FF] focus:outline-none min-w-[240px] cursor-pointer shadow-xs"
          >
            <option value="ALL">🏢 Visão Geral (Todas as Contas da Agência)</option>
            <option disabled>──────── Clientes ────────</option>
            {clients.map((c) => (
              <option key={c.cliente_id} value={c.cliente_id}>
                {c.nome} ({c.cliente_id})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* KPI Cards / Resumo Executivo */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
        <div className="bg-white border border-[#E2E8F0] p-4 rounded-xl shadow-xs space-y-1">
          <span className="text-[10px] uppercase font-bold text-[#64748B] flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-[#0050FF]" /> Total Contas Ads
          </span>
          <p className="text-xl font-bold text-[#0F172A] font-mono">{stats.totalContas}</p>
          <p className="text-[10px] text-[#64748B]">Meta + Google Ads</p>
        </div>

        <div className="bg-white border border-[#E2E8F0] p-4 rounded-xl shadow-xs space-y-1">
          <span className="text-[10px] uppercase font-bold text-[#64748B] flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-600 inline-block" /> Meta Ads
          </span>
          <p className="text-xl font-bold text-[#0F172A] font-mono">{stats.totalMeta}</p>
          <p className="text-[10px] text-[#64748B]">BM Swiftsail</p>
        </div>

        <div className="bg-white border border-[#E2E8F0] p-4 rounded-xl shadow-xs space-y-1">
          <span className="text-[10px] uppercase font-bold text-[#64748B] flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-sky-500 inline-block" /> Google Ads
          </span>
          <p className="text-xl font-bold text-[#0F172A] font-mono">{stats.totalGoogle}</p>
          <p className="text-[10px] text-[#64748B]">MCC Swiftsail</p>
        </div>

        <div className="bg-white border border-[#E2E8F0] p-4 rounded-xl shadow-xs space-y-1">
          <span className="text-[10px] uppercase font-bold text-[#64748B] flex items-center gap-1.5">
            <KanbanSquare className="w-3.5 h-3.5 text-orange-600" /> Kommo CRM
          </span>
          <p className="text-xl font-bold text-orange-700 font-mono">{stats.totalKommo}</p>
          <p className="text-[10px] text-[#64748B]">Funis Conectados</p>
        </div>

        <div className="bg-white border border-[#E2E8F0] p-4 rounded-xl shadow-xs space-y-1">
          <span className="text-[10px] uppercase font-bold text-[#64748B] flex items-center gap-1.5">
            <MessageSquare className="w-3.5 h-3.5 text-emerald-600" /> WhatsApp
          </span>
          <p className="text-xl font-bold text-[#0F172A] font-mono">{stats.totalWhatsapp}</p>
          <p className="text-[10px] text-[#64748B]">Grupos Vinculados</p>
        </div>

        <div className="bg-white border border-[#E2E8F0] p-4 rounded-xl shadow-xs space-y-1">
          <span className="text-[10px] uppercase font-bold text-[#64748B] flex items-center gap-1.5">
            <FolderTree className="w-3.5 h-3.5 text-amber-600" /> Google Drive
          </span>
          <p className="text-xl font-bold text-[#0F172A] font-mono">{stats.totalDrive}</p>
          <p className="text-[10px] text-[#64748B]">Pastas de Ativos</p>
        </div>

        <div
          onClick={() => {
            setMainView('matrix');
            setOnlyAlerts(!onlyAlerts);
          }}
          className={`p-4 rounded-xl border transition-all cursor-pointer shadow-xs space-y-1 ${
            stats.alertasCount > 0
              ? 'bg-rose-50/70 border-rose-300 hover:bg-rose-100/70'
              : 'bg-white border-[#E2E8F0]'
          }`}
        >
          <span className="text-[10px] uppercase font-bold text-rose-700 flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-600" /> Saldo &lt; R$ 50
          </span>
          <p className="text-xl font-bold text-rose-700 font-mono">{stats.alertasCount}</p>
          <p className="text-[10px] text-rose-600 font-medium">
            {onlyAlerts ? 'Filtro Ativo (Clique p/ ver todos)' : 'Contas em risco'}
          </p>
        </div>
      </div>

      {/* Navegação entre Modo Matriz e Modo Cliente */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#E2E8F0] pb-2">
        <div className="flex items-center gap-2 p-1 bg-[#F1F5F9] border border-[#E2E8F0] rounded-xl">
          <button
            onClick={() => {
              setMainView('matrix');
            }}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer ${
              mainView === 'matrix'
                ? 'bg-white text-[#0050FF] shadow-xs border border-[#E2E8F0]'
                : 'text-[#64748B] hover:text-[#0F172A]'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>🏢 Matriz de Todas as Contas & Vínculos ({matrixItems.length})</span>
          </button>

          {selectedClientId !== 'ALL' && (
            <button
              onClick={() => setMainView('client_detail')}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer ${
                mainView === 'client_detail'
                  ? 'bg-white text-[#0050FF] shadow-xs border border-[#E2E8F0]'
                  : 'text-[#64748B] hover:text-[#0F172A]'
              }`}
            >
              <Building className="w-3.5 h-3.5" />
              <span>💼 Detalhes de {clientName}</span>
            </button>
          )}
        </div>

        {mainView === 'matrix' && (
          <div className="flex items-center gap-2 text-xs text-[#64748B]">
            <span>Exibindo <strong>{matrixItems.length}</strong> recursos cadastrados</span>
          </div>
        )}
      </div>

      {feedback && (
        <div
          className={`p-4 rounded-xl text-xs font-semibold flex items-center gap-2 border ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : 'bg-rose-50 text-rose-700 border-rose-200'
          }`}
        >
          {feedback.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-rose-600" />}
          <span>{feedback.text}</span>
        </div>
      )}

      {/* ========================================================
          MODO 1: MATRIZ DE TODAS AS CONTAS SEPARADAS POR TIPO
          ======================================================== */}
      {mainView === 'matrix' ? (
        <div className="bg-white border border-[#E2E8F0] rounded-2xl shadow-xs p-6 space-y-6">
          {/* Barra de Filtros e Busca */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#F1F5F9] pb-4">
            {/* Pílulas de Tipo */}
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                onClick={() => setMatrixFilterType('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  matrixFilterType === 'all'
                    ? 'bg-[#0050FF] text-white shadow-xs'
                    : 'bg-[#F8FAFC] text-[#64748B] hover:bg-[#F1F5F9] border border-[#E2E8F0]'
                }`}
              >
                Todas ({allContasAds.length + kommoPipelines.length + clients.filter((c) => c.grupo_whatsapp_id).length + clients.filter((c) => c.drive_folder_id).length})
              </button>

              <button
                onClick={() => setMatrixFilterType('meta')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                  matrixFilterType === 'meta'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-[#F8FAFC] text-blue-700 hover:bg-blue-50 border border-[#E2E8F0]'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-blue-500" />
                Meta Ads ({stats.totalMeta})
              </button>

              <button
                onClick={() => setMatrixFilterType('google')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                  matrixFilterType === 'google'
                    ? 'bg-sky-600 text-white shadow-xs'
                    : 'bg-[#F8FAFC] text-sky-700 hover:bg-sky-50 border border-[#E2E8F0]'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-sky-500" />
                Google Ads ({stats.totalGoogle})
              </button>

              <button
                onClick={() => setMatrixFilterType('crm')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                  matrixFilterType === 'crm'
                    ? 'bg-orange-600 text-white shadow-xs'
                    : 'bg-[#F8FAFC] text-orange-700 hover:bg-orange-50 border border-[#E2E8F0]'
                }`}
              >
                <KanbanSquare className="w-3.5 h-3.5 text-orange-600" />
                Kommo CRM ({stats.totalKommo})
              </button>

              <button
                onClick={() => setMatrixFilterType('whatsapp')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                  matrixFilterType === 'whatsapp'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-[#F8FAFC] text-emerald-700 hover:bg-emerald-50 border border-[#E2E8F0]'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                WhatsApp Grupos ({stats.totalWhatsapp})
              </button>

              <button
                onClick={() => setMatrixFilterType('drive')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                  matrixFilterType === 'drive'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'bg-[#F8FAFC] text-amber-700 hover:bg-amber-50 border border-[#E2E8F0]'
                }`}
              >
                <FolderTree className="w-3.5 h-3.5 text-amber-600" />
                Google Drive ({stats.totalDrive})
              </button>
            </div>

            {/* Input de Pesquisa Rápida */}
            <div className="relative min-w-[280px]">
              <Search className="w-4 h-4 text-[#94A3B8] absolute left-3 top-2.5" />
              <input
                type="text"
                value={matrixSearch}
                onChange={(e) => setMatrixSearch(e.target.value)}
                placeholder="Buscar por conta, ID, funil ou cliente..."
                className="w-full pl-9 pr-3 py-1.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-xs text-[#0F172A] placeholder:text-[#94A3B8] focus:bg-white focus:border-[#0050FF] focus:outline-none transition-all"
              />
            </div>
          </div>

          {/* Tabela de Contas e Recursos com Seus Vínculos */}
          {isLoadingContas ? (
            <div className="p-12 text-center text-[#64748B] flex items-center justify-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin text-[#0050FF]" />
              <span>Carregando matriz de contas e funis...</span>
            </div>
          ) : matrixItems.length === 0 ? (
            <div className="p-12 text-center bg-[#F8FAFC] rounded-xl border border-[#E2E8F0] text-[#64748B] text-xs">
              Nenhuma conta ou recurso encontrado para os filtros selecionados.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC] text-[#64748B] uppercase font-bold text-[10px] tracking-wider">
                    <th className="py-3 px-3.5 rounded-l-lg">Tipo / Plataforma</th>
                    <th className="py-3 px-3.5">Nome da Conta / Recurso</th>
                    <th className="py-3 px-3.5">ID / Identificador</th>
                    <th className="py-3 px-3.5">Cliente Vinculado</th>
                    <th className="py-3 px-3.5">Saldo / Pagamento / Detalhes</th>
                    <th className="py-3 px-3.5">Status</th>
                    <th className="py-3 px-3.5 rounded-r-lg text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F1F5F9]">
                  {matrixItems.map((item) => {
                    const isMeta = item.tipo === 'meta';
                    const isGoogle = item.tipo === 'google';
                    const isCrm = item.tipo === 'crm';
                    const isWhatsapp = item.tipo === 'whatsapp';
                    const isDrive = item.tipo === 'drive';

                    return (
                      <tr
                        key={item.id}
                        className={`transition-colors hover:bg-[#F8FAFC] ${
                          item.hasAlert ? 'bg-rose-50/50' : ''
                        }`}
                      >
                        {/* Tipo com Badge */}
                        <td className="py-3.5 px-3.5 whitespace-nowrap">
                          {isMeta && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                              <span className="w-2 h-2 rounded-full bg-blue-600" />
                              Meta Ads
                            </span>
                          )}
                          {isGoogle && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold bg-sky-50 text-sky-700 border border-sky-200">
                              <span className="w-2 h-2 rounded-full bg-sky-600" />
                              Google Ads
                            </span>
                          )}
                          {isCrm && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold bg-orange-50 text-orange-700 border border-orange-200">
                              <KanbanSquare className="w-3 h-3 text-orange-600" />
                              Kommo CRM
                            </span>
                          )}
                          {isWhatsapp && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <MessageSquare className="w-3 h-3 text-emerald-600" />
                              WhatsApp
                            </span>
                          )}
                          {isDrive && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                              <FolderTree className="w-3 h-3 text-amber-600" />
                              Google Drive
                            </span>
                          )}
                        </td>

                        {/* Nome da Conta */}
                        <td className="py-3.5 px-3.5 font-bold text-[#0F172A] max-w-[240px] truncate">
                          {item.nome}
                        </td>

                        {/* Identificador com Copiar */}
                        <td className="py-3.5 px-3.5">
                          <div className="flex items-center gap-1.5 font-mono text-[11px] text-[#475569] bg-[#F1F5F9] px-2 py-1 rounded-md border border-[#E2E8F0] w-fit">
                            <span className="max-w-[170px] truncate">{item.identificador}</span>
                            <button
                              onClick={() => handleCopy(item.identificador)}
                              className="text-[#94A3B8] hover:text-[#0F172A] transition-colors p-0.5 cursor-pointer"
                              title="Copiar ID"
                            >
                              {copiedText === item.identificador ? (
                                <Check className="w-3 h-3 text-emerald-600" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          </div>
                        </td>

                        {/* Cliente Vinculado (Badge Clicável para Focar no Cliente) */}
                        <td className="py-3.5 px-3.5">
                          <button
                            onClick={() => {
                              setSelectedClientId(item.clienteId);
                              setMainView('client_detail');
                            }}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white hover:bg-[#EFF4FF] border border-[#CBD5E1] text-[#0050FF] font-semibold text-xs transition-all shadow-2xs cursor-pointer group"
                            title="Ver detalhes deste cliente"
                          >
                            <Building className="w-3 h-3 text-[#0050FF]" />
                            <span className="max-w-[180px] truncate">{item.clienteNome}</span>
                            <ChevronRight className="w-3 h-3 text-[#94A3B8] group-hover:text-[#0050FF] transition-colors" />
                          </button>
                        </td>

                        {/* Saldo / Pagamento / Limite / Detalhes */}
                        <td className="py-3.5 px-3.5">
                          {isMeta && (
                            <div className="space-y-0.5">
                              {item.tipoPagamento === 'pre_paga' && (
                                <div className="flex items-center gap-1.5 font-mono font-bold">
                                  <span className={item.hasAlert ? 'text-rose-700' : 'text-emerald-700'}>
                                    Pré: {item.saldo !== null && item.saldo !== undefined ? `R$ ${Number(item.saldo).toFixed(2)}` : '—'}
                                  </span>
                                  {item.hasAlert && (
                                    <span className="px-1.5 py-0.2 rounded bg-rose-100 text-rose-800 text-[9px] font-bold">
                                      Crítico
                                    </span>
                                  )}
                                </div>
                              )}
                              {item.tipoPagamento === 'pos_paga' && item.cartaoFinal && (
                                <span className="text-[#475569] font-mono font-semibold">
                                  Cartão •••• {item.cartaoFinal}
                                </span>
                              )}
                              {item.limite !== null && item.limite !== undefined && (
                                <p className="text-[10px] text-[#64748B] font-mono">
                                  Limite: R$ {Number(item.limite).toFixed(2)}
                                </p>
                              )}
                            </div>
                          )}

                          {isGoogle && (
                            <div className="space-y-0.5">
                              {item.tipoPagamento === 'limite_orcamento' && (
                                <div className="flex items-center gap-1.5 font-mono font-bold">
                                  <span className={item.hasAlert ? 'text-rose-700' : 'text-emerald-700'}>
                                    Saldo: {item.saldo !== null && item.saldo !== undefined ? `R$ ${Number(item.saldo).toFixed(2)}` : '—'}
                                  </span>
                                  {item.hasAlert && (
                                    <span className="px-1.5 py-0.2 rounded bg-rose-100 text-rose-800 text-[9px] font-bold">
                                      Crítico
                                    </span>
                                  )}
                                </div>
                              )}
                              {item.tipoPagamento === 'automatico' && (
                                <span className="text-[#64748B] text-[11px] font-semibold">
                                  Automático (Sem teto)
                                </span>
                              )}
                              {item.contaPagamento && (
                                <p className="text-[10px] text-[#64748B] truncate max-w-[180px]">
                                  {item.contaPagamento}
                                </p>
                              )}
                            </div>
                          )}

                          {isCrm && (
                            <div className="space-y-0.5">
                              <span className="text-orange-700 font-semibold text-[11px] flex items-center gap-1">
                                <Sparkles className="w-3 h-3 text-orange-500" />
                                {item.tipoPagamento}
                              </span>
                            </div>
                          )}

                          {isWhatsapp && (
                            <span className="text-emerald-700 font-semibold text-[11px]">
                              Canal Ativo no Supabase
                            </span>
                          )}

                          {isDrive && (
                            <span className="text-amber-700 font-semibold text-[11px]">
                              Pasta Integrada
                            </span>
                          )}
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-3.5">
                          {item.hasAlert ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                              <AlertTriangle className="w-3 h-3 text-rose-700" />
                              Saldo Baixo
                            </span>
                          ) : item.status === 'ACTIVE' || item.status === 'ENABLED' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              Ativa
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-700 border border-gray-200">
                              {item.status}
                            </span>
                          )}
                        </td>

                        {/* Ações */}
                        <td className="py-3.5 px-3.5 text-right whitespace-nowrap">
                          <div className="inline-flex items-center gap-1.5">
                            {item.billingUrl && (
                              <a
                                href={item.billingUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1.5 rounded-lg bg-white hover:bg-[#EFF4FF] text-[#64748B] hover:text-[#0050FF] border border-[#E2E8F0] hover:border-[#BFDBFE] transition-all shadow-2xs"
                                title={isCrm ? 'Abrir funil no Kommo CRM' : 'Abrir faturamento na plataforma externa'}
                              >
                                <ArrowUpRight className="w-3.5 h-3.5" />
                              </a>
                            )}
                            <button
                              onClick={() => {
                                setSelectedClientId(item.clienteId);
                                setMainView('client_detail');
                                if (isCrm) setClientDetailTab('crm');
                              }}
                              className="px-2.5 py-1 rounded-lg bg-[#EFF4FF] hover:bg-[#E0EAFF] text-[#0050FF] font-semibold text-[11px] transition-colors cursor-pointer"
                              title="Configurar este cliente"
                            >
                              Configurar
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        /* ========================================================
           MODO 2: RECURSOS & CONTAS DO CLIENTE SELECIONADO
           ======================================================== */
        <div className="space-y-6">
          {/* Abas do Cliente */}
          <div className="flex items-center gap-2 p-1 bg-[#F1F5F9] border border-[#E2E8F0] rounded-xl w-fit">
            <button
              onClick={() => setClientDetailTab('ads')}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer ${
                clientDetailTab === 'ads'
                  ? 'bg-white text-[#0050FF] shadow-xs border border-[#E2E8F0]'
                  : 'text-[#64748B] hover:text-[#0F172A]'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              Contas de Anúncio ({selectedClientAccounts.length})
            </button>

            <button
              onClick={() => setClientDetailTab('crm')}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer ${
                clientDetailTab === 'crm'
                  ? 'bg-white text-orange-700 shadow-xs border border-[#E2E8F0]'
                  : 'text-[#64748B] hover:text-[#0F172A]'
              }`}
            >
              <KanbanSquare className="w-3.5 h-3.5 text-orange-600" />
              Kommo CRM ({selectedClientKommoPipelines.length} funis)
            </button>

            <button
              onClick={() => setClientDetailTab('channels')}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer ${
                clientDetailTab === 'channels'
                  ? 'bg-white text-[#0050FF] shadow-xs border border-[#E2E8F0]'
                  : 'text-[#64748B] hover:text-[#0F172A]'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
              WhatsApp & Drive
            </button>

            <button
              onClick={() => setClientDetailTab('team')}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer ${
                clientDetailTab === 'team'
                  ? 'bg-white text-[#0050FF] shadow-xs border border-[#E2E8F0]'
                  : 'text-[#64748B] hover:text-[#0F172A]'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              Equipe ({clientUsers.length + clientInvites.length})
            </button>
          </div>

          {/* Subaba 1: Contas de Anúncio (Meta e Google Ads separadas por tipo) */}
          {clientDetailTab === 'ads' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Meta Ads Card */}
              <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-xs space-y-4">
                <div className="border-b border-[#F1F5F9] pb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 font-bold text-xs">
                      M
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-[#0F172A]">Contas Meta Ads ({selectedClientMeta.length})</h3>
                      <p className="text-[11px] text-[#64748B]">Business Manager da Agência Swiftsail</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  {selectedClientMeta.length === 0 ? (
                    <div className="p-6 text-center bg-[#F8FAFC] rounded-xl border border-[#E2E8F0] text-[#64748B] text-xs">
                      Nenhuma conta Meta Ads vinculada a este cliente.
                    </div>
                  ) : (
                    selectedClientMeta.map((a) => {
                      const isPre = a.tipo_pagamento === 'pre_paga';
                      const isPos = a.tipo_pagamento === 'pos_paga';
                      const saldo = Number(a.saldo_disponivel);
                      const limite = Number(a.limite_restante);
                      const isSaldoBaixo = isPre && a.saldo_disponivel !== null && a.saldo_disponivel !== undefined && saldo < 50;
                      const isLimiteBaixo = a.limite_restante !== null && a.limite_restante !== undefined && limite < 50;
                      const hasAlert = isSaldoBaixo || isLimiteBaixo;

                      const cleanAct = String(a.account_id || '').replace(/^act_/, '').trim();
                      const billingUrl = `https://adsmanager.facebook.com/ads/manager/billing/payment_settings?act=${cleanAct}`;

                      return (
                        <div
                          key={a.account_id}
                          className={`p-4 rounded-xl border transition-all ${
                            hasAlert ? 'bg-rose-50/70 border-rose-300' : 'bg-[#F8FAFC] border-[#E2E8F0]'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-[#0F172A] text-xs">{a.nome}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-[11px] text-[#64748B] font-mono">({a.account_id})</span>
                              <a
                                href={billingUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[#0050FF] hover:underline inline-flex items-center gap-1 text-[11px] font-semibold"
                                title="Abrir faturamento na Meta"
                              >
                                <span>Faturamento</span>
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-3 pt-2 text-[11px]">
                            {isPre && (
                              <span className={`font-mono font-bold ${isSaldoBaixo ? 'text-rose-700' : 'text-emerald-700'}`}>
                                Pré-paga: {a.saldo_disponivel !== null && a.saldo_disponivel !== undefined ? `R$ ${saldo.toFixed(2)}` : '—'}
                              </span>
                            )}
                            {isPos && a.cartao_final && (
                              <span className="text-[#475569] font-mono font-semibold">
                                Cartão: •••• {a.cartao_final}
                              </span>
                            )}
                            {a.limite_restante !== null && a.limite_restante !== undefined && (
                              <span className={`font-mono ${isLimiteBaixo ? 'text-rose-700 font-bold' : 'text-[#64748B]'}`}>
                                Limite: R$ {limite.toFixed(2)}
                              </span>
                            )}
                            {hasAlert && (
                              <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-800 font-bold text-[10px] border border-rose-200">
                                ⚠️ Saldo Baixo (&lt; R$ 50)
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Google Ads Card */}
              <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-xs space-y-4">
                <div className="border-b border-[#F1F5F9] pb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-sky-50 border border-sky-200 flex items-center justify-center text-sky-600 font-bold text-xs">
                      G
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-[#0F172A]">Contas Google Ads ({selectedClientGoogle.length})</h3>
                      <p className="text-[11px] text-[#64748B]">MCC da Agência Swiftsail</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  {selectedClientGoogle.length === 0 ? (
                    <div className="p-6 text-center bg-[#F8FAFC] rounded-xl border border-[#E2E8F0] text-[#64748B] text-xs">
                      Nenhuma conta Google Ads vinculada a este cliente.
                    </div>
                  ) : (
                    selectedClientGoogle.map((a) => {
                      const isLimite = a.tipo_pagamento === 'limite_orcamento';
                      const isAuto = a.tipo_pagamento === 'automatico';
                      const saldo = Number(a.saldo_disponivel);
                      const limite = Number(a.limite_restante);
                      const isSaldoBaixo = isLimite && a.saldo_disponivel !== null && a.saldo_disponivel !== undefined && saldo < 50;
                      const isLimiteBaixo = a.limite_restante !== null && a.limite_restante !== undefined && limite < 50;
                      const hasAlert = isSaldoBaixo || isLimiteBaixo;

                      const cleanCid = String(a.account_id || '').replace(/[^0-9]/g, '').trim();
                      const billingUrl = cleanCid
                        ? `https://ads.google.com/aw/billing/summary?ocid=${cleanCid}`
                        : 'https://ads.google.com/aw/billing/summary';

                      return (
                        <div
                          key={a.account_id}
                          className={`p-4 rounded-xl border transition-all ${
                            hasAlert ? 'bg-rose-50/70 border-rose-300' : 'bg-[#F8FAFC] border-[#E2E8F0]'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-[#0F172A] text-xs">{a.nome}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-[11px] text-[#64748B] font-mono">({a.account_id})</span>
                              {cleanCid && (
                                <a
                                  href={billingUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[#0050FF] hover:underline inline-flex items-center gap-1 text-[11px] font-semibold"
                                  title="Abrir faturamento no Google Ads"
                                >
                                  <span>Faturamento</span>
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                              )}
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-3 pt-2 text-[11px]">
                            {isLimite && (
                              <span className={`font-mono font-bold ${isSaldoBaixo ? 'text-rose-700' : 'text-emerald-700'}`}>
                                Saldo orç.: {a.saldo_disponivel !== null && a.saldo_disponivel !== undefined ? `R$ ${saldo.toFixed(2)}` : '—'}
                              </span>
                            )}
                            {isAuto && (
                              <span className="text-[#64748B] font-semibold">
                                Pagamento Automático
                              </span>
                            )}
                            {a.conta_pagamento && (
                              <span className="text-[#475569] font-medium truncate max-w-[200px]">
                                Conta: {a.conta_pagamento}
                              </span>
                            )}
                            {hasAlert && (
                              <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-800 font-bold text-[10px] border border-rose-200">
                                ⚠️ Orçamento Baixo (&lt; R$ 50)
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Subaba 2: Kommo CRM Form & Funis Detectados */}
          {clientDetailTab === 'crm' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Formulário de Configuração */}
              <div className="lg:col-span-7 bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-xs space-y-5">
                <div className="border-b border-[#F1F5F9] pb-3 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-[#0F172A] flex items-center gap-2">
                      <KanbanSquare className="w-4 h-4 text-orange-600" />
                      Credenciais Kommo CRM de {clientName}
                    </h3>
                    <p className="text-xs text-[#64748B]">Sincronização do funil de vendas comercial</p>
                  </div>

                  <button
                    onClick={handleSaveKommo}
                    disabled={isSaving}
                    className="bg-[#0050FF] hover:bg-[#0040D6] text-white px-5 py-2.5 rounded-full font-semibold text-xs flex items-center gap-2 shadow-xs transition-all active:scale-95 cursor-pointer disabled:opacity-50"
                  >
                    {isSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                    <span>Salvar Kommo</span>
                  </button>
                </div>

                <div className="space-y-4 text-xs">
                  <div>
                    <label className="block text-[#475569] font-semibold mb-1">Subdomínio Kommo do Cliente</label>
                    <input
                      type="text"
                      value={subdomain}
                      onChange={(e) => setSubdomain(e.target.value)}
                      placeholder="ex: adriatica (sem .kommo.com)"
                      className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-3.5 py-2 text-[#0F172A] font-mono focus:border-[#0050FF] focus:bg-white focus:outline-none transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-[#475569] font-semibold mb-1">Long-Lived Access Token (Kommo)</label>
                    <div className="relative">
                      <input
                        type={showToken ? 'text' : 'password'}
                        value={token}
                        onChange={(e) => setToken(e.target.value)}
                        placeholder="Insira o token de longa duração gerado no Kommo do cliente"
                        className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-3.5 py-2 pr-10 text-[#0F172A] font-mono focus:border-[#0050FF] focus:bg-white focus:outline-none transition-colors"
                      />
                      <button
                        onClick={() => setShowToken(!showToken)}
                        className="absolute right-3 top-2.5 text-[#94A3B8] hover:text-[#0F172A] cursor-pointer"
                      >
                        {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[#475569] font-semibold mb-1">ID do Pipeline Principal</label>
                    <input
                      type="text"
                      value={pipelineId}
                      onChange={(e) => setPipelineId(e.target.value)}
                      placeholder="ex: 13629291"
                      className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-3.5 py-2 text-[#0F172A] font-mono focus:border-[#0050FF] focus:bg-white focus:outline-none transition-colors"
                    />
                    <p className="text-[10px] text-[#64748B] mt-1">
                      Você pode clicar em &quot;Usar como Principal&quot; na lista ao lado para preencher automaticamente.
                    </p>
                  </div>
                </div>
              </div>

              {/* Funis Detectados no Kommo */}
              <div className="lg:col-span-5 bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-xs space-y-4">
                <div className="border-b border-[#F1F5F9] pb-3">
                  <h3 className="text-xs font-bold text-[#0F172A] uppercase tracking-wider flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-orange-600" />
                    Funis Detectados no Kommo ({selectedClientKommoPipelines.length})
                  </h3>
                  <p className="text-[11px] text-[#64748B]">Sincronizados na base de dados pública do Supabase</p>
                </div>

                <div className="space-y-2.5">
                  {selectedClientKommoPipelines.length === 0 ? (
                    <div className="p-6 text-center bg-[#F8FAFC] rounded-xl border border-[#E2E8F0] text-[#64748B] text-xs">
                      Nenhum funil importado para este cliente ainda. Salve o token e subdomínio para sincronizar.
                    </div>
                  ) : (
                    selectedClientKommoPipelines.map((p) => {
                      const isCurrentPrimary = pipelineId === p.pipeline_id;
                      const kommoUrl = `https://${subdomain || selectedClientId.toLowerCase().replace(/_/g, '')}.kommo.com/leads/pipeline/${p.pipeline_id}`;

                      return (
                        <div
                          key={p.pipeline_id}
                          className={`p-3.5 rounded-xl border transition-all ${
                            isCurrentPrimary
                              ? 'bg-orange-50/70 border-orange-300'
                              : 'bg-[#F8FAFC] border-[#E2E8F0] hover:bg-white'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-xs text-[#0F172A]">{p.pipeline_nome}</span>
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] font-mono text-[#64748B]">ID: {p.pipeline_id}</span>
                              <a
                                href={kommoUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[#0050FF] hover:underline p-0.5"
                                title="Abrir este funil no Kommo"
                              >
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            </div>
                          </div>

                          <div className="flex items-center justify-between pt-2">
                            <span className="text-[11px] text-orange-700 font-semibold">
                              {p.etapas_count} etapas mapeadas
                            </span>

                            {isCurrentPrimary ? (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-orange-100 text-orange-800 border border-orange-200">
                                Principal
                              </span>
                            ) : (
                              <button
                                onClick={() => setPipelineId(p.pipeline_id)}
                                className="px-2 py-0.5 rounded text-[10px] font-semibold bg-white hover:bg-orange-100 text-orange-700 border border-orange-200 transition-colors cursor-pointer shadow-2xs"
                              >
                                Definir como Principal
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Subaba 3: Canais & Ativos (WhatsApp e Drive) */}
          {clientDetailTab === 'channels' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-xs space-y-4">
                <div className="flex items-center gap-2 border-b border-[#F1F5F9] pb-3">
                  <MessageSquare className="w-4 h-4 text-emerald-600" />
                  <h3 className="text-sm font-bold text-[#0F172A]">Grupo de WhatsApp Vinculado</h3>
                </div>
                <div className="p-4 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0] space-y-2">
                  <span className="text-[10px] uppercase font-bold text-[#64748B]">JID do Grupo</span>
                  <div className="flex items-center justify-between font-mono text-xs text-[#0F172A] font-semibold">
                    <span className="truncate">{activeClient?.grupo_whatsapp_id || 'Nenhum grupo vinculado no Supabase'}</span>
                    {activeClient?.grupo_whatsapp_id && (
                      <button
                        onClick={() => handleCopy(activeClient.grupo_whatsapp_id as string)}
                        className="text-[#94A3B8] hover:text-[#0F172A] p-1 cursor-pointer"
                      >
                        {copiedText === activeClient.grupo_whatsapp_id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-xs space-y-4">
                <div className="flex items-center gap-2 border-b border-[#F1F5F9] pb-3">
                  <FolderTree className="w-4 h-4 text-amber-600" />
                  <h3 className="text-sm font-bold text-[#0F172A]">Google Drive Folder</h3>
                </div>
                <div className="p-4 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0] space-y-2">
                  <span className="text-[10px] uppercase font-bold text-[#64748B]">ID da Pasta no Drive</span>
                  <div className="flex items-center justify-between font-mono text-xs text-[#0F172A] font-semibold">
                    <span className="truncate">{activeClient?.drive_folder_id || 'Nenhuma pasta vinculada'}</span>
                    {activeClient?.drive_folder_id && (
                      <a
                        href={`https://drive.google.com/drive/folders/${activeClient.drive_folder_id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#0050FF] hover:underline text-xs flex items-center gap-1 font-sans font-bold"
                      >
                        <span>Abrir Pasta</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Subaba 4: Equipe com Acesso */}
          {clientDetailTab === 'team' && (
            <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-xs space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#F1F5F9] pb-4">
                <div>
                  <h3 className="text-sm font-bold text-[#0F172A] flex items-center gap-2">
                    <Users className="w-4 h-4 text-[#0050FF]" />
                    Membros da Empresa com Acesso a {clientName}
                  </h3>
                  <p className="text-xs text-[#64748B]">
                    Usuários com login autorizado neste workspace específico
                  </p>
                </div>

                <Link
                  href="/admin/usuarios"
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#EFF4FF] hover:bg-[#E0EAFF] text-[#0050FF] border border-[#BFDBFE] flex items-center gap-1.5 transition-all shadow-xs self-start sm:self-auto cursor-pointer"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Convidar Membro para este Cliente</span>
                </Link>
              </div>

              <div className="space-y-3">
                {clientUsers.length === 0 && clientInvites.length === 0 ? (
                  <div className="p-8 text-center bg-[#F8FAFC] rounded-xl border border-[#E2E8F0] text-[#64748B] text-xs">
                    Nenhum usuário cadastrado para este cliente ainda. Clique no botão acima para enviar o primeiro convite.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {clientUsers.map((u) => (
                      <div
                        key={u.id}
                        className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-between shadow-xs"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-[#EFF4FF] border border-[#BFDBFE] flex items-center justify-center text-[#0050FF] font-bold text-xs">
                            {u.nome.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-[#0F172A] text-xs">{u.nome}</p>
                            <p className="text-[11px] text-[#64748B] font-mono">{u.email}</p>
                            <div className="flex items-center gap-1.5 mt-1">
                              <span className="px-2 py-0.5 rounded bg-white text-[10px] font-semibold text-[#475569] border border-[#E2E8F0] capitalize">
                                {u.role.replace('_', ' ')}
                              </span>
                            </div>
                          </div>
                        </div>

                        <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Ativo
                        </span>
                      </div>
                    ))}

                    {clientInvites.map((i) => (
                      <div
                        key={i.id}
                        className="p-4 rounded-xl bg-[#F8FAFC] border border-amber-200 flex items-center justify-between shadow-xs"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700 font-bold text-xs">
                            {i.nome.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-[#0F172A] text-xs">{i.nome}</p>
                            <p className="text-[11px] text-[#64748B] font-mono">{i.email}</p>
                            <p className="text-[10px] text-amber-600 font-semibold mt-0.5">Convite Pendente</p>
                          </div>
                        </div>

                        <Link
                          href="/admin/usuarios"
                          className="px-2.5 py-1 rounded-lg bg-white border border-[#E2E8F0] text-[10px] font-bold text-[#0050FF] hover:bg-[#F8FAFC] shadow-xs"
                        >
                          Ver Link
                        </Link>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function ClientCredentialsPage() {
  return (
    <React.Suspense
      fallback={
        <div className="flex items-center justify-center p-16 bg-white border border-[#E2E8F0] rounded-2xl shadow-xs">
          <RefreshCw className="w-6 h-6 animate-spin text-[#0050FF]" />
        </div>
      }
    >
      <ClientCredentialsContent />
    </React.Suspense>
  );
}
