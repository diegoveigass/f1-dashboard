# Acessibilidade/usabilidade — o que é clicável + navegação ativa

**Data:** 2026-09-05
**Status:** Aprovado, implementação em andamento

## 1. Objetivo

Dois problemas de UI/UX levantados pelo usuário:

1. **Não fica claro o que é clicável.** Em toda tabela/lista do app (Classificação,
   Calendário, Circuitos, Resultados, perfis de Piloto/Construtor), a `<tr>`/`<li>`
   inteira tem `hover:bg-surface-raised`, mas só o texto de um `<Link>` dentro dela
   navega — e esse link, em repouso, só se distingue de texto em negrito comum pela cor,
   que só muda no hover. O hover de fundo na linha inteira sugere uma área clicável maior
   do que a real.
2. **Navegação sem indicação de página atual.** [`Navigation.tsx`](../../../src/components/Navigation.tsx)
   só tem estilo de hover; nada marca em qual rota o usuário está.

### Fora de escopo
- Testes automatizados de componente React (o projeto não tem `testing-library`/jsdom
  configurado — só Vitest para `src/lib/*`; não é objetivo desta mudança introduzir esse
  tooling).
- Mudança de arquitetura de dados/rotas — é só CSS/markup e um componente virando Client
  Component.

## 2. Navegação ativa

`Navigation.tsx` vira Client Component (`"use client"`), usando `usePathname()` de
`next/navigation`.

- **Ativo** = `pathname === link.href`, com exceção de `/circuitos`, que também fica ativo
  em qualquer `/circuitos/[id]` (prefixo) — os outros links do nav (`/`, `/classificacao`,
  `/calendario`, `/ao-vivo`) não têm sub-rotas.
- Link ativo recebe `aria-current="page"` — leitor de tela anuncia a página atual.
- Visual: reaproveita o estilo que já existe só no hover, mas fixo:
  - Desktop (`md:`): `border-b-2 border-accent` permanente (hoje só em `md:hover:border-accent`)
    + texto na cor de destaque em vez de `text-muted`.
  - Mobile (menu fixo embaixo, sem conceito de borda inferior): traço fino **em cima** do
    item ativo (`border-t-2 border-accent`, já que o menu fica colado no rodapé) + texto na
    cor de destaque.
- Hover continua funcionando nos itens não ativos, exatamente como hoje.

## 3. Affordance de clique em listas/tabelas

Aplicado de forma consistente em todos os lugares com esse padrão: `classificacao`,
`calendario`, `circuitos`, `resultados/[round]` (via `RaceResultTable`), `pilotos/[id]`,
`construtores/[id]`.

Regra:

- **Linha/card com um único destino de navegação** (ex.: item da lista de `circuitos`,
  que só linka para `/circuitos/[id]`) → o `<li>`/card inteiro vira um `<Link>` de verdade
  envolvendo o conteúdo (não `div` + `onClick`), preservando navegação por teclado, "abrir
  em nova aba" e leitor de tela. O hover de fundo da linha passa a ser coerente: a área que
  destaca no hover é exatamente a área clicável.
- **Linha/card com 2+ destinos** (ex.: piloto e equipe na mesma linha de uma tabela; corrida
  e circuito no card do Calendário) → não dá pra aninhar `<Link>` dentro de `<Link>` nem
  fazer uma `<tr>` inteira ser um link (HTML inválido), então cada link individual ganha
  **sublinhado permanente** (`underline underline-offset-2`, com uma cor de sublinhado mais
  discreta em repouso e a cor de destaque no hover/foco), em vez de depender só da mudança
  de cor no hover. O hover de fundo na linha continua existindo, mas passa a servir só de
  apoio de leitura (padrão comum em tabelas densas), não mais como sinal de "isso é
  clicável".
- `focus-visible:outline` já existente é mantido em todos os links.

### Mapeamento por arquivo

| Arquivo | Padrão | Ação |
|---|---|---|
| [`circuitos/page.tsx`](../../../src/app/circuitos/page.tsx) | `<li>` com 1 destino (`/circuitos/[id]`) | `<li>` vira `<Link>` |
| [`calendario/page.tsx`](../../../src/app/calendario/page.tsx) | `<li>` com 2 destinos (corrida → `/resultados/[round]`, circuito → `/circuitos/[id]`) | sublinhado permanente nos 2 links |
| [`classificacao/page.tsx`](../../../src/app/classificacao/page.tsx) | `<tr>` com 2 destinos na tabela de pilotos (piloto → `/pilotos/[id]`, equipe → `/construtores/[id]`); `<tr>` com 1 destino na tabela de construtores | sublinhado nos 2 links da tabela de pilotos; `<tr>` de construtores também vira candidato a link único, mas mantém sublinhado por consistência com a tabela de pilotos ao lado (mesma varredura visual) |
| [`RaceResultTable.tsx`](../../../src/components/RaceResultTable.tsx) | `<tr>` com 1 destino (equipe → `/construtores/[id]`; nome do piloto não é link) | sublinhado no link de equipe |
| [`pilotos/[id]/page.tsx`](../../../src/app/pilotos/[id]/page.tsx) | `<tr>` com 1 destino (equipe) | sublinhado no link de equipe |
| [`construtores/[id]/page.tsx`](../../../src/app/construtores/[id]/page.tsx) | `<tr>` com 1 destino (piloto) | sublinhado no link de piloto |

Nas duas tabelas de `classificacao` optei por manter sublinhado (em vez de linha-inteira-link)
mesmo na tabela de construtores, que tecnicamente só tem 1 destino por linha — as duas
tabelas ficam lado a lado na mesma página e devem se comportar igual visualmente.

## 4. Verificação

- `npm run lint` e `npm run build`.
- Preview manual no navegador: nav ativa em cada rota (`/`, `/classificacao`, `/calendario`,
  `/circuitos` e `/circuitos/[id]`, `/ao-vivo`), hover de linha vs. sublinhado dos links,
  card de circuito inteiro clicável — com screenshots antes/depois.
