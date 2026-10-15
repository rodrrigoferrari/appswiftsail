import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

interface CachedThumb {
  buffer: Buffer;
  contentType: string;
  timestamp: number;
}

const cache = new Map<string, CachedThumb>();
const CACHE_TTL = 1000 * 60 * 60 * 24; // 24 horas de cache

const FALLBACK_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600" viewBox="0 0 600 600">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0F172A" />
      <stop offset="50%" stop-color="#1E293B" />
      <stop offset="100%" stop-color="#0F172A" />
    </linearGradient>
    <linearGradient id="metaGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0050FF" />
      <stop offset="100%" stop-color="#00C2FF" />
    </linearGradient>
  </defs>
  <rect width="100%" height="100%" fill="url(#bg)" rx="16" />
  <circle cx="300" cy="240" r="100" fill="url(#metaGrad)" opacity="0.15" />
  <circle cx="300" cy="240" r="54" fill="url(#metaGrad)" opacity="0.3" />
  
  <!-- Play Icon -->
  <polygon points="286,215 330,240 286,265" fill="#FFFFFF" />
  
  <rect x="180" y="340" width="240" height="34" rx="17" fill="#0050FF" fill-opacity="0.2" stroke="#0050FF" stroke-width="1.5" />
  <text x="300" y="362" font-family="-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif" font-size="12" font-weight="800" fill="#38BDF8" text-anchor="middle" letter-spacing="1.5">
    META ADS • ANÚNCIO
  </text>
  <text x="300" y="415" font-family="-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif" font-size="16" font-weight="700" fill="#F8FAFC" text-anchor="middle">
    Criativo Publicado
  </text>
  <text x="300" y="445" font-family="-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif" font-size="13" fill="#94A3B8" text-anchor="middle">
    Clique para abrir a prévia completa
  </text>
</svg>
`.trim();

function getSvgResponse() {
  return new NextResponse(FALLBACK_SVG, {
    status: 200,
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const targetUrl = searchParams.get('url');

    if (!targetUrl || targetUrl === 'default') {
      return getSvgResponse();
    }

    // 1. Verifica cache em memória
    const cached = cache.get(targetUrl);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return new NextResponse(new Uint8Array(cached.buffer), {
        status: 200,
        headers: {
          'Content-Type': cached.contentType,
          'Cache-Control': 'public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400',
        },
      });
    }

    let rawImgUrl: string | null = null;

    // 2. Se for link do Instagram (post / reel / tv)
    if (targetUrl.includes('instagram.com')) {
      const match = targetUrl.match(/instagram\.com\/(?:p|reel|tv)\/([^/?#&]+)/i);
      const shortcode = match ? match[1] : null;

      if (shortcode) {
        // Método A: Carrega página pública simulando Facebook OpenGraph Crawler
        try {
          const postRes = await fetch(`https://www.instagram.com/p/${shortcode}/`, {
            headers: {
              'User-Agent': 'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)',
              'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            },
            next: { revalidate: 3600 },
          });

          if (postRes.ok) {
            const html = await postRes.text();
            const ogMatch =
              html.match(/<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/i) ||
              html.match(/content=["']([^"']+)["']\s+property=["']og:image["']/i);

            if (ogMatch && ogMatch[1]) {
              rawImgUrl = ogMatch[1].replace(/&amp;/g, '&');
            }
          }
        } catch {
          // Ignora e tenta método B
        }

        // Método B: Fallback no Embed caso o Método A falhe (filtrando estritamente extensões de imagem)
        if (!rawImgUrl) {
          try {
            const embedRes = await fetch(`https://www.instagram.com/p/${shortcode}/embed/`, {
              headers: {
                'User-Agent':
                  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
              },
              next: { revalidate: 3600 },
            });

            if (embedRes.ok) {
              const html = await embedRes.text();
              const imgMatch =
                html.match(/class="EmbeddedMediaImage"[^>]+src="([^"]+)"/i) ||
                html.match(/<img[^>]+class="[^"]*EmbeddedMediaImage[^"]*"[^>]+src="([^"]+)"/i) ||
                html.match(/src="(https:\/\/[^"&]+(?:cdninstagram|fbcdn)[^"&]+(?:\.jpg|\.jpeg|\.png|\.webp)[^"&]*)"/i);

              if (imgMatch && imgMatch[1]) {
                rawImgUrl = imgMatch[1].replace(/&amp;/g, '&');
              }
            }
          } catch {
            // Ignora
          }
        }
      }
    } else if (targetUrl.includes('facebook.com')) {
      // 3. Se for link do Facebook
      try {
        const fbRes = await fetch(targetUrl, {
          headers: {
            'User-Agent': 'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)',
          },
          next: { revalidate: 3600 },
        });

        if (fbRes.ok) {
          const html = await fbRes.text();
          const ogMatch =
            html.match(/<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/i) ||
            html.match(/content=["']([^"']+)["']\s+property=["']og:image["']/i);

          if (ogMatch && ogMatch[1]) {
            rawImgUrl = ogMatch[1].replace(/&amp;/g, '&');
          }
        }
      } catch {
        // Ignora
      }
    }

    // 4. Se encontrou a URL real da imagem, faz o download do buffer binário e serve
    if (rawImgUrl) {
      try {
        const imgRes = await fetch(rawImgUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
            'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
          },
        });

        if (imgRes.ok) {
          const buffer = Buffer.from(await imgRes.arrayBuffer());
          const contentType = imgRes.headers.get('content-type') || 'image/jpeg';

          cache.set(targetUrl, { buffer, contentType, timestamp: Date.now() });

          return new NextResponse(new Uint8Array(buffer), {
            status: 200,
            headers: {
              'Content-Type': contentType,
              'Cache-Control': 'public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400',
            },
          });
        }
      } catch {
        // Se falhar o download binário, tenta redirecionar
        return NextResponse.redirect(rawImgUrl, { status: 302 });
      }
    }

    // Fallback: SVG de anúncio Meta Ads
    return getSvgResponse();
  } catch (err: unknown) {
    return getSvgResponse();
  }
}
