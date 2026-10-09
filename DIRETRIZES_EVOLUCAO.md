# Diretrizes de evolução da plataforma

> Documento de referência para toda alteração de interface, funcionalidade, integração, dados ou configuração da plataforma. O Antigravity deve consultá-lo antes de executar qualquer modificação.

**Versão:** 1.0  
**Criado em:** 2026-10-09  
**Responsável pela aprovação de mudanças neste documento:** proprietária da plataforma

## 1. Como usar este documento

Antes de iniciar qualquer modificação na plataforma, o Antigravity deve:

1. Ler este documento por completo e identificar os requisitos relacionados à tarefa.
2. Comparar a alteração proposta com as decisões registradas aqui.
3. Preservar tudo o que não estiver explicitamente marcado para remoção ou alteração. Não fazer mudanças de escopo, conteúdo ou visual por iniciativa própria.
4. Se houver conflito, ambiguidade, limitação técnica ou risco de afetar outros recursos, interromper a execução e apresentar a dúvida e a proposta à proprietária antes de prosseguir.
5. Após a execução, informar o que foi alterado, quais requisitos foram atendidos e como a alteração foi verificada.

Este arquivo é a referência vigente para o trabalho. Sugestões do Antigravity não alteram as diretrizes automaticamente: devem ser apresentadas à proprietária. Uma sugestão só pode ser incorporada a este documento após análise e aprovação expressa da proprietária.

## 2. Princípios gerais

- A plataforma deve ter somente duas hierarquias de acesso: **Admin** e **Cliente**.
- O Cliente só pode consultar os dados e as contas vinculados a ele.
- Sempre que um recurso estiver habilitado para o Cliente, sua visualização deve refletir a mesma experiência funcional disponível ao Admin, respeitando o escopo de dados e as permissões do Cliente.
- O Supabase é a fonte de consulta dos dados de Meta Ads e Asaas já disponibilizados no banco. Evitar criar telas ou integrações paralelas que dupliquem essas informações.
- Credenciais, tokens e segredos não devem ser expostos no navegador ou no código público da plataforma.
- Os rótulos **MANTER**, **REMOVER**, **AJUSTAR**, **MUDAR** e **CRIAR** indicam a decisão atual para cada item.

## 3. Área Admin

### 3.1 Menu lateral e configurações

- **REMOVER:** Dashboard Master.
- **MANTER:** Gestão de Clientes.
- **REMOVER:** Usuários e Convites da área Admin.
- **MANTER:** Credenciais Master Admin.
- **MANTER:** Uazapi e token Admin, armazenados e utilizados de forma segura.
- **REMOVER:** seção/tela de dados de Meta Ads; os dados já estão disponíveis no Supabase para consulta.
- **REMOVER:** seção/tela Financeiro Asaas; os dados estarão disponíveis no Supabase para consulta.
- **MANTER/CRIAR:** área de IA que permita à proprietária cadastrar seus tokens e escolher um modelo de linguagem (LLM) para cada funcionalidade da plataforma. Exemplos: geração de criativos de imagem, geração de criativos de vídeo e geração de landing pages.
- **CRIAR:** prompts de calibração específicos para cada modelo ou agente responsável por uma funcionalidade da plataforma. A configuração deve permitir identificar a qual funcionalidade cada prompt pertence.

### 3.2 Menu principal — Gestão de Clientes

- **REMOVER:** botão para adicionar novo cliente.
- **REMOVER:** seletor de dia.
- **MANTER:** galeria/lista de clientes ativos e inativos. A situação de inatividade deve refletir o status registrado no Supabase.
- **MANTER:** seletor de status.

## 4. Área Cliente

### 4.1 Menu lateral

Manter os seguintes módulos:

- Dashboard do Cliente.
- Tráfego e Anúncios, com as plataformas organizadas em um submenu.
- Hub WhatsApp API.
- Criativos e Landing Pages.
- Pipeline Kommo.
- Financeiro Asaas.

