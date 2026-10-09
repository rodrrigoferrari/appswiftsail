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
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function AdminClientesPage() {
  const router = useRouter();
  const { clients, setClients, adAccounts, users, selectClientAndSwitchToWorkspace } = useTenant();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
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
    return matchesSearch && matchesStatus;
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

      {/* Stats Bar (Estilo Cartões Asaas: Fundo Branco, Bordas #E2E8F0, Números Grandes e Legíveis) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-xs">
          <p className="text-xs font-semibold text-[#64748B] uppercase tracking-wider">Total de Clientes</p>
          <p className="text-2xl sm:text-3xl font-bold text-[#0F172A] mt-1">{clients.length}</p>
          <p className="text-[11px] text-[#0050FF] font-medium mt-0.5">Workspaces configurados</p>
        </div>

        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-xs">
          <p className="text-xs font-semibold text-[#64748B] uppercase tracking-wider">Clientes Ativos</p>
          <p className="text-2xl sm:text-3xl font-bold text-emerald-600 mt-1">
            {clients.filter((c) => c.status === 'ativo').length}
          </p>
          <p className="text-[11px] text-[#64748B] font-medium mt-0.5">Operação em andamento</p>
        </div>

        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-xs">
          <p className="text-xs font-semibold text-[#64748B] uppercase tracking-wider">Contas de Anúncio</p>
          <p className="text-2xl sm:text-3xl font-bold text-[#0050FF] mt-1">{adAccounts.length}</p>
          <p className="text-[11px] text-[#64748B] font-medium mt-0.5">Meta & Google mapeadas</p>
        </div>

        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-xs">
          <p className="text-xs font-semibold text-[#64748B] uppercase tracking-wider">Usuários de Clientes</p>
          <p className="text-2xl sm:text-3xl font-bold text-[#0F172A] mt-1">
            {users.filter((u) => !!u.cliente_id).length}
          </p>
          <p className="text-[11px] text-[#64748B] font-medium mt-0.5">Membros com acesso</p>
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

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-3.5 py-2 text-xs font-semibold text-[#475569] focus:outline-none focus:border-[#0050FF] w-full sm:w-auto cursor-pointer"
        >
          <option value="ALL">Todos os Status</option>
          <option value="ativo">🟢 Ativos</option>
          <option value="pausado">🟡 Pausados</option>
          <option value="encerrado">⚪ Encerrados</option>
        </select>
      </div>

      {/* Clients Grid (Estilo Asaas: Cartões Brancos, Sombra Suave, Tipografia Nítida) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredClients.map((client) => {
          const clientUsers = users.filter((u) => u.cliente_id === client.cliente_id);
          const clientAccounts = adAccounts.filter((a) => {
            if (client.grupo_whatsapp_id && a.group_jid === client.grupo_whatsapp_id) return true;
            return a.account_name.toLowerCase().includes(client.cliente_id.toLowerCase());
          });

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

                {/* Metadata details */}
                <div className="space-y-2 pt-3 border-t border-[#F1F5F9] text-xs">
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

    </div>
  );
}
