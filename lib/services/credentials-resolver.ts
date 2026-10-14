import { supabaseAdmin } from '@/lib/supabase/admin';
import { decrypt } from '@/lib/crypto';

export interface ResolvedKommoCredentials {
  baseDomain: string;
  accessToken: string;
  pipelineId?: string;
  clienteId?: string;
  source: 'client_config' | 'master_admin' | 'env' | 'none';
}

export interface ResolvedUazapiCredentials {
  serverUrl: string;
  adminToken: string;
  instanceToken?: string;
  instanceName?: string;
  clienteId?: string;
}

/**
 * Resolve as credenciais do Kommo CRM para um determinado cliente ou subdomínio.
 * Prioridade:
 * 1. Credencial específica do cliente salva pelo Admin em /credenciais/cliente (tag: client_credentials, cliente_id)
 * 2. Credencial master salva pelo Admin em /credenciais/admin (tag: admin, credentials)
 * 3. Variáveis de ambiente (.env.local)
 */
export async function getKommoCredentialsForClient(
  clienteId?: string | null,
  subdomainHint?: string | null
): Promise<ResolvedKommoCredentials | null> {
  try {
    // 1. Se clienteId foi fornecido, buscar credencial específica do cliente
    if (clienteId && clienteId !== 'ALL') {
      const { data } = await supabaseAdmin
        .from('knowledge_base')
        .select('content')
        .contains('tags', ['client_credentials', clienteId])
        .order('created_at', { ascending: false })
        .limit(1);

      if (data && data.length > 0) {
        try {
          const parsed = JSON.parse(data[0].content);
          if (parsed.kommo_token && (parsed.kommo_subdomain || subdomainHint)) {
            return {
              baseDomain: parsed.kommo_subdomain || subdomainHint || '',
              accessToken: parsed.kommo_token,
              pipelineId: parsed.kommo_pipeline_id,
              clienteId,
              source: 'client_config',
            };
          }
        } catch {}
      }
    }

    // 2. Se temos subdomainHint mas não achamos pelo clienteId, buscar em todas as credenciais de clientes
    if (subdomainHint) {
      const cleanSub = subdomainHint.toLowerCase().replace('.kommo.com', '').trim();
      const { data: allClients } = await supabaseAdmin
        .from('knowledge_base')
        .select('content')
        .contains('tags', ['client_credentials'])
        .limit(20);

      if (allClients) {
        for (const item of allClients) {
          try {
            const parsed = JSON.parse(item.content);
            const itemSub = (parsed.kommo_subdomain || '').toLowerCase().trim();
            if (itemSub === cleanSub && parsed.kommo_token) {
              return {
                baseDomain: parsed.kommo_subdomain,
                accessToken: parsed.kommo_token,
                pipelineId: parsed.kommo_pipeline_id,
                clienteId: parsed.cliente_id,
                source: 'client_config',
              };
            }
          } catch {}
        }
      }
    }

    // 3. Fallback: Credenciais Master do Admin
    const { data: masterData } = await supabaseAdmin
      .from('knowledge_base')
      .select('content')
      .contains('tags', ['admin', 'credentials'])
      .order('created_at', { ascending: false })
      .limit(1);

    if (masterData && masterData.length > 0) {
      try {
        const parsed = JSON.parse(masterData[0].content);
        if (parsed.kommo_token) {
          return {
            baseDomain: parsed.kommo_subdomain || subdomainHint || 'swiftsail',
            accessToken: parsed.kommo_token,
            clienteId: clienteId || undefined,
            source: 'master_admin',
          };
        }
      } catch {}
    }

    // 4. Fallback: Variáveis de Ambiente
    if (process.env.KOMMO_ACCESS_TOKEN || process.env.KOMMO_TOKEN) {
      return {
        baseDomain: process.env.KOMMO_SUBDOMAIN || subdomainHint || 'swiftsail',
        accessToken: process.env.KOMMO_ACCESS_TOKEN || process.env.KOMMO_TOKEN || '',
        clienteId: clienteId || undefined,
        source: 'env',
      };
    }

    return null;
  } catch (error) {
    console.error('[Credentials Resolver Error]:', error);
    return null;
  }
}

/**
 * Resolve as credenciais e instância da UAZAPI para um cliente ou workspace
 */
export async function getUazapiCredentialsForClient(
  clienteId?: string | null
): Promise<ResolvedUazapiCredentials> {
  const targetClient = clienteId && clienteId !== 'ALL' ? clienteId : 'swiftsail';

  let serverUrl = process.env.UAZAPI_URL || process.env.UAZAPI_SERVER_URL || 'https://swiftsail.uazapi.com';
  let adminToken = process.env.UAZAPI_ADMIN_TOKEN || '';
  let instanceToken: string | undefined = undefined;
  let instanceName = `swiftsail-${targetClient.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;

  try {
    // 1. Buscar se há instância salva para este cliente
    const { data: instData } = await supabaseAdmin
      .from('knowledge_base')
      .select('content')
      .contains('tags', ['uazapi_instance', targetClient])
      .order('created_at', { ascending: false })
      .limit(1);

    if (instData && instData.length > 0) {
      try {
        const parsed = JSON.parse(instData[0].content);
        if (parsed.token) instanceToken = parsed.token;
        if (parsed.instance_name) instanceName = parsed.instance_name;
        if (parsed.server_url) serverUrl = parsed.server_url;
      } catch {}
    }

    // 2. Buscar credenciais master
    const { data: masterData } = await supabaseAdmin
      .from('knowledge_base')
      .select('content')
      .contains('tags', ['admin', 'credentials'])
      .order('created_at', { ascending: false })
      .limit(1);

    if (masterData && masterData.length > 0) {
      try {
        const parsed = JSON.parse(masterData[0].content);
        if (parsed.uazapi_url) serverUrl = parsed.uazapi_url;
        if (parsed.uazapi_token) adminToken = parsed.uazapi_token;
        if (!instanceToken && parsed.uazapi_instance_token) {
          instanceToken = parsed.uazapi_instance_token;
        }
      } catch {}
    }
  } catch (err) {
    console.warn('[Uazapi Credentials Resolver Warning]:', err);
  }

  return {
    serverUrl: serverUrl.replace(/\/+$/, ''),
    adminToken,
    instanceToken,
    instanceName,
    clienteId: targetClient,
  };
}
