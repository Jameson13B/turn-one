# Turn One — by Atomic10

A universal reference of quick manuals for tabletop games. Pick a game, get a fast
scannable guide: goal, setup, turn structure, the rules that matter, and the rules
everyone forgets. Built for the **returning player** — someone who played this eight
months ago and needs ninety seconds of reminder, not a forty-page rulebook.

Full design rationale: `docs/TDD.md`. Read it when a task touches architecture.
This file is the operating contract — the decisions, conventions, and guardrails.

## Stack — these are settled, not suggestions

- **Astro 5+**, static output (SSG). No SSR, no adapters.
- **Content is YAML files** in `src/content/games/`. One file per game. Filename = URL slug.
- **No database.** Git is the revision system. GitHub PRs are the moderation queue.
- **Validation**: Astro content collections + Zod in `src/content.config.ts`.
- **Styling**: Tailwind CSS v4 via `@tailwindcss/vite`.
- **Search**: Pagefind, indexed post-build from rendered HTML.
- **Hosting**: Netlify. Free tier. Deploy previews on for every PR.
- **Write path**: exactly one Netlify Function (`netlify/functions/submit-guide.ts`)
  that turns a form submission into a GitHub PR via a GitHub App.
- **No UI framework.** Interactivity is vanilla TS inside `.astro` components.
  There are four islands total. Do not add React/Preact/Svelte without asking.

## The Atomic10 format — the core of the product

Every guide is exactly these ten blocks, in this order. 1–8 required, 9–10 optional.

1. **Snapshot** — players, time, complexity 1–5, equipment, one-sentence premise
2. **Goal** — how you win. ≤200 chars, one sentence.
3. **Setup** — table state before turn one. ≤10 ordered steps.
4. **The Loop** — what happens on your turn. ≤8 ordered items.
5. **Key Rules** — 4–8 bullets, one rule each
6. **Ending & Scoring** — trigger sentence + scoring list
7. **Commonly Forgotten** — 2–6 bullets. *The block that makes the product.*
8. **Tips** — 2–6 bullets
9. **Variants** *(optional)* — labeled as variants, never as base rules
10. **Glossary** *(optional)* — term + ≤120 char definition

**Hard word budget: ~450 words of prose per guide.** Warn at 450, fail the build at 700.
This constraint is the product. Do not relax it to fit more content.

Two reading modes render from the same YAML:
- **Refresher** (default) — blocks 2, 4, 7, 6
- **The Teach** — all blocks, Setup expanded into a tickable checklist

## Conventions

- Guide files: `src/content/games/<slug>.yaml`, lowercase, hyphenated (`liars-dice.yaml`)
- Routes: `/g/[slug]` for guides, generated via `getStaticPaths()`
- Client directives: default to none. `client:idle` for search and shelf,
  `client:load` for the reading-mode toggle, `client:visible` for the setup checklist.
- Saved games feature is called **Shelf** (localStorage, no accounts)
- `aliases` in a guide file are first-class — populate aggressively so
  "Perudo" and "Dudo" both find Liar's Dice
- Every guide links to its official rulebook in the footer

## Guardrails — do not do these

- **Never paste rulebook text.** Guides are original prose. This is the legal basis
  for the whole project. Same for rulebook diagrams and publisher art.
- **No publisher cover images.** Generated category-colored tiles instead.
- **No database, no accounts, no auth.** If a feature seems to need one, say so
  rather than adding one.
- **Don't exceed the word budget** to make a guide more complete. Completeness is
  explicitly not a goal — every guide defers edge cases to the rulebook.
- **Don't use the BoardGameGeek API as a data source.** Outbound links only.
- **Tabletop only.** No video games, RPGs, sports, lawn games, or drinking games.
- English only for v1.

## Commands

```bash
npm run dev            # local dev server
npm run build          # static build to dist/
npm run preview        # serve the built output
npm run validate       # word budget + slug uniqueness check (CI gate)
```

## Where the build is

Currently: **M0 — Foundations.** Astro project, schema, CI validation, and three
hand-written guides (one board, one card, one dice) to pressure-test the ten-block
format before any authoring UI gets built.

Milestones after that: M1 read path · M2 search · M3 contribution pipeline ·
M4 offline/PWA · M5 content push and launch. Details in `docs/TDD.md` §9.

## License

Content is CC BY-SA 4.0. Contributors grant it at submission. Attribution is
carried by git history plus the `contributors` field in each guide file.
