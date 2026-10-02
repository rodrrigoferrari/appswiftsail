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
} from 'lucide-react';
import Link from 'next/link';

export default function WhatsAppPage() {
  const { selectedClientId, activeClient } = useTenant();
  const [activeTab, setActiveTab] = useState<'uazapi' | 'coex'>('uazapi');
  const [uazapiConnected, setUazapiConnected] = useState<boolean>(false);
  const [uazapiData, setUazapiData] = useState<{
    url?: string;
    token?: string;
    instance?: string;
  }>({});

  // Uazapi broadcast parameters
  const [selectedAdminOption, setSelectedAdminOption] = useState<'exclude' | 'include' | 'only_admins'>('exclude');
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

  // Check Uazapi credentials from API
  useEffect(() => {
    async function checkUazapi() {
      try {
        const res = await fetch('/api/credentials');
        const data = await res.json();
        if (data.success && data.credentials?.uazapi_token) {
          setUazapiConnected(true);
          setUazapiData(data.credentials);
        } else {
          setUazapiConnected(false);
        }
      } catch (err) {
        setUazapiConnected(false);
      }
    }
    checkUazapi();
  }, []);

  const clientName = activeClient?.nome || (selectedClientId === 'ALL' ? 'Todos os Clientes' : selectedClientId);
  const groupJid = activeClient?.grupo_whatsapp_id || 'Nenhum grupo vinculado';

  const handleDownloadCSV = () => {
    if (!activeClient?.grupo_whatsapp_id) {
      alert('Nenhum grupo de WhatsApp está vinculado a este cliente no Supabase.');
      return;
    }
    const csvContent = `data:text/csv;charset=utf-8,ID,Cliente,Grupo_JID,Filtro_Admin,Data_Extracao\n1,${clientName},${groupJid},${selectedAdminOption},${new Date().toISOString()}`;
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `contatos_${clientName.toLowerCase().replace(/\\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-emerald-400" />
            Hub WhatsApp & Automações
          </h2>
          <p className="text-xs text-slate-400">
            Cliente: <b className="text-emerald-300">{clientName}</b> | Grupo WhatsApp: <span className="font-mono text-cyan-400">{groupJid}</span>
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
            Uazapi Socket (Anti-Ban)
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

      {activeTab === 'uazapi' ? (
        <div className="space-y-6">
          {/* Socket Instance Status + Scraper */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Real Connection Status Card */}
            <div className="glass-card p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Radio className="w-4 h-4 text-emerald-400" />
                  Status da Instância Uazapi
                </h3>
                {uazapiConnected ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    CONECTADO
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                    DESCONECTADO
                  </span>
                )}
              </div>

              {uazapiConnected ? (
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between text-slate-400">
                    <span>Instância Ativa:</span>
                    <span className="font-mono text-cyan-400 font-bold">{uazapiData.instance || 'inst_swiftsail_live'}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Servidor URL:</span>
                    <span className="font-mono text-slate-200 truncate max-w-[160px]">{uazapiData.url}</span>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-400 space-y-1">
                    <p className="text-rose-400 font-semibold flex items-center gap-1.5">
                      <AlertCircle className="w-4 h-4" />
                      Nenhuma instância pareada
                    </p>
                    <p className="text-[11px] leading-relaxed">
                      Insira o token de autenticação e URL da Uazapi para habilitar o envio de mensagens e extração de grupos.
                    </p>
                  </div>

                  <Link
                    href="/credenciais"
                    className="w-full py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-500 to-teal-600 text-white flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 hover:opacity-95 transition-opacity"
                  >
                    <QrCode className="w-4 h-4" />
                    Configurar Instância em Credenciais
                  </Link>
                </div>
              )}
            </div>

            {/* Real Group Scraper */}
            <div className="lg:col-span-2 glass-card p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <Users className="w-4 h-4 text-cyan-400" />
                    Raspagem de Contatos de Grupos (CSV)
                  </h3>
                  <p className="text-[11px] text-slate-400">Extração direta do grupo de WhatsApp do cliente</p>
                </div>
                <button
                  onClick={handleDownloadCSV}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 transition-colors flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  Baixar CSV
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800 space-y-1">
                  <p className="text-[10px] text-slate-400 uppercase font-semibold">Grupo Vinculado (Supabase)</p>
                  <p className="text-xs font-bold text-white truncate">{clientName}</p>
                  <p className="text-[10px] text-cyan-400 font-mono truncate">{groupJid}</p>
                </div>

                <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800 space-y-1">
                  <p className="text-[10px] text-slate-400 uppercase font-semibold">Filtro de Administradores</p>
                  <select
                    value={selectedAdminOption}
                    onChange={(e) => setSelectedAdminOption(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-200 mt-1 focus:outline-none focus:border-cyan-500"
                  >
                    <option value="exclude">🚫 Excluir Admins dos disparos (Recomendado)</option>
                    <option value="include">✅ Incluir Admins normalmente</option>
                    <option value="only_admins">⭐ Somente Admins do grupo</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Motor de Disparos em Massa */}
          <div className="glass-card p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-emerald-400" />
                  Motor de Disparos em Massa & Anti-Ban
                </h3>
                <p className="text-xs text-slate-400">Cadência humanizada e rotação de cópias</p>
              </div>
              <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5" />
                Anti-Ban Ativo
              </span>
            </div>

            {/* Parâmetros */}
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
                  Intervalo: <b className="text-cyan-400">{intervalMin}s - {intervalMax}s</b>
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

            {/* Spintax */}
            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-200 uppercase tracking-wider">
                Variações de Mensagem (Spintax)
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

            {/* Launch Button */}
            <div className="flex justify-end pt-4 border-t border-slate-800">
              {uazapiConnected ? (
                <button className="px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/20 hover:opacity-95 transition-opacity flex items-center gap-2">
                  <Send className="w-4 h-4" />
                  Iniciar Disparos
                </button>
              ) : (
                <Link
                  href="/credenciais"
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center gap-2 transition-colors"
                >
                  <AlertCircle className="w-4 h-4 text-amber-400" />
                  Conecte a Uazapi para Disparar
                </Link>
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
                Meta CoEx Cloud API | Modelos HSM
              </h3>
              <p className="text-xs text-slate-400">Disparos oficiais aprovados pela Meta</p>
            </div>
            <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              Meta Cloud API
            </span>
          </div>

          <p className="text-xs text-slate-300">
            Cadastre modelos de mensagem na Meta para disparo em massa seguro sem risco de bloqueio.
          </p>
        </div>
      )}
    </div>
  );
}
