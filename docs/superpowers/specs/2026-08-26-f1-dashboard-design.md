# F1 Dashboard — Design MVP

**Data:** 2026-08-26
**Status:** Aprovado para planejamento de implementação

## 1. Objetivo

Construir uma dashboard pessoal de Fórmula 1 — classificação do campeonato, calendário,
resultados e informações de pilotos/construtores — publicável rapidamente e acessível
pelo celular. Evolução incremental: este documento cobre o MVP; uma aba "Ao Vivo" com
telemetria/timing em tempo real fica desenhada mas **desativada** nesta fase, para uma
fase 2.

### Fora de escopo do MVP
- Dados em tempo real durante sessões (FP1/2/3, Sprint, Qualy, Race).
- Autenticação/multi-usuário (é um projeto pessoal, uso single-user).
- Banco de dados (tudo é fetch-through-cache das APIs upstream).
- App nativo mobile (é um site responsivo).

## 2. Fontes de dados

| Fonte | Uso | Custo | Observações |
|---|---|---|---|
| [Jolpica-F1](https://github.com/jolpica/jolpica-f1) (`api.jolpi.ca/ergast/f1/`) | Fonte principal: standings, calendário, resultados de corrida/quali/sprint, pilotos/construtores | Grátis, sem auth | Sucessor drop-in do Ergast (descontinuado 2025). Cobre 1950–hoje. |
| [OpenF1](https://openf1.org/) (`api.openf1.org/v1`) | Enriquecimento opcional por corrida: lap times, pit stops, stints, clima | Grátis (tier "Community"), sem auth | Só dados **históricos** — bloqueado de 30min antes até 30min depois de cada sessão (janela "live" é paga, €9,90/mês, fora de escopo do MVP). Dados a partir de 2023. |

Ambas as APIs são públicas e sem chave — nenhuma variável de ambiente obrigatória no MVP.
CORS de nenhuma das duas está documentado/confirmado, por isso todo fetch passa pelo
backend (ver Arquitetura), eliminando esse risco.

## 3. Arquitetura

- **Next.js (App Router) + TypeScript**, estilizado com **Tailwind CSS**.
- **Deploy: Vercel** (free tier), a partir de um repositório GitHub. Push na branch
  principal → build e deploy automáticos, URL pública tipo `projeto.vercel.app`.
- **Sem banco de dados.** Rotas de servidor (`/app/api/...`) funcionam como
  backend-for-frontend: buscam nas APIs upstream, normalizam a resposta e cacheiam via
  `fetch` + `next: { revalidate }`. Janelas de revalidação por tipo de dado:
  - Standings / calendário / resultados de rounds já encerrados: **1 hora** (mudam pouco
    fora de fim de semana de corrida).
  - Próxima corrida / countdown / detecção de sessão ativa (seção 5): **1 minuto**
    (precisa refletir o horário real com pouco atraso).
  Isso evita estourar rate limit das APIs públicas e isola o frontend de qualquer
  instabilidade/mudança de formato upstream.
- Nenhuma variável de ambiente obrigatória hoje; estrutura já deixa espaço para uma
  futura `OPENF1_API_KEY` na fase 2 (live pago).

## 4. Páginas (IA de navegação)

| Rota | Conteúdo |
|---|---|
| `/` (Dashboard) | Resumo: top da classificação (pilotos + construtores), próxima corrida com contagem regressiva, últimos resultados. |
| `/classificacao` | Tabela completa de pilotos e construtores (pontos, vitórias, pódios). |
| `/calendario` | Temporada completa — rounds passados e futuros, datas/horários convertidos para o fuso do usuário. |
| `/resultados/[round]` | Grid de largada, resultado da corrida, resultado do quali, fastest lap; quando disponível, seção extra do OpenF1 (lap times, pit stops, stints, clima) daquela sessão já encerrada. |
| `/pilotos/[id]` | Perfil do piloto: equipe, pontos/posição na temporada, últimos resultados. |
| `/ao-vivo` | **Travada nesta fase** — ver seção 6. |

## 5. Identidade visual

Tema **dark**, com estética inspirada em telemetria/broadcast de F1 (painéis, HUD de
corrida), não um clone de nenhuma equipe específica.

- **Base:** fundo escuro (quase-preto, não preto puro) com texto claro; acentos em
  vermelho/cinza-metálico como cor de destaque neutra da marca do app (independente de
  equipe), reservando cor viva pra dado, não pra chrome da UI.
- **Cores de construtor:** cada equipe usa sua cor oficial da temporada corrente como
  acento contextual — barra lateral de linha em tabelas de resultado/standings, badge do
  nome da equipe no perfil do piloto, destaque no card do vencedor em `/resultados/[round]`.
  As cores ficam num mapa `equipe → hex` mantido no código (não vem de nenhuma API), a ser
  atualizado manualmente se alguma equipe rebrandar durante a temporada.
- **Tipografia:** a fonte oficial da F1 ("Formula1 Display/Wide") é licenciada pela
  Monotype e não está disponível pra uso livre/redistribuição — não vamos embutir a fonte
  proprietária. Em vez disso, usar **Titillium Web** (Google Fonts, grátis) como fonte
  principal: é a fonte que a própria F1 usa em várias peças oficiais e é a escolha comum
  em dashboards/fan projects de F1 por ter a mesma sensação técnica/condensada. Números
  (tempos de volta, posições, pontos) usam variante tabular/monoespaçada pra alinhar bem
  em tabela.
- Esse trabalho visual (paleta final, componentes, tabela de cores por construtor) é
  conduzido durante a implementação da UI usando a skill **`frontend-design`**, com esta
  seção como briefing de partida.

## 6. Aba "Ao Vivo" — desenhada, mas travada no MVP

Mesmo sem dado ao vivo real, a lógica de detecção de sessão ativa já é implementada
agora (é barata: usa datas de início/fim de sessão que já vêm do calendário/Jolpica),
para que a fase 2 só precise trocar o conteúdo interno, não a lógica de bloqueio.

- **Sem sessão ativa agora:** aba mostra "Sem sessão ao vivo no momento" + nome da
  próxima sessão agendada e contagem regressiva. Item de menu/conteúdo desabilitado
  visualmente (cinza).
- **Sessão ativa agora** (horário atual dentro de `date_start`–`date_end` de uma sessão
  do calendário): aba mostra "Ao vivo indisponível nesta versão — dados chegam ~30min
  após o fim da sessão", deixando claro que o bloqueio é uma decisão de escopo/custo, não
  um bug.
- **Fase 2 (fora de escopo aqui):** trocar o conteúdo do estado "sessão ativa" por dados
  reais, via OpenF1 Sponsor (pago, €9,90/mês) ou feed não-oficial de live timing da F1 —
  decisão a ser tomada quando essa fase for priorizada.

## 7. Tratamento de erros e estados vazios

- **API upstream fora do ar:** serve o último cache válido com aviso discreto de "dados
  podem estar desatualizados".
- **Sem conexão no celular:** mensagem simples de erro, sem crash da página.
- **Fora de temporada / calendário ainda não publicado:** estado vazio amigável (ex.:
  "temporada ainda não anunciada").
- **Corrida sem dado extra do OpenF1** (ex.: temporada anterior a 2023, ou falha pontual
  da API): a seção extra em `/resultados/[round]` simplesmente não aparece — não bloqueia
  o resto da página.

## 8. Mobile

- Layout **mobile-first** com Tailwind. No celular, navegação vira barra inferior ou
  menu hambúguer; no desktop, menu de topo/lateral.
- Sem app nativo — acesso via navegador do celular. Como melhoria simples (não bloqueia
  o MVP), inclui manifest de **PWA básico** (ícone + suporte a "adicionar à tela
  inicial") para uma sensação mais de app, sem esforço extra de infraestrutura.

## 9. Deploy

- Repositório no GitHub (público é aceitável — nenhum segredo no projeto).
- Import direto na Vercel (conta grátis, login via GitHub); deploy automático a cada
  push na branch principal.

## 10. Testes

- Sem suíte pesada no MVP (over-engineering para um dashboard pessoal nesta fase).
- Um teste unitário simples por rota de API do backend, validando que o
  parsing/normalização da resposta da Jolpica/OpenF1 não quebra contra um payload de
  exemplo (fixture) — proteção contra mudança de formato upstream.
- Validação do restante é manual: rodar local e checar em desktop e celular antes de
  cada deploy.

## 11. Decisões registradas (para referência futura)

- **Live data:** optou-se por não pagar OpenF1 Sponsor (€9,90/mês) nem implementar o
  feed não-oficial de live timing no MVP. Aba "Ao Vivo" fica desenhada porém travada.
- **Stack:** sem preferência prévia do usuário — recomendação adotada foi Next.js +
  TypeScript + Vercel, pela simplicidade de deploy e por eliminar o risco de CORS via
  backend-for-frontend.
- **Escopo de dados:** priorizar dados do campeonato atual e histórico via Jolpica;
  OpenF1 histórico como enriquecimento opcional, não crítico.
- **Identidade visual:** dark theme com cores de construtor como acento contextual;
  fonte **Titillium Web** (grátis) no lugar da fonte oficial da F1, que é licenciada e
  não pode ser embutida livremente. Implementação da UI conduzida com a skill
  `frontend-design`.
