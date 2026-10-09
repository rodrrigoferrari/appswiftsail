'use client';

import React, { useState } from 'react';
import { useTenant } from '@/components/TenantProvider';
import {
  Users,
  UserPlus,
  Mail,
  ShieldCheck,
  Building,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  RefreshCw,
  Trash2,
  Lock,
  Unlock,
  Search,
  Filter,
  KeyRound,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Send,
} from 'lucide-react';
import { UserRole, UserModulePermission } from '@/types/database';

const ROLE_CONFIG: Record<UserRole, { label: string; badgeClass: string; desc: string }> = {
  master_admin: {
    label: '👑 Master Admin (HQ)',
    badgeClass: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
    desc: 'Acesso total irrestrito à Swiftsail, credenciais master e todas as contas',
  },
  gestor_trafego: {
    label: '🚀 Gestor de Tráfego',
    badgeClass: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    desc: 'Gestão de campanhas Meta, Google e análise de criativos',
  },
  cs_account: {
    label: '🛡️ CS / Atendimento',
    badgeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    desc: 'Monitoramento de grupos WhatsApp, CRM e saúde dos clientes',
  },
  cliente_admin: {
    label: '🏢 Administrador do Cliente',
    badgeClass: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    desc: 'Gestor da empresa cliente com acesso ao seu próprio workspace',
  },
  cliente_membro: {
    label: '👤 Membro / Vendedor do Cliente',
    badgeClass: 'bg-slate-700/60 text-slate-300 border-slate-600',
    desc: 'Equipe comercial ou operacional com acesso a módulos específicos do cliente',
  },
};

const ALL_MODULES: { id: UserModulePermission; label: string; icon: string }[] = [
  { id: 'midia', label: 'Tráfego & Anúncios', icon: 'Megaphone' },
  { id: 'whatsapp', label: 'Hub WhatsApp & Uazapi', icon: 'MessageSquare' },
  { id: 'crm', label: 'Pipeline CRM (Kommo)', icon: 'KanbanSquare' },
  { id: 'criativos', label: 'Criativos & Landing Pages', icon: 'Sparkles' },
  { id: 'financeiro', label: 'Financeiro (Asaas)', icon: 'CreditCard' },
];

