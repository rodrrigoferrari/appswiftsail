import { supabaseAdmin } from '@/lib/supabase/admin';

interface UazapiConfig {
  baseUrl: string;
  adminToken: string;
}

export async function getUazapiAdminConfig(): Promise<UazapiConfig> {
  const { data } = await supabaseAdmin
    .from('knowledge_base')
    .select('content')
    .contains('tags', ['admin', 'credentials'])
    .order('created_at', { ascending: false })
    .limit(1);

  if (data && data.length > 0) {
    try {
      const parsed = JSON.parse(data[0].content);
      return {
        baseUrl: parsed.uazapi_url || process.env.UAZAPI_SERVER_URL || 'https://api.uazapi.com',
        adminToken: parsed.uazapi_token || process.env.UAZAPI_ADMIN_TOKEN || '',
      };
    } catch {
      // Fallback
    }
  }

  return {
    baseUrl: process.env.UAZAPI_SERVER_URL || 'https://api.uazapi.com',
    adminToken: process.env.UAZAPI_ADMIN_TOKEN || '',
  };
}

/**
 * Creates a dedicated WhatsApp instance for a client using the Master Admin Token
 * Endpoint: POST /instance/create
 * Header: admintoken: ADMIN_TOKEN
 */
export async function createClientInstance(instanceName: string) {
  const { baseUrl, adminToken } = await getUazapiAdminConfig();

  if (!adminToken) {
    throw new Error('Admin Token da Uazapi não configurado nas Credenciais Master.');
  }

  const cleanUrl = baseUrl.replace(/\/+$/, '');
  const res = await fetch(`${cleanUrl}/instance/create`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      admintoken: adminToken,
    },
    body: JSON.stringify({
      name: instanceName,
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || data.error || `Erro HTTP ${res.status} ao criar instância.`);
  }

  return data; // returns { token, name, status, ... }
}

/**
 * Fetches the status of a specific client instance
 * Endpoint: GET /instance/status
 * Header: token: INSTANCE_TOKEN
 */
export async function getInstanceStatus(instanceToken: string, baseUrlOverride?: string) {
  const { baseUrl } = await getUazapiAdminConfig();
  const url = (baseUrlOverride || baseUrl).replace(/\/+$/, '');

  const res = await fetch(`${url}/instance/status`, {
    method: 'GET',
    headers: {
      token: instanceToken,
    },
    cache: 'no-store',
  });

  if (!res.ok) {
    return { status: 'disconnected', error: `HTTP ${res.status}` };
  }

  return await res.json();
}

/**
 * Initiates WhatsApp connection (QR Code or Pairing Code)
 * Endpoint: POST /instance/connect
 * Header: token: INSTANCE_TOKEN
 */
export async function connectInstance(instanceToken: string, phone?: string, baseUrlOverride?: string) {
  const { baseUrl } = await getUazapiAdminConfig();
  const url = (baseUrlOverride || baseUrl).replace(/\/+$/, '');

  const body = phone ? { phone: phone.replace(/\D/g, '') } : {};

  const res = await fetch(`${url}/instance/connect`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      token: instanceToken,
    },
    body: JSON.stringify(body),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || data.error || 'Erro ao iniciar conexão WhatsApp.');
  }

  return data; // returns { qrcode, code, status, ... }
}

/**
 * Lists WhatsApp groups for the instance
 * Endpoint: POST /group/list
 * Header: token: INSTANCE_TOKEN
 */
export async function listInstanceGroups(instanceToken: string, limit = 50, offset = 0) {
  const { baseUrl } = await getUazapiAdminConfig();
  const cleanUrl = baseUrl.replace(/\/+$/, '');

  const res = await fetch(`${cleanUrl}/group/list`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      token: instanceToken,
    },
    body: JSON.stringify({
      limit,
      offset,
      noParticipants: false,
    }),
  });

  if (!res.ok) {
    return { groups: [] };
  }

  return await res.json();
}

/**
 * Retrieves details and participants of a specific group
 * Endpoint: POST /group/info
 * Header: token: INSTANCE_TOKEN
 */
export async function getGroupInfo(instanceToken: string, groupJid: string) {
  const { baseUrl } = await getUazapiAdminConfig();
  const cleanUrl = baseUrl.replace(/\/+$/, '');

  const res = await fetch(`${cleanUrl}/group/info`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      token: instanceToken,
    },
    body: JSON.stringify({
      groupjid: groupJid,
    }),
  });

  if (!res.ok) {
    throw new Error('Não foi possível obter informações do grupo.');
  }

  return await res.json();
}

/**
 * Sends a text message with async queue support
 * Endpoint: POST /send/text
 * Header: token: INSTANCE_TOKEN
 */
export async function sendTextMessage(
  instanceToken: string,
  number: string,
  text: string,
  isAsync = true
) {
  const { baseUrl } = await getUazapiAdminConfig();
  const cleanUrl = baseUrl.replace(/\/+$/, '');

  const cleanNumber = number.replace(/\D/g, '');

  const res = await fetch(`${cleanUrl}/send/text`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      token: instanceToken,
    },
    body: JSON.stringify({
      number: cleanNumber,
      text,
      async: isAsync,
      track_source: 'swiftsail_broadcast',
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || data.error || 'Erro ao enviar mensagem.');
  }

  return data;
}

/**
 * Configures Webhook for the instance
 * Endpoint: POST /webhook
 * Header: token: INSTANCE_TOKEN
 */
export async function setupInstanceWebhook(instanceToken: string, webhookUrl: string) {
  const { baseUrl } = await getUazapiAdminConfig();
  const cleanUrl = baseUrl.replace(/\/+$/, '');

  const res = await fetch(`${cleanUrl}/webhook`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      token: instanceToken,
    },
    body: JSON.stringify({
      enabled: true,
      url: webhookUrl,
      events: ['messages', 'messages_update', 'connection', 'groups'],
      excludeMessages: ['wasSentByApi'],
    }),
  });

  return await res.json();
}
