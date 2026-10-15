'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  QrCode,
  Smartphone,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  LogOut,
  Copy,
  Check,
  ShieldCheck,
  Radio,
  ExternalLink,
  Plus,
  Trash2,
  Phone,
  Server,
  Zap,
  Info,
} from 'lucide-react';

interface UazapiInstance {
  name: string;
  status: string;
  token: string;
  owner?: string;
  profileName?: string;
  profilePicUrl?: string;
  systemName?: string;
  updated?: string;
}

interface WhatsAppConnectFlowProps {
  clienteId?: string;
  onStatusChange?: (status: 'connected' | 'connecting' | 'disconnected', instanceData?: any) => void;
}

export function WhatsAppConnectFlow({ clienteId = 'swiftsail', onStatusChange }: WhatsAppConnectFlowProps) {
  // Instâncias criadas
  const [instances, setInstances] = useState<UazapiInstance[]>([]);
  const [loadingInstances, setLoadingInstances] = useState<boolean>(true);
  const [selectedInstance, setSelectedInstance] = useState<UazapiInstance | null>(null);

  // Estados de criação e deleção
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [isDeletingName, setIsDeletingName] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState<UazapiInstance | null>(null);
  const [newInstanceName, setNewInstanceName] = useState<string>('');
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);

  // Estados de conexão ativa
  const [activeTab, setActiveTab] = useState<'qrcode' | 'pairing'>('qrcode');
  const [connecting, setConnecting] = useState<boolean>(false);
  const [disconnecting, setDisconnecting] = useState<boolean>(false);
  const [qrCode, setQrCode] = useState<string>('');
  const [pairingCode, setPairingCode] = useState<string>('');
  const [phoneToPair, setPhoneToPair] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const pollTimerRef = useRef<NodeJS.Timeout | null>(null);

  // 1. Buscar instâncias da UAZAPI para este cliente/workspace
  const fetchInstances = async (selectPreferredName?: string) => {
    setLoadingInstances(true);
    try {
      const res = await fetch('/api/uazapi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'list_instances', cliente_id: clienteId }),
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.instances)) {
        setInstances(data.instances);

        // Seleciona a instância alvo
        if (selectPreferredName) {
          const match = data.instances.find((i: UazapiInstance) => i.name === selectPreferredName);
          if (match) setSelectedInstance(match);
        } else if (!selectedInstance || !data.instances.some((i: UazapiInstance) => i.name === selectedInstance.name)) {
          // Prioriza conectada ou a primeira
          const connected = data.instances.find((i: UazapiInstance) => i.status === 'connected');
          setSelectedInstance(connected || data.instances[0] || null);
        } else {
          // Atualiza dados da instância já selecionada
          const updated = data.instances.find((i: UazapiInstance) => i.name === selectedInstance.name);
          if (updated) setSelectedInstance(updated);
        }
      } else {
        setInstances([]);
        setSelectedInstance(null);
      }
    } catch (err: any) {
      console.warn('Erro ao listar instâncias:', err);
    } finally {
      setLoadingInstances(false);
    }
  };

  // 2. Checar status da instância selecionada
  const checkStatus = async () => {
    if (!selectedInstance) return;
    try {
      const res = await fetch(`/api/whatsapp/status?cliente_id=${encodeURIComponent(clienteId)}&instance_token=${encodeURIComponent(selectedInstance.token || '')}&instance_name=${encodeURIComponent(selectedInstance.name || '')}`);
      if (!res.ok) return;
      const data = await res.json();

      const isConnected = data.connected === true || data.status === 'connected';
      const newStatus = isConnected ? 'connected' : data.status === 'connecting' ? 'connecting' : 'disconnected';

      // Atualiza na lista local de instâncias
      setInstances((prev) =>
        prev.map((i) =>
          i.name === selectedInstance.name
            ? {
                ...i,
                status: newStatus,
                owner: data.instance?.owner || data.owner || i.owner,
                profileName: data.instance?.profileName || data.profileName || i.profileName,
                profilePicUrl: data.instance?.profilePicUrl || data.profilePicUrl || i.profilePicUrl,
              }
            : i
        )
      );

      if (isConnected) {
        setQrCode('');
        setPairingCode('');
        setConnecting(false);
      }

      if (onStatusChange) {
        onStatusChange(newStatus, data.instance);
      }
    } catch {
      // Ignora erro momentâneo de polling
    }
  };

  useEffect(() => {
    fetchInstances();
  }, [clienteId]);

  useEffect(() => {
    if (!selectedInstance) return;

    checkStatus();

    const intervalTime = qrCode || pairingCode || connecting || selectedInstance.status === 'connecting' ? 2500 : 8000;
    pollTimerRef.current = setInterval(() => {
      checkStatus();
    }, intervalTime);

    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, [qrCode, pairingCode, connecting, selectedInstance?.name, selectedInstance?.status]);

  // 3. Criar Nova Instância WhatsApp via Uazapi com systemName app.swiftsail
  const handleCreateInstance = async (customName?: string) => {
    setIsCreating(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    const targetName = customName || newInstanceName.trim() || `swiftsail-${clienteId.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;

    try {
      const res = await fetch('/api/uazapi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create_instance',
          cliente_id: clienteId,
          instance_name: targetName,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Falha ao provisionar instância na UAZAPI.');
      }

      setSuccessMsg(`Instância [${targetName}] criada com sucesso com identificação app.swiftsail!`);
      setShowCreateModal(false);
      setNewInstanceName('');
      await fetchInstances(targetName);
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao criar instância.');
    } finally {
      setIsCreating(false);
    }
  };

  // 4. Excluir Instância da Uazapi e do Banco
  const handleDeleteInstance = async (instance: UazapiInstance) => {
    setIsDeletingName(instance.name);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await fetch('/api/uazapi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'delete_instance',
          cliente_id: clienteId,
          instance_name: instance.name,
          instance_token: instance.token,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Falha ao excluir instância da UAZAPI.');
      }

      // Atualização imediata do estado visual
      setInstances((prev) => prev.filter((i) => i.name !== instance.name));
      if (selectedInstance?.name === instance.name) {
        setSelectedInstance(null);
        setQrCode('');
        setPairingCode('');
      }
      setShowDeleteModal(null);
      setSuccessMsg(`Instância [${instance.name}] foi excluída com sucesso.`);

      // Sincroniza em segundo plano
      setTimeout(() => {
        fetchInstances();
      }, 500);
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao deletar instância.');
    } finally {
      setIsDeletingName(null);
    }
  };

  // 5. Iniciar Conexão / Gerar QR Code
  const handleGenerateConnection = async (force = false) => {
    if (!selectedInstance) return;
    setConnecting(true);
    setErrorMsg(null);
    setQrCode('');
    setPairingCode('');

    try {
      const body: any = {
        cliente_id: clienteId,
        forceReconnect: force,
        customInstanceName: selectedInstance.name,
        customToken: selectedInstance.token,
      };

      if (activeTab === 'pairing') {
        const cleanPhone = phoneToPair.replace(/\D/g, '');
        if (cleanPhone.length < 10) {
          setErrorMsg('Digite um número de telefone válido com DDD (ex: 41992332996).');
          setConnecting(false);
          return;
        }
        body.phone = cleanPhone;
      }

      const res = await fetch('/api/whatsapp/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMsg(data.error || 'Falha ao solicitar conexão na UAZAPI.');
        setConnecting(false);
        return;
      }

      if (data.connected || data.status === 'connected') {
        setConnecting(false);
        await checkStatus();
        return;
      }

      if (data.qrcode) {
        setQrCode(data.qrcode);
      }

      if (data.pairingCode) {
        setPairingCode(data.pairingCode);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro de comunicação com o servidor.');
    } finally {
      setConnecting(false);
    }
  };

  // 6. Desconectar Instância (Logout)
  const handleDisconnect = async (instance: UazapiInstance) => {
    if (!confirm(`Deseja realmente desconectar a sessão do WhatsApp da instância [${instance.name}]?`)) return;
    setDisconnecting(true);
    setErrorMsg(null);
    try {
      await fetch('/api/uazapi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'disconnect_instance',
          cliente_id: clienteId,
          instance_token: instance.token,
        }),
      });
      setQrCode('');
      setPairingCode('');
      setSuccessMsg(`Instância [${instance.name}] desconectada.`);
      await checkStatus();
      await fetchInstances(instance.name);
    } catch {
      setErrorMsg('Falha ao desconectar instância.');
    } finally {
      setDisconnecting(false);
    }
  };

  const copyPairingCode = () => {
    if (!pairingCode) return;
    navigator.clipboard.writeText(pairingCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatPhoneNumber = (phone?: string) => {
    if (!phone) return null;
    const clean = phone.replace(/\D/g, '');
    if (clean.length === 13 && clean.startsWith('55')) {
      return `+55 (${clean.slice(2, 4)}) ${clean.slice(4, 9)}-${clean.slice(9)}`;
    }
    if (clean.length === 12 && clean.startsWith('55')) {
      return `+55 (${clean.slice(2, 4)}) ${clean.slice(4, 8)}-${clean.slice(8)}`;
    }
    if (clean.length === 11) {
      return `(${clean.slice(0, 2)}) ${clean.slice(2, 7)}-${clean.slice(7)}`;
    }
    return phone.startsWith('+') ? phone : `+${phone}`;
  };

  return (
    <div className="space-y-6 select-none font-sans">
      {/* Alertas Globais */}
      {errorMsg && (
        <div className="p-4 rounded-2xl text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 flex items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg(null)} className="text-rose-500 hover:text-rose-700 font-bold">×</button>
        </div>
      )}

      {successMsg && (
        <div className="p-4 rounded-2xl text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="text-emerald-500 hover:text-emerald-700 font-bold">×</button>
        </div>
      )}

      {/* SEÇÃO 1: INSTÂNCIAS CRIADAS */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 sm:p-6 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E2E8F0] pb-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base font-bold text-[#0F172A] flex items-center gap-2">
                <span>📱</span> Instâncias WhatsApp (UAZAPI Highlander)
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#EFF4FF] text-[#0050FF] border border-[#BFDBFE]">
                {instances.length} {instances.length === 1 ? 'instância' : 'instâncias'}
              </span>
            </div>
            <p className="text-xs text-[#64748B] mt-0.5">
              Gerencie conexões dedicadas para o workspace <b className="text-[#0F172A]">{clienteId}</b>. Identificador no celular: <b className="text-[#0050FF]">app.swiftsail</b>.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchInstances()}
              disabled={loadingInstances}
              className="px-3 py-2 rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] hover:bg-white text-[#475569] font-bold text-xs flex items-center gap-1.5 shadow-2xs cursor-pointer transition disabled:opacity-50"
              title="Recarregar instâncias"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingInstances ? 'animate-spin text-[#0050FF]' : ''}`} />
              <span className="hidden sm:inline">Atualizar</span>
            </button>

            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-[#0050FF] hover:bg-[#0040D6] text-white px-3.5 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-xs cursor-pointer transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Nova Instância</span>
            </button>
          </div>
        </div>

        {/* Loading State */}
        {loadingInstances && instances.length === 0 ? (
          <div className="p-8 text-center space-y-3">
            <div className="w-8 h-8 border-2 border-[#0050FF] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-[#64748B]">Buscando instâncias WhatsApp do cliente...</p>
          </div>
        ) : instances.length === 0 ? (
          /* EMPTY STATE ELEGANTE: SUGERIR ADICIONAR A PRIMEIRA */
          <div className="p-8 sm:p-10 border-2 border-dashed border-[#CBD5E1] rounded-2xl text-center space-y-4 bg-[#F8FAFC]">
            <div className="w-14 h-14 rounded-2xl bg-[#EFF4FF] border border-[#BFDBFE] flex items-center justify-center mx-auto text-[#0050FF] shadow-2xs">
              <Smartphone className="w-7 h-7" />
            </div>
            <div className="max-w-md mx-auto space-y-1">
              <h3 className="text-sm font-bold text-[#0F172A]">Nenhuma instância WhatsApp encontrada</h3>
              <p className="text-xs text-[#64748B] leading-relaxed">
                Este workspace ainda não possui nenhuma linha vinculada. Adicione sua primeira instância para habilitar chamadas de voz VoIP, disparo em massa e QR Code.
              </p>
            </div>
            <div className="pt-2">
              <button
                onClick={() => handleCreateInstance()}
                disabled={isCreating}
                className="bg-[#0050FF] hover:bg-[#0040D6] text-white px-6 py-2.5 rounded-xl font-bold text-xs inline-flex items-center gap-2 shadow-xs cursor-pointer transition disabled:opacity-50"
              >
                {isCreating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                <span>Adicionar a Primeira Instância (app.swiftsail)</span>
              </button>
            </div>
          </div>
        ) : (
          /* GRID DE INSTÂNCIAS CRIADAS */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {instances.map((inst) => {
              const isSelected = selectedInstance?.name === inst.name;
              const isConnected = inst.status === 'connected';
              const isConnecting = inst.status === 'connecting';

              return (
                <div
                  key={inst.name}
                  onClick={() => setSelectedInstance(inst)}
                  className={`border rounded-2xl p-4 sm:p-5 transition cursor-pointer relative ${
                    isSelected
                      ? 'border-[#0050FF] bg-[#F8FAFC] shadow-sm ring-1 ring-[#0050FF]/20'
                      : 'border-[#E2E8F0] bg-white hover:border-[#CBD5E1] shadow-2xs'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      {inst.profilePicUrl ? (
                        <img
                          src={inst.profilePicUrl}
                          alt="WhatsApp Profile"
                          className="w-10 h-10 rounded-full object-cover border border-[#CBD5E1] shrink-0"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-xl bg-[#EFF4FF] border border-[#BFDBFE] flex items-center justify-center text-[#0050FF] shrink-0">
                          <Smartphone className="w-5 h-5" />
                        </div>
                      )}
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h4 className="font-bold text-xs text-[#0F172A] font-mono">{inst.name}</h4>
                          {isSelected && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#0050FF] text-white">
                              Ativa
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-[#64748B] mt-0.5">
                          {inst.profileName ? (
                            <span className="font-semibold text-[#0F172A]">{inst.profileName} • </span>
                          ) : null}
                          {inst.owner ? formatPhoneNumber(inst.owner) : 'Nenhum aparelho conectado'}
                        </p>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border inline-flex items-center gap-1 shrink-0 ${
                        isConnected
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : isConnecting
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-slate-100 text-slate-600 border-slate-200'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          isConnected
                            ? 'bg-emerald-500 animate-pulse'
                            : isConnecting
                            ? 'bg-amber-500 animate-ping'
                            : 'bg-slate-400'
                        }`}
                      />
                      {isConnected ? 'Conectada' : isConnecting ? 'Conectando...' : 'Desconectada'}
                    </span>
                  </div>

                  {/* Informações de Dispositivo & Ações */}
                  <div className="mt-4 pt-3 border-t border-[#E2E8F0] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-1.5 text-[11px] text-[#64748B]">
                      <span>Dispositivo:</span>
                      <span className="font-bold text-[#0050FF] bg-[#EFF4FF] px-2 py-0.5 rounded-md border border-[#BFDBFE]">
                        app.swiftsail
                      </span>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-auto">
                      {isConnected ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDisconnect(inst);
                          }}
                          disabled={disconnecting}
                          className="px-2.5 py-1 rounded-lg text-[11px] font-bold border border-rose-200 bg-white text-rose-600 hover:bg-rose-50 cursor-pointer transition flex items-center gap-1"
                          title="Desconectar sessão do WhatsApp"
                        >
                          <LogOut className="w-3 h-3" />
                          <span>Desconectar</span>
                        </button>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedInstance(inst);
                            handleGenerateConnection(false);
                          }}
                          disabled={connecting}
                          className="px-2.5 py-1 rounded-lg text-[11px] font-bold border border-[#BFDBFE] bg-[#EFF4FF] text-[#0050FF] hover:bg-[#DBEAFE] cursor-pointer transition flex items-center gap-1"
                        >
                          <QrCode className="w-3 h-3" />
                          <span>Conectar QR Code</span>
                        </button>
                      )}

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowDeleteModal(inst);
                        }}
                        className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer transition"
                        title="Deletar Instância"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* SEÇÃO 2: PAINEL DE PAREAMENTO DA INSTÂNCIA SELECIONADA */}
      {selectedInstance && (
        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 sm:p-6 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E2E8F0] pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span
                  className={`w-2.5 h-2.5 rounded-full ${
                    selectedInstance.status === 'connected'
                      ? 'bg-emerald-500 animate-pulse'
                      : selectedInstance.status === 'connecting'
                      ? 'bg-amber-500 animate-ping'
                      : 'bg-rose-500'
                  }`}
                />
                <h3 className="text-sm font-bold text-[#0F172A]">
                  Conectar Instância: <span className="font-mono text-[#0050FF]">{selectedInstance.name}</span>
                </h3>
              </div>
              <p className="text-xs text-[#64748B] mt-0.5">
                Leia o QR Code abaixo com seu celular. No WhatsApp aparecerá o nome <b className="text-[#0050FF]">app.swiftsail</b> em Aparelhos Conectados.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold border ${
                  selectedInstance.status === 'connected'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : selectedInstance.status === 'connecting'
                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                    : 'bg-rose-50 text-rose-700 border-rose-200'
                }`}
              >
                {selectedInstance.status === 'connected'
                  ? 'Online & Conectado'
                  : selectedInstance.status === 'connecting'
                  ? 'Aguardando Pareamento...'
                  : 'Desconectado'}
              </span>

              <button
                onClick={() => checkStatus()}
                className="p-1.5 rounded-lg bg-[#F8FAFC] border border-[#CBD5E1] text-[#64748B] hover:text-[#0050FF] cursor-pointer"
                title="Checar Status"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {selectedInstance.status === 'connected' ? (
            /* SE CONECTADA */
            <div className="p-5 rounded-2xl bg-[#F8FAFC] border border-emerald-200 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-[#0F172A]">Linha WhatsApp Conectada e Pronta</h4>
                    <p className="text-[11px] text-[#64748B]">
                      Aparelho sincronizado como <b className="text-[#0050FF]">app.swiftsail</b> pronto para ligações e disparos.
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => handleDisconnect(selectedInstance)}
                  disabled={disconnecting}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 shadow-xs flex items-center gap-1.5 cursor-pointer transition"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Desconectar Sessão</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-[#E2E8F0] text-xs">
                <div>
                  <span className="text-[#64748B] text-[10px] uppercase font-bold">Instância</span>
                  <p className="font-mono font-bold text-[#0F172A] mt-0.5">{selectedInstance.name}</p>
                </div>
                <div>
                  <span className="text-[#64748B] text-[10px] uppercase font-bold">Número Conectado</span>
                  <p className="font-mono font-bold text-emerald-700 mt-0.5">
                    {formatPhoneNumber(selectedInstance.owner) || 'Multi-Device Ativo'}
                  </p>
                </div>
                <div>
                  <span className="text-[#64748B] text-[10px] uppercase font-bold">Identificador no Celular</span>
                  <p className="font-bold text-[#0050FF] mt-0.5">app.swiftsail</p>
                </div>
              </div>
            </div>
          ) : (
            /* SE DESCONECTADA: ABAS QR CODE & PAIRING CODE */
            <div className="space-y-5">
              <div className="flex items-center gap-2 p-1 bg-[#F1F5F9] border border-[#E2E8F0] rounded-xl w-fit">
                <button
                  onClick={() => setActiveTab('qrcode')}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                    activeTab === 'qrcode'
                      ? 'bg-white text-[#0050FF] shadow-xs border border-[#E2E8F0]'
                      : 'text-[#64748B] hover:text-[#0F172A]'
                  }`}
                >
                  <QrCode className="w-3.5 h-3.5" />
                  <span>Conectar com QR Code</span>
                </button>

                <button
                  onClick={() => setActiveTab('pairing')}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                    activeTab === 'pairing'
                      ? 'bg-white text-[#0050FF] shadow-xs border border-[#E2E8F0]'
                      : 'text-[#64748B] hover:text-[#0F172A]'
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>Código de 8 Dígitos (Remoto)</span>
                </button>
              </div>

              {/* ABA QR CODE */}
              {activeTab === 'qrcode' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                  <div className="space-y-3 text-xs">
                    <h4 className="font-bold text-[#0F172A] text-sm">Passo a passo no seu celular:</h4>
                    <ol className="list-decimal list-inside space-y-2 text-[#475569] leading-relaxed">
                      <li>Abra o WhatsApp no aparelho que será conectado.</li>
                      <li>Acesse <b>Configurações</b> (ou três pontinhos no Android).</li>
                      <li>Toque em <b>Aparelhos Conectados</b> e depois em <b>Conectar um Aparelho</b>.</li>
                      <li>Aponte a câmera para o QR Code ao lado.</li>
                    </ol>

                    <div className="p-3 bg-[#EFF4FF] border border-[#BFDBFE] rounded-xl text-[11px] text-[#0050FF] flex items-center gap-2 font-medium">
                      <Info className="w-4 h-4 shrink-0" />
                      <span>O aparelho será listado com o nome <b>app.swiftsail</b> no WhatsApp.</span>
                    </div>

                    <div className="pt-2">
                      <button
                        onClick={() => handleGenerateConnection(false)}
                        disabled={connecting}
                        className="px-5 py-2.5 rounded-xl font-bold bg-[#0050FF] hover:bg-[#0040D6] text-white text-xs shadow-xs flex items-center gap-2 cursor-pointer transition disabled:opacity-50"
                      >
                        {connecting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <QrCode className="w-4 h-4" />}
                        <span>{qrCode ? 'Atualizar QR Code' : 'Gerar QR Code de Conexão'}</span>
                      </button>
                    </div>
                  </div>

                  {/* QR Code Container */}
                  <div className="p-6 bg-[#F8FAFC] border border-[#CBD5E1] rounded-2xl flex flex-col items-center justify-center min-h-[260px] text-center">
                    {qrCode ? (
                      <div className="space-y-3">
                        <div className="p-3 bg-white border border-[#E2E8F0] rounded-xl shadow-xs inline-block">
                          <img
                            src={qrCode.startsWith('data:') ? qrCode : `data:image/png;base64,${qrCode}`}
                            alt="WhatsApp QR Code"
                            className="w-48 h-48 object-contain"
                          />
                        </div>
                        <p className="text-[11px] text-[#64748B] flex items-center justify-center gap-1.5 font-medium">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                          Aguardando leitura do QR Code pelo celular...
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2 text-[#64748B]">
                        <QrCode className="w-16 h-16 text-[#CBD5E1] mx-auto" />
                        <p className="text-xs">Clique no botão para gerar o QR Code da UAZAPI</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ABA PAIRING CODE */}
              {activeTab === 'pairing' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                  <div className="space-y-3 text-xs">
                    <h4 className="font-bold text-[#0F172A] text-sm">Pareamento Remoto por Código:</h4>
                    <p className="text-[#64748B] leading-relaxed">
                      Ideal quando o aparelho está remoto com outro membro da equipe. Digite o número com DDD para gerar o código de 8 dígitos.
                    </p>

                    <div className="space-y-1.5">
                      <label className="block font-semibold text-[#475569]">Telefone do WhatsApp (com DDD)</label>
                      <input
                        type="tel"
                        value={phoneToPair}
                        onChange={(e) => setPhoneToPair(e.target.value)}
                        placeholder="Ex: 41 99233-2996"
                        className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl px-3.5 py-2 text-xs font-mono text-[#0F172A] focus:outline-none focus:border-[#0050FF]"
                      />
                    </div>

                    <div className="pt-2">
                      <button
                        onClick={() => handleGenerateConnection(false)}
                        disabled={connecting || !phoneToPair}
                        className="px-5 py-2.5 rounded-xl font-bold bg-[#0050FF] hover:bg-[#0040D6] text-white text-xs shadow-xs flex items-center gap-2 cursor-pointer transition disabled:opacity-50"
                      >
                        {connecting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Smartphone className="w-4 h-4" />}
                        <span>Gerar Código de 8 Dígitos</span>
                      </button>
                    </div>
                  </div>

                  <div className="p-6 bg-[#F8FAFC] border border-[#CBD5E1] rounded-2xl flex flex-col items-center justify-center min-h-[260px] text-center">
                    {pairingCode ? (
                      <div className="space-y-4">
                        <p className="text-xs font-bold text-[#0F172A]">Digite este código no seu WhatsApp:</p>
                        <div className="px-6 py-3 bg-white border border-[#CBD5E1] rounded-xl shadow-xs">
                          <span className="font-mono text-2xl font-extrabold tracking-widest text-[#0050FF]">
                            {pairingCode}
                          </span>
                        </div>

                        <button
                          onClick={copyPairingCode}
                          className="px-4 py-2 rounded-xl text-xs font-bold bg-white border border-[#CBD5E1] text-[#0F172A] hover:bg-[#F8FAFC] shadow-xs flex items-center gap-1.5 mx-auto cursor-pointer"
                        >
                          {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{copied ? 'Copiado!' : 'Copiar Código'}</span>
                        </button>

                        <p className="text-[11px] text-[#64748B]">
                          No WhatsApp: Aparelhos Conectados &gt; Conectar com número de telefone.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2 text-[#64748B]">
                        <Smartphone className="w-16 h-16 text-[#CBD5E1] mx-auto" />
                        <p className="text-xs">Insira o número e gere o código de pareamento</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* MODAL: CRIAR NOVA INSTÂNCIA */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[#E2E8F0] rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
              <h3 className="text-sm font-bold text-[#0F172A] flex items-center gap-2">
                <Plus className="w-4 h-4 text-[#0050FF]" />
                Criar Nova Instância WhatsApp
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-[#0F172A] font-bold text-sm"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <p className="text-[#64748B]">
                A nova instância será provisionada na UAZAPI com identificação oficial <b className="text-[#0050FF]">app.swiftsail</b> e vinculada a este workspace.
              </p>

              <div className="space-y-1.5">
                <label className="block font-bold text-[#475569]">Nome da Instância</label>
                <input
                  type="text"
                  value={newInstanceName}
                  onChange={(e) => setNewInstanceName(e.target.value)}
                  placeholder={`swiftsail-${clienteId.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
                  className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl px-3.5 py-2 text-xs font-mono text-[#0F172A] focus:outline-none focus:border-[#0050FF]"
                />
                <span className="text-[10px] text-[#94A3B8]">
                  Deixe em branco para usar o padrão automático do workspace.
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E2E8F0]">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-[#64748B] hover:bg-[#F8FAFC] cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleCreateInstance()}
                disabled={isCreating}
                className="bg-[#0050FF] hover:bg-[#0040D6] text-white px-5 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
              >
                {isCreating ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                <span>Provisionar Instância</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CONFIRMAR EXCLUSÃO DE INSTÂNCIA */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[#E2E8F0] rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#0F172A]">Excluir Instância WhatsApp</h3>
                <p className="text-xs text-[#64748B]">Esta ação é irreversível.</p>
              </div>
            </div>

            <p className="text-xs text-[#475569] leading-relaxed">
              Tem certeza que deseja deletar permanentemente a instância <b className="text-[#0F172A] font-mono">{showDeleteModal.name}</b>?
              Isso desconectará a sessão ativa e removerá as credenciais da UAZAPI.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E2E8F0]">
              <button
                onClick={() => setShowDeleteModal(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-[#64748B] hover:bg-[#F8FAFC] cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDeleteInstance(showDeleteModal)}
                disabled={isDeletingName === showDeleteModal.name}
                className="bg-rose-600 hover:bg-rose-700 text-white px-5 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
              >
                {isDeletingName === showDeleteModal.name ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Trash2 className="w-3.5 h-3.5" />
                )}
                <span>Sim, Excluir Instância</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
