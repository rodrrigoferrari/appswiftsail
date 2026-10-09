'use client';

import React, { useState } from 'react';
import { useTenant } from '@/components/TenantProvider';
import {
  Users,
  UserPlus,
  Mail,
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
  ExternalLink,
  Send,
} from 'lucide-react';
import { UserRole, UserModulePermission } from '@/types/database';

const ROLE_CONFIG: Record<string, { label: string; badgeClass: string; desc: string }> = {
  master_admin: {
    label: '👑 Admin (Agência)',
    badgeClass: 'bg-[#EFF4FF] text-[#0050FF] border-[#BFDBFE]',
    desc: 'Acesso total irrestrito à Swiftsail, credenciais master e todas as contas',
  },
  cliente_admin: {
    label: '🏢 Cliente (Workspace)',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    desc: 'Gestor da empresa cliente com acesso ao seu próprio workspace',
  },
  cliente_membro: {
    label: '👤 Cliente (Membro de Equipe)',
    badgeClass: 'bg-slate-100 text-[#475569] border-[#E2E8F0]',
    desc: 'Equipe comercial ou operacional com acesso aos dados do cliente',
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
  const { clients, users, invites, refreshUsers, selectClientAndSwitchToWorkspace } = useTenant();

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
            Convide usuários e membros para cada cliente individual (com acesso isolado aos seus respectivos dashboards e permissões modulares).
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
          <span>Convidar Novo Membro</span>
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
          <p className="text-xs font-semibold text-[#64748B] uppercase tracking-wider">Administradores</p>
          <p className="text-2xl sm:text-3xl font-bold text-purple-600 mt-1">
            {users.filter((u) => !u.cliente_id || u.role === 'master_admin').length}
          </p>
          <p className="text-[11px] text-[#64748B] font-medium mt-0.5">Gestores com visão Admin</p>
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
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-[#94A3B8]" />
            <input
              type="text"
              placeholder="Buscar por nome, email ou empresa..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl pl-8 pr-3 py-1.5 text-xs text-[#0F172A] focus:outline-none focus:border-[#0050FF] focus:bg-white transition-colors"
            />
          </div>

          <select
            value={clientFilter}
            onChange={(e) => setClientFilter(e.target.value)}
            className="bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl px-2.5 py-1.5 text-xs font-medium text-[#0F172A] focus:outline-none focus:border-[#0050FF] cursor-pointer"
          >
            <option value="ALL">🏢 Todos os Clientes</option>
            <option value="AGENCY">👑 Apenas Admin (Agência)</option>
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
              className="bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl px-2.5 py-1.5 text-xs font-medium text-[#0F172A] focus:outline-none focus:border-[#0050FF] cursor-pointer"
            >
              <option value="ALL">Todas as Hierarquias</option>
              <option value="master_admin">Admin</option>
              <option value="cliente_admin">Cliente</option>
            </select>
          )}
        </div>
      </div>

      {/* Content Tab: Users Table */}
      {activeTab === 'users' && (
        <div className="bg-white border border-[#E2E8F0] rounded-2xl shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F8FAFC] text-[#64748B] font-bold uppercase tracking-wider text-[10px] border-b border-[#E2E8F0]">
                <tr>
                  <th className="p-4">Usuário</th>
                  <th className="p-4">Hierarquia</th>
                  <th className="p-4">Workspace / Cliente</th>
                  <th className="p-4">Módulos Liberados</th>
                  <th className="p-4">Último Acesso</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F5F9]">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-[#64748B]">
                      Nenhum usuário encontrado com os filtros selecionados.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => {
                    const roleInfo = ROLE_CONFIG[user.role] || {
                      label: user.role === 'master_admin' ? '👑 Admin' : '🏢 Cliente',
                      badgeClass: user.role === 'master_admin' ? 'bg-[#EFF4FF] text-[#0050FF] border-[#BFDBFE]' : 'bg-emerald-50 text-emerald-700 border-emerald-200',
                    };

                    return (
                      <tr key={user.id} className="hover:bg-[#F8FAFC] transition-colors">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-[#EFF4FF] border border-[#BFDBFE] flex items-center justify-center font-bold text-[#0050FF] text-xs">
                              {user.nome.substring(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-bold text-[#0F172A]">{user.nome}</p>
                              <p className="text-[11px] text-[#64748B] font-mono">{user.email}</p>
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
                            <Building className="w-3.5 h-3.5 text-[#64748B]" />
                            <span className="font-medium text-[#0F172A]">
                              {user.cliente_nome || 'Swiftsail HQ (Global)'}
                            </span>
                          </div>
                        </td>

                        <td className="p-4">
                          <div className="flex flex-wrap gap-1 max-w-xs">
                            {user.modulos.map((m) => (
                              <span
                                key={m}
                                className="px-2 py-0.5 rounded bg-[#F8FAFC] border border-[#E2E8F0] text-[10px] font-semibold text-[#475569] capitalize"
                              >
                                {m}
                              </span>
                            ))}
                          </div>
                        </td>

                        <td className="p-4 font-mono text-[11px] text-[#64748B]">
                          {user.ultimo_acesso || 'Nunca acessou'}
                        </td>

                        <td className="p-4">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[10px] font-bold border ${
                              user.status === 'ativo'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : 'bg-rose-50 text-rose-700 border-rose-200'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                user.status === 'ativo' ? 'bg-emerald-500' : 'bg-rose-500'
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
                                className="p-1.5 rounded-lg bg-white border border-[#E2E8F0] text-[#64748B] hover:text-[#0050FF] hover:border-[#BFDBFE] transition-colors cursor-pointer shadow-xs"
                                title="Acessar workspace deste cliente"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </button>
                            )}

                            <button
                              onClick={() => handleToggleUserStatus(user.id)}
                              className="p-1.5 rounded-lg bg-white border border-[#E2E8F0] text-[#64748B] hover:text-[#0F172A] transition-colors cursor-pointer shadow-xs"
                              title={user.status === 'ativo' ? 'Bloquear Usuário' : 'Ativar Usuário'}
                            >
                              {user.status === 'ativo' ? (
                                <Lock className="w-3.5 h-3.5 text-amber-500" />
                              ) : (
                                <Unlock className="w-3.5 h-3.5 text-emerald-600" />
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
        <div className="bg-white border border-[#E2E8F0] rounded-2xl shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F8FAFC] text-[#64748B] font-bold uppercase tracking-wider text-[10px] border-b border-[#E2E8F0]">
                <tr>
                  <th className="p-4">Convidado</th>
                  <th className="p-4">Hierarquia</th>
                  <th className="p-4">Empresa / Cliente</th>
                  <th className="p-4">Link de Ativação</th>
                  <th className="p-4">Expira em</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F5F9]">
                {filteredInvites.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-[#64748B]">
                      Nenhum convite pendente. Clique em &quot;Convidar Novo Membro&quot; para enviar novos acessos.
                    </td>
                  </tr>
                ) : (
                  filteredInvites.map((invite) => {
                    const isCopied = copiedId === invite.id;
                    const roleInfo = ROLE_CONFIG[invite.role] || {
                      label: invite.role === 'master_admin' ? '👑 Admin' : '🏢 Cliente',
                      badgeClass: invite.role === 'master_admin' ? 'bg-[#EFF4FF] text-[#0050FF] border-[#BFDBFE]' : 'bg-emerald-50 text-emerald-700 border-emerald-200',
                    };

                    return (
                      <tr key={invite.id} className="hover:bg-[#F8FAFC] transition-colors">
                        <td className="p-4">
                          <div>
                            <p className="font-bold text-[#0F172A]">{invite.nome}</p>
                            <p className="text-[11px] text-[#64748B] font-mono">{invite.email}</p>
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
                          <span className="font-medium text-[#0F172A]">
                            {invite.cliente_nome || 'Swiftsail HQ'}
                          </span>
                        </td>

                        <td className="p-4">
                          <button
                            onClick={() => copyToClipboard(invite.link_ativacao, invite.id)}
                            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-mono border transition-all cursor-pointer ${
                              isCopied
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                                : 'bg-[#F8FAFC] border-[#CBD5E1] text-[#0050FF] hover:bg-white'
                            }`}
                          >
                            {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                            <span>{isCopied ? 'Link Copiado!' : 'Copiar Link'}</span>
                          </button>
                        </td>

                        <td className="p-4 font-mono text-[11px] text-[#64748B]">{invite.expira_em}</td>

                        <td className="p-4">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            Pendente
                          </span>
                        </td>

                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleRevokeInvite(invite.id)}
                              className="p-1.5 rounded-lg bg-white border border-[#E2E8F0] text-rose-500 hover:bg-rose-50 transition-colors cursor-pointer shadow-xs"
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
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 w-full max-w-xl shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#EFF4FF] border border-[#BFDBFE] flex items-center justify-center text-[#0050FF]">
                  <UserPlus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#0F172A]">Convidar Novo Membro</h3>
                  <p className="text-[11px] text-[#64748B]">
                    Defina o workspace, o perfil de acesso e os módulos permitidos
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowInviteModal(false)}
                className="text-[#94A3B8] hover:text-[#0F172A] text-sm p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Success View */}
            {inviteSuccessData ? (
              <div className="space-y-4 py-2">
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 space-y-2">
                  <div className="flex items-center gap-2 text-emerald-700 font-bold text-xs">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Convite gerado com sucesso!</span>
                  </div>
                  <p className="text-xs text-[#0F172A]">
                    O convite para <b>{inviteSuccessData.name}</b> ({inviteSuccessData.email}) foi criado e já está pronto para ativação.
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-[#475569]">
                    Link Exclusivo de Ativação do Usuário
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={inviteSuccessData.link}
                      className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl px-3 py-2 text-xs font-mono text-[#0050FF] select-all focus:outline-none"
                    />
                    <button
                      onClick={() => copyToClipboard(inviteSuccessData.link, 'modal_link')}
                      className="px-4 py-2 rounded-xl text-xs font-bold bg-[#0050FF] hover:bg-[#0040D6] text-white flex items-center gap-1.5 transition-colors whitespace-nowrap shadow-xs cursor-pointer"
                    >
                      {copiedId === 'modal_link' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      <span>{copiedId === 'modal_link' ? 'Copiado!' : 'Copiar'}</span>
                    </button>
                  </div>
                  <p className="text-[11px] text-[#64748B]">
                    💡 Você pode colar este link diretamente no grupo de WhatsApp do cliente ou enviar por e-mail.
                  </p>
                </div>

                <div className="flex justify-end pt-3 border-t border-[#F1F5F9]">
                  <button
                    onClick={() => {
                      setInviteSuccessData(null);
                      setShowInviteModal(false);
                    }}
                    className="px-5 py-2 rounded-xl text-xs font-bold bg-[#0050FF] text-white hover:bg-[#0040D6] transition-colors cursor-pointer"
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
                        ? 'bg-rose-50 text-rose-700 border-rose-200'
                        : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    }`}
                  >
                    <AlertCircle className="w-4 h-4" />
                    <span>{formFeedback.text}</span>
                  </div>
                )}

                {/* Name & Email */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-[#475569] mb-1">Nome Completo *</label>
                    <input
                      type="text"
                      required
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      placeholder="ex: João Silva"
                      className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl px-3 py-2 text-[#0F172A] focus:outline-none focus:border-[#0050FF] focus:bg-white transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-[#475569] mb-1">E-mail de Acesso *</label>
                    <input
                      type="email"
                      required
                      value={formEmail}
                      onChange={(e) => setFormEmail(e.target.value)}
                      placeholder="ex: joao@cliente.com.br"
                      className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl px-3 py-2 text-[#0F172A] focus:outline-none focus:border-[#0050FF] focus:bg-white transition-colors"
                    />
                  </div>
                </div>

                {/* Role Selector: Apenas Admin e Cliente conforme Seção 2 */}
                <div>
                  <label className="block font-semibold text-[#475569] mb-1.5">Hierarquia de Acesso *</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {(Object.keys(ROLE_CONFIG) as UserRole[]).map((r) => {
                      const isSelected = formRole === r;
                      return (
                        <div
                          key={r}
                          onClick={() => setFormRole(r)}
                          className={`p-2.5 rounded-xl border cursor-pointer transition-all ${
                            isSelected
                              ? 'bg-[#EFF4FF] border-[#0050FF] text-[#0050FF] shadow-xs'
                              : 'bg-[#F8FAFC] border-[#E2E8F0] text-[#475569] hover:border-[#CBD5E1]'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-xs">{ROLE_CONFIG[r].label}</span>
                            {isSelected && <Check className="w-3.5 h-3.5 text-[#0050FF]" />}
                          </div>
                          <p className="text-[10px] text-[#64748B] mt-1 line-clamp-2 leading-relaxed">
                            {ROLE_CONFIG[r].desc}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Client Assignment (if client role) */}
                {isClientRole && (
                  <div className="p-3 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0] space-y-1.5">
                    <label className="block font-bold text-[#0F172A]">
                      🏢 Atribuir ao Workspace do Cliente:
                    </label>
                    <select
                      value={formClientId}
                      onChange={(e) => setFormClientId(e.target.value)}
                      className="w-full bg-white border border-[#CBD5E1] rounded-xl px-3 py-2 text-xs font-semibold text-[#0F172A] focus:outline-none focus:border-[#0050FF] cursor-pointer shadow-xs"
                    >
                      {clients.map((c) => (
                        <option key={c.cliente_id} value={c.cliente_id}>
                          {c.nome} ({c.cliente_id})
                        </option>
                      ))}
                    </select>
                    <p className="text-[10px] text-[#64748B]">
                      Este usuário terá acesso restrito exclusivamente aos dados deste cliente.
                    </p>
                  </div>
                )}

                {/* Modules Permission Checkboxes */}
                <div className="space-y-2">
                  <label className="block font-semibold text-[#475569]">
                    Módulos Liberados para este Membro:
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {ALL_MODULES.map((mod) => {
                      const isChecked = formModules.includes(mod.id);
                      return (
                        <button
                          type="button"
                          key={mod.id}
                          onClick={() => handleToggleModule(mod.id)}
                          className={`p-2 rounded-xl border text-left flex items-center gap-2 transition-all cursor-pointer ${
                            isChecked
                              ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                              : 'bg-[#F8FAFC] border-[#E2E8F0] text-[#64748B] hover:border-[#CBD5E1]'
                          }`}
                        >
                          <div
                            className={`w-3.5 h-3.5 rounded flex items-center justify-center border ${
                              isChecked ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-[#CBD5E1] bg-white'
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
                <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#F1F5F9]">
                  <button
                    type="button"
                    onClick={() => setShowInviteModal(false)}
                    className="px-4 py-2 rounded-xl text-[#64748B] hover:text-[#0F172A] transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2.5 rounded-xl text-xs font-bold bg-[#0050FF] hover:bg-[#0040D6] text-white shadow-xs flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
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
