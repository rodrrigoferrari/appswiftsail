import { NextResponse } from 'next/server';
import {
  getUsersStore,
  getInvitesStore,
  removeUserFromStore,
  removeInviteFromStore,
  updateUserStatus,
} from '@/lib/services/users-store';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const clienteId = searchParams.get('cliente_id');
  const role = searchParams.get('role');

  const allUsers = getUsersStore();
  const allInvites = getInvitesStore();

  let filteredUsers = [...allUsers];
  let filteredInvites = [...allInvites];

  if (clienteId && clienteId !== 'ALL') {
    filteredUsers = filteredUsers.filter(
      (u) => u.cliente_id === clienteId || (u.cliente_ids && u.cliente_ids.includes(clienteId))
    );
    filteredInvites = filteredInvites.filter(
      (i) => i.cliente_id === clienteId || (i.cliente_ids && i.cliente_ids.includes(clienteId))
    );
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
      totalUsers: allUsers.length,
      activeUsers: allUsers.filter((u) => u.status === 'ativo').length,
      pendingInvites: allInvites.filter((i) => i.status === 'pendente').length,
      agencyMembers: allUsers.filter((u) => !u.cliente_id && (!u.cliente_ids || u.cliente_ids.length === 0)).length,
      clientMembers: allUsers.filter((u) => !!u.cliente_id || (u.cliente_ids && u.cliente_ids.length > 0)).length,
    },
  });
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { userId, action, modulos, status } = body;

    const allUsers = getUsersStore();
    const targetUser = allUsers.find((u) => u.id === userId);
    if (!targetUser) {
      return NextResponse.json({ success: false, error: 'Usuário não encontrado' }, { status: 404 });
    }

    if (action === 'toggle_status') {
      updateUserStatus(userId);
    } else if (action === 'update_permissions') {
      if (modulos) targetUser.modulos = modulos;
      if (status) updateUserStatus(userId, status);
    }

    return NextResponse.json({
      success: true,
      message: 'Usuário atualizado com sucesso',
      user: targetUser,
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

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID é obrigatório' }, { status: 400 });
    }

    if (type === 'invite') {
      removeInviteFromStore(id);
      return NextResponse.json({ success: true, message: 'Convite revogado com sucesso' });
    } else {
      removeUserFromStore(id);
      return NextResponse.json({ success: true, message: 'Usuário removido com sucesso' });
    }
  } catch (err: unknown) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Erro interno' },
      { status: 500 }
    );
  }
}
