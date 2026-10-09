'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
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
  KeyRound,
  ShieldCheck,
  ArrowRight,
} from 'lucide-react';
import Link from 'next/link';

function WhatsAppContent() {
  const searchParams = useSearchParams();
  const { selectedClientId, activeClient } = useTenant();

  const urlTab = searchParams?.get('tab');
  const [subTab, setSubTab] = useState<'conexao' | 'grupos' | 'disparos' | 'tracking'>(
    urlTab === 'grupos' ? 'grupos' : urlTab === 'disparos' ? 'disparos' : 'conexao'
  );

  useEffect(() => {
    if (urlTab === 'grupos' || urlTab === 'disparos' || urlTab === 'conexao') {
      setSubTab(urlTab);
    }
  }, [urlTab]);

  // Instance State
  const [instanceInfo, setInstanceInfo] = useState<{
    hasInstance: boolean;
    status: string;
    instanceName?: string;
    details?: any;
  }>({
    hasInstance: true,
    status: 'connected',
    instanceName: `instancia_${selectedClientId || 'swiftsail'}`,
  });

  const [isLoadingStatus, setIsLoadingStatus] = useState(false);
  const [isProvisioning, setIsProvisioning] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [qrCodeData, setQrCodeData] = useState<string | null>(null);
  const [pairingCode, setPairingCode] = useState<string | null>(null);
  const [showConnectModal, setShowConnectModal] = useState(false);

  // Group Scraper State
  const [groups, setGroups] = useState<any[]>([
    { jid: '120363385277868846@g.us', name: 'VIP Investidores & Lançamentos Imobiliários', participants: 487 },
    { jid: '120363391823719821@g.us', name: 'Executivos & Incorporadores SP', participants: 312 },
    { jid: '120363198273918273@g.us', name: 'Compradores Alto Padrão - Jardins/Moema', participants: 624 },
  ]);
  const [selectedGroupJid, setSelectedGroupJid] = useState('120363385277868846@g.us');
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

  // Spintax Variations
  const [copyA, setCopyA] = useState(
    'Olá {primeiro_nome}, tudo bem? Sou da equipe da {cliente}. Notei que você também está no grupo {grupo_origem} e gostaria de compartilhar nossa oportunidade exclusiva de investimento.'
  );
  const [copyB, setCopyB] = useState(
    'Oi {primeiro_nome}, como vai? Liberamos esta semana condições de lançamento prioritárias com atendimento VIP no WhatsApp. Gostaria de receber o catálogo?'
  );

  const clientName = activeClient?.nome || (selectedClientId === 'ALL' ? 'Todos os Clientes' : selectedClientId);

  const checkStatus = async () => {
    if (!selectedClientId || selectedClientId === 'ALL') return;
    setIsLoadingStatus(true);
    setTimeout(() => {
      setIsLoadingStatus(false);
      setInstanceInfo({
        hasInstance: true,
        status: 'connected',
        instanceName: `instancia_${selectedClientId}`,
      });
    }, 600);
  };

  const handleCreateInstance = () => {
    setIsProvisioning(true);
    setTimeout(() => {
      setIsProvisioning(false);
      setInstanceInfo({
        hasInstance: true,
        status: 'disconnected',
        instanceName: `instancia_${selectedClientId}`,
      });
      setShowConnectModal(true);
    }, 800);
  };

  const handleScrape = () => {
    setIsScraping(true);
    setTimeout(() => {
      setIsScraping(false);
      alert('Coleta concluída! 84 novos contatos importados do grupo.');
    }, 1000);
  };

  return (
    <div className="space-y-6 select-none font-sans">
      {/* Top Banner (Estilo Asaas: Fundo Branco, Bordas #E2E8F0, Sombra Suave) */}
      <div className="bg-white border border-[#E2E8F0] p-6 rounded-2xl shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase tracking-wider">
              Uazapi Multi-Device API • Seção 4.4
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#0F172A] flex items-center gap-2.5">
            <MessageSquare className="w-6 h-6 text-[#0050FF]" />
            Hub WhatsApp API & Automação
          </h1>
          <p className="text-xs text-[#64748B] max-w-2xl leading-relaxed">
            Instância dedicada do cliente <b className="text-[#0F172A]">{clientName}</b>. Conecte via QR Code, colete contatos segmentados de grupos e envie transmissões controladas com limites e salvaguardas.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
            <div className={`w-2.5 h-2.5 rounded-full ${instanceInfo.status === 'connected' ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
            <span className="text-xs font-bold text-[#0F172A]">
              {instanceInfo.status === 'connected' ? 'Conectado (Online)' : 'Desconectado'}
            </span>
          </div>

          <button
            onClick={checkStatus}
            disabled={isLoadingStatus}
            className="p-2.5 rounded-xl bg-white border border-[#E2E8F0] hover:bg-[#F8FAFC] text-[#64748B] hover:text-[#0050FF] shadow-xs cursor-pointer transition-all"
            title="Atualizar status da instância"
          >
            <RefreshCw className={`w-4 h-4 ${isLoadingStatus ? 'animate-spin text-[#0050FF]' : ''}`} />
          </button>
        </div>
      </div>

      {/* Navegação por Abas (Conforme Seção 4.4 das Diretrizes: Conexão, Grupos, Disparos, Dashboard) */}
      <div className="flex items-center gap-2 border-b border-[#E2E8F0] pb-1 overflow-x-auto">
        <button
          onClick={() => setSubTab('conexao')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            subTab === 'conexao'
              ? 'bg-[#EFF4FF] text-[#0050FF] border border-[#BFDBFE] shadow-xs'
              : 'text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC]'
          }`}
        >
          <Radio className="w-3.5 h-3.5" />
          <span>1. Conexão & Status Uazapi</span>
        </button>

        <button
          onClick={() => setSubTab('grupos')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
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
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            subTab === 'disparos'
              ? 'bg-[#EFF4FF] text-[#0050FF] border border-[#BFDBFE] shadow-xs'
              : 'text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC]'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>3. Envio em Massa (Salvaguardas)</span>
        </button>

        <button
          onClick={() => setSubTab('tracking')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            subTab === 'tracking'
              ? 'bg-[#EFF4FF] text-[#0050FF] border border-[#BFDBFE] shadow-xs'
              : 'text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC]'
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5" />
          <span>4. Dashboard de Transmissões</span>
        </button>
      </div>

      {/* ABA 1: CONEXÃO & STATUS UAZAPI */}
      {subTab === 'conexao' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-xs space-y-5">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-4">
              <div>
                <h2 className="text-base font-bold text-[#0F172A]">Status da Instância Uazapi</h2>
                <p className="text-xs text-[#64748B]">
                  Instância multi-device isolada e vinculada ao workspace do cliente.
                </p>
              </div>

              <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                Instância Provisionada
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-1">
                <p className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider">Identificador</p>
                <p className="text-sm font-bold text-[#0F172A] font-mono">{instanceInfo.instanceName || 'uazapi_swiftsail'}</p>
              </div>

              <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-1">
                <p className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider">Número Conectado</p>
                <p className="text-sm font-bold text-emerald-600 font-mono">+55 11 98765-4321</p>
              </div>

              <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-1">
                <p className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider">Bateria & Conexão</p>
                <p className="text-sm font-bold text-[#0F172A]">94% • Wi-Fi Estável</p>
              </div>

              <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-1">
                <p className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider">Protocolo de Segurança</p>
                <p className="text-sm font-bold text-[#0050FF]">Anti-Ban Spintax Ativo</p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-[#E2E8F0]">
              <button
                onClick={() => setShowConnectModal(true)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-white border border-[#CBD5E1] text-[#0F172A] hover:bg-[#F8FAFC] shadow-xs flex items-center gap-2 cursor-pointer"
              >
                <QrCode className="w-4 h-4 text-[#0050FF]" />
                <span>Reconectar via QR Code</span>
              </button>

              <button
                onClick={checkStatus}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-[#0050FF] hover:bg-[#0040D6] text-white shadow-xs flex items-center gap-2 cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Verificar Conexão</span>
              </button>
            </div>
          </div>

          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-xs space-y-4">
            <h3 className="font-bold text-sm text-[#0F172A] flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#0050FF]" />
              Salvaguardas Operacionais
            </h3>
            <p className="text-xs text-[#64748B] leading-relaxed">
              O Uazapi opera com rotação de instâncias e atraso randômico entre mensagens (25 a 45 segundos) para manter alta entregabilidade.
            </p>
            <div className="space-y-2 pt-2 border-t border-[#F1F5F9] text-xs">
              <div className="flex items-center gap-2 text-[#475569]">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Isolamento por tenant</span>
              </div>
              <div className="flex items-center gap-2 text-[#475569]">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Limite diário parametrizado</span>
              </div>
              <div className="flex items-center gap-2 text-[#475569]">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Filtro de administradores</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ABA 2: COLETA DE GRUPOS */}
      {subTab === 'grupos' && (
        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E2E8F0] pb-4">
            <div>
              <h2 className="text-base font-bold text-[#0F172A]">Coleta e Importação de Contatos de Grupos</h2>
              <p className="text-xs text-[#64748B]">
                Extraia contatos qualificados de grupos do WhatsApp vinculados à sua instância.
              </p>
            </div>

            <button
              onClick={handleScrape}
              disabled={isScraping}
              className="bg-[#0050FF] hover:bg-[#0040D6] text-white px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-2 shadow-xs cursor-pointer self-start sm:self-auto"
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
                  <th className="py-2.5 px-4 text-right">Ação</th>
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
                      <button className="text-[#0050FF] hover:underline font-semibold cursor-pointer">
                        Enviar DM
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ABA 3: DISPAROS EM MASSA COM SALVAGUARDAS */}
      {subTab === 'disparos' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-xs space-y-4">
            <h2 className="text-base font-bold text-[#0F172A]">Configuração de Transmissão Segmentada</h2>
            <p className="text-xs text-[#64748B]">
              Defina as variações de copy (Spintax) que serão intercaladas dinamicamente entre os disparos.
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
              <button className="px-5 py-2.5 rounded-full font-bold bg-[#0050FF] hover:bg-[#0040D6] text-white text-xs shadow-xs flex items-center gap-2 cursor-pointer">
                <Send className="w-4 h-4" />
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
                  className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl px-3 py-2 font-semibold text-[#0F172A]"
                >
                  <option value="25-45">25 a 45 segundos (Mais Seguro)</option>
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

      {/* ABA 4: DASHBOARD DE TRANSMISSÕES */}
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
              <p className="text-xs font-semibold text-[#64748B] uppercase tracking-wider">Reuniões Agendadas</p>
              <p className="text-2xl font-bold text-emerald-600 mt-1">42</p>
              <p className="text-[11px] text-[#64748B] font-medium mt-0.5">Convertidos no Kommo</p>
            </div>

            <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-xs">
              <p className="text-xs font-semibold text-[#64748B] uppercase tracking-wider">Saúde do Número</p>
              <p className="text-2xl font-bold text-emerald-600 mt-1">100%</p>
              <p className="text-[11px] text-[#64748B] font-medium mt-0.5">0 bloqueios registrados</p>
            </div>
          </div>
        </div>
      )}

      {/* Modal Conectar via QR Code */}
      {showConnectModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[#E2E8F0] rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4 text-center">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
              <h3 className="font-bold text-[#0F172A] text-sm flex items-center gap-2">
                <QrCode className="w-4 h-4 text-[#0050FF]" />
                Conectar WhatsApp
              </h3>
              <button
                onClick={() => setShowConnectModal(false)}
                className="text-[#64748B] hover:text-[#0F172A] p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl flex items-center justify-center">
              <div className="w-48 h-48 bg-white border border-[#CBD5E1] rounded-xl flex items-center justify-center p-2 shadow-inner">
                <QrCode className="w-36 h-36 text-[#0F172A]" />
              </div>
            </div>

            <p className="text-xs text-[#64748B] leading-relaxed">
              Abra o WhatsApp no seu aparelho, vá em <b>Aparelhos Conectados</b> e aponte a câmera para o QR Code.
            </p>

            <button
              onClick={() => {
                setShowConnectModal(false);
                setInstanceInfo((prev) => ({ ...prev, status: 'connected' }));
              }}
              className="w-full py-2.5 rounded-xl font-bold bg-[#0050FF] hover:bg-[#0040D6] text-white text-xs shadow-xs"
            >
              Confirmar Conexão
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function WhatsAppPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-xs font-semibold text-[#64748B]">
          Carregando Hub WhatsApp...
        </div>
      }
    >
      <WhatsAppContent />
    </Suspense>
  );
}
