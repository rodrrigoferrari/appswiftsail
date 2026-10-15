import { AppUser, UserInvite, UserRole, UserModulePermission } from '@/types/database';
import { supabaseAdmin } from '@/lib/supabase/admin';
import {
  getUsersStore,
  getInvitesStore,
  addInviteToStore,
  removeInviteFromStore,
  removeUserFromStore,
  updateUserInStore,
  setUsersStore,
} from '@/lib/services/users-store';

const CLIENT_NAMES: Record<string, string> = {
  REALIZACOES_GONZAGA: 'Realizações Gonzaga',
  GONZAGA_AMST: 'Gonzaga AMST',
  GONZAGA_SCA_181: 'Gonzaga SCA 181',
  GENOVA_URBANISMO: 'Gênova Urbanismo',
  ADRIATICA_INCORPORADORA: 'Adriática Incorporadora',
  CONSTRUTORA_PESSOA: 'Construtora Pessoa',
  PACIFIC_INCORPORADORA: 'Pacific Incorporadora',
  DABOL_ENGENHARIA: 'Dabol Engenharia',
  LEGALIZZAR: 'Legalizzar',
  CALURE_EMPREENDIMENTOS: 'Calure Empreendimentos',
  EMOVERE: 'Emovere',
};

function resolveClientName(clienteId?: string | null, clienteIds?: string[] | null): string {
  if (!clienteId && (!clienteIds || clienteIds.length === 0)) {
    return 'Swiftsail HQ (Master Admin)';
  }
  if (Array.isArray(clienteIds) && clienteIds.length > 1) {
    return clienteIds.map((id) => CLIENT_NAMES[id] || id).join(', ');
  }
  const primary = clienteId || (clienteIds && clienteIds[0]);
  return primary ? CLIENT_NAMES[primary] || primary : 'Workspace';
}

/**
 * Normaliza número de telefone para busca e armazenamento
 */
export function cleanPhoneNumber(phone?: string | null): string {
  if (!phone) return '';
  return String(phone).replace(/\D/g, '');
}

/**
 * Salva um convite de forma permanente no Supabase (knowledge_base e profiles) e na memória
 */
