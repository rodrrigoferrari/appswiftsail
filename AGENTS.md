<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Instruções de Governança — Plataforma Swiftsail

> **FONTE DA VERDADE SOBERANA:** Antes de realizar qualquer alteração nesta base de código, consulte obrigatoriamente:
> - [`DIRETRIZES_EVOLUCAO.md`](./DIRETRIZES_EVOLUCAO.md)
> - [`.agents/rules/diretrizes-de-evolucao.md`](./.agents/rules/diretrizes-de-evolucao.md)
> - [`ASAAS_DESIGN_SYSTEM.md`](./ASAAS_DESIGN_SYSTEM.md)

## Regras Fundamentais da Plataforma:
1. **Apenas 2 Hierarquias de Acesso:** Admin e Cliente. Não criar uma terceira hierarquia.
2. **Consultar o documento de diretrizes** antes de qualquer modificação de interface, funcionalidade, integração ou banco.
3. **Preservar tudo que não estiver marcado explicitamente para remoção ou alteração.** Não fazer mudanças de escopo, layout ou visual por iniciativa própria.
4. **Supabase é a fonte oficial** de dados para Meta Ads e Asaas. Não duplicar telas ou integrações desnecessariamente.
5. **Design System Asaas Light Fintech:** Manter consistência com a paleta oficial (fundo `#F8FAFC`, cards brancos com borda `#E2E8F0`, azul Asaas `#0050FF`, textos em `#0F172A`/`#64748B`), sem fundos escuros/cyberpunk ou textos brancos invisíveis.
