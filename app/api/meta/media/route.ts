import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const path = searchParams.get('path');

    if (!path) {
      return new NextResponse('Parâmetro path ausente', { status: 400 });
    }

    // Tenta primeiro no bucket 'criativos-meta', depois 'criativos'
    let { data, error } = await supabaseAdmin.storage.from('criativos-meta').download(path);

    if (error || !data) {
      const fallback = await supabaseAdmin.storage.from('criativos').download(path);
      if (!fallback.error && fallback.data) {
        data = fallback.data;
        error = null;
      }
    }

    if (error || !data) {
      return new NextResponse('Mídia não encontrada no storage', { status: 404 });
    }

    const buffer = Buffer.from(await data.arrayBuffer());
    const isPng = path.toLowerCase().endsWith('.png');
    const isVideo = path.toLowerCase().endsWith('.mp4');
    const contentType = isVideo ? 'video/mp4' : isPng ? 'image/png' : 'image/jpeg';

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
      },
    });
  } catch (err: any) {
    return new NextResponse(err.message || 'Erro ao carregar mídia', { status: 500 });
  }
}