export async function persistInvite(invite: UserInvite): Promise<UserInvite> {
  const cleanPhone = cleanPhoneNumber(invite.whatsapp);

  // 1. Armazena na memória local para respostas ultra-rápidas
  addInviteToStore(invite);

  // 2. Persiste na tabela knowledge_base do Supabase com tags indexadas
  try {
    const inviteTags = ['user_invite'];
    if (cleanPhone) inviteTags.push(cleanPhone);
    if (invite.token) inviteTags.push(invite.token);
    if (invite.id) inviteTags.push(invite.id);

    // Remove convites anteriores para o mesmo telefone ou ID
    if (cleanPhone) {
      await supabaseAdmin
        .from('knowledge_base')
        .delete()
        .contains('tags', ['user_invite', cleanPhone]);
    }

    await supabaseAdmin.from('knowledge_base').insert({
      content: JSON.stringify(invite),
      summary: `Convite: ${invite.nome} (${cleanPhone || invite.email}) - ${invite.cliente_nome}`,
      source: 'user_invite',
      tags: inviteTags,
    });
  } catch (kbErr) {
    console.warn('[UserInvitesService] Falha ao persistir na knowledge_base:', kbErr);
  }

  // 3. Pré-cria / Sincroniza usuário e perfil no Supabase Auth e na tabela public.profiles
  if (cleanPhone) {
    try {
      const emailMascarado = invite.email && !invite.email.endsWith('@convite.swiftsail.co')
        ? invite.email
        : `${cleanPhone}@swiftsail.local`;

      let authUserId: string | null = null;

      // Verifica se o usuário já existe no Supabase Auth
      const { data: userList } = await supabaseAdmin.auth.admin.listUsers();
      const existingUser = userList?.users?.find(
        (u) =>
          u.phone?.replace(/\D/g, '') === cleanPhone ||
          u.email?.toLowerCase() === emailMascarado.toLowerCase()
      );

      if (existingUser) {
        authUserId = existingUser.id;
        await supabaseAdmin.auth.admin.updateUserById(authUserId, {
          user_metadata: {
            nome: invite.nome,
            role: invite.role,
            whatsapp: cleanPhone,
            cliente_id: invite.cliente_id,
            cliente_ids: invite.cliente_ids,
          },
        });
      } else {
        const { data: newUser, error: createAuthErr } = await supabaseAdmin.auth.admin.createUser({
          email: emailMascarado,
          email_confirm: true,
          phone: cleanPhone.startsWith('+') ? cleanPhone : `+${cleanPhone}`,
          phone_confirm: true,
          user_metadata: {
            nome: invite.nome,
            role: invite.role,
            whatsapp: cleanPhone,
            cliente_id: invite.cliente_id,
            cliente_ids: invite.cliente_ids,
          },
        });

        if (newUser?.user) {
          authUserId = newUser.user.id;
        } else if (createAuthErr) {
          console.warn('[UserInvitesService] Erro ao criar Auth user (tentando recuperar):', createAuthErr);
        }
      }

      // Se temos o authUserId, garante o upsert em public.profiles
      if (authUserId) {
        await supabaseAdmin.from('profiles').upsert({
          id: authUserId,
          phone: cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`,
          name: invite.nome,
          role: invite.role,
          cliente_id: invite.cliente_id,
          cliente_ids: invite.cliente_ids || (invite.cliente_id ? [invite.cliente_id] : []),
        });
      }
    } catch (profErr) {
      console.warn('[UserInvitesService] Falha ao sincronizar profile do convite:', profErr);
    }
  }

  return invite;
}

/**
 * Lista todos os convites salvos no Supabase com fallback para memória,
 * filtrando e consumindo automaticamente convites de usuários que já ativaram a conta/logaram.
 */
export async function listAllInvites(): Promise<UserInvite[]> {
  const memoryInvites = getInvitesStore();
  const inviteMap = new Map<string, UserInvite>();

  // Adiciona convites da memória
  memoryInvites.forEach((i) => inviteMap.set(i.id || i.token, i));

  try {
    // 1. Busca usuários que já realizaram login no Supabase Auth para expurgar convites já ativados
    const { data: authList } = await supabaseAdmin.auth.admin.listUsers();
    const activatedPhones = new Set<string>();

    if (authList && authList.users) {
      for (const u of authList.users) {
        if (u.last_sign_in_at) {
          if (u.phone) activatedPhones.add(cleanPhoneNumber(u.phone));
          const metaPhone = u.user_metadata?.whatsapp || u.user_metadata?.phone;
          if (metaPhone) activatedPhones.add(cleanPhoneNumber(metaPhone));
          if (u.email && u.email.endsWith('@swiftsail.local')) {
            const num = u.email.split('@')[0];
            activatedPhones.add(cleanPhoneNumber(num));
          }
        }
      }
    }

    const { data: rows, error } = await supabaseAdmin
      .from('knowledge_base')
      .select('id, content, tags, created_at')
      .eq('source', 'user_invite')
      .order('created_at', { ascending: false });

    if (!error && rows) {
      for (const row of rows) {
        try {
          const parsed: UserInvite = JSON.parse(row.content);
          if (parsed && (parsed.id || parsed.token)) {
            const phone = cleanPhoneNumber(parsed.whatsapp);
            const key = parsed.id || parsed.token;

            // Se o usuário já realizou login na plataforma, o convite já foi ATIVADO (não é mais pendente)
            const isAlreadyActivated =
              (phone && (activatedPhones.has(phone) || (phone.startsWith('55') && activatedPhones.has(phone.slice(2))) || activatedPhones.has(`55${phone}`))) ||
              parsed.status === 'aceito' ||
              (parsed.status as string) === 'ativado';

            if (isAlreadyActivated) {
              // Remove da memória e limpa do Supabase
              inviteMap.delete(key);
              removeInviteFromStore(key);
              await supabaseAdmin
                .from('knowledge_base')
                .delete()
                .eq('id', row.id);
            } else {
              inviteMap.set(key, parsed);
            }
          }
        } catch {}
      }
    }
  } catch (err) {
    console.error('[UserInvitesService] Erro ao buscar convites no Supabase:', err);
  }

  return Array.from(inviteMap.values());
}

/**
 * Remove um convite do Supabase e da memória de forma definitiva
 */
export async function deleteInvite(inviteIdOrToken: string): Promise<boolean> {
  removeInviteFromStore(inviteIdOrToken);

  try {
    // 1. Tenta deletar por tag
    await supabaseAdmin
      .from('knowledge_base')
      .delete()
      .eq('source', 'user_invite')
      .contains('tags', [inviteIdOrToken]);

    // 2. Fallback: Se o ID for numérico ou se estiver no content
    const { data: rows } = await supabaseAdmin
      .from('knowledge_base')
      .select('id, content')
      .eq('source', 'user_invite');

    if (rows && rows.length > 0) {
      for (const r of rows) {
        if (r.content && r.content.includes(inviteIdOrToken)) {
          await supabaseAdmin.from('knowledge_base').delete().eq('id', r.id);
        }
      }
    }

    return true;
  } catch (err) {
    console.error('[UserInvitesService] Erro ao remover convite do Supabase:', err);
    return false;
  }
}

/**
 * Consome/limpa convites pendentes de um telefone assim que o usuário faz login/ativação
 */
export async function consumeInviteByPhone(phone: string): Promise<void> {
  const cleanPhone = cleanPhoneNumber(phone);
  if (!cleanPhone) return;

  const phoneVariants = [
    cleanPhone,
    cleanPhone.startsWith('55') ? cleanPhone.slice(2) : `55${cleanPhone}`,
  ];

  try {
    // 1. Remove da memória local
    const memory = getInvitesStore();
    for (const inv of memory) {
      const invPhone = cleanPhoneNumber(inv.whatsapp);
      if (phoneVariants.includes(invPhone)) {
        removeInviteFromStore(inv.id || inv.token);
      }
    }

    // 2. Remove de knowledge_base
    const { data: rows } = await supabaseAdmin
      .from('knowledge_base')
      .select('id, content, tags')
      .eq('source', 'user_invite');

    if (rows && rows.length > 0) {
      for (const r of rows) {
        const rowPhone = r.tags ? r.tags.find((t: string) => phoneVariants.includes(t)) : null;
        const matchesContent = r.content && phoneVariants.some((p) => r.content.includes(p));
        if (rowPhone || matchesContent) {
          await supabaseAdmin.from('knowledge_base').delete().eq('id', r.id);
        }
      }
    }
  } catch (err) {
    console.warn('[UserInvitesService] Erro ao consumir convite ativado:', err);
  }
}

/**
 * Localiza convite pendente por telefone
 */
export async function findInviteByPhone(phone: string): Promise<UserInvite | null> {
  const cleanPhone = cleanPhoneNumber(phone);
  if (!cleanPhone) return null;

  // 1. Checa memória
  const memory = getInvitesStore();
  const foundMem = memory.find(
    (i) => cleanPhoneNumber(i.whatsapp) === cleanPhone || (i.whatsapp && cleanPhone.endsWith(cleanPhoneNumber(i.whatsapp)))
  );
  if (foundMem) return foundMem;

  // 2. Checa Supabase knowledge_base
  try {
    const { data: rows } = await supabaseAdmin
      .from('knowledge_base')
      .select('content')
      .eq('source', 'user_invite')
      .contains('tags', ['user_invite', cleanPhone])
      .limit(1);

    if (rows && rows.length > 0) {
      return JSON.parse(rows[0].content);
    }
  } catch {}

  return null;
}

/**
 * Lista todos os usuários unindo public.profiles do Supabase com o store
 */
export async function listAllUsers(): Promise<AppUser[]> {
  const usersMap = new Map<string, AppUser>();

  // 1. Garante Master Admin padrão Rodrigo Ferrari
  const rodrigoMaster: AppUser = {
    id: 'usr_rodrigo_ferrari',
    nome: 'Rodrigo Ferrari',
    email: 'rodrigo@swiftsail.co',
    whatsapp: '41992332996',
    role: 'master_admin',
    cliente_id: null,
    cliente_nome: 'Swiftsail HQ (Master Admin)',
    status: 'ativo',
    modulos: ['midia', 'whatsapp', 'criativos', 'crm', 'financeiro'],
    ultimo_acesso: 'Ativo agora',
    criado_em: '2026-01-15',
  };
  usersMap.set('usr_rodrigo_ferrari', rodrigoMaster);

  // 2. Busca todos os perfis reais da tabela public.profiles do Supabase
  try {
    const { data: profiles, error } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && profiles) {
      for (const p of profiles) {
        const phone = cleanPhoneNumber(p.phone);
        const isMaster =
          p.role === 'master_admin' ||
          phone === '41992332996' ||
          phone === '5541992332996';

        const clientName = resolveClientName(p.cliente_id, p.cliente_ids);

        const appUser: AppUser = {
          id: p.id,
          nome: p.name || (isMaster ? 'Rodrigo Ferrari' : `Cliente ${phone.slice(-4)}`),
          email: `${phone || 'user'}@swiftsail.co`,
          whatsapp: phone,
          role: (isMaster ? 'master_admin' : (p.role as UserRole)) || 'cliente_admin',
          cliente_id: isMaster ? null : p.cliente_id || null,
          cliente_ids: isMaster ? [] : p.cliente_ids || (p.cliente_id ? [p.cliente_id] : []),
          cliente_nome: isMaster ? 'Swiftsail HQ (Master Admin)' : clientName,
          status: 'ativo',
          modulos: isMaster
            ? ['midia', 'whatsapp', 'criativos', 'crm', 'financeiro']
            : ['midia', 'whatsapp', 'crm', 'criativos', 'financeiro'],
          ultimo_acesso: 'Sincronizado',
          criado_em: p.created_at ? p.created_at.split('T')[0] : '2026-10-14',
        };

        if (isMaster) {
          usersMap.set('usr_rodrigo_ferrari', { ...rodrigoMaster, id: p.id });
        } else {
          usersMap.set(p.id, appUser);
        }
      }
    }
  } catch (err) {
    console.error('[UserInvitesService] Erro ao buscar profiles no Supabase:', err);
  }

  // 3. Atualiza cache em memória
  const finalUsers = Array.from(usersMap.values());
  setUsersStore(finalUsers);

  return finalUsers;
}

/**
 * Remove um usuário da tabela profiles e Auth do Supabase
 */
export async function deleteUser(userId: string): Promise<boolean> {
  // Não permite remover Rodrigo Ferrari
  if (
    userId === 'usr_rodrigo_ferrari' ||
    userId === 'rodrigo_master_id'
  ) return false;

  try {
    let cleanPhone = '';

    // 1. Tenta recuperar informações do perfil antes de excluir
    try {
      const { data: userProfile } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (userProfile) {
        const phone = cleanPhoneNumber(userProfile.phone);
        if (
          userProfile.role === 'master_admin' ||
          phone === '41992332996' ||
          phone === '5541992332996'
        ) {
          return false;
        }
        cleanPhone = phone;
      }
    } catch {}

    // Checa também na memória caso não esteja no profiles
    const memUser = getUsersStore().find((u) => u.id === userId);
    if (memUser) {
      const p = cleanPhoneNumber(memUser.whatsapp);
      if (
        memUser.role === 'master_admin' ||
        p === '41992332996' ||
        p === '5541992332996' ||
        memUser.email === 'rodrigo@swiftsail.co'
      ) {
        return false;
      }
      if (!cleanPhone && p) cleanPhone = p;
    }

    // 2. Remove da memória
    removeUserFromStore(userId);

    // 3. Remove convites associados na memória e no Supabase (knowledge_base e otp_codes)
    if (cleanPhone) {
      removeInviteFromStore(userId);
      try {
        await supabaseAdmin
          .from('knowledge_base')
          .delete()
          .eq('source', 'user_invite')
          .contains('tags', [cleanPhone]);
      } catch {}
      try {
        await supabaseAdmin
          .from('otp_codes')
          .delete()
          .or(`phone.eq.${cleanPhone},phone.eq.55${cleanPhone}`);
      } catch {}
    }

    // 4. Remove do profiles do Supabase
    await supabaseAdmin.from('profiles').delete().eq('id', userId);

    // 5. Tenta remover do Supabase Auth
    try {
      await supabaseAdmin.auth.admin.deleteUser(userId);
    } catch {}

    return true;
  } catch (err) {
    console.error('[UserInvitesService] Erro ao deletar usuário do Supabase:', err);
    return false;
  }
}