export default function AdminUsuariosPage() {
  const { clients, users, setUsers, invites, setInvites, refreshUsers, selectClientAndSwitchToWorkspace } = useTenant();

  const [activeTab, setActiveTab] = useState<'users' | 'invites'>('users');
  const [searchTerm, setSearchTerm] = useState('');
  const [clientFilter, setClientFilter] = useState('ALL');
  const [roleFilter, setRoleFilter] = useState('ALL');

  // Modal State
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [inviteSuccessData, setInviteSuccessData] = useState<{ link: string; name: string; email: string } | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // New Invite Form State
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formRole, setFormRole] = useState<UserRole>('cliente_admin');
  const [formClientId, setFormClientId] = useState(clients[0]?.cliente_id || 'dabol');
  const [formModules, setFormModules] = useState<UserModulePermission[]>(['midia', 'whatsapp', 'crm']);
  const [formFeedback, setFormFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const isClientRole = formRole === 'cliente_admin' || formRole === 'cliente_membro';

  const handleToggleModule = (mod: UserModulePermission) => {
    if (formModules.includes(mod)) {
      setFormModules(formModules.filter((m) => m !== mod));
    } else {
      setFormModules([...formModules, mod]);
    }
  };

  const handleCreateInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName || !formEmail) {
      setFormFeedback({ type: 'error', text: 'Preencha o nome e o e-mail do usuário.' });
      return;
    }

    setIsSubmitting(true);
    setFormFeedback(null);

    const targetClient = clients.find((c) => c.cliente_id === formClientId);

    try {
      const res = await fetch('/api/users/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: formName,
          email: formEmail,
          role: formRole,
          cliente_id: isClientRole ? formClientId : 'AGENCY',
          cliente_nome: isClientRole ? targetClient?.nome : 'Swiftsail HQ',
          modulos: formModules,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setInviteSuccessData({
          link: data.link_ativacao,
          name: formName,
          email: formEmail,
        });
        await refreshUsers();
        // Reset inputs
        setFormName('');
        setFormEmail('');
      } else {
        setFormFeedback({ type: 'error', text: data.error || 'Erro ao criar convite.' });
      }
    } catch {
      setFormFeedback({ type: 'error', text: 'Falha de comunicação com o servidor.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleToggleUserStatus = async (userId: string) => {
    try {
      const res = await fetch('/api/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, action: 'toggle_status' }),
      });
      if (res.ok) {
        await refreshUsers();
      }
    } catch (err) {
      console.error('Failed to toggle status:', err);
    }
  };

  const handleRevokeInvite = async (inviteId: string) => {
    if (!confirm('Deseja realmente revogar este convite?')) return;
    try {
      const res = await fetch(`/api/users?id=${inviteId}&type=invite`, {
        method: 'DELETE',
      });
      if (res.ok) {
        await refreshUsers();
      }
    } catch (err) {
      console.error('Failed to revoke invite:', err);
    }
  };

  // Filtered lists
  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.cliente_nome && u.cliente_nome.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesClient = clientFilter === 'ALL' || u.cliente_id === clientFilter || (clientFilter === 'AGENCY' && !u.cliente_id);
    const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
    return matchesSearch && matchesClient && matchesRole;
  });

  const filteredInvites = invites.filter((i) => {
    const matchesSearch =
      i.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      i.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesClient = clientFilter === 'ALL' || i.cliente_id === clientFilter || (clientFilter === 'AGENCY' && !i.cliente_id);
    return matchesSearch && matchesClient;
  });

  return (
    <div className="space-y-6 font-sans select-none">
      {/* Top Banner (Estilo Asaas) */}
      <div className="bg-white border border-[#E2E8F0] p-6 rounded-2xl shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-[#EFF4FF] text-[#0050FF] border border-[#BFDBFE] uppercase tracking-wider">
              Governança & Controle de Acessos
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#0F172A] flex items-center gap-2.5">
            <Users className="w-6 h-6 text-[#0050FF]" />
            Gestão de Usuários & Convites dos Clientes
          </h1>
          <p className="text-xs text-[#64748B] max-w-2xl leading-relaxed">
            Convide usuários da sua agência e membros para cada cliente individual (com acesso isolado aos seus respectivos dashboards e permissões modulares).
          </p>
        </div>

        <button
          onClick={() => {
            setInviteSuccessData(null);
            setShowInviteModal(true);
          }}
          className="bg-[#0050FF] hover:bg-[#0040D6] text-white px-5 py-2.5 rounded-full font-semibold text-xs sm:text-sm flex items-center gap-2 shadow-xs transition-all active:scale-95 cursor-pointer self-start md:self-auto"
        >
          <UserPlus className="w-4 h-4" />
          <span>Convidar Novo Usuário</span>
        </button>
      </div>

      {/* KPI Stats Cards (Estilo Asaas) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-xs">
          <p className="text-xs font-semibold text-[#64748B] uppercase tracking-wider">Total de Usuários</p>
          <p className="text-2xl sm:text-3xl font-bold text-[#0F172A] mt-1">{users.length}</p>
          <p className="text-[11px] text-emerald-600 font-medium mt-0.5">Ativos na plataforma</p>
        </div>

        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-xs">
          <p className="text-xs font-semibold text-[#64748B] uppercase tracking-wider">Convites Pendentes</p>
          <p className="text-2xl sm:text-3xl font-bold text-amber-600 mt-1">{invites.length}</p>
          <p className="text-[11px] text-[#64748B] font-medium mt-0.5">Aguardando ativação</p>
        </div>

        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-xs">
          <p className="text-xs font-semibold text-[#64748B] uppercase tracking-wider">Usuários de Clientes</p>
          <p className="text-2xl sm:text-3xl font-bold text-[#0050FF] mt-1">
            {users.filter((u) => !!u.cliente_id).length}
          </p>
          <p className="text-[11px] text-[#64748B] font-medium mt-0.5">Isolados por workspace</p>
        </div>

        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-xs">
          <p className="text-xs font-semibold text-[#64748B] uppercase tracking-wider">Equipe Swiftsail (HQ)</p>
          <p className="text-2xl sm:text-3xl font-bold text-purple-600 mt-1">
            {users.filter((u) => !u.cliente_id).length}
          </p>
          <p className="text-[11px] text-[#64748B] font-medium mt-0.5">Admins, Gestores e CS</p>
        </div>
      </div>

      {/* Filters & Tabs Bar */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl p-4 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Tabs */}
        <div className="flex items-center gap-2 p-1 bg-[#F1F5F9] border border-[#E2E8F0] rounded-xl w-fit">
          <button
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'users'
                ? 'bg-white text-[#0050FF] shadow-xs border border-[#E2E8F0]'
                : 'text-[#64748B] hover:text-[#0F172A]'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            Usuários Cadastrados ({filteredUsers.length})
          </button>

          <button
            onClick={() => setActiveTab('invites')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'invites'
                ? 'bg-white text-[#0050FF] shadow-xs border border-[#E2E8F0]'
                : 'text-[#64748B] hover:text-[#0F172A]'
            }`}
          >
            <Mail className="w-3.5 h-3.5" />
            Convites Pendentes ({filteredInvites.length})
          </button>
        </div>

        {/* Search & Selectors */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
            <input
              type="text"
              placeholder="Buscar por nome, email ou empresa..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <select
            value={clientFilter}
            onChange={(e) => setClientFilter(e.target.value)}
            className="bg-slate-950/80 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs font-medium text-slate-300 focus:outline-none focus:border-cyan-500"
          >
            <option value="ALL">🏢 Todos os Clientes</option>
            <option value="AGENCY">👑 Apenas Equipe HQ (Agência)</option>
            {clients.map((c) => (
              <option key={c.cliente_id} value={c.cliente_id}>
                {c.nome}
              </option>
            ))}
          </select>

          {activeTab === 'users' && (
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="bg-slate-950/80 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs font-medium text-slate-300 focus:outline-none focus:border-cyan-500"
            >
              <option value="ALL">Todos os Cargos</option>
              <option value="master_admin">Master Admin</option>
              <option value="gestor_trafego">Gestor de Tráfego</option>
              <option value="cs_account">CS / Atendimento</option>
              <option value="cliente_admin">Admin do Cliente</option>
              <option value="cliente_membro">Membro do Cliente</option>
            </select>
          )}
        </div>
      </div>

      {/* Content Tab: Users Table */}
      {activeTab === 'users' && (
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/80 text-slate-400 font-bold uppercase tracking-wider text-[10px] border-b border-slate-800">
                <tr>
                  <th className="p-4">Usuário</th>
                  <th className="p-4">Perfil & Cargo</th>
                  <th className="p-4">Workspace / Cliente</th>
                  <th className="p-4">Módulos Liberados</th>
                  <th className="p-4">Último Acesso</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-500">
                      Nenhum usuário encontrado com os filtros selecionados.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => {
                    const roleInfo = ROLE_CONFIG[user.role] || {
                      label: user.role,
                      badgeClass: 'bg-slate-800 text-slate-300 border-slate-700',
                    };

                    return (
                      <tr key={user.id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-cyan-500/20 to-blue-500/30 border border-cyan-500/40 flex items-center justify-center font-bold text-cyan-300 text-xs">
                              {user.nome.substring(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-bold text-white">{user.nome}</p>
                              <p className="text-[11px] text-slate-400 font-mono">{user.email}</p>
                            </div>
                          </div>
                        </td>

                        <td className="p-4">
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold border ${roleInfo.badgeClass}`}
                          >
                            {roleInfo.label}
                          </span>
                        </td>

                        <td className="p-4">
                          <div className="flex items-center gap-1.5">
                            <Building className="w-3.5 h-3.5 text-slate-400" />
                            <span className="font-medium text-slate-200">
                              {user.cliente_nome || 'Swiftsail HQ (Global)'}
                            </span>
                          </div>
                        </td>

                        <td className="p-4">
                          <div className="flex flex-wrap gap-1 max-w-xs">
                            {user.modulos.map((m) => (
                              <span
                                key={m}
                                className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-[10px] font-mono text-cyan-300 capitalize"
                              >
                                {m}
                              </span>
                            ))}
                          </div>
                        </td>

                        <td className="p-4 font-mono text-[11px] text-slate-400">
                          {user.ultimo_acesso || 'Nunca acessou'}
                        </td>

                        <td className="p-4">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                              user.status === 'ativo'
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                user.status === 'ativo' ? 'bg-emerald-400' : 'bg-rose-400'
                              }`}
                            />
                            {user.status === 'ativo' ? 'Ativo' : 'Bloqueado'}
                          </span>
                        </td>

                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {user.cliente_id && (
                              <button
                                onClick={() => selectClientAndSwitchToWorkspace(user.cliente_id!)}
                                className="p-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-300 hover:text-cyan-400 hover:border-cyan-500/40 transition-colors"
                                title="Acessar workspace deste cliente"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </button>
                            )}

                            <button
                              onClick={() => handleToggleUserStatus(user.id)}
                              className="p-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-400 hover:text-white transition-colors"
                              title={user.status === 'ativo' ? 'Bloquear Usuário' : 'Ativar Usuário'}
                            >
                              {user.status === 'ativo' ? (
                                <Lock className="w-3.5 h-3.5 text-amber-400" />
                              ) : (
                                <Unlock className="w-3.5 h-3.5 text-emerald-400" />
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Content Tab: Invites Table */}
      {activeTab === 'invites' && (
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/80 text-slate-400 font-bold uppercase tracking-wider text-[10px] border-b border-slate-800">
                <tr>
                  <th className="p-4">Convidado</th>
                  <th className="p-4">Cargo Proposto</th>
                  <th className="p-4">Empresa / Cliente</th>
                  <th className="p-4">Link de Ativação</th>
                  <th className="p-4">Expira em</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredInvites.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-500">
                      Nenhum convite pendente. Clique em &quot;Convidar Novo Usuário&quot; para enviar novos acessos.
                    </td>
                  </tr>
                ) : (
                  filteredInvites.map((invite) => {
                    const isCopied = copiedId === invite.id;
                    const roleInfo = ROLE_CONFIG[invite.role] || {
                      label: invite.role,
                      badgeClass: 'bg-slate-800 text-slate-300 border-slate-700',
                    };

                    return (
                      <tr key={invite.id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="p-4">
                          <div>
                            <p className="font-bold text-white">{invite.nome}</p>
                            <p className="text-[11px] text-slate-400 font-mono">{invite.email}</p>
                          </div>
                        </td>

                        <td className="p-4">
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold border ${roleInfo.badgeClass}`}
                          >
                            {roleInfo.label}
                          </span>
                        </td>

                        <td className="p-4">
                          <span className="font-medium text-slate-200">
                            {invite.cliente_nome || 'Swiftsail HQ'}
                          </span>
                        </td>

                        <td className="p-4">
                          <button
                            onClick={() => copyToClipboard(invite.link_ativacao, invite.id)}
                            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-mono border transition-all ${
                              isCopied
                                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                                : 'bg-slate-900 border-slate-800 text-cyan-400 hover:border-cyan-500/40'
                            }`}
                          >
                            {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                            <span>{isCopied ? 'Link Copiado!' : 'Copiar Link de Convite'}</span>
                          </button>
                        </td>

                        <td className="p-4 font-mono text-[11px] text-slate-400">{invite.expira_em}</td>

                        <td className="p-4">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-300 border border-amber-500/30">
                            Pendente
                          </span>
                        </td>

                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleRevokeInvite(invite.id)}
                              className="p-1.5 rounded-lg bg-slate-900 border border-slate-700 text-rose-400 hover:bg-rose-500/20 hover:border-rose-500/40 transition-colors"
                              title="Revogar Convite"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0f172a] border border-slate-700/80 rounded-2xl p-6 w-full max-w-xl shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                  <UserPlus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Convidar Novo Usuário</h3>
                  <p className="text-[11px] text-slate-400">
                    Defina o workspace, o perfil de acesso e os módulos permitidos
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowInviteModal(false)}
                className="text-slate-400 hover:text-white text-sm p-1"
              >
                ✕
              </button>
            </div>

            {/* Success View */}
            {inviteSuccessData ? (
              <div className="space-y-4 py-2">
                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 space-y-2">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Convite gerado com sucesso!</span>
                  </div>
                  <p className="text-xs text-slate-300">
                    O convite para <b>{inviteSuccessData.name}</b> ({inviteSuccessData.email}) foi criado e já está pronto para ativação.
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-slate-300">
                    Link Exclusivo de Ativação do Usuário
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={inviteSuccessData.link}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-cyan-300 select-all focus:outline-none"
                    />
                    <button
                      onClick={() => copyToClipboard(inviteSuccessData.link, 'modal_link')}
                      className="px-4 py-2 rounded-xl text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 flex items-center gap-1.5 transition-colors whitespace-nowrap shadow-lg shadow-cyan-500/20"
                    >
                      {copiedId === 'modal_link' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      <span>{copiedId === 'modal_link' ? 'Copiado!' : 'Copiar'}</span>
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    💡 Você pode colar este link diretamente no grupo de WhatsApp do cliente ou enviar por e-mail.
                  </p>
                </div>

                <div className="flex justify-end pt-3 border-t border-slate-800">
                  <button
                    onClick={() => {
                      setInviteSuccessData(null);
                      setShowInviteModal(false);
                    }}
                    className="px-5 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-white transition-colors"
                  >
                    Concluir e Fechar
                  </button>
                </div>
              </div>
            ) : (
              /* Creation Form */
              <form onSubmit={handleCreateInvite} className="space-y-4 text-xs">
                {formFeedback && (
                  <div
                    className={`p-3 rounded-xl border flex items-center gap-2 ${
                      formFeedback.type === 'error'
                        ? 'bg-rose-500/10 text-rose-300 border-rose-500/30'
                        : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                    }`}
                  >
                    <AlertCircle className="w-4 h-4" />
                    <span>{formFeedback.text}</span>
                  </div>
                )}

                {/* Name & Email */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">Nome Completo *</label>
                    <input
                      type="text"
                      required
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      placeholder="ex: João Silva"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">E-mail de Acesso *</label>
                    <input
                      type="email"
                      required
                      value={formEmail}
                      onChange={(e) => setFormEmail(e.target.value)}
                      placeholder="ex: joao@cliente.com.br"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>

                {/* Role Selector */}
                <div>
                  <label className="block font-semibold text-slate-300 mb-1.5">Cargo / Tipo de Usuário *</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {(Object.keys(ROLE_CONFIG) as UserRole[]).map((r) => {
                      const isSelected = formRole === r;
                      return (
                        <div
                          key={r}
                          onClick={() => setFormRole(r)}
                          className={`p-2.5 rounded-xl border cursor-pointer transition-all ${
                            isSelected
                              ? 'bg-cyan-500/10 border-cyan-500/50 text-white shadow-sm'
                              : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-xs">{ROLE_CONFIG[r].label}</span>
                            {isSelected && <Check className="w-3.5 h-3.5 text-cyan-400" />}
                          </div>
                          <p className="text-[10px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                            {ROLE_CONFIG[r].desc}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Client Assignment (if client role) */}
                {isClientRole && (
                  <div className="p-3 bg-slate-950/80 rounded-xl border border-amber-500/30 space-y-1.5">
                    <label className="block font-bold text-amber-300">
                      🏢 Atribuir ao Cliente / Workspace:
                    </label>
                    <select
                      value={formClientId}
                      onChange={(e) => setFormClientId(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold text-white focus:outline-none focus:border-amber-500"
                    >
                      {clients.map((c) => (
                        <option key={c.cliente_id} value={c.cliente_id}>
                          {c.nome} ({c.cliente_id})
                        </option>
                      ))}
                    </select>
                    <p className="text-[10px] text-slate-400">
                      Este usuário terá acesso restrito exclusivamente a este cliente.
                    </p>
                  </div>
                )}

                {/* Modules Permission Checkboxes */}
                <div className="space-y-2">
                  <label className="block font-semibold text-slate-300">
                    Módulos Liberados para este Usuário:
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {ALL_MODULES.map((mod) => {
                      const isChecked = formModules.includes(mod.id);
                      return (
                        <button
                          type="button"
                          key={mod.id}
                          onClick={() => handleToggleModule(mod.id)}
                          className={`p-2 rounded-xl border text-left flex items-center gap-2 transition-all ${
                            isChecked
                              ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300'
                              : 'bg-slate-950/40 border-slate-800 text-slate-500 hover:border-slate-700'
                          }`}
                        >
                          <div
                            className={`w-3.5 h-3.5 rounded flex items-center justify-center border ${
                              isChecked ? 'bg-emerald-500 border-emerald-400 text-slate-950' : 'border-slate-700'
                            }`}
                          >
                            {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                          </div>
                          <span className="text-[11px] font-medium">{mod.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Modal Actions */}
                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowInviteModal(false)}
                    className="px-4 py-2 rounded-xl text-slate-400 hover:text-white transition-colors"
                  >
                    Cancelar
                  </button>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-lg shadow-cyan-500/20 flex items-center gap-2 transition-all"
                  >
                    {isSubmitting ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Send className="w-3.5 h-3.5" />
                    )}
                    <span>Gerar Convite de Acesso</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
