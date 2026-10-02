import { NextResponse } from 'next/server';
import { UserInvite, UserRole, UserModulePermission } from '@/types/database';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { nome, email, role, cliente_id, cliente_nome, modulos } = body;

    if (!nome || !email || !role) {
      return NextResponse.json(
        { success: false, error: 'Nome, e-mail e função (role) são obrigatórios.' },
        { status: 400 }
      );
    }

    // Generate unique activation token
    const randomHex = Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
    const token = `inv_${role}_${randomHex}`;
    const link_ativacao = `https://app.swiftsail.co/convite/${token}`;

    const newInvite: UserInvite = {
      id: `inv_${Date.now()}`,
      nome: String(nome).trim(),
      email: String(email).trim().toLowerCase(),
      role: role as UserRole,
      cliente_id: cliente_id === 'AGENCY' || !cliente_id ? null : cliente_id,
      cliente_nome:
        cliente_id === 'AGENCY' || !cliente_id
          ? 'Swiftsail HQ (Equipe Interna)'
          : cliente_nome || cliente_id,
      modulos: (modulos && modulos.length > 0
        ? modulos
        : ['midia', 'whatsapp', 'crm']) as UserModulePermission[],
      token,
      link_ativacao,
      status: 'pendente',
      expira_em: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      criado_em: new Date().toISOString(),
    };

    return NextResponse.json({
      success: true,
      message: `Convite gerado com sucesso para ${newInvite.nome} (${newInvite.email})!`,
      invite: newInvite,
      link_ativacao,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Erro ao processar convite' },
      { status: 500 }
    );
  }
}
