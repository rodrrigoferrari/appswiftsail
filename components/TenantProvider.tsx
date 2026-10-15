'use client';

import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Cliente, GroupAdAccount, GroupAdMapping, CsStatus, AppUser, UserInvite, ContaAdsPainel, UserModulePermission } from '@/types/database';
import { hojeBRT, diasAtrasBRT } from '@/lib/date';
import { findClientBySlug } from '@/lib/clientSlug';

interface TenantContextType {
  selectedClientId: string;
  setSelectedClientId: (id: string) => void;
  viewMode: 'admin' | 'client';
  setViewMode: (mode: 'admin' | 'client') => void;
  clients: Cliente[];
  availableClients: Cliente[];
  setClients: React.Dispatch<React.SetStateAction<Cliente[]>>;
  currentUser: AppUser | null;
  setCurrentUser: React.Dispatch<React.SetStateAction<AppUser | null>>;
  isAuthChecked: boolean;
  isMasterAdmin: boolean;
  canAccessModule: (module: UserModulePermission) => boolean;
  adAccounts: GroupAdAccount[];
  mappings: GroupAdMapping[];
  csStatusList: CsStatus[];
  users: AppUser[];
  setUsers: React.Dispatch<React.SetStateAction<AppUser[]>>;
  invites: UserInvite[];
  setInvites: React.Dispatch<React.SetStateAction<UserInvite[]>>;
  dateRange: { start: string; end: string; label: string };
  setDateRange: (range: { start: string; end: string; label: string }) => void;
  activeClient: Cliente | undefined;
  activeClientAdAccounts: GroupAdAccount[];
  activeClientCsStatus: CsStatus | undefined;
  selectClientAndSwitchToWorkspace: (clientId: string) => void;
  switchToAdminHQ: () => void;
  refreshUsers: (targetClientId?: string) => Promise<void>;
  restoreMasterAdmin: () => void;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

export function TenantProvider({
  children,
  initialClients = [],
}: {
  children: React.ReactNode;
  initialClients?: Cliente[];
}) {
  const [clients, setClients] = useState<Cliente[]>(initialClients);
  const [adAccounts, setAdAccounts] = useState<GroupAdAccount[]>([]);
  const [mappings, setMappings] = useState<GroupAdMapping[]>([]);
  const [contasAds, setContasAds] = useState<ContaAdsPainel[] | null>(null);
  const [csStatusList, setCsStatusList] = useState<CsStatus[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'admin' | 'client'>('admin');
  const [users, setUsers] = useState<AppUser[]>([]);
  const [invites, setInvites] = useState<UserInvite[]>([]);
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [isAuthChecked, setIsAuthChecked] = useState<boolean>(false);
  const [dateRange, setDateRange] = useState(() => ({
    start: diasAtrasBRT(29),
    end: hojeBRT(),
    label: 'Últimos 30 Dias',
  }));

  // Carrega usuário autenticado do localStorage e valida em segundo plano com Supabase /api/auth/me
  useEffect(() => {
    let isMounted = true;

    async function initAuth() {
      let initialUser: AppUser | null = null;
      let userPhone = '';

      try {
        const stored = localStorage.getItem('swiftsail_user');
        userPhone = localStorage.getItem('swiftsail_user_phone') || '';
        if (stored) {
          initialUser = JSON.parse(stored);
          if (
            initialUser?.role === 'master_admin' ||
            initialUser?.whatsapp === '41992332996' ||
            initialUser?.whatsapp === '5541992332996' ||
            initialUser?.email === 'rodrigo@swiftsail.co'
          ) {
            localStorage.setItem('swiftsail_is_master_admin', 'true');
          }
          if (isMounted) setCurrentUser(initialUser);
        }
      } catch {
        initialUser = null;
      }

      // Consulta /api/auth/me para obter dados frescos do perfil no Supabase
      try {
        const token = localStorage.getItem('sb-access-token') || '';
        const phoneToQuery = initialUser?.whatsapp || userPhone;
        const query = phoneToQuery ? `?phone=${encodeURIComponent(phoneToQuery)}` : '';
        const headers: Record<string, string> = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const res = await fetch(`/api/auth/me${query}`, { headers });
        if (res.ok) {
          const data = await res.json();
          if (data.authenticated && data.user) {
            if (isMounted) {
              setCurrentUser(data.user);
              try {
                localStorage.setItem('swiftsail_user', JSON.stringify(data.user));
                if (data.user.role === 'master_admin') {
                  localStorage.setItem('swiftsail_is_master_admin', 'true');
                } else {
                  localStorage.removeItem('swiftsail_is_master_admin');
                }
              } catch {}
            }
          }
        }
      } catch (meErr) {
        console.warn('[TenantProvider] Falha ao sincronizar perfil do usuário com o servidor:', meErr);
      } finally {
        if (isMounted) setIsAuthChecked(true);
      }
    }

    initAuth();

    return () => {
      isMounted = false;
    };
  }, []);

  // É Master Admin se o perfil for master_admin ou Rodrigo Ferrari.
  // SE deslogado ou se for cliente_admin, é ESTRITAMENTE falso.
  const isMasterAdmin = useMemo(() => {
    if (!currentUser) return false;
    if (currentUser.role === 'cliente_admin') return false;
    if (currentUser.role === 'master_admin') return true;
    if (currentUser.whatsapp === '41992332996' || currentUser.whatsapp === '5541992332996') return true;
    if (currentUser.email === 'rodrigo@swiftsail.co') return true;
    return false;
  }, [currentUser]);

  // Workspaces permitidos: se for master_admin, vê todas as empresas.
  // Se for cliente_admin, vê SOMENTE os workspaces designados para sua conta.
  const availableClients = useMemo(() => {
    if (isMasterAdmin) return clients;

    const allowed = new Set<string>();
    if (currentUser?.cliente_id) allowed.add(String(currentUser.cliente_id).trim().toUpperCase());
    if (Array.isArray(currentUser?.cliente_ids)) {
      currentUser.cliente_ids.forEach((id) => {
        if (id) allowed.add(String(id).trim().toUpperCase());
      });
    }

    if (allowed.size === 0) return [];

    return clients.filter((c) => {
      const cIdUpper = (c.cliente_id || '').toUpperCase();
      const cSlug = (c.cliente_id || '').toLowerCase().replace(/_/g, '-');
      const cNomeSlug = (c.nome || '').toLowerCase().replace(/\s+/g, '-');

      for (const a of allowed) {
        const aUpper = a.toUpperCase();
        const aSlug = a.toLowerCase().replace(/_/g, '-');
        if (cIdUpper === aUpper || cSlug === aSlug || cNomeSlug === aSlug) {
          return true;
        }
      }
      return false;
    });
  }, [clients, currentUser, isMasterAdmin]);

  // Efeito de contenção estrita: se for cliente, NUNCA permite selectedClientId === 'ALL'
  useEffect(() => {
    if (!isMasterAdmin && currentUser) {
      setViewMode('client');
      const assignedTarget = currentUser.cliente_id || (availableClients.length > 0 ? availableClients[0].cliente_id : null);
      if (assignedTarget) {
        if (selectedClientId === 'ALL' || !availableClients.some((c) => c.cliente_id === selectedClientId)) {
          setSelectedClientId(assignedTarget);
        }
      }
    }
  }, [isMasterAdmin, currentUser, availableClients, selectedClientId]);

  // Checagem de permissão por módulo (Tráfego, WhatsApp, CRM, Design, Financeiro)
  const canAccessModule = (mod: import('@/types/database').UserModulePermission): boolean => {
    if (isMasterAdmin) return true;
    if (!currentUser) return false;
    return Array.isArray(currentUser.modulos) ? currentUser.modulos.includes(mod) : false;
  };

  // Fetch full bootstrap dataset from Supabase API
  useEffect(() => {
    async function loadBootstrap() {
      try {
        const res = await fetch('/api/bootstrap');
        const data = await res.json();
        if (data.success) {
          if (data.clientes && data.clientes.length > 0) setClients(data.clientes);
          if (data.adAccounts) setAdAccounts(data.adAccounts);
          if (data.mappings) setMappings(data.mappings);
          setContasAds(Array.isArray(data.contasAds) ? data.contasAds : null);
          if (data.csStatus) setCsStatusList(data.csStatus);
        }
      } catch (err) {
        console.error('Failed to load bootstrap data from Supabase:', err);
      }
    }

    async function loadUsers() {
      try {
        const res = await fetch(`/api/users?_t=${Date.now()}`, { cache: 'no-store' });
        const data = await res.json();
        if (data.success) {
          if (data.users) setUsers(data.users);
          if (data.invites) setInvites(data.invites);
        }
      } catch (err) {
        console.error('Failed to load users:', err);
      }
    }

    loadBootstrap();
    loadUsers();
  }, []);

  const pathname = usePathname();

  // Sincronização automática com a hierarquia da URL (/admin, /admin/client/[slug], /client, /client/[slug])
  useEffect(() => {
    if (!pathname || clients.length === 0) return;

    if (pathname.startsWith('/admin/client/')) {
      const slug = pathname.replace('/admin/client/', '').split('/')[0];
      const found = findClientBySlug(clients, slug);
      if (found) {
        setSelectedClientId(found.cliente_id);
        setViewMode('admin');
      }
    } else if (pathname === '/admin' || pathname === '/admin/clientes' || pathname === '/admin/ia') {
      setViewMode('admin');
    } else if (pathname.startsWith('/client/')) {
      const slug = pathname.replace('/client/', '').split('/')[0];
      const found = findClientBySlug(clients, slug);
      if (found) {
        setSelectedClientId(found.cliente_id);
        setViewMode('client');
      }
    } else if (pathname === '/client') {
      setViewMode('client');
    }
  }, [pathname, clients]);

  const refreshUsers = async (targetClientId?: string) => {
    try {
      const effectiveId = targetClientId !== undefined
        ? targetClientId
        : !isMasterAdmin
        ? (currentUser?.cliente_id || (availableClients.length > 0 ? availableClients[0].cliente_id : ''))
        : (viewMode === 'client' && selectedClientId !== 'ALL' ? selectedClientId : 'ALL');

      const url = effectiveId && effectiveId !== 'ALL'
        ? `/api/users?cliente_id=${encodeURIComponent(effectiveId)}&_t=${Date.now()}`
        : `/api/users?_t=${Date.now()}`;

      const res = await fetch(url, { cache: 'no-store' });
      const data = await res.json();
      if (data.success) {
        if (data.users) setUsers(data.users);
        if (data.invites) setInvites(data.invites);
      }
    } catch (err) {
      console.error('Failed to refresh users:', err);
    }
  };

  const selectClientAndSwitchToWorkspace = (clientId: string) => {
    setSelectedClientId(clientId);
    setViewMode('client');
  };

  const switchToAdminHQ = () => {
    setSelectedClientId('ALL');
    setViewMode('admin');
  };

  const restoreMasterAdmin = () => {
    const masterUser: AppUser = {
      id: 'usr_rodrigo_ferrari',
      nome: 'Rodrigo Ferrari',
      email: 'rodrigo@swiftsail.co',
      whatsapp: '41992332996',
      role: 'master_admin',
      cliente_id: null,
      cliente_nome: 'Swiftsail HQ (Master Admin)',
      status: 'ativo',
      modulos: ['midia', 'whatsapp', 'criativos', 'crm', 'financeiro'],
    };
    try {
      localStorage.setItem('swiftsail_user', JSON.stringify(masterUser));
      localStorage.setItem('swiftsail_user_phone', '41992332996');
    } catch {}
    setCurrentUser(masterUser);
  };

  const activeClient = clients.find((c) => c.cliente_id === selectedClientId);

  // Operação ativa = grupos de WhatsApp de clientes com status 'ativo' em public.clientes
  const activeGroupJids = new Set(
    clients
      .filter((c) => c.status === 'ativo' && c.grupo_whatsapp_id)
      .map((c) => c.grupo_whatsapp_id as string)
  );

  // Precise filter for accounts belonging to active operations / active client
  const legacyAdAccounts = adAccounts.filter((a) => {
    if (selectedClientId === 'ALL') {
      // Visão HQ: apenas contas de clientes ativos
      return activeGroupJids.has(a.group_jid || '');
    }

    // 1. Direct group_jid match on client
    if (activeClient?.grupo_whatsapp_id && a.group_jid === activeClient.grupo_whatsapp_id) {
      return true;
    }

    // 2. Known explicit mappings for active clients
    const explicitGroupJids: Record<string, string[]> = {
      REALIZACOES_GONZAGA: ['120363426423528090@g.us', '120363431326920012@g.us'],
      GONZAGA_AMST: ['120363426423528090@g.us'],
      GONZAGA_SCA_181: ['120363431326920012@g.us'],
      GENOVA_URBANISMO: ['120363402899636100@g.us'],
      ADRIATICA_INCORPORADORA: ['120363045527587307@g.us'],
      CONSTRUTORA_PESSOA: ['120363408072588129@g.us'],
      PACIFIC_INCORPORADORA: ['120363043621675919@g.us'],
      DABOL_ENGENHARIA: ['120363321592688249@g.us'],
      LEGALIZZAR: ['120363044308380781@g.us'],
      CALURE_EMPREENDIMENTOS: ['120363412421256861@g.us'],
    };

    if (explicitGroupJids[selectedClientId]?.includes(a.group_jid || '')) {
      return true;
    }

    // 3. Check group_ad_mapping for active client
    const mapped = mappings.find((m) => m.group_jid === a.group_jid);
    if (mapped) {
      const clientNameNorm = (activeClient?.nome || selectedClientId).toLowerCase();
      const mappedClientNorm = (mapped.client_name || '').toLowerCase();
      const mappedGroupNorm = (mapped.group_name || '').toLowerCase();

      if (
        (mappedClientNorm && clientNameNorm.includes(mappedClientNorm)) ||
        (mappedGroupNorm && clientNameNorm.includes(mappedGroupNorm)) ||
        (mappedClientNorm && mappedClientNorm.includes(clientNameNorm))
      ) {
        return true;
      }
    }

    return false;
  });

  // Fonte preferida: painel.contas_ads (já amarrada por cliente_id e só de clientes ativos).
  // Fonte preferida: painel.contas_ads (já amarrada por cliente_id e só de clientes ativos).
  // Para usuários clientes, NUNCA expõe contas fora dos seus workspaces designados.
  const activeClientAdAccounts: GroupAdAccount[] = useMemo(() => {
    const allowedClientIds = new Set(availableClients.map((c) => c.cliente_id));

    if (contasAds) {
      return contasAds
        .filter((c) => {
          if (!isMasterAdmin) {
            // Cliente comum: NUNCA vê contas fora do seu workspace atribuído
            return allowedClientIds.has(c.cliente_id);
          }
          return selectedClientId === 'ALL' || c.cliente_id === selectedClientId;
        })
        .map((c) => ({
          id: `${c.plataforma}:${c.account_id}`,
          cliente_id: c.cliente_id,
          plataforma: c.plataforma,
          account_id: c.account_id,
          account_name: c.nome,
          ativo: true,
          tipo_pagamento: c.tipo_pagamento,
          saldo_disponivel: c.saldo_disponivel,
          cartao_final: c.cartao_final,
          limite_restante: c.limite_restante,
          conta_pagamento: c.conta_pagamento,
        }));
    }

    return legacyAdAccounts.filter((a) => {
      if (!isMasterAdmin) {
        return a.cliente_id ? allowedClientIds.has(a.cliente_id) : true;
      }
      return true;
    });
  }, [contasAds, legacyAdAccounts, isMasterAdmin, selectedClientId, availableClients]);

  // Filter latest CS Status for active client
  const activeClientCsStatus = csStatusList.find((cs) => cs.cliente_id === selectedClientId);

  return (
    <TenantContext.Provider
      value={{
        selectedClientId,
        setSelectedClientId,
        viewMode,
        setViewMode,
        clients,
        availableClients,
        setClients,
        currentUser,
        setCurrentUser,
        isAuthChecked,
        isMasterAdmin,
        canAccessModule,
        adAccounts,
        mappings,
        csStatusList,
        users,
        setUsers,
        invites,
        setInvites,
        dateRange,
        setDateRange,
        activeClient,
        activeClientAdAccounts,
        activeClientCsStatus,
        selectClientAndSwitchToWorkspace,
        switchToAdminHQ,
        refreshUsers,
        restoreMasterAdmin,
      }}
    >
      {children}
    </TenantContext.Provider>
  );
}

export function useTenant() {
  const context = useContext(TenantContext);
  if (!context) {
    throw new Error('useTenant must be used within a TenantProvider');
  }
  return context;
}

