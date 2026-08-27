# f1-dashboard

Dashboard pessoal de Fórmula 1: classificação, calendário e resultados da temporada
atual, com uma aba "Ao Vivo" que detecta sessões em andamento (dado ao vivo real fica
para uma fase futura — ver `docs/superpowers/specs/2026-08-26-f1-dashboard-design.md`).

## Rodando localmente

```bash
npm install
npm run dev
```

Abra http://localhost:3000.

## Testes

```bash
npm test
```

## Deploy

1. Este repositório já está no GitHub (`diegoveigass/f1-dashboard`, branch `main`).
2. Em https://vercel.com, "Add New Project" → importe o repositório.
3. Nenhuma variável de ambiente é necessária — as APIs (Jolpica, OpenF1) são públicas.
4. Cada push na branch `main` gera um novo deploy automático.

## Fontes de dados

- [Jolpica-F1](https://github.com/jolpica/jolpica-f1) — classificação, calendário, resultados.
- [OpenF1](https://openf1.org/) — enriquecimento opcional (clima, pit stops) e agenda de sessões para a aba Ao Vivo.

## Documentação do projeto

- Spec de design: `docs/superpowers/specs/2026-08-26-f1-dashboard-design.md`
- Plano de implementação: `docs/superpowers/plans/2026-08-26-f1-dashboard-mvp.md`
