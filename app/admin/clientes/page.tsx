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
  FolderTree,
  Zap,
  Users,
  KanbanSquare,
  CreditCard,
  RefreshCw,
  Check,
  MoreVertical,
  Activity,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Cliente } from '@/types/database';

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

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="glass-card p-6 border-cyan-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900/90 via-slate-900/60 to-cyan-950/20">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 uppercase tracking-wider">
              Gestão de Carteira Swiftsail
            </span>
          </div>
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            <Building className="w-5 h-5 text-cyan-400" />
            Clientes & Workspaces Cadastrados
          </h2>
          <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
            Painel mestre de governança dos clientes da agência. Cada cliente opera com isolamento de dados, contas de anúncios próprias e CRM integrado.
          </p>
        </div>

        <button
          onClick={() => setShowNewModal(true)}
          className="px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-lg shadow-cyan-500/20 flex items-center gap-2 transition-all self-start md:self-auto"
        >
          <Plus className="w-4 h-4" />
          Novo Cliente / Workspace
        </button>
      </div>

      {feedback && (
        <div
          className={`p-4 rounded-xl text-xs font-semibold flex items-center gap-2 border ${
            feedback.type === 'success'
              ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
              : 'bg-rose-500/10 text-rose-300 border-rose-500/30'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-400" />
          )}
          <span>{feedback.text}</span>
        </div>
      )}

      {/* Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="glass-card p-4">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Total de Clientes</p>
          <p className="text-2xl font-black text-white mt-1">{clients.length}</p>
          <p className="text-[10px] text-cyan-400 mt-0.5">Workspaces configurados</p>
        </div>

        <div className="glass-card p-4">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Clientes Ativos</p>
          <p className="text-2xl font-black text-emerald-400 mt-1">
            {clients.filter((c) => c.status === 'ativo').length}
          </p>
          <p className="text-[10px] text-slate-400 mt-0.5">Operação em andamento</p>
        </div>

        <div className="glass-card p-4">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Contas de Anúncio</p>
          <p className="text-2xl font-black text-blue-400 mt-1">{adAccounts.length}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">Meta & Google mapeadas</p>
        </div>

        <div className="glass-card p-4">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Usuários de Clientes</p>
          <p className="text-2xl font-black text-purple-400 mt-1">
            {users.filter((u) => !!u.cliente_id).length}
          </p>
          <p className="text-[10px] text-slate-400 mt-0.5">Membros com acesso</p>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="glass-card p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
          <input
            type="text"
            placeholder="Buscar por nome ou ID do cliente..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-1.5 text-xs font-medium text-slate-300 focus:outline-none focus:border-cyan-500 w-full sm:w-auto"
        >
          <option value="ALL">Todos os Status</option>
          <option value="ativo">🟢 Ativos</option>
          <option value="pausado">🟡 Pausados</option>
          <option value="encerrado">⚪ Encerrados</option>
        </select>
      </div>

      {/* Clients Grid */}
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
              className="glass-card p-5 space-y-4 hover:border-cyan-500/40 transition-all flex flex-col justify-between group"
            >
              <div className="space-y-3">
                {/* Card Header */}
                <div className="flex items-start justify-between">
                  <div>
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                        client.status === 'ativo'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-slate-800 text-slate-400 border border-slate-700'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          client.status === 'ativo' ? 'bg-emerald-400' : 'bg-slate-500'
                        }`}
                      />
                      {client.status === 'ativo' ? 'Ativo' : 'Inativo'}
                    </span>
                    <h3 className="text-base font-black text-white mt-1 group-hover:text-cyan-300 transition-colors">
                      {client.nome}
                    </h3>
                    <p className="text-[11px] text-slate-400 font-mono">ID: {client.cliente_id}</p>
                  </div>

                  <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-cyan-400 font-bold text-sm">
                    {client.nome.substring(0, 2).toUpperCase()}
                  </div>
                </div>

                {/* Metadata details */}
                <div className="space-y-2 pt-2 border-t border-slate-800/80 text-xs">
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-blue-400" /> Contas de Anúncio
                    </span>
                    <span className="font-bold text-white">{clientAccounts.length}</span>
                  </div>

                  <div className="flex items-center justify-between text-slate-400">
                    <span className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-purple-400" /> Usuários com Acesso
                    </span>
                    <span className="font-bold text-white">{clientUsers.length}</span>
                  </div>

                  <div className="flex items-center justify-between text-slate-400">
                    <span className="flex items-center gap-1.5">
                      <MessageSquare className="w-3.5 h-3.5 text-emerald-400" /> Grupo WhatsApp
                    </span>
                    <span className="font-mono text-[10px] text-cyan-300 truncate max-w-[140px]">
                      {client.grupo_whatsapp_id ? 'Vinculado' : 'Sem grupo'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-800/80 flex items-center gap-2">
                <button
                  onClick={() => handleEnterClientWorkspace(client.cliente_id)}
                  className="flex-1 px-3 py-2 rounded-xl text-xs font-bold bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border border-cyan-500/30 flex items-center justify-center gap-1.5 transition-all"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Acessar Workspace</span>
                </button>

                <Link
                  href={`/credenciais/cliente?client=${client.cliente_id}`}
                  onClick={() => selectClientAndSwitchToWorkspace(client.cliente_id)}
                  className="p-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-400 hover:text-white transition-colors"
                  title="Configurar CRM & Acessos do Cliente"
                >
                  <KanbanSquare className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      {/* New Client Modal */}
      {showNewModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0f172a] border border-slate-700/80 rounded-2xl p-6 w-full max-w-lg shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Building className="w-4 h-4 text-cyan-400" />
                Criar Novo Workspace / Cliente
              </h3>
              <button
                onClick={() => setShowNewModal(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateClient} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Nome da Empresa / Cliente *</label>
                <input
                  type="text"
                  required
                  placeholder="ex: Construtora Alfa"
                  value={novoNome}
                  onChange={(e) => handleNomeChange(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Identificador Único (Slug ID) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="ex: construtora_alfa"
                  value={novoSlug}
                  onChange={(e) => setNovoSlug(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Grupo de WhatsApp JID (Uazapi)
                </label>
                <input
                  type="text"
                  placeholder="ex: 120363385277868846@g.us"
                  value={novoGrupoWhats}
                  onChange={(e) => setNovoGrupoWhats(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Google Drive Folder ID (Opcional)
                </label>
                <input
                  type="text"
                  placeholder="ex: 1A2b3C4d5E6F..."
                  value={novoDrive}
                  onChange={(e) => setNovoDrive(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2.5 rounded-xl font-bold bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 text-white shadow-lg shadow-cyan-500/20 flex items-center gap-2"
                >
                  {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  <span>Salvar Cliente</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
