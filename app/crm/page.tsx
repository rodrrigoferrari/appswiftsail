'use client';

import React, { useState, useEffect } from 'react';
import { useTenant } from '@/components/TenantProvider';
import {
  KanbanSquare,
  DollarSign,
  Clock,
  Sparkles,
  ArrowRight,
  Filter,
  Users,
  Target,
  Layers,
  Building,
  RefreshCw,
  AlertCircle,
  ExternalLink,
  Zap,
} from 'lucide-react';
import Link from 'next/link';

export default function CRMPage() {
  const { selectedClientId, activeClient, dateRange, viewMode } = useTenant();
  const isAggregated = viewMode === 'admin' || selectedClientId === 'ALL';
  const clientName = isAggregated
    ? 'Painel Master — Swiftsail HQ'
    : (activeClient?.nome === 'EMOVERE' ? 'Emovere' : activeClient?.nome) || selectedClientId;

  const [loading, setLoading] = useState(false);
  const [kommoData, setKommoData] = useState<any>(null);
  const [unavailable, setUnavailable] = useState<string | null>(null);

  useEffect(() => {
    async function fetchKommoData() {
      setLoading(true);
      try {
        const targetId = isAggregated ? 'ALL' : selectedClientId;
        const res = await fetch(
          `/api/clientes/${targetId}/kommo?from=${dateRange.start}&to=${dateRange.end}`
        );
        const data = await res.json();
        if (data.success) {
          setKommoData(data);
          setUnavailable(null);
        } else {
          setKommoData(null);
          setUnavailable(data.motivo || data.error || 'Fonte de dados indisponível');
        }
      } catch (err) {
        console.error('Error fetching Kommo CRM data:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchKommoData();
  }, [selectedClientId, isAggregated, dateRange]);

  const totalLeads = Number(kommoData?.total_leads || 0);
  const valorTotal = Number(kommoData?.valor_total || 0);
  const porOrigem = kommoData?.por_origem || [];
  const porCampanha = kommoData?.por_campanha || [];
  const porEtapa = kommoData?.por_etapa || [];
  const resumoStatus = kommoData?.resumo_status || {
    aberta: { total: 0, valor: 0 },
    ganho: { total: 0, valor: 0 },
    perda: { total: 0, valor: 0 },
  };

  const formatBRL = (val: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-card p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 border-cyan-500/30 bg-gradient-to-r from-slate-900/90 via-slate-900/60 to-cyan-950/20">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 uppercase tracking-wider">
              Atribuição Analítica & Pipeline CRM
            </span>
            <span className="text-xs text-slate-400 font-mono">| {dateRange.label}</span>
          </div>
          <div className="flex items-center gap-2">
            <Building className="w-5 h-5 text-cyan-400" />
            <h2 className="text-xl font-black text-white">{clientName}</h2>
          </div>
          <p className="text-xs text-slate-400">
            Rastreamento de ponta a ponta dos leads analíticos gerados pelas campanhas de tráfego pago no Kommo CRM.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border flex items-center gap-1.5 ${
              unavailable
                ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${unavailable ? 'bg-amber-400' : 'bg-emerald-400 animate-pulse'}`} />
            <span>{unavailable ? 'Kommo: fonte indisponível' : 'Kommo: dados lidos do Cleide'}</span>
          </span>
        </div>
      </div>

      {unavailable && (
        <div className="p-4 rounded-xl text-xs font-semibold flex items-start gap-2 border bg-amber-500/10 text-amber-300 border-amber-500/30">
          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <span>Não foi possível ler os leads do Kommo no Cleide. {unavailable}</span>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card p-5 space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Total de Leads</span>
            <Users className="w-4 h-4 text-cyan-400" />
          </div>
          <p className="text-2xl font-black text-white">
            {loading ? <RefreshCw className="w-5 h-5 animate-spin text-cyan-400" /> : unavailable ? '—' : totalLeads}
          </p>
          <p className="text-[10px] text-slate-400">Atribuídos no período</p>
        </div>

        <div className="glass-card p-5 space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Valor do Pipeline</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-black text-emerald-400">
            {loading ? <RefreshCw className="w-5 h-5 animate-spin text-cyan-400" /> : unavailable ? '—' : formatBRL(valorTotal)}
          </p>
          <p className="text-[10px] text-slate-400">Volume total em negociação</p>
        </div>

        <div className="glass-card p-5 space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Vendas Ganhas</span>
            <Target className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-black text-emerald-400">
            {loading ? <RefreshCw className="w-5 h-5 animate-spin text-cyan-400" /> : unavailable ? '—' : resumoStatus.ganho.total}
          </p>
          <p className="text-[10px] text-slate-400">{formatBRL(resumoStatus.ganho.valor)} convertidos</p>
        </div>

        <div className="glass-card p-5 space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Em Aberto / Perdas</span>
            <KanbanSquare className="w-4 h-4 text-purple-400" />
          </div>
          <p className="text-2xl font-black text-white">
            {loading ? <RefreshCw className="w-5 h-5 animate-spin text-cyan-400" /> : unavailable ? '—' : `${resumoStatus.aberta.total} / ${resumoStatus.perda.total}`}
          </p>
          <p className="text-[10px] text-slate-400">
            {formatBRL(resumoStatus.aberta.valor)} ativos
          </p>
        </div>
      </div>

      {/* Funil de Etapas do Pipeline */}
      {porEtapa.length > 0 && (
        <div className="glass-card p-6 space-y-4">
          <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <KanbanSquare className="w-4 h-4 text-cyan-400" />
                Funil de Vendas — Etapas do Pipeline (Kommo)
              </h3>
              <p className="text-xs text-slate-400">Distribuição real dos leads por etapa com mapeamento analítico</p>
            </div>
            <span className="text-xs text-slate-400 font-mono">{porEtapa.length} etapas mapeadas</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {porEtapa.map((e: any, idx: number) => {
              const badgeColor =
                e.conta_como === 'ganho'
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  : e.conta_como === 'perda'
                  ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                  : 'bg-blue-500/10 text-blue-400 border-blue-500/30';

              const percent = totalLeads > 0 ? ((e.total / totalLeads) * 100).toFixed(1) : '0';

              return (
                <div key={idx} className="p-3.5 rounded-xl border border-slate-800/80 bg-slate-900/40 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-200 truncate max-w-[170px]" title={e.etapa_nome}>
                      {e.etapa_nome}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${badgeColor}`}>
                      {e.conta_como}
                    </span>
                  </div>
                  <div className="flex items-baseline justify-between text-xs">
                    <span className="text-slate-400 text-[11px] truncate max-w-[130px]">{e.pipeline_nome}</span>
                    <span className="font-bold text-white">
                      {e.total} leads <span className="text-slate-400 font-normal">({percent}%)</span>
                    </span>
                  </div>
                  {e.valor > 0 && (
                    <div className="text-[11px] text-emerald-400/90 font-mono text-right">
                      {formatBRL(e.valor)}
                    </div>
                  )}
                  <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        e.conta_como === 'ganho'
                          ? 'bg-emerald-400'
                          : e.conta_como === 'perda'
                          ? 'bg-rose-400'
                          : 'bg-blue-400'
                      }`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Origin & Campaign Attribution Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Atribuição por Origem */}
        <div className="glass-card p-6 space-y-4">
          <div className="border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Target className="w-4 h-4 text-blue-400" />
              Distribuição por Origem / Canal
            </h3>
            <p className="text-xs text-slate-400">Canais de entrada registrados no Kommo (UTMs / Fontes)</p>
          </div>

          {porOrigem.length === 0 ? (
            <div className="p-8 text-center space-y-2 border border-dashed border-slate-800 rounded-xl text-slate-400 text-xs">
              <p className="font-bold text-slate-300">Nenhum lead com origem registrada para este período</p>
              <p className="text-[11px]">Os dados são consolidados automaticamente pela sincronização do Cleide.</p>
            </div>
          ) : (
            <div className="space-y-3 pt-1">
              {porOrigem.map((item: any) => {
                const percent = totalLeads > 0 ? ((item.total / totalLeads) * 100).toFixed(1) : 0;
                return (
                  <div key={item.origem} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-bold text-slate-200">{item.origem}</span>
                      <span className="text-slate-400 font-mono">
                        {item.total} leads ({percent}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-800">
                      <div
                        className="bg-gradient-to-r from-blue-500 to-cyan-400 h-full rounded-full"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Atribuição por Campanha */}
        <div className="glass-card p-6 space-y-4">
          <div className="border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              Performance por Campanha no CRM
            </h3>
            <p className="text-xs text-slate-400">Leads mapeados por campanha ou anúncio</p>
          </div>

          {porCampanha.length === 0 ? (
            <div className="p-8 text-center space-y-2 border border-dashed border-slate-800 rounded-xl text-slate-400 text-xs">
              <p className="font-bold text-slate-300">Nenhuma campanha mapeada para este cliente no período</p>
              <p className="text-[11px]">As campanhas são identificadas via UTM Campaign e ID de anúncio.</p>
            </div>
          ) : (
            <div className="space-y-3 pt-1">
              {porCampanha.map((item: any) => {
                const percent = totalLeads > 0 ? ((item.total / totalLeads) * 100).toFixed(1) : 0;
                return (
                  <div key={item.campanha} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-bold text-slate-200 truncate max-w-[200px]">{item.campanha}</span>
                      <span className="text-slate-400 font-mono">
                        {item.total} leads ({percent}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-800">
                      <div
                        className="bg-gradient-to-r from-cyan-500 to-emerald-400 h-full rounded-full"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
