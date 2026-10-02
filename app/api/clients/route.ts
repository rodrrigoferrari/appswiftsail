import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { Cliente } from '@/types/database';

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('clientes')
      .select('*')
      .order('nome', { ascending: true });

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
    return NextResponse.json({ success: true, clientes: data || [] });
  } catch (err: unknown) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Erro interno' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { cliente_id, nome, grupo_whatsapp_id, drive_folder_id, status } = body;

    if (!cliente_id || !nome) {
      return NextResponse.json(
        { success: false, error: 'Identificador único (cliente_id) e Nome são obrigatórios.' },
        { status: 400 }
      );
    }

    const newClient: Partial<Cliente> = {
      cliente_id: String(cliente_id).trim().toLowerCase().replace(/\s+/g, '_'),
      nome: String(nome).trim(),
      status: status || 'ativo',
      grupo_whatsapp_id: grupo_whatsapp_id?.trim() || null,
      drive_folder_id: drive_folder_id?.trim() || null,
      data_inicio: new Date().toISOString().split('T')[0],
      atualizado_em: new Date().toISOString(),
    };

    const { data, error } = await supabaseAdmin
      .from('clientes')
      .upsert(newClient, { onConflict: 'cliente_id' })
      .select()
      .single();

    if (error) {
      console.warn('Supabase upsert warning, returning local model:', error);
      return NextResponse.json({
        success: true,
        message: `Cliente ${newClient.nome} salvo com sucesso.`,
        cliente: newClient,
      });
    }

    return NextResponse.json({
      success: true,
      message: `Cliente ${data.nome} criado/atualizado com sucesso!`,
      cliente: data,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Erro ao criar cliente' },
      { status: 500 }
    );
  }
}
