import {
  KommoContact,
  CreateCallNoteParams,
  CreateTaskParams,
  CreateSummaryNoteParams,
  ResolutionResult,
} from './types';
import { getPhoneSearchCandidates, formatE164 } from '@/lib/phone';

export class KommoClient {
  private baseDomain: string;
  private accessToken: string;

  constructor(baseDomain: string, accessToken: string) {
    let clean = (baseDomain || '').replace(/^https?:\/\//, '').replace(/\/+$/, '');
    if (!clean.includes('.')) {
      clean = `${clean}.kommo.com`;
    }
    this.baseDomain = clean;
    this.accessToken = accessToken;
  }

  private get apiUrl(): string {
    return `https://${this.baseDomain}/api/v4`;
  }

  private async request(endpoint: string, options: RequestInit = {}): Promise<any> {
    const url = `${this.apiUrl}${endpoint}`;
    const headers = {
      Authorization: `Bearer ${this.accessToken}`,
      'Content-Type': 'application/json',
      ...options.headers,
    };

    const res = await fetch(url, { ...options, headers, cache: 'no-store' });

    if (res.status === 204) return null;

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Kommo API error (${res.status}): ${errText}`);
    }

    return res.json();
  }

  /**
   * Busca contatos que possuem o telefone (ou variações de 8/9 dígitos)
   */
  async findContactsByPhone(phone: string): Promise<KommoContact[]> {
    const candidates = getPhoneSearchCandidates(phone);
    const foundContacts = new Map<string, KommoContact>();

    for (const query of candidates.slice(0, 3)) {
      try {
        const data = await this.request(`/contacts?query=${encodeURIComponent(query)}&with=leads`);
        const list = data?._embedded?.contacts || [];

        for (const item of list) {
          const phones: string[] = [];
          const customFields = item.custom_fields_values || [];
          for (const f of customFields) {
            if (f.field_code === 'PHONE' || f.field_name === 'Telefone') {
              for (const v of f.values || []) {
                if (v.value) phones.push(String(v.value));
              }
            }
          }

          foundContacts.set(String(item.id), {
            id: String(item.id),
            name: item.name || 'Contato sem nome',
            phones,
          });
        }
      } catch {
        // Se 204 ou não encontrado, ignora
      }
    }

    return Array.from(foundContacts.values());
  }

  /**
   * Resolução inteligente de entidade:
   * 1. Se fornecido leadId explicitamente, usa o lead
   * 2. Se fornecido contactId explicitamente, usa o contato
   * 3. Se busca por telefone retornar 1 contato, associa
   * 4. Se busca por telefone retornar múltiplos contatos, marca como needs_review
   * 5. Se não houver resultado, marca not_found
   */
  async resolveEntity(options: {
    explicitLeadId?: string | null;
    explicitContactId?: string | null;
    phone: string;
  }): Promise<ResolutionResult> {
    if (options.explicitLeadId) {
      return {
        status: 'resolved',
        entityType: 'leads',
        entityId: String(options.explicitLeadId),
        matchesCount: 1,
      };
    }

    if (options.explicitContactId) {
      return {
        status: 'resolved',
        entityType: 'contacts',
        entityId: String(options.explicitContactId),
        matchesCount: 1,
      };
    }

    const matches = await this.findContactsByPhone(options.phone);

    if (matches.length === 1) {
      return {
        status: 'resolved',
        entityType: 'contacts',
        entityId: matches[0].id,
        contactName: matches[0].name,
        matchesCount: 1,
      };
    }

    if (matches.length > 1) {
      return {
        status: 'needs_review',
        matchesCount: matches.length,
      };
    }

    return {
      status: 'not_found',
      matchesCount: 0,
    };
  }

  /**
   * Registra nota call_out ou call_in no Kommo
   */
  async createCallNote(params: CreateCallNoteParams): Promise<{ noteId: string }> {
    const payload = [
      {
        entity_id: Number(params.entityId),
        note_type: params.noteType,
        params: {
          uniq: params.uniq,
          duration: params.durationSeconds,
          source: params.source || 'WhatsApp via Swiftsail',
          link: params.historyLink,
          phone: formatE164(params.phone),
        },
      },
    ];

    const res = await this.request(`/${params.entityType}/notes`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    const created = res?._embedded?.notes?.[0];
    return { noteId: created?.id ? String(created.id) : `note_${Date.now()}` };
  }

  /**
   * Registra nota de texto simples/comum na timeline do Kommo
   */
  async createSummaryNote(params: CreateSummaryNoteParams): Promise<{ noteId: string }> {
    const payload = [
      {
        entity_id: Number(params.entityId),
        note_type: 'common',
        params: {
          text: params.text,
        },
      },
    ];

    const res = await this.request(`/${params.entityType}/notes`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    const created = res?._embedded?.notes?.[0];
    return { noteId: created?.id ? String(created.id) : `note_sum_${Date.now()}` };
  }

  /**
   * Registra uma Tarefa (Task) de ligação no Kommo com resultado e duração
   * task_type_id: 1 = Chamada / Call no Kommo CRM
   */
  async createTask(params: CreateTaskParams): Promise<{ taskId: string }> {
    const taskItem: Record<string, any> = {
      entity_id: Number(params.entityId),
      entity_type: params.entityType,
      text: params.text,
      complete_till: Math.floor(Date.now() / 1000),
      task_type_id: 1, // 1 = Chamada no padrão Kommo
      is_completed: params.isCompleted ?? true,
      result: {
        text: params.text,
      },
    };

    if (params.responsibleUserId && Number(params.responsibleUserId) > 0) {
      taskItem.responsible_user_id = Number(params.responsibleUserId);
    }

    const payload = [taskItem];

    const res = await this.request('/tasks', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    const created = res?._embedded?.tasks?.[0];
    return { taskId: created?.id ? String(created.id) : `task_${Date.now()}` };
  }
}
