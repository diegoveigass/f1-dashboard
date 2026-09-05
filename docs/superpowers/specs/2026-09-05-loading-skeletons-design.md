# Skeleton screens de carregamento por rota

**Data:** 2026-09-05
**Status:** Aprovado, implementação em andamento

## 1. Objetivo

Ao navegar para uma página que ainda não fez o fetch dos dados (ex.: abrir o perfil de uma
equipe), o usuário via a página anterior "congelada" até o fetch terminar, sem indicação de
que algo está carregando. Padronizar um skeleton screen — instantâneo, sem esperar rede —
para toda página do app que busca dados no servidor antes de renderizar.

### Fora de escopo
- Streaming granular por seção dentro de uma página (cada tabela/lista aparecendo
  independente conforme fica pronta). As páginas já buscam seus dados via `Promise.all` no
  topo e renderizam tudo junto — não há hoje uma seção sensivelmente mais lenta que a outra
  que justifique quebrar cada página em sub-componentes assíncronos só para isso.
- Habilitar Cache Components/`dynamicIO` no `next.config.ts` — o projeto não usa hoje
  (confirmado: `next.config.ts` está vazio; `io()` em `calendario/page.tsx` já é código
  defensivo para se essa flag for ligada no futuro, e continua um no-op sem ela).
- Corrigir o fato de `resultados/[round]/page.tsx` buscar sprint/qualifying/pit stops em
  sequência (`await` um atrás do outro) em vez de em paralelo — é uma otimização de
  performance separada, não faz parte deste pedido.

## 2. Mecanismo

Um arquivo `loading.tsx` por pasta de rota (convenção nativa do App Router): o Next.js
embrulha automaticamente o `page.tsx` daquela pasta num `<Suspense>`, mostra o `loading.tsx`
como fallback **instantaneamente** (pré-buscado na navegação) e troca pelo conteúdo real
assim que o `page.tsx` (Server Component `async`) termina de buscar os dados. Zero JavaScript
de cliente — os componentes de skeleton são Server Components como qualquer outro.

## 3. Componentes de skeleton

Novo arquivo `src/components/Skeleton.tsx` (segue o padrão flat já usado em
`src/components/` — sem subpastas):

- **`SkeletonBlock`** — bloco base: `<div className="animate-pulse rounded bg-line ..." />`.
  `animate-pulse` é o utilitário do Tailwind; a regra `@media (prefers-reduced-motion:
  reduce)` já existente em `globals.css` zera a duração de toda animação no site, então isso
  já herda esse respeito à preferência de acessibilidade sem código extra.
- **`SkeletonTableRows`** — recebe `columns`/`rows`; gera `<tr>`/`<td>` com as mesmas classes
  de moldura das tabelas reais (`border-l-4 border-line bg-surface`, `px-3 py-2.5`), um
  `SkeletonBlock` por célula.
- **`SkeletonCards`** — recebe `count`; gera divs no formato dos cards de lista
  (`border-l-4 border-line bg-surface p-4`), com 2 `SkeletonBlock` (título + subtítulo) cada.
- **`SkeletonProfileHeader`** — cabeçalho de página de perfil: bloco pequeno (eyebrow) +
  bloco grande (nome) no lugar do `section-label`/`h1` reais, já que esse texto só existe
  depois do fetch.

**Regra geral:** texto que já é conhecido antes do fetch (título da página, cabeçalho de
coluna de tabela, labels de seção como "Pilotos"/"Construtores") é renderizado de verdade no
`loading.tsx`, não vira skeleton — só o que depende do dado buscado vira bloco cinza. Isso
segue a orientação do próprio Next.js de maximizar o "static shell" e evita jump visual
maior que o necessário na troca skeleton → conteúdo real.

## 4. Mapeamento por rota

| Rota (`loading.tsx` novo em) | Conteúdo do skeleton |
|---|---|
| `src/app/loading.tsx` | Hero real (h1 "Painel do Campeonato" + 5 pontinhos) + skeleton na linha "próxima corrida" + 2× `SkeletonCards` (5 linhas cada, Top 5 pilotos/construtores) |
| `src/app/classificacao/loading.tsx` | Título real + cabeçalhos de coluna reais + `SkeletonTableRows` 20 linhas (pilotos) + 10 linhas (construtores) |
| `src/app/calendario/loading.tsx` | Título real + `SkeletonCards` (6 cards) |
| `src/app/circuitos/loading.tsx` | Título real + `SkeletonCards` (6 cards) |
| `src/app/circuitos/[id]/loading.tsx` | `SkeletonProfileHeader` + 3× `SkeletonCards` (temporada/localização/wikipedia) |
| `src/app/pilotos/[id]/loading.tsx` | `SkeletonProfileHeader` + cabeçalhos de coluna reais + `SkeletonTableRows` (8 linhas) |
| `src/app/construtores/[id]/loading.tsx` | `SkeletonProfileHeader` + cabeçalhos de coluna reais + `SkeletonTableRows` (8 linhas) |
| `src/app/resultados/[round]/loading.tsx` | Skeleton no lugar do "Round NN — nome da corrida" (depende do fetch) + cabeçalhos de coluna reais + `SkeletonTableRows` 20 linhas (resultado da corrida) |
| `src/app/ao-vivo/loading.tsx` | Título real ("Ao Vivo") + 1× `SkeletonCards` (formato do banner de status) |

Contagens de linha/card são estimativas fixas razoáveis (20 pilotos e 10 equipes são
constantes da F1 atual; 6 cards e 8 linhas nas demais são "o suficiente para preencher a
primeira tela"), não o número real — que só se sabe depois do fetch.

**Limitação aceita:** `resultados/[round]` tem seções condicionais (Sprint, Qualifying,
clima, pit stops) que só existem se aquela corrida teve — não dá pra prever no skeleton sem
buscar esse dado antes (o que anularia o ganho de instantaneidade). O skeleton cobre só a
seção sempre presente (resultado da corrida); quando as condicionais aparecem, há um
reajuste de layout — aceito, não é regressão em relação ao comportamento atual (hoje não há
skeleton nenhum).

## 5. Verificação

- `npm run lint` e `npm run build`.
- Preview manual: throttling de rede (ou um pequeno delay artificial temporário) pra
  confirmar que cada skeleton aparece e casa com o formato da página real, sem salto de
  layout perceptível na troca — com screenshots do skeleton de pelo menos 2-3 páginas
  representativas (tabela, lista de cards, perfil).
