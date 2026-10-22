'use client';

import React, { useState, useEffect, useMemo } from 'react';
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
  MessageSquare,
  Phone,
  Pencil,
  Clock,
  Calendar,
} from 'lucide-react';
import { UserRole, UserModulePermission, AppUser, UserInvite } from '@/types/database';

const ROLE_CONFIG: Record<string, { label: string; badgeClass: string; desc: string }> = {
  master_admin: {
    label: '👑 Admin (Agência)',
    badgeClass: 'bg-[#EFF4FF] text-[#0050FF] border-[#BFDBFE]',
    desc: 'Acesso total irrestrito à Swiftsail, credenciais master e todas as contas',
  },
  cliente_admin: {
    label: '🏢 Cliente (Workspace)',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    desc: 'Gestor da empresa cliente com acesso aos workspaces atribuídos',
  },
};

const ALL_MODULES: { id: UserModulePermission; label: string; icon: string }[] = [
  { id: 'midia', label: 'Tráfego & Anúncios', icon: 'Megaphone' },
  { id: 'whatsapp', label: 'Hub WhatsApp & Uazapi', icon: 'MessageSquare' },
  { id: 'crm', label: 'Pipeline CRM (Kommo)', icon: 'KanbanSquare' },
  { id: 'criativos', label: 'Criativos & Landing Pages', icon: 'Sparkles' },
  { id: 'financeiro', label: 'Financeiro (Asaas)', icon: 'CreditCard' },
];

function formatUltimoAcesso(ultimoAcesso?: string | null): React.ReactNode {
  if (
    !ultimoAcesso ||
    ultimoAcesso === 'Nunca acessou' ||
    ultimoAcesso === 'Sincronizado' ||
    ultimoAcesso.toLowerCase() === 'ainda não acessou'
  ) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium text-[#B45309] bg-[#FEF3C7] border border-[#FDE68A]">
        <Clock className="w-3 h-3 text-[#D97706]" />
        <span>ainda não acessou</span>
      </span>
    );
  }

  if (ultimoAcesso === 'Ativo agora') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
        <span>Ativo agora</span>
      </span>
    );
  }

  try {
    const date = new Date(ultimoAcesso);
    if (!isNaN(date.getTime())) {
      const dataFormatada = date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        timeZone: 'America/Sao_Paulo',
      });
      const horaFormatada = date.toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'America/Sao_Paulo',
      });

      return (
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-[#0F172A]">
            <Calendar className="w-3 h-3 text-[#64748B]" />
            <span>{dataFormatada}</span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-[#64748B]">
            <Clock className="w-3 h-3 text-[#94A3B8]" />
            <span>às {horaFormatada}</span>
          </div>
        </div>
      );
    }
  } catch {}

  return <span className="text-xs text-[#64748B]">{ultimoAcesso}</span>;
}

