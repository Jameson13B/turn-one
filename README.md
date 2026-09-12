# Turn One

**by Atomic10**

Quick manuals for tabletop games. Pick a game, get a fast scannable guide: goal, setup,
turn structure, the rules that matter, and the rules everyone forgets.

Built for the returning player — someone who played this eight months ago, is setting it
up now, and needs ninety seconds of reminder rather than a forty-page rulebook.

## Getting started

```bash
npm install
npm run dev        # http://localhost:4321
```

Other commands:

```bash
npm run build      # static build to dist/, then builds the Pagefind index
npm run preview    # serve the built output
npm run validate   # word budget + slug uniqueness (CI gate)
npm run check      # astro check / typescript
```

## How it works

There is no database. Every guide is a YAML file in `src/content/games/`, validated
against a Zod schema at build time, and rendered to static HTML. Git is the revision
system; GitHub pull requests are the moderation queue.

```
src/
  content.config.ts       schema — the single source of truth for a guide's shape
  content/games/*.yaml    one file per game, filename = URL slug
  pages/g/[slug].astro    generates one page per game via getStaticPaths()
  layouts/, components/
scripts/
  validate-content.mjs    word budget + slug uniqueness
docs/
  TDD.md                  full design document and rationale
CLAUDE.md                 operating contract for AI-assisted work in this repo
```

## Adding a game

See [CONTRIBUTING.md](CONTRIBUTING.md). The short version: copy an existing YAML file,
keep it under 450 words of prose, write in your own words, and open a pull request.

## Status

**M0 — Foundations.** Schema, validation, and three hand-written guides exist. Search,
the contribution form, and offline support come next. Roadmap in `docs/TDD.md` §9.

## License

Guide content is licensed [CC BY-SA 4.0](LICENSE). Site code is MIT.
