'use client';

import React, { useState } from 'react';
import { useTenant } from '@/components/TenantProvider';
import {
  KanbanSquare,
  User,
  Phone,
  DollarSign,
  MessageSquare,
  Clock,
  Sparkles,
  ArrowRight,
  Filter,
} from 'lucide-react';

export default function CRMPage() {
  const { activeClient } = useTenant();

  // Kanban Stage Columns
  const [stages, setStages] = useState([
    {
      id: 'novo',
      title: '1. Novos Leads WhatsApp',
      color: 'border-cyan-500/40 text-cyan-400',
      leads: [
        {
          id: 'lead-1',
          name: 'Guilherme Siqueira',
          phone: '+55 41 99876-1234',
          value: 'R$ 850.000',
          source: 'Meta Ads (Reels Vistta)',
          time: 'Há 12 min',
          status: 'Aguardando SDR',
        },
        {
          id: 'lead-2',
          name: 'Dra. Vanessa Martins',
          phone: '+55 41 98822-4411',
          value: 'R$ 1.200.000',
          source: 'Google Ads (Search Batel)',
          time: 'Há 45 min',
          status: 'Aguardando SDR',
        },
      ],
    },
    {
      id: 'qualificado',
      title: '2. Qualificados pelo SDR',
      color: 'border-blue-500/40 text-blue-400',
      leads: [
        {
          id: 'lead-3',
          name: 'Eduardo Albuquerque',
          phone: '+55 41 99111-9988',
          value: 'R$ 980.000',
          source: 'Meta Ads (Carrossel)',
          time: 'Há 2h',
          status: 'Perfil Investidor',
        },
      ],
    },
    {
      id: 'visita',
      title: '3. Visita / Reunião Agendada',
      color: 'border-purple-500/40 text-purple-400',
      leads: [
        {
          id: 'lead-4',
          name: 'Marcelo Bittencourt',
          phone: '+55 41 99777-5533',
          value: 'R$ 1.850.000',
          source: 'Meta CoEx HSM',
          time: 'Amanhã às 15:00',
          status: 'Visita no Plantão',
        },
      ],
    },
    {
      id: 'fechado',
      title: '4. Negócio Fechado (Won)',
      color: 'border-emerald-500/40 text-emerald-400',
      leads: [
        {
          id: 'lead-5',
          name: 'Luciana Ferreira',
          phone: '+55 41 99654-8877',
          value: 'R$ 1.450.000',
          source: 'Google Ads',
          time: 'Contrato Assinado',
          status: 'Vendido',
        },
      ],
    },
  ]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <KanbanSquare className="w-5 h-5 text-cyan-400" />
            Pipeline CRM Kommo & Atendimento SDR
          </h2>
          <p className="text-xs text-slate-400">
            Acompanhamento de ponta a ponta dos leads gerados pelas campanhas de tráfego
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            Sincronização Kommo Webhook: Ativa
          </span>
        </div>
      </div>

      {/* Kanban Board Columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {stages.map((stage) => (
          <div key={stage.id} className="glass-card p-4 space-y-3 flex flex-col">
            {/* Column Header */}
            <div className={`flex items-center justify-between pb-2 border-b border-slate-800 ${stage.color}`}>
              <h3 className="text-xs font-bold uppercase tracking-wider">{stage.title}</h3>
              <span className="w-5 h-5 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center text-[10px] font-mono font-bold text-slate-200">
                {stage.leads.length}
              </span>
            </div>

            {/* Leads Cards */}
            <div className="space-y-3 flex-1">
              {stage.leads.map((lead) => (
                <div
                  key={lead.id}
                  className="bg-slate-900/90 border border-slate-800 hover:border-cyan-500/40 rounded-xl p-3.5 space-y-2.5 transition-all cursor-pointer group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                      {lead.source}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {lead.time}
                    </span>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold text-white group-hover:text-cyan-300 transition-colors">
                      {lead.name}
                    </h4>
                    <p className="text-[11px] text-slate-400 font-mono mt-0.5">{lead.phone}</p>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                    <span className="text-xs font-bold text-emerald-400 font-mono">{lead.value}</span>
                    <span className="text-[10px] text-slate-400">{lead.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
