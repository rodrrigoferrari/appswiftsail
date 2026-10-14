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

    // 1. Buscar a chave de API da OpenRouter cadastrada no admin (knowledge_base)
    let openrouterApiKey = process.env.OPENROUTER_API_KEY || '';
    let configuredModel = 'anthropic/claude-3.5-sonnet';

    try {
      const { data: credsData } = await supabaseAdmin
        .from('knowledge_base')
        .select('content')
        .contains('tags', ['admin', 'credentials'])
        .order('created_at', { ascending: false })
        .limit(1);

      if (credsData && credsData.length > 0) {
        const parsed = JSON.parse(credsData[0].content);
        if (parsed.openrouter_api_key && parsed.openrouter_api_key.trim().length > 0) {
          openrouterApiKey = parsed.openrouter_api_key.trim();
        }
        if (parsed.ai_default_model && parsed.ai_default_model.trim().length > 0) {
          configuredModel = parsed.ai_default_model.trim();
        }
      }
    } catch (dbErr) {
      console.warn('[AI Chat OpenRouter] Erro ao ler credenciais do banco:', dbErr);
    }

    if (!openrouterApiKey) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Nenhuma API Key da OpenRouter encontrada. Por favor, cadastre seu token em "Admin > Módulo de IA & Prompts" ou "Credenciais Master".',
          code: 'MISSING_OPENROUTER_KEY',
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

    // 3. Fazer requisição direta para a API da OpenRouter
    const openrouterResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${openrouterApiKey}`,
        'HTTP-Referer': 'https://swiftsail.com.br',
        'X-Title': 'Swiftsail Platform',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: configuredModel,
        messages: [
          {
            role: 'system',
            content: systemPrompt,
          },
          {
            role: 'user',
            content: pergunta,
          },
        ],
        temperature: 0.3,
        max_tokens: 1500,
      }),
    });

    if (!openrouterResponse.ok) {
      const errText = await openrouterResponse.text();
      console.error('[AI Chat] Erro retornado pela OpenRouter API:', openrouterResponse.status, errText);

      // Fallback para anthropic/claude-3.5-haiku se o modelo principal falhar
      if (configuredModel !== 'anthropic/claude-3.5-haiku') {
        try {
          const fallbackResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${openrouterApiKey}`,
              'HTTP-Referer': 'https://swiftsail.com.br',
              'X-Title': 'Swiftsail Platform',
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: 'anthropic/claude-3.5-haiku',
              messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: pergunta },
              ],
              temperature: 0.3,
              max_tokens: 1500,
            }),
          });

          if (fallbackResponse.ok) {
            const fallbackData = await fallbackResponse.json();
            const resposta = fallbackData.choices?.[0]?.message?.content || 'Sem resposta gerada.';
            return NextResponse.json({ success: true, resposta, modelUsed: 'anthropic/claude-3.5-haiku' });
          }
        } catch (fErr) {
          console.warn('[AI Chat] Fallback OpenRouter falhou:', fErr);
        }
      }

      return NextResponse.json(
        {
          success: false,
          error: `Erro na API da OpenRouter (${openrouterResponse.status}): ${errText}`,
        },
        { status: 502 }
      );
    }

    const aiData = await openrouterResponse.json();
    const resposta = aiData.choices?.[0]?.message?.content || 'Sem resposta gerada pelo modelo.';

    return NextResponse.json({
      success: true,
      resposta,
      modelUsed: configuredModel,
    });
  } catch (err: unknown) {
    console.error('[AI Chat] Erro inesperado:', err);
    const message = err instanceof Error ? err.message : 'Erro interno ao processar consulta de IA';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
