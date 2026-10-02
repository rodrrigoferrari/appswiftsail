'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Cliente, GroupAdAccount, GroupAdMapping, CsStatus } from '@/types/database';

interface TenantContextType {
  selectedClientId: string;
  setSelectedClientId: (id: string) => void;
  clients: Cliente[];
  setClients: (clients: Cliente[]) => void;
  adAccounts: GroupAdAccount[];
  mappings: GroupAdMapping[];
  csStatusList: CsStatus[];
  dateRange: { start: string; end: string; label: string };
  setDateRange: (range: { start: string; end: string; label: string }) => void;
  activeClient: Cliente | undefined;
  activeClientAdAccounts: GroupAdAccount[];
  activeClientCsStatus: CsStatus | undefined;
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
    loadBootstrap();
  }, []);

  const activeClient = clients.find((c) => c.cliente_id === selectedClientId);

  // Filter accounts belonging to active client
  const activeClientAdAccounts = adAccounts.filter((a) => {
    if (selectedClientId === 'ALL') return true;
    if (activeClient?.grupo_whatsapp_id && a.group_jid === activeClient.grupo_whatsapp_id) return true;
    // fallback name matching
    const slug = selectedClientId.toLowerCase().split('_')[0];
    return a.account_name.toLowerCase().includes(slug);
  });

  // Filter latest CS Status for active client
  const activeClientCsStatus = csStatusList.find((cs) => cs.cliente_id === selectedClientId);

  return (
    <TenantContext.Provider
      value={{
        selectedClientId,
        setSelectedClientId,
        clients,
        setClients,
        adAccounts,
        mappings,
        csStatusList,
        dateRange,
        setDateRange,
        activeClient,
        activeClientAdAccounts,
        activeClientCsStatus,
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
