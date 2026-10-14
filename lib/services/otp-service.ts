import { supabaseAdmin } from '@/lib/supabase/admin';
import { getUsersStore } from '@/lib/services/users-store';
import { AppUser } from '@/types/database';

export interface OtpRecord {
  id: string;
  phone: string;
  code: string;
  expires_at: string;
  used: boolean;
  attempts?: number;
  created_at?: string;
}

/**
 * Normaliza o telefone e gera candidatos com e sem o 9º dígito para o Brasil (DDI 55)
 */
export function getPhoneCandidates(rawPhone: string): { cleanPhone: string; candidates: string[] } {
  let clean = rawPhone.replace(/\D/g, '');

  // Se o número não tem DDI mas tem 10 ou 11 dígitos, assume Brasil (55)
  if ((clean.length === 10 || clean.length === 11) && !clean.startsWith('55')) {
    clean = `55${clean}`;
  }

  const candidates: string[] = [clean];

  if (clean.startsWith('55')) {
    if (clean.length === 13) {
      // Formato com 9 dígitos no celular: 55 + 2 (DDD) + 9 (dígito) + 8 dígitos = 13
      // Adiciona versão com 8 dígitos (sem o 9º dígito após o DDD)
      candidates.push(clean.slice(0, 4) + clean.slice(5));
    } else if (clean.length === 12) {
      // Formato com 8 dígitos: 55 + 2 (DDD) + 8 dígitos = 12
      // Adiciona versão com 9 dígitos (com 9 inserido após o DDD)
      candidates.push(clean.slice(0, 4) + '9' + clean.slice(4));
    }
  }

  // Também adiciona versões sem o prefixo 55 caso o banco tenha salvo apenas o DDD+número
  if (clean.startsWith('55')) {
    const local = clean.slice(2);
    candidates.push(local);
    if (local.length === 11) {
      candidates.push(local.slice(0, 2) + local.slice(3));
    } else if (local.length === 10) {
      candidates.push(local.slice(0, 2) + '9' + local.slice(2));
    }
  }

  return { cleanPhone: clean, candidates: Array.from(new Set(candidates)) };
}

/**
 * Resolve a instância de WhatsApp para envio de mensagens de serviço e OTP
 */
export async function getNotificationInstanceConfig(): Promise<{
  serverUrl: string;
  instanceToken: string;
  source: string;
}> {
  // 1. Variáveis de ambiente diretas (Robô Swiftsail)
  if (process.env.ROBOSWIFTSAIL_URL && process.env.ROBOSWIFTSAIL_TOKEN) {
    return {
      serverUrl: process.env.ROBOSWIFTSAIL_URL.replace(/\/+$/, ''),
      instanceToken: process.env.ROBOSWIFTSAIL_TOKEN,
      source: 'env_roboswiftsail',
    };
  }

  // 2. Busca configuração de Notificações de Serviço salva pelo Master Admin na Knowledge Base
  try {
    const { data: credsData } = await supabaseAdmin
      .from('knowledge_base')
      .select('content')
      .contains('tags', ['admin', 'credentials'])
      .order('created_at', { ascending: false })
      .limit(1);

    if (credsData && credsData.length > 0) {
      const parsed = JSON.parse(credsData[0].content);
      const url = parsed.uazapi_url || process.env.UAZAPI_SERVER_URL || 'https://swiftsail.uazapi.com';
      const token =
        parsed.uazapi_service_instance_token ||
        parsed.uazapi_token ||
        process.env.UAZAPI_ADMIN_TOKEN ||
        '';

      if (token) {
        return {
          serverUrl: url.replace(/\/+$/, ''),
          instanceToken: token,
          source: 'admin_credentials_service_instance',
        };
      }
    }
  } catch (err) {
    console.warn('[OTP Service] Erro ao buscar credenciais na knowledge_base:', err);
  }

  // 3. Fallback variáveis Uazapi
  return {
    serverUrl: (process.env.UAZAPI_SERVER_URL || 'https://swiftsail.uazapi.com').replace(/\/+$/, ''),
    instanceToken: process.env.UAZAPI_ADMIN_TOKEN || '',
    source: 'env_fallback',
  };
}

/**
 * Salva e invalida códigos OTP com compatibilidade dupla (tabela otp_codes ou fallback knowledge_base)
 */
export async function storeOtpCode(phone: string, code: string, expiresAt: Date): Promise<void> {
  const { cleanPhone, candidates } = getPhoneCandidates(phone);

  // 1. Tenta salvar na tabela dedicada `otp_codes`
  try {
    // Invalida códigos anteriores
    await supabaseAdmin
      .from('otp_codes')
      .update({ used: true })
      .in('phone', candidates)
      .eq('used', false);

    const { error } = await supabaseAdmin.from('otp_codes').insert({
      phone: cleanPhone,
      code,
      expires_at: expiresAt.toISOString(),
      used: false,
    });

    if (!error) return;
  } catch {
    // Se a tabela otp_codes não existir, prossegue para fallback
  }

  // 2. Fallback resiliente: tabela `knowledge_base` com tags ['otp_code', cleanPhone]
  try {
    // Invalida anteriores
    const { data: existing } = await supabaseAdmin
      .from('knowledge_base')
      .select('id, content')
      .contains('tags', ['otp_code', cleanPhone])
      .limit(10);

    if (existing && existing.length > 0) {
      for (const row of existing) {
        try {
          const parsed = JSON.parse(row.content);
          parsed.used = true;
          await supabaseAdmin
            .from('knowledge_base')
            .update({ content: JSON.stringify(parsed) })
            .eq('id', row.id);
        } catch {}
      }
    }

    // Insere novo
    await supabaseAdmin.from('knowledge_base').insert({
      content: JSON.stringify({
        phone: cleanPhone,
        code,
        expires_at: expiresAt.toISOString(),
        used: false,
        created_at: new Date().toISOString(),
      }),
      summary: `OTP Code for ${cleanPhone}`,
      source: 'auth_otp',
      tags: ['otp_code', cleanPhone],
    });
  } catch (err) {
    console.error('[OTP Service] Falha ao persistir OTP no fallback:', err);
    throw new Error('Falha ao registrar código de autenticação.');
  }
}

