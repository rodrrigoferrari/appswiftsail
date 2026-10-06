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
  cliente_id?: string;
  group_jid?: string;
  plataforma: 'meta' | 'google' | string;
  account_id: string;
  account_name: string;
  ativo: boolean;
  created_at?: string;
  updated_at?: string;
}

// painel.contas_ads (Cleide): conta de anúncio já amarrada ao cliente_id
export interface ContaAdsPainel {
  cliente_id: string;
  plataforma: 'meta' | 'google' | string;
  account_id: string;
  nome: string;
  status?: string | number | null;
  moeda?: string | null;
}

// painel.kommo_etapas (Cleide): etapas do pipeline com classificação conta_como
export interface KommoEtapaPainel {
  cliente_id: string;
  pipeline_id: number | string;
  pipeline_nome: string;
  status_id: number | string;
  etapa_nome: string;
  conta_como: 'aberta' | 'ganho' | 'perda' | string;
}

// painel.campanhas_status (Cleide): status e orçamento diário em reais
export interface CampanhaStatusPainel {
  cliente_id: string;
  plataforma: 'meta' | 'google' | string;
  campaign_id: string;
  campanha: string;
  status: string | null;
  effective_status: string | null;
  orcamento_diario: number | null;
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

export type UserRole =
  | 'master_admin'
  | 'gestor_trafego'
  | 'cs_account'
  | 'cliente_admin'
  | 'cliente_membro';

export type UserModulePermission = 'midia' | 'whatsapp' | 'criativos' | 'crm' | 'financeiro';

export interface AppUser {
  id: string;
  nome: string;
  email: string;
  role: UserRole;
  cliente_id?: string | null;
  cliente_nome?: string | null;
  status: 'ativo' | 'convidado' | 'bloqueado';
  modulos: UserModulePermission[];
  avatar_url?: string;
  ultimo_acesso?: string | null;
  criado_em?: string;
}

export interface UserInvite {
  id: string;
  nome: string;
  email: string;
  role: UserRole;
  cliente_id?: string | null;
  cliente_nome?: string | null;
  modulos: UserModulePermission[];
  token: string;
  link_ativacao: string;
  status: 'pendente' | 'aceito' | 'expirado' | 'revogado';
  expira_em: string;
  criado_em: string;
}

export interface SyncRodada {
  id?: string;
  fonte: 'kommo' | 'meta' | 'google' | string;
  account_id?: string;
  entidade?: string;
  iniciado_em: string;
  terminado_em?: string | null;
  status: 'ok' | 'erro' | 'em_andamento' | string;
  linhas?: number | null;
  erro?: string | null;
  detalhes?: Record<string, unknown> | null;
}

// Cleide Schema: ads.meta_*
export interface MetaConta {
  account_id: string;
  cliente_id: string;
  nome: string;
  account_status?: number | string | null;
  moeda?: string | null;
}

export interface MetaCampanha {
  campaign_id: string;
  cliente_id: string;
  nome: string;
  objetivo?: string | null;
  status?: string | null;
  effective_status?: string | null;
  daily_budget?: number | null;
  lifetime_budget?: number | null;
  excluido_em?: string | null;
}

export interface MetaConjunto {
  adset_id: string;
  campaign_id: string;
  cliente_id: string;
  nome: string;
  daily_budget?: number | null;
  excluido_em?: string | null;
}

export interface MetaAnuncio {
  ad_id: string;
  adset_id: string;
  campaign_id: string;
  cliente_id: string;
  nome: string;
  creative_id?: string | null;
  excluido_em?: string | null;
}

export interface MetaResultadoAnuncioDia {
  cliente_id: string;
  campaign_id: string;
  adset_id?: string;
  ad_id?: string;
  data: string;
  gasto: number;
  impressoes: number;
  alcance?: number;
  frequencia?: number;
  cliques: number;
  cliques_link: number;
  ctr?: number;
  cpm?: number;
  leads: number;
  conversas_iniciadas?: number;
  video_views?: number;
  thruplays?: number;
}

// Cleide Schema: ads.google_*
export interface GoogleConta {
  customer_id: string;
  cliente_id: string;
  nome: string;
  status?: string | null;
  moeda?: string | null;
}

export interface GoogleCampanha {
  campaign_id: string;
  customer_id: string;
  cliente_id: string;
  nome: string;
  tipo?: string | null;
  status?: string | null;
  orcamento_diario?: number | null;
  excluido_em?: string | null;
}

export interface GoogleResultadoDia {
  cliente_id: string;
  nivel: string;
  entidade_id: string;
  campaign_id?: string;
  data: string;
  gasto: number;
  impressoes: number;
  cliques: number;
  conversoes: number;
  valor_conversoes?: number;
}

// Cleide Schema: ads.kommo_*
export interface KommoConta {
  conta: string;
  cliente_id: string;
}

export interface KommoFunil {
  pipeline_id: number | string;
  nome: string;
  cliente_id: string;
}

export interface KommoEtapa {
  status_id: number | string;
  pipeline_id: number | string;
  nome: string;
  conta_como?: string | null;
}

export interface KommoLead {
  id?: string | number;
  cliente_id: string;
  origem?: string | null;
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
  utm_content?: string | null;
  utm_term?: string | null;
  gclid?: string | null;
  fbclid?: string | null;
  campanha_nome?: string | null;
  criativo_nome?: string | null;
  anuncio_meta_id?: string | null;
  criado_em: string;
  pipeline_id?: number | string | null;
  status_id?: number | string | null;
  valor?: number | null;
  excluido_em?: string | null;
}

export interface MetaAnuncioCriativoPainel {
  cliente_id: string;
  account_id?: string;
  campaign_id: string;
  campanha: string | null;
  adset_id: string;
  conjunto: string | null;
  ad_id: string;
  anuncio: string | null;
  status: string | null;
  effective_status: string | null;
  creative_id?: string | null;
  criativo_nome?: string | null;
  criativo_titulo?: string | null;
  criativo_tipo?: string | null;
  preview_link?: string | null;
  link_permanente?: string | null;
  instagram_permalink_url?: string | null;
  link_destino?: string | null;
  thumbnail_storage_path?: string | null;
  created_time?: string | null;
  updated_time?: string | null;
}

export interface KommoLeadPainel {
  cliente_id: string;
  conta?: string | null;
  lead_id: string;
  contato_principal_nome?: string | null;
  pipeline_id?: string | number | null;
  pipeline_nome?: string | null;
  status_id?: string | number | null;
  etapa_nome?: string | null;
  conta_como?: string | null;
  responsavel_id?: string | number | null;
  loss_reason_id?: string | null;
  valor?: number | null;
  criado_em: string;
  fechado_em?: string | null;
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
  utm_content?: string | null;
  utm_term?: string | null;
  origem?: string | null;
  publico?: string | null;
  campanha_nome?: string | null;
  conta_origem?: string | null;
  criativo_nome?: string | null;
  anuncio_meta_id?: string | null;
  link_criativo?: string | null;
  termo_busca?: string | null;
}
