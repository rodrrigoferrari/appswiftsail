/**
 * Utilitários de Data no fuso horário oficial (America/Sao_Paulo).
 * Alinhado rigorosamente com a Seção 4.2 das Diretrizes de Evolução da Plataforma:
 * - Ontem
 * - Semana passada
 * - Semana atual
 * - Mês passado
 * - Mês atual
 * - Personalizar período
 */

export function hojeBRT(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' });
}

export function ontemBRT(): string {
  const [y, m, d] = hojeBRT().split('-').map(Number);
  const base = new Date(Date.UTC(y, m - 1, d));
  base.setUTCDate(base.getUTCDate() - 1);
  return base.toISOString().slice(0, 10);
}

export function diasAtrasBRT(n: number): string {
  const [y, m, d] = hojeBRT().split('-').map(Number);
  const base = new Date(Date.UTC(y, m - 1, d));
  base.setUTCDate(base.getUTCDate() - n);
  return base.toISOString().slice(0, 10);
}

/** Semana atual: Segunda-feira até a data de hoje */
export function semanaAtualBRT(): { start: string; end: string } {
  const [y, m, d] = hojeBRT().split('-').map(Number);
  const now = new Date(Date.UTC(y, m - 1, d));
  const dayOfWeek = now.getUTCDay(); // 0: Dom, 1: Seg, ...
  const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const monday = new Date(now);
  monday.setUTCDate(now.getUTCDate() - diffToMonday);

  return {
    start: monday.toISOString().slice(0, 10),
    end: hojeBRT(),
  };
}

/** Semana passada: Segunda a Domingo da semana anterior */
export function semanaPassadaBRT(): { start: string; end: string } {
  const [y, m, d] = hojeBRT().split('-').map(Number);
  const now = new Date(Date.UTC(y, m - 1, d));
  const dayOfWeek = now.getUTCDay();
  const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const lastSunday = new Date(now);
  lastSunday.setUTCDate(now.getUTCDate() - diffToMonday - 1);
  const lastMonday = new Date(lastSunday);
  lastMonday.setUTCDate(lastSunday.getUTCDate() - 6);

  return {
    start: lastMonday.toISOString().slice(0, 10),
    end: lastSunday.toISOString().slice(0, 10),
  };
}

/** Mês atual: Dia 1 do mês corrente até hoje */
export function mesAtualBRT(): { start: string; end: string } {
  const [y, m] = hojeBRT().split('-').map(Number);
  const firstDay = `${y}-${String(m).padStart(2, '0')}-01`;
  return {
    start: firstDay,
    end: hojeBRT(),
  };
}

/** Mês passado: Primeiro ao último dia do mês anterior */
export function mesPassadoBRT(): { start: string; end: string } {
  const [y, m] = hojeBRT().split('-').map(Number);
  const prevMonth = m === 1 ? 12 : m - 1;
  const prevYear = m === 1 ? y - 1 : y;
  const firstDay = `${prevYear}-${String(prevMonth).padStart(2, '0')}-01`;
  const lastDayNum = new Date(Date.UTC(prevYear, prevMonth, 0)).getUTCDate();
  const lastDay = `${prevYear}-${String(prevMonth).padStart(2, '0')}-${String(lastDayNum).padStart(2, '0')}`;

  return {
    start: firstDay,
    end: lastDay,
  };
}
