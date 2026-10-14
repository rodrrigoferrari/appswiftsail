'use client';

import React, { useState } from 'react';
import { useTenant } from '@/components/TenantProvider';
import {
  Building,
  Plus,
  Search,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  MessageSquare,
  Zap,
  Users,
  KanbanSquare,
  RefreshCw,
  HeartHandshake,
  Activity,
  FileText,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CsStatus } from '@/types/database';

export default function AdminClientesPage() {
  const router = useRouter();
  const { clients, setClients, adAccounts, users, csStatusList, selectClientAndSwitchToWorkspace } = useTenant();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [csFilter, setCsFilter] = useState('ALL');
  const [selectedCsModal, setSelectedCsModal] = useState<{ clientName: string; cs: CsStatus } | null>(null);
  const [showNewModal, setShowNewModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form
  const [novoNome, setNovoNome] = useState('');
  const [novoSlug, setNovoSlug] = useState('');
  const [novoGrupoWhats, setNovoGrupoWhats] = useState('');
  const [novoDrive, setNovoDrive] = useState('');

  const handleNomeChange = (val: string) => {
    setNovoNome(val);
    if (!novoSlug || novoSlug === '') {
      setNovoSlug(
        val
          .toLowerCase()
          .replace(/[^a-z0-9]/g, '_')
          .replace(/_+/g, '_')
      );
    }
  };

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!novoNome || !novoSlug) {
      setFeedback({ type: 'error', text: 'Nome e Identificador (Slug) são obrigatórios.' });
      return;
    }

    setIsSaving(true);
    setFeedback(null);

    try {
      const res = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cliente_id: novoSlug,
          nome: novoNome,
          grupo_whatsapp_id: novoGrupoWhats,
          drive_folder_id: novoDrive,
          status: 'ativo',
        }),
      });

      const data = await res.json();
      if (data.success) {
        setFeedback({ type: 'success', text: `Cliente ${novoNome} criado com sucesso!` });
        if (data.cliente) {
          setClients((prev) => [...prev.filter((c) => c.cliente_id !== data.cliente.cliente_id), data.cliente]);
        }
        setShowNewModal(false);
        setNovoNome('');
        setNovoSlug('');
        setNovoGrupoWhats('');
        setNovoDrive('');
      } else {
        setFeedback({ type: 'error', text: data.error || 'Erro ao criar cliente.' });
      }
    } catch {
      setFeedback({ type: 'error', text: 'Falha de comunicação com o servidor.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleEnterClientWorkspace = (clientId: string) => {
    selectClientAndSwitchToWorkspace(clientId);
    router.push('/');
  };

  const filteredClients = clients.filter((c) => {
    const matchesSearch =
      c.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.cliente_id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || c.status === statusFilter;
    
    // CS Filter
    const clientCs = csStatusList?.find((cs) => cs.cliente_id === c.cliente_id);
    let matchesCs = true;
    if (csFilter !== 'ALL') {
      if (csFilter === 'sem_cs') {
        matchesCs = !clientCs;
      } else {
        matchesCs = clientCs?.nivel === csFilter;
      }
    }

    return matchesSearch && matchesStatus && matchesCs;
  });

  const handleStatusChange = async (clientId: string, newStatus: string) => {
    const client = clients.find((c) => c.cliente_id === clientId);
    if (!client) return;

    try {
      const res = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cliente_id: client.cliente_id,
          nome: client.nome,
          grupo_whatsapp_id: client.grupo_whatsapp_id,
          drive_folder_id: client.drive_folder_id,
          status: newStatus,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setClients((prev) =>
          prev.map((c) => (c.cliente_id === clientId ? { ...c, status: newStatus } : c))
        );
        setFeedback({
          type: 'success',
          text: `Status de ${client.nome} alterado para ${newStatus.toUpperCase()}. O Sinapse atualizará a sincronização.`,
        });
      }
    } catch {
      setFeedback({ type: 'error', text: 'Falha ao atualizar status no servidor.' });
    }
  };

  return (
    <div className="space-y-6 select-none font-sans">
      {/* Top Banner (Estilo Asaas: Limpo, Branco, com Bordas Suaves e Botão Azul Primário) */}
      <div className="bg-white border border-[#E2E8F0] p-6 rounded-2xl shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-[#EFF4FF] text-[#0050FF] border border-[#BFDBFE] uppercase tracking-wider">
              Gestão de Carteira Swiftsail
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#0F172A] flex items-center gap-2.5">
            <Building className="w-6 h-6 text-[#0050FF]" />
            Clientes & Workspaces Cadastrados
          </h1>
          <p className="text-xs text-[#64748B] max-w-2xl leading-relaxed">
            Painel mestre de governança dos clientes da agência. Cada cliente opera com isolamento de dados, contas de anúncios próprias e CRM integrado.
          </p>
        </div>
      </div>

      {feedback && (
        <div
          className={`p-4 rounded-xl text-xs font-semibold flex items-center gap-2 border ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : 'bg-rose-50 text-rose-700 border-rose-200'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600" />
          )}
          <span>{feedback.text}</span>
        </div>
      )}

      {/* Stats Bar com métricas operacionais e de CS (Customer Success) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-xs">
          <p className="text-xs font-semibold text-[#64748B] uppercase tracking-wider">Total de Clientes</p>
          <p className="text-2xl sm:text-3xl font-bold text-[#0F172A] mt-1">{clients.length}</p>
          <p className="text-[11px] text-[#0050FF] font-medium mt-0.5">Workspaces cadastrados</p>
        </div>

        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-xs">
          <p className="text-xs font-semibold text-[#64748B] uppercase tracking-wider">CS Saudáveis</p>
          <p className="text-2xl sm:text-3xl font-bold text-emerald-600 mt-1">
            {csStatusList?.filter((c) => c.nivel === 'saudavel').length || 0}
          </p>
          <p className="text-[11px] text-[#64748B] font-medium mt-0.5">Operação em alta performance</p>
        </div>

        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-xs">
          <p className="text-xs font-semibold text-[#64748B] uppercase tracking-wider">CS Atenção / Risco</p>
          <p className="text-2xl sm:text-3xl font-bold text-amber-600 mt-1">
            {csStatusList?.filter((c) => c.nivel === 'atencao' || c.nivel === 'em_risco').length || 0}
          </p>
          <p className="text-[11px] text-[#64748B] font-medium mt-0.5">Demandam ação imediata</p>
        </div>

        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-xs">
          <p className="text-xs font-semibold text-[#64748B] uppercase tracking-wider">Contas de Anúncio</p>
          <p className="text-2xl sm:text-3xl font-bold text-[#0050FF] mt-1">{adAccounts.length}</p>
          <p className="text-[11px] text-[#64748B] font-medium mt-0.5">Meta & Google mapeadas</p>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white border border-[#E2E8F0] p-4 rounded-2xl shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-[#94A3B8]" />
          <input
            type="text"
            placeholder="Buscar por nome ou ID do cliente..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl pl-9 pr-3 py-2 text-xs text-[#0F172A] focus:outline-none focus:border-[#0050FF] transition-colors"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {/* Filtro Status Operacional */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-3 py-2 text-xs font-semibold text-[#475569] focus:outline-none focus:border-[#0050FF] cursor-pointer"
          >
            <option value="ALL">Status: Todos</option>
            <option value="ativo">🟢 Ativos</option>
            <option value="pausado">🟡 Pausados</option>
            <option value="encerrado">⚪ Encerrados</option>
          </select>

          {/* Filtro de Customer Success */}
          <select
            value={csFilter}
            onChange={(e) => setCsFilter(e.target.value)}
            className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-3 py-2 text-xs font-semibold text-[#475569] focus:outline-none focus:border-[#0050FF] cursor-pointer"
          >
            <option value="ALL">Saúde CS: Todos</option>
            <option value="saudavel">🟢 CS Saudável</option>
            <option value="atencao">🟡 CS Atenção</option>
            <option value="em_risco">🔴 CS Em Risco</option>
            <option value="sem_cs">⚪ Sem Diagnóstico</option>
          </select>
        </div>
      </div>

      {/* Clients Grid (Estilo Asaas: Cartões Brancos, Sombra Suave, Tipografia Nítida) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredClients.map((client) => {
          const clientUsers = users.filter((u) => u.cliente_id === client.cliente_id);
          const clientAccounts = adAccounts.filter((a) => {
            if (client.grupo_whatsapp_id && a.group_jid === client.grupo_whatsapp_id) return true;
            return a.account_name.toLowerCase().includes(client.cliente_id.toLowerCase());
          });

          // Diagnóstico de CS mais recente do Supabase
          const clientCs = csStatusList?.find((cs) => cs.cliente_id === client.cliente_id);

          return (
            <div
              key={client.cliente_id}
              className="bg-white border border-[#E2E8F0] hover:border-[#CBD5E1] hover:shadow-md transition-all rounded-2xl p-5 shadow-xs flex flex-col justify-between group space-y-4"
            >
              <div className="space-y-3">
                {/* Card Header */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <select
                        value={client.status || 'ativo'}
                        onChange={(e) => handleStatusChange(client.cliente_id, e.target.value)}
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border focus:outline-none cursor-pointer ${
                          client.status === 'ativo'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : client.status === 'pausado'
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-rose-50 text-rose-700 border-rose-200'
                        }`}
                      >
                        <option value="ativo">🟢 Ativo (Sync ON)</option>
                        <option value="pausado">🟡 Pausado</option>
                        <option value="encerrado">🔴 Encerrado (Sync OFF)</option>
                      </select>
                    </div>
                    <h3 className="text-base font-bold text-[#0F172A] mt-2 group-hover:text-[#0050FF] transition-colors">
                      {client.nome === 'EMOVERE' ? 'Emovere' : client.nome}
                    </h3>
                    <p className="text-[11px] text-[#64748B] font-mono">ID: {client.cliente_id}</p>
                  </div>

                  <div className="w-10 h-10 rounded-xl bg-[#EFF4FF] border border-[#BFDBFE] flex items-center justify-center text-[#0050FF] font-bold text-sm shrink-0 shadow-xs">
                    {(client.nome === 'EMOVERE' ? 'Emovere' : client.nome).substring(0, 2).toUpperCase()}
                  </div>
                </div>

                {/* CS Status Card - Customer Success do Supabase */}
                <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748B] flex items-center gap-1.5">
                      <HeartHandshake className="w-3.5 h-3.5 text-[#0050FF]" /> Diagnóstico CS
                    </span>
                    {clientCs ? (
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          clientCs.nivel === 'saudavel'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : clientCs.nivel === 'atencao'
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-rose-50 text-rose-700 border-rose-200'
                        }`}
                      >
                        {clientCs.nivel === 'saudavel'
                          ? '🟢 Saudável'
                          : clientCs.nivel === 'atencao'
                          ? '🟡 Atenção'
                          : '🔴 Em Risco'}
                      </span>
                    ) : (
                      <span className="text-[10px] font-semibold text-[#94A3B8]">Sem registro</span>
                    )}
                  </div>

                  {clientCs?.sinais?.nota ? (
                    <div className="space-y-1">
                      <p className="text-[11px] text-[#334155] leading-relaxed line-clamp-2">
                        {clientCs.sinais.nota}
                      </p>
                      <div className="flex items-center justify-between pt-1">
                        <span className="text-[10px] text-[#94A3B8]">
                          Ciclo: {clientCs.sinais.ciclo || clientCs.data || 'Recente'}
                        </span>
                        <button
                          onClick={() => setSelectedCsModal({ clientName: client.nome, cs: clientCs })}
                          className="text-[10px] font-bold text-[#0050FF] hover:underline cursor-pointer"
                        >
                          Ver diagnóstico completo
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-[11px] text-[#94A3B8] italic">Aguardando primeira rodada de diagnóstico CS.</p>
                  )}
                </div>

                {/* Metadata details */}
                <div className="space-y-2 pt-2 border-t border-[#F1F5F9] text-xs">
                  <div className="flex items-center justify-between text-[#64748B]">
                    <span className="flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-[#0050FF]" /> Contas de Anúncio
                    </span>
                    <span className="font-bold text-[#0F172A]">{clientAccounts.length}</span>
                  </div>

                  <div className="flex items-center justify-between text-[#64748B]">
                    <span className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-[#64748B]" /> Usuários com Acesso
                    </span>
                    <span className="font-bold text-[#0F172A]">{clientUsers.length}</span>
                  </div>

                  <div className="flex items-center justify-between text-[#64748B]">
                    <span className="flex items-center gap-1.5">
                      <MessageSquare className="w-3.5 h-3.5 text-emerald-600" /> Grupo WhatsApp
                    </span>
                    <span className="font-mono text-[10px] text-[#0F172A] font-semibold truncate max-w-[140px]">
                      {client.grupo_whatsapp_id ? 'Vinculado' : 'Sem grupo'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-[#F1F5F9] flex items-center gap-2">
                <button
                  onClick={() => handleEnterClientWorkspace(client.cliente_id)}
                  className="flex-1 px-4 py-2 rounded-xl text-xs font-semibold bg-[#EFF4FF] hover:bg-[#E0EAFF] text-[#0050FF] border border-[#BFDBFE] flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Acessar Workspace</span>
                </button>

                <Link
                  href={`/credenciais/cliente?client=${client.cliente_id}`}
                  onClick={() => selectClientAndSwitchToWorkspace(client.cliente_id)}
                  className="p-2 rounded-xl bg-white border border-[#E2E8F0] hover:bg-[#F8FAFC] text-[#64748B] hover:text-[#0050FF] transition-colors shadow-xs"
                  title="Configurar CRM & Acessos do Cliente"
                >
                  <KanbanSquare className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal de Diagnóstico Completo de CS */}
      {selectedCsModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-[#CBD5E1] space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#0050FF] bg-[#EFF4FF] px-2.5 py-0.5 rounded-full border border-[#BFDBFE]">
                  Relatório de Saúde & Customer Success
                </span>
                <h3 className="text-lg font-bold text-[#0F172A] mt-1.5">
                  {selectedCsModal.clientName}
                </h3>
                <p className="text-xs text-[#64748B]">
                  Gerado por {selectedCsModal.cs.agente_origem || '@customer_success_and_onboarding'}
                </p>
              </div>
              <button
                onClick={() => setSelectedCsModal(null)}
                className="p-1.5 rounded-lg text-[#64748B] hover:bg-[#F1F5F9] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
              <span className="text-xs font-semibold text-[#475569]">Status Atual:</span>
              <span
                className={`text-xs font-bold px-3 py-1 rounded-full border ${
                  selectedCsModal.cs.nivel === 'saudavel'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : selectedCsModal.cs.nivel === 'atencao'
                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                    : 'bg-rose-50 text-rose-700 border-rose-200'
                }`}
              >
                {selectedCsModal.cs.nivel === 'saudavel'
                  ? '🟢 Saudável'
                  : selectedCsModal.cs.nivel === 'atencao'
                  ? '🟡 Atenção'
                  : '🔴 Em Risco'}
              </span>
              <span className="text-xs text-[#94A3B8] ml-auto">
                Ciclo: {selectedCsModal.cs.sinais?.ciclo || selectedCsModal.cs.data || 'N/A'}
              </span>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-[#475569] uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-[#0050FF]" /> Diagnóstico & Sinais Observados:
              </label>
              <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-xs text-[#1E293B] leading-relaxed max-h-80 overflow-y-auto whitespace-pre-wrap font-sans">
                {selectedCsModal.cs.sinais?.nota || 'Nenhuma nota detalhada registrada.'}
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedCsModal(null)}
                className="px-5 py-2.5 rounded-xl bg-[#0050FF] hover:bg-[#0040D6] text-white text-xs font-bold transition-all cursor-pointer shadow-xs"
              >
                Fechar Relatório
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
