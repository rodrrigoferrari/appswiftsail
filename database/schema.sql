-- ==============================================================================
-- KOMMO CRM + WHATSAPP (UAZAPI) VOICE CALL & FEEDBACK - SCHEMA COMPLETO
-- Compatível com PostgreSQL / Supabase
-- ==============================================================================

-- 1. Tabela de Conexões WhatsApp / UAZAPI
CREATE TABLE IF NOT EXISTS public.kvh_uazapi_connections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL,
    name TEXT NOT NULL,
    server_url TEXT NOT NULL DEFAULT 'https://swiftsail.uazapi.com',
    instance_name TEXT NOT NULL,
    instance_token_encrypted TEXT NOT NULL,
    webhook_secret_hash TEXT,
    status TEXT NOT NULL DEFAULT 'disconnected' CHECK (status IN ('connected', 'connecting', 'disconnected', 'error')),
    last_webhook_at TIMESTAMPTZ,
    events_processed_count INT DEFAULT 0,
    events_failed_count INT DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_kvh_uazapi_workspace ON public.kvh_uazapi_connections(workspace_id);
CREATE INDEX IF NOT EXISTS idx_kvh_uazapi_instance ON public.kvh_uazapi_connections(instance_name);

-- 2. Tabela de Conexões Kommo CRM
CREATE TABLE IF NOT EXISTS public.kvh_kommo_connections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL,
    base_domain TEXT NOT NULL,
    client_id TEXT NOT NULL,
    client_secret_encrypted TEXT,
    access_token_encrypted TEXT NOT NULL,
    refresh_token_encrypted TEXT NOT NULL,
    token_expires_at TIMESTAMPTZ,
    account_id TEXT,
    status TEXT NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_kvh_kommo_workspace ON public.kvh_kommo_connections(workspace_id);

-- 3. Tabela de Registro Operacional de Chamadas e Feedback
CREATE TABLE IF NOT EXISTS public.kvh_calls (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL,
    user_id UUID,
    lead_id TEXT,
    contact_name TEXT,
    phone_e164 TEXT NOT NULL,
    direction TEXT NOT NULL DEFAULT 'outbound' CHECK (direction IN ('inbound', 'outbound')),
    status TEXT NOT NULL DEFAULT 'initiated' CHECK (status IN ('initiated', 'ringing', 'in_progress', 'ended', 'missed', 'rejected', 'failed')),
    hangup_reason TEXT,
    duration_seconds INT DEFAULT 0,
    started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    connected_at TIMESTAMPTZ,
    ended_at TIMESTAMPTZ,
    uazapi_call_id TEXT,
    
    -- Campos de Feedback e Sincronização Kommo
    call_feedback TEXT CHECK (call_feedback IN ('lead_nao_atendeu', 'call_negativa', 'call_positiva', 'outro')),
    call_feedback_note TEXT,
    kommo_task_id TEXT,
    kommo_sync_status TEXT NOT NULL DEFAULT 'pending' CHECK (kommo_sync_status IN ('pending', 'synced', 'sync_failed', 'not_applicable')),
    kommo_last_sync_error TEXT,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_kvh_calls_workspace ON public.kvh_calls(workspace_id);
CREATE INDEX IF NOT EXISTS idx_kvh_calls_lead ON public.kvh_calls(lead_id);
CREATE INDEX IF NOT EXISTS idx_kvh_calls_phone ON public.kvh_calls(phone_e164);
CREATE INDEX IF NOT EXISTS idx_kvh_calls_status ON public.kvh_calls(status);
CREATE INDEX IF NOT EXISTS idx_kvh_calls_feedback ON public.kvh_calls(call_feedback);
