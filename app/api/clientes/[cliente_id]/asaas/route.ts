import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { resolveClientesAtivos, fetchAll, indisponivel } from '@/lib/services/painel';

export const dynamic = 'force-dynamic';

interface CobrancaRow {
  cliente_id: string;
  cliente_nome: string | null;
  cobranca_id: string;
  asaas_customer_id: string | null;
  valor: number | null;
  valor_liquido: number | null;
  vencimento: string | null;
  status: string | null;
  data_pagamento: string | null;
  tipo_cobranca: string | null;
  descricao: string | null;
  atualizado_em: string | null;
}

interface NotaRow {
  cliente_id: string;
  cliente_nome: string | null;
  nota_id: string;
  asaas_customer_id: string | null;
  payment_id: string | null;
  numero: string | null;
  status: string | null;
  valor: number | null;
  data_emissao: string | null;
  pdf_storage_path: string | null;
  atualizado_em: string | null;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ cliente_id: string }> }
) {
  try {
    const { cliente_id } = await params;

    const ids = await resolveClientesAtivos(cliente_id);
    if (ids === null) {
      return NextResponse.json(
        { success: false, error: 'Cliente inativo ou inexistente' },
        { status: 404 }
      );
    }

    if (ids.length === 0) {
      return NextResponse.json({
        success: true,
        cliente_id,
        totais: {
          recebido_liquido: 0,
          aguardando: 0,
          vencido: 0,
          faturado_total: 0,
        },
        cobrancas: [],
      });
    }

    // 1. Busca notas fiscais para cruzamento por payment_id
    const notasMap = new Map<string, NotaRow>();
    try {
      const notas = await fetchAll<NotaRow>((a, b) =>
        supabaseAdmin
          .from('painel_asaas_notas')
          .select('cliente_id,cliente_nome,nota_id,asaas_customer_id,payment_id,numero,status,valor,data_emissao,pdf_storage_path,atualizado_em')
          .in('cliente_id', ids)
          .range(a, b)
      );
      for (const n of notas) {
        if (n.payment_id) {
          notasMap.set(n.payment_id, n);
        }
      }
    } catch {
      // Segue sem notas se a view estiver momentaneamente vazia
    }

    // 2. Busca cobranças reais em painel_asaas_cobrancas
    let rows: CobrancaRow[];
    try {
      rows = await fetchAll<CobrancaRow>((a, b) =>
        supabaseAdmin
          .from('painel_asaas_cobrancas')
          .select('*')
          .in('cliente_id', ids)
          .order('vencimento', { ascending: false })
          .range(a, b)
      );
    } catch (dbErr) {
      return NextResponse.json(indisponivel(dbErr), { status: 503 });
    }

    // 3. Agregação de totais financeiros estritamente por regras do contrato:
    // PENDING = aguardando, OVERDUE = vencida, RECEIVED / CONFIRMED = recebida/paga
    let recebidoLiquido = 0;
    let aguardando = 0;
    let vencido = 0;
    let faturadoTotal = 0;

    const cobrancas = rows.map((r) => {
      const statusRaw = (r.status || '').toUpperCase();
      const valorBruto = Number(r.valor) || 0;
      const valorLiquido = Number(r.valor_liquido) || valorBruto;

      let statusFormatado: 'RECEBIDA' | 'CONFIRMADA' | 'AGUARDANDO' | 'VENCIDA' = 'AGUARDANDO';

      if (statusRaw === 'RECEIVED' || statusRaw === 'CONFIRMED' || statusRaw === 'RECEBIDA' || statusRaw === 'PAGA') {
        statusFormatado = statusRaw === 'CONFIRMED' ? 'CONFIRMADA' : 'RECEBIDA';
        recebidoLiquido += valorLiquido;
        faturadoTotal += valorBruto;
      } else if (statusRaw === 'OVERDUE' || statusRaw === 'VENCIDA') {
        statusFormatado = 'VENCIDA';
        vencido += valorBruto;
      } else {
        statusFormatado = 'AGUARDANDO';
        aguardando += valorBruto;
      }

      const nota = r.cobranca_id ? notasMap.get(r.cobranca_id) : undefined;
      const hasPdf = Boolean(nota?.pdf_storage_path && nota.pdf_storage_path.trim() !== '');

      return {
        id: r.cobranca_id,
        descricao: r.descricao || 'Serviços de Marketing & Tráfego Pago',
        cliente: r.cliente_nome || r.cliente_id,
        cliente_id: r.cliente_id,
        vencimento: r.vencimento,
        data_pagamento: r.data_pagamento,
        valor: valorBruto,
        valor_liquido: valorLiquido,
        forma_pagamento: r.tipo_cobranca || 'BOLETO',
        status: statusFormatado,
        status_original: r.status,
        nf_numero: nota?.numero ? `NF-e ${nota.numero}` : null,
        nf_status: nota?.status || null,
        nota_id: nota?.nota_id || null,
        has_pdf: hasPdf,
        pdf_storage_path: nota?.pdf_storage_path || null,
      };
    });

    return NextResponse.json({
      success: true,
      cliente_id,
      totais: {
        recebido_liquido: Number(recebidoLiquido.toFixed(2)),
        aguardando: Number(aguardando.toFixed(2)),
        vencido: Number(vencido.toFixed(2)),
        faturado_total: Number(faturadoTotal.toFixed(2)),
      },
      cobrancas,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Erro interno' },
      { status: 500 }
    );
  }
}
