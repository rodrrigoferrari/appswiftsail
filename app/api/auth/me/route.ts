import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { getPhoneCandidates } from '@/lib/services/otp-service';
import { AppUser } from '@/types/database';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const phoneParam = searchParams.get('phone');
    const authHeader = req.headers.get('authorization');

    // Suporte a cookies HTTP para mobile Safari / Webviews do WhatsApp
    const cookiePhone = req.cookies.get('swiftsail_user_phone')?.value || req.cookies.get('swiftsail_phone')?.value;
    const cookieToken = req.cookies.get('sb-access-token')?.value || req.cookies.get('swiftsail_session')?.value;
    const cookieUserRaw = req.cookies.get('swiftsail_user')?.value;

    let phone = phoneParam ? phoneParam.replace(/\D/g, '') : (cookiePhone ? cookiePhone.replace(/\D/g, '') : '');
    let email = '';
    let authUserId = '';

    const token = (authHeader && authHeader.startsWith('Bearer '))
      ? authHeader.replace('Bearer ', '').trim()
      : cookieToken || '';

    // Se veio token JWT (seja por Header ou Cookie), valida no Supabase Auth
    if (token) {
      try {
        const { data: authData, error: authErr } = await supabaseAdmin.auth.getUser(token);
        if (!authErr && authData.user) {
          authUserId = authData.user.id;
          email = authData.user.email || '';
          if (authData.user.phone) {
            phone = authData.user.phone.replace(/\D/g, '');
          }
          if (!phone && authData.user.user_metadata?.whatsapp) {
            phone = String(authData.user.user_metadata.whatsapp).replace(/\D/g, '');
          }
        }
      } catch (tokenErr) {
        console.warn('[auth/me] Erro ao validar token JWT:', tokenErr);
      }
    }

    // Se ainda não temos phone/email/authUserId, tenta ler do cookieUserRaw
    if (!phone && !email && !authUserId && cookieUserRaw) {
      try {
        const parsed = JSON.parse(decodeURIComponent(cookieUserRaw));
        if (parsed?.whatsapp) phone = String(parsed.whatsapp).replace(/\D/g, '');
        if (parsed?.email) email = parsed.email;
        if (parsed?.id) authUserId = parsed.id;
      } catch {}
    }

    if (!phone && !email && !authUserId) {
      return NextResponse.json({ authenticated: false, user: null }, { status: 401 });
    }

    // Identificação Rodrigo Ferrari (Master Admin)
    const isRodrigo =
      phone.includes('41992332996') ||
      phone.endsWith('992332996') ||
      email.toLowerCase() === 'rodrigo@swiftsail.co';

    if (isRodrigo) {
      const masterUser: AppUser = {
        id: authUserId || 'usr_rodrigo_ferrari',
        nome: 'Rodrigo Ferrari',
        email: 'rodrigo@swiftsail.co',
        whatsapp: '41992332996',
        role: 'master_admin',
        cliente_id: null,
        cliente_nome: 'Swiftsail HQ (Master Admin)',
        status: 'ativo',
        modulos: ['midia', 'whatsapp', 'criativos', 'crm', 'financeiro'],
      };
      return NextResponse.json({ authenticated: true, user: masterUser });
    }

    // Busca perfil na tabela public.profiles
    const candidates = phone ? getPhoneCandidates(phone).candidates : [];
    let profileQuery = supabaseAdmin.from('profiles').select('*');

    if (authUserId) {
      profileQuery = profileQuery.or(`id.eq.${authUserId}${candidates.length > 0 ? `,phone.in.(${candidates.join(',')})` : ''}`);
    } else if (candidates.length > 0) {
      profileQuery = profileQuery.in('phone', candidates);
    } else if (email) {
      profileQuery = profileQuery.eq('email', email);
    }

    const { data: profiles, error: pErr } = await profileQuery.limit(1);

    if (!pErr && profiles && profiles.length > 0) {
      const p = profiles[0];
      const isMasterProfile =
        p.role === 'master_admin' ||
        (p.phone && (p.phone.includes('41992332996') || p.phone.endsWith('992332996')));

      const clientIds = Array.isArray(p.cliente_ids) && p.cliente_ids.length > 0
        ? p.cliente_ids
        : p.cliente_id ? [p.cliente_id] : [];

      // Atualiza timestamp de último acesso em background (não-bloqueante)
      if (authUserId && !isMasterProfile) {
        (async () => {
          try {
            const nowIso = new Date().toISOString();
            await supabaseAdmin.auth.admin.updateUserById(authUserId, {
              user_metadata: {
                nome: p.name,
                role: p.role,
                whatsapp: p.phone || phone,
                cliente_id: p.cliente_id,
                ultimo_acesso: nowIso,
              },
            });
            try {
              await supabaseAdmin.from('profiles').update({ ultimo_acesso: nowIso } as any).eq('id', p.id);
            } catch {}
          } catch {}
        })();
      }

      const appUser: AppUser = {
        id: p.id,
        nome: p.name || 'Usuário Swiftsail',
        email: p.email || (p.phone ? `${p.phone}@swiftsail.co` : `${p.id}@swiftsail.co`),
        whatsapp: p.phone || phone,
        role: isMasterProfile ? 'master_admin' : (p.role || 'cliente_admin'),
        cliente_id: isMasterProfile ? null : p.cliente_id || (clientIds[0] || null),
        cliente_ids: isMasterProfile ? [] : clientIds,
        cliente_nome: p.cliente_nome || 'Workspace',
        status: 'ativo',
        modulos: ['midia', 'whatsapp', 'crm', 'criativos', 'financeiro'],
        ultimo_acesso: (p as any).ultimo_acesso || null,
      };

      return NextResponse.json({ authenticated: true, user: appUser });
    }

    // Se tem authUser válido mas não achou em profiles
    if (authUserId) {
      const fallbackUser: AppUser = {
        id: authUserId,
        nome: `Usuário ${phone ? phone.slice(-4) : ''}`,
        email: email || `${authUserId}@swiftsail.co`,
        whatsapp: phone,
        role: 'cliente_admin',
        cliente_id: null,
        cliente_nome: 'Workspace',
        status: 'ativo',
        modulos: ['midia', 'whatsapp', 'crm', 'criativos', 'financeiro'],
      };
      return NextResponse.json({ authenticated: true, user: fallbackUser });
    }

    return NextResponse.json({ authenticated: false, user: null }, { status: 401 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro ao recuperar usuário autenticado';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
