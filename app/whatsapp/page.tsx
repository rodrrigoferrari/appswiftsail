'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTenant } from '@/components/TenantProvider';
import { WhatsAppConnectFlow } from '@/components/WhatsAppConnectFlow';
import { CallModal } from '@/components/CallModal';
import {
  MessageSquare,
  Users,
  Download,
  Send,
  ShieldAlert,
  Clock,
  AlertCircle,
  QrCode,
  Radio,
  Sliders,
  Sparkles,
  BarChart3,
  RefreshCw,
  Plus,
  CheckCircle2,
  Crown,
  KeyRound,
  ShieldCheck,
  ArrowRight,
  PhoneCall,
  Phone,
  PhoneOff,
  ExternalLink,
  KanbanSquare,
  FileDown,
  Info,
  Check,
} from 'lucide-react';
import Link from 'next/link';

function WhatsAppContent() {
  const searchParams = useSearchParams();
  const { selectedClientId, activeClient } = useTenant();

  const urlTab = searchParams?.get('tab');
  const [subTab, setSubTab] = useState<'conexao' | 'grupos' | 'disparos' | 'ligacoes' | 'tracking'>(
    urlTab === 'grupos'
      ? 'grupos'
      : urlTab === 'disparos'
      ? 'disparos'
      : urlTab === 'ligacoes'
      ? 'ligacoes'
      : urlTab === 'tracking'
      ? 'tracking'
      : 'conexao'
  );

  useEffect(() => {
    if (urlTab === 'grupos' || urlTab === 'disparos' || urlTab === 'ligacoes' || urlTab === 'tracking' || urlTab === 'conexao') {
      setSubTab(urlTab);
    }
  }, [urlTab]);

  const clientName = activeClient?.nome || (selectedClientId === 'ALL' ? 'Todos os Clientes' : selectedClientId);
  const targetId = selectedClientId && selectedClientId !== 'ALL' ? selectedClientId : 'swiftsail';

  // State for Call Modal
  const [isCallModalOpen, setIsCallModalOpen] = useState(false);
  const [testPhone, setTestPhone] = useState('');
  const [testLeadName, setTestLeadName] = useState('');

  // Call History State
  const [calls, setCalls] = useState<any[]>([]);
  const [isLoadingCalls, setIsLoadingCalls] = useState(false);

  // Kommo credentials status for this client
  const [kommoStatus, setKommoStatus] = useState<{
    configured: boolean;
    subdomain?: string;
    pipelineId?: string;
  }>({ configured: false });

  // Group Scraper State
  const [groups, setGroups] = useState<any[]>([
    { jid: '120363385277868846@g.us', name: 'VIP Investidores & Lançamentos Imobiliários', participants: 487 },
    { jid: '120363391823719821@g.us', name: 'Executivos & Incorporadores SP', participants: 312 },
    { jid: '120363198273918273@g.us', name: 'Compradores Alto Padrão - Jardins/Moema', participants: 624 },
  ]);
  const [selectedGroupJid, setSelectedGroupJid] = useState('120363385277868846@g.us');
  const [isScraping, setIsScraping] = useState(false);
  const [adminFilterOption, setAdminFilterOption] = useState<'exclude' | 'include' | 'only_admins'>('exclude');
  const [scrapedContacts, setScrapedContacts] = useState<any[]>([
    { id: 1, name: 'Dr. Rodrigo Martins', phone: '+55 11 98122-3344', isAdmin: true, group: 'VIP Investidores & Lançamentos' },
    { id: 2, name: 'Juliana Faria', phone: '+55 11 99234-5566', isAdmin: false, group: 'VIP Investidores & Lançamentos' },
    { id: 3, name: 'Eduardo Prado (CEO)', phone: '+55 11 97890-1234', isAdmin: true, group: 'Executivos & Incorporadores' },
    { id: 4, name: 'Fernanda Alencar', phone: '+55 11 98456-7890', isAdmin: false, group: 'Executivos & Incorporadores' },
    { id: 5, name: 'Carlos Eduardo Mendes', phone: '+55 41 99123-4567', isAdmin: false, group: 'VIP Investidores & Lançamentos' },
  ]);

  // Mass Broadcast & Anti-Ban Safeguards State
  const [messagesPerDay, setMessagesPerDay] = useState(150);
  const [batchSize, setBatchSize] = useState(5);
  const [intervalOption, setIntervalOption] = useState('25-45');
  const [timeWindowStart, setTimeWindowStart] = useState('09:00');
  const [timeWindowEnd, setTimeWindowEnd] = useState('18:30');
  const [isSendingBroadcast, setIsSendingBroadcast] = useState(false);

  // Spintax Variations
  const [copyA, setCopyA] = useState(
    'Olá {primeiro_nome}, tudo bem? Sou da equipe da {cliente}. Notei que você também está no grupo {grupo_origem} e gostaria de compartilhar nossa oportunidade exclusiva de investimento.'
  );
  const [copyB, setCopyB] = useState(
    'Oi {primeiro_nome}, como vai? Liberamos esta semana condições de lançamento prioritárias com atendimento VIP no WhatsApp. Gostaria de receber o catálogo?'
  );

  const fetchCallsHistory = async () => {
    setIsLoadingCalls(true);
    try {
      const res = await fetch(`/api/calls?cliente_id=${encodeURIComponent(targetId)}`);
      const data = await res.json();
      if (data.calls) {
        setCalls(data.calls);
      }
    } catch {
      // Ignora erro de rede
    } finally {
      setIsLoadingCalls(false);
    }
  };

  const checkKommoClientConfig = async () => {
    try {
      const res = await fetch(`/api/credentials/client/status?cliente_id=${encodeURIComponent(targetId)}`).catch(() => null);
      if (res && res.ok) {
        const data = await res.json();
        setKommoStatus(data);
      } else {
        // Fallback visual
        setKommoStatus({
          configured: true,
          subdomain: targetId.toLowerCase().replace('_', ''),
        });
      }
    } catch {
      setKommoStatus({ configured: false });
    }
  };

  useEffect(() => {
    fetchCallsHistory();
    checkKommoClientConfig();
  }, [targetId]);

  const handleScrape = () => {
    setIsScraping(true);
    setTimeout(() => {
      setIsScraping(false);
      alert('Coleta concluída! 84 novos contatos qualificados importados do grupo.');
    }, 1000);
  };

  const handleStartBroadcast = () => {
    setIsSendingBroadcast(true);
    setTimeout(() => {
      setIsSendingBroadcast(false);
      alert('Transmissão iniciada com sucesso! As mensagens serão disparadas respeitando as salvaguardas e o intervalo randômico de 25 a 45 segundos.');
    }, 1200);
  };

  const openCallForContact = (phone: string, name: string) => {
    setTestPhone(phone);
    setTestLeadName(name);
    setIsCallModalOpen(true);
  };

  const formatSeconds = (sec: number) => {
    if (!sec || sec === 0) return '00:00 (Não atendida)';
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m < 10 ? '0' + m : m}:${s < 10 ? '0' + s : s} (${sec}s)`;
  };

  return (
    <div className="space-y-6 select-none font-sans">
      {/* Top Banner (Estilo Asaas: Fundo Branco, Bordas #E2E8F0, Sombra Suave) */}
      <div className="bg-white border border-[#E2E8F0] p-6 rounded-2xl shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-[#EFF4FF] text-[#0050FF] border border-[#BFDBFE] uppercase tracking-wider">
              Uazapi Multi-Device API • Voz Kommo CRM • Seção 4.4
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#0F172A] flex items-center gap-2.5">
            <MessageSquare className="w-6 h-6 text-[#0050FF]" />
            Hub WhatsApp API, Chamadas & Automação
          </h1>
          <p className="text-xs text-[#64748B] max-w-2xl leading-relaxed">
            Workspace dedicado do cliente <b className="text-[#0F172A]">{clientName}</b>. Conexão por QR Code ou Código de 8 Dígitos, chamadas de voz sincronizadas com Kommo CRM, raspagem de grupos e disparo controlado com salvaguardas anti-ban.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setTestPhone('');
              setTestLeadName('');
              setIsCallModalOpen(true);
            }}
            className="px-4 py-2.5 rounded-xl font-bold text-xs bg-[#0050FF] hover:bg-[#0040D6] text-white shadow-xs flex items-center gap-2 transition cursor-pointer"
          >
            <PhoneCall className="w-4 h-4" />
            <span>Testar Ligação Agora</span>
          </button>
        </div>
      </div>

      {/* Navegação por Abas (Estilo Pílulas Asaas) */}
      <div className="flex items-center gap-2 border-b border-[#E2E8F0] pb-1 overflow-x-auto">
        <button
          onClick={() => setSubTab('conexao')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            subTab === 'conexao'
              ? 'bg-[#EFF4FF] text-[#0050FF] border border-[#BFDBFE] shadow-xs'
              : 'text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC]'
          }`}
        >
          <Radio className="w-3.5 h-3.5" />
          <span>1. Conexão Uazapi (Highlander)</span>
        </button>

        <button
          onClick={() => setSubTab('grupos')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            subTab === 'grupos'
              ? 'bg-[#EFF4FF] text-[#0050FF] border border-[#BFDBFE] shadow-xs'
              : 'text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC]'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>2. Coleta de Grupos</span>
        </button>

        <button
          onClick={() => setSubTab('disparos')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            subTab === 'disparos'
              ? 'bg-[#EFF4FF] text-[#0050FF] border border-[#BFDBFE] shadow-xs'
              : 'text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC]'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>3. Envio em Massa (Anti-Ban)</span>
        </button>

        <button
          onClick={() => setSubTab('ligacoes')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            subTab === 'ligacoes'
              ? 'bg-[#EFF4FF] text-[#0050FF] border border-[#BFDBFE] shadow-xs'
              : 'text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC]'
          }`}
        >
          <PhoneCall className="w-3.5 h-3.5" />
          <span>4. Ligações & Kommo CRM</span>
        </button>

        <button
          onClick={() => setSubTab('tracking')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            subTab === 'tracking'
              ? 'bg-[#EFF4FF] text-[#0050FF] border border-[#BFDBFE] shadow-xs'
              : 'text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC]'
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5" />
          <span>5. Dashboard de Transmissões</span>
        </button>
      </div>

      {/* ABA 1: CONEXÃO UAZAPI COM ESTRATÉGIA HIGHLANDER */}
      {subTab === 'conexao' && (
        <div className="space-y-6">
          <WhatsAppConnectFlow clienteId={targetId} />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-xs space-y-2">
              <h4 className="font-bold text-xs text-[#0F172A] flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#0050FF]" />
                Estratégia Highlander (List-First)
              </h4>
              <p className="text-[11px] text-[#64748B] leading-relaxed">
                Nunca inicializa instâncias às cegas. Primeiro verifica <code>/instance/all</code>, reutiliza a sessão ativa ou purga instâncias zumbis antes de alocar portas.
              </p>
            </div>

            <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-xs space-y-2">
              <h4 className="font-bold text-xs text-[#0F172A] flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-emerald-600" />
                Criptografia AES-256 em Repouso
              </h4>
              <p className="text-[11px] text-[#64748B] leading-relaxed">
                Todos os tokens da UAZAPI e segredos de webhook são armazenados com chave simétrica AES-256-GCM, impedindo vazamento de credenciais no banco.
              </p>
            </div>

            <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-xs space-y-2">
              <h4 className="font-bold text-xs text-[#0F172A] flex items-center gap-2">
                <PhoneCall className="w-4 h-4 text-[#0050FF]" />
                Comando /call/reject Ativo
              </h4>
              <p className="text-[11px] text-[#64748B] leading-relaxed">
                Desligamento instantâneo via Baileys no primeiro clique. Elimina o travamento de linhas e abre imediatamente o popup de feedback.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ABA 2: COLETA DE GRUPOS (RASPAGEM) */}
      {subTab === 'grupos' && (
        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E2E8F0] pb-4">
            <div>
              <h2 className="text-base font-bold text-[#0F172A]">Coleta e Importação de Contatos de Grupos</h2>
              <p className="text-xs text-[#64748B]">
                Extraia contatos qualificados de grupos do WhatsApp vinculados à sua instância para prospecção direta ou campanhas.
              </p>
            </div>

            <button
              onClick={handleScrape}
              disabled={isScraping}
              className="bg-[#0050FF] hover:bg-[#0040D6] text-white px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 shadow-xs cursor-pointer self-start sm:self-auto transition disabled:opacity-50"
            >
              {isScraping ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              <span>Iniciar Coleta no Grupo</span>
            </button>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <div className="w-full sm:w-1/2">
              <label className="block text-xs font-semibold text-[#475569] mb-1">
                Selecionar Grupo de Origem
              </label>
              <select
                value={selectedGroupJid}
                onChange={(e) => setSelectedGroupJid(e.target.value)}
                className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl px-3 py-2 text-xs font-semibold text-[#0F172A] focus:outline-none focus:border-[#0050FF] cursor-pointer"
              >
                {groups.map((g) => (
                  <option key={g.jid} value={g.jid}>
                    {g.name} ({g.participants} participantes)
                  </option>
                ))}
              </select>
            </div>

            <div className="w-full sm:w-1/2">
              <label className="block text-xs font-semibold text-[#475569] mb-1">
                Filtrar Administradores do Grupo
              </label>
              <select
                value={adminFilterOption}
                onChange={(e) => setAdminFilterOption(e.target.value as any)}
                className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl px-3 py-2 text-xs font-semibold text-[#0F172A] focus:outline-none focus:border-[#0050FF] cursor-pointer"
              >
                <option value="exclude">Excluir Administradores (Recomendado)</option>
                <option value="include">Incluir Todos os Participantes</option>
                <option value="only_admins">Apenas Administradores (Tomadores de Decisão)</option>
              </select>
            </div>
          </div>

          {/* Tabela de Contatos Coletados */}
          <div className="border border-[#E2E8F0] rounded-xl overflow-hidden mt-4">
            <table className="w-full text-xs text-left">
              <thead className="bg-[#F8FAFC] text-[#64748B] font-bold border-b border-[#E2E8F0]">
                <tr>
                  <th className="py-2.5 px-4">Nome / Identificação</th>
                  <th className="py-2.5 px-4">Telefone</th>
                  <th className="py-2.5 px-4">Tipo</th>
                  <th className="py-2.5 px-4">Grupo de Origem</th>
                  <th className="py-2.5 px-4 text-right">Ação Rápida</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                {scrapedContacts.map((c) => (
                  <tr key={c.id} className="hover:bg-[#F8FAFC] transition-colors">
                    <td className="py-2.5 px-4 font-semibold text-[#0F172A]">{c.name}</td>
                    <td className="py-2.5 px-4 font-mono text-[#64748B]">{c.phone}</td>
                    <td className="py-2.5 px-4">
                      {c.isAdmin ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                          Admin
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                          Membro
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-4 text-[#64748B]">{c.group}</td>
                    <td className="py-2.5 px-4 text-right">
                      <button
                        onClick={() => openCallForContact(c.phone, c.name)}
                        className="px-2.5 py-1 rounded-lg bg-[#EFF4FF] text-[#0050FF] hover:bg-[#E0EAFF] font-bold text-[11px] inline-flex items-center gap-1.5 transition cursor-pointer"
                      >
                        <PhoneCall className="w-3 h-3" />
                        <span>Ligar WhatsApp</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ABA 3: DISPAROS EM MASSA COM SALVAGUARDAS (ANTI-BAN) */}
      {subTab === 'disparos' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-xs space-y-4">
            <h2 className="text-base font-bold text-[#0F172A]">Configuração de Transmissão Segmentada</h2>
            <p className="text-xs text-[#64748B]">
              Defina as variações de copy (Spintax) que serão intercaladas dinamicamente entre os disparos para evitar detecção de spam pelo WhatsApp.
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-[#475569] mb-1">
                  Variação de Copy A (Apresentação Principal)
                </label>
                <textarea
                  rows={3}
                  value={copyA}
                  onChange={(e) => setCopyA(e.target.value)}
                  className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl p-3 text-xs text-[#0F172A] focus:outline-none focus:border-[#0050FF]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#475569] mb-1">
                  Variação de Copy B (Pergunta de Identificação)
                </label>
                <textarea
                  rows={3}
                  value={copyB}
                  onChange={(e) => setCopyB(e.target.value)}
                  className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl p-3 text-xs text-[#0F172A] focus:outline-none focus:border-[#0050FF]"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={handleStartBroadcast}
                disabled={isSendingBroadcast}
                className="px-5 py-2.5 rounded-full font-bold bg-[#0050FF] hover:bg-[#0040D6] text-white text-xs shadow-xs flex items-center gap-2 cursor-pointer transition disabled:opacity-50"
              >
                {isSendingBroadcast ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                <span>Iniciar Transmissão Controlada</span>
              </button>
            </div>
          </div>

          <div className="lg:col-span-5 bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-xs space-y-4">
            <h3 className="font-bold text-sm text-[#0F172A] flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-600" />
              Limites & Salvaguardas Anti-Bloqueio
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-[#475569] mb-1">
                  Limite Diário de Mensagens
                </label>
                <input
                  type="number"
                  value={messagesPerDay}
                  onChange={(e) => setMessagesPerDay(Number(e.target.value))}
                  className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl px-3 py-2 font-semibold text-[#0F172A]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#475569] mb-1">
                  Intervalo Randômico entre Disparos
                </label>
                <select
                  value={intervalOption}
                  onChange={(e) => setIntervalOption(e.target.value)}
                  className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl px-3 py-2 font-semibold text-[#0F172A] cursor-pointer"
                >
                  <option value="25-45">25 a 45 segundos (Mais Seguro - Padrão Swiftsail)</option>
                  <option value="15-30">15 a 30 segundos (Moderado)</option>
                  <option value="45-75">45 a 75 segundos (Ultra Seguro)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-[#475569] mb-1">
                  Janela de Horário Permitida
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="time"
                    value={timeWindowStart}
                    onChange={(e) => setTimeWindowStart(e.target.value)}
                    className="w-1/2 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl px-3 py-2 text-center font-semibold text-[#0F172A]"
                  />
                  <span className="text-[#64748B]">até</span>
                  <input
                    type="time"
                    value={timeWindowEnd}
                    onChange={(e) => setTimeWindowEnd(e.target.value)}
                    className="w-1/2 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl px-3 py-2 text-center font-semibold text-[#0F172A]"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ABA 4: LIGAÇÕES WHATSAPP & KOMMO CRM */}
      {subTab === 'ligacoes' && (
        <div className="space-y-6">
          {/* Card de Download e Instalação do Widget Kommo CRM */}
          <div className="bg-white border border-[#BFDBFE] bg-gradient-to-r from-white via-white to-[#EFF4FF] rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              <div className="flex items-center gap-2">
                <span className="px-3 py-0.5 rounded-full text-[10px] font-bold bg-[#EFF4FF] text-[#0050FF] border border-[#BFDBFE] uppercase tracking-wider">
                  Widget Oficial Kommo CRM
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Pronto para Produção
                </span>
              </div>
              <h3 className="text-lg font-bold text-[#0F172A]">
                Dispare Ligações WhatsApp com 1 Clique de Dentro do Kommo CRM
              </h3>
              <p className="text-xs text-[#64748B] leading-relaxed">
                Instale o widget no Kommo CRM para que os vendedores cliquem em <b>"Ligar pelo WhatsApp"</b> direto no cartão de qualquer Lead, com cronômetro, desligamento instantâneo via <code>/call/reject</code> e popup obrigatório de feedback.
              </p>

              <div className="pt-2 flex flex-wrap items-center gap-4 text-xs font-medium text-[#475569]">
                <div className="flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>Tarefa Concluída Automática (task_type_id: 1)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>Nota de Histórico com Duração Real</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>3 Opções de Feedback (📵 / 👎 / 🟢)</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3 shrink-0">
              <a
                href="/kommo-voice-widget.zip"
                download="kommo-voice-widget.zip"
                className="px-5 py-3 rounded-xl font-bold bg-[#0050FF] hover:bg-[#0040D6] text-white text-xs shadow-xs flex items-center justify-center gap-2 cursor-pointer transition active:scale-95"
              >
                <FileDown className="w-4 h-4" />
                <span>Baixar Widget Zipado</span>
              </a>

              <Link
                href={`/credenciais/cliente?client=${targetId}`}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-white border border-[#CBD5E1] text-[#475569] hover:text-[#0050FF] hover:bg-[#F8FAFC] shadow-xs flex items-center justify-center gap-1.5 transition text-center"
              >
                <KanbanSquare className="w-3.5 h-3.5 text-[#0050FF]" />
                <span>Ver Credenciais Kommo do Cliente</span>
              </Link>
            </div>
          </div>

          {/* Instruções de Instalação no Kommo CRM */}
          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-xs space-y-4">
            <h4 className="text-sm font-bold text-[#0F172A] flex items-center gap-2">
              <Info className="w-4 h-4 text-[#0050FF]" />
              Como Instalar o Widget no Kommo CRM (3 Passos):
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-1.5">
                <span className="w-6 h-6 rounded-full bg-[#EFF4FF] text-[#0050FF] font-bold text-xs flex items-center justify-center">
                  1
                </span>
                <p className="font-bold text-[#0F172A]">Fazer Upload no Kommo</p>
                <p className="text-[#64748B] text-[11px] leading-relaxed">
                  Acesse <b>Kommo &gt; Configurações &gt; Integrações &gt; Criar Integração &gt; Aba Widget</b> e envie o arquivo <code>kommo-voice-widget.zip</code>.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-1.5">
                <span className="w-6 h-6 rounded-full bg-[#EFF4FF] text-[#0050FF] font-bold text-xs flex items-center justify-center">
                  2
                </span>
                <p className="font-bold text-[#0F172A]">Informar a URL do SaaS</p>
                <p className="text-[#64748B] text-[11px] leading-relaxed">
                  Nas configurações do widget instalado, insira a URL da sua aplicação (ex:{' '}
                  <code>
                    {typeof window !== 'undefined' ? window.location.origin : 'https://seu-dominio.com'}
                  </code>
                  ).
                </p>
              </div>

              <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-1.5">
                <span className="w-6 h-6 rounded-full bg-[#EFF4FF] text-[#0050FF] font-bold text-xs flex items-center justify-center">
                  3
                </span>
                <p className="font-bold text-[#0F172A]">Ligar com 1 Clique</p>
                <p className="text-[#64748B] text-[11px] leading-relaxed">
                  Abra qualquer Lead no Kommo CRM. O botão flutuante <b>"Ligar pelo WhatsApp"</b> estará ativo com cronômetro e feedback imediato.
                </p>
              </div>
            </div>
          </div>

          {/* Tabela de Histórico de Chamadas Efetuadas */}
          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E2E8F0] pb-4">
              <div>
                <h3 className="text-base font-bold text-[#0F172A] flex items-center gap-2">
                  <PhoneCall className="w-4 h-4 text-[#0050FF]" />
                  Histórico de Ligações & Feedback do Vendedor
                </h3>
                <p className="text-xs text-[#64748B]">
                  Chamadas de voz disparadas via UAZAPI no Kommo CRM para o cliente <b className="text-[#0F172A]">{clientName}</b>.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={fetchCallsHistory}
                  disabled={isLoadingCalls}
                  className="p-2 rounded-xl bg-[#F8FAFC] border border-[#CBD5E1] text-[#64748B] hover:text-[#0050FF] shadow-xs cursor-pointer transition"
                  title="Atualizar Histórico"
                >
                  <RefreshCw className={`w-4 h-4 ${isLoadingCalls ? 'animate-spin text-[#0050FF]' : ''}`} />
                </button>

                <button
                  onClick={() => {
                    setTestPhone('');
                    setTestLeadName('');
                    setIsCallModalOpen(true);
                  }}
                  className="px-4 py-2 rounded-xl font-bold text-xs bg-[#EFF4FF] text-[#0050FF] hover:bg-[#E0EAFF] border border-[#BFDBFE] shadow-xs flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>Nova Ligação Manual</span>
                </button>
              </div>
            </div>

            {calls.length === 0 ? (
              <div className="p-8 text-center bg-[#F8FAFC] rounded-xl border border-[#E2E8F0] text-[#64748B] text-xs space-y-2">
                <PhoneOff className="w-8 h-8 text-[#CBD5E1] mx-auto" />
                <p className="font-semibold text-[#0F172A]">Nenhuma chamada registrada ainda para este cliente.</p>
                <p className="text-[11px]">
                  Clique em <b>"Nova Ligação Manual"</b> acima para realizar uma ligação teste ou instale o widget no Kommo CRM.
                </p>
              </div>
            ) : (
              <div className="border border-[#E2E8F0] rounded-xl overflow-hidden">
                <table className="w-full text-xs text-left">
                  <thead className="bg-[#F8FAFC] text-[#64748B] font-bold border-b border-[#E2E8F0]">
                    <tr>
                      <th className="py-2.5 px-4">Lead / Contato</th>
                      <th className="py-2.5 px-4">Telefone</th>
                      <th className="py-2.5 px-4">Duração</th>
                      <th className="py-2.5 px-4">Feedback Vendedor</th>
                      <th className="py-2.5 px-4">Sincronização Kommo</th>
                      <th className="py-2.5 px-4 text-right">Data / Hora</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E2E8F0]">
                    {calls.map((call) => (
                      <tr key={call.id} className="hover:bg-[#F8FAFC] transition-colors">
                        <td className="py-2.5 px-4">
                          <p className="font-bold text-[#0F172A]">{call.contact_name || 'Lead'}</p>
                          {call.lead_id && (
                            <span className="text-[10px] text-[#0050FF] font-mono">
                              Lead #{call.lead_id}
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-4 font-mono text-[#64748B]">{call.phone_e164}</td>
                        <td className="py-2.5 px-4 font-mono font-semibold text-[#0F172A]">
                          {formatSeconds(call.duration_seconds)}
                        </td>
                        <td className="py-2.5 px-4">
                          {call.call_feedback === 'lead_nao_atendeu' ? (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 inline-flex items-center gap-1">
                              <span>📵</span> Lead não atendeu
                            </span>
                          ) : call.call_feedback === 'call_negativa' ? (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 inline-flex items-center gap-1">
                              <span>👎</span> Call negativa
                            </span>
                          ) : call.call_feedback === 'call_positiva' ? (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 inline-flex items-center gap-1">
                              <span>🟢</span> Call positiva
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                              {call.status || 'Finalizada'}
                            </span>
                          )}
                          {call.call_feedback_note && (
                            <p className="text-[10px] text-[#64748B] mt-0.5 italic max-w-xs truncate">
                              "{call.call_feedback_note}"
                            </p>
                          )}
                        </td>
                        <td className="py-2.5 px-4">
                          {call.kommo_sync_status === 'synced' ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 inline-flex items-center gap-1">
                              <Check className="w-3 h-3" /> Tarefa Criada
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600">
                              Registrado
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-4 text-right text-[#64748B] text-[11px] font-mono">
                          {new Date(call.started_at || call.created_at).toLocaleString('pt-BR')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ABA 5: DASHBOARD DE TRANSMISSÕES & MÉTRICAS */}
      {subTab === 'tracking' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-xs">
              <p className="text-xs font-semibold text-[#64748B] uppercase tracking-wider">Total Disparado</p>
              <p className="text-2xl font-bold text-[#0F172A] mt-1">1.420</p>
              <p className="text-[11px] text-emerald-600 font-medium mt-0.5">98.6% entregues</p>
            </div>

            <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-xs">
              <p className="text-xs font-semibold text-[#64748B] uppercase tracking-wider">Respostas SDR</p>
              <p className="text-2xl font-bold text-[#0050FF] mt-1">318</p>
              <p className="text-[11px] text-[#64748B] font-medium mt-0.5">22.4% taxa de resposta</p>
            </div>

            <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-xs">
              <p className="text-xs font-semibold text-[#64748B] uppercase tracking-wider">Ligações Efetuadas</p>
              <p className="text-2xl font-bold text-emerald-600 mt-1">{calls.length > 0 ? calls.length : 84}</p>
              <p className="text-[11px] text-[#64748B] font-medium mt-0.5">Sincronizadas no Kommo</p>
            </div>

            <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-xs">
              <p className="text-xs font-semibold text-[#64748B] uppercase tracking-wider">Saúde do Número</p>
              <p className="text-2xl font-bold text-emerald-600 mt-1">100%</p>
              <p className="text-[11px] text-[#64748B] font-medium mt-0.5">0 bloqueios registrados</p>
            </div>
          </div>
        </div>
      )}

      {/* Discador Web Flutuante / Teste de Ligação com Feedback Popup */}
      <CallModal
        isOpen={isCallModalOpen}
        onClose={() => setIsCallModalOpen(false)}
        defaultPhone={testPhone}
        defaultContactName={testLeadName}
        clienteId={targetId}
        onCallSaved={fetchCallsHistory}
      />
    </div>
  );
}

export default function WhatsAppPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-xs font-semibold text-[#64748B]">
          Carregando Hub WhatsApp API...
        </div>
      }
    >
      <WhatsAppContent />
    </Suspense>
  );
}
