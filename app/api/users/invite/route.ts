import { NextResponse } from 'next/server';
import { UserInvite, UserRole, UserModulePermission } from '@/types/database';
import { persistInvite } from '@/lib/services/user-invites-service';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { nome, whatsapp, email, role, cliente_id, cliente_ids, cliente_nome, cliente_nomes, modulos } = body;

    if (!nome || (!whatsapp && !email) || !role) {
      return NextResponse.json(
        { success: false, error: 'Nome e WhatsApp são obrigatórios para emissão do convite.' },
        { status: 400 }
      );
    }

    const cleanWhatsapp = whatsapp ? String(whatsapp).replace(/\D/g, '') : '';
    const userEmail = email
      ? String(email).trim().toLowerCase()
      : `${cleanWhatsapp || 'user'}@convite.swiftsail.co`;

    // Processa lista de clientes vinculados
    const assignedIds: string[] = Array.isArray(cliente_ids) && cliente_ids.length > 0
      ? cliente_ids
      : cliente_id && cliente_id !== 'AGENCY'
      ? [cliente_id]
      : [];

    const primaryClientName = Array.isArray(cliente_nomes) && cliente_nomes.length > 0
      ? cliente_nomes.join(', ')
      : cliente_nome || (assignedIds.length > 0 ? assignedIds.join(', ') : 'Swiftsail HQ');

    // Generate unique activation token and direct link to WhatsApp OTP login
    const randomHex = Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
    const token = `inv_${role}_${randomHex}`;
    const link_ativacao = `https://app.swiftsail.co/login?phone=${cleanWhatsapp}&invite=${token}`;

    const newInvite: UserInvite & { whatsapp?: string; cliente_ids?: string[] } = {
      id: `inv_${Date.now()}`,
      nome: String(nome).trim(),
      email: userEmail,
      role: role as UserRole,
      cliente_id: assignedIds[0] || null,
      cliente_nome: role === 'master_admin' ? 'Swiftsail HQ (Equipe Interna)' : primaryClientName,
      modulos: (modulos && modulos.length > 0
        ? modulos
        : ['midia', 'whatsapp', 'crm']) as UserModulePermission[],
      token,
      link_ativacao,
      status: 'pendente',
      expira_em: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      criado_em: new Date().toISOString(),
      whatsapp: cleanWhatsapp || undefined,
      cliente_ids: assignedIds,
    };

    const whatsMessage = `🚀 *Olá, ${newInvite.nome}! Seja bem-vindo(a) à plataforma SWIFTSAIL.*

Seu acesso ao workspace *${newInvite.cliente_nome}* foi liberado!

📊 *O que é a plataforma:*
É o seu portal exclusivo para acompanhar em tempo real o desempenho de anúncios (Meta & Google Ads), CRM de leads, criativos, relatórios e métricas de crescimento do seu negócio.

🔐 *Como fazer para acessar (100% sem senha):*
1️⃣ Abra seu link exclusivo de acesso:
👉 ${link_ativacao}

2️⃣ Seu WhatsApp já estará pré-preenchido. Clique no botão *"Receber Código no WhatsApp"*.

3️⃣ Você receberá uma mensagem com o código de 6 dígitos e um botão *"Copiar Código"*.

4️⃣ Cole o código na tela para entrar diretamente na plataforma.

Qualquer dúvida, estamos à disposição!`;

    // Armazena no store unificado e persiste no Supabase
    await persistInvite(newInvite);

    return NextResponse.json({
      success: true,
      message: `Convite gerado com sucesso para ${newInvite.nome}!`,
      invite: newInvite,
      link_ativacao,
      whatsapp_message: whatsMessage,
      clean_whatsapp: cleanWhatsapp,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Erro ao processar convite' },
      { status: 500 }
    );
  }
}
