import { supabaseAdmin } from '@/lib/supabase/admin';

export interface CallRecord {
  id: string;
  workspace_id: string;
  lead_id?: string | null;
  contact_id?: string | null;
  contact_name?: string | null;
  phone_e164: string;
  direction: 'inbound' | 'outbound';
  status: 'initiated' | 'ringing' | 'in_progress' | 'ended' | 'missed' | 'rejected' | 'failed' | string;
  duration_seconds: number;
  call_feedback?: string | null;
  call_feedback_note?: string | null;
  kommo_task_id?: string | null;
  kommo_note_id?: string | null;
  kommo_sync_status?: 'pending' | 'synced' | 'sync_failed' | 'not_applicable' | string;
  kommo_last_sync_error?: string | null;
  uazapi_call_id?: string | null;
  started_at: string;
  ended_at?: string | null;
  created_at: string;
  updated_at: string;
}

export async function saveCallRecord(record: Partial<CallRecord> & { workspace_id: string; phone_e164: string }): Promise<CallRecord> {
  const id = record.id || `call_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const now = new Date().toISOString();

  const fullRecord: CallRecord = {
    id,
    workspace_id: record.workspace_id,
    lead_id: record.lead_id || null,
    contact_id: record.contact_id || null,
    contact_name: record.contact_name || 'Contato',
    phone_e164: record.phone_e164,
    direction: record.direction || 'outbound',
    status: record.status || 'initiated',
    duration_seconds: record.duration_seconds || 0,
    call_feedback: record.call_feedback || null,
    call_feedback_note: record.call_feedback_note || null,
    kommo_task_id: record.kommo_task_id || null,
    kommo_note_id: record.kommo_note_id || null,
    kommo_sync_status: record.kommo_sync_status || 'pending',
    kommo_last_sync_error: record.kommo_last_sync_error || null,
    uazapi_call_id: record.uazapi_call_id || null,
    started_at: record.started_at || now,
    ended_at: record.ended_at || null,
    created_at: record.created_at || now,
    updated_at: now,
  };

  // 1. Tenta salvar na tabela nativa kvh_calls
  try {
    const { data, error } = await supabaseAdmin
      .from('kvh_calls')
      .insert({
        ...fullRecord,
      })
      .select()
      .single();

    if (!error && data) {
      return data as CallRecord;
    }
  } catch {}

  // 2. Fallback resiliente: salva no knowledge_base
  try {
    await supabaseAdmin.from('knowledge_base').insert({
      content: JSON.stringify(fullRecord),
      summary: `Chamada WhatsApp ${fullRecord.phone_e164} - ${fullRecord.contact_name}`,
      source: 'kvh_call_record',
      tags: ['kvh_call', fullRecord.workspace_id, fullRecord.id],
    });
  } catch (err) {
    console.error('[Fallback Save Call Error]:', err);
  }

  return fullRecord;
}

export async function updateCallRecord(id: string, updates: Partial<CallRecord>): Promise<CallRecord | null> {
  const now = new Date().toISOString();

  // 1. Tenta atualizar na tabela nativa kvh_calls
  try {
    const { data, error } = await supabaseAdmin
      .from('kvh_calls')
      .update({
        ...updates,
        updated_at: now,
      })
      .eq('id', id)
      .select()
      .single();

    if (!error && data) {
      return data as CallRecord;
    }
  } catch {}

  // 2. Fallback resiliente: busca e atualiza no knowledge_base
  try {
    const { data } = await supabaseAdmin
      .from('knowledge_base')
      .select('id, content')
      .contains('tags', ['kvh_call', id])
      .limit(1);

    if (data && data.length > 0) {
      const existing = JSON.parse(data[0].content);
      const updated = { ...existing, ...updates, updated_at: now };
      await supabaseAdmin
        .from('knowledge_base')
        .update({
          content: JSON.stringify(updated),
          updated_at: now,
        })
        .eq('id', data[0].id);
      return updated as CallRecord;
    }
  } catch (err) {
    console.error('[Fallback Update Call Error]:', err);
  }

  return null;
}

export async function getCallRecord(id: string): Promise<CallRecord | null> {
  // 1. Tenta tabela kvh_calls
  try {
    const { data, error } = await supabaseAdmin
      .from('kvh_calls')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (!error && data) {
      return data as CallRecord;
    }
  } catch {}

  // 2. Fallback: knowledge_base
  try {
    const { data } = await supabaseAdmin
      .from('knowledge_base')
      .select('content')
      .contains('tags', ['kvh_call', id])
      .limit(1);

    if (data && data.length > 0) {
      return JSON.parse(data[0].content) as CallRecord;
    }
  } catch {}

  return null;
}

export async function listCalls(workspaceId?: string, limit = 50): Promise<CallRecord[]> {
  // 1. Tenta tabela kvh_calls
  try {
    let q = supabaseAdmin.from('kvh_calls').select('*').order('created_at', { ascending: false }).limit(limit);
    if (workspaceId && workspaceId !== 'ALL') {
      q = q.eq('workspace_id', workspaceId);
    }
    const { data, error } = await q;
    if (!error && data && data.length > 0) {
      return data as CallRecord[];
    }
  } catch {}

  // 2. Fallback: knowledge_base
  try {
    let q = supabaseAdmin.from('knowledge_base').select('content').contains('tags', ['kvh_call']).order('created_at', { ascending: false }).limit(limit);
    const { data } = await q;
    if (data && data.length > 0) {
      const list: CallRecord[] = [];
      for (const item of data) {
        try {
          const parsed = JSON.parse(item.content);
          if (!workspaceId || workspaceId === 'ALL' || parsed.workspace_id === workspaceId) {
            list.push(parsed);
          }
        } catch {}
      }
      return list;
    }
  } catch {}

  return [];
}
