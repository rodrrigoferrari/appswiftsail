export interface ModelOption {
  id: string;
  name: string;
  badge: string;
  description: string;
  provider: string;
  isSpecialized?: boolean;
}

export interface ModelGroup {
  groupName: string;
  icon?: string;
  models: ModelOption[];
}

export interface CategoryCatalog {
  categoryId: string;
  categoryLabel: string;
  description: string;
  groups: ModelGroup[];
  recommendedModels: ModelOption[];
}

export const CATEGORY_AI_CATALOG: Record<string, CategoryCatalog> = {
  // ==========================================
  // 1. VÍDEO & ROTEIROS DINÂMICOS
  // ==========================================
  creative_video: {
    categoryId: 'creative_video',
    categoryLabel: 'Vídeo, Avatares & Roteiros',
    description: 'Motores para criação de vídeos com IA, avatares falantes, lipsync, roteiros de retenção e ganchos de 3s.',
    recommendedModels: [
      {
        id: 'heygen/interactive-avatar',
        name: 'HeyGen 4.0 Interactive Avatar',
        badge: 'Top 1 Avatar',
        description: 'Avatares fotorrealistas ultra-expressivos com lipsync perfeito e suporte multilíngue.',
        provider: 'HeyGen',
        isSpecialized: true,
      },
      {
        id: 'runway/gen-3-alpha-turbo',
        name: 'Runway Gen-3 Alpha Turbo',
        badge: 'Top 1 Cinemático',
        description: 'Geração de vídeo cinemático em alta definição com controle refinado de câmera e física.',
        provider: 'RunwayML',
        isSpecialized: true,
      },
      {
        id: 'kling/kling-v1.5-pro',
        name: 'Kling AI v1.5 Pro',
        badge: 'Hiper-Realismo',
        description: 'Movimentos complexos e consistência visual de pessoas reais em cenas dinâmicas.',
        provider: 'Kuaishou',
        isSpecialized: true,
      },
      {
        id: 'anthropic/claude-3.5-sonnet',
        name: 'Claude 3.5 Sonnet',
        badge: 'Top 1 Roteiro',
        description: 'Especialista em retenção e criação de ganchos (hooks) de 3 segundos para TikTok e Reels.',
        provider: 'Anthropic',
      },
      {
        id: 'openai/gpt-4o',
        name: 'GPT-4o (Video Prompts & Scripts)',
        badge: 'Storytelling',
        description: 'Roteiros de alta conversão, linguagem coloquial viral e prompts estruturados para geradores.',
        provider: 'OpenAI',
      },
    ],
    groups: [
      {
        groupName: '🎬 Geradores de Vídeo, Avatares IA & Lipsync',
        models: [
          {
            id: 'heygen/interactive-avatar',
            name: 'HeyGen 4.0 Interactive Avatar (Avatares IA Realistas)',
            badge: 'HeyGen',
            description: 'Avatares de alta definição para apresentações, vendas e VSLs.',
            provider: 'HeyGen',
            isSpecialized: true,
          },
          {
            id: 'heygen/video-translate',
            name: 'HeyGen Video Translate & Clone (Dublagem & Voz)',
            badge: 'HeyGen',
            description: 'Tradução de vídeo com sincronia labial e clonagem tonal da voz original.',
            provider: 'HeyGen',
            isSpecialized: true,
          },
          {
            id: 'runway/gen-3-alpha-turbo',
            name: 'Runway Gen-3 Alpha Turbo (Vídeo Cinemático)',
            badge: 'Runway',
            description: 'Movimento de câmera e iluminação de cinema para B-Rolls.',
            provider: 'RunwayML',
            isSpecialized: true,
          },
          {
            id: 'kling/kling-v1.5-pro',
            name: 'Kling AI v1.5 Pro (Física & Movimento Fluido)',
            badge: 'Kling AI',
            description: 'Geração de vídeo de alta fidelidade sem deformações anatômicas.',
            provider: 'Kuaishou',
            isSpecialized: true,
          },
          {
            id: 'luma/dream-machine-v1.5',
            name: 'Luma Dream Machine 1.5 (Dinâmica 3D Rápida)',
            badge: 'Luma',
            description: 'Câmeras imersivas e transições tridimensionais suaves.',
            provider: 'Luma AI',
            isSpecialized: true,
          },
          {
            id: 'openai/sora',
            name: 'OpenAI Sora Turbo (Fotorrealismo Extremo)',
            badge: 'Sora',
            description: 'Geração avançada de vídeo com compreensão profunda do mundo físico.',
            provider: 'OpenAI',
            isSpecialized: true,
          },
          {
            id: 'pika/pika-2.1',
            name: 'Pika 2.1 (Efeitos Especiais & Animação)',
            badge: 'Pika',
            description: 'Efeitos virais de morphing, inflar, derreter e explosão.',
            provider: 'Pika Labs',
            isSpecialized: true,
          },
          {
            id: 'minimax/video-01',
            name: 'MiniMax Hailuo Video-01 (Expressões Faciais Humanas)',
            badge: 'MiniMax',
            description: 'Renderização de rostos e emoções humanas de altíssima qualidade.',
            provider: 'MiniMax',
            isSpecialized: true,
          },
        ],
      },
      {
        groupName: '🎙️ Áudio Neural & Locução para Vídeo',
        models: [
          {
            id: 'elevenlabs/multilingual-v2',
            name: 'ElevenLabs Voice AI (Locução Emocional & Clonagem)',
            badge: 'ElevenLabs',
            description: 'Vozes ultra-humanas com entonação de venda e ritmo perfeito.',
            provider: 'ElevenLabs',
            isSpecialized: true,
          },
        ],
      },
      {
        groupName: '📝 Roteiro, Ganchos de 3s & Retenção de Vídeo',
        models: [
          {
            id: 'anthropic/claude-3.5-sonnet',
            name: 'Claude 3.5 Sonnet (Roteirista Sênior & Retenção)',
            badge: 'Recomendado',
            description: 'Scripts estruturados em Hook (0-3s), Problema, Solução e CTA.',
            provider: 'Anthropic',
          },
          {
            id: 'openai/gpt-4o',
            name: 'GPT-4o (Storytelling Viral & Diálogos)',
            badge: 'Multimodal',
            description: 'Roteiros persuasivos e prompts cinemáticos prontos.',
            provider: 'OpenAI',
          },
          {
            id: 'deepseek/deepseek-r1',
            name: 'DeepSeek R1 (Raciocínio Narrativo & VSLs Longas)',
            badge: 'R1',
            description: 'Estruturação lógica de arcos dramáticos e quebra de objeções em vídeo.',
            provider: 'DeepSeek',
          },
          {
            id: 'google/gemini-2.0-flash-001',
            name: 'Gemini 2.0 Flash (Geração Rápida de Múltiplos Hooks)',
            badge: 'Velocidade',
            description: 'Ideal para gerar rapidamente 20+ variações de ganchos de vídeo.',
            provider: 'Google',
          },
          {
            id: 'meta-llama/llama-3.3-70b-instruct',
            name: 'Llama 3.3 70B Instruct (Roteiros em Alto Volume)',
            badge: 'Open Source',
            description: 'Roteirização confiável e padronizada para equipes de escala.',
            provider: 'Meta',
          },
        ],
      },
    ],
  },

  // ==========================================
  // 2. FOTO & CRIATIVOS DE IMAGEM
  // ==========================================
  creative_image: {
    categoryId: 'creative_image',
    categoryLabel: 'Foto, Design & Banners',
    description: 'Motores de geração e renderização de imagens, direção de arte, briefings visuais e banners publicitários.',
    recommendedModels: [
      {
        id: 'black-forest-labs/flux-1-pro',
        name: 'FLUX.1 Pro (BFL)',
        badge: 'Top 1 Fotorrealismo',
        description: 'Qualidade máxima de detalhes, texturas de pele, iluminação de estúdio e tipografia correta.',
        provider: 'Black Forest Labs',
        isSpecialized: true,
      },
      {
        id: 'midjourney/v6.1',
        name: 'Midjourney v6.1',
        badge: 'Top 1 Publicitário',
        description: 'Estética artística e publicitária inigualável para campanhas de moda, produto e branding.',
        provider: 'Midjourney',
        isSpecialized: true,
      },
      {
        id: 'ideogram/ideogram-v2',
        name: 'Ideogram 2.0',
        badge: 'Tipografia & Banners',
        description: 'Renderização perfeita de títulos e textos dentro de anúncios gráficos.',
        provider: 'Ideogram',
        isSpecialized: true,
      },
      {
        id: 'recraft/recraft-v3',
        name: 'Recraft V3',
        badge: 'Vetor & Design',
        description: 'Geração de ilustrações vetoriais, 3D, ícones e assets de marketing em marca padronizada.',
        provider: 'Recraft',
        isSpecialized: true,
      },
      {
        id: 'openai/gpt-4o',
        name: 'GPT-4o (Direção de Arte & Visão)',
        badge: 'Top 1 Direção',
        description: 'Audita criativos existentes, analisa contrastes e elabora briefings fotográficos precisos.',
        provider: 'OpenAI',
      },
    ],
    groups: [
      {
        groupName: '🎨 Geradores & Renderizadores de Imagem IA',
        models: [
          {
            id: 'black-forest-labs/flux-1-pro',
            name: 'FLUX.1 Pro (BFL - Detalhes Extremos & Tipografia)',
            badge: 'FLUX Pro',
            description: 'O modelo de imagem de maior fidelidade do mercado atual.',
            provider: 'Black Forest Labs',
            isSpecialized: true,
          },
          {
            id: 'black-forest-labs/flux-1-dev',
            name: 'FLUX.1 Dev (Open Weights - Alta Versatilidade)',
            badge: 'FLUX Dev',
            description: 'Excelente para fotografia de produtos e anúncios realistas.',
            provider: 'Black Forest Labs',
            isSpecialized: true,
          },
          {
            id: 'midjourney/v6.1',
            name: 'Midjourney v6.1 (Estética Publicitária & Iluminação)',
            badge: 'Midjourney',
            description: 'Composições visuais ricas e texturas refinadas para anúncios.',
            provider: 'Midjourney',
            isSpecialized: true,
          },
          {
            id: 'ideogram/ideogram-v2',
            name: 'Ideogram 2.0 (Textos & Tipografia em Anúncios)',
            badge: 'Ideogram',
            description: 'Sem borrões ou letras trocadas em selos e chamadas de banners.',
            provider: 'Ideogram',
            isSpecialized: true,
          },
          {
            id: 'recraft/recraft-v3',
            name: 'Recraft V3 (Design Gráfico, Vetor & 3D)',
            badge: 'Recraft',
            description: 'Ideal para designers que precisam de elementos vetoriais e 3D limpos.',
            provider: 'Recraft',
            isSpecialized: true,
          },
          {
            id: 'openai/dall-e-3',
            name: 'DALL·E 3 (Consistência com Prompts Descritivos)',
            badge: 'DALL-E 3',
            description: 'Fidelidade semântica a prompts complexos da OpenAI.',
            provider: 'OpenAI',
            isSpecialized: true,
          },
          {
            id: 'stabilityai/stable-diffusion-3.5-large',
            name: 'Stable Diffusion 3.5 Large (Controle Artístico)',
            badge: 'SD 3.5',
            description: 'Modelo de 8B parâmetros com grande aderência artística.',
            provider: 'Stability AI',
            isSpecialized: true,
          },
        ],
      },
      {
        groupName: '💡 Direção de Arte, Visão Multimodal & Prompt Engineering',
        models: [
          {
            id: 'openai/gpt-4o',
            name: 'GPT-4o (Visão Multimodal & Auditoria de Criativos)',
            badge: 'Recomendado',
            description: 'Audita e gera conceitos visuais com base em regras de contraste.',
            provider: 'OpenAI',
          },
          {
            id: 'anthropic/claude-3.5-sonnet',
            name: 'Claude 3.5 Sonnet (Briefings Detalhados & Teoria das Cores)',
            badge: 'Direção de Arte',
            description: 'Briefings conceituais hiperdetalhados para equipe de design.',
            provider: 'Anthropic',
          },
          {
            id: 'google/gemini-2.0-flash-001',
            name: 'Gemini 2.0 Flash (Geração Rápida de Prompts)',
            badge: 'Velocidade',
            description: 'Gera dezenas de variações de prompts para Midjourney e Flux em segundos.',
            provider: 'Google',
          },
          {
            id: 'deepseek/deepseek-chat',
            name: 'DeepSeek V3 (Ideação de Criativos Econômica)',
            badge: 'Econômico',
            description: 'Custo ultra acessível para geração em massa de conceitos.',
            provider: 'DeepSeek',
          },
        ],
      },
    ],
  },

  // ==========================================
  // 3. SITE & LANDING PAGES (CRO)
  // ==========================================
  landing_pages: {
    categoryId: 'landing_pages',
    categoryLabel: 'Site, Landing Pages & CRO',
    description: 'Motores para desenvolvimento de landing pages, arquitetura de conversão, código frontend e copy persuasiva.',
    recommendedModels: [
      {
        id: 'anthropic/claude-3.7-sonnet',
        name: 'Claude 3.7 Sonnet (Hybrid Reasoning)',
        badge: 'Top 1 Web & Código',
        description: 'Modelo de ponta com raciocínio híbrido para estruturar páginas de alta complexidade e código limpo.',
        provider: 'Anthropic',
      },
      {
        id: 'anthropic/claude-3.5-sonnet',
        name: 'Claude 3.5 Sonnet',
        badge: 'Top 1 Copy CRO',
        description: 'A maior referência global em escrita persuasiva, UVPs magnéticas e arquitetura de conversão.',
        provider: 'Anthropic',
      },
      {
        id: 'openai/o3-mini',
        name: 'OpenAI o3-mini (High Coding)',
        badge: 'Código Frontend',
        description: 'Raciocínio rápido especializado em HTML5, Tailwind CSS e componentes modernos de LP.',
        provider: 'OpenAI',
      },
      {
        id: 'openai/gpt-4o',
        name: 'GPT-4o (Headlines & Ofertas)',
        badge: 'Headlines',
        description: 'Criação ágil de promessas de valor, títulos impactantes e ganchos de captura.',
        provider: 'OpenAI',
      },
      {
        id: 'deepseek/deepseek-chat',
        name: 'DeepSeek V3 (Copy & Código Web)',
        badge: 'Custo-Benefício',
        description: 'Excelente escrita em português natural e componentes web prontos com custo irrisório.',
        provider: 'DeepSeek',
      },
    ],
    groups: [
      {
        groupName: '🌐 Motores de Estrutura Web, Código & UX de Conversão',
        models: [
          {
            id: 'anthropic/claude-3.7-sonnet',
            name: 'Claude 3.7 Sonnet (Raciocínio Híbrido & Engenharia Web)',
            badge: 'Novo 3.7',
            description: 'Capacidade superior de pensar antes de responder e gerar código perfeito.',
            provider: 'Anthropic',
          },
          {
            id: 'anthropic/claude-3.5-sonnet',
            name: 'Claude 3.5 Sonnet (Arquitetura de Conversão & UX)',
            badge: 'Recomendado',
            description: 'Organiza a jornada do lead da primeira dobra ao formulário.',
            provider: 'Anthropic',
          },
          {
            id: 'openai/o3-mini',
            name: 'OpenAI o3-mini (Especialista em Código & Tailwind)',
            badge: 'o3-mini',
            description: 'Raciocínio lógico focado em estruturas técnicas e responsividade.',
            provider: 'OpenAI',
          },
          {
            id: 'qwen/qwen-2.5-coder-32b-instruct',
            name: 'Qwen 2.5 Coder 32B (Especialista em Páginas & Web)',
            badge: 'Coder',
            description: 'Modelo open-weights de alta proficiência em desenvolvimento frontend.',
            provider: 'Alibaba Cloud',
          },
          {
            id: 'deepseek/deepseek-chat',
            name: 'DeepSeek V3 (Componentes HTML/CSS & Seções)',
            badge: 'DeepSeek V3',
            description: 'Gera seções completas de captura, depoimentos e tabelas de preço.',
            provider: 'DeepSeek',
          },
        ],
      },
      {
        groupName: '✍️ Copywriting Persuasivo, Headlines & Ofertas de Conversão',
        models: [
          {
            id: 'openai/gpt-4o',
            name: 'GPT-4o (Headlines Magnéticas & UVPs)',
            badge: 'Headlines',
            description: 'Focado em proposta única de valor e quebra de objeções instantânea.',
            provider: 'OpenAI',
          },
          {
            id: 'deepseek/deepseek-r1',
            name: 'DeepSeek R1 (Quebra Lógica de Objeções & FAQ)',
            badge: 'R1',
            description: 'Raciocínio profundo para desmontar qualquer hesitação de compra do lead.',
            provider: 'DeepSeek',
          },
          {
            id: 'meta-llama/llama-3.3-70b-instruct',
            name: 'Llama 3.3 70B Instruct (Frameworks AIDA & PAS)',
            badge: 'Llama 3.3',
            description: 'Adesão rigorosa a estruturas consagradas de copy em português.',
            provider: 'Meta',
          },
        ],
      },
    ],
  },

  // ==========================================
  // 4. BI & ANÁLISE DE TRÁFEGO (SINAPSE)
  // ==========================================
  campaign_analysis: {
    categoryId: 'campaign_analysis',
    categoryLabel: 'BI, Mídia Paga & Análise de Dados',
    description: 'Motores para auditoria de tráfego (Meta & Google Ads), correlação de métricas, cálculo de CPA/ROAS e BI.',
    recommendedModels: [
      {
        id: 'anthropic/claude-3.5-sonnet',
        name: 'Claude 3.5 Sonnet',
        badge: 'Top 1 BI & Tráfego',
        description: 'Precisão matemática cirúrgica em CPA/ROAS, zero alucinação com métricas reais e diagnósticos frios.',
        provider: 'Anthropic',
      },
      {
        id: 'deepseek/deepseek-r1',
        name: 'DeepSeek R1',
        badge: 'Raciocínio Profundo',
        description: 'Cadeia de pensamento analítica superior para descobrir gargalos ocultos no funil de vendas.',
        provider: 'DeepSeek',
      },
      {
        id: 'openai/o1',
        name: 'OpenAI o1',
        badge: 'Lógica Pura',
        description: 'Raciocínio dedutivo avançado para análise multivariável de dados de tráfego.',
        provider: 'OpenAI',
      },
      {
        id: 'openai/gpt-4o',
        name: 'GPT-4o',
        badge: 'Síntese Executiva',
        description: 'Síntese executiva dinâmica para tomadores de decisão e donos de negócio.',
        provider: 'OpenAI',
      },
      {
        id: 'google/gemini-pro-1.5',
        name: 'Gemini 1.5 Pro (2M Tokens)',
        badge: 'Histórico Longo',
        description: 'Janela de contexto gigantesca capaz de auditar meses de relatórios de uma só vez.',
        provider: 'Google',
      },
    ],
    groups: [
      {
        groupName: '📊 Motores Analíticos & Raciocínio Matemático Puro',
        models: [
          {
            id: 'anthropic/claude-3.5-sonnet',
            name: 'Claude 3.5 Sonnet (Auditoria de Métricas CPA/ROAS)',
            badge: 'Recomendado',
            description: 'Zero alucinação numérica, rigor analítico e recomendações práticas de verba.',
            provider: 'Anthropic',
          },
          {
            id: 'deepseek/deepseek-r1',
            name: 'DeepSeek R1 (Diagnóstico Profundo de Gargalos)',
            badge: 'R1',
            description: 'Identifica discrepâncias entre clique, lead e venda no CRM.',
            provider: 'DeepSeek',
          },
          {
            id: 'openai/o1',
            name: 'OpenAI o1 (Raciocínio Dedutivo de Alto Nível)',
            badge: 'o1',
            description: 'Para problemas complexos de atribuição e otimização de verba.',
            provider: 'OpenAI',
          },
          {
            id: 'openai/o3-mini',
            name: 'OpenAI o3-mini (Análise Rápida de Dados Tabulares)',
            badge: 'o3-mini',
            description: 'Velocidade e precisão matemática em tabelas de campanhas.',
            provider: 'OpenAI',
          },
          {
            id: 'google/gemini-pro-1.5',
            name: 'Gemini 1.5 Pro (Janela de 2M Tokens)',
            badge: '2M Tokens',
            description: 'Analisa centenas de milhares de linhas de histórico sem truncamento.',
            provider: 'Google',
          },
        ],
      },
      {
        groupName: '💼 Síntese Executiva & Relatórios para Clientes',
        models: [
          {
            id: 'openai/gpt-4o',
            name: 'GPT-4o (Relatórios Executivos & Resumos de BI)',
            badge: 'Multimodal',
            description: 'Explicações claras em linguagem executiva para clientes e diretores.',
            provider: 'OpenAI',
          },
          {
            id: 'google/gemini-2.0-flash-001',
            name: 'Gemini 2.0 Flash (Alertas Instantâneos Diários)',
            badge: 'Flash',
            description: 'Respostas em milissegundos para checagens frequentes de status.',
            provider: 'Google',
          },
          {
            id: 'perplexity/sonar-pro',
            name: 'Perplexity Sonar Pro (Análise com Benchmarks Web)',
            badge: 'Search',
            description: 'Cruza métricas do cliente com referências e tendências atuais de mercado.',
            provider: 'Perplexity',
          },
        ],
      },
    ],
  },
};

export function getCategoryCatalog(categoryId: string): CategoryCatalog {
  return (
    CATEGORY_AI_CATALOG[categoryId] ||
    CATEGORY_AI_CATALOG.campaign_analysis
  );
}
