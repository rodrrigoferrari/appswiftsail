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
 * Endpoint: POST /instance/init
 * Header: admintoken: ADMIN_TOKEN
 */
export async function createClientInstance(instanceName: string) {
  const { baseUrl, adminToken } = await getUazapiAdminConfig();

  if (!adminToken) {
    throw new Error('Admin Token da Uazapi não configurado nas Credenciais Master.');
  }

  const cleanUrl = baseUrl.replace(/\/+$/, '');
  const res = await fetch(`${cleanUrl}/instance/init`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      admintoken: adminToken,
    },
    body: JSON.stringify({
      name: instanceName,
      systemName: 'app.swiftsail',
      fingerprintProfile: 'chrome',
      browser: 'chrome',
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || data.error || `Erro HTTP ${res.status} ao criar instância.`);
  }

  return data; // returns { token, name, status, ... }
}

/**
 * Deletes a WhatsApp instance completely from UAZAPI using Instance Token & Master Admin Token
 * Endpoint: DELETE /instance
 * Headers: token: INSTANCE_TOKEN, admintoken: ADMIN_TOKEN
 */
export async function deleteClientInstance(instanceName: string, instanceToken?: string) {
  const { baseUrl, adminToken } = await getUazapiAdminConfig();

  if (!adminToken) {
    throw new Error('Admin Token da Uazapi não configurado nas Credenciais Master.');
  }

  const cleanUrl = baseUrl.replace(/\/+$/, '');

  // Se não foi fornecido instanceToken, busca dinamicamente em /instance/all
  let targetToken = instanceToken;
  if (!targetToken) {
    try {
      const resAll = await fetch(`${cleanUrl}/instance/all`, {
        headers: { admintoken: adminToken },
        cache: 'no-store',
      });
      if (resAll.ok) {
        const list = await resAll.json();
        if (Array.isArray(list)) {
          const match = list.find((i: any) => i.name === instanceName);
          if (match && match.token) targetToken = match.token;
        }
      }
    } catch {}
  }

  if (!targetToken) {
    throw new Error(`Não foi possível localizar o token da instância [${instanceName}] para exclusão.`);
  }

  const res = await fetch(`${cleanUrl}/instance`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      token: targetToken,
      admintoken: adminToken,
    },
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.message || data.error || `Erro HTTP ${res.status} ao excluir instância.`);
  }

  return data;
}

/**
 * Disconnects (logout) a WhatsApp instance session
 * Endpoint: POST /instance/disconnect
 * Header: token: INSTANCE_TOKEN
 */
export async function disconnectClientInstance(instanceToken: string) {
  const { baseUrl } = await getUazapiAdminConfig();
  const cleanUrl = baseUrl.replace(/\/+$/, '');

  const res = await fetch(`${cleanUrl}/instance/disconnect`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      token: instanceToken,
    },
  });

  const data = await res.json().catch(() => ({}));
  return data;
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
 * Consulta detalhes enriquecidos de um contato / chat no WhatsApp via UAZAPI
 * Endpoint: POST /chat/details
 * Header: token: INSTANCE_TOKEN
 * Body: { number: '5541...' }
 */
export async function getChatDetails(instanceToken: string, number: string) {
  const { baseUrl } = await getUazapiAdminConfig();
  const cleanUrl = baseUrl.replace(/\/+$/, '');
  const cleanNumber = number.replace(/\D/g, '');

  if (!cleanNumber) return null;

  try {
    const res = await fetch(`${cleanUrl}/chat/details`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        token: instanceToken,
      },
      body: JSON.stringify({
        number: cleanNumber,
        phone: cleanNumber,
      }),
    });

    if (!res.ok) {
      return null;
    }

    return await res.json();
  } catch {
    return null;
  }
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
