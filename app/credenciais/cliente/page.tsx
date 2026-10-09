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
    <div className="space-y-6 font-sans select-none">
      {/* Top Banner (Estilo Asaas: Branco Limpo, Borda Fina, Alta Legibilidade) */}
      <div className="bg-white border border-[#E2E8F0] p-6 rounded-2xl shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-[#EFF4FF] text-[#0050FF] border border-[#BFDBFE] uppercase tracking-wider">
              Workspace & Governança do Cliente
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#0F172A] flex items-center gap-2.5">
            <Building className="w-6 h-6 text-[#0050FF]" />
            Configurações & Acessos de {clientName}
          </h1>
          <p className="text-xs text-[#64748B] max-w-2xl leading-relaxed">
            Aqui você gerencia o Kommo CRM individual, a equipe com acesso a este workspace e os recursos atribuídos pela agência Swiftsail.
          </p>
        </div>

        {/* Client Dropdown */}
        <div className="flex items-center gap-2 bg-[#F8FAFC] p-2 rounded-xl border border-[#E2E8F0] shadow-xs">
          <span className="text-xs font-semibold text-[#64748B]">Cliente:</span>
          <select
            value={selectedClientId}
            onChange={(e) => setSelectedClientId(e.target.value)}
            className="bg-white border border-[#CBD5E1] rounded-lg px-3 py-1.5 text-xs font-bold text-[#0F172A] focus:border-[#0050FF] focus:outline-none min-w-[200px] cursor-pointer shadow-xs"
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
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : 'bg-rose-50 text-rose-700 border-rose-200'
          }`}
        >
          {feedback.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-rose-600" />}
          <span>{feedback.text}</span>
        </div>
      )}

      {/* Tabs (Estilo Pílulas Asaas) */}
      <div className="flex items-center gap-2 p-1 bg-[#F1F5F9] border border-[#E2E8F0] rounded-xl w-fit">
        <button
          onClick={() => setActiveTab('crm')}
          className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'crm'
              ? 'bg-white text-[#0050FF] shadow-xs border border-[#E2E8F0]'
              : 'text-[#64748B] hover:text-[#0F172A]'
          }`}
        >
          <KanbanSquare className="w-3.5 h-3.5" />
          Kommo CRM & Integrações
        </button>

        <button
          onClick={() => setActiveTab('team')}
          className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'team'
              ? 'bg-white text-[#0050FF] shadow-xs border border-[#E2E8F0]'
              : 'text-[#64748B] hover:text-[#0F172A]'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          Equipe com Acesso ({clientUsers.length + clientInvites.length})
        </button>
      </div>

      {activeTab === 'crm' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Side: Kommo CRM Form */}
          <div className="lg:col-span-7 bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-xs space-y-5">
            <div className="border-b border-[#F1F5F9] pb-3 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-[#0F172A] flex items-center gap-2">
                  <KanbanSquare className="w-4 h-4 text-[#0050FF]" />
                  Kommo CRM de {clientName}
                </h3>
                <p className="text-xs text-[#64748B]">Sincronização do funil de vendas comercial</p>
              </div>

              <button
                onClick={handleSave}
                disabled={isSaving}
                className="bg-[#0050FF] hover:bg-[#0040D6] text-white px-5 py-2.5 rounded-full font-semibold text-xs flex items-center gap-2 shadow-xs transition-all active:scale-95 cursor-pointer disabled:opacity-50"
              >
                {isSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                <span>Salvar Kommo</span>
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-[#475569] font-semibold mb-1">Subdomínio Kommo do Cliente</label>
                <input
                  type="text"
                  value={subdomain}
                  onChange={(e) => setSubdomain(e.target.value)}
                  placeholder="ex: dabol, adriatica (sem .kommo.com)"
                  className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-3.5 py-2 text-[#0F172A] font-mono focus:border-[#0050FF] focus:bg-white focus:outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-[#475569] font-semibold mb-1">Long-Lived Access Token (Kommo)</label>
                <div className="relative">
                  <input
                    type={showToken ? 'text' : 'password'}
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    placeholder="Insira o token de longa duração gerado no Kommo do cliente"
                    className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-3.5 py-2 pr-10 text-[#0F172A] font-mono focus:border-[#0050FF] focus:bg-white focus:outline-none transition-colors"
                  />
                  <button
                    onClick={() => setShowToken(!showToken)}
                    className="absolute right-3 top-2.5 text-[#94A3B8] hover:text-[#0F172A] cursor-pointer"
                  >
                    {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[#475569] font-semibold mb-1">ID do Pipeline Principal</label>
                <input
                  type="text"
                  value={pipelineId}
                  onChange={(e) => setPipelineId(e.target.value)}
                  placeholder="ex: 889210"
                  className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-3.5 py-2 text-[#0F172A] font-mono focus:border-[#0050FF] focus:bg-white focus:outline-none transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Right Side: Resources Managed by Admin BM/MCC (Cartão Branco Asaas) */}
          <div className="lg:col-span-5 bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-xs space-y-4">
            <div className="border-b border-[#F1F5F9] pb-3">
              <h3 className="text-xs font-bold text-[#0F172A] uppercase tracking-wider flex items-center gap-2">
                <Zap className="w-4 h-4 text-[#0050FF]" />
                Recursos Atribuídos pela Agência
              </h3>
              <p className="text-[11px] text-[#64748B]">Gerenciados pela infraestrutura da Swiftsail</p>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3.5 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0] space-y-1 shadow-xs">
                <span className="text-[10px] text-[#64748B] uppercase font-bold flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-emerald-600" /> Grupo WhatsApp Vinculado
                </span>
                <p className="font-mono text-[#0F172A] font-semibold truncate">
                  {activeClient?.grupo_whatsapp_id || 'Nenhum grupo vinculado no Supabase'}
                </p>
              </div>

              <div className="p-3.5 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0] space-y-1 shadow-xs">
                <span className="text-[10px] text-[#64748B] uppercase font-bold flex items-center gap-1.5">
                  <FolderTree className="w-3.5 h-3.5 text-amber-600" /> Google Drive Folder ID
                </span>
                <p className="font-mono text-[#0F172A] font-semibold truncate">
                  {activeClient?.drive_folder_id || 'Nenhuma pasta vinculada'}
                </p>
              </div>

              <div className="p-3.5 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0] space-y-2 shadow-xs">
                <span className="text-[10px] text-[#64748B] uppercase font-bold flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-[#0050FF]" /> Contas de Anúncio no BM / MCC Swiftsail
                </span>
                <div className="space-y-1 font-mono text-[11px]">
                  {metaAccounts.length === 0 && googleAccounts.length === 0 ? (
                    <p className="text-[#94A3B8]">Nenhuma conta mapeada</p>
                  ) : (
                    <>
                      {metaAccounts.map((a) => (
                        <div key={a.id} className="text-[#0050FF] truncate">
                          • [Meta] {a.account_name} ({a.account_id})
                        </div>
                      ))}
                      {googleAccounts.map((a) => (
                        <div key={a.id} className="text-sky-700 truncate">
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
        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#F1F5F9] pb-4">
            <div>
              <h3 className="text-sm font-bold text-[#0F172A] flex items-center gap-2">
                <Users className="w-4 h-4 text-[#0050FF]" />
                Membros da Empresa com Acesso a {clientName}
              </h3>
              <p className="text-xs text-[#64748B]">
                Usuários com login autorizado neste workspace específico
              </p>
            </div>

            <Link
              href="/admin/usuarios"
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#EFF4FF] hover:bg-[#E0EAFF] text-[#0050FF] border border-[#BFDBFE] flex items-center gap-1.5 transition-all shadow-xs self-start sm:self-auto"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Convidar Membro para este Cliente</span>
            </Link>
          </div>

          <div className="space-y-3">
            {clientUsers.length === 0 && clientInvites.length === 0 ? (
              <div className="p-8 text-center bg-[#F8FAFC] rounded-xl border border-[#E2E8F0] text-[#64748B] text-xs">
                Nenhum usuário cadastrado para este cliente ainda. Clique no botão acima para enviar o primeiro convite.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {clientUsers.map((u) => (
                  <div
                    key={u.id}
                    className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-between shadow-xs"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-[#EFF4FF] border border-[#BFDBFE] flex items-center justify-center text-[#0050FF] font-bold text-xs">
                        {u.nome.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-bold text-[#0F172A] text-xs">{u.nome}</p>
                        <p className="text-[11px] text-[#64748B] font-mono">{u.email}</p>
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className="px-2 py-0.5 rounded bg-white text-[10px] font-semibold text-[#475569] border border-[#E2E8F0] capitalize">
                            {u.role.replace('_', ' ')}
                          </span>
                        </div>
                      </div>
                    </div>

                    <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Ativo
                    </span>
                  </div>
                ))}

                {clientInvites.map((i) => (
                  <div
                    key={i.id}
                    className="p-4 rounded-xl bg-[#F8FAFC] border border-amber-200 flex items-center justify-between shadow-xs"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700 font-bold text-xs">
                        {i.nome.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-bold text-[#0F172A] text-xs">{i.nome}</p>
                        <p className="text-[11px] text-[#64748B] font-mono">{i.email}</p>
                        <p className="text-[10px] text-amber-600 font-semibold mt-0.5">Convite Pendente</p>
                      </div>
                    </div>

                    <Link
                      href="/admin/usuarios"
                      className="px-2.5 py-1 rounded-lg bg-white border border-[#E2E8F0] text-[10px] font-bold text-[#0050FF] hover:bg-[#F8FAFC] shadow-xs"
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
