import { NextResponse } from 'next/server';
import {
  getUsersStore,
  getInvitesStore,
  removeUserFromStore,
  removeInviteFromStore,
  updateUserStatus,
  updateUserInStore,
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
    } else if (action === 'edit_profile') {
      const { nome, whatsapp, email, role, cliente_id, cliente_ids, cliente_nome, modulos: newModulos, status: newStatus } = body;
      
      const cleanPhone = whatsapp ? String(whatsapp).replace(/\D/g, '') : targetUser.whatsapp;
      const updatedFields = {
        ...(nome ? { nome: String(nome).trim() } : {}),
        ...(cleanPhone ? { whatsapp: cleanPhone } : {}),
        ...(email ? { email: String(email).trim().toLowerCase() } : {}),
        ...(role ? { role } : {}),
        cliente_id: cliente_id !== undefined ? cliente_id : targetUser.cliente_id,
        cliente_ids: Array.isArray(cliente_ids) ? cliente_ids : targetUser.cliente_ids,
        cliente_nome: cliente_nome !== undefined ? cliente_nome : targetUser.cliente_nome,
        ...(newModulos ? { modulos: newModulos } : {}),
        ...(newStatus ? { status: newStatus } : {}),
      };

      const updated = updateUserInStore(userId, updatedFields);

      // Sincroniza no Supabase profiles se possível
      try {
        const { supabaseAdmin } = await import('@/lib/supabase/admin');
        await supabaseAdmin.from('profiles').upsert({
          id: userId,
          phone: cleanPhone,
          name: updated?.nome || targetUser.nome,
          role: updated?.role || targetUser.role,
          cliente_id: updated?.cliente_id,
          cliente_ids: updated?.cliente_ids,
        });
      } catch {}

      return NextResponse.json({
        success: true,
        message: 'Cadastro do membro atualizado com sucesso!',
        user: updated || targetUser,
      });
    }
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
