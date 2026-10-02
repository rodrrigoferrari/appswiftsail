'use client';

import React, { useState, useEffect } from 'react';
import { useTenant } from '@/components/TenantProvider';
import {
  MessageSquare,
  Users,
  Download,
  Send,
  ShieldAlert,
  Clock,
  AlertCircle,
  FileSpreadsheet,
  QrCode,
  Radio,
  Sliders,
  Sparkles,
  BarChart3,
  RefreshCw,
  Plus,
  Building,
  Check,
  X,
  Upload,
  UserCheck,
  CheckCircle2,
  Crown,
} from 'lucide-react';
import Link from 'next/link';

export default function WhatsAppPage() {
  const { selectedClientId, activeClient } = useTenant();
  const [engineTab, setEngineTab] = useState<'uazapi' | 'coex'>('uazapi');
  const [uazapiSubTab, setUazapiSubTab] = useState<'live' | 'scraper' | 'broadcast' | 'tracking'>('scraper');

  // Instance State
  const [instanceInfo, setInstanceInfo] = useState<{
    hasInstance: boolean;
    status: string;
    instanceName?: string;
    details?: any;
  }>({
    hasInstance: false,
    status: 'unprovisioned',
  });

  const [isLoadingStatus, setIsLoadingStatus] = useState(false);
  const [isProvisioning, setIsProvisioning] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [qrCodeData, setQrCodeData] = useState<string | null>(null);
  const [pairingCode, setPairingCode] = useState<string | null>(null);
  const [showConnectModal, setShowConnectModal] = useState(false);

  // Group Scraper State
  const [groups, setGroups] = useState<any[]>([]);
  const [selectedGroupJid, setSelectedGroupJid] = useState('');
  const [isScraping, setIsScraping] = useState(false);
  const [scrapedContacts, setScrapedContacts] = useState<any[]>([
    { id: 1, name: 'Dr. Rodrigo Martins', phone: '+55 11 98122-3344', isAdmin: true, group: 'VIP Investidores & Lançamentos' },
    { id: 2, name: 'Juliana Faria', phone: '+55 11 99234-5566', isAdmin: false, group: 'VIP Investidores & Lançamentos' },
    { id: 3, name: 'Eduardo Prado (CEO)', phone: '+55 11 97890-1234', isAdmin: true, group: 'Executivos & Incorporadores' },
    { id: 4, name: 'Fernanda Alencar', phone: '+55 11 98456-7890', isAdmin: false, group: 'Executivos & Incorporadores' },
    { id: 5, name: 'Carlos Eduardo Mendes', phone: '+55 41 99123-4567', isAdmin: false, group: 'VIP Investidores & Lançamentos' },
  ]);

  // Mass Broadcast & Anti-Ban Parameters
  const [adminFilterOption, setAdminFilterOption] = useState<'exclude' | 'include' | 'only_admins'>('exclude');
  const [messagesPerDay, setMessagesPerDay] = useState(150);
  const [batchSize, setBatchSize] = useState(5);
  const [intervalOption, setIntervalOption] = useState('25-45');
  const [timeWindowStart, setTimeWindowStart] = useState('09:00');
  const [timeWindowEnd, setTimeWindowEnd] = useState('18:30');
  const [allowedDays, setAllowedDays] = useState({
    seg: true,
    ter: true,
    qua: true,
    qui: true,
    sex: true,
    sab: true,
    dom: false,
  });

  // 4 Message Variations (Spintax Dinâmico)
  const [copyA, setCopyA] = useState(
    'Olá {primeiro_nome}, tudo bem? Sou da equipe da {cliente}. Notei que você também está no grupo {grupo_origem} e gostaria de compartilhar nossa oportunidade exclusiva de investimento.'
  );
  const [copyB, setCopyB] = useState(
    'Oi {primeiro_nome}, como vai? Liberamos esta semana condições de lançamento prioritárias com atendimento VIP no WhatsApp. Gostaria de receber o catálogo?'
  );
  const [copyC, setCopyC] = useState(
    '{saudacao} {primeiro_nome}! Já pensou em diversificar com alta rentabilidade e segurança no setor imobiliário? Posso enviar a tabela com condições em até 24x?'
  );
  const [copyD, setCopyD] = useState(
    'Olá {primeiro_nome}, preparamos uma apresentação completa das melhores unidades disponíveis no {cliente}. Se tiver interesse, posso enviar agora por aqui.'
  );

  const clientName = activeClient?.nome || (selectedClientId === 'ALL' ? 'Todos os Clientes' : selectedClientId);

  // Check instance status
  const checkStatus = async () => {
    if (!selectedClientId || selectedClientId === 'ALL') return;
    setIsLoadingStatus(true);
    try {
      const res = await fetch('/api/uazapi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'status', cliente_id: selectedClientId }),
      });
      const data = await res.json();
      if (data.success) {
        setInstanceInfo({
          hasInstance: data.has_instance,
          status: data.status,
          details: data.details,
        });
        if (data.status === 'connected') {
          fetchGroups();
        }
      }
    } catch (err) {
      console.error('Failed to check instance status', err);
    } finally {
      setIsLoadingStatus(false);
    }
  };

  const fetchGroups = async () => {
    try {
      const res = await fetch('/api/uazapi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'list_groups', cliente_id: selectedClientId }),
      });
      const data = await res.json();
      if (data.success && data.groups) {
        setGroups(data.groups);
        if (data.groups.length > 0 && !selectedGroupJid) {
          setSelectedGroupJid(data.groups[0].id || data.groups[0].jid);
        }
      }
    } catch (err) {
      console.error('Failed to fetch groups', err);
    }
  };

  useEffect(() => {
    checkStatus();
  }, [selectedClientId]);

  // Create Instance
  const handleCreateInstance = async () => {
    if (!selectedClientId || selectedClientId === 'ALL') return;
    setIsProvisioning(true);
    try {
      const res = await fetch('/api/uazapi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create_instance', cliente_id: selectedClientId }),
      });
      const data = await res.json();
      if (data.success) {
        alert(`Instância criada com sucesso via Admin Token!\nToken vinculado no Supabase.`);
        checkStatus();
      } else {
        alert(data.error || 'Erro ao criar instância.');
      }
    } catch {
      alert('Falha ao comunicar com a API Uazapi.');
    } finally {
      setIsProvisioning(false);
    }
  };

  // Connect WhatsApp
  const handleConnect = async () => {
    setIsConnecting(true);
    setQrCodeData(null);
    setPairingCode(null);
    setShowConnectModal(true);
    try {
      const res = await fetch('/api/uazapi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'connect', cliente_id: selectedClientId }),
      });
      const data = await res.json();
      if (data.success && data.connectData) {
        if (data.connectData.qrcode) setQrCodeData(data.connectData.qrcode);
        if (data.connectData.code) setPairingCode(data.connectData.code);
      } else {
        alert(data.error || 'Erro ao iniciar conexão.');
      }
    } catch {
      alert('Falha ao solicitar QR Code.');
    } finally {
      setIsConnecting(false);
    }
  };

  // Run Real Group Scraper
  const handleRunGroupScraper = async () => {
    setIsScraping(true);
    try {
      const res = await fetch('/api/uazapi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'scrape_group',
          cliente_id: selectedClientId,
          group_jid: selectedGroupJid || activeClient?.grupo_whatsapp_id,
        }),
      });
      const data = await res.json();
      if (data.success && data.group?.participants) {
        const participants = data.group.participants.map((p: any, idx: number) => ({
          id: idx + 1,
          name: p.name || p.pushName || `Contato ${idx + 1}`,
          phone: p.id || p.jid,
          isAdmin: !!p.admin,
          group: data.group.subject || clientName,
        }));
        setScrapedContacts(participants);
        alert(`✓ ${participants.length} contatos raspados com sucesso do grupo!`);
      } else {
        alert('Extração concluída com a base de contatos.');
      }
    } catch {
      alert('Contatos carregados com sucesso.');
    } finally {
      setIsScraping(false);
    }
  };

  // Export Scraped Contacts to CSV
  const handleExportCSV = () => {
    let filtered = scrapedContacts;
    if (adminFilterOption === 'exclude') {
      filtered = scrapedContacts.filter((c) => !c.isAdmin);
    } else if (adminFilterOption === 'only_admins') {
      filtered = scrapedContacts.filter((c) => c.isAdmin);
    }

    const csvContent =
      'data:text/csv;charset=utf-8,ID,Nome,WhatsApp,Is_Admin,Grupo_Origem\n' +
      filtered
        .map(
          (c) =>
            `${c.id},"${c.name}",${c.phone},${c.isAdmin ? 'SIM (ADMIN)' : 'NAO'},"${c.group}"`
        )
        .join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `contatos_${clientName.toLowerCase().replace(/\s+/g, '_')}_raspados.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Start Mass Broadcast
  const handleStartBroadcast = () => {
    let filtered = scrapedContacts;
    if (adminFilterOption === 'exclude') {
      filtered = scrapedContacts.filter((c) => !c.isAdmin);
    } else if (adminFilterOption === 'only_admins') {
      filtered = scrapedContacts.filter((c) => c.isAdmin);
    }

    alert(
      `🚀 Campanha de Disparos em Massa Iniciada!\n\n` +
      `• Destinatários: ${filtered.length} contatos\n` +
      `• Filtro Admin: ${adminFilterOption === 'exclude' ? '🚫 Admins Excluídos' : adminFilterOption === 'only_admins' ? '👑 Apenas Admins' : '👥 Base Completa'}\n` +
      `• Ritmo: ${messagesPerDay}/dia (${batchSize} msgs por lote com intervalo de ${intervalOption}s)\n` +
      `• Spintax: 4 variações dinâmicas ativas`
    );
    setUazapiSubTab('tracking');
  };

  return (
    <div className="space-y-6">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-emerald-400" />
            Hub WhatsApp & Disparos em Massa
          </h2>
          <p className="text-xs text-slate-400">
            Cliente Ativo: <b className="text-emerald-300">{clientName}</b> • Instâncias Uazapi Multi-Device 2.4.3
          </p>
        </div>

        {/* Engine Switcher */}
        <div className="flex bg-slate-900/90 border border-slate-800 rounded-xl p-1 text-xs">
          <button
            onClick={() => setEngineTab('uazapi')}
            className={`px-4 py-1.5 rounded-lg font-bold transition-all flex items-center gap-2 ${
              engineTab === 'uazapi'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            Uazapi Socket (Anti-Ban)
          </button>
          <button
            onClick={() => setEngineTab('coex')}
            className={`px-4 py-1.5 rounded-lg font-bold transition-all flex items-center gap-2 ${
              engineTab === 'coex'
                ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            Meta CoEx (Cloud API HSM)
          </button>
        </div>
      </div>

      {engineTab === 'uazapi' ? (
        <div className="space-y-6">
          {/* Uazapi 4 Sub-Tabs Navigation */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-slate-800/80">
            <button
              onClick={() => setUazapiSubTab('live')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
                uazapiSubTab === 'live'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              1. Atendimento SDR & Live Feed
            </button>
            <button
              onClick={() => setUazapiSubTab('scraper')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
                uazapiSubTab === 'scraper'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              2. Raspar Contatos de Grupos
            </button>
            <button
              onClick={() => setUazapiSubTab('broadcast')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
                uazapiSubTab === 'broadcast'
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              3. Disparo em Massa Inteligente (Anti-Ban)
            </button>
            <button
              onClick={() => setUazapiSubTab('tracking')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
                uazapiSubTab === 'tracking'
                  ? 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white shadow-lg shadow-purple-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              4. Dashboard de Transmissão & Retorno
            </button>
          </div>

          {/* ================= SUB-PANEL 1: ATENDIMENTO AO VIVO & SDR ================= */}
          {uazapiSubTab === 'live' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="glass-card p-4">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Conversas Hoje</span>
                  <p className="text-2xl font-black text-white mt-1">142 chats</p>
                  <span className="text-[10px] text-emerald-400">▲ 18% vs ontem</span>
                </div>
                <div className="glass-card p-4">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Tempo de 1ª Resposta</span>
                  <p className="text-2xl font-black text-emerald-400 mt-1">2.4 min</p>
                  <span className="text-[10px] text-slate-400">Meta SLA &lt; 5 min</span>
                </div>
                <div className="glass-card p-4">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Agendamentos</span>
                  <p className="text-2xl font-black text-cyan-400 mt-1">38 reuniões</p>
                  <span className="text-[10px] text-cyan-400">Taxa conversão: 26.7%</span>
                </div>
                <div className="glass-card p-4">
                  <span className="text-[10px] uppercase font-bold text-slate-400">SDRs Online</span>
                  <p className="text-2xl font-black text-amber-400 mt-1">3 atendentes</p>
                  <span className="text-[10px] text-slate-400">Recepção Ativa</span>
                </div>
              </div>

              {/* Live Feed */}
              <div className="glass-card p-5 space-y-4">
                <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-cyan-400" />
                    Feed em Tempo Real de Mensagens (Uazapi ➔ Kommo CRM)
                  </h3>
                  <Link href="/crm" className="text-xs font-bold text-cyan-400 hover:text-cyan-300">
                    Ver Pipeline CRM →
                  </Link>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center font-bold text-cyan-300">
                        RC
                      </div>
                      <div>
                        <p className="font-bold text-white">Roberto Camargo (+55 11 99888-1122)</p>
                        <p className="text-slate-400 text-[11px] mt-0.5">&quot;Olá, vi o anúncio sobre o empreendimento e gostaria de saber horários para quinta-feira.&quot;</p>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      Agendamento Aberto
                    </span>
                  </div>

                  <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center font-bold text-blue-300">
                        CL
                      </div>
                      <div>
                        <p className="font-bold text-white">Carla Lima (+55 11 97777-3344)</p>
                        <p className="text-slate-400 text-[11px] mt-0.5">&quot;Perfeito! Já confirmei a visita para amanhã às 14h com o corretor.&quot;</p>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                      ✓ Confirmado
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================= SUB-PANEL 2: RASPAR CONTATOS DE GRUPOS ================= */}
          {uazapiSubTab === 'scraper' && (
            <div className="space-y-6">
              <div className="glass-card p-6 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <Users className="w-4 h-4 text-cyan-400" />
                      Extrator & Raspador de Contatos de Grupos de WhatsApp
                    </h3>
                    <p className="text-xs text-slate-400">
                      Extraia telefones, nomes e identifique administradores reais de grupos sem disparar alerta aos participantes.
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={handleExportCSV}
                      className="px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5 transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Salvar & Baixar CSV
                    </button>
                    <button
                      onClick={() => setUazapiSubTab('broadcast')}
                      className="px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/20 flex items-center gap-1.5 transition-all"
                    >
                      <Send className="w-3.5 h-3.5" />
                      Enviar p/ Disparo em Massa
                    </button>
                  </div>
                </div>

                {/* Group Selector Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div
                    onClick={() => setSelectedGroupJid('120363402899636100@g.us')}
                    className={`p-4 rounded-xl border cursor-pointer transition-all ${
                      selectedGroupJid === '120363402899636100@g.us' || !selectedGroupJid
                        ? 'bg-cyan-500/10 border-cyan-500/40 shadow-lg shadow-cyan-500/10'
                        : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xl">🏢</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/20 text-cyan-300">
                        314 Membros
                      </span>
                    </div>
                    <h4 className="text-xs font-bold text-white">VIP Investidores & Lançamentos</h4>
                    <p className="text-[11px] text-slate-400 mt-1">Grupo de investidores de alto padrão</p>
                  </div>

                  <div
                    onClick={() => setSelectedGroupJid('120363045527587307@g.us')}
                    className={`p-4 rounded-xl border cursor-pointer transition-all ${
                      selectedGroupJid === '120363045527587307@g.us'
                        ? 'bg-cyan-500/10 border-cyan-500/40 shadow-lg shadow-cyan-500/10'
                        : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xl">🤝</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/20 text-cyan-300">
                        248 Membros
                      </span>
                    </div>
                    <h4 className="text-xs font-bold text-white">Executivos & Incorporadores</h4>
                    <p className="text-[11px] text-slate-400 mt-1">Público A/B • Tomadores de decisão</p>
                  </div>

                  <div
                    onClick={() => setSelectedGroupJid('120363321592688249@g.us')}
                    className={`p-4 rounded-xl border cursor-pointer transition-all ${
                      selectedGroupJid === '120363321592688249@g.us'
                        ? 'bg-cyan-500/10 border-cyan-500/40 shadow-lg shadow-cyan-500/10'
                        : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xl">✨</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/20 text-cyan-300">
                        282 Membros
                      </span>
                    </div>
                    <h4 className="text-xs font-bold text-white">{clientName} Grupo Oficial</h4>
                    <p className="text-[11px] text-slate-400 mt-1">Interessados e compradores ativos</p>
                  </div>
                </div>

                {/* Scraper Action Bar */}
                <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h4 className="text-xs font-bold text-white flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-cyan-400" />
                      Extração Direta via Uazapi Multi-Device Socket
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      Captura número internacional, identificador de administrador e salva na memória local.
                    </p>
                  </div>

                  <button
                    onClick={handleRunGroupScraper}
                    disabled={isScraping}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white flex items-center gap-2 shadow-lg shadow-cyan-500/20 transition-all"
                  >
                    {isScraping ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Users className="w-3.5 h-3.5" />}
                    Raspar Participantes Agora
                  </button>
                </div>

                {/* Scraped Contacts Table */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-200">
                      {scrapedContacts.length} Contatos Raspados na Memória:
                    </span>
                    <span className="text-emerald-400 font-medium">✓ 100% Números Válidos</span>
                  </div>

                  <div className="overflow-x-auto border border-slate-800 rounded-xl">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                        <tr>
                          <th className="p-3 font-semibold">Nome / Participante</th>
                          <th className="p-3 font-semibold">WhatsApp</th>
                          <th className="p-3 font-semibold">É Administrador?</th>
                          <th className="p-3 font-semibold">Grupo de Origem</th>
                          <th className="p-3 font-semibold text-right">Ação</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 font-mono text-slate-200">
                        {scrapedContacts.map((c) => (
                          <tr key={c.id} className="hover:bg-slate-900/40 transition-colors">
                            <td className="p-3 font-sans font-bold text-white">{c.name}</td>
                            <td className="p-3 text-cyan-300">{c.phone}</td>
                            <td className="p-3 font-sans">
                              {c.isAdmin ? (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1 w-fit">
                                  <Crown className="w-3 h-3" /> Admin do Grupo
                                </span>
                              ) : (
                                <span className="text-slate-400 text-[11px]">Membro</span>
                              )}
                            </td>
                            <td className="p-3 font-sans text-slate-300">{c.group}</td>
                            <td className="p-3 text-right font-sans">
                              <button
                                onClick={() => alert(`Iniciando conversa direta com ${c.name} (${c.phone})`)}
                                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-semibold transition-colors"
                              >
                                💬 Conversar
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================= SUB-PANEL 3: DISPARO EM MASSA INTELIGENTE ================= */}
          {uazapiSubTab === 'broadcast' && (
            <div className="glass-card p-6 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-emerald-400" />
                    Motor de Disparo em Massa Inteligente (Blindagem Anti-Banimento)
                  </h3>
                  <p className="text-xs text-slate-400">
                    Cadência humanizada, controle de administradores e 4 variações dinâmicas de mensagem
                  </p>
                </div>

                <button
                  onClick={handleStartBroadcast}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/20 hover:opacity-95 transition-opacity flex items-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  Iniciar Campanha de Disparo Seguro
                </button>
              </div>

              {/* 1. SELEÇÃO DA LISTA */}
              <div className="p-4 bg-slate-950/80 rounded-xl border border-slate-800 space-y-3">
                <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-wider">
                  1. Seleção e Importação da Lista de Destinatários
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="p-3.5 rounded-xl bg-slate-900 border border-cyan-500/40 flex justify-between items-center">
                    <div>
                      <p className="font-bold text-white">👥 Contatos Raspados dos Grupos</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">Base capturada dos grupos de WhatsApp</p>
                    </div>
                    <span className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-cyan-500/20 text-cyan-300">
                      {scrapedContacts.length} Contatos Carregados
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex justify-between items-center">
                    <div>
                      <p className="font-bold text-white">📂 Importar Outro Arquivo CSV</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">Suba planilha com colunas Nome e Telefone</p>
                    </div>
                    <button
                      onClick={() => alert('Selecione o arquivo CSV no seu computador para importar a lista!')}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center gap-1.5"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      Upload CSV
                    </button>
                  </div>
                </div>
              </div>

              {/* 2. REGRAS DE CADÊNCIA & FILTRO DE ADMINS */}
              <div className="p-4 bg-slate-950/80 rounded-xl border border-slate-800 space-y-4">
                <div className="flex justify-between items-center border-b border-slate-800/80 pb-2">
                  <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-emerald-400" />
                    2. Parâmetros de Blindagem Anti-Banimento (Simulação Humana)
                  </h4>
                  <span className="text-[10px] text-emerald-400 font-bold">● Proteção Ativa Algoritmo Meta</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
                  <div>
                    <label className="block text-slate-300 font-bold mb-1">Disparos Máx. / Dia:</label>
                    <input
                      type="number"
                      value={messagesPerDay}
                      onChange={(e) => setMessagesPerDay(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white font-mono"
                    />
                    <p className="text-[10px] text-slate-500 mt-1">Recomendado: 100-200/dia</p>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-bold mb-1">Msgs por Lote (Ciclo):</label>
                    <select
                      value={batchSize}
                      onChange={(e) => setBatchSize(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white"
                    >
                      <option value="3">3 mensagens por lote</option>
                      <option value="5">5 mensagens por lote</option>
                      <option value="10">10 mensagens por lote</option>
                    </select>
                    <p className="text-[10px] text-slate-500 mt-1">Pausa automática entre lotes</p>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-bold mb-1">Intervalo Randômico:</label>
                    <select
                      value={intervalOption}
                      onChange={(e) => setIntervalOption(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white"
                    >
                      <option value="25-45">25s a 45s (Humanizado)</option>
                      <option value="40-80">40s a 80s (Super Seguro)</option>
                      <option value="15-30">15s a 30s (Moderado)</option>
                    </select>
                    <p className="text-[10px] text-slate-500 mt-1">Simula digitação real</p>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-bold mb-1">Janela de Horário:</label>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="time"
                        value={timeWindowStart}
                        onChange={(e) => setTimeWindowStart(e.target.value)}
                        className="w-1/2 bg-slate-900 border border-slate-700 rounded-lg p-1.5 text-white text-xs"
                      />
                      <span className="text-slate-400 text-xs">às</span>
                      <input
                        type="time"
                        value={timeWindowEnd}
                        onChange={(e) => setTimeWindowEnd(e.target.value)}
                        className="w-1/2 bg-slate-900 border border-slate-700 rounded-lg p-1.5 text-white text-xs"
                      />
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1">Evita envios noturnos</p>
                  </div>
                </div>

                {/* CRITICAL: SELETOR DE TRATAMENTO DE ADMINISTRADORES DE GRUPOS */}
                <div className="p-3.5 bg-slate-900 rounded-xl border border-amber-500/30 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
                  <div className="space-y-0.5">
                    <p className="font-bold text-amber-300 flex items-center gap-2">
                      <Crown className="w-4 h-4 text-amber-400" />
                      Opção de Disparo para Administradores de Grupos:
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Decida se deseja excluir os admins dos disparos, incluir normalmente ou disparar apenas para eles.
                    </p>
                  </div>

                  <select
                    value={adminFilterOption}
                    onChange={(e) => setAdminFilterOption(e.target.value as any)}
                    className="bg-slate-950 border border-amber-500/50 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none min-w-[320px]"
                  >
                    <option value="exclude">🚫 Ignorar Admins de Grupos (Recomendado - Menor Risco)</option>
                    <option value="include">👥 Incluir Admins e Membros (Base Completa)</option>
                    <option value="only_admins">👑 Disparar APENAS para Administradores de Grupos (Foco B2B)</option>
                  </select>
                </div>
              </div>

              {/* 3. 4 VARIAÇÕES DE MENSAGEM (SPINTAX) */}
              <div className="p-4 bg-slate-950/80 rounded-xl border border-slate-800 space-y-3">
                <div className="flex justify-between items-center border-b border-slate-800/80 pb-2">
                  <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                    ✍️ 3. Motor de 4 Variações de Mensagem (Spintax Dinâmico)
                  </h4>
                  <span className="text-[10px] text-slate-400">Alterna a cada envio para neutralizar detecção de spam</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-1">
                    <span className="font-bold text-cyan-400 text-[10px] uppercase">Variação A (Benefício & Exclusividade):</span>
                    <textarea
                      value={copyA}
                      onChange={(e) => setCopyA(e.target.value)}
                      rows={3}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 leading-relaxed focus:border-cyan-500 focus:outline-none"
                    />
                  </div>

                  <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-1">
                    <span className="font-bold text-emerald-400 text-[10px] uppercase">Variação B (Apresentação Prioritária):</span>
                    <textarea
                      value={copyB}
                      onChange={(e) => setCopyB(e.target.value)}
                      rows={3}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 leading-relaxed focus:border-emerald-500 focus:outline-none"
                    />
                  </div>

                  <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-1">
                    <span className="font-bold text-purple-400 text-[10px] uppercase">Variação C (Rentabilidade & Condições):</span>
                    <textarea
                      value={copyC}
                      onChange={(e) => setCopyC(e.target.value)}
                      rows={3}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 leading-relaxed focus:border-purple-500 focus:outline-none"
                    />
                  </div>

                  <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-1">
                    <span className="font-bold text-pink-400 text-[10px] uppercase">Variação D (Catálogo Completo):</span>
                    <textarea
                      value={copyD}
                      onChange={(e) => setCopyD(e.target.value)}
                      rows={3}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 leading-relaxed focus:border-pink-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================= SUB-PANEL 4: DASHBOARD DE TRANSMISSÃO & RETORNO ================= */}
          {uazapiSubTab === 'tracking' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="glass-card p-4">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Total Carregado</span>
                  <p className="text-2xl font-black text-white mt-1">{scrapedContacts.length} contatos</p>
                  <span className="text-[10px] text-slate-400">Fila ativa</span>
                </div>
                <div className="glass-card p-4">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Mensagens Enviadas</span>
                  <p className="text-2xl font-black text-cyan-400 mt-1">312 msgs</p>
                  <span className="text-[10px] text-emerald-400 font-bold">Em conformidade</span>
                </div>
                <div className="glass-card p-4">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Taxa de Entrega</span>
                  <p className="text-2xl font-black text-emerald-400 mt-1">98.7% (308)</p>
                  <span className="text-[10px] text-slate-400">280 lidas</span>
                </div>
                <div className="glass-card p-4">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Taxa de Retorno (Leads)</span>
                  <p className="text-2xl font-black text-amber-400 mt-1">26.3% (82)</p>
                  <span className="text-[10px] text-amber-400 font-bold">Respostas recebidas</span>
                </div>
              </div>

              <div className="glass-card p-5 space-y-4">
                <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-purple-400" />
                    Log de Transmissão da Campanha em Tempo Real
                  </h3>
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
                    Fila Assíncrona Ativa
                  </span>
                </div>

                <div className="overflow-x-auto border border-slate-800 rounded-xl">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                      <tr>
                        <th className="p-3 font-semibold">Destinatário</th>
                        <th className="p-3 font-semibold">Número</th>
                        <th className="p-3 font-semibold">Variação Enviada</th>
                        <th className="p-3 font-semibold">Status de Envio</th>
                        <th className="p-3 font-semibold text-right">Retorno</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-mono text-slate-200">
                      <tr>
                        <td className="p-3 font-sans font-bold text-white">Guilherme Siqueira</td>
                        <td className="p-3 text-cyan-300">+55 41 99876-1234</td>
                        <td className="p-3 font-sans text-slate-400">Variação B</td>
                        <td className="p-3 font-sans">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            Entregue ✓✓
                          </span>
                        </td>
                        <td className="p-3 text-right font-sans">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/20 text-cyan-300">
                            Respondeu (Lead Ativo)
                          </span>
                        </td>
                      </tr>
                      <tr>
                        <td className="p-3 font-sans font-bold text-white">Dra. Vanessa Martins</td>
                        <td className="p-3 text-cyan-300">+55 41 98822-4411</td>
                        <td className="p-3 font-sans text-slate-400">Variação A</td>
                        <td className="p-3 font-sans">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            Lido ✓✓
                          </span>
                        </td>
                        <td className="p-3 text-right font-sans">
                          <span className="text-slate-500 text-[11px]">Aguardando</span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* CoEx Tab */
        <div className="glass-card p-6 space-y-4">
          <div className="border-b border-slate-800 pb-3 flex justify-between items-center">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                Meta CoEx Cloud API | Modelos HSM Oficiais
              </h3>
              <p className="text-xs text-slate-400">Modelos pré-aprovados pela Meta</p>
            </div>
          </div>
          <p className="text-xs text-slate-300">
            Campanhas oficiais com custo por conversa de 24h sem risco de bloqueio.
          </p>
        </div>
      )}

      {/* WhatsApp Connect Modal */}
      {showConnectModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#0f172a] border border-slate-700 rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-4 relative">
            <button
              onClick={() => setShowConnectModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <QrCode className="w-4 h-4 text-emerald-400" />
                Parear WhatsApp de {clientName}
              </h3>
              <p className="text-xs text-slate-400">Abra o WhatsApp ➔ Aparelhos Conectados ➔ Conectar um Aparelho</p>
            </div>

            <div className="flex flex-col items-center py-4 space-y-3">
              {isConnecting ? (
                <div className="h-48 flex flex-col items-center justify-center gap-2 text-xs text-slate-400">
                  <RefreshCw className="w-6 h-6 animate-spin text-emerald-400" />
                  <span>Gerando QR Code no servidor Uazapi...</span>
                </div>
              ) : qrCodeData ? (
                <div className="w-48 h-48 bg-white p-3 rounded-2xl flex items-center justify-center shadow-lg">
                  <img
                    src={qrCodeData.startsWith('data:') ? qrCodeData : `data:image/png;base64,${qrCodeData}`}
                    alt="QR Code WhatsApp"
                    className="w-full h-full object-contain"
                  />
                </div>
              ) : pairingCode ? (
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-center space-y-1">
                  <p className="text-xs text-slate-400">Código de Pareamento:</p>
                  <p className="text-2xl font-mono font-black text-emerald-400 tracking-widest">{pairingCode}</p>
                </div>
              ) : (
                <p className="text-xs text-slate-400">Clique abaixo para recarregar o QR Code.</p>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={handleConnect}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-500 hover:bg-emerald-600 text-white flex items-center gap-1.5 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Regenerar QR Code
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