/**
 * Valida o código OTP e marca como utilizado
 */
export async function verifyAndConsumeOtpCode(
  phone: string,
  code: string
): Promise<{ valid: boolean; error?: string }> {
  const { cleanPhone, candidates } = getPhoneCandidates(phone);
  const now = new Date().toISOString();

  // 1. Tenta validar via tabela `otp_codes`
  try {
    const { data: records, error } = await supabaseAdmin
      .from('otp_codes')
      .select('*')
      .in('phone', candidates)
      .eq('code', code.trim())
      .eq('used', false)
      .gt('expires_at', now)
      .order('created_at', { ascending: false })
      .limit(1);

    if (!error && records && records.length > 0) {
      const match = records[0];
      await supabaseAdmin.from('otp_codes').update({ used: true }).eq('id', match.id);
      return { valid: true };
    }
  } catch {
    // Continua para fallback
  }

  // 2. Valida via fallback `knowledge_base`
  try {
    for (const candidate of candidates) {
      const { data: kbRecords } = await supabaseAdmin
        .from('knowledge_base')
        .select('id, content')
        .contains('tags', ['otp_code', candidate])
        .order('created_at', { ascending: false })
        .limit(5);

      if (kbRecords && kbRecords.length > 0) {
        for (const row of kbRecords) {
          try {
            const parsed = JSON.parse(row.content);
            if (
              parsed.code === code.trim() &&
              parsed.used === false &&
              new Date(parsed.expires_at) > new Date()
            ) {
              parsed.used = true;
              await supabaseAdmin
                .from('knowledge_base')
                .update({ content: JSON.stringify(parsed) })
                .eq('id', row.id);
              return { valid: true };
            }
          } catch {}
        }
      }
    }
  } catch (err) {
    console.error('[OTP Service] Erro ao consultar fallback OTP:', err);
  }

  return { valid: false, error: 'Código de acesso incorreto ou expirado.' };
}

/**
 * Envia o código OTP via WhatsApp com botão interativo nativo 'copy:CODIGO'
 */
export async function sendOtpMessageToWhatsApp(phone: string, code: string) {
  const { cleanPhone } = getPhoneCandidates(phone);
  const { serverUrl, instanceToken } = await getNotificationInstanceConfig();

  if (!instanceToken) {
    throw new Error(
      'Nenhuma instância de WhatsApp configurada. Configure a instância de notificações em Admin > Notificações.'
    );
  }

  const text = `🔐 *SWIFTSAIL*\n\nSeu código de acesso é: *${code}*\n\nEle expira em 5 minutos. Não compartilhe com ninguém.`;

  // 1. Tenta disparar com botão interativo nativo de cópia (copy:CODIGO)
  try {
    const payload = {
      number: cleanPhone,
      type: 'button',
      text,
      choices: [`Copiar Código|copy:${code}`],
    };

    const response = await fetch(`${serverUrl}/send/menu`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        token: instanceToken,
      },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      const json = await response.json();
      return { success: true, method: 'interactive_button', details: json };
    } else {
      console.warn('[WhatsApp Send Warning] /send/menu falhou, tentando fallback text...');
    }
  } catch (err) {
    console.warn('[WhatsApp Send Exception] tentando fallback text:', err);
  }

  // 2. Fallback: disparo de mensagem em texto
  try {
    const textRes = await fetch(`${serverUrl}/send/text`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        token: instanceToken,
      },
      body: JSON.stringify({
        number: cleanPhone,
        text,
        async: false,
      }),
    });

    if (!textRes.ok) {
      const errText = await textRes.text();
      console.error('[WhatsApp Send Error Text Fallback]:', errText);
      throw new Error('Falha ao enviar mensagem pelo WhatsApp.');
    }

    const textJson = await textRes.json();
    return { success: true, method: 'text_message', details: textJson };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Falha na conexão com a instância do WhatsApp';
    throw new Error(message);
  }
}

/**
 * Localiza usuário no sistema (Rodrigo Ferrari Master Admin ou clientes cadastrados)
 */
export async function findUserByPhone(phone: string): Promise<AppUser | null> {
  const { candidates } = getPhoneCandidates(phone);
  const allUsers = getUsersStore();

  for (const candidate of candidates) {
    const user = allUsers.find((u) => {
      const userPhone = u.whatsapp ? u.whatsapp.replace(/\D/g, '') : '';
      return userPhone === candidate || candidate.endsWith(userPhone) || userPhone.endsWith(candidate);
    });
    if (user) return user;
  }

  // Verifica na tabela profiles do Supabase caso exista
  try {
    const { data: profiles } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .in('phone', candidates)
      .limit(1);

    if (profiles && profiles.length > 0) {
      const p = profiles[0];
      return {
        id: p.id,
        nome: p.name || 'Usuário Swiftsail',
        email: p.email || `${p.phone}@swiftsail.local`,
        whatsapp: p.phone,
        role: p.role || 'cliente_admin',
        cliente_id: p.cliente_id || null,
        cliente_ids: p.cliente_ids || [],
        cliente_nome: p.cliente_nome || 'Workspace',
        status: 'ativo',
        modulos: ['midia', 'whatsapp', 'crm', 'criativos', 'financeiro'],
      };
    }
  } catch {}

  return null;
}
