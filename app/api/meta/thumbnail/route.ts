import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const cache = new Map<string, { url: string; timestamp: number }>();
const CACHE_TTL = 1000 * 60 * 60 * 24; // 24 horas de cache

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const targetUrl = searchParams.get('url');

    if (!targetUrl) {
      return new NextResponse('URL de anúncio ausente', { status: 400 });
    }

    // Verifica cache em memória
    const cached = cache.get(targetUrl);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return NextResponse.redirect(cached.url, { status: 302 });
    }

    // Se for link do Instagram (post / reel / tv)
    if (targetUrl.includes('instagram.com')) {
      const match = targetUrl.match(/instagram\.com\/(?:p|reel|tv)\/([^/?#&]+)/i);
      const shortcode = match ? match[1] : null;

      if (shortcode) {
        const embedUrl = `https://www.instagram.com/p/${shortcode}/embed/`;

        const res = await fetch(embedUrl, {
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          },
          next: { revalidate: 3600 },
        });

        if (res.ok) {
          const html = await res.text();
          const imgMatch =
            html.match(/class="EmbeddedMediaImage"[^>]+src="([^"]+)"/i) ||
            html.match(/<img[^>]+class="[^"]*EmbeddedMediaImage[^"]*"[^>]+src="([^"]+)"/i) ||
            html.match(/src="(https:\/\/[^"&]+(?:cdninstagram|fbcdn)[^"&]+)"/i);

          if (imgMatch && imgMatch[1]) {
            const rawImg = imgMatch[1].replace(/&amp;/g, '&');
            cache.set(targetUrl, { url: rawImg, timestamp: Date.now() });
            return NextResponse.redirect(rawImg, { status: 302 });
          }
        }
      }
    }

    // Fallback: Card gráfico premium estilizado representando anúncio do Meta Ads
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="600" height="600" viewBox="0 0 600 600">
        <defs>
          <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#090d16" />
            <stop offset="50%" stop-color="#0f172a" />
            <stop offset="100%" stop-color="#1e1b4b" />
          </linearGradient>
          <linearGradient id="metaGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#06b6d4" />
            <stop offset="50%" stop-color="#3b82f6" />
            <stop offset="100%" stop-color="#8b5cf6" />
          </linearGradient>
        </defs>
        <rect width="100%" height="100%" fill="url(#bg)" />
        <circle cx="300" cy="240" r="120" fill="url(#metaGrad)" opacity="0.12" />
        <circle cx="300" cy="240" r="64" fill="url(#metaGrad)" opacity="0.25" />
        
        <!-- Ícone Play / Meta Ads -->
        <polygon points="280,205 340,240 280,275" fill="#38bdf8" />
        
        <rect x="180" y="340" width="240" height="34" rx="17" fill="#0284c7" fill-opacity="0.25" stroke="#38bdf8" stroke-width="1.5" />
        <text x="300" y="362" font-family="-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif" font-size="13" font-weight="800" fill="#38bdf8" text-anchor="middle" letter-spacing="1.5">
          META ADS • CRIATIVO
        </text>
        <text x="300" y="415" font-family="-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif" font-size="16" font-weight="600" fill="#f8fafc" text-anchor="middle">
          Anúncio Oficial Publicado
        </text>
        <text x="300" y="445" font-family="-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif" font-size="13" fill="#94a3b8" text-anchor="middle">
          Clique no botão "Ver Criativo" para abrir no Meta
        </text>
      </svg>
    `.trim();

    return new NextResponse(svg, {
      status: 200,
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (err: unknown) {
    return new NextResponse('Erro ao obter thumbnail', { status: 500 });
  }
}
