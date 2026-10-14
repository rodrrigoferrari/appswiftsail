import { NextRequest, NextResponse } from 'next/server';
import { KommoClient } from '@/lib/adapters/kommo/client';
import { formatE164 } from '@/lib/phone';
import { getKommoCredentialsForClient } from '@/lib/services/credentials-resolver';
import { getCallRecord, updateCallRecord, saveCallRecord } from '@/lib/services/kvh-storage';

export const dynamic = 'force-dynamic';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, PATCH',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-api-key',
};

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: corsHeaders,
  });
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  const timeStr = `${m < 10 ? '0' + m : m}:${s < 10 ? '0' + s : s}`;
  if (seconds === 0) return '00:00 (0s - Não atendida)';
  if (m === 0) return `${timeStr} (${s}s)`;
  return `${timeStr} (${m}min ${s > 0 ? s + 's' : ''})`.trim();
}

function getFeedbackMeta(feedback: string) {
  switch (feedback) {
    case 'lead_nao_atendeu':
      return {
        label: 'Lead não atendeu',
        emoji: '📵',
        status: 'missed',
      };
    case 'call_negativa':
      return {
        label: 'Call foi negativa',
        emoji: '👎',
        status: 'ended',
      };
    case 'call_positiva':
      return {
        label: 'Call foi positiva',
        emoji: '🟢',
        status: 'ended',
      };
    default:
      return {
        label: feedback || 'Finalizada',
        emoji: '📞',
        status: 'ended',
      };
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const {
      callId,
      leadId,
      contactId,
      phone,
      durationSeconds = 0,
      feedback = 'call_positiva',
      note,
      responsibleUserId,
      cliente_id,
      subdomain,
      apiKey,
    } = body;

    const feedbackMeta = getFeedbackMeta(feedback);
    const durationFormatted = formatDuration(Number(durationSeconds) || 0);

    // Texto estruturado da Tarefa
    const taskTextLines = [
      `📞 Chamada WhatsApp (UAZAPI)`,
      `• Resultado: ${feedbackMeta.emoji} ${feedbackMeta.label}`,
      `• Duração: ${durationFormatted}`,
    ];

    if (note && typeof note === 'string' && note.trim().length > 0) {
      taskTextLines.push(`• Observações: ${note.trim()}`);
    }

    const taskText = taskTextLines.join('\n');

    // 1. Obter chamada existente para saber o cliente, ou usar parâmetros recebidos
    let existingCall = callId ? await getCallRecord(callId) : null;
    const targetWorkspace = existingCall?.workspace_id || cliente_id || apiKey || subdomain || 'swiftsail';

    // 2. Resolver credenciais do Kommo CRM cadastradas pelo Admin para este cliente
    const kommoCreds = await getKommoCredentialsForClient(targetWorkspace, subdomain);

    let kommoTaskId: string | null = null;
    let kommoNoteId: string | null = null;
    let syncError: string | null = null;

    if (kommoCreds && kommoCreds.accessToken) {
      const kommoClient = new KommoClient(kommoCreds.baseDomain, kommoCreds.accessToken);

      // Determinar entidade no Kommo
      let entityType: 'leads' | 'contacts' = 'leads';
      let entityId = leadId || existingCall?.lead_id || contactId || existingCall?.contact_id || '';

      if (!entityId && phone) {
        try {
          const resEntity = await kommoClient.resolveEntity({
            explicitLeadId: leadId ? String(leadId) : null,
            explicitContactId: contactId ? String(contactId) : null,
            phone: String(phone),
          });
          if (resEntity.entityId) {
            entityId = resEntity.entityId;
            entityType = resEntity.entityType || 'contacts';
          }
        } catch (e) {
          console.warn('[Entity Resolution Warning]:', e);
        }
      } else if (contactId && !leadId) {
        entityType = 'contacts';
        entityId = contactId;
      }

      if (entityId) {
        // Criar Tarefa Concluída no Kommo (task_type_id: 1)
        try {
          const taskRes = await kommoClient.createTask({
            entityId,
            entityType,
            text: taskText,
            durationSeconds: Number(durationSeconds) || 0,
            feedback,
            responsibleUserId,
            isCompleted: true,
          });
          kommoTaskId = taskRes.taskId;
        } catch (err: any) {
          console.error('[Kommo Task Creation Error]:', err.message);
          syncError = err.message;
        }

        // Criar Nota na Timeline do Lead
        try {
          const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
          const targetPhone = phone || existingCall?.phone_e164 || '+5500000000000';
          const noteRes = await kommoClient.createCallNote({
            entityId,
            entityType,
            noteType: 'call_out',
            uniq: callId || `call_${Date.now()}`,
            durationSeconds: Number(durationSeconds) || 0,
            phone: formatE164(String(targetPhone)),
            historyLink: `${appUrl}/whatsapp?tab=ligacoes`,
            source: `WhatsApp Swiftsail • ${feedbackMeta.label}`,
          });
          kommoNoteId = noteRes.noteId;
        } catch (noteErr: any) {
          console.warn('[Kommo Note Creation Warning]:', noteErr.message);
        }
      }
    } else {
      console.warn('[Kommo Credentials Warning]: Nenhuma credencial Kommo encontrada para o workspace:', targetWorkspace);
    }

    // 3. Atualizar ou registrar no banco de dados
    const now = new Date().toISOString();
    const updatePayload = {
      status: feedbackMeta.status,
      duration_seconds: Number(durationSeconds) || 0,
      call_feedback: feedback,
      call_feedback_note: note || null,
      kommo_task_id: kommoTaskId,
      kommo_note_id: kommoNoteId,
      kommo_sync_status: kommoTaskId ? 'synced' : syncError ? 'sync_failed' : 'not_applicable',
      kommo_last_sync_error: syncError,
      ended_at: now,
    };

    if (callId) {
      await updateCallRecord(callId, updatePayload);
    } else {
      await saveCallRecord({
        workspace_id: targetWorkspace,
        lead_id: leadId ? String(leadId) : null,
        contact_id: contactId ? String(contactId) : null,
        phone_e164: phone ? formatE164(String(phone)) : '+5500000000000',
        ...updatePayload,
      });
    }

    return NextResponse.json(
      {
        success: true,
        feedback,
        feedbackLabel: feedbackMeta.label,
        durationSeconds: Number(durationSeconds) || 0,
        durationFormatted,
        taskId: kommoTaskId,
        noteId: kommoNoteId,
        kommoSyncStatus: kommoTaskId ? 'synced' : syncError ? 'sync_failed' : 'not_applicable',
        message: kommoTaskId
          ? 'Tarefa e feedback de ligação registrados no Kommo com sucesso!'
          : 'Feedback registrado no histórico da plataforma.',
      },
      {
        status: 200,
        headers: corsHeaders,
      }
    );
  } catch (err: any) {
    console.error('[Call Feedback POST Error]:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Erro ao registrar feedback da chamada' },
      { status: 500, headers: corsHeaders }
    );
  }
}
