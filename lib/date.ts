/** Data de hoje (YYYY-MM-DD) no fuso de São Paulo. */
export function hojeBRT(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' });
}

/** Data de N dias atrás (YYYY-MM-DD) no fuso de São Paulo. */
export function diasAtrasBRT(n: number): string {
  const [y, m, d] = hojeBRT().split('-').map(Number);
  const base = new Date(Date.UTC(y, m - 1, d));
  base.setUTCDate(base.getUTCDate() - n);
  return base.toISOString().slice(0, 10);
}
