import { NextResponse } from 'next/server';
import {
  listAllUsers,
  listAllInvites,
  deleteInvite,
  deleteUser,
} from '@/lib/services/user-invites-service';
import {
  updateUserStatus,
  updateUserInStore,
  getUsersStore,
} from '@/lib/services/users-store';
import { supabaseAdmin } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const clienteId = searchParams.get('cliente_id');
    const role = searchParams.get('role');

    // Busca dados persistidos no Supabase unificados com cache
    const allUsers = await listAllUsers();
    const allInvites = await listAllInvites();

    let filteredUsers = [...allUsers];
    let filteredInvites = [...allInvites];

    if (clienteId && clienteId !== 'ALL') {
      // Isolamento estrito de workspace: Administradores da agência/master nunca aparecem para o cliente
      filteredUsers = filteredUsers.filter(
        (u) =>
          u.role !== 'master_admin' &&
          u.whatsapp !== '41992332996' &&
          u.whatsapp !== '5541992332996' &&
          u.email !== 'rodrigo@swiftsail.co' &&
          (u.cliente_id === clienteId || (u.cliente_ids && u.cliente_ids.includes(clienteId)))
      );
      filteredInvites = filteredInvites.filter(
        (i) =>
          i.role !== 'master_admin' &&
          (i.cliente_id === clienteId || (i.cliente_ids && i.cliente_ids.includes(clienteId)))
      );
    }

    if (role) {
      filteredUsers = filteredUsers.filter((u) => u.role === role);
      filteredInvites = filteredInvites.filter((i) => i.role === role);
    }

    // Se for consulta restrita por cliente, os stats refletem estritamente o workspace
    const isRestrictedWorkspace = Boolean(clienteId && clienteId !== 'ALL');

    return NextResponse.json({
      success: true,
      users: filteredUsers,
      invites: filteredInvites,
      stats: {
        totalUsers: isRestrictedWorkspace ? filteredUsers.length : allUsers.length,
        activeUsers: isRestrictedWorkspace
          ? filteredUsers.filter((u) => u.status === 'ativo').length
          : allUsers.filter((u) => u.status === 'ativo').length,
        pendingInvites: isRestrictedWorkspace
          ? filteredInvites.filter((i) => i.status === 'pendente').length
          : allInvites.filter((i) => i.status === 'pendente').length,
        agencyMembers: isRestrictedWorkspace
          ? 0
          : allUsers.filter((u) => !u.cliente_id && (!u.cliente_ids || u.cliente_ids.length === 0)).length,
        clientMembers: isRestrictedWorkspace
          ? filteredUsers.length
          : allUsers.filter((u) => !!u.cliente_id || (u.cliente_ids && u.cliente_ids.length > 0)).length,
      },
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Erro ao listar usuários' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { userId, action, modulos, status } = body;

    const allUsers = await listAllUsers();
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

      // Sincroniza diretamente na tabela public.profiles do Supabase
      try {
        await supabaseAdmin.from('profiles').upsert({
          id: userId,
          phone: cleanPhone ? (cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`) : targetUser.whatsapp,
          name: updated?.nome || targetUser.nome,
          role: updated?.role || targetUser.role,
          cliente_id: updated?.cliente_id,
          cliente_ids: updated?.cliente_ids,
        });
      } catch (profErr) {
        console.warn('[PATCH /api/users] Erro ao sincronizar profiles no Supabase:', profErr);
      }

      return NextResponse.json({
        success: true,
        message: 'Cadastro do membro atualizado com sucesso!',
        user: updated || targetUser,
      });
    }

    return NextResponse.json({ success: true, user: targetUser });
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
      await deleteInvite(id);
      return NextResponse.json({ success: true, message: 'Convite revogado com sucesso' });
    } else {
      const ok = await deleteUser(id);
      if (!ok) {
        return NextResponse.json(
          { success: false, error: 'Não é permitido remover o administrador principal.' },
          { status: 403 }
        );
      }
      return NextResponse.json({ success: true, message: 'Usuário removido com sucesso' });
    }
  } catch (err: unknown) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Erro interno ao excluir' },
      { status: 500 }
    );
  }
}
