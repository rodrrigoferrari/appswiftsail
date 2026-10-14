export interface KommoTokens {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: Date;
  baseDomain: string;
}

export interface KommoContact {
  id: string;
  name: string;
  phones: string[];
}

export interface KommoLead {
  id: string;
  name: string;
  price?: number;
  contactId?: string;
}

export type CallFeedbackType = 'lead_nao_atendeu' | 'call_negativa' | 'call_positiva' | string;

export interface CreateCallNoteParams {
  entityId: number | string;
  entityType: 'leads' | 'contacts';
  noteType: 'call_out' | 'call_in';
  uniq: string;
  durationSeconds: number;
  phone: string;
  historyLink: string;
  source?: string;
  feedbackText?: string;
}

export interface CreateTaskParams {
  entityId: number | string;
  entityType: 'leads' | 'contacts';
  text: string;
  durationSeconds?: number;
  feedback?: CallFeedbackType;
  responsibleUserId?: number | string;
  isCompleted?: boolean;
}

export interface CreateSummaryNoteParams {
  entityId: number | string;
  entityType: 'leads' | 'contacts';
  text: string;
}

export interface ResolutionResult {
  status: 'resolved' | 'needs_review' | 'not_found';
  entityType?: 'leads' | 'contacts';
  entityId?: string;
  contactName?: string;
  matchesCount: number;
}