**MUDAR:** as configurações de integração e CRM para a área Admin, dentro de Credenciais. Essa configuração deve permitir selecionar o cliente ao qual a integração será vinculada e escolher quais pipelines serão contabilizados.

### 4.2 Dashboard do Cliente

- **MANTER:** Saúde CS.
- **REMOVER:** galeria de contas conectadas.
- **AJUSTAR:** seletor de datas para oferecer: **Ontem**, **Semana passada**, **Semana atual**, **Mês passado**, **Mês atual** e **Personalizar período**.

### 4.3 Tráfego e Anúncios

- As configurações de cada plataforma devem ficar no submenu correspondente do menu lateral.
- **MANTER:** filtro de campanhas por **Ativas**, **Todas** e **Pausadas**.
- **AJUSTAR:** visualização de campanha, conjunto de anúncios e criativo para ser clara e otimizada, acompanhando os padrões de navegação conhecidos do Google Ads e da Meta Ads.
- Exibir sempre uma prévia do criativo quando disponível.
- Apresentar métricas adequadas ao objetivo de cada campanha.
- No período selecionado, listar todas as campanhas que tiveram veiculação, mesmo que atualmente estejam pausadas ou inativas. Não exibir campanhas que não rodaram no período escolhido.
- **MANTER:** relatório de termos de pesquisa do Google Ads.

### 4.4 Hub WhatsApp API

- **CRIAR:** fluxo para conectar a Uazapi e criar uma instância para o cliente, com painel que mostre claramente o status da conexão.
- Após a conexão, disponibilizar, conforme autorizado e em conformidade com a legislação de privacidade e os termos aplicáveis:
  - recurso de coleta/importação de contatos de grupos;
  - envio em massa segmentado e controlado, com limites de frequência e salvaguardas para reduzir risco de bloqueios, sem prometer imunidade contra bloqueios;
  - dashboard de transmissões.
- **REMOVER:** telas ou módulos de Atendimento e Live Feed.

### 4.5 Criativos e Landing Pages

- **MANTER:** a funcionalidade e a apresentação atuais. Ajustes futuros serão definidos separadamente pela proprietária.

### 4.6 Pipeline Kommo

- **MANTER:** dashboard referente ao funil atualmente selecionado.
- **MANTER/AJUSTAR:** visualização do funil por etapas, com quantidades e percentuais de conversão provenientes dos dados do CRM no banco.
- **REMOVER:** mapeamento manual das etapas.
- **MANTER:** relatório de atribuição comercial e de mídia.
- Ao clicar em um número do relatório, abrir a lista de registros correspondente aos filtros daquele número.

### 4.7 Financeiro Asaas

- **MANTER:** apresentação atual.
- Os dados devem ser consultados no Supabase, que refletirá a fonte oficial de informação financeira.

## 5. Visualização e permissões do Cliente

O Cliente deve ter acesso somente à visualização dos dados e contas vinculados a ele. Os módulos disponíveis são:

- Tráfego e Anúncios.
- Hub WhatsApp.
- Criativos e Landing Pages.
- Pipeline.
- Financeiro.
- Convidar Membro.

Quando um desses módulos estiver habilitado, a interface e as funcionalidades devem corresponder às disponíveis para o Admin, respeitando as permissões e os dados daquele Cliente. Não criar uma terceira hierarquia de acesso: a plataforma deve manter apenas Admin e Cliente.

## 6. Revisões futuras e histórico de aprovação

Novas informações podem ser propostas pelo Antigravity, mas só passam a ser requisitos vigentes depois de analisadas e aprovadas pela proprietária da plataforma. Ao aprovar uma alteração, registrar abaixo a data, o conteúdo aprovado e, se necessário, a seção deste documento que foi atualizada.

| Data | Alteração aprovada pela proprietária | Seção atualizada |
|---|---|---|
| 2026-10-09 | Criação da primeira versão a partir das diretrizes fornecidas pela proprietária. | Todas |
