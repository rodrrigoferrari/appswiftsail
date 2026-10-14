import { AppUser, UserInvite } from '@/types/database';

// Único acesso mantido: Rodrigo Ferrari, ADMIN, 41992332996
let USERS: AppUser[] = [
  {
    id: 'usr_rodrigo_ferrari',
    nome: 'Rodrigo Ferrari',
    email: 'rodrigo@swiftsail.co',
    whatsapp: '41992332996',
    role: 'master_admin',
    cliente_id: null,
    cliente_nome: 'Swiftsail HQ (Master Admin)',
    status: 'ativo',
    modulos: ['midia', 'whatsapp', 'criativos', 'crm', 'financeiro'],
    avatar_url: '',
    ultimo_acesso: 'Ativo agora',
    criado_em: '2026-01-15',
  },
];

let INVITES: UserInvite[] = [];

export function getUsersStore(): AppUser[] {
  return USERS;
}

export function setUsersStore(newUsers: AppUser[]) {
  USERS = newUsers;
}

export function getInvitesStore(): UserInvite[] {
  return INVITES;
}

export function addInviteToStore(invite: UserInvite) {
  // Se já existir convite com mesmo id ou token, substitui
  INVITES = [invite, ...INVITES.filter((i) => i.id !== invite.id && i.token !== invite.token)];
}

export function removeInviteFromStore(inviteId: string) {
  INVITES = INVITES.filter((i) => i.id !== inviteId);
}

export function removeUserFromStore(userId: string) {
  USERS = USERS.filter((u) => u.id !== userId);
}

export function updateUserStatus(userId: string, status?: 'ativo' | 'convidado' | 'bloqueado') {
  const user = USERS.find((u) => u.id === userId);
  if (user) {
    if (status) {
      user.status = status;
    } else {
      user.status = user.status === 'ativo' ? 'bloqueado' : 'ativo';
    }
  }
  return user;
}
