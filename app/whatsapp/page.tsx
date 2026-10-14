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
  Radio,
  Sliders,
  Sparkles,
  BarChart3,
  RefreshCw,
  Plus,
  CheckCircle2,
  Trash2,
  KeyRound,
  ShieldCheck,
  ArrowRight,
  PhoneCall,
  Phone,
  PhoneOff,
  KanbanSquare,
  FileDown,
  Info,
  Check,
  Tag,
  FileSpreadsheet,
  UploadCloud,
  UserCheck,
  FileText,
  CheckCheck,
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

  // Group Scraper & Multi-Instance State
  const [availableInstances, setAvailableInstances] = useState<Array<{ name: string; status: string; token: string }>>([]);
  const [selectedInstanceToken, setSelectedInstanceToken] = useState<string>('');
  const selectedInstanceObj = availableInstances.find((i) => i.token === selectedInstanceToken);
  const selectedInstanceName = selectedInstanceObj?.name || 'Linha WhatsApp';
  const selectedInstanceStatus = selectedInstanceObj?.status || 'disconnected';
  const [groups, setGroups] = useState<any[]>([]);
  const [selectedGroupJid, setSelectedGroupJid] = useState('');
  const [isLoadingGroups, setIsLoadingGroups] = useState(false);
  const [isScraping, setIsScraping] = useState(false);
  const [adminFilterOption, setAdminFilterOption] = useState<'exclude' | 'include' | 'only_admins'>('exclude');
  const [scrapedContacts, setScrapedContacts] = useState<any[]>([]);

  // Destinatários para Envio em Massa (Grupo Raspado ou Planilha)
  const [recipientSource, setRecipientSource] = useState<'scraped' | 'spreadsheet'>('scraped');
  const [spreadsheetContacts, setSpreadsheetContacts] = useState<Array<{ id: number; name: string; phone: string; group?: string }>>([]);
  const [spreadsheetFileName, setSpreadsheetFileName] = useState('');
  const [spreadsheetError, setSpreadsheetError] = useState<string | null>(null);

  // Mass Broadcast & Anti-Ban Safeguards State
  const [messagesPerDay, setMessagesPerDay] = useState(150);
  const [batchSize, setBatchSize] = useState(5);
  const [intervalOption, setIntervalOption] = useState('25-45');
  const [timeWindowStart, setTimeWindowStart] = useState('09:00');
  const [timeWindowEnd, setTimeWindowEnd] = useState('18:30');
  const [isSendingBroadcast, setIsSendingBroadcast] = useState(false);
  const [broadcastProgress, setBroadcastProgress] = useState<{
    current: number;
    total: number;
    success: number;
    failed: number;
  } | null>(null);
  const [totalSentBroadcasts, setTotalSentBroadcasts] = useState<number>(0);

  // Spintax Variations (Até 6 variações dinâmicas de mensagem usando apenas {primeiro_nome})
  const [copies, setCopies] = useState<string[]>([
    'Olá {primeiro_nome}, tudo bem? Sou da equipe comercial. Gostaria de compartilhar uma condição exclusiva de lançamento com você.',
    'Oi {primeiro_nome}, como vai? Liberamos esta semana condições prioritárias com atendimento VIP no WhatsApp. Gostaria de receber o catálogo?',
    'Olá {primeiro_nome}! Passando rapidamente para compartilhar uma oportunidade especial que preparamos. Posso te enviar o material?',
  ]);

  const copyLetters = ['A', 'B', 'C', 'D', 'E', 'F'];

  const addCopyVariation = () => {
    if (copies.length >= 6) return;
    const nextLetter = copyLetters[copies.length];
    setCopies((prev) => [
      ...prev,
      `Olá {primeiro_nome}, tudo bem? [Variação ${nextLetter}] Gostaria de compartilhar uma oportunidade exclusiva. Posso te enviar os detalhes?`,
    ]);
  };

  const removeCopyVariation = (index: number) => {
    if (copies.length <= 1) return;
    setCopies((prev) => prev.filter((_, i) => i !== index));
  };

  const updateCopyVariation = (index: number, text: string) => {
    setCopies((prev) => {
      const next = [...prev];
      next[index] = text;
      return next;
    });
  };

  const insertTagIntoCopy = (index: number, tag: string) => {
    setCopies((prev) => {
      const next = [...prev];
      next[index] = (next[index] ? next[index] + ' ' : '') + tag;
      return next;
    });
  };

  // Buscar histórico de chamadas
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

  // Buscar status das credenciais do Kommo CRM
  const checkKommoClientConfig = async () => {
    try {
      const res = await fetch(`/api/credentials/client/status?cliente_id=${encodeURIComponent(targetId)}`).catch(() => null);
      if (res && res.ok) {
        const data = await res.json();
        setKommoStatus(data);
      } else {
        setKommoStatus({
          configured: true,
          subdomain: targetId.toLowerCase().replace('_', ''),
        });
      }
    } catch {
      setKommoStatus({ configured: false });
    }
  };

  // Buscar instâncias UAZAPI disponíveis
  const fetchInstances = async () => {
    try {
      const res = await fetch('/api/uazapi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'list_instances', cliente_id: targetId }),
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.instances)) {
        setAvailableInstances(data.instances);
        if (!selectedInstanceToken) {
          const cleanTarget = targetId.toLowerCase().replace(/[^a-z0-9]/g, '');
          const matched = data.instances.find(
            (i: any) =>
              i.status === 'connected' &&
              ((i.name || '').toLowerCase().replace(/[^a-z0-9]/g, '').includes(cleanTarget) ||
                cleanTarget.includes((i.name || '').toLowerCase().replace(/[^a-z0-9]/g, '')))
          );
          const connectedAny = matched || data.instances.find((i: any) => i.status === 'connected');
          if (connectedAny) {
            setSelectedInstanceToken(connectedAny.token);
            fetchGroups(connectedAny.token);
          }
        }
      }
    } catch (err) {
      console.warn('[Fetch Instances Warning]:', err);
    }
  };

  // Buscar grupos reais da instância UAZAPI
  const fetchGroups = async (tokenOverride?: string) => {
    setIsLoadingGroups(true);
    try {
      const activeToken = tokenOverride || selectedInstanceToken || undefined;
      const res = await fetch('/api/uazapi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'list_groups',
          cliente_id: targetId,
          instance_token: activeToken,
        }),
      });
      const data = await res.json();
      const list = Array.isArray(data.groups) ? data.groups : [];
      setGroups(list);
      if (list.length > 0) {
        setSelectedGroupJid((prev) => {
          const exists = list.find((g: any) => (g.jid || g.id || g.JID) === prev);
          return exists ? prev : (list[0].jid || list[0].id || list[0].JID || '');
        });
      }
    } catch (err) {
      console.warn('[Fetch Groups Warning]:', err);
    } finally {
      setIsLoadingGroups(false);
    }
  };

  useEffect(() => {
    fetchCallsHistory();
    checkKommoClientConfig();
    fetchInstances();
    fetchGroups();
  }, [targetId]);

  // Raspagem real de participantes de grupo
  const handleScrape = async () => {
    if (!selectedGroupJid) {
      alert('Selecione ou informe um grupo para iniciar a extração.');
      return;
    }

    setIsScraping(true);
    try {
      const res = await fetch('/api/uazapi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'scrape_group',
          group_jid: selectedGroupJid,
          cliente_id: targetId,
          instance_token: selectedInstanceToken || undefined,
        }),
      });

      const data = await res.json();
      const rawParticipants = data.participants || data.group?.participants || data.group?.Participants || [];
      const currentGroup = groups.find((g) => (g.jid || g.id || g.JID) === selectedGroupJid);
      const groupName = currentGroup?.name || currentGroup?.subject || currentGroup?.Name || 'Grupo WhatsApp';

      let mapped = rawParticipants.map((p: any, idx: number) => {
        const userPhone = p.phone || p.PhoneNumber || p.phoneNumber || p.id?.user || p.id || '';
        const cleanPhone = String(userPhone).replace(/@.*$/, '').replace(/\D/g, '');
        const phoneFormatted = cleanPhone ? (cleanPhone.startsWith('+') ? cleanPhone : `+${cleanPhone}`) : '';
        const name = p.name || p.DisplayName || p.Username || p.pushName || `Participante ${idx + 1}`;
        const isAdmin = p.isAdmin === true || p.IsAdmin === true || p.IsSuperAdmin === true || p.admin === 'admin';

        return {
          id: idx + 1,
          name,
          phone: phoneFormatted,
          isAdmin,
          image: p.image || '',
          isBusiness: Boolean(p.isBusiness),
          businessName: p.businessName || '',
          group: groupName,
        };
      });

      if (adminFilterOption === 'exclude') {
        mapped = mapped.filter((c: any) => !c.isAdmin);
      } else if (adminFilterOption === 'only_admins') {
        mapped = mapped.filter((c: any) => c.isAdmin);
      }

      setScrapedContacts(mapped);

      if (mapped.length > 0) {
        alert(`Coleta e enriquecimento concluídos! ${mapped.length} contatos qualificados importados com chat/details.`);
      } else {
        alert('Nenhum contato encontrado ou grupo sem participantes para o filtro selecionado.');
      }
    } catch (err: any) {
      alert('Falha ao raspar grupo: ' + err.message);
    } finally {
      setIsScraping(false);
    }
  };

  // Upload e processamento automático de planilha (CSV, TXT ou Excel)
  const handleSpreadsheetUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSpreadsheetFileName(file.name);
    setSpreadsheetError(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        if (!text) {
          setSpreadsheetError('O arquivo selecionado está vazio.');
          return;
        }

        const lines = text.split(/\r\n|\n|\r/).filter((l) => l.trim().length > 0);
        if (lines.length === 0) {
          setSpreadsheetError('Nenhuma linha de contato encontrada no arquivo.');
          return;
        }

        // Detectar delimitador (vírgula, ponto-e-vírgula ou tabulação)
        const firstLine = lines[0];
        let delimiter = ',';
        if (firstLine.includes(';') && !firstLine.includes(',')) delimiter = ';';
        else if (firstLine.includes('\t')) delimiter = '\t';

        const rawHeaders = firstLine.split(delimiter).map((h) => h.trim().toLowerCase().replace(/["']/g, ''));

        // Identificar índices de coluna
        let nameIdx = rawHeaders.findIndex((h) =>
          ['nome', 'name', 'cliente', 'lead', 'contato', 'destinatario'].some((k) => h.includes(k))
        );
        let phoneIdx = rawHeaders.findIndex((h) =>
          ['telefone', 'phone', 'celular', 'whatsapp', 'tel', 'numero', 'number'].some((k) => h.includes(k))
        );

        let startIndex = 1;

        // Se não achou cabeçalho nas colunas, assume linha 1 como dado ou coluna 0/1
        if (nameIdx === -1 && phoneIdx === -1) {
          startIndex = 0;
          nameIdx = 0;
          phoneIdx = 1;
        } else if (phoneIdx === -1) {
          phoneIdx = nameIdx === 0 ? 1 : 0;
        } else if (nameIdx === -1) {
          nameIdx = phoneIdx === 0 ? 1 : 0;
        }

        const parsed: Array<{ id: number; name: string; phone: string; group?: string }> = [];

        for (let i = startIndex; i < lines.length; i++) {
          const row = lines[i].split(delimiter).map((c) => c.trim().replace(/^["']|["']$/g, ''));
          if (row.length < 2) continue;

          let rawName = row[nameIdx] || `Contato ${parsed.length + 1}`;
          let rawPhone = row[phoneIdx] || '';

          // Se name tiver só dígitos e phone tiver letras, inverte
          if (/^\d{8,15}$/.test(rawName.replace(/\D/g, '')) && /[a-zA-Z]/.test(rawPhone)) {
            const temp = rawName;
            rawName = rawPhone;
            rawPhone = temp;
          }

          const cleanPhone = rawPhone.replace(/\D/g, '');
          if (cleanPhone.length >= 8) {
            const formatted = cleanPhone.startsWith('55')
              ? `+${cleanPhone}`
              : cleanPhone.length >= 10
              ? `+55${cleanPhone}`
              : `+${cleanPhone}`;

            parsed.push({
              id: parsed.length + 1,
              name: rawName,
              phone: formatted,
              group: file.name.replace(/\.[^/.]+$/, ''),
            });
          }
        }

        if (parsed.length === 0) {
          setSpreadsheetError('Nenhum número de telefone válido encontrado. Verifique o modelo da planilha.');
        } else {
          setSpreadsheetContacts(parsed);
          setRecipientSource('spreadsheet');
          alert(`Planilha importada com sucesso! ${parsed.length} contatos qualificados carregados.`);
        }
      } catch (err: any) {
        setSpreadsheetError(`Erro ao processar planilha: ${err.message}`);
      }
    };
    reader.readAsText(file);
  };

  // Download do arquivo modelo para importação
  const downloadSampleSpreadsheet = () => {
    const csvContent = 'Nome,Telefone\nRodrigo Ferrari,41992332996\nMariana Furtado,47997863999\nDiogo Bernert,47996105758\nCleide Claw,41984515087';
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'modelo_disparo_swiftsail.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Destinatários ativos para o disparador
  const activeRecipients = recipientSource === 'scraped' ? scrapedContacts : spreadsheetContacts;

  const handleStartBroadcast = async () => {
    if (activeRecipients.length === 0) {
      alert('Nenhum contato selecionado para envio. Colete participantes de um grupo ou importe uma planilha.');
      return;
    }

    const validCopies = copies.filter((c) => c.trim().length > 0);
    if (validCopies.length === 0) {
      alert('Preencha ao menos uma variação de mensagem para iniciar o disparo.');
      return;
    }

    const confirmSend = confirm(
      `Confirma o início da transmissão para ${activeRecipients.length} contatos usando a linha ${selectedInstanceName || 'WhatsApp'}?`
    );
    if (!confirmSend) return;

    setIsSendingBroadcast(true);
    setBroadcastProgress({ current: 0, total: activeRecipients.length, success: 0, failed: 0 });

    let sentCount = 0;
    let failCount = 0;

    for (let i = 0; i < activeRecipients.length; i++) {
      const recipient = activeRecipients[i];
      const rawName = recipient.name || 'Amigo';
      // Extrai somente o primeiro nome
      const firstName = rawName.trim().split(' ')[0] || 'Amigo';

      // Rotaciona as variações de copy configuradas
      const template = validCopies[i % validCopies.length];
      const messageToSend = template.replace(/\{primeiro_nome\}/gi, firstName);

      try {
        const res = await fetch('/api/uazapi', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'send_message',
            cliente_id: targetId,
            phone: recipient.phone,
            message: messageToSend,
            instance_token: selectedInstanceToken || undefined,
          }),
        });

        const data = await res.json();
        if (res.ok && data.success) {
          sentCount++;
        } else {
          failCount++;
          console.warn(`[Broadcast Fail] ${recipient.phone}:`, data.error);
        }
      } catch (err) {
        failCount++;
        console.error(`[Broadcast Error] ${recipient.phone}:`, err);
      }

      setBroadcastProgress({
        current: i + 1,
        total: activeRecipients.length,
        success: sentCount,
        failed: failCount,
      });

      // Intervalo de segurança anti-ban entre disparos
      if (i < activeRecipients.length - 1) {
        await new Promise((r) => setTimeout(r, 1200));
      }
    }

    setIsSendingBroadcast(false);
    setTotalSentBroadcasts((prev) => prev + sentCount);

    alert(
      `Transmissão concluída com sucesso!\n` +
      `Mensagens enviadas: ${sentCount}\n` +
      `Falhas: ${failCount}\n` +
      `Linha utilizada: ${selectedInstanceName || 'WhatsApp'}`
    );
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
            Workspace dedicado do cliente <b className="text-[#0F172A]">{clientName}</b>. Conexão por QR Code ou Código de 8 Dígitos, chamadas de voz sincronizadas com Kommo CRM, raspagem de grupos e disparador multi-copy (até 6 variações) com salvaguardas anti-ban.
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
          <span>3. Envio em Massa (Até 6 Variações)</span>
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

      {/* ABA 2: COLETA DE GRUPOS (RASPAGEM - SEM DADOS FIXOS) */}
      {subTab === 'grupos' && (
        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-xs space-y-5">
          {/* Seletor de Instância UAZAPI Conectada */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#F8FAFC] border border-[#CBD5E1] p-3.5 rounded-xl">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#0F172A] whitespace-nowrap">Instância WhatsApp Conectada:</span>
              <select
                value={selectedInstanceToken}
                onChange={(e) => {
                  setSelectedInstanceToken(e.target.value);
                  fetchGroups(e.target.value);
                }}
                className="bg-white border border-[#CBD5E1] rounded-lg px-3 py-1.5 text-xs font-bold text-[#0F172A] focus:outline-none focus:border-[#0050FF] shadow-2xs"
              >
                {availableInstances.length === 0 ? (
                  <option value="">Carregando instâncias...</option>
                ) : (
                  availableInstances.map((inst) => (
                    <option key={inst.token} value={inst.token}>
                      {inst.name} ({inst.status === 'connected' ? '🟢 Conectada' : '⚪ Desconectada'})
                    </option>
                  ))
                )}
              </select>
            </div>
            <div className="text-[11px] text-[#64748B] flex items-center gap-1.5 font-medium">
              <span className="font-bold text-[#0050FF]">{groups.length} grupos</span> carregados em tempo real
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E2E8F0] pb-4">
            <div>
              <h2 className="text-base font-bold text-[#0F172A]">Coleta e Importação de Contatos de Grupos</h2>
              <p className="text-xs text-[#64748B]">
                Extraia contatos qualificados de grupos do WhatsApp vinculados à sua instância conectada.
              </p>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              <button
                onClick={() => fetchGroups()}
                disabled={isLoadingGroups}
                className="px-3.5 py-2.5 rounded-xl border border-[#CBD5E1] bg-white hover:bg-[#F8FAFC] text-[#475569] font-bold text-xs flex items-center gap-1.5 shadow-xs cursor-pointer transition disabled:opacity-50"
                title="Recarregar grupos da instância"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingGroups ? 'animate-spin text-[#0050FF]' : ''}`} />
                <span>Atualizar Grupos</span>
              </button>

              <button
                onClick={handleScrape}
                disabled={isScraping || !selectedGroupJid}
                className="bg-[#0050FF] hover:bg-[#0040D6] text-white px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 shadow-xs cursor-pointer transition disabled:opacity-50"
              >
                {isScraping ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                <span>Iniciar Coleta no Grupo</span>
              </button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <div className="w-full sm:w-1/2">
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-[#475569]">
                  Selecionar Grupo de Origem ({groups.length})
                </label>
                {groups.length > 0 && (
                  <span className="text-[10px] text-[#0050FF] font-semibold">
                    Selecione abaixo ou digite
                  </span>
                )}
              </div>
              {groups.length === 0 ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={selectedGroupJid}
                    onChange={(e) => setSelectedGroupJid(e.target.value)}
                    placeholder="Cole o JID do grupo (ex: 120363...g.us) ou clique em Atualizar Grupos"
                    className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl px-3 py-2 text-xs font-mono text-[#0F172A] focus:outline-none focus:border-[#0050FF]"
                  />
                </div>
              ) : (
                <select
                  value={selectedGroupJid}
                  onChange={(e) => setSelectedGroupJid(e.target.value)}
                  className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl px-3 py-2 text-xs font-semibold text-[#0F172A] focus:outline-none focus:border-[#0050FF] cursor-pointer"
                >
                  <option value="">Selecione um grupo da lista ({groups.length} disponíveis)...</option>
                  {groups.map((g) => {
                    const jid = g.jid || g.id || g.JID || '';
                    const title = g.name || g.subject || g.Name || jid;
                    const count = g.participantsCount || g.participants?.length || g.Participants?.length || 0;
                    return (
                      <option key={jid} value={jid}>
                        {title} {count > 0 ? `(${count} participantes)` : ''}
                      </option>
                    );
                  })}
                </select>
              )}
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

          {/* Tabela de Contatos Coletados (Com estado vazio dinâmico) */}
          {scrapedContacts.length === 0 ? (
            <div className="p-8 text-center bg-[#F8FAFC] rounded-xl border border-[#E2E8F0] text-[#64748B] text-xs space-y-2 mt-2">
              <Users className="w-8 h-8 text-[#CBD5E1] mx-auto" />
              <p className="font-semibold text-[#0F172A]">Nenhum participante coletado ainda.</p>
              <p className="text-[11px]">
                Selecione um grupo acima e clique em <b>"Iniciar Coleta no Grupo"</b> para raspar e enriquecer os participantes em tempo real com /chat/details.
              </p>
            </div>
          ) : (
            <div className="space-y-3 mt-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-[#EFF4FF] border border-[#BFDBFE] p-3 rounded-xl">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#0050FF]" />
                  <span className="text-xs font-bold text-[#0F172A]">
                    {scrapedContacts.length} participantes coletados e enriquecidos com chat/details
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setRecipientSource('scraped');
                    setSubTab('disparos');
                  }}
                  className="px-3.5 py-1.5 rounded-lg bg-[#0050FF] hover:bg-[#0040D6] text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-2xs self-start sm:self-auto"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Usar no Disparador em Massa ➔</span>
                </button>
              </div>

              <div className="border border-[#E2E8F0] rounded-xl overflow-hidden">
                <table className="w-full text-xs text-left">
                  <thead className="bg-[#F8FAFC] text-[#64748B] font-bold border-b border-[#E2E8F0]">
                    <tr>
                      <th className="py-2.5 px-4">Nome / Identificação no WhatsApp</th>
                      <th className="py-2.5 px-4">Telefone</th>
                      <th className="py-2.5 px-4">Tipo</th>
                      <th className="py-2.5 px-4">Grupo de Origem</th>
                      <th className="py-2.5 px-4 text-right">Ação Rápida</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E2E8F0]">
                    {scrapedContacts.map((c) => (
                      <tr key={c.id} className="hover:bg-[#F8FAFC] transition-colors">
                        <td className="py-2.5 px-4">
                          <div className="flex items-center gap-2.5">
                            {c.image ? (
                              <img
                                src={c.image}
                                alt={c.name}
                                className="w-7 h-7 rounded-full object-cover border border-[#CBD5E1]"
                              />
                            ) : (
                              <div className="w-7 h-7 rounded-full bg-[#EFF4FF] text-[#0050FF] font-bold text-[10px] flex items-center justify-center shrink-0 border border-[#BFDBFE]">
                                {(c.name || 'WA').substring(0, 2).toUpperCase()}
                              </div>
                            )}
                            <div>
                              <div className="font-semibold text-[#0F172A] flex items-center gap-1.5">
                                <span>{c.name}</span>
                                {c.isBusiness && (
                                  <span className="text-[9px] font-bold px-1.5 py-0.2 bg-sky-50 text-sky-700 border border-sky-200 rounded">
                                    Business
                                  </span>
                                )}
                              </div>
                              {c.businessName && c.businessName !== c.name && (
                                <p className="text-[10px] text-[#64748B]">{c.businessName}</p>
                              )}
                            </div>
                          </div>
                        </td>
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
        </div>
      )}

      {/* ABA 3: DISPAROS EM MASSA COM ATÉ 6 VARIAÇÕES DE MENSAGEM */}
      {subTab === 'disparos' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-xs space-y-5">
            {/* 1. SELETOR DE ORIGEM DOS DESTINATÁRIOS (GRUPOS RASPADOS OU PLANILHA) */}
            <div className="bg-[#F8FAFC] border border-[#CBD5E1] rounded-2xl p-4 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E2E8F0] pb-3">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-[#0050FF]" />
                  <h3 className="text-xs font-bold text-[#0F172A] uppercase tracking-wider">
                    Origem dos Destinatários para Envio
                  </h3>
                </div>

                <div className="flex items-center gap-1.5 p-1 bg-white border border-[#CBD5E1] rounded-xl self-start sm:self-auto">
                  <button
                    type="button"
                    onClick={() => setRecipientSource('scraped')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                      recipientSource === 'scraped'
                        ? 'bg-[#0050FF] text-white shadow-2xs'
                        : 'text-[#64748B] hover:text-[#0F172A]'
                    }`}
                  >
                    <Users className="w-3.5 h-3.5" />
                    <span>Grupos Raspados ({scrapedContacts.length})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRecipientSource('spreadsheet')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                      recipientSource === 'spreadsheet'
                        ? 'bg-[#0050FF] text-white shadow-2xs'
                        : 'text-[#64748B] hover:text-[#0F172A]'
                    }`}
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                    <span>Subir Planilha ({spreadsheetContacts.length})</span>
                  </button>
                </div>
              </div>

              {/* Opção A: Grupos Raspados */}
              {recipientSource === 'scraped' && (
                <div className="space-y-3">
                  {scrapedContacts.length === 0 ? (
                    <div className="p-4 rounded-xl border border-dashed border-[#CBD5E1] bg-white text-center space-y-2">
                      <p className="text-xs font-semibold text-[#0F172A]">Nenhum grupo foi raspado ainda nesta sessão.</p>
                      <p className="text-[11px] text-[#64748B]">
                        Vá até a aba "Coleta de Grupos", selecione um grupo e extraia os participantes.
                      </p>
                      <button
                        type="button"
                        onClick={() => setSubTab('grupos')}
                        className="px-3.5 py-1.5 rounded-lg bg-[#EFF4FF] text-[#0050FF] hover:bg-[#E0EAFF] font-bold text-xs inline-flex items-center gap-1.5 transition cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Ir para Coleta de Grupos</span>
                      </button>
                    </div>
                  ) : (
                    <div className="p-3.5 rounded-xl bg-white border border-[#E2E8F0] space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-emerald-700 flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          {scrapedContacts.length} destinatários prontos do grupo "{scrapedContacts[0]?.group || 'WhatsApp'}"
                        </span>
                        <button
                          type="button"
                          onClick={() => setSubTab('grupos')}
                          className="text-[11px] font-bold text-[#0050FF] hover:underline cursor-pointer"
                        >
                          Trocar Grupo / Coletar Mais
                        </button>
                      </div>

                      {/* Amostra dos Contatos */}
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {scrapedContacts.slice(0, 5).map((c) => (
                          <span
                            key={c.id}
                            className="px-2 py-0.5 rounded-md bg-[#F1F5F9] text-[#334155] font-mono text-[10px] flex items-center gap-1"
                          >
                            <span className="font-semibold">{c.name.split(' ')[0]}:</span> {c.phone}
                          </span>
                        ))}
                        {scrapedContacts.length > 5 && (
                          <span className="px-2 py-0.5 rounded-md bg-[#EFF4FF] text-[#0050FF] text-[10px] font-bold">
                            +{scrapedContacts.length - 5} contatos
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Opção B: Subir Planilha */}
              {recipientSource === 'spreadsheet' && (
                <div className="space-y-3">
                  <div className="p-4 rounded-xl border border-dashed border-[#CBD5E1] bg-white flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="space-y-1 text-center sm:text-left">
                      <p className="text-xs font-bold text-[#0F172A] flex items-center gap-1.5 justify-center sm:justify-start">
                        <UploadCloud className="w-4 h-4 text-[#0050FF]" />
                        Importar Lista de Contatos (CSV, TXT ou Excel)
                      </p>
                      <p className="text-[11px] text-[#64748B]">
                        Colunas esperadas: <b>Nome</b> e <b>Telefone</b> (ex: 4199999999). Delimitador vírgula ou ponto-e-vírgula.
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={downloadSampleSpreadsheet}
                        className="px-3 py-1.5 rounded-lg border border-[#CBD5E1] bg-white hover:bg-[#F8FAFC] text-[#475569] font-bold text-xs flex items-center gap-1.5 shadow-2xs transition cursor-pointer"
                        title="Baixar modelo exemplo de CSV"
                      >
                        <FileDown className="w-3.5 h-3.5 text-[#64748B]" />
                        <span>Modelo CSV</span>
                      </button>

                      <label className="px-3.5 py-1.5 rounded-lg bg-[#0050FF] hover:bg-[#0040D6] text-white font-bold text-xs flex items-center gap-1.5 shadow-2xs transition cursor-pointer">
                        <UploadCloud className="w-3.5 h-3.5" />
                        <span>{spreadsheetContacts.length > 0 ? 'Trocar Arquivo' : 'Escolher Arquivo'}</span>
                        <input
                          type="file"
                          accept=".csv,.txt,.tsv"
                          onChange={handleSpreadsheetUpload}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>

                  {spreadsheetError && (
                    <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                      <span>{spreadsheetError}</span>
                    </div>
                  )}

                  {spreadsheetContacts.length > 0 && (
                    <div className="p-3.5 rounded-xl bg-white border border-[#E2E8F0] space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-emerald-700 flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          {spreadsheetContacts.length} contatos carregados da planilha "{spreadsheetFileName}"
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setSpreadsheetContacts([]);
                            setSpreadsheetFileName('');
                          }}
                          className="text-[11px] font-bold text-rose-600 hover:underline cursor-pointer"
                        >
                          Limpar Planilha
                        </button>
                      </div>

                      {/* Amostra dos Contatos da Planilha */}
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {spreadsheetContacts.slice(0, 5).map((c) => (
                          <span
                            key={c.id}
                            className="px-2 py-0.5 rounded-md bg-[#F1F5F9] text-[#334155] font-mono text-[10px] flex items-center gap-1"
                          >
                            <span className="font-semibold">{c.name.split(' ')[0]}:</span> {c.phone}
                          </span>
                        ))}
                        {spreadsheetContacts.length > 5 && (
                          <span className="px-2 py-0.5 rounded-md bg-[#EFF4FF] text-[#0050FF] text-[10px] font-bold">
                            +{spreadsheetContacts.length - 5} contatos
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E2E8F0] pb-3">
              <div>
                <h2 className="text-base font-bold text-[#0F172A]">
                  Variações de Mensagem do Disparador ({copies.length}/6)
                </h2>
                <p className="text-xs text-[#64748B]">
                  Cadastre até 6 mensagens com Spintax. O motor intercalará as variações automaticamente para evitar bloqueios.
                </p>
              </div>

              <button
                type="button"
                onClick={addCopyVariation}
                disabled={copies.length >= 6}
                className="px-3.5 py-2 rounded-xl text-xs font-bold bg-[#EFF4FF] hover:bg-[#E0EAFF] text-[#0050FF] border border-[#BFDBFE] flex items-center gap-1.5 transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed self-start sm:self-auto"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Adicionar Variação ({copies.length}/6)</span>
              </button>
            </div>

            {/* Lista das Variações de Mensagem */}
            <div className="space-y-4">
              {copies.map((copyText, idx) => {
                const letter = copyLetters[idx] || `${idx + 1}`;
                return (
                  <div
                    key={idx}
                    className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-2.5 transition-all focus-within:border-[#0050FF] focus-within:bg-white"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-lg bg-[#0050FF] text-white font-bold text-xs flex items-center justify-center">
                          {letter}
                        </span>
                        <span className="text-xs font-bold text-[#0F172A]">
                          Variação {letter}
                        </span>
                        <span className="text-[10px] text-[#64748B] font-mono">
                          ({copyText.length} caracteres)
                        </span>
                      </div>

                      {copies.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeCopyVariation(idx)}
                          className="p-1 text-[#94A3B8] hover:text-rose-600 rounded-lg hover:bg-rose-50 transition cursor-pointer"
                          title="Remover esta variação"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    <textarea
                      rows={3}
                      value={copyText}
                      onChange={(e) => updateCopyVariation(idx, e.target.value)}
                      placeholder={`Escreva a variação de mensagem ${letter}...`}
                      className="w-full bg-white border border-[#CBD5E1] rounded-xl p-3 text-xs text-[#0F172A] focus:outline-none focus:border-[#0050FF] transition"
                    />

                    {/* Botão de Tag Rápida de Spintax: Apenas Primeiro Nome */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      <span className="text-[10px] font-semibold text-[#64748B] flex items-center gap-1">
                        <Tag className="w-3 h-3 text-[#0050FF]" /> Inserir Tag:
                      </span>
                      <button
                        type="button"
                        onClick={() => insertTagIntoCopy(idx, '{primeiro_nome}')}
                        className="px-2.5 py-1 rounded-md bg-[#EFF4FF] border border-[#BFDBFE] text-[10px] font-mono font-semibold text-[#0050FF] hover:bg-[#DBEAFE] cursor-pointer transition shadow-2xs"
                      >
                        {'{primeiro_nome}'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Barra de Progresso Real do Disparo */}
            {broadcastProgress && (
              <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-3 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-[#0F172A] flex items-center gap-2">
                    {isSendingBroadcast && <RefreshCw className="w-3.5 h-3.5 text-[#0050FF] animate-spin" />}
                    Progresso do Disparo: {broadcastProgress.current} de {broadcastProgress.total}
                  </span>
                  <span className="text-[11px] font-mono text-[#64748B]">
                    <span className="text-emerald-600 font-bold">{broadcastProgress.success} enviados</span> •{' '}
                    <span className="text-rose-600 font-bold">{broadcastProgress.failed} falhas</span>
                  </span>
                </div>
                <div className="w-full bg-[#E2E8F0] h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-[#0050FF] h-full transition-all duration-300 rounded-full"
                    style={{
                      width: `${Math.round((broadcastProgress.current / Math.max(1, broadcastProgress.total)) * 100)}%`,
                    }}
                  />
                </div>
              </div>
            )}

            <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-[#F1F5F9]">
              <span className="text-[11px] text-[#64748B]">
                <b>{copies.length} de 6 variações ativas</b> | Destinatários: <b>{activeRecipients.length} contatos</b>
              </span>

              <button
                onClick={handleStartBroadcast}
                disabled={isSendingBroadcast || activeRecipients.length === 0}
                className="px-5 py-2.5 rounded-full font-bold bg-[#0050FF] hover:bg-[#0040D6] text-white text-xs shadow-xs flex items-center justify-center gap-2 cursor-pointer transition disabled:opacity-50"
              >
                {isSendingBroadcast ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                <span>
                  {isSendingBroadcast
                    ? `Disparando (${broadcastProgress?.current || 0}/${broadcastProgress?.total || activeRecipients.length})...`
                    : activeRecipients.length > 0
                    ? `Iniciar Transmissão (${activeRecipients.length} Contatos)`
                    : 'Selecione os Destinatários Acima'}
                </span>
              </button>
            </div>
          </div>

          <div className="lg:col-span-5 bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-xs space-y-5">
            <h3 className="font-bold text-sm text-[#0F172A] flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-600" />
              Limites & Salvaguardas Anti-Bloqueio
            </h3>

            <div className="space-y-3.5 text-xs">
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

              <div className="p-4 rounded-xl bg-[#EFF4FF] border border-[#BFDBFE] space-y-1.5 mt-2">
                <span className="text-[10px] font-bold text-[#0050FF] uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  Rotação Inteligente de {copies.length} Cópias
                </span>
                <p className="text-[11px] text-[#475569] leading-relaxed">
                  As mensagens cadastradas serão intercaladas de forma equilibrada entre cada lead, evitando que o WhatsApp identifique mensagens repetitivas em lote.
                </p>
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

      {/* ABA 5: DASHBOARD DE TRANSMISSÕES & MÉTRICAS REAIS */}
      {subTab === 'tracking' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-xs">
              <p className="text-xs font-semibold text-[#64748B] uppercase tracking-wider">Total Disparado</p>
              <p className="text-2xl font-bold text-[#0F172A] mt-1">{totalSentBroadcasts}</p>
              <p className="text-[11px] text-emerald-600 font-medium mt-0.5">
                {totalSentBroadcasts > 0 ? 'Transmitidas nesta sessão' : 'Nenhum envio recente'}
              </p>
            </div>

            <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-xs">
              <p className="text-xs font-semibold text-[#64748B] uppercase tracking-wider">Linhas Conectadas</p>
              <p className="text-2xl font-bold text-[#0050FF] mt-1">
                {availableInstances.filter((i) => i.status === 'connected' || (i as any).connectionStatus === 'open').length}
              </p>
              <p className="text-[11px] text-[#64748B] font-medium mt-0.5">
                De {availableInstances.length} instâncias mapeadas
              </p>
            </div>

            <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-xs">
              <p className="text-xs font-semibold text-[#64748B] uppercase tracking-wider">Ligações Efetuadas</p>
              <p className="text-2xl font-bold text-emerald-600 mt-1">{calls.length > 0 ? calls.length : 0}</p>
              <p className="text-[11px] text-[#64748B] font-medium mt-0.5">Sincronizadas no Kommo</p>
            </div>

            <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-xs">
              <p className="text-xs font-semibold text-[#64748B] uppercase tracking-wider">Status da Linha</p>
              <p className={`text-2xl font-bold mt-1 ${selectedInstanceStatus === 'connected' ? 'text-emerald-600' : 'text-rose-500'}`}>
                {selectedInstanceStatus === 'connected' ? 'Ativa' : 'Desconectada'}
              </p>
              <p className="text-[11px] text-[#64748B] font-medium mt-0.5 truncate">
                {selectedInstanceName || 'WhatsApp'}
              </p>
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
        instanceToken={selectedInstanceToken}
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
