'use client';

import React, { useState } from 'react';
import { Calendar, X } from 'lucide-react';
import { useTenant } from './TenantProvider';
import {
  ontemBRT,
  semanaPassadaBRT,
  semanaAtualBRT,
  mesPassadoBRT,
  mesAtualBRT,
} from '@/lib/date';

export default function DateRangePicker() {
  const { dateRange, setDateRange } = useTenant();
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [customStart, setCustomStart] = useState(dateRange.start);
  const [customEnd, setCustomEnd] = useState(dateRange.end);

  const handleApplyCustomDate = () => {
    setDateRange({
      start: customStart,
      end: customEnd,
      label: `Personalizado: ${customStart} até ${customEnd}`,
    });
    setShowCustomModal(false);
  };

  return (
    <>
      <div className="flex items-center bg-[#F1F5F9] border border-[#E2E8F0] rounded-xl p-1 text-xs overflow-x-auto shadow-2xs">
        <button
          type="button"
          onClick={() => {
            const ont = ontemBRT();
            setDateRange({ start: ont, end: ont, label: 'Ontem' });
          }}
          className={`px-3 py-1.5 rounded-lg font-semibold transition-all whitespace-nowrap cursor-pointer ${
            dateRange.label === 'Ontem'
              ? 'bg-white text-[#0050FF] shadow-xs border border-[#E2E8F0]'
              : 'text-[#64748B] hover:text-[#0F172A]'
          }`}
        >
          Ontem
        </button>

        <button
          type="button"
          onClick={() => {
            const sp = semanaPassadaBRT();
            setDateRange({ start: sp.start, end: sp.end, label: 'Semana passada' });
          }}
          className={`px-3 py-1.5 rounded-lg font-semibold transition-all whitespace-nowrap cursor-pointer ${
            dateRange.label === 'Semana passada'
              ? 'bg-white text-[#0050FF] shadow-xs border border-[#E2E8F0]'
              : 'text-[#64748B] hover:text-[#0F172A]'
          }`}
        >
          Semana passada
        </button>

        <button
          type="button"
          onClick={() => {
            const sa = semanaAtualBRT();
            setDateRange({ start: sa.start, end: sa.end, label: 'Semana atual' });
          }}
          className={`px-3 py-1.5 rounded-lg font-semibold transition-all whitespace-nowrap cursor-pointer ${
            dateRange.label === 'Semana atual'
              ? 'bg-white text-[#0050FF] shadow-xs border border-[#E2E8F0]'
              : 'text-[#64748B] hover:text-[#0F172A]'
          }`}
        >
          Semana atual
        </button>

        <button
          type="button"
          onClick={() => {
            const mp = mesPassadoBRT();
            setDateRange({ start: mp.start, end: mp.end, label: 'Mês passado' });
          }}
          className={`px-3 py-1.5 rounded-lg font-semibold transition-all whitespace-nowrap cursor-pointer ${
            dateRange.label === 'Mês passado'
              ? 'bg-white text-[#0050FF] shadow-xs border border-[#E2E8F0]'
              : 'text-[#64748B] hover:text-[#0F172A]'
          }`}
        >
          Mês passado
        </button>

        <button
          type="button"
          onClick={() => {
            const ma = mesAtualBRT();
            setDateRange({ start: ma.start, end: ma.end, label: 'Mês atual' });
          }}
          className={`px-3 py-1.5 rounded-lg font-semibold transition-all whitespace-nowrap cursor-pointer ${
            dateRange.label === 'Mês atual'
              ? 'bg-white text-[#0050FF] shadow-xs border border-[#E2E8F0]'
              : 'text-[#64748B] hover:text-[#0F172A]'
          }`}
        >
          Mês atual
        </button>

        <button
          type="button"
          onClick={() => setShowCustomModal(true)}
          className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-all whitespace-nowrap cursor-pointer ${
            dateRange.label.startsWith('Personalizado')
              ? 'bg-white text-[#0050FF] shadow-xs border border-[#E2E8F0]'
              : 'text-[#64748B] hover:text-[#0F172A]'
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>Personalizar</span>
        </button>
      </div>

      {/* Modal de Personalização de Período */}
      {showCustomModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[#E2E8F0] rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
              <h3 className="font-bold text-[#0F172A] text-sm flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#0050FF]" />
                Personalizar Período
              </h3>
              <button
                type="button"
                onClick={() => setShowCustomModal(false)}
                className="text-[#64748B] hover:text-[#0F172A] p-1 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-[#64748B] mb-1">
                  Data Inicial
                </label>
                <input
                  type="date"
                  value={customStart}
                  onChange={(e) => setCustomStart(e.target.value)}
                  className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl px-3 py-2 text-xs font-semibold text-[#0F172A] focus:outline-none focus:border-[#0050FF]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#64748B] mb-1">
                  Data Final
                </label>
                <input
                  type="date"
                  value={customEnd}
                  onChange={(e) => setCustomEnd(e.target.value)}
                  className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl px-3 py-2 text-xs font-semibold text-[#0F172A] focus:outline-none focus:border-[#0050FF]"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E2E8F0]">
              <button
                type="button"
                onClick={() => setShowCustomModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-[#64748B] hover:bg-[#F1F5F9] cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleApplyCustomDate}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-[#0050FF] hover:bg-[#0040D6] text-white shadow-xs cursor-pointer"
              >
                Aplicar Período
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
