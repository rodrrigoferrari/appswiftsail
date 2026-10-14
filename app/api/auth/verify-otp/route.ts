import { NextRequest, NextResponse } from 'next/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import {
  getPhoneCandidates,
  verifyAndConsumeOtpCode,
  findUserByPhone,
} from '@/lib/services/otp-service';
import { getUsersStore } from '@/lib/services/users-store';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const rawPhone = body.phone || body.whatsapp || '';
    const code = String(body.code || '').trim();

    if (!rawPhone || !code) {
      return NextResponse.json({ error: 'Telefone e código são obrigatórios' }, { status: 400 });
    }

    const { cleanPhone, candidates } = getPhoneCandidates(rawPhone);

    // 1. Validar OTP
    const otpValidation = await verifyAndConsumeOtpCode(cleanPhone, code);
    if (!otpValidation.valid) {
      return NextResponse.json(
        { error: otpValidation.error || 'Código inválido ou expirado' },
        { status: 400 }
      );
    }

    // 2. Localizar usuário no sistema
    let appUser = await findUserByPhone(cleanPhone);

    // Fallback especial para Rodrigo Ferrari (Master Admin) se bater com o número
    if (!appUser) {
      const isRodrigo = candidates.some((c) => c.includes('41992332996') || c.endsWith('992332996'));
      if (isRodrigo) {
        const users = getUsersStore();
        appUser = users.find((u) => u.id === 'usr_rodrigo_ferrari') || {
          id: 'usr_rodrigo_ferrari',
          nome: 'Rodrigo Ferrari',
          email: 'rodrigo@swiftsail.co',
          whatsapp: '41992332996',
          role: 'master_admin',
          cliente_id: null,
          cliente_nome: 'Swiftsail HQ (Master Admin)',
          status: 'ativo',
          modulos: ['midia', 'whatsapp', 'criativos', 'crm', 'financeiro'],
        };
      }
    }

    // Se ainda não existir, cria perfil cliente padrão
    if (!appUser) {
      appUser = {
        id: `usr_${Date.now()}`,
        nome: `Usuário ${cleanPhone.slice(-4)}`,
        email: `${cleanPhone}@swiftsail.local`,
        whatsapp: cleanPhone,
        role: 'cliente_admin',
        cliente_id: null,
        cliente_nome: 'Workspace Convidado',
        status: 'ativo',
        modulos: ['midia', 'whatsapp', 'crm', 'criativos', 'financeiro'],
      };
    }

    // 3. Localizar ou Criar Usuário no Supabase Auth via E-mail Mascarado
    const supabaseAdmin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const workEmail = appUser.email && !appUser.email.endsWith('@convite.swiftsail.co')
      ? appUser.email
      : `${cleanPhone}@swiftsail.local`;

    let userId = '';

    // Procura no Supabase Auth
    const { data: userList } = await supabaseAdmin.auth.admin.listUsers();
    const existingAuthUser = userList?.users?.find(
      (u) =>
        u.email?.toLowerCase() === workEmail.toLowerCase() ||
        (u.phone && candidates.includes(u.phone.replace(/\D/g, '')))
    );

    if (existingAuthUser) {
      userId = existingAuthUser.id;
      await supabaseAdmin.auth.admin.updateUserById(userId, {
        email: workEmail,
        email_confirm: true,
        user_metadata: {
          nome: appUser.nome,
          role: appUser.role,
          whatsapp: cleanPhone,
          cliente_id: appUser.cliente_id,
        },
      });
    } else {
      // Criar novo usuário no Supabase Auth
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: workEmail,
        email_confirm: true,
        phone: cleanPhone.startsWith('+') ? cleanPhone : `+${cleanPhone}`,
        phone_confirm: true,
        user_metadata: {
          nome: appUser.nome,
          role: appUser.role,
          whatsapp: cleanPhone,
          cliente_id: appUser.cliente_id,
        },
      });

      if (createError) {
        console.error('[Supabase Auth Create User Error]:', createError);
        // Se já existir por email duplicado, tenta recuperar
        const retryList = await supabaseAdmin.auth.admin.listUsers();
        const found = retryList.data.users.find((u) => u.email === workEmail);
        if (found) {
          userId = found.id;
        } else {
          throw new Error(`Erro ao registrar usuário no Auth: ${createError.message}`);
        }
      } else {
        userId = newUser.user.id;
      }
    }

    // Tenta atualizar/inserir na tabela profiles caso ela exista no Supabase
    try {
      await supabaseAdmin.from('profiles').upsert({
        id: userId,
        phone: cleanPhone,
        name: appUser.nome,
        role: appUser.role,
      });
    } catch {}

    // 4. Criar Sessão JWT Legítima (Password Sign-In descartável temporário)
    const tempPassword = `otp-${Math.random().toString(36).slice(-8)}${Math.random().toString(36).slice(-8)}`;

    await supabaseAdmin.auth.admin.updateUserById(userId, {
      password: tempPassword,
    });

    const anonClient = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { auth: { persistSession: false } }
    );

    const { data: sessionData, error: sessionError } = await anonClient.auth.signInWithPassword({
      email: workEmail,
      password: tempPassword,
    });

    if (sessionError || !sessionData.session) {
      console.error('[Supabase Auth Sign-In Error]:', sessionError);
      return NextResponse.json(
        { error: 'Falha ao emitir token de sessão do usuário' },
        { status: 500 }
      );
    }

    // Determina redirecionamento baseado no perfil do usuário
    const redirectTo = appUser.role === 'master_admin' ? '/admin' : '/client';

    return NextResponse.json({
      success: true,
      userId,
      user: appUser,
      session: sessionData.session,
      redirectTo,
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Erro ao validar código OTP';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
