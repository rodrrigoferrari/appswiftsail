'use client';

import React, { useState } from 'react';
import { useTenant } from '@/components/TenantProvider';
import {
  ChevronLeft,
  ChevronRight,
  Info,
  Users,
  Receipt,
  Plus,
  HelpCircle,
  CheckCircle2,
  Calendar as CalendarIcon,
  Filter,
  BarChart2,
  CreditCard,
  QrCode,
  DollarSign,
  ArrowRight,
  X,
  FileText,
  Smartphone,
  ExternalLink,
  ChevronDown,
  Sparkles,
} from 'lucide-react';

export default function FinanceiroPage() {
  const { activeClient } = useTenant();

  // Estados principais
  const [showGraphicVersion, setShowGraphicVersion] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('Este mês');
  const [showPeriodDropdown, setShowPeriodDropdown] = useState(false);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [selectedDate, setSelectedDate] = useState<number>(9);
  const [currentMonth, setCurrentMonth] = useState('Outubro 2026');
  const [benefitSlide, setBenefitSlide] = useState(0);
  const [promoSlide, setPromoSlide] = useState(0);

  // Modais
  const [showCreateChargeModal, setShowCreateChargeModal] = useState(false);
  const [drilldownModal, setDrilldownModal] = useState<{
    title: string;
    type: 'clientes' | 'cobrancas';
    status: string;
    items: Array<{ id: string; name: string; value: string; date: string; method?: string }>;
  } | null>(null);
  const [showExtratoModal, setShowExtratoModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);

  // Formulário Nova Cobrança
  const [newCharge, setNewCharge] = useState({
    customer: activeClient?.nome || 'Cliente Selecionado',
    value: '250,00',
    dueDate: '2026-10-15',
    method: 'PIX',
    description: 'Honorários de Gestão de Mídia & Tráfego Pago',
  });
  const [chargeSuccess, setChargeSuccess] = useState(false);

  // Nome exibido no topo (como no PDF "Olá, Rf Solution Ltda")
  const clientDisplayName = activeClient?.nome === 'EMOVERE' ? 'Emovere' : activeClient?.nome || 'Rf Solution Ltda';

  // Dados das 4 colunas KPI (Fidelidade visual ao PDF)
  const kpis = {
    recebidas: {
      statusLabel: 'Recebidas',
      badgeColor: 'bg-emerald-500',
      totalGross: 'R$ 27.809,65',
      totalNet: 'R$ 27.809,65 líquido',
      clientCount: 12,
      chargeCount: 14,
      info: 'Cobranças pagas e já liquidadas disponíveis na conta.',
      clientesList: [
        { id: 'cli_01', name: 'Alpha Participações Ltda', value: 'R$ 6.500,00', date: '02/10/2026' },
        { id: 'cli_02', name: 'Nexus Tech Soluções', value: 'R$ 5.200,00', date: '04/10/2026' },
        { id: 'cli_03', name: 'Clínica Bem Viver', value: 'R$ 4.000,00', date: '06/10/2026' },
        { id: 'cli_04', name: 'Dr. Leonardo Farias', value: 'R$ 3.800,00', date: '07/10/2026' },
        { id: 'cli_05', name: 'Studio Bella Vita', value: 'R$ 2.250,00', date: '09/10/2026' },
        { id: 'cli_06', name: 'Empório dos Grãos', value: 'R$ 1.800,00', date: '08/10/2026' },
      ],
      cobrancasList: [
        { id: 'cob_9921', name: 'Mensalidade Retainer Tráfego', value: 'R$ 6.500,00', date: '02/10/2026', method: 'PIX' },
        { id: 'cob_9922', name: 'Gestão Google Ads + Meta', value: 'R$ 5.200,00', date: '04/10/2026', method: 'Boleto' },
        { id: 'cob_9923', name: 'Automação Sinapse IA WhatsApp', value: 'R$ 4.000,00', date: '06/10/2026', method: 'PIX' },
        { id: 'cob_9924', name: 'Otimização de Landing Page', value: 'R$ 2.250,00', date: '09/10/2026', method: 'PIX' },
      ],
    },
    confirmadas: {
      statusLabel: 'Confirmadas',
      badgeColor: 'bg-sky-500',
      totalGross: 'R$ 0,00',
      totalNet: 'R$ 0,00 líquido',
      clientCount: 0,
      chargeCount: 0,
      info: 'Cobranças pagas via cartão ou boleto que aguardam repasse bancário.',
      clientesList: [],
      cobrancasList: [],
    },
    aguardando: {
      statusLabel: 'Aguardando',
      badgeColor: 'bg-amber-500',
      totalGross: 'R$ 4.000,00',
      totalNet: 'R$ 4.000,00 líquido',
      clientCount: 1,
      chargeCount: 1,
      info: 'Cobranças emitidas ainda dentro do prazo de vencimento.',
      clientesList: [
        { id: 'cli_09', name: 'Vanguard Engenharia Ltda', value: 'R$ 4.000,00', date: '15/10/2026' },
      ],
      cobrancasList: [
        { id: 'cob_9930', name: 'Pacote Performance Q4', value: 'R$ 4.000,00', date: '15/10/2026', method: 'Boleto' },
      ],
    },
    vencidas: {
      statusLabel: 'Vencidas',
      badgeColor: 'bg-rose-500',
      totalGross: 'R$ 4.000,00',
      totalNet: 'R$ 3.998,01 líquido',
      clientCount: 1,
      chargeCount: 1,
      info: 'Cobranças em aberto após a data de vencimento.',
      clientesList: [
        { id: 'cli_10', name: 'Solaris Energia Solar', value: 'R$ 4.000,00', date: '05/10/2026' },
      ],
      cobrancasList: [
        { id: 'cob_9915', name: 'Taxa Setup Instâncias Uazapi', value: 'R$ 4.000,00', date: '05/10/2026', method: 'Boleto' },
      ],
    },
  };

  // Mapeamento de cobranças por dia para o calendário
  const calendarDailyData: Record<number, { amount: string; items: string[] }> = {
    2: { amount: 'R$ 6.500,00', items: ['Recebido via PIX - Alpha Participações'] },
    4: { amount: 'R$ 5.200,00', items: ['Compensação Boleto - Nexus Tech'] },
    6: { amount: 'R$ 4.000,00', items: ['Recebido via PIX - Clínica Bem Viver'] },
    7: { amount: 'R$ 3.800,00', items: ['Recebido via Cartão - Dr. Leonardo Farias'] },
    8: { amount: 'R$ 1.800,00', items: ['Recebido via PIX - Empório dos Grãos'] },
    9: { amount: 'R$ 2.250,00', items: ['Cobranças recebidas: R$ 2.250,00'] },
    15: { amount: 'R$ 4.000,00', items: ['Previsão Repasse Boleto: R$ 4.000,00 (Vanguard Engenharia)'] },
    20: { amount: 'R$ 3.200,00', items: ['Previsão Assinatura Recorrente: R$ 3.200,00'] },
  };

  const handleCreateChargeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setChargeSuccess(true);
    setTimeout(() => {
      setChargeSuccess(false);
      setShowCreateChargeModal(false);
    }, 1200);
  };

  return (
    <div className="asaas-container min-h-screen bg-[#F8FAFC] text-[#0F172A] p-4 sm:p-6 lg:p-8 rounded-2xl shadow-sm border border-[#E2E8F0] space-y-8 select-none">
      {/* 1. Header do Asaas: Saudação e Botão Criar Cobrança */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#E2E8F0]">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#0F172A] tracking-tight">
            Olá, {clientDisplayName}
          </h1>
          <p className="text-xs text-[#64748B] mt-0.5">
            Visão consolidada da conta Asaas, recebíveis e calendário de compensação
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowCreateChargeModal(true)}
            className="bg-[#0050FF] hover:bg-[#0040D6] text-white px-5 py-2.5 rounded-full font-semibold text-xs sm:text-sm flex items-center gap-2 shadow-sm transition-all active:scale-95 cursor-pointer"
          >
            <span>Criar cobrança</span>
            <ChevronDown className="w-4 h-4 opacity-80" />
          </button>
        </div>
      </div>

      {/* 2. Seção Situação das Cobranças & Controles */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-4">
            <h2 className="text-base font-bold text-[#0F172A]">
              Situação das cobranças
            </h2>

            {/* Switch Toggle "Versão gráfico" */}
            <div className="flex items-center gap-2 text-xs text-[#475569]">
              <button
                type="button"
                onClick={() => setShowGraphicVersion(!showGraphicVersion)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  showGraphicVersion ? 'bg-[#0050FF]' : 'bg-[#CBD5E1]'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    showGraphicVersion ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
              <span className="font-medium text-xs">Versão gráfico</span>
            </div>
          </div>

          {/* Filtros em Pílula */}
          <div className="flex items-center gap-2 relative">
            {/* Dropdown Este mês */}
            <div className="relative">
              <button
                onClick={() => setShowPeriodDropdown(!showPeriodDropdown)}
                className="asaas-pill px-3.5 py-1.5 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
              >
                <span>{selectedPeriod}</span>
                <ChevronDown className="w-3.5 h-3.5 text-[#64748B]" />
              </button>

              {showPeriodDropdown && (
                <div className="absolute right-0 mt-1 w-44 bg-white border border-[#E2E8F0] rounded-xl shadow-lg p-1.5 z-20 space-y-1">
                  {['Este mês', 'Hoje', 'Últimos 7 dias', 'Últimos 30 dias', 'Ano 2026'].map((p) => (
                    <button
                      key={p}
                      onClick={() => {
                        setSelectedPeriod(p);
                        setShowPeriodDropdown(false);
                      }}
                      className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                        selectedPeriod === p ? 'bg-[#EFF4FF] text-[#0050FF] font-semibold' : 'text-[#334155] hover:bg-[#F8FAFC]'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Dropdown Filtros */}
            <div className="relative">
              <button
                onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                className="asaas-pill px-3.5 py-1.5 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
              >
                <Filter className="w-3 h-3 text-[#64748B]" />
                <span>Filtros</span>
                <ChevronDown className="w-3.5 h-3.5 text-[#64748B]" />
              </button>

              {showFilterDropdown && (
                <div className="absolute right-0 mt-1 w-52 bg-white border border-[#E2E8F0] rounded-xl shadow-lg p-3 z-20 space-y-2 text-xs">
                  <p className="font-bold text-[#0F172A] border-b border-[#F1F5F9] pb-1">Filtrar Forma de Pagamento</p>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" defaultChecked className="rounded text-[#0050FF]" />
                    <span>PIX Instantâneo</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" defaultChecked className="rounded text-[#0050FF]" />
                    <span>Boleto Bancário</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" defaultChecked className="rounded text-[#0050FF]" />
                    <span>Cartão de Crédito</span>
                  </label>
                  <button
                    onClick={() => setShowFilterDropdown(false)}
                    className="w-full mt-2 py-1.5 bg-[#0050FF] text-white rounded-lg text-xs font-semibold"
                  >
                    Aplicar
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Visão Gráfico vs Visão Cartões */}
        {showGraphicVersion ? (
          /* Versão Gráfica Interativa */
          <div className="asaas-card p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-3">
              <div>
                <h3 className="text-sm font-bold text-[#0F172A]">Volume de Cobranças por Categoria</h3>
                <p className="text-xs text-[#64748B]">Distribuição percentual do fluxo no mês vigente</p>
              </div>
              <span className="text-xs font-bold text-[#0050FF]">Total: R$ 35.807,66</span>
            </div>

            {/* Barras de Progresso / Proporção */}
            <div className="space-y-3 pt-2">
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-emerald-600 flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Recebidas (77.6%)
                  </span>
                  <span>R$ 27.809,65</span>
                </div>
                <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: '77.6%' }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-amber-600 flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Aguardando (11.2%)
                  </span>
                  <span>R$ 4.000,00</span>
                </div>
                <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-500 rounded-full" style={{ width: '11.2%' }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-rose-600 flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Vencidas (11.2%)
                  </span>
                  <span>R$ 3.998,01</span>
                </div>
                <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-rose-500 rounded-full" style={{ width: '11.2%' }} />
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Visão dos 4 Cartões KPI (Fiel ao PDF) */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 1. Recebidas */}
            <div className="asaas-card p-5 flex flex-col justify-between space-y-4">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#334155] flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    {kpis.recebidas.statusLabel}
                  </span>
                  <div title={kpis.recebidas.info} className="cursor-help">
                    <Info className="w-3.5 h-3.5 text-[#94A3B8] hover:text-[#0050FF]" />
                  </div>
                </div>

                <div className="pt-1">
                  <h3 className="text-2xl font-bold text-[#0F172A] tracking-tight">
                    {kpis.recebidas.totalGross}
                  </h3>
                  <p className="text-xs text-[#64748B] font-medium">
                    {kpis.recebidas.totalNet}
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-[#F1F5F9] space-y-2 text-xs">
                <button
                  onClick={() =>
                    setDrilldownModal({
                      title: 'Clientes com Cobranças Recebidas',
                      type: 'clientes',
                      status: 'Recebidas',
                      items: kpis.recebidas.clientesList,
                    })
                  }
                  className="w-full flex items-center justify-between text-[#475569] hover:text-[#0050FF] font-semibold transition-colors group cursor-pointer"
                >
                  <span className="flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-[#64748B] group-hover:text-[#0050FF]" />
                    {kpis.recebidas.clientCount} clientes
                  </span>
                  <ChevronRight className="w-3.5 h-3.5 text-[#94A3B8] group-hover:text-[#0050FF] group-hover:translate-x-0.5 transition-transform" />
                </button>

                <button
                  onClick={() =>
                    setDrilldownModal({
                      title: 'Cobranças Recebidas e Liquidadas',
                      type: 'cobrancas',
                      status: 'Recebidas',
                      items: kpis.recebidas.cobrancasList,
                    })
                  }
                  className="w-full flex items-center justify-between text-[#475569] hover:text-[#0050FF] font-semibold transition-colors group cursor-pointer"
                >
                  <span className="flex items-center gap-1.5">
                    <Receipt className="w-3.5 h-3.5 text-[#64748B] group-hover:text-[#0050FF]" />
                    {kpis.recebidas.chargeCount} cobranças
                  </span>
                  <ChevronRight className="w-3.5 h-3.5 text-[#94A3B8] group-hover:text-[#0050FF] group-hover:translate-x-0.5 transition-transform" />
                </button>
              </div>
            </div>

            {/* 2. Confirmadas */}
            <div className="asaas-card p-5 flex flex-col justify-between space-y-4">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#334155] flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-sky-500" />
                    {kpis.confirmadas.statusLabel}
                  </span>
                  <div title={kpis.confirmadas.info} className="cursor-help">
                    <Info className="w-3.5 h-3.5 text-[#94A3B8] hover:text-[#0050FF]" />
                  </div>
                </div>

                <div className="pt-1">
                  <h3 className="text-2xl font-bold text-[#0F172A] tracking-tight">
                    {kpis.confirmadas.totalGross}
                  </h3>
                  <p className="text-xs text-[#64748B] font-medium">
                    {kpis.confirmadas.totalNet}
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-[#F1F5F9] space-y-2 text-xs">
                <button
                  disabled={kpis.confirmadas.clientCount === 0}
                  className="w-full flex items-center justify-between text-[#475569] hover:text-[#0050FF] font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed group"
                >
                  <span className="flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-[#64748B]" />
                    {kpis.confirmadas.clientCount} cliente
                  </span>
                  <ChevronRight className="w-3.5 h-3.5 text-[#94A3B8]" />
                </button>

                <button
                  disabled={kpis.confirmadas.chargeCount === 0}
                  className="w-full flex items-center justify-between text-[#475569] hover:text-[#0050FF] font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed group"
                >
                  <span className="flex items-center gap-1.5">
                    <Receipt className="w-3.5 h-3.5 text-[#64748B]" />
                    {kpis.confirmadas.chargeCount} cobrança
                  </span>
                  <ChevronRight className="w-3.5 h-3.5 text-[#94A3B8]" />
                </button>
              </div>
            </div>

            {/* 3. Aguardando */}
            <div className="asaas-card p-5 flex flex-col justify-between space-y-4">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#334155] flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    {kpis.aguardando.statusLabel}
                  </span>
                  <div title={kpis.aguardando.info} className="cursor-help">
                    <Info className="w-3.5 h-3.5 text-[#94A3B8] hover:text-[#0050FF]" />
                  </div>
                </div>

                <div className="pt-1">
                  <h3 className="text-2xl font-bold text-[#0F172A] tracking-tight">
                    {kpis.aguardando.totalGross}
                  </h3>
                  <p className="text-xs text-[#64748B] font-medium">
                    {kpis.aguardando.totalNet}
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-[#F1F5F9] space-y-2 text-xs">
                <button
                  onClick={() =>
                    setDrilldownModal({
                      title: 'Clientes com Cobranças em Aberto (Aguardando)',
                      type: 'clientes',
                      status: 'Aguardando',
                      items: kpis.aguardando.clientesList,
                    })
                  }
                  className="w-full flex items-center justify-between text-[#475569] hover:text-[#0050FF] font-semibold transition-colors group cursor-pointer"
                >
                  <span className="flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-[#64748B] group-hover:text-[#0050FF]" />
                    {kpis.aguardando.clientCount} cliente
                  </span>
                  <ChevronRight className="w-3.5 h-3.5 text-[#94A3B8] group-hover:text-[#0050FF] group-hover:translate-x-0.5 transition-transform" />
                </button>

                <button
                  onClick={() =>
                    setDrilldownModal({
                      title: 'Cobranças Aguardando Vencimento',
                      type: 'cobrancas',
                      status: 'Aguardando',
                      items: kpis.aguardando.cobrancasList,
                    })
                  }
                  className="w-full flex items-center justify-between text-[#475569] hover:text-[#0050FF] font-semibold transition-colors group cursor-pointer"
                >
                  <span className="flex items-center gap-1.5">
                    <Receipt className="w-3.5 h-3.5 text-[#64748B] group-hover:text-[#0050FF]" />
                    {kpis.aguardando.chargeCount} cobrança
                  </span>
                  <ChevronRight className="w-3.5 h-3.5 text-[#94A3B8] group-hover:text-[#0050FF] group-hover:translate-x-0.5 transition-transform" />
                </button>
              </div>
            </div>

            {/* 4. Vencidas */}
            <div className="asaas-card p-5 flex flex-col justify-between space-y-4">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#334155] flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-rose-500" />
                    {kpis.vencidas.statusLabel}
                  </span>
                  <div title={kpis.vencidas.info} className="cursor-help">
                    <Info className="w-3.5 h-3.5 text-[#94A3B8] hover:text-[#0050FF]" />
                  </div>
                </div>

                <div className="pt-1">
                  <h3 className="text-2xl font-bold text-[#0F172A] tracking-tight">
                    {kpis.vencidas.totalGross}
                  </h3>
                  <p className="text-xs text-[#64748B] font-medium">
                    {kpis.vencidas.totalNet}
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-[#F1F5F9] space-y-2 text-xs">
                <button
                  onClick={() =>
                    setDrilldownModal({
                      title: 'Clientes com Cobranças Vencidas',
                      type: 'clientes',
                      status: 'Vencidas',
                      items: kpis.vencidas.clientesList,
                    })
                  }
                  className="w-full flex items-center justify-between text-[#475569] hover:text-[#0050FF] font-semibold transition-colors group cursor-pointer"
                >
                  <span className="flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-[#64748B] group-hover:text-[#0050FF]" />
                    {kpis.vencidas.clientCount} cliente
                  </span>
                  <ChevronRight className="w-3.5 h-3.5 text-[#94A3B8] group-hover:text-[#0050FF] group-hover:translate-x-0.5 transition-transform" />
                </button>

                <button
                  onClick={() =>
                    setDrilldownModal({
                      title: 'Cobranças Vencidas para Cobrança Ativa',
                      type: 'cobrancas',
                      status: 'Vencidas',
                      items: kpis.vencidas.cobrancasList,
                    })
                  }
                  className="w-full flex items-center justify-between text-[#475569] hover:text-[#0050FF] font-semibold transition-colors group cursor-pointer"
                >
                  <span className="flex items-center gap-1.5">
                    <Receipt className="w-3.5 h-3.5 text-[#64748B] group-hover:text-[#0050FF]" />
                    {kpis.vencidas.chargeCount} cobrança
                  </span>
                  <ChevronRight className="w-3.5 h-3.5 text-[#94A3B8] group-hover:text-[#0050FF] group-hover:translate-x-0.5 transition-transform" />
                </button>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* 3. Seção Calendário de Recebimento */}
      <section className="asaas-card p-6 space-y-6">
        <div>
          <h2 className="text-base font-bold text-[#0F172A]">
            Calendário de recebimento
          </h2>
          <p className="text-xs text-[#64748B] mt-1 max-w-2xl">
            Acompanhe as cobranças recebidas e a previsão de repasse das cobranças que estão aguardando o prazo de compensação.
          </p>

          {/* Legenda de cores */}
          <div className="flex items-center gap-4 mt-3 text-xs font-medium text-[#475569]">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              Recebidas
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-sky-500" />
              Confirmadas
            </span>
          </div>
        </div>

        {/* Componente Calendário Matriz Mensal */}
        <div className="max-w-2xl mx-auto border border-[#E2E8F0] rounded-2xl p-5 bg-white shadow-xs">
          {/* Cabeçalho do Mês */}
          <div className="flex items-center justify-between pb-4 border-b border-[#F1F5F9]">
            <button
              onClick={() => setCurrentMonth('Setembro 2026')}
              className="p-1.5 rounded-full hover:bg-slate-100 text-[#64748B] hover:text-[#0F172A] transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm font-bold text-[#0F172A]">{currentMonth}</span>
            <button
              onClick={() => setCurrentMonth('Novembro 2026')}
              className="p-1.5 rounded-full hover:bg-slate-100 text-[#64748B] hover:text-[#0F172A] transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Dias da semana */}
          <div className="grid grid-cols-7 text-center py-3 text-xs font-semibold text-[#64748B] border-b border-[#F1F5F9]">
            <span>Dom</span>
            <span>Seg</span>
            <span>Ter</span>
            <span>Qua</span>
            <span>Qui</span>
            <span>Sex</span>
            <span>Sáb</span>
          </div>

          {/* Grade dos dias do mês (Outubro 2026 começa na Quinta-feira dia 1) */}
          <div className="grid grid-cols-7 gap-y-2 py-3 text-center text-xs">
            {/* Espaços vazios antes do dia 1 */}
            <span className="py-2 text-transparent">-</span>
            <span className="py-2 text-transparent">-</span>
            <span className="py-2 text-transparent">-</span>
            <span className="py-2 text-transparent">-</span>

            {/* Dias 1 a 31 */}
            {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => {
              const isSelected = selectedDate === day;
              const hasData = calendarDailyData[day];

              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => setSelectedDate(day)}
                  className="flex flex-col items-center justify-center py-1.5 relative group cursor-pointer transition-all"
                >
                  <div
                    className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-medium transition-all ${
                      isSelected
                        ? 'border-2 border-[#0050FF] text-[#0050FF] font-bold bg-[#EFF4FF]'
                        : 'text-[#1E293B] hover:bg-slate-100'
                    }`}
                  >
                    {day}
                  </div>

                  {/* Ponto indicador de transação sob o dia */}
                  {hasData && (
                    <div className="flex gap-0.5 mt-0.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      {day === 15 && <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />}
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Detalhe do Dia Selecionado (Exemplo: 09/10/2026 - R$ 2.250,00) */}
          <div className="mt-4 pt-4 border-t border-[#E2E8F0] flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#F8FAFC] p-3.5 rounded-xl">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#EFF4FF] border border-[#BFDBFE] text-[#0050FF] flex items-center justify-center">
                <CalendarIcon className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-[#0F172A]">
                  {String(selectedDate).padStart(2, '0')}/10/2026
                </p>
                <div className="text-xs text-[#334155] flex items-center gap-1.5 mt-0.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>
                    {calendarDailyData[selectedDate]
                      ? `Cobranças recebidas: ${calendarDailyData[selectedDate].amount}`
                      : 'Nenhuma movimentação registrada nesta data'}
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowExtratoModal(true)}
              className="text-xs font-bold text-[#0050FF] hover:underline flex items-center gap-1 cursor-pointer self-end sm:self-center"
            >
              <span>Extrato</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </section>

      {/* 4. Seção Benefícios e Promoção "Para Você" (Grid lado a lado) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Card Benefícios */}
        <section className="asaas-card p-6 space-y-4 flex flex-col justify-between">
          <div className="space-y-1">
            <h2 className="text-base font-bold text-[#0F172A]">Benefícios</h2>
            <p className="text-xs text-[#64748B]">Vantagens exclusivas e créditos promocionais da sua conta</p>
          </div>

          {/* Slide de Benefícios */}
          <div className="border border-[#E2E8F0] rounded-2xl p-6 text-center space-y-3 bg-[#F8FAFC]">
            {benefitSlide === 0 ? (
              <>
                <h3 className="text-sm font-bold text-[#0F172A]">Cobranças grátis</h3>
                <div className="w-12 h-12 mx-auto rounded-full bg-white border border-[#E2E8F0] flex items-center justify-center text-[#0050FF] text-xl font-bold shadow-xs">
                  $
                </div>
                <p className="text-xs text-[#64748B]">Nenhuma cobrança grátis disponível</p>
                <div>
                  <button
                    onClick={() => setShowHelpModal(true)}
                    className="text-xs text-[#0050FF] font-semibold hover:underline cursor-pointer"
                  >
                    O que são cobranças grátis?
                  </button>
                </div>
              </>
            ) : (
              <>
                <h3 className="text-sm font-bold text-[#0F172A]">Crédito Promocional</h3>
                <div className="w-12 h-12 mx-auto rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 text-xl font-bold">
                  ✓
                </div>
                <p className="text-xs text-[#64748B]">R$ 150,00 em isenções ativas de taxa PIX</p>
                <div>
                  <span className="text-xs text-emerald-600 font-bold">Válido até 31/12/2026</span>
                </div>
              </>
            )}

            {/* Controles de Navegação Carrossel */}
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setBenefitSlide(0)}
                className="p-1 text-[#64748B] hover:text-[#0F172A] cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div className="flex gap-1.5">
                <span
                  className={`w-2 h-2 rounded-full cursor-pointer transition-colors ${
                    benefitSlide === 0 ? 'bg-[#0050FF]' : 'bg-[#CBD5E1]'
                  }`}
                  onClick={() => setBenefitSlide(0)}
                />
                <span
                  className={`w-2 h-2 rounded-full cursor-pointer transition-colors ${
                    benefitSlide === 1 ? 'bg-[#0050FF]' : 'bg-[#CBD5E1]'
                  }`}
                  onClick={() => setBenefitSlide(1)}
                />
              </div>
              <button
                onClick={() => setBenefitSlide(1)}
                className="p-1 text-[#64748B] hover:text-[#0F172A] cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </section>

        {/* Card "Para você" (Promoções & Extensões Asaas) */}
        <section className="asaas-card p-6 space-y-4 flex flex-col justify-between">
          <div className="space-y-1">
            <h2 className="text-base font-bold text-[#0F172A]">Para você</h2>
            <p className="text-xs text-[#64748B]">Recursos avançados para alavancar sua operação</p>
          </div>

          <div className="border border-[#E2E8F0] rounded-2xl p-6 bg-gradient-to-br from-white to-[#F8FAFC] space-y-4">
            {promoSlide === 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-[#0050FF] uppercase tracking-wider">
                  <Smartphone className="w-4 h-4" />
                  <span>Asaas Tap</span>
                </div>
                <h3 className="text-base font-bold text-[#0F172A]">
                  Use seu celular como maquininha
                </h3>
                <p className="text-xs text-[#475569] leading-relaxed">
                  Com o Asaas Tap você vende por aproximação direto do celular. Taxas reduzidas e parcelamento em até 21x sem juros.
                </p>
                <button
                  onClick={() => alert('Recurso Asaas Tap solicitado para a conta!')}
                  className="px-4 py-2 bg-[#0050FF] hover:bg-[#0040D6] text-white rounded-xl text-xs font-semibold transition-all cursor-pointer shadow-xs"
                >
                  Ativar Asaas Tap
                </button>
              </div>
            )}

            {promoSlide === 1 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-600 uppercase tracking-wider">
                  <Sparkles className="w-4 h-4" />
                  <span>Plano Avançado</span>
                </div>
                <h3 className="text-base font-bold text-[#0F172A]">
                  Voe mais alto com o Plano Avançado
                </h3>
                <p className="text-xs text-[#475569] leading-relaxed">
                  Com o Plano Avançado você envia notificações com taxas reduzidas e customiza suas mensagens antes do envio.
                </p>
                <button
                  onClick={() => alert('Plano Avançado Asaas ativado!')}
                  className="px-4 py-2 bg-[#0F172A] hover:bg-black text-white rounded-xl text-xs font-semibold transition-all cursor-pointer shadow-xs"
                >
                  Conhecer Plano
                </button>
              </div>
            )}

            {promoSlide === 2 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 uppercase tracking-wider">
                  <FileText className="w-4 h-4" />
                  <span>NFS-e Automatizada</span>
                </div>
                <h3 className="text-base font-bold text-[#0F172A]">
                  Emissão de Notas Fiscais Integrada
                </h3>
                <p className="text-xs text-[#475569] leading-relaxed">
                  Gere notas fiscais eletrônicas de serviço automaticamente na liquidação de cada boleto ou transação PIX.
                </p>
                <button
                  onClick={() => alert('Módulo de NFS-e configurado!')}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold transition-all cursor-pointer shadow-xs"
                >
                  Configurar Emissão
                </button>
              </div>
            )}

            {/* Paginação do Carrossel */}
            <div className="flex items-center justify-between pt-3 border-t border-[#F1F5F9]">
              <div className="flex gap-1.5">
                {[0, 1, 2].map((idx) => (
                  <span
                    key={idx}
                    onClick={() => setPromoSlide(idx)}
                    className={`w-2 h-2 rounded-full cursor-pointer transition-colors ${
                      promoSlide === idx ? 'bg-[#0050FF]' : 'bg-[#CBD5E1]'
                    }`}
                  />
                ))}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setPromoSlide((p) => (p > 0 ? p - 1 : 2))}
                  className="p-1 text-[#64748B] hover:text-[#0F172A] cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setPromoSlide((p) => (p < 2 ? p + 1 : 0))}
                  className="p-1 text-[#64748B] hover:text-[#0F172A] cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* 5. Rodapé Flutuante "Posso ajudar?" (Como no Asaas) */}
      <div className="fixed bottom-6 right-6 z-40">
        <button
          onClick={() => setShowHelpModal(true)}
          className="bg-white hover:bg-[#F8FAFC] text-[#0F172A] border border-[#E2E8F0] shadow-lg px-4 py-2.5 rounded-full text-xs font-bold flex items-center gap-2 transition-all hover:scale-105 active:scale-95 cursor-pointer"
        >
          <div className="w-5 h-5 rounded-full bg-[#0050FF] text-white flex items-center justify-center text-[10px]">
            ?
          </div>
          <span>Posso ajudar?</span>
        </button>
      </div>

      {/* --- MODAIS DE INTERAÇÃO --- */}

      {/* Modal Criar Cobrança */}
      {showCreateChargeModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 w-full max-w-lg shadow-2xl space-y-4 relative">
            <button
              onClick={() => setShowCreateChargeModal(false)}
              className="absolute top-4 right-4 text-[#94A3B8] hover:text-[#0F172A] cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="border-b border-[#F1F5F9] pb-3">
              <h3 className="text-base font-bold text-[#0F172A] flex items-center gap-2">
                <Plus className="w-4 h-4 text-[#0050FF]" />
                Nova Cobrança Asaas
              </h3>
              <p className="text-xs text-[#64748B]">Emita cobranças via PIX, Boleto Bancário ou Cartão de Crédito</p>
            </div>

            {chargeSuccess ? (
              <div className="py-8 text-center space-y-3">
                <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-[#0F172A]">Cobrança gerada com sucesso!</h4>
                <p className="text-xs text-[#64748B]">O link de pagamento e o QR Code PIX foram gerados no Asaas.</p>
              </div>
            ) : (
              <form onSubmit={handleCreateChargeSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[#475569] mb-1">Cliente / Pagador</label>
                  <input
                    type="text"
                    value={newCharge.customer}
                    onChange={(e) => setNewCharge({ ...newCharge, customer: e.target.value })}
                    className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-3 py-2 text-xs text-[#0F172A] focus:outline-none focus:border-[#0050FF]"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-[#475569] mb-1">Valor (R$)</label>
                    <input
                      type="text"
                      value={newCharge.value}
                      onChange={(e) => setNewCharge({ ...newCharge, value: e.target.value })}
                      className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-3 py-2 text-xs font-bold text-[#0F172A] focus:outline-none focus:border-[#0050FF]"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#475569] mb-1">Vencimento</label>
                    <input
                      type="date"
                      value={newCharge.dueDate}
                      onChange={(e) => setNewCharge({ ...newCharge, dueDate: e.target.value })}
                      className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-3 py-2 text-xs text-[#0F172A] focus:outline-none focus:border-[#0050FF]"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#475569] mb-1">Forma de Pagamento</label>
                  <div className="grid grid-cols-3 gap-2">
                    {['PIX', 'Boleto', 'Cartão'].map((m) => (
                      <button
                        type="button"
                        key={m}
                        onClick={() => setNewCharge({ ...newCharge, method: m })}
                        className={`py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                          newCharge.method === m
                            ? 'bg-[#EFF4FF] border-[#0050FF] text-[#0050FF]'
                            : 'bg-white border-[#E2E8F0] text-[#475569] hover:bg-[#F8FAFC]'
                        }`}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#475569] mb-1">Descrição do Serviço</label>
                  <input
                    type="text"
                    value={newCharge.description}
                    onChange={(e) => setNewCharge({ ...newCharge, description: e.target.value })}
                    className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-3 py-2 text-xs text-[#0F172A] focus:outline-none focus:border-[#0050FF]"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2 border-t border-[#F1F5F9]">
                  <button
                    type="button"
                    onClick={() => setShowCreateChargeModal(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-[#64748B] hover:bg-slate-100 cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl text-xs font-semibold bg-[#0050FF] hover:bg-[#0040D6] text-white cursor-pointer shadow-xs"
                  >
                    Emitir Cobrança
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Modal Drilldown de Clientes / Cobranças */}
      {drilldownModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 w-full max-w-lg shadow-2xl space-y-4 relative">
            <button
              onClick={() => setDrilldownModal(null)}
              className="absolute top-4 right-4 text-[#94A3B8] hover:text-[#0F172A] cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="border-b border-[#F1F5F9] pb-3">
              <h3 className="text-base font-bold text-[#0F172A]">{drilldownModal.title}</h3>
              <p className="text-xs text-[#64748B]">Status: {drilldownModal.status}</p>
            </div>

            <div className="max-h-80 overflow-y-auto divide-y divide-[#F1F5F9] text-xs">
              {drilldownModal.items.length === 0 ? (
                <p className="py-6 text-center text-[#64748B]">Nenhum registro encontrado nesta categoria.</p>
              ) : (
                drilldownModal.items.map((item) => (
                  <div key={item.id} className="py-2.5 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-[#0F172A]">{item.name}</p>
                      <p className="text-[11px] text-[#64748B]">
                        {item.date} {item.method ? `· ${item.method}` : ''}
                      </p>
                    </div>
                    <span className="font-bold text-[#0F172A]">{item.value}</span>
                  </div>
                ))
              )}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setDrilldownModal(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-[#0F172A] cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Extrato Diário */}
      {showExtratoModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-4 relative">
            <button
              onClick={() => setShowExtratoModal(false)}
              className="absolute top-4 right-4 text-[#94A3B8] hover:text-[#0F172A] cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="border-b border-[#F1F5F9] pb-3">
              <h3 className="text-base font-bold text-[#0F172A]">
                Extrato Financeiro — {String(selectedDate).padStart(2, '0')}/10/2026
              </h3>
              <p className="text-xs text-[#64748B]">Detalhamento de liquidações Asaas nesta data</p>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl flex justify-between items-center">
                <div>
                  <p className="font-bold text-[#0F172A]">Cobrança PIX #9924</p>
                  <p className="text-[11px] text-[#64748B]">Studio Bella Vita</p>
                </div>
                <span className="font-bold text-emerald-600">+ R$ 2.250,00</span>
              </div>

              <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl flex justify-between items-center">
                <div>
                  <p className="font-bold text-[#0F172A]">Taxa de Compensação PIX Asaas</p>
                  <p className="text-[11px] text-[#64748B]">Tarifa padrão</p>
                </div>
                <span className="font-bold text-rose-600">- R$ 1,99</span>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShowExtratoModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#0050FF] text-white cursor-pointer"
              >
                Concluído
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Ajuda / FAQ Asaas */}
      {showHelpModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-4 relative">
            <button
              onClick={() => setShowHelpModal(false)}
              className="absolute top-4 right-4 text-[#94A3B8] hover:text-[#0F172A] cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="border-b border-[#F1F5F9] pb-3">
              <h3 className="text-base font-bold text-[#0F172A]">Central de Ajuda Asaas</h3>
              <p className="text-xs text-[#64748B]">Perguntas frequentes e suporte Swiftsail</p>
            </div>

            <div className="space-y-3 text-xs text-[#334155]">
              <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
                <p className="font-bold text-[#0F172A] mb-1">O que são cobranças grátis?</p>
                <p className="text-[#64748B]">
                  Cobranças grátis são isenções promocionais de tarifas de emissão de boletos ou liquidação de PIX concedidas pelo Asaas para contas ativas.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
                <p className="font-bold text-[#0F172A] mb-1">Quando o saldo fica disponível?</p>
                <p className="text-[#64748B]">
                  Pagamentos via PIX são compensados imediatamente na conta. Boletos são compensados em até 1 dia útil após o pagamento.
                </p>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShowHelpModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-[#0F172A] cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