export default function AdminUsuariosPage() {
  const {
    clients,
    users,
    setUsers,
    invites,
    setInvites,
    refreshUsers,
    selectClientAndSwitchToWorkspace,
    activeClient,
    viewMode,
    isMasterAdmin,
    currentUser,
  } = useTenant();

  // Detecta se está na visão de cliente ou perfil com workspace restrito
  const isClientView = !isMasterAdmin || (viewMode === 'client' && Boolean(activeClient));
  const effectiveClientId = !isMasterAdmin
    ? (currentUser?.cliente_id || (activeClient ? activeClient.cliente_id : ''))
    : (activeClient ? activeClient.cliente_id : '');

  const [activeTab, setActiveTab] = useState<'users' | 'invites'>('users');
  const [searchTerm, setSearchTerm] = useState('');
  const [clientFilter, setClientFilter] = useState('ALL');
  const [roleFilter, setRoleFilter] = useState('ALL');

  // Hidrata a aba ativa com base na URL ou localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      const tabParam = url.searchParams.get('tab');
      if (tabParam === 'invites' || tabParam === 'users') {
        setActiveTab(tabParam);
      } else {
        try {
          const saved = localStorage.getItem('swiftsail_usuarios_tab');
          if (saved === 'invites' || saved === 'users') {
            setActiveTab(saved);
          }
        } catch {}
      }
    }
  }, []);

  // Mantém a aba ativa sincronizada na URL e no localStorage ao alternar
  useEffect(() => {
    if (typeof window !== 'undefined' && activeTab) {
      try {
        const url = new URL(window.location.href);
        if (url.searchParams.get('tab') !== activeTab) {
          url.searchParams.set('tab', activeTab);
          window.history.replaceState(null, '', url.toString());
        }
        localStorage.setItem('swiftsail_usuarios_tab', activeTab);
      } catch {}
    }
  }, [activeTab]);

  // Ao montar ou alternar filtros/visão, sincroniza usuários do backend
  useEffect(() => {
    if (isClientView && effectiveClientId) {
      setClientFilter(effectiveClientId);
      refreshUsers(effectiveClientId);
    } else {
      refreshUsers('ALL');
    }
  }, [isClientView, effectiveClientId]);

  // Modal State
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [inviteSuccessData, setInviteSuccessData] = useState<{
    link: string;
    name: string;
    whatsapp?: string;
    email?: string;
    whatsappMessage?: string;
    clientNames?: string;
  } | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // New Invite Form State: Nome e WhatsApp obrigatórios
  const [formName, setFormName] = useState('');
  const [formWhatsapp, setFormWhatsapp] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formRole, setFormRole] = useState<UserRole>('cliente_admin');
  const [formSelectedClientIds, setFormSelectedClientIds] = useState<string[]>([]);
  const [formModules, setFormModules] = useState<UserModulePermission[]>([
    'midia',
    'whatsapp',
    'crm',
    'criativos',
    'financeiro',
  ]);
  const [formFeedback, setFormFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Edit Member Modal State
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editWhatsapp, setEditWhatsapp] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editRole, setEditRole] = useState<UserRole>('cliente_admin');
  const [editSelectedClientIds, setEditSelectedClientIds] = useState<string[]>([]);
  const [editModules, setEditModules] = useState<UserModulePermission[]>([]);
  const [editStatus, setEditStatus] = useState<'ativo' | 'bloqueado'>('ativo');
  const [isEditingSaving, setIsEditingSaving] = useState(false);
  const [editFeedback, setEditFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Delete User Confirmation State
  const [userToDelete, setUserToDelete] = useState<AppUser | null>(null);
  const [isDeletingUser, setIsDeletingUser] = useState(false);
  const [deleteFeedback, setDeleteFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleOpenEditModal = (user: any) => {
    setEditingUserId(user.id);
    setEditName(user.nome || '');
    setEditWhatsapp(user.whatsapp || '');
    setEditEmail(user.email || '');
    setEditRole(user.role || 'cliente_admin');
    const cIds =
      user.cliente_ids && Array.isArray(user.cliente_ids) && user.cliente_ids.length > 0
        ? user.cliente_ids
        : user.cliente_id
        ? [user.cliente_id]
        : [];
    setEditSelectedClientIds(cIds);
    setEditModules(user.modulos || ['midia', 'whatsapp', 'crm', 'criativos', 'financeiro']);
    setEditStatus(user.status || 'ativo');
    setEditFeedback(null);
    setShowEditModal(true);
  };

  const handleToggleEditClient = (clientId: string) => {
    if (editSelectedClientIds.includes(clientId)) {
      if (editSelectedClientIds.length === 1) {
        alert('Selecione pelo menos 1 empresa.');
        return;
      }
      setEditSelectedClientIds(editSelectedClientIds.filter((id) => id !== clientId));
    } else {
      setEditSelectedClientIds([...editSelectedClientIds, clientId]);
    }
  };

  const handleToggleEditModule = (mod: UserModulePermission) => {
    if (editModules.includes(mod)) {
      setEditModules(editModules.filter((m) => m !== mod));
    } else {
      setEditModules([...editModules, mod]);
    }
  };

  const handleSaveUserEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUserId) return;
    if (!editName.trim() || !editWhatsapp.trim()) {
      setEditFeedback({ type: 'error', text: 'Preencha o Nome Completo e o WhatsApp.' });
      return;
    }
    setIsEditingSaving(true);
    setEditFeedback(null);

    const selectedClientsList = clients.filter((c) => editSelectedClientIds.includes(c.cliente_id));
    const selectedNames = selectedClientsList.map((c) => c.nome).join(', ');

    try {
      const res = await fetch('/api/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'edit_profile',
          userId: editingUserId,
          nome: editName.trim(),
          whatsapp: editWhatsapp.trim(),
          email: editEmail.trim(),
          role: editRole,
          cliente_id: editRole === 'master_admin' ? 'AGENCY' : editSelectedClientIds[0] || 'AGENCY',
          cliente_ids: editRole === 'master_admin' ? [] : editSelectedClientIds,
          cliente_nome: editRole === 'master_admin' ? 'Swiftsail HQ' : selectedNames,
          modulos: editModules,
          status: editStatus,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Erro ao atualizar dados do membro');
      }

      setEditFeedback({ type: 'success', text: 'Cadastro atualizado com sucesso!' });
      refreshUsers();
      setTimeout(() => {
        setShowEditModal(false);
      }, 1000);
    } catch (err: any) {
      setEditFeedback({ type: 'error', text: err.message || 'Erro inesperado ao salvar.' });
    } finally {
      setIsEditingSaving(false);
    }
  };

  // Sincroniza clientes selecionados ao abrir o modal
  useEffect(() => {
    if (showInviteModal) {
      if (isClientView && activeClient) {
        setFormSelectedClientIds([activeClient.cliente_id]);
        setFormRole('cliente_admin');
      } else if (clients.length > 0 && formSelectedClientIds.length === 0) {
        setFormSelectedClientIds([clients[0].cliente_id]);
      }
    }
  }, [showInviteModal, isClientView, activeClient]);

  const handleToggleClientSelection = (clientId: string) => {
    // Se estiver na view do cliente, não permite alterar
    if (isClientView) return;

    if (formSelectedClientIds.includes(clientId)) {
      if (formSelectedClientIds.length === 1) {
        alert('Selecione pelo menos 1 empresa para o convite de cliente.');
        return;
      }
      setFormSelectedClientIds(formSelectedClientIds.filter((id) => id !== clientId));
    } else {
      setFormSelectedClientIds([...formSelectedClientIds, clientId]);
    }
  };

  const handleSelectAllClients = () => {
    if (isClientView) return;
    setFormSelectedClientIds(clients.map((c) => c.cliente_id));
  };

  const handleDeselectAllClients = () => {
    if (isClientView) return;
    if (clients.length > 0) {
      setFormSelectedClientIds([clients[0].cliente_id]);
    }
  };

  const handleToggleModule = (mod: UserModulePermission) => {
    if (formModules.includes(mod)) {
      setFormModules(formModules.filter((m) => m !== mod));
    } else {
      setFormModules([...formModules, mod]);
    }
  };

  const handleCreateInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formWhatsapp.trim()) {
      setFormFeedback({ type: 'error', text: 'Preencha o Nome Completo e o WhatsApp do membro.' });
      return;
    }

    if (formRole === 'cliente_admin' && formSelectedClientIds.length === 0) {
      setFormFeedback({ type: 'error', text: 'Selecione ao menos uma empresa para este convite.' });
      return;
    }

    setIsSubmitting(true);
    setFormFeedback(null);

    const selectedClientsList = clients.filter((c) => formSelectedClientIds.includes(c.cliente_id));
    const selectedNames = selectedClientsList.map((c) => c.nome);

    try {
      const res = await fetch('/api/users/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: formName.trim(),
          whatsapp: formWhatsapp.trim(),
          email: formEmail.trim() || undefined,
          role: formRole,
          cliente_id: formRole === 'master_admin' ? 'AGENCY' : formSelectedClientIds[0] || 'AGENCY',
          cliente_ids: formRole === 'master_admin' ? [] : formSelectedClientIds,
          cliente_nome: formRole === 'master_admin' ? 'Swiftsail HQ' : selectedNames.join(', '),
          cliente_nomes: selectedNames,
          modulos: formModules,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setInviteSuccessData({
          link: data.link_ativacao,
          name: formName.trim(),
          whatsapp: data.clean_whatsapp || formWhatsapp.trim(),
          email: formEmail.trim() || undefined,
          whatsappMessage: data.whatsapp_message,
          clientNames: selectedNames.join(', '),
        });
        setActiveTab('users');
        await refreshUsers();
        // Reset inputs
        setFormName('');
        setFormWhatsapp('');
        setFormEmail('');
      } else {
        setFormFeedback({ type: 'error', text: data.error || 'Erro ao efetivar cadastro.' });
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
      // Remove da interface imediatamente para resposta instantânea ao clique
      setInvites((prev) => prev.filter((i) => i.id !== inviteId && i.token !== inviteId));
      const res = await fetch(`/api/users?id=${encodeURIComponent(inviteId)}&type=invite`, {
        method: 'DELETE',
      });
      await refreshUsers();
    } catch (err) {
      console.error('Failed to revoke invite:', err);
    }
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    setIsDeletingUser(true);
    setDeleteFeedback(null);
    try {
      const res = await fetch(`/api/users?id=${encodeURIComponent(userToDelete.id)}&type=user`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Erro ao remover usuário');
      }
      await refreshUsers();
      setUserToDelete(null);
      if (showEditModal && editingUserId === userToDelete.id) {
        setShowEditModal(false);
      }
    } catch (err: any) {
      console.error('Failed to delete user:', err);
      setDeleteFeedback({ type: 'error', text: err.message || 'Erro ao remover usuário' });
    } finally {
      setIsDeletingUser(false);
    }
  };

  // Usuários e convites isolados do workspace
  const workspaceUsers = useMemo(() => {
    if (!isClientView) return users;
    return users.filter((u: AppUser) => {
      // Bloqueia qualquer gestor master ou equipe da agência
      if (
        u.role === 'master_admin' ||
        u.whatsapp === '41992332996' ||
        u.whatsapp === '5541992332996' ||
        u.email === 'rodrigo@swiftsail.co'
      ) {
        return false;
      }
      if (!effectiveClientId) return true;
      return (
        u.cliente_id === effectiveClientId ||
        (Array.isArray(u.cliente_ids) && u.cliente_ids.includes(effectiveClientId))
      );
    });
  }, [users, isClientView, effectiveClientId]);

  const workspaceInvites = useMemo(() => {
    if (!isClientView) return invites;
    return invites.filter((i: UserInvite) => {
      if (i.role === 'master_admin') return false;
      if (!effectiveClientId) return true;
      return (
        i.cliente_id === effectiveClientId ||
        (Array.isArray(i.cliente_ids) && i.cliente_ids.includes(effectiveClientId))
      );
    });
  }, [invites, isClientView, effectiveClientId]);

  // Filtered lists
  const filteredUsers = workspaceUsers.filter((u: AppUser) => {
    const matchesSearch =
      u.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.whatsapp && u.whatsapp.includes(searchTerm)) ||
      (u.cliente_nome && u.cliente_nome.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesClient =
      isClientView
        ? true
        : clientFilter === 'ALL' ||
          u.cliente_id === clientFilter ||
          (u.cliente_ids && u.cliente_ids.includes(clientFilter)) ||
          (clientFilter === 'AGENCY' && !u.cliente_id);

    const matchesRole = isClientView || roleFilter === 'ALL' || u.role === roleFilter;
    return matchesSearch && matchesClient && matchesRole;
  });

  const filteredInvites = workspaceInvites.filter((i: UserInvite) => {
    const matchesSearch =
      i.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      i.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (i.whatsapp && i.whatsapp.includes(searchTerm));

    const matchesClient =
      isClientView
        ? true
        : clientFilter === 'ALL' ||
          i.cliente_id === clientFilter ||
          (i.cliente_ids && i.cliente_ids.includes(clientFilter)) ||
          (clientFilter === 'AGENCY' && !i.cliente_id);

    return matchesSearch && matchesClient;
  });

  return (
    <div className="space-y-6 font-sans select-none">
      {/* Top Banner (Estilo Asaas) */}
      <div className="bg-white border border-[#E2E8F0] p-6 rounded-2xl shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-[#EFF4FF] text-[#0050FF] border border-[#BFDBFE] uppercase tracking-wider">
              {isClientView ? `Workspace • ${activeClient?.nome || 'Cliente'}` : 'Governança & Controle de Acessos'}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#0F172A] flex items-center gap-2.5">
            <Users className="w-6 h-6 text-[#0050FF]" />
            {isClientView
              ? `Gestão de Usuários & Convites • ${activeClient?.nome || 'Workspace'}`
              : 'Gestão de Usuários & Convites dos Clientes'}
          </h1>
          <p className="text-xs text-[#64748B] max-w-2xl leading-relaxed">
            {isClientView
              ? `Gerencie os usuários e convites com acesso aos dashboards e ferramentas do workspace ${activeClient?.nome || 'atribuído'}.`
              : 'Convide usuários e membros para cada cliente individual (com acesso isolado aos seus respectivos dashboards e permissões modulares).'}
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
          <p className="text-2xl sm:text-3xl font-bold text-[#0F172A] mt-1">{workspaceUsers.length}</p>
          <p className="text-[11px] text-emerald-600 font-medium mt-0.5">
            {isClientView ? 'Cadastrados no workspace' : 'Ativos na plataforma'}
          </p>
        </div>

        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-xs">
          <p className="text-xs font-semibold text-[#64748B] uppercase tracking-wider">Convites Pendentes</p>
          <p className="text-2xl sm:text-3xl font-bold text-amber-600 mt-1">{workspaceInvites.length}</p>
          <p className="text-[11px] text-[#64748B] font-medium mt-0.5">Aguardando ativação</p>
        </div>

        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-xs">
          <p className="text-xs font-semibold text-[#64748B] uppercase tracking-wider">
            {isClientView ? 'Usuários Ativos' : 'Usuários de Clientes'}
          </p>
          <p className="text-2xl sm:text-3xl font-bold text-[#0050FF] mt-1">
            {isClientView
              ? workspaceUsers.filter((u: AppUser) => u.status === 'ativo').length
              : users.filter((u: AppUser) => !!u.cliente_id).length}
          </p>
          <p className="text-[11px] text-[#64748B] font-medium mt-0.5">
            {isClientView ? 'Com acesso liberado' : 'Isolados por workspace'}
          </p>
        </div>

        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-xs">
          <p className="text-xs font-semibold text-[#64748B] uppercase tracking-wider">
            {isClientView ? 'Gestores do Workspace' : 'Administradores'}
          </p>
          <p className="text-2xl sm:text-3xl font-bold text-purple-600 mt-1">
            {isClientView
              ? workspaceUsers.filter((u: AppUser) => u.role === 'cliente_admin').length
              : users.filter((u: AppUser) => !u.cliente_id || u.role === 'master_admin').length}
          </p>
          <p className="text-[11px] text-[#64748B] font-medium mt-0.5">
            {isClientView ? 'Membros com papel gestor' : 'Gestores com visão Admin'}
          </p>
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

          {isClientView ? (
            <div className="bg-[#EFF4FF] border border-[#BFDBFE] text-[#0050FF] rounded-xl px-3 py-1.5 text-xs font-semibold flex items-center gap-1.5 shadow-2xs">
              <Building className="w-3.5 h-3.5" />
              <span>{activeClient?.nome || 'Workspace Atribuído'}</span>
            </div>
          ) : (
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
          )}

          {!isClientView && activeTab === 'users' && (
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
            <table className="w-full text-left text-xs min-w-[720px]">
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
                  filteredUsers.map((user: AppUser) => {
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
                              <div className="flex items-center gap-2 flex-wrap">
                                {user.whatsapp && (
                                  <span className="text-[11px] text-emerald-700 font-mono font-semibold flex items-center gap-1">
                                    <Phone className="w-3 h-3 text-emerald-600" />
                                    {user.whatsapp}
                                  </span>
                                )}
                                {user.email && (
                                  <span className="text-[11px] text-[#64748B] font-mono">{user.email}</span>
                                )}
                              </div>
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
                            {user.modulos.map((m: UserModulePermission) => (
                              <span
                                key={m}
                                className="px-2 py-0.5 rounded bg-[#F8FAFC] border border-[#E2E8F0] text-[10px] font-semibold text-[#475569] capitalize"
                              >
                                {m}
                              </span>
                            ))}
                          </div>
                        </td>

                        <td className="p-4">
                          {formatUltimoAcesso(user.ultimo_acesso)}
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
                            {!isClientView && user.cliente_id && (
                              <button
                                onClick={() => selectClientAndSwitchToWorkspace(user.cliente_id!)}
                                className="p-1.5 rounded-lg bg-white border border-[#E2E8F0] text-[#64748B] hover:text-[#0050FF] hover:border-[#BFDBFE] transition-colors cursor-pointer shadow-xs"
                                title="Acessar workspace deste cliente"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </button>
                            )}

                            {/* Botão Editar Cadastro */}
                            <button
                              onClick={() => handleOpenEditModal(user)}
                              className="p-1.5 rounded-lg bg-white border border-[#CBD5E1] text-[#0050FF] hover:bg-[#EFF4FF] hover:border-[#BFDBFE] transition-colors cursor-pointer shadow-xs"
                              title="Editar Cadastro do Membro"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>

                            {user.role !== 'master_admin' ? (
                              <>
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

                                <button
                                  onClick={() => {
                                    setDeleteFeedback(null);
                                    setUserToDelete(user);
                                  }}
                                  className="p-1.5 rounded-lg bg-white border border-[#E2E8F0] text-rose-500 hover:bg-rose-50 hover:border-rose-200 transition-colors cursor-pointer shadow-xs"
                                  title="Excluir Usuário"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </>
                            ) : (
                              isMasterAdmin && (
                                <span className="p-1.5 text-[10px] font-bold text-[#0050FF] bg-[#EFF4FF] border border-[#BFDBFE] rounded-lg">
                                  Master
                                </span>
                              )
                            )}
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
            <table className="w-full text-left text-xs min-w-[720px]">
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
                  filteredInvites.map((invite: UserInvite) => {
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
                            <div className="flex items-center gap-2 flex-wrap">
                              {invite.whatsapp && (
                                <span className="text-[11px] text-emerald-700 font-mono font-semibold flex items-center gap-1">
                                  <Phone className="w-3 h-3 text-emerald-600" />
                                  {invite.whatsapp}
                                </span>
                              )}
                              {invite.email && (
                                <span className="text-[11px] text-[#64748B] font-mono">{invite.email}</span>
                              )}
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
                          <span className="font-medium text-[#0F172A]">
                            {invite.cliente_nome || 'Swiftsail HQ'}
                          </span>
                        </td>

                        <td className="p-4">
                          <div className="flex items-center gap-2">
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

                            {invite.whatsapp && (
                              <a
                                href={`https://wa.me/55${invite.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(
                                  `🚀 *Olá, ${invite.nome}! Seja bem-vindo(a) à plataforma SWIFTSAIL.*\n\nSeu acesso ao workspace *${invite.cliente_nome || 'Swiftsail'}* foi liberado!\n\n📊 *O que é a plataforma:*\nÉ o seu portal exclusivo para acompanhar em tempo real o desempenho de anúncios (Meta & Google Ads), CRM de leads, criativos, relatórios e métricas de crescimento do seu negócio.\n\n🔐 *Como fazer para acessar (100% sem senha):*\n1️⃣ Abra seu link exclusivo de acesso:\n👉 ${invite.link_ativacao}\n\n2️⃣ Seu WhatsApp já estará pré-preenchido. Clique no botão *"Receber Código no WhatsApp"*.\n\n3️⃣ Você receberá uma mensagem com o código de 6 dígitos e um botão *"Copiar Código"*.\n\n4️⃣ Cole o código na tela para entrar diretamente na plataforma.\n\nQualquer dúvida, estamos à disposição!`
                                )}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100 transition-colors cursor-pointer shadow-xs"
                                title="Enviar convite pelo WhatsApp"
                              >
                                <MessageSquare className="w-3.5 h-3.5" />
                              </a>
                            )}
                          </div>
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
                  <h3 className="text-sm font-bold text-[#0F172A]">Efetivar Membro & Gerar Convite</h3>
                  <p className="text-[11px] text-[#64748B]">
                    Efetiva o usuário diretamente como membro ativo e prepara o convite de WhatsApp
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
                    <span>Cadastro efetivado e mensagem de convite pronta!</span>
                  </div>
                  <p className="text-xs text-[#0F172A]">
                    O usuário <b>{inviteSuccessData.name}</b> foi cadastrado como membro ativo com acesso liberado a: <b>{inviteSuccessData.clientNames || 'Swiftsail HQ'}</b>.
                  </p>
                  {inviteSuccessData.whatsapp && (
                    <p className="text-[11px] text-emerald-800 font-mono">
                      WhatsApp: {inviteSuccessData.whatsapp}
                    </p>
                  )}
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
                      className="px-4 py-2 rounded-xl text-xs font-bold bg-[#EFF4FF] hover:bg-[#E0EAFF] text-[#0050FF] border border-[#BFDBFE] flex items-center gap-1.5 transition-colors whitespace-nowrap shadow-xs cursor-pointer"
                    >
                      {copiedId === 'modal_link' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      <span>{copiedId === 'modal_link' ? 'Copiado!' : 'Copiar Link'}</span>
                    </button>
                  </div>
                </div>

                {/* Disparo Direto pelo WhatsApp */}
                <div className="p-3.5 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0] space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#0F172A] flex items-center gap-1.5">
                      <MessageSquare className="w-4 h-4 text-emerald-600" />
                      Disparo Imediato via WhatsApp
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        if (inviteSuccessData.whatsappMessage) {
                          copyToClipboard(inviteSuccessData.whatsappMessage, 'modal_msg');
                        }
                      }}
                      className="text-[11px] font-bold text-[#0050FF] hover:underline cursor-pointer flex items-center gap-1"
                    >
                      <Copy className="w-3 h-3" />
                      <span>{copiedId === 'modal_msg' ? 'Mensagem Copiada!' : 'Copiar Mensagem'}</span>
                    </button>
                  </div>

                  <p className="text-[11px] text-[#475569] font-mono bg-white p-2.5 rounded-lg border border-[#E2E8F0] leading-relaxed">
                    {inviteSuccessData.whatsappMessage}
                  </p>

                  <a
                    href={`https://api.whatsapp.com/send?phone=${inviteSuccessData.whatsapp}&text=${encodeURIComponent(
                      inviteSuccessData.whatsappMessage || inviteSuccessData.link
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2.5 px-3 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>Enviar Convite pelo WhatsApp Agora</span>
                  </a>
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

                {/* Name & WhatsApp */}
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
                    <label className="block font-semibold text-[#475569] mb-1 flex items-center gap-1">
                      <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Número de WhatsApp *</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formWhatsapp}
                      onChange={(e) => setFormWhatsapp(e.target.value)}
                      placeholder="ex: 5511999998888"
                      className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl px-3 py-2 text-[#0F172A] font-mono focus:outline-none focus:border-[#0050FF] focus:bg-white transition-colors"
                    />
                  </div>
                </div>

                {/* Email Opcional */}
                <div>
                  <label className="block font-semibold text-[#475569] mb-1">
                    E-mail (Opcional)
                  </label>
                  <input
                    type="email"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    placeholder="ex: joao@cliente.com.br"
                    className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl px-3 py-2 text-[#0F172A] focus:outline-none focus:border-[#0050FF] focus:bg-white transition-colors"
                  />
                </div>

                {/* Role Selector: Apenas 2 Hierarquias (Admin Agência e Cliente Workspace) */}
                <div>
                  <label className="block font-semibold text-[#475569] mb-1.5">Hierarquia de Acesso *</label>
                  {isClientView ? (
                    <div className="p-3 bg-[#EFF4FF] border border-[#BFDBFE] rounded-xl flex items-center justify-between shadow-2xs">
                      <div>
                        <span className="font-bold text-xs text-[#0050FF]">🏢 Membro do Workspace ({activeClient?.nome || 'Cliente'})</span>
                        <p className="text-[10px] text-[#64748B] mt-0.5">
                          Acesso isolado aos módulos e dados deste workspace atribuído.
                        </p>
                      </div>
                      <Check className="w-4 h-4 text-[#0050FF]" />
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {(['master_admin', 'cliente_admin'] as UserRole[]).map((r) => {
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
                              <span className="font-bold text-xs">{ROLE_CONFIG[r]?.label}</span>
                              {isSelected && <Check className="w-3.5 h-3.5 text-[#0050FF]" />}
                            </div>
                            <p className="text-[10px] text-[#64748B] mt-1 line-clamp-2 leading-relaxed">
                              {ROLE_CONFIG[r]?.desc}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Workspaces Assignment (Quando role for Cliente Workspace) */}
                {formRole === 'cliente_admin' && (
                  <div className="space-y-2">
                    {/* CASO 1: TRAVADO NA EMPRESA QUANDO DENTRO DA VIEW DO CLIENTE */}
                    {isClientView && activeClient ? (
                      <div className="p-3.5 bg-[#EFF4FF]/40 border border-[#BFDBFE] rounded-xl flex items-center justify-between shadow-2xs">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-lg bg-white border border-[#BFDBFE] flex items-center justify-center text-[#0050FF] shadow-2xs">
                            <Building className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="font-bold text-xs text-[#0F172A]">{activeClient.nome}</p>
                            <p className="text-[10px] text-[#64748B]">Workspace fixado para esta empresa</p>
                          </div>
                        </div>
                        <span className="flex items-center gap-1 text-[10px] font-bold text-[#0050FF] bg-white border border-[#BFDBFE] px-2.5 py-1 rounded-full shadow-2xs">
                          <Lock className="w-3 h-3" />
                          Workspace Travado
                        </span>
                      </div>
                    ) : (
                      /* CASO 2: LIBERADO E COM MULTI-EMPRESAS QUANDO NO ADMIN */
                      <div className="p-3.5 bg-[#F8FAFC] rounded-xl border border-[#CBD5E1] space-y-2.5 shadow-2xs">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 border-b border-[#E2E8F0] pb-2">
                          <div>
                            <label className="font-bold text-xs text-[#0F172A] flex items-center gap-1.5">
                              <Building className="w-3.5 h-3.5 text-[#0050FF]" />
                              <span>Empresas Vinculadas ao Convite (Múltipla Seleção):</span>
                            </label>
                            <span className="text-[10px] text-[#0050FF] font-semibold">
                              {formSelectedClientIds.length} de {clients.length} empresas selecionadas
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5 self-start sm:self-auto">
                            <button
                              type="button"
                              onClick={handleSelectAllClients}
                              className="text-[10px] font-bold text-[#0050FF] bg-white border border-[#BFDBFE] px-2 py-0.5 rounded hover:bg-[#EFF4FF] cursor-pointer"
                            >
                              Marcar Todas
                            </button>
                            <button
                              type="button"
                              onClick={handleDeselectAllClients}
                              className="text-[10px] font-bold text-[#64748B] bg-white border border-[#CBD5E1] px-2 py-0.5 rounded hover:bg-slate-50 cursor-pointer"
                            >
                              Limpar
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-48 overflow-y-auto pr-1">
                          {clients.map((c) => {
                            const isSelected = formSelectedClientIds.includes(c.cliente_id);
                            return (
                              <button
                                type="button"
                                key={c.cliente_id}
                                onClick={() => handleToggleClientSelection(c.cliente_id)}
                                className={`p-2 rounded-lg border text-left flex items-center justify-between gap-2 transition-all cursor-pointer ${
                                  isSelected
                                    ? 'bg-[#EFF4FF] border-[#BFDBFE] text-[#0050FF] shadow-2xs'
                                    : 'bg-white border-[#E2E8F0] text-[#475569] hover:bg-slate-50'
                                }`}
                              >
                                <span className="font-semibold text-xs truncate">{c.nome}</span>
                                <div
                                  className={`w-4 h-4 rounded flex items-center justify-center border shrink-0 ${
                                    isSelected
                                      ? 'bg-[#0050FF] border-[#0050FF] text-white'
                                      : 'border-[#CBD5E1] bg-white'
                                  }`}
                                >
                                  {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
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
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    )}
                    <span>Efetivar Cadastro & Gerar Convite</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Edit Member Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 w-full max-w-xl shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#EFF4FF] border border-[#BFDBFE] flex items-center justify-center text-[#0050FF]">
                  <Pencil className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#0F172A]">Ajustar Cadastro do Membro</h3>
                  <p className="text-[11px] text-[#64748B]">
                    Edite dados de contato, hierarquia, empresas atribuídas e módulos liberados
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-[#94A3B8] hover:text-[#0F172A] text-sm p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Edit Form */}
            <form onSubmit={handleSaveUserEdit} className="space-y-4 text-xs">
              {editFeedback && (
                <div
                  className={`p-3 rounded-xl border flex items-center gap-2 ${
                    editFeedback.type === 'success'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-rose-50 text-rose-700 border-rose-200'
                  }`}
                >
                  {editFeedback.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 shrink-0" />
                  )}
                  <span>{editFeedback.text}</span>
                </div>
              )}

              {/* Nome e WhatsApp */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-[#475569]">
                    Nome Completo <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="Ex: Carlos Oliveira"
                    className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl px-3 py-2 text-xs text-[#0F172A] focus:border-[#0050FF] focus:bg-white focus:outline-none transition"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-[#475569]">
                    WhatsApp com DDD <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editWhatsapp}
                    onChange={(e) => setEditWhatsapp(e.target.value)}
                    placeholder="Ex: 41999998888"
                    className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl px-3 py-2 text-xs font-mono text-[#0F172A] focus:border-[#0050FF] focus:bg-white focus:outline-none transition"
                  />
                </div>
              </div>

              {/* Email e Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-[#475569]">
                    E-mail Corporativo <span className="text-[10px] text-[#94A3B8]">(Opcional)</span>
                  </label>
                  <input
                    type="email"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    placeholder="carlos@empresa.com.br"
                    className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl px-3 py-2 text-xs text-[#0F172A] focus:border-[#0050FF] focus:bg-white focus:outline-none transition"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-[#475569]">Status da Conta</label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as 'ativo' | 'bloqueado')}
                    className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl px-3 py-2 text-xs font-semibold text-[#0F172A] focus:border-[#0050FF] focus:bg-white focus:outline-none transition cursor-pointer"
                  >
                    <option value="ativo">🟢 Ativo (Acesso Liberado)</option>
                    <option value="bloqueado">🔴 Bloqueado (Acesso Suspenso)</option>
                  </select>
                </div>
              </div>

              {/* Hierarquia */}
              <div className="space-y-1">
                <label className="font-semibold text-[#475569]">Perfil / Hierarquia de Acesso</label>
                {isClientView ? (
                  <div className="p-3 rounded-xl border bg-emerald-50/60 border-emerald-400">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-[#0F172A] text-xs">🏢 Membro do Workspace</span>
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
                        Workspace
                      </span>
                    </div>
                    <p className="text-[10px] text-[#64748B]">
                      Acessa exclusivamente este workspace e os módulos autorizados.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setEditRole('cliente_admin')}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        editRole === 'cliente_admin'
                          ? 'bg-emerald-50/60 border-emerald-400 ring-2 ring-emerald-500/20 shadow-xs'
                          : 'bg-[#F8FAFC] border-[#CBD5E1] hover:bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-[#0F172A]">🏢 Cliente</span>
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
                          Workspace
                        </span>
                      </div>
                      <p className="text-[10px] text-[#64748B]">
                        Acessa exclusivamente as empresas vinculadas e os módulos autorizados.
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setEditRole('master_admin')}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        editRole === 'master_admin'
                          ? 'bg-[#EFF4FF] border-[#BFDBFE] ring-2 ring-[#0050FF]/20 shadow-xs'
                          : 'bg-[#F8FAFC] border-[#CBD5E1] hover:bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-[#0F172A]">👑 Admin (Agência)</span>
                        <span className="text-[10px] font-bold text-[#0050FF] bg-blue-100 px-1.5 py-0.5 rounded">
                          Master
                        </span>
                      </div>
                      <p className="text-[10px] text-[#64748B]">
                        Acesso global e irrestrito a todos os clientes, métricas e credenciais.
                      </p>
                    </button>
                  </div>
                )}
              </div>

              {/* Seleção de Empresas Vinculadas (Apenas para role cliente_admin) */}
              {editRole === 'cliente_admin' && (
                <div className="space-y-2">
                  <div className="p-3.5 bg-[#F8FAFC] rounded-xl border border-[#CBD5E1] space-y-2.5 shadow-2xs">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 border-b border-[#E2E8F0] pb-2">
                      <div>
                        <label className="font-bold text-xs text-[#0F172A] flex items-center gap-1.5">
                          <Building className="w-3.5 h-3.5 text-[#0050FF]" />
                          <span>Empresas Vinculadas (Múltipla Seleção):</span>
                        </label>
                        <span className="text-[10px] text-[#0050FF] font-semibold">
                          {editSelectedClientIds.length} de {clients.length} empresas autorizadas
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 self-start sm:self-auto">
                        <button
                          type="button"
                          onClick={() => setEditSelectedClientIds(clients.map((c) => c.cliente_id))}
                          className="text-[10px] font-bold text-[#0050FF] bg-white border border-[#BFDBFE] px-2 py-0.5 rounded hover:bg-[#EFF4FF] cursor-pointer"
                        >
                          Marcar Todas
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (clients.length > 0) setEditSelectedClientIds([clients[0].cliente_id]);
                          }}
                          className="text-[10px] font-bold text-[#64748B] bg-white border border-[#CBD5E1] px-2 py-0.5 rounded hover:bg-slate-50 cursor-pointer"
                        >
                          Limpar
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-48 overflow-y-auto pr-1">
                      {clients.map((c) => {
                        const isSelected = editSelectedClientIds.includes(c.cliente_id);
                        return (
                          <button
                            type="button"
                            key={`edit-${c.cliente_id}`}
                            onClick={() => handleToggleEditClient(c.cliente_id)}
                            className={`p-2 rounded-lg border text-left flex items-center justify-between gap-2 transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-[#EFF4FF] border-[#BFDBFE] text-[#0050FF] shadow-2xs'
                                : 'bg-white border-[#E2E8F0] text-[#475569] hover:bg-slate-50'
                            }`}
                          >
                            <span className="font-semibold text-xs truncate">{c.nome}</span>
                            <div
                              className={`w-4 h-4 rounded flex items-center justify-center border shrink-0 ${
                                isSelected
                                  ? 'bg-[#0050FF] border-[#0050FF] text-white'
                                  : 'border-[#CBD5E1] bg-white'
                              }`}
                            >
                              {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* Módulos Liberados */}
              <div className="space-y-2">
                <label className="block font-semibold text-[#475569]">
                  Módulos Liberados para este Membro:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {ALL_MODULES.map((mod) => {
                    const isChecked = editModules.includes(mod.id);
                    return (
                      <button
                        type="button"
                        key={`edit-mod-${mod.id}`}
                        onClick={() => handleToggleEditModule(mod.id)}
                        className={`p-2 rounded-xl border text-left flex items-center gap-2 transition-all cursor-pointer ${
                          isChecked
                            ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                            : 'bg-[#F8FAFC] border-[#E2E8F0] text-[#64748B] hover:border-[#CBD5E1]'
                        }`}
                      >
                        <div
                          className={`w-3.5 h-3.5 rounded flex items-center justify-center border ${
                            isChecked
                              ? 'bg-emerald-600 border-emerald-600 text-white'
                              : 'border-[#CBD5E1] bg-white'
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
              <div className="flex items-center justify-between pt-3 border-t border-[#F1F5F9]">
                {editRole !== 'master_admin' && editingUserId !== 'usr_rodrigo_ferrari' ? (
                  <button
                    type="button"
                    onClick={() => {
                      const user = users.find((u) => u.id === editingUserId);
                      if (user) {
                        setDeleteFeedback(null);
                        setUserToDelete(user);
                      }
                    }}
                    className="px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Excluir Usuário</span>
                  </button>
                ) : (
                  <div />
                )}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="px-4 py-2 rounded-xl text-[#64748B] hover:text-[#0F172A] transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>

                  <button
                    type="submit"
                    disabled={isEditingSaving}
                    className="px-5 py-2.5 rounded-xl text-xs font-bold bg-[#0050FF] hover:bg-[#0040D6] text-white shadow-xs flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                  >
                    {isEditingSaving ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Check className="w-3.5 h-3.5" />
                    )}
                    <span>Salvar Alterações</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete User Confirmation Modal */}
      {userToDelete && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-60 flex items-center justify-center p-4">
          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#0F172A]">Excluir Usuário</h3>
                <p className="text-xs text-[#64748B] mt-1">
                  Tem certeza que deseja excluir o acesso de <span className="font-bold text-[#0F172A]">{userToDelete.nome}</span>?
                </p>
              </div>
            </div>

            <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-3 text-xs text-[#475569] space-y-1">
              <p>
                <span className="font-semibold">WhatsApp:</span> {userToDelete.whatsapp || 'Não informado'}
              </p>
              <p>
                <span className="font-semibold">Workspace:</span> {userToDelete.cliente_nome || 'Global'}
              </p>
              <p className="text-[11px] text-rose-600 font-medium pt-1">
                ⚠️ Essa ação removerá o perfil, permissões de acesso e sessões ativas deste usuário de forma definitiva.
              </p>
            </div>

            {deleteFeedback && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{deleteFeedback.text}</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#F1F5F9]">
              <button
                type="button"
                disabled={isDeletingUser}
                onClick={() => {
                  setUserToDelete(null);
                  setDeleteFeedback(null);
                }}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-[#64748B] hover:text-[#0F172A] transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isDeletingUser}
                onClick={handleDeleteUser}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-xs flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
              >
                {isDeletingUser ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Trash2 className="w-3.5 h-3.5" />
                )}
                <span>{isDeletingUser ? 'Excluindo...' : 'Sim, Excluir'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
