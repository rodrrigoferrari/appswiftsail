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
  FolderTree,
  MessageSquare,
  Zap,
  Users,
  UserPlus,
  Copy,
  Check,
  Lock,
  Unlock,
} from 'lucide-react';
import Link from 'next/link';

export default function ClientCredentialsPage() {
  const { clients, activeClient, selectedClientId, setSelectedClientId, activeClientAdAccounts, users, invites } = useTenant();

  const [activeTab, setActiveTab] = useState<'crm' | 'team'>('crm');
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
  const clientUsers = users.filter((u) => u.cliente_id === selectedClientId);
  const clientInvites = invites.filter((i) => i.cliente_id === selectedClientId);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="glass-card p-6 border-cyan-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900/90 via-slate-900/60 to-cyan-950/20">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 uppercase tracking-wider">
              Workspace & Governança do Cliente
            </span>
          </div>
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            <Building className="w-5 h-5 text-cyan-400" />
            Configurações & Acessos de {clientName}
          </h2>
          <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
            Aqui você gerencia o Kommo CRM individual, a equipe com acesso a este workspace e os recursos atribuídos pela agência Swiftsail.
          </p>
        </div>

        {/* Client Dropdown */}
        <div className="flex items-center gap-2 bg-slate-950/80 p-2 rounded-xl border border-slate-800">
          <span className="text-xs font-semibold text-slate-400">Cliente:</span>
          <select
            value={selectedClientId}
            onChange={(e) => setSelectedClientId(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs font-bold text-white focus:border-cyan-500 focus:outline-none min-w-[200px]"
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

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
        <button
          onClick={() => setActiveTab('crm')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'crm'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <KanbanSquare className="w-3.5 h-3.5" />
          Kommo CRM & Integrações
        </button>

        <button
          onClick={() => setActiveTab('team')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'team'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          Equipe com Acesso ({clientUsers.length + clientInvites.length})
        </button>
      </div>

      {activeTab === 'crm' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Side: Kommo CRM Form */}
          <div className="lg:col-span-7 glass-card p-6 space-y-5">
            <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <KanbanSquare className="w-4 h-4 text-cyan-400" />
                  Kommo CRM de {clientName}
                </h3>
                <p className="text-xs text-slate-400">Sincronização do funil de vendas comercial</p>
              </div>

              <button
                onClick={handleSave}
                disabled={isSaving}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white flex items-center gap-1.5 transition-colors shadow-lg shadow-cyan-500/20"
              >
                {isSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                Salvar Kommo
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
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:border-cyan-500 focus:outline-none"
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
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 pr-10 text-white font-mono focus:border-cyan-500 focus:outline-none"
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
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:border-cyan-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Right Side: Resources Managed by Admin BM/MCC */}
          <div className="lg:col-span-5 glass-card p-6 space-y-4">
            <div className="border-b border-slate-800 pb-3">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Zap className="w-4 h-4 text-cyan-400" />
                Recursos Atribuídos pela Agência
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
                  <Zap className="w-3 h-3 text-blue-400" /> Contas de Anúncio no BM / MCC Swiftsail
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
      ) : (
        /* Team Members Tab */
        <div className="glass-card p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-cyan-400" />
                Membros da Empresa com Acesso a {clientName}
              </h3>
              <p className="text-xs text-slate-400">
                Usuários com login autorizado neste workspace específico
              </p>
            </div>

            <Link
              href="/admin/usuarios"
              className="px-4 py-2 rounded-xl text-xs font-bold bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 flex items-center gap-1.5 transition-all self-start sm:self-auto"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Convidar Membro para este Cliente</span>
            </Link>
          </div>

          <div className="space-y-3">
            {clientUsers.length === 0 && clientInvites.length === 0 ? (
              <div className="p-8 text-center bg-slate-950/60 rounded-xl border border-slate-800 text-slate-500 text-xs">
                Nenhum usuário cadastrado para este cliente ainda. Clique no botão acima para enviar o primeiro convite.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {clientUsers.map((u) => (
                  <div
                    key={u.id}
                    className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-300 font-bold text-xs">
                        {u.nome.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-bold text-white text-xs">{u.nome}</p>
                        <p className="text-[11px] text-slate-400 font-mono">{u.email}</p>
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className="px-2 py-0.5 rounded bg-slate-900 text-[10px] font-bold text-slate-300 border border-slate-700 capitalize">
                            {u.role.replace('_', ' ')}
                          </span>
                        </div>
                      </div>
                    </div>

                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      Ativo
                    </span>
                  </div>
                ))}

                {clientInvites.map((i) => (
                  <div
                    key={i.id}
                    className="p-4 rounded-xl bg-slate-950/70 border border-amber-500/30 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-300 font-bold text-xs">
                        {i.nome.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-bold text-white text-xs">{i.nome}</p>
                        <p className="text-[11px] text-slate-400 font-mono">{i.email}</p>
                        <p className="text-[10px] text-amber-400 mt-0.5">Convite Pendente</p>
                      </div>
                    </div>

                    <Link
                      href="/admin/usuarios"
                      className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 text-[10px] font-bold text-cyan-400 hover:border-cyan-500/40"
                    >
                      Ver Link
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

