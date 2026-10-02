export interface Cliente {
  cliente_id: string;
  nome: string;
  status: 'ativo' | 'encerrado' | 'pausado' | string;
  parent_cliente_id?: string | null;
  grupo_whatsapp_id?: string | null;
  drive_folder_id?: string | null;
  data_inicio?: string | null;
  data_encerramento?: string | null;
  atualizado_em?: string | null;
}

export interface GroupAdMapping {
  id: string;
  group_jid?: string;
  group_name?: string;
  client_name?: string;
  meta_account_id?: string;
  meta_account_name?: string;
  google_customer_id?: string;
  google_account_name?: string;
  created_at?: string;
  updated_at?: string;
}

export interface GroupAdAccount {
  id: string;
  group_jid?: string;
  plataforma: 'meta' | 'google' | string;
  account_id: string;
  account_name: string;
  ativo: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface CsStatus {
  id: string;
  cliente_id: string;
  nivel: 'saudavel' | 'em_risco' | 'critico' | string;
  sinais?: {
    nota?: string;
    ciclo?: string;
    emoji?: string;
    [key: string]: unknown;
  } | null;
  data?: string;
  agente_origem?: string;
  criado_em?: string;
}

export interface AgenteEvento {
  id: string;
  tipo: string;
  agente: string;
  cliente_id?: string | null;
  descricao: string;
  status: 'pendente' | 'em_andamento' | 'resolvido' | 'concluido' | string;
  prioridade: 'baixa' | 'media' | 'alta' | 'urgente' | string;
  criado_em?: string;
}

export interface WhatsAppMessage {
  id: string;
  group_name?: string;
  group_jid: string;
  sender_name?: string;
  sender_phone?: string;
  msg_date: string;
  msg_type: string;
  content: string;
  created_at?: string;
}

export interface WhatsAppDailySummary {
  id: string;
  group_name?: string;
  group_jid: string;
  date: string;
  summary: string;
  message_count: number;
  embedding?: number[] | null;
  created_at?: string;
}

export interface HermesTokenUsage {
  id: number;
  date: string;
  timestamp: string;
  source: string;
  task: string;
  model?: string | null;
  prompt_tokens?: number | null;
  completion_tokens?: number | null;
  total_tokens?: number | null;
  cost_usd?: number | null;
  credits_remaining?: number | null;
  credits_used_total?: number | null;
  notes?: string | null;
  created_at?: string;
}
