import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { resolveClientesAtivos } from '@/lib/services/painel';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ cliente_id: string; nota_id: string }> }
) {
  try {
    const { cliente_id, nota_id } = await params;

    const ids = await resolveClientesAtivos(cliente_id);
    if (ids === null) {
      return NextResponse.json(
        { success: false, error: 'Cliente inativo ou inexistente' },
        { status: 404 }
      );
    }

    // Busca a nota fiscal em public.painel_asaas_notas
    let query = supabaseAdmin
      .from('painel_asaas_notas')
      .select('cliente_id,cliente_nome,nota_id,numero,status,valor,data_emissao,pdf_storage_path')
      .eq('nota_id', nota_id);

    if (cliente_id.toUpperCase() !== 'ALL') {
      query = query.in('cliente_id', ids);
    }

    const { data: nota, error: dbErr } = await query.maybeSingle();

    if (dbErr) {
      return NextResponse.json(
        { success: false, error: dbErr.message },
        { status: 500 }
      );
    }

    if (!nota) {
      return NextResponse.json(
        { success: false, error: 'Nota fiscal não encontrada para este cliente' },
        { status: 404 }
      );
    }

    // Regra: notas canceladas ou agendadas não possuem PDF
    if (nota.status === 'CANCELED') {
      return NextResponse.json({
        success: false,
        disponivel: false,
        status: nota.status,
        numero: nota.numero,
        mensagem: 'Nota fiscal cancelada — documento PDF indisponível.',
      });
    }

    if (nota.status === 'SCHEDULED') {
      return NextResponse.json({
        success: false,
        disponivel: false,
        status: nota.status,
        numero: nota.numero,
        mensagem: 'Nota fiscal agendada — o PDF será emitido na data agendada.',
      });
    }

    // Regra: se pdf_storage_path estiver preenchido, gera signed URL de até 5 minutos (300 segundos)
    if (nota.pdf_storage_path && nota.pdf_storage_path.trim() !== '') {
      const { data: signed, error: signErr } = await supabaseAdmin.storage
        .from('notas-asaas')
        .createSignedUrl(nota.pdf_storage_path, 300);

      if (signErr || !signed?.signedUrl) {
        return NextResponse.json(
          {
            success: false,
            error: signErr?.message || 'Falha ao assinar URL do storage',
          },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        disponivel: true,
        url: signed.signedUrl,
        numero: nota.numero,
        status: nota.status,
        data_emissao: nota.data_emissao,
        valor: nota.valor,
        cliente: nota.cliente_nome || nota.cliente_id,
        filename: `NF-e-${nota.numero || nota.nota_id}.pdf`,
      });
    }

    // Se estiver vazio: PDF ainda não disponível (fila do backfill noturno)
    return NextResponse.json({
      success: false,
      disponivel: false,
      status: nota.status,
      numero: nota.numero,
      mensagem: 'PDF ainda não disponível. As notas antigas estão sendo baixadas nas rodadas noturnas.',
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Erro interno' },
      { status: 500 }
    );
  }
}
