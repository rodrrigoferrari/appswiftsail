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
 * Normaliza número com DDI 55 do Brasil se tiver 10 ou 11 dígitos
 */
export function normalizePhoneE164(phone?: string | null): string {
  if (!phone) return '';
  const clean = String(phone).replace(/\D/g, '');
  if (!clean) return '';
  if ((clean.length === 10 || clean.length === 11) && !clean.startsWith('55')) {
    return `55${clean}`;
  }
  return clean;
}

/**
 * Retorna número local (sem 55) se tiver 12 ou 13 dígitos
 */
export function cleanPhoneLocal(phone?: string | null): string {
  if (!phone) return '';
  const clean = String(phone).replace(/\D/g, '');
  if (clean.startsWith('55') && (clean.length === 12 || clean.length === 13)) {
    return clean.slice(2);
  }
  return clean;
}

/**
 * Efetiva o cadastro do usuário no Supabase (auth.users e public.profiles)
 * e gera o link de acesso/mensagem, sem deixar convite pendente duplicado.
 */
export async function persistInvite(invite: UserInvite): Promise<UserInvite> {
  const rawPhone = cleanPhoneNumber(invite.whatsapp);
  const normalizedPhone = normalizePhoneE164(rawPhone);
  const localPhone = cleanPhoneLocal(rawPhone);

  const phoneVariants = Array.from(
    new Set([rawPhone, normalizedPhone, localPhone, `+${normalizedPhone}`, `+${localPhone}`].filter(Boolean))
  );

  // 1. Limpa qualquer convite pendente anterior para esse número
  removeInviteFromStore(invite.id);
  removeInviteFromStore(invite.token);

  try {
    const { data: rows } = await supabaseAdmin
      .from('knowledge_base')
      .select('id, content, tags')
      .eq('source', 'user_invite');

    if (rows && rows.length > 0) {
      for (const r of rows) {
        const matchesTag = r.tags && r.tags.some((t: string) => phoneVariants.includes(t));
        const matchesContent = r.content && phoneVariants.some((p) => r.content.includes(p));
        if (matchesTag || matchesContent) {
          await supabaseAdmin.from('knowledge_base').delete().eq('id', r.id);
        }
      }
    }
  } catch (kbErr) {
    console.warn('[UserInvitesService] Aviso ao limpar convites anteriores:', kbErr);
  }

  // 2. Efetiva o cadastro diretamente no Supabase Auth e na tabela public.profiles
  if (normalizedPhone) {
    try {
      const emailMascarado = invite.email && !invite.email.endsWith('@convite.swiftsail.co')
        ? invite.email
        : `${normalizedPhone}@swiftsail.local`;

      let authUserId: string | null = null;

      // Localiza se o usuário já existe no Supabase Auth por telefone ou email
      const { data: userList } = await supabaseAdmin.auth.admin.listUsers();
      const existingUser = userList?.users?.find((u) => {
        const uPhone = cleanPhoneNumber(u.phone);
        const metaPhone = cleanPhoneNumber(u.user_metadata?.whatsapp || u.user_metadata?.phone);
        return (
          phoneVariants.includes(uPhone) ||
          phoneVariants.includes(metaPhone) ||
          (u.email && u.email.toLowerCase() === emailMascarado.toLowerCase())
        );
      });

      if (existingUser) {
        authUserId = existingUser.id;
        await supabaseAdmin.auth.admin.updateUserById(authUserId, {
          email: emailMascarado,
          email_confirm: true,
          phone: `+${normalizedPhone}`,
          phone_confirm: true,
          user_metadata: {
            nome: invite.nome,
            role: invite.role,
            whatsapp: normalizedPhone,
            cliente_id: invite.cliente_id,
            cliente_ids: invite.cliente_ids,
          },
        });
      } else {
        const { data: newUser, error: createAuthErr } = await supabaseAdmin.auth.admin.createUser({
          email: emailMascarado,
          email_confirm: true,
          phone: `+${normalizedPhone}`,
          phone_confirm: true,
          user_metadata: {
            nome: invite.nome,
            role: invite.role,
            whatsapp: normalizedPhone,
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

      // Se temos o authUserId, garante o upsert definitivo em public.profiles
      if (authUserId) {
        await supabaseAdmin.from('profiles').upsert({
          id: authUserId,
          phone: normalizedPhone,
          name: invite.nome,
          role: invite.role,
          cliente_id: invite.cliente_id,
          cliente_ids: invite.cliente_ids || (invite.cliente_id ? [invite.cliente_id] : []),
        });

        // Limpa possíveis registros duplicados em profiles com ID antigo do mesmo telefone
        const { data: oldProfiles } = await supabaseAdmin
          .from('profiles')
          .select('id, phone')
          .in('phone', [normalizedPhone, localPhone, rawPhone]);

        if (oldProfiles && oldProfiles.length > 0) {
          for (const op of oldProfiles) {
            if (op.id !== authUserId) {
              await supabaseAdmin.from('profiles').delete().eq('id', op.id);
            }
          }
        }
      }

      // 3. Adiciona imediatamente ao store de usuários ativos em memória
      const newActiveUser: AppUser = {
        id: authUserId || `usr_${Date.now()}`,
        nome: invite.nome,
        email: emailMascarado,
        whatsapp: normalizedPhone,
        role: invite.role,
        cliente_id: invite.cliente_id,
        cliente_ids: invite.cliente_ids || (invite.cliente_id ? [invite.cliente_id] : []),
        cliente_nome: invite.cliente_nome,
        status: 'ativo',
        modulos: invite.modulos || ['midia', 'whatsapp', 'crm', 'criativos', 'financeiro'],
        ultimo_acesso: null,
        criado_em: new Date().toISOString().split('T')[0],
      };

      const existingStore = getUsersStore();
      const dedupedStore = existingStore.filter(
        (u) =>
          u.id !== newActiveUser.id &&
          !phoneVariants.includes(cleanPhoneNumber(u.whatsapp))
      );
      setUsersStore([newActiveUser, ...dedupedStore]);
    } catch (profErr) {
      console.warn('[UserInvitesService] Falha ao efetivar cadastro no Supabase:', profErr);
    }
  }

  return invite;
}

/**
 * Lista convites pendentes reais salvos no Supabase,
 * expurgando automaticamente qualquer convite cujo telefone já pertença a um usuário cadastrado.
 */
export async function listAllInvites(): Promise<UserInvite[]> {
  try {
    // 1. Busca todos os telefones de usuários cadastrados em profiles
    const { data: profiles } = await supabaseAdmin
      .from('profiles')
      .select('phone');

    const registeredPhones = new Set<string>();
    if (profiles) {
      for (const p of profiles) {
        if (p.phone) {
          const raw = cleanPhoneNumber(p.phone);
          registeredPhones.add(raw);
          registeredPhones.add(normalizePhoneE164(raw));
          registeredPhones.add(cleanPhoneLocal(raw));
        }
      }
    }

    const { data: rows, error } = await supabaseAdmin
      .from('knowledge_base')
      .select('id, content, tags, created_at')
      .eq('source', 'user_invite')
      .order('created_at', { ascending: false });

    const validInvites: UserInvite[] = [];

    if (!error && rows) {
      for (const row of rows) {
        try {
          const parsed: UserInvite = JSON.parse(row.content);
          if (parsed && (parsed.id || parsed.token)) {
            const rawPhone = cleanPhoneNumber(parsed.whatsapp);
            const isAlreadyUser =
              rawPhone &&
              (registeredPhones.has(rawPhone) ||
                registeredPhones.has(normalizePhoneE164(rawPhone)) ||
                registeredPhones.has(cleanPhoneLocal(rawPhone)));

            if (isAlreadyUser || parsed.status === 'aceito' || (parsed.status as string) === 'ativado') {
              // Se o usuário já está cadastrado, limpa da knowledge_base
              await supabaseAdmin.from('knowledge_base').delete().eq('id', row.id);
              removeInviteFromStore(parsed.id);
              removeInviteFromStore(parsed.token);
            } else {
              validInvites.push(parsed);
            }
          }
        } catch {}
      }
    }

    return validInvites;
  } catch (err) {
    console.error('[UserInvitesService] Erro ao buscar convites no Supabase:', err);
    return [];
  }
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

  // 2. Busca todos os perfis reais da tabela public.profiles do Supabase e o último acesso do Supabase Auth
  try {
    const [{ data: profiles, error: pError }, authUserListRes] = await Promise.all([
      supabaseAdmin.from('profiles').select('*').order('created_at', { ascending: false }),
      supabaseAdmin.auth.admin.listUsers().catch(() => ({ data: { users: [] }, error: null })),
    ]);

    const authById = new Map<string, any>();
    const authByPhone = new Map<string, any>();
    const authByEmail = new Map<string, any>();

    const authUsers = (authUserListRes as any)?.data?.users || [];
    for (const u of authUsers) {
      if (u.id) authById.set(u.id, u);
      if (u.phone) {
        const clean = cleanPhoneNumber(u.phone);
        if (clean) {
          authByPhone.set(clean, u);
          if (clean.startsWith('55')) authByPhone.set(clean.slice(2), u);
          else authByPhone.set(`55${clean}`, u);
        }
      }
      if (u.user_metadata?.whatsapp) {
        const clean = cleanPhoneNumber(String(u.user_metadata.whatsapp));
        if (clean) {
          authByPhone.set(clean, u);
          if (clean.startsWith('55')) authByPhone.set(clean.slice(2), u);
          else authByPhone.set(`55${clean}`, u);
        }
      }
      if (u.email) {
        authByEmail.set(u.email.toLowerCase(), u);
      }
    }

    if (!pError && profiles) {
      for (const p of profiles) {
        const phone = cleanPhoneNumber(p.phone);
        const isMaster =
          p.role === 'master_admin' ||
          phone === '41992332996' ||
          phone === '5541992332996';

        const clientName = resolveClientName(p.cliente_id, p.cliente_ids);

        // Cruza com o Supabase Auth para recuperar o last_sign_in_at real ou metadata
        const authUser = authById.get(p.id) || authByPhone.get(phone) || (p.email ? authByEmail.get(p.email.toLowerCase()) : null);
        const lastAccessRaw = (p as any).ultimo_acesso || authUser?.user_metadata?.ultimo_acesso || authUser?.last_sign_in_at || null;

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
          ultimo_acesso: isMaster ? 'Ativo agora' : (lastAccessRaw || null),
          criado_em: p.created_at ? p.created_at.split('T')[0] : '2026-10-14',
        };

        if (isMaster) {
          usersMap.set('usr_rodrigo_ferrari', { ...rodrigoMaster, id: p.id });
        } else {
          const normPhone = normalizePhoneE164(p.phone);
          const userKey = normPhone || p.id;
          const existing = usersMap.get(userKey);

          if (existing) {
            // Mescla empresas atribuídas sem duplicar registros para o mesmo usuário
            const mergedClientIds = Array.from(
              new Set([
                ...(existing.cliente_ids || (existing.cliente_id ? [existing.cliente_id] : [])),
                ...(appUser.cliente_ids || (appUser.cliente_id ? [appUser.cliente_id] : [])),
              ])
            );
            appUser.cliente_ids = mergedClientIds;
            appUser.cliente_id = mergedClientIds[0] || existing.cliente_id || appUser.cliente_id;
            appUser.cliente_nome = resolveClientName(appUser.cliente_id, mergedClientIds);
            if (!appUser.nome || appUser.nome.startsWith('Cliente ')) {
              appUser.nome = existing.nome || appUser.nome;
            }
          }

          usersMap.set(userKey, appUser);
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
