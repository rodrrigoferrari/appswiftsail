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

  // Filter accounts belonging to active client
  const activeClientAdAccounts = adAccounts.filter((a) => {
    if (selectedClientId === 'ALL') return true;
    if (activeClient?.grupo_whatsapp_id && a.group_jid === activeClient.grupo_whatsapp_id) return true;
    
    // Normalized slug and name matching
    const slug = selectedClientId.toLowerCase().replace(/_/g, ' ');
    const firstWord = selectedClientId.toLowerCase().split('_')[0];
    const accName = a.account_name.toLowerCase();
    
    return accName.includes(firstWord) || slug.includes(accName) || accName.includes(slug);
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

