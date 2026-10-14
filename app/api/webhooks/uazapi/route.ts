import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json().catch(() => ({}));
    console.log('[UAZAPI Webhook Received]:', payload.event || payload.type || 'Event');

    // Aqui eventos como call_rejected, call_accepted, etc. podem atualizar status adicionais
    return NextResponse.json({ success: true, received: true });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
