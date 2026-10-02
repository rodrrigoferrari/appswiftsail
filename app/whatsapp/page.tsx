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
  Link2,
  CheckCircle2,
  ExternalLink,
  RefreshCw,
  Plus,
  Building,
  Check,
  X,
} from 'lucide-react';
import Link from 'next/link';

export default function WhatsAppPage() {
  const { selectedClientId, activeClient } = useTenant();
  const [activeTab, setActiveTab] = useState<'uazapi' | 'coex'>('uazapi');

  // Instance State for current client
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
  const [phoneForPairing, setPhoneForPairing] = useState('');
  const [showConnectModal, setShowConnectModal] = useState(false);

  // Group Scraper & Groups List
  const [groups, setGroups] = useState<any[]>([]);
  const [selectedGroupJid, setSelectedGroupJid] = useState('');
  const [selectedAdminOption, setSelectedAdminOption] = useState<'exclude' | 'include' | 'only_admins'>('exclude');
  const [isScraping, setIsScraping] = useState(false);

  // Broadcast settings
  const [messagesPerDay, setMessagesPerDay] = useState(150);
  const [batchSize, setBatchSize] = useState(5);
  const [intervalMin, setIntervalMin] = useState(45);
  const [intervalMax, setIntervalMax] = useState(90);
  const [variations, setVariations] = useState([
    'Olá {{nome}}, tudo bem? Temos novas oportunidades de investimento com condições exclusivas!',
    'Olá {{nome}}, gostaria de agendar uma apresentação com nosso consultor especialista?',
    'Boa tarde {{nome}}! Preparamos um catálogo com as melhores unidades.',
    'Oi {{nome}}, vi seu interesse em nossos lançamentos. Como posso te ajudar hoje?',
  ]);

  const clientName = activeClient?.nome || (selectedClientId === 'ALL' ? 'Todos os Clientes' : selectedClientId);

  // Load instance status when client changes
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

        // If connected, fetch live groups
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

  // Provision new instance via Admin Token
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
        alert(`Instância criada com sucesso via Admin Token!\nToken gerado e vinculado no Supabase.`);
        checkStatus();
      } else {
        alert(data.error || 'Erro ao criar instância.');
      }
    } catch (err) {
      alert('Falha ao comunicar com a API Uazapi.');
    } finally {
      setIsProvisioning(false);
    }
  };

  // Start WhatsApp Connect Flow
  const handleConnect = async () => {
    setIsConnecting(true);
    setQrCodeData(null);
    setPairingCode(null);
    setShowConnectModal(true);
    try {
      const res = await fetch('/api/uazapi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'connect',
          cliente_id: selectedClientId,
          phone: phoneForPairing || undefined,
        }),
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

  // Scrape Group
  const handleScrapeGroup = async () => {
    if (!selectedGroupJid) {
      alert('Selecione um grupo para extrair.');
      return;
    }
    setIsScraping(true);
    try {
      const res = await fetch('/api/uazapi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'scrape_group',
          cliente_id: selectedClientId,
          group_jid: selectedGroupJid,
        }),
      });
      const data = await res.json();
      if (data.success && data.group) {
        const participants = data.group.participants || [];
        let filtered = participants;
        if (selectedAdminOption === 'exclude') {
          filtered = participants.filter((p: any) => !p.admin);
        } else if (selectedAdminOption === 'only_admins') {
          filtered = participants.filter((p: any) => p.admin);
        }

        const csvContent =
          'data:text/csv;charset=utf-8,ID,Phone,Is_Admin\n' +
          filtered.map((p: any, i: number) => `${i + 1},${p.id || p.jid},${p.admin ? 'true' : 'false'}`).join('\n');

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', `contatos_${clientName.toLowerCase().replace(/\s+/g, '_')}_grupo.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        alert(data.error || 'Erro ao extrair grupo.');
      }
    } catch {
      alert('Falha ao raspar contatos.');
    } finally {
      setIsScraping(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-emerald-400" />
            Hub WhatsApp & Instâncias Uazapi 2.4.3
          </h2>
          <p className="text-xs text-slate-400">
            Cliente Ativo: <b className="text-emerald-300">{clientName}</b> • Gerenciamento isolado por sessão
          </p>
        </div>

        {/* Engine Switcher */}
        <div className="flex bg-slate-900/90 border border-slate-800 rounded-xl p-1 text-xs">
          <button
            onClick={() => setActiveTab('uazapi')}
            className={`px-4 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-2 ${
              activeTab === 'uazapi'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            Uazapi Socket (Por Cliente)
          </button>
          <button
            onClick={() => setActiveTab('coex')}
            className={`px-4 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-2 ${
              activeTab === 'coex'
                ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            Meta CoEx (Cloud API HSM)
          </button>
        </div>
      </div>

      {/* ================= UAZAPI TAB ================= */}
      {activeTab === 'uazapi' ? (
        <div className="space-y-6">
          {/* Top Instance Status & Actions */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Instance Status Card */}
            <div className="glass-card p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Radio className="w-4 h-4 text-emerald-400" />
                  Instância do Cliente
                </h3>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                    instanceInfo.status === 'connected'
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : instanceInfo.status === 'connecting'
                      ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                  }`}
                >
                  {instanceInfo.status === 'connected'
                    ? '● ONLINE & CONECTADO'
                    : instanceInfo.status === 'connecting'
                    ? '● CONECTANDO...'
                    : instanceInfo.hasInstance
                    ? '● DESCONECTADO'
                    : 'NÃO CRIADA'}
                </span>
              </div>

              {!instanceInfo.hasInstance ? (
                <div className="space-y-3">
                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs text-slate-400 space-y-1">
                    <p className="font-semibold text-white">Nenhuma sessão criada para {clientName}</p>
                    <p className="text-[11px]">
                      Clique abaixo para provisionar a instância automaticamente no servidor da Uazapi usando o seu **Admin Token Mestre**.
                    </p>
                  </div>
                  <button
                    onClick={handleCreateInstance}
                    disabled={isProvisioning}
                    className="w-full py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-500 to-teal-600 text-white flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 hover:opacity-95 transition-opacity"
                  >
                    {isProvisioning ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                    Provisionar Instância com Admin Token
                  </button>
                </div>
              ) : (
                <div className="space-y-3 text-xs">
                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1.5">
                    <div className="flex justify-between text-slate-400">
                      <span>Instância:</span>
                      <span className="font-mono text-cyan-300 font-bold">
                        swiftsail-{selectedClientId.toLowerCase().replace(/[^a-z0-9]/g, '-')}
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Status WhatsApp:</span>
                      <span className="font-mono font-bold text-white capitalize">{instanceInfo.status}</span>
                    </div>
                  </div>

                  {instanceInfo.status !== 'connected' ? (
                    <button
                      onClick={handleConnect}
                      className="w-full py-2.5 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-600 text-white flex items-center justify-center gap-2 transition-colors shadow-lg shadow-emerald-500/20"
                    >
                      <QrCode className="w-4 h-4" />
                      Conectar WhatsApp (QR Code)
                    </button>
                  ) : (
                    <button
                      onClick={checkStatus}
                      className="w-full py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isLoadingStatus ? 'animate-spin' : ''}`} />
                      Atualizar Status
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Group Scraper Card */}
            <div className="lg:col-span-2 glass-card p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <Users className="w-4 h-4 text-cyan-400" />
                    Raspagem de Grupos em Tempo Real
                  </h3>
                  <p className="text-[11px] text-slate-400">Extração de participantes e admins via Uazapi 2.4.3</p>
                </div>
                <button
                  onClick={handleScrapeGroup}
                  disabled={isScraping || instanceInfo.status !== 'connected'}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 transition-colors flex items-center gap-1.5 disabled:opacity-40"
                >
                  {isScraping ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                  Exportar CSV do Grupo
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800 space-y-1">
                  <p className="text-[10px] text-slate-400 uppercase font-semibold">Grupo do WhatsApp</p>
                  {groups.length > 0 ? (
                    <select
                      value={selectedGroupJid}
                      onChange={(e) => setSelectedGroupJid(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg p-1.5 text-xs text-white mt-1"
                    >
                      {groups.map((g) => (
                        <option key={g.id || g.jid} value={g.id || g.jid}>
                          {g.name || g.subject || g.id}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <p className="text-xs font-mono text-cyan-300 pt-1">
                      {activeClient?.grupo_whatsapp_id || 'Conecte a instância para listar grupos'}
                    </p>
                  )}
                </div>

                <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800 space-y-1">
                  <p className="text-[10px] text-slate-400 uppercase font-semibold">Filtro de Administradores</p>
                  <select
                    value={selectedAdminOption}
                    onChange={(e) => setSelectedAdminOption(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-200 mt-1"
                  >
                    <option value="exclude">🚫 Excluir Admins (Recomendado)</option>
                    <option value="include">✅ Incluir Admins</option>
                    <option value="only_admins">⭐ Somente Admins do grupo</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Mass Broadcast Section */}
          <div className="glass-card p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-emerald-400" />
                  Motor de Disparos em Massa & Anti-Ban
                </h3>
                <p className="text-xs text-slate-400">Cadência humanizada e fila assíncrona (async: true)</p>
              </div>
              <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5" />
                Anti-Ban Engine Ativo
              </span>
            </div>

            {/* Parameters */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 space-y-2">
                <label className="block text-xs font-semibold text-slate-300">
                  Disparo Máximo por Dia: <b className="text-cyan-400">{messagesPerDay}</b>
                </label>
                <input
                  type="range"
                  min="20"
                  max="500"
                  step="10"
                  value={messagesPerDay}
                  onChange={(e) => setMessagesPerDay(Number(e.target.value))}
                  className="w-full accent-cyan-400"
                />
              </div>

              <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 space-y-2">
                <label className="block text-xs font-semibold text-slate-300">
                  Mensagens por Lote: <b className="text-cyan-400">{batchSize} msgs</b>
                </label>
                <input
                  type="range"
                  min="1"
                  max="20"
                  value={batchSize}
                  onChange={(e) => setBatchSize(Number(e.target.value))}
                  className="w-full accent-cyan-400"
                />
              </div>

              <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 space-y-2">
                <label className="block text-xs font-semibold text-slate-300">
                  Intervalo Humanizado: <b className="text-cyan-400">{intervalMin}s - {intervalMax}s</b>
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={intervalMin}
                    onChange={(e) => setIntervalMin(Number(e.target.value))}
                    className="w-1/2 bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white"
                  />
                  <input
                    type="number"
                    value={intervalMax}
                    onChange={(e) => setIntervalMax(Number(e.target.value))}
                    className="w-1/2 bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white"
                  />
                </div>
              </div>
            </div>

            {/* Spintax Copies */}
            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-200 uppercase tracking-wider">
                Variações de Mensagem (Spintax Rotativo)
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {variations.map((v, idx) => (
                  <div key={idx} className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 space-y-1.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Variação 0{idx + 1}</span>
                    <textarea
                      value={v}
                      onChange={(e) => {
                        const newVars = [...variations];
                        newVars[idx] = e.target.value;
                        setVariations(newVars);
                      }}
                      rows={2}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Launch Action */}
            <div className="flex justify-end pt-4 border-t border-slate-800">
              {instanceInfo.status === 'connected' ? (
                <button className="px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/20 hover:opacity-95 transition-opacity flex items-center gap-2">
                  <Send className="w-4 h-4" />
                  Iniciar Campanha de Disparos
                </button>
              ) : (
                <button
                  onClick={handleConnect}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center gap-2 transition-colors"
                >
                  <AlertCircle className="w-4 h-4 text-amber-400" />
                  Conecte a Sessão do WhatsApp para Disparar
                </button>
              )}
            </div>
          </div>
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

      {/* WhatsApp Connect Modal (QR Code & Pairing Code) */}
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
                Parear WhatsApp da Instância {clientName}
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
