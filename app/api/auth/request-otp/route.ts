import { NextRequest, NextResponse } from 'next/server';
import {
  getPhoneCandidates,
  storeOtpCode,
  sendOtpMessageToWhatsApp,
  findUserByPhone,
} from '@/lib/services/otp-service';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const rawPhone = body.phone || body.whatsapp || '';

    if (!rawPhone || typeof rawPhone !== 'string') {
      return NextResponse.json({ error: 'Telefone com DDD é obrigatório' }, { status: 400 });
    }

    const { cleanPhone } = getPhoneCandidates(rawPhone);
    if (cleanPhone.length < 10) {
      return NextResponse.json(
        { error: 'Telefone inválido. Digite o número com DDD (ex: 41 99233-2996).' },
        { status: 400 }
      );
    }

    // 1. Gera código de 6 dígitos
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutos de validade

    // 2. Salva e invalida códigos anteriores
    await storeOtpCode(cleanPhone, code, expiresAt);

    // 3. Dispara via Instância Estabelecida (Uazapi / Robô Swiftsail) com botão nativo copy:CODIGO
    let dispatchSuccess = false;
    let dispatchError = '';

    try {
      await sendOtpMessageToWhatsApp(cleanPhone, code);
      dispatchSuccess = true;
    } catch (err: unknown) {
      dispatchError = err instanceof Error ? err.message : 'Falha no envio';
      console.warn('[Request OTP WhatsApp Warning]:', dispatchError);
    }

    // Identifica se o usuário já possui cadastro
    const existingUser = await findUserByPhone(cleanPhone);

    return NextResponse.json({
      success: true,
      message: dispatchSuccess
        ? 'Código enviado com sucesso para o seu WhatsApp!'
        : 'Código gerado. Caso não receba no WhatsApp, verifique a conexão da instância em Admin > Notificações.',
      phone: cleanPhone,
      isRegistered: Boolean(existingUser),
      userName: existingUser?.nome,
      // Em ambiente de desenvolvimento local, expõe o código para facilitar testes rápidos caso a linha esteja desconectada
      devCode: process.env.NODE_ENV === 'development' ? code : undefined,
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Erro ao processar solicitação de OTP';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
