import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { clienteId, clienteNome, pergunta, dateRange, metricsContext } = body;

    if (!clienteId || !pergunta) {
      return NextResponse.json(
        { success: false, error: 'Parâmetros obrigatórios ausentes (clienteId e pergunta).' },
        { status: 400 }
      );
    }

    // 1. Buscar a chave de API da Anthropic cadastrada no admin (knowledge_base)
    let anthropicApiKey = process.env.ANTHROPIC_API_KEY || '';

    try {
      const { data: credsData } = await supabaseAdmin
        .from('knowledge_base')
        .select('content')
        .contains('tags', ['admin', 'credentials'])
        .order('created_at', { ascending: false })
        .limit(1);

      if (credsData && credsData.length > 0) {
        const parsed = JSON.parse(credsData[0].content);
        if (parsed.anthropic_key && parsed.anthropic_key.trim().length > 0) {
          anthropicApiKey = parsed.anthropic_key.trim();
        }
      }
    } catch (dbErr) {
      console.warn('[AI Chat] Erro ao ler credenciais do banco:', dbErr);
    }

    if (!anthropicApiKey) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Nenhuma API Key da Anthropic encontrada. Por favor, cadastre seu token em "Admin > Governança de IA" ou "Credenciais Master".',
          code: 'MISSING_API_KEY',
        },
        { status: 400 }
      );
    }

    // 2. Montar contexto ESTRITAMENTE restrito ao cliente selecionado
    const clientDisplayName = clienteNome || clienteId;
    const periodLabel = dateRange?.label || 'Período Selecionado';

    const systemPrompt = `Você é o Especialista de Inteligência de Tráfego e Performance Comercial da plataforma Swiftsail.
Sua missão é responder às dúvidas estratégicas, operacionais e de negócios do cliente "${clientDisplayName}".

REGRAS ESTRITAS DE ISOLAMENTO E GOVERNANÇA:
1. Você está analisando ESTRITAMENTE e EXCLUSIVAMENTE a empresa "${clientDisplayName}" (ID: ${clienteId}).
2. NUNCA cite, compare ou mencione dados de outras empresas ou clientes. Seu universo de análise limita-se aos dados fornecidos deste cliente.
3. Não alucine dados. Se alguma métrica não estiver disponível nos dados fornecidos, diga com transparência.
4. Responda em Português (Brasil) com tom executivo, objetivo, inteligente e acionável. Use listas curtas e números em negrito para facilitar a leitura rápida de um tomador de decisão.

DADOS REAIS DO CLIENTE "${clientDisplayName}" NO PERÍODO (${periodLabel}):
${JSON.stringify(metricsContext || {}, null, 2)}`;

    // 3. Fazer requisição direta para a API da Anthropic
    const anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': anthropicApiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1500,
        temperature: 0.3,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: pergunta,
          },
        ],
      }),
    });

    if (!anthropicResponse.ok) {
      const errText = await anthropicResponse.text();
      console.error('[AI Chat] Erro retornado pela Anthropic API:', anthropicResponse.status, errText);

      // Tenta fallback com claude-3-haiku caso o modelo sonnet específico não esteja habilitado no tier
      if (anthropicResponse.status === 404 || errText.includes('model')) {
        const fallbackResponse = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'x-api-key': anthropicApiKey,
            'anthropic-version': '2023-06-01',
            'content-type': 'application/json',
          },
          body: JSON.stringify({
            model: 'claude-3-haiku-20240307',
            max_tokens: 1500,
            temperature: 0.3,
            system: systemPrompt,
            messages: [{ role: 'user', content: pergunta }],
          }),
        });

        if (fallbackResponse.ok) {
          const fallbackData = await fallbackResponse.json();
          const resposta = fallbackData.content?.[0]?.text || 'Sem resposta gerada.';
          return NextResponse.json({ success: true, resposta });
        }
      }

      return NextResponse.json(
        {
          success: false,
          error: `Erro na API da Anthropic (${anthropicResponse.status}): ${errText}`,
        },
        { status: 502 }
      );
    }

    const aiData = await anthropicResponse.json();
    const resposta = aiData.content?.[0]?.text || 'Sem resposta gerada pelo modelo.';

    return NextResponse.json({
      success: true,
      resposta,
    });
  } catch (err: unknown) {
    console.error('[AI Chat] Erro inesperado:', err);
    const message = err instanceof Error ? err.message : 'Erro interno ao processar consulta de IA';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
