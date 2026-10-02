'use client';

import React, { useState, useEffect } from 'react';
import { useTenant } from '@/components/TenantProvider';
import {
  Building,
  KanbanSquare,
  Save,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Eye,
  EyeOff,
  Radio,
  QrCode,
  FolderTree,
  MessageSquare,
  Zap,
  ExternalLink,
} from 'lucide-react';

export default function ClientCredentialsPage() {
  const { clients, activeClient, selectedClientId, setSelectedClientId, activeClientAdAccounts } = useTenant();

  const [subdomain, setSubdomain] = useState('');
  const [token, setToken] = useState('');
  const [pipelineId, setPipelineId] = useState('');
  const [showToken, setShowToken] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const clientName = activeClient?.nome || selectedClientId;

  // Load client settings on change
  useEffect(() => {
    if (selectedClientId && selectedClientId !== 'ALL') {
      setSubdomain(selectedClientId.toLowerCase().replace('_', ''));
      setToken('');
      setPipelineId('');
    }
  }, [selectedClientId]);

  const handleSave = async () => {
    if (!selectedClientId || selectedClientId === 'ALL') {
      alert('Selecione um cliente específico.');
      return;
    }
    setIsSaving(true);
    setFeedback(null);
    try {
      const res = await fetch('/api/credentials/client', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cliente_id: selectedClientId,
          kommo_subdomain: subdomain,
          kommo_token: token,
          kommo_pipeline_id: pipelineId,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setFeedback({ type: 'success', text: data.message });
      } else {
        setFeedback({ type: 'error', text: data.error || 'Erro ao salvar.' });
      }
    } catch {
      setFeedback({ type: 'error', text: 'Falha ao salvar credenciais do cliente.' });
    } finally {
      setIsSaving(false);
    }
  };

  const metaAccounts = activeClientAdAccounts.filter((a) => a.plataforma === 'meta');
  const googleAccounts = activeClientAdAccounts.filter((a) => a.plataforma === 'google');

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="glass-card p-6 border-amber-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900/90 via-slate-900/60 to-amber-950/20">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 uppercase tracking-wider">
              Nível Cliente Multi-Tenant
            </span>
          </div>
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            <Building className="w-5 h-5 text-amber-400" />
            Configurações & Kommo CRM do Cliente
          </h2>
          <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
            Aqui você configura as credenciais específicas deste cliente (Kommo CRM individual). O cliente não precisa de chaves do Meta ou Google Ads, pois já são gerenciadas pelo seu BM/MCC Admin.
          </p>
        </div>

        {/* Client Dropdown */}
        <div className="flex items-center gap-2 bg-slate-950/80 p-2 rounded-xl border border-slate-800">
          <span className="text-xs font-semibold text-slate-400">Cliente:</span>
          <select
            value={selectedClientId}
            onChange={(e) => setSelectedClientId(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs font-bold text-white focus:border-amber-500 focus:outline-none min-w-[200px]"
          >
            {clients.map((c) => (
              <option key={c.cliente_id} value={c.cliente_id}>
                {c.nome} ({c.cliente_id})
              </option>
            ))}
          </select>
        </div>
      </div>

      {feedback && (
        <div
          className={`p-4 rounded-xl text-xs font-semibold flex items-center gap-2 border ${
            feedback.type === 'success'
              ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
              : 'bg-rose-500/10 text-rose-300 border-rose-500/30'
          }`}
        >
          {feedback.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <AlertCircle className="w-4 h-4 text-rose-400" />}
          <span>{feedback.text}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Side: Kommo CRM Form */}
        <div className="lg:col-span-7 glass-card p-6 space-y-5">
          <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <KanbanSquare className="w-4 h-4 text-amber-400" />
                Kommo CRM de {clientName}
              </h3>
              <p className="text-xs text-slate-400">Sincronização do funil de vendas comercial</p>
            </div>

            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 flex items-center gap-1.5 transition-colors shadow-lg shadow-amber-500/20"
            >
              {isSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              Salvar Kommo do Cliente
            </button>
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Subdomínio Kommo do Cliente</label>
              <input
                type="text"
                value={subdomain}
                onChange={(e) => setSubdomain(e.target.value)}
                placeholder="ex: dabol, adriatica (sem .kommo.com)"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:border-amber-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Long-Lived Access Token (Kommo)</label>
              <div className="relative">
                <input
                  type={showToken ? 'text' : 'password'}
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="Insira o token de longa duração gerado no Kommo do cliente"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 pr-10 text-white font-mono focus:border-amber-500 focus:outline-none"
                />
                <button
                  onClick={() => setShowToken(!showToken)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-white"
                >
                  {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">ID do Pipeline Principal</label>
              <input
                type="text"
                value={pipelineId}
                onChange={(e) => setPipelineId(e.target.value)}
                placeholder="ex: 889210"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:border-amber-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Right Side: Resources Managed by Admin BM/MCC */}
        <div className="lg:col-span-5 glass-card p-6 space-y-4">
          <div className="border-b border-slate-800 pb-3">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Zap className="w-4 h-4 text-cyan-400" />
              Recursos Atribuídos a {clientName}
            </h3>
            <p className="text-[11px] text-slate-400">Gerenciados pela infraestrutura da Swiftsail</p>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
              <span className="text-[10px] text-slate-400 uppercase font-bold flex items-center gap-1.5">
                <MessageSquare className="w-3 h-3 text-emerald-400" /> Grupo WhatsApp Vinculado
              </span>
              <p className="font-mono text-cyan-300 truncate">
                {activeClient?.grupo_whatsapp_id || 'Nenhum grupo vinculado no Supabase'}
              </p>
            </div>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
              <span className="text-[10px] text-slate-400 uppercase font-bold flex items-center gap-1.5">
                <FolderTree className="w-3 h-3 text-amber-400" /> Google Drive Folder ID
              </span>
              <p className="font-mono text-slate-300 truncate">
                {activeClient?.drive_folder_id || 'Nenhuma pasta vinculada'}
              </p>
            </div>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
              <span className="text-[10px] text-slate-400 uppercase font-bold flex items-center gap-1.5">
                <Zap className="w-3 h-3 text-blue-400" /> Contas de Anúncio no seu BM / MCC
              </span>
              <div className="space-y-1 font-mono text-[11px]">
                {metaAccounts.length === 0 && googleAccounts.length === 0 ? (
                  <p className="text-slate-500">Nenhuma conta mapeada</p>
                ) : (
                  <>
                    {metaAccounts.map((a) => (
                      <div key={a.id} className="text-blue-300 truncate">
                        • [Meta] {a.account_name} ({a.account_id})
                      </div>
                    ))}
                    {googleAccounts.map((a) => (
                      <div key={a.id} className="text-cyan-300 truncate">
                        • [Google] {a.account_name} ({a.account_id})
                      </div>
                    ))}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
