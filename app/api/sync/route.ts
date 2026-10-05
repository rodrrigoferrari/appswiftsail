import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { indisponivel } from '@/lib/services/painel';
import { diasAtrasBRT } from '@/lib/date';

export const dynamic = 'force-dynamic';

interface SyncLinha {
  fonte: string;
  status: 'ok' | 'erro' | 'parcial' | string;
  iniciado_em: string;
  terminado_em: string | null;
  linhas: number | null;
  erro: string | null;
}

const HORARIOS_SYNC: Record<string, string> = {
  kommo: '23:00 BRT',
  meta: '23:25 BRT',
  google: '23:35 BRT',
};

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('painel_sync_rodadas')
      .select('fonte,status,iniciado_em,terminado_em,linhas,erro')
      .order('iniciado_em', { ascending: false })
      .limit(60);

    if (error) {
      return NextResponse.json(indisponivel(new Error(error.message)), { status: 503 });
    }

    const rodadas = (data || []) as SyncLinha[];

    // Limite: anteontem 23:00 BRT. Se a última rodada ok/parcial for anterior a isso (ou inexistente), marca desatualizado.
    const anteontem = diasAtrasBRT(2);
    const limiteTimestamp = new Date(`${anteontem}T23:00:00-03:00`).getTime();

    const fontes: Record<
      string,
      {
        horario_previsto: string;
        ultima_ok_ou_parcial: string | null;
        ultima_rodada_status: string;
        ultimo_erro: string | null;
        desatualizado: boolean;
        total_rodadas_avaliadas: number;
      }
    > = {
      kommo: { horario_previsto: HORARIOS_SYNC.kommo, ultima_ok_ou_parcial: null, ultima_rodada_status: 'desconhecido', ultimo_erro: null, desatualizado: true, total_rodadas_avaliadas: 0 },
      meta: { horario_previsto: HORARIOS_SYNC.meta, ultima_ok_ou_parcial: null, ultima_rodada_status: 'desconhecido', ultimo_erro: null, desatualizado: true, total_rodadas_avaliadas: 0 },
      google: { horario_previsto: HORARIOS_SYNC.google, ultima_ok_ou_parcial: null, ultima_rodada_status: 'desconhecido', ultimo_erro: null, desatualizado: true, total_rodadas_avaliadas: 0 },
    };

    for (const r of rodadas) {
      const f = (fontes[r.fonte] ||= {
        horario_previsto: HORARIOS_SYNC[r.fonte] || 'Diário',
        ultima_ok_ou_parcial: null,
        ultima_rodada_status: r.status,
        ultimo_erro: null,
        desatualizado: true,
        total_rodadas_avaliadas: 0,
      });

      f.total_rodadas_avaliadas++;
      if (f.total_rodadas_avaliadas === 1) {
        f.ultima_rodada_status = r.status;
        if (r.status === 'erro') f.ultimo_erro = r.erro;
      }

      if ((r.status === 'ok' || r.status === 'parcial') && !f.ultima_ok_ou_parcial) {
        f.ultima_ok_ou_parcial = r.terminado_em || r.iniciado_em;
      }
    }

    // Calcula status de desatualizado para cada fonte
    for (const [fonte, info] of Object.entries(fontes)) {
      if (!info.ultima_ok_ou_parcial) {
        info.desatualizado = true;
      } else {
        const lastTime = new Date(info.ultima_ok_ou_parcial).getTime();
        info.desatualizado = lastTime < limiteTimestamp;
      }
    }

    return NextResponse.json({
      success: true,
      limite_desatualizado: `${anteontem}T23:00:00-03:00`,
      fontes,
      sync_rodadas: rodadas,
    });
  } catch (err: unknown) {
    return NextResponse.json(indisponivel(err), { status: 503 });
  }
}
