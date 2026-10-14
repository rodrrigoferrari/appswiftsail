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
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface WhatsAppConnectFlowProps {
  clienteId?: string;
  onStatusChange?: (status: 'connected' | 'connecting' | 'disconnected', instanceData?: any) => void;
}

export function WhatsAppConnectFlow({ clienteId = 'swiftsail', onStatusChange }: WhatsAppConnectFlowProps) {
  const [status, setStatus] = useState<'connected' | 'connecting' | 'disconnected'>('disconnected');
  const [loading, setLoading] = useState<boolean>(true);
  const [connecting, setConnecting] = useState<boolean>(false);
  const [disconnecting, setDisconnecting] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'qrcode' | 'pairing'>('qrcode');

  // Connection artifacts
  const [qrCode, setQrCode] = useState<string>('');
  const [pairingCode, setPairingCode] = useState<string>('');
  const [phoneToPair, setPhoneToPair] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [instanceInfo, setInstanceInfo] = useState<any>(null);

  const pollTimerRef = useRef<NodeJS.Timeout | null>(null);

  const checkStatus = async () => {
    try {
      const res = await fetch(`/api/whatsapp/status?cliente_id=${encodeURIComponent(clienteId)}`);
      if (!res.ok) throw new Error(`Status ${res.status}`);
      const data = await res.json();

      const isConnected = data.connected === true || data.status === 'connected';
      const newStatus = isConnected ? 'connected' : data.status === 'connecting' ? 'connecting' : 'disconnected';

      setStatus(newStatus);
      setInstanceInfo(data.instance || null);

      if (isConnected) {
        setQrCode('');
        setPairingCode('');
        setConnecting(false);
      }

      if (onStatusChange) {
        onStatusChange(newStatus, data.instance);
      }
      return data;
    } catch {
      return null;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkStatus();

    const intervalTime = qrCode || pairingCode || status === 'connecting' || connecting ? 2000 : 10000;
    pollTimerRef.current = setInterval(() => {
      checkStatus();
    }, intervalTime);

    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, [qrCode, pairingCode, status, connecting, clienteId]);

  const handleGenerateConnection = async (force = false) => {
    setConnecting(true);
    setErrorMsg(null);
    setQrCode('');
    setPairingCode('');

    try {
      const body: any = {
        cliente_id: clienteId,
        forceReconnect: force,
      };

      if (activeTab === 'pairing') {
        const cleanPhone = phoneToPair.replace(/\D/g, '');
        if (cleanPhone.length < 10) {
          setErrorMsg('Digite um número de telefone válido com DDD (ex: 11988887777).');
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
        setStatus('connected');
        setInstanceInfo(data.instance || null);
        setConnecting(false);
        return;
      }

      if (data.qrcode) {
        setQrCode(data.qrcode);
        setStatus('connecting');
      }

      if (data.pairingCode) {
        setPairingCode(data.pairingCode);
        setStatus('connecting');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro de comunicação com o servidor.');
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm('Deseja realmente desconectar esta instância do WhatsApp?')) return;
    setDisconnecting(true);
    try {
      await fetch('/api/whatsapp/disconnect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cliente_id: clienteId }),
      });
      setStatus('disconnected');
      setQrCode('');
      setPairingCode('');
      setInstanceInfo(null);
      await checkStatus();
    } catch {
      alert('Falha ao desconectar instância.');
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

  return (
    <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-xs space-y-6 select-none font-sans">
      {/* Header Status Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E2E8F0] pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                status === 'connected'
                  ? 'bg-emerald-500 animate-pulse'
                  : status === 'connecting'
                  ? 'bg-amber-500 animate-ping'
                  : 'bg-rose-500'
              }`}
            />
            <h2 className="text-base font-bold text-[#0F172A]">
              Conexão WhatsApp (UAZAPI Highlander)
            </h2>
          </div>
          <p className="text-xs text-[#64748B]">
            Pareie via QR Code ou Código de 8 Dígitos para ligações de voz e automações vinculadas a <b className="text-[#0F172A]">{clienteId}</b>.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`px-3 py-1 rounded-full text-xs font-bold border ${
              status === 'connected'
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : status === 'connecting'
                ? 'bg-amber-50 text-amber-700 border-amber-200'
                : 'bg-rose-50 text-rose-700 border-rose-200'
            }`}
          >
            {status === 'connected' ? 'Online & Conectado' : status === 'connecting' ? 'Aguardando Pareamento...' : 'Desconectado'}
          </span>

          <button
            onClick={() => checkStatus()}
            disabled={loading}
            className="p-2 rounded-xl bg-[#F8FAFC] border border-[#CBD5E1] text-[#64748B] hover:text-[#0050FF] hover:bg-white shadow-xs cursor-pointer transition"
            title="Atualizar Status"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[#0050FF]' : ''}`} />
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="p-3.5 rounded-xl text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Se JÁ Conectado */}
      {status === 'connected' ? (
        <div className="space-y-4">
          <div className="p-5 rounded-2xl bg-[#F8FAFC] border border-emerald-200 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-[#0F172A]">WhatsApp Conectado e Operacional</p>
                  <p className="text-[11px] text-[#64748B]">
                    Instância pronta para ligações de voz e sincronização com Kommo CRM
                  </p>
                </div>
              </div>

              <button
                onClick={handleDisconnect}
                disabled={disconnecting}
                className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 shadow-xs flex items-center gap-1.5 cursor-pointer transition"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Desconectar</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-[#E2E8F0] text-xs">
              <div>
                <span className="text-[#64748B] text-[10px] uppercase font-bold">Identificador da Instância</span>
                <p className="font-mono font-bold text-[#0F172A] mt-0.5">
                  {instanceInfo?.name || `swiftsail-${clienteId}`}
                </p>
              </div>
              <div>
                <span className="text-[#64748B] text-[10px] uppercase font-bold">Perfil / Telefone</span>
                <p className="font-mono font-bold text-emerald-700 mt-0.5">
                  {instanceInfo?.owner || instanceInfo?.profileName || 'Multi-Device Ativo'}
                </p>
              </div>
              <div>
                <span className="text-[#64748B] text-[10px] uppercase font-bold">Estratégia Highlander</span>
                <p className="font-bold text-[#0050FF] mt-0.5">List-First & Anti-Zumbi</p>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={() => handleGenerateConnection(true)}
              disabled={connecting}
              className="text-xs font-semibold text-[#64748B] hover:text-[#0050FF] underline cursor-pointer"
            >
              Forçar Nova Conexão / Gerar Novo QR Code
            </button>
          </div>
        </div>
      ) : (
        /* Se NÃO Conectado: Abas QR Code e Pairing Code */
        <div className="space-y-5">
          {/* Tabs */}
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

          {/* TAB 1: QR CODE */}
          {activeTab === 'qrcode' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
              <div className="space-y-3 text-xs">
                <h3 className="font-bold text-[#0F172A] text-sm">Passo a passo no seu celular:</h3>
                <ol className="list-decimal list-inside space-y-2 text-[#475569] leading-relaxed">
                  <li>Abra o WhatsApp no aparelho que será conectado.</li>
                  <li>Acesse <b>Configurações</b> (ou três pontinhos no Android).</li>
                  <li>Toque em <b>Aparelhos Conectados</b> e depois em <b>Conectar um Aparelho</b>.</li>
                  <li>Aponte a câmera para o QR Code ao lado.</li>
                </ol>

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
                      Polling ativo: detectando conexão automaticamente...
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

          {/* TAB 2: PAIRING CODE (8 DÍGITOS) */}
          {activeTab === 'pairing' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
              <div className="space-y-3 text-xs">
                <h3 className="font-bold text-[#0F172A] text-sm">Pareamento Remoto por Código:</h3>
                <p className="text-[#64748B] leading-relaxed">
                  Ideal quando o aparelho está com outra pessoa ou remoto. Basta digitar o número para receber uma notificação ou inserir o código no WhatsApp.
                </p>

                <div className="space-y-2">
                  <label className="block font-semibold text-[#475569]">Telefone do WhatsApp (com DDD)</label>
                  <input
                    type="tel"
                    value={phoneToPair}
                    onChange={(e) => setPhoneToPair(e.target.value)}
                    placeholder="Ex: 11 98765-4321"
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

              {/* Pairing Code Card */}
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
  );
}
