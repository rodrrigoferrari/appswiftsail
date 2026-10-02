import { NextResponse } from 'next/server';
import { AppUser, UserInvite } from '@/types/database';

// In-memory persistent mock for development & fallback
let INITIAL_USERS: AppUser[] = [
  {
    id: 'usr_1',
    nome: 'Rodrigo Ferrari',
    email: 'rodrigo@swiftsail.co',
    role: 'master_admin',
    cliente_id: null,
    cliente_nome: 'Swiftsail HQ (Master Admin)',
    status: 'ativo',
    modulos: ['midia', 'whatsapp', 'criativos', 'crm', 'financeiro'],
    avatar_url: '',
    ultimo_acesso: '2026-10-02 19:10',
    criado_em: '2026-01-15',
  },
  {
    id: 'usr_2',
    nome: 'Bruna Carvalho',
    email: 'bruna@swiftsail.co',
    role: 'gestor_trafego',
    cliente_id: null,
    cliente_nome: 'Swiftsail HQ (Equipe Tráfego)',
    status: 'ativo',
    modulos: ['midia', 'criativos'],
    avatar_url: '',
    ultimo_acesso: '2026-10-02 17:35',
    criado_em: '2026-02-10',
  },
  {
    id: 'usr_3',
    nome: 'Lucas Santana',
    email: 'lucas@swiftsail.co',
    role: 'cs_account',
    cliente_id: null,
    cliente_nome: 'Swiftsail HQ (Sucesso do Cliente)',
    status: 'ativo',
    modulos: ['whatsapp', 'crm', 'midia'],
    avatar_url: '',
    ultimo_acesso: '2026-10-02 18:20',
    criado_em: '2026-02-20',
  },
  {
    id: 'usr_4',
    nome: 'Eduardo Dabol',
    email: 'eduardo@dabol.com.br',
    role: 'cliente_admin',
    cliente_id: 'DABOL_ENGENHARIA',
    cliente_nome: 'Dabol Engenharia',
    status: 'ativo',
    modulos: ['midia', 'whatsapp', 'crm', 'financeiro'],
    avatar_url: '',
    ultimo_acesso: '2026-10-02 15:40',
    criado_em: '2026-03-01',
  },
  {
    id: 'usr_5',
    nome: 'Mariana Silva (Comercial)',
    email: 'mariana.vendas@dabol.com.br',
    role: 'cliente_membro',
    cliente_id: 'DABOL_ENGENHARIA',
    cliente_nome: 'Dabol Engenharia',
    status: 'ativo',
    modulos: ['whatsapp', 'crm'],
    avatar_url: '',
    ultimo_acesso: '2026-10-01 14:15',
    criado_em: '2026-03-05',
  },
  {
    id: 'usr_6',
    nome: 'Ricardo Adriática',
    email: 'ricardo@adriatica.com.br',
    role: 'cliente_admin',
    cliente_id: 'ADRIATICA_INCORPORADORA',
    cliente_nome: 'Adriática Incorporadora',
    status: 'ativo',
    modulos: ['midia', 'whatsapp', 'crm', 'criativos'],
    avatar_url: '',
    ultimo_acesso: '2026-09-30 11:20',
    criado_em: '2026-03-12',
  },
];

let INITIAL_INVITES: UserInvite[] = [
  {
    id: 'inv_101',
    nome: 'Fernanda Rocha (Diretoria)',
    email: 'fernanda@plamev.com.br',
    role: 'cliente_admin',
    cliente_id: 'PLAMEV_RJ',
    cliente_nome: 'Plamev RJ',
    modulos: ['midia', 'whatsapp', 'crm'],
    token: 'inv_plm_99342',
    link_ativacao: 'https://app.swiftsail.co/convite/inv_plm_99342',
    status: 'pendente',
    expira_em: '2026-10-09',
    criado_em: '2026-10-02 14:00',
  },
  {
    id: 'inv_102',
    nome: 'Gabriel Pereira (Performance)',
    email: 'gabriel.performance@swiftsail.co',
    role: 'gestor_trafego',
    cliente_id: null,
    cliente_nome: 'Swiftsail HQ (Agência)',
    modulos: ['midia', 'criativos'],
    token: 'inv_agy_44192',
    link_ativacao: 'https://app.swiftsail.co/convite/inv_agy_44192',
    status: 'pendente',
    expira_em: '2026-10-09',
    criado_em: '2026-10-02 16:30',
  },
];


export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const clienteId = searchParams.get('cliente_id');
  const role = searchParams.get('role');

  let filteredUsers = [...INITIAL_USERS];
  let filteredInvites = [...INITIAL_INVITES];

  if (clienteId && clienteId !== 'ALL') {
    filteredUsers = filteredUsers.filter((u) => u.cliente_id === clienteId);
    filteredInvites = filteredInvites.filter((i) => i.cliente_id === clienteId);
  }

  if (role) {
    filteredUsers = filteredUsers.filter((u) => u.role === role);
    filteredInvites = filteredInvites.filter((i) => i.role === role);
  }

  return NextResponse.json({
    success: true,
    users: filteredUsers,
    invites: filteredInvites,
    stats: {
      totalUsers: INITIAL_USERS.length,
      activeUsers: INITIAL_USERS.filter((u) => u.status === 'ativo').length,
      pendingInvites: INITIAL_INVITES.filter((i) => i.status === 'pendente').length,
      agencyMembers: INITIAL_USERS.filter((u) => !u.cliente_id).length,
      clientMembers: INITIAL_USERS.filter((u) => !!u.cliente_id).length,
    },
  });
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { userId, action, modulos, status } = body;

    const userIndex = INITIAL_USERS.findIndex((u) => u.id === userId);
    if (userIndex === -1) {
      return NextResponse.json({ success: false, error: 'Usuário não encontrado' }, { status: 404 });
    }

    if (action === 'toggle_status') {
      INITIAL_USERS[userIndex].status = INITIAL_USERS[userIndex].status === 'ativo' ? 'bloqueado' : 'ativo';
    } else if (action === 'update_permissions') {
      if (modulos) INITIAL_USERS[userIndex].modulos = modulos;
      if (status) INITIAL_USERS[userIndex].status = status;
    }

    return NextResponse.json({
      success: true,
      message: 'Usuário atualizado com sucesso',
      user: INITIAL_USERS[userIndex],
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Erro interno' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const type = searchParams.get('type'); // 'user' | 'invite'

    if (type === 'invite') {
      INITIAL_INVITES = INITIAL_INVITES.filter((i) => i.id !== id);
      return NextResponse.json({ success: true, message: 'Convite revogado com sucesso' });
    } else {
      INITIAL_USERS = INITIAL_USERS.filter((u) => u.id !== id);
      return NextResponse.json({ success: true, message: 'Usuário removido com sucesso' });
    }
  } catch (err: unknown) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Erro interno' },
      { status: 500 }
    );
  }
}
