'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Cliente, GroupAdAccount, GroupAdMapping, CsStatus, AppUser, UserInvite } from '@/types/database';

interface TenantContextType {
  selectedClientId: string;
  setSelectedClientId: (id: string) => void;
  viewMode: 'admin' | 'client';
  setViewMode: (mode: 'admin' | 'client') => void;
  clients: Cliente[];
  setClients: React.Dispatch<React.SetStateAction<Cliente[]>>;
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
  refreshUsers: () => Promise<void>;
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
  const [csStatusList, setCsStatusList] = useState<CsStatus[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'admin' | 'client'>('admin');
  const [users, setUsers] = useState<AppUser[]>([]);
  const [invites, setInvites] = useState<UserInvite[]>([]);
  const [dateRange, setDateRange] = useState({
    start: '2026-09-01',
    end: '2026-10-02',
    label: 'Últimos 30 Dias',
  });

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
          if (data.csStatus) setCsStatusList(data.csStatus);
        }
      } catch (err) {
        console.error('Failed to load bootstrap data from Supabase:', err);
      }
    }

    async function loadUsers() {
      try {
        const res = await fetch('/api/users');
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

  const refreshUsers = async () => {
    try {
      const res = await fetch('/api/users');
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

  const activeClient = clients.find((c) => c.cliente_id === selectedClientId);

  // Known inactive/churned client group JIDs to exclude from active operations
  const inactiveGroupJids = new Set([
    '120363024964921278@g.us', // Toddler (inativo)
    '120363423799295040@g.us', // Abrao (inativo)
    '120363281768786763@g.us', // Atlantic (inativo)
    '120363428090168267@g.us', // Beppler (inativo)
    '120363402742952870@g.us', // Plamev RJ (encerrado)
  ]);

  // Precise filter for accounts belonging to active operations / active client
  const activeClientAdAccounts = adAccounts.filter((a) => {
    if (selectedClientId === 'ALL') {
      // In HQ/Master view, only show accounts of active operations
      return !inactiveGroupJids.has(a.group_jid || '');
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
        setClients,
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

