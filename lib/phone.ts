/**
 * Utilitários para tratamento e normalização de telefones no padrão E.164 e busca no Kommo CRM
 */

export function normalizePhone(phone: string): string {
  return (phone || '').replace(/\D/g, '');
}

export function formatE164(phone: string): string {
  const digits = normalizePhone(phone);
  if (!digits) return '';
  if (digits.startsWith('55')) return `+${digits}`;
  if (digits.length === 10 || digits.length === 11) return `+55${digits}`;
  return `+${digits}`;
}

export function formatDisplayPhone(phone: string): string {
  const digits = normalizePhone(phone);
  if (!digits) return '';

  const clean = digits.startsWith('55') && digits.length >= 12 ? digits.slice(2) : digits;

  if (clean.length === 11) {
    return `(${clean.slice(0, 2)}) ${clean.slice(2, 7)}-${clean.slice(7)}`;
  }
  if (clean.length === 10) {
    return `(${clean.slice(0, 2)}) ${clean.slice(2, 6)}-${clean.slice(6)}`;
  }
  return phone;
}

export function getPhoneSearchCandidates(phone: string): string[] {
  const digits = normalizePhone(phone);
  const candidates = new Set<string>();

  if (!digits) return [];

  candidates.add(digits);

  if (digits.startsWith('55')) {
    candidates.add(digits.substring(2)); // sem DDI
  } else {
    candidates.add(`55${digits}`);
  }

  const raw = digits.startsWith('55') ? digits.substring(2) : digits;

  if (raw.length === 11 && raw[2] === '9') {
    // DDD + 9 dígitos -> tentar também sem o 9º dígito (DDD + 8 dígitos)
    const without9 = raw.substring(0, 2) + raw.substring(3);
    candidates.add(without9);
    candidates.add(`55${without9}`);
  } else if (raw.length === 10) {
    // DDD + 8 dígitos -> tentar também com o 9º dígito (DDD + 9 dígitos)
    const with9 = raw.substring(0, 2) + '9' + raw.substring(2);
    candidates.add(with9);
    candidates.add(`55${with9}`);
  }

  return Array.from(candidates);
}
