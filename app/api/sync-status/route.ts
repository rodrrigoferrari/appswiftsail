import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

interface SyncRodada {
  fonte: 'meta' | 'google' | 'kommo' | 'asaas';
  status: 'ok' | 'parcial' | 'erro';
  iniciado_em: string;
  terminado_em: string | null;
  linhas: number | null;
  erro: string | null;
}

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('painel_sync_rodadas')
      .select('fonte,status,iniciado_em,terminado_em,linhas,erro')
      .order('iniciado_em', { ascending: false })
      .limit(100);

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    const rows = (data || []) as SyncRodada[];
    const now = new Date().getTime();
    const HORAS_26 = 26 * 60 * 60 * 1000;

    const fontes = ['meta', 'google', 'kommo', 'asaas'] as const;
    const statusPorFonte: Record<
      string,
      {
        fonte: string;
        ultima_rodada_em: string | null;
        status_recente: string;
        linhas: number | null;
        erro: string | null;
        desatualizado: boolean;
        motivo_alerta: string | null;
      }
    > = {};

    for (const f of fontes) {
      const rodadasDaFonte = rows.filter((r) => r.fonte === f);
      const ultimaOk = rodadasDaFonte.find((r) => r.status === 'ok');
      const maisRecente = rodadasDaFonte[0];

      if (!maisRecente) {
        statusPorFonte[f] = {
          fonte: f,
          ultima_rodada_em: null,
          status_recente: 'sem_dados',
          linhas: null,
          erro: null,
          desatualizado: true,
          motivo_alerta: 'Nenhuma rodada de sincronização registrada no banco',
        };
        continue;
      }

      const timestampUltimaOk = ultimaOk ? new Date(ultimaOk.iniciado_em).getTime() : 0;
      const diferencaHoras = timestampUltimaOk > 0 ? (now - timestampUltimaOk) / (1000 * 60 * 60) : 999;
      const passouDe26Horas = diferencaHoras > 26;
      const temErroOuParcial = maisRecente.status !== 'ok';

      let motivo: string | null = null;
      if (passouDe26Horas) {
        motivo = `Última sincronização com sucesso foi há ${Math.round(diferencaHoras)}h (mais de 26h)`;
      } else if (temErroOuParcial) {
        motivo = `Última rodada finalizou com status '${maisRecente.status}' (${maisRecente.erro || 'execução parcial'})`;
      }

      statusPorFonte[f] = {
        fonte: f,
        ultima_rodada_em: ultimaOk ? ultimaOk.iniciado_em : maisRecente.iniciado_em,
        status_recente: maisRecente.status,
        linhas: maisRecente.linhas,
        erro: maisRecente.erro,
        desatualizado: passouDe26Horas || temErroOuParcial,
        motivo_alerta: motivo,
      };
    }

    return NextResponse.json({
      success: true,
      fontes: statusPorFonte,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Erro interno' },
      { status: 500 }
    );
  }
}
