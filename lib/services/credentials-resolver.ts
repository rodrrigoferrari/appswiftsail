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
        if (parsed.instance_name) instanceName = parsed.instance_name;
        if (parsed.server_url) serverUrl = parsed.server_url;
        
        // Verifica se a instância salva no Supabase está realmente conectada
        if (parsed.token) {
          const cleanUrl = (parsed.server_url || serverUrl).replace(/\/+$/, '');
          const statusRes = await fetch(`${cleanUrl}/instance/status`, {
            headers: { token: parsed.token },
            cache: 'no-store',
          }).catch(() => null);

          if (statusRes && statusRes.ok) {
            const statusJson = await statusRes.json();
            if (statusJson.status?.connected === true || statusJson.instance?.status === 'connected') {
              instanceToken = parsed.token;
            }
          }
        }
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
        // Instância master global só pode ser herdada pelo próprio workspace swiftsail (agência)
        if (targetClient === 'swiftsail' && !instanceToken && parsed.uazapi_instance_token) {
          instanceToken = parsed.uazapi_instance_token;
        }
      } catch {}
    }

    // 3. Fallback inteligente: buscar instâncias ativas na UAZAPI via adminToken
    if (!instanceToken && adminToken) {
      try {
        const cleanBaseUrl = serverUrl.replace(/\/+$/, '');
        const res = await fetch(`${cleanBaseUrl}/instance/all`, {
          headers: { admintoken: adminToken },
          cache: 'no-store',
        });
        if (res.ok) {
          const instances = await res.json();
          if (Array.isArray(instances)) {
            const cleanTarget = targetClient.toLowerCase().replace(/[^a-z0-9]/g, '');
            // Prioridade 1: Match por nome do cliente na instância (ignora instâncias de notificações/master da agência se for cliente)
            const matched = instances.find((inst: any) => {
              const cleanName = (inst.name || '').toLowerCase().replace(/[^a-z0-9]/g, '');
              if (targetClient !== 'swiftsail') {
                if (cleanName.includes('notificac') || (cleanName.includes('swiftsail') && !cleanName.includes(cleanTarget))) {
                  return false;
                }
              }
              return cleanName.includes(cleanTarget) || (cleanTarget.length > 4 && cleanTarget.includes(cleanName));
            });

            if (matched && matched.token) {
              instanceToken = matched.token;
              instanceName = matched.name;
            } else if (targetClient === 'swiftsail') {
              // Somente para a agência Swiftsail permite fallback de qualquer instância conectada
              const connectedAny = instances.find((inst: any) => inst.status === 'connected');
              if (connectedAny && connectedAny.token) {
                instanceToken = connectedAny.token;
                instanceName = connectedAny.name;
              }
            }
          }
        }
      } catch (allErr) {
        console.warn('[Uazapi Instances Fetch Warning]:', allErr);
      }
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

/**
 * Retorna todas as instâncias existentes na UAZAPI com seus status e nomes
 */
export async function getAllUazapiInstances(): Promise<Array<{ name: string; status: string; token: string }>> {
  try {
    const creds = await getUazapiCredentialsForClient('swiftsail');
    if (!creds.adminToken) return [];

    const res = await fetch(`${creds.serverUrl}/instance/all`, {
      headers: { admintoken: creds.adminToken },
      cache: 'no-store',
    });

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) {
        return data.map((inst: any) => {
          const rawStatus = inst.status ?? inst.state ?? '';
          let normalizedStatus = 'disconnected';

          if (typeof rawStatus === 'string') {
            const lower = rawStatus.toLowerCase();
            if (lower === 'connected' || lower === 'open') normalizedStatus = 'connected';
            else if (lower === 'connecting' || lower === 'pairing') normalizedStatus = 'connecting';
            else normalizedStatus = 'disconnected';
          } else if (typeof rawStatus === 'object' && rawStatus !== null) {
            if (rawStatus.connected === true) normalizedStatus = 'connected';
            else if (rawStatus.connecting === true) normalizedStatus = 'connecting';
            else normalizedStatus = 'disconnected';
          }

          return {
            name: inst.name || 'Instância sem nome',
            status: normalizedStatus,
            token: inst.token || '',
            owner: inst.owner || inst.phone || '',
            profileName: inst.profileName || '',
            profilePicUrl: inst.profilePicUrl || '',
            systemName: inst.systemName || 'app.swiftsail',
            updated: inst.updated || inst.created || '',
          };
        });
      }
    }
    return [];
  } catch (e) {
    console.warn('[getAllUazapiInstances Error]:', e);
    return [];
  }
}
