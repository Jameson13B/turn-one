# Turn One by Atomic10 — Technical Design Document

**Version** 0.3 (all decisions closed)
**Date** September 12, 2026
**Author** Claude, for Jameson
**Status** Ready to build
**Supersedes** v0.1, "Atomic10 Quick Manual" (React SPA + Supabase), September 10

---

## 0. What changed since v0.1, and why

Two things changed. The product is now called **Turn One by Atomic10** — the name points at the moment the guide has to deliver by, and Atomic10 becomes the house name that the ten-block format keeps.

The larger change is architectural. v0.1 specced a React single-page app backed by a Supabase Postgres database; this version replaces both. Content now lives as **files in a git repository**, the site is **statically generated with Astro**, and there is **no database anywhere**.

The change came from a simple observation: this product's data is a slowly-changing corpus of text that everyone reads and almost nobody writes. That's a content repository, not an application database. Once you accept that framing, an unreasonable amount of the v0.1 design turns out to be machinery for solving problems git and a static host solve for free.

What this buys, concretely:

| v0.1 problem | v0.2 resolution |
|---|---|
| SPA invisible to crawlers — the highest-severity risk in v0.1 | Every guide is pre-rendered HTML at a real URL. Risk eliminated, not mitigated. |
| Revision history, diffs, revert, attribution (~1 table + UI) | Git does all of it, natively |
| Moderation queue with priority sort and diff view (~2 weeks, M4) | GitHub pull requests, plus a rendered deploy preview per PR |
| RLS policies as the security boundary — the easiest thing to get catastrophically wrong | No database, no anon key, no RLS. Attack surface is one write endpoint. |
| Hosting cost scaling with reads | Static files on a CDN. Free at any realistic traffic level. |
| Contributor content locked in someone's Postgres | A public git repo — the most portable home a CC BY-SA corpus can have |

What it costs: contributions arrive through pull requests rather than a database write, publishing is a build rather than an insert, and the contributor pool skews technical unless we bridge it. §6 is about that bridge, and it's the main piece of real engineering left in the plan.

**Net effect:** roughly 40% of v0.1's engineering is deleted, and the highest risk goes with it.

---

## 1. Overview

### 1.1 The product

**Turn One** — the product — is published by **Atomic10**, the umbrella name. The name states the deadline: whether you played this game last month or have never opened the box, you need to know enough by turn one. The ten-block structure that gets you there keeps the house name, the *Atomic10 format* (§4), so brand and method stay connected.

Turn One is a universal reference of **quick manuals** for tabletop games — board games, card games, dice games, party games, pub games, and folk games. You pick a game and get a fast, scannable guide to playing it: goal, setup, turn structure, the rules that actually matter, and the rules everyone forgets.

The design center is the **returning player**. Somebody who played Wingspan eight months ago, is setting it up now, and needs ninety seconds of reminder — not the forty-page rulebook, and not a twenty-minute video. A secondary mode serves the true first-timer, but the primary reading experience is optimized for *recall*, not instruction.

### 1.2 Why this can exist

Rulebooks are long by necessity — they must be unambiguous and exhaustive. Quick guides are short by design — they must be *fast*, and can afford to defer edge cases. Those are different documents with different jobs, and nobody publishes the second one consistently across a large catalog.

The opportunity is a **uniform structure applied at scale**. The value isn't any single guide; it's that every guide has the same ten blocks in the same order, so a user learns the format once and reads every future game faster.

### 1.3 Non-goals

- **Not a rulebook replacement.** No completeness, no arbitration authority. Every guide links out to the official rulebook.
- **Not a game database.** No ratings, collections, marketplace, or forums.
- **Not a play-tracking app.** No scoring, sessions, or stats in v1.
- **No native mobile app.** A PWA covers the use case.
- **No user accounts.** New in v0.2 — without a database there's nothing to authenticate against, and nothing in the product needs it. Shelf state lives in the browser.
- **Tabletop only.** Board, card, dice, tile, party, pub and folk games. No video games, no RPGs, no sports or lawn games, no drinking games.
- **English only for v1.** The file layout supports `games/es/wingspan.yaml` later without restructuring, but nothing is built for it now.
- **Not monetized.** No ads, no affiliate links, no paid tier. A decision of record, not a default — see §8 for what it unlocks.

---

## 2. Goals and success criteria

| Goal | Measure |
|---|---|
| A returning player is re-oriented fast | Guide interactive in under 1s on 4G; top four blocks readable without scrolling past the fold |
| Guides are trustworthy | Under 1% of published guides carry an open accuracy issue at any time |
| The catalog grows without the founder writing everything | By month 6, over 60% of merged guides authored by other people |
| Works where games are played | Every visited guide readable offline; usable on a phone at a table in dim light |
| Contributing doesn't require being a developer | Over half of merged contributions arrive through the web form, not hand-written PRs |

**Technical goals:** read-optimized; zero marginal cost per reader; low operational surface (one person can run it); content integrity over content velocity — a wrong rule is worse than a missing guide.

---

## 3. Architecture

### 3.1 Stack

| Layer | Choice | Notes |
|---|---|---|
| Framework | **Astro 5+**, static output | SSG; zero JavaScript shipped by default |
| Content | **YAML files in `src/content/games/`** | One file per game; git is the database |
| Validation | **Astro content collections + Zod** | The schema is enforced at build; an invalid guide fails CI |
| Interactivity | **Astro islands**, vanilla TS | Four small widgets; see §3.4 |
| Styling | **Tailwind CSS v4** | Via `@tailwindcss/vite` |
| Search | **Pagefind** | Static index built from rendered HTML post-build |
| Hosting | **Netlify** | Build on push, deploy previews per PR, free tier |
| Write path | **One Netlify Function** | Form submission → GitHub pull request (§6) |
| Offline | **`@vite-pwa/astro`** | Service worker, precache shelf |
| Analytics | Plausible or Netlify Analytics | Also serves as the view counter |

### 3.2 Shape of the system

```
   CONTRIBUTOR                            READER
        │                                    │
        │ fills the ten-block form           │ GET /g/wingspan
        ▼                                    ▼
┌──────────────────┐              ┌────────────────────┐
│ Netlify Function │              │  Netlify CDN       │
│ validate (Zod)   │              │  pre-rendered HTML │
│ → GitHub App     │              │  + Pagefind index  │
└────────┬─────────┘              └────────────────────┘
         │ branch + commit + PR                  ▲
         ▼                                       │ deploy
┌─────────────────────────────────┐              │
│ GitHub repo                     │   ┌──────────┴──────────┐
│  src/content/games/*.yaml       │──▶│ Astro build         │
│  ├── PR opens → deploy preview  │   │ getCollection()     │
│  └── merge to main → production │   │ → static pages      │
└─────────────────────────────────┘   └─────────────────────┘
```

Reads never touch a server — they're files on a CDN. The only dynamic component in the entire system is one function that turns a form submission into a pull request.

### 3.3 What replaces each v0.1 database table

Worth stating explicitly, because this is where the complexity went:

| v0.1 table | v0.2 mechanism |
|---|---|
| `games` + `guides` | One YAML file per game — metadata and guide content together |
| `guide_revisions` | Git commit history; `git log --follow` on the file |
| `profiles`, `reputation_events` | GitHub accounts and the repo's contributor graph |
| Moderation queue | GitHub pull requests with a rendered deploy preview |
| `flags` (accuracy reports) | GitHub Issues, opened by a form on every guide page |
| `game_requests` | GitHub Issues with a `request` label, sorted by 👍 reactions |
| `shelf_items` | `localStorage`, plus service-worker precache |
| `view_count` | Analytics provider |
| `tags`, `game_tags` | A field in the YAML; indexes built at compile time |
| RLS policies | Nothing to protect — the read path is public static files |

### 3.4 Islands: what actually ships JavaScript

Astro's model is that pages are static HTML unless you explicitly opt a component into hydration. This suits a guide page almost perfectly — it's 95% text with four small interactions:

| Island | Directive | Why |
|---|---|---|
| Search box | `client:idle` | Needs Pagefind's lazy-loaded index; not needed for first paint |
| Refresher / The Teach toggle | `client:load` | Affects what's visible immediately |
| Setup checklist | `client:visible` | Below the fold on most guides |
| Shelf button | `client:idle` | Reads and writes `localStorage` |

**Recommendation: no UI framework at all.** These four are small enough for vanilla TypeScript in `.astro` components — a toggle, a checkbox list, and two `localStorage` calls. Adding React or Preact for this would ship a runtime to do work that needs none. If a later feature genuinely warrants components, Preact is a ~4KB addition and Astro supports mixing frameworks per-island.

This keeps the JavaScript budget for a guide page in the low single-digit kilobytes.

### 3.5 Build scaling

Astro handles thousands of pages comfortably; expect roughly 1–3 minutes for a few thousand guides, plus Pagefind indexing. Netlify's free tier allows 300 build minutes per month — call it 100–150 deploys. That's ample early and manageable later by batching merges. If it ever binds, the options are Cloudflare Pages (500 builds/month, unlimited bandwidth) or Astro's incremental build support. Not a v1 concern.

---

## 4. The Atomic10 guide format

Unchanged from v0.1 — this is the core intellectual property and nothing about the storage decision touches it.

### 4.1 The ten blocks

Every guide is exactly these blocks, in this order. Blocks 9 and 10 are optional.

| # | Block | Purpose | Constraint |
|---|---|---|---|
| 1 | **Snapshot** | Players, time, complexity 1–5, equipment, one-sentence premise | Structured fields, not prose |
| 2 | **Goal** | How you win | ≤ 200 chars, single sentence |
| 3 | **Setup** | Table state before turn one | Ordered checklist, ≤ 10 steps |
| 4 | **The Loop** | What happens on your turn | Ordered phases/actions, ≤ 8 items |
| 5 | **Key Rules** | The rules that actually govern play | 4–8 bullets, one rule each |
| 6 | **Ending & Scoring** | Trigger condition, then how points work | Trigger sentence + scoring list |
| 7 | **Commonly Forgotten** | The rules experienced players get wrong | 2–6 bullets |
| 8 | **Tips** | Strategy for a returning player | 2–6 bullets |
| 9 | **Variants** *(optional)* | Official variants and common house rules | Labeled as variant, never base rules |
| 10 | **Glossary** *(optional)* | Game-specific terms | Term + ≤ 120 char definition |

Block 7 — **Commonly Forgotten** — is the block that makes the product. It's what a returning player actually needs and what no rulebook can provide, because a rulebook can't know which of its rules people skip.

### 4.2 Two reading modes

- **Refresher (default)** — blocks 2, 4, 7, 6. Goal, the loop, what you forget, how it ends. Roughly one phone screen plus a scroll.
- **The Teach** — all blocks in order, Setup expanded into a tickable checklist. Named for the board-game term for walking someone through a game they've never played, which is exactly this mode's job.

Defaulting to Refresher says we're primarily a memory aid. It's a one-line change to reverse, so instrument the toggle and let behavior decide.

### 4.3 Hard length budget

A guide that grows to rulebook length has failed. **Roughly 450 words of prose total**, shown as a live meter in the submission form and enforced in the schema — soft warning at 450, build failure at 700. This constraint *is* the product; contributors will push against it and the review guidelines have to hold the line.

---

## 5. The content repository

### 5.1 Layout

```
turn-one/
├── src/
│   ├── content.config.ts          # collection + Zod schema — the single source of truth
│   ├── content/
│   │   └── games/
│   │       ├── wingspan.yaml
│   │       ├── liars-dice.yaml
│   │       ├── catan.yaml
│   │       └── …                  # one file per game; filename is the URL slug
│   ├── components/                # .astro components, four of them hydrated
│   ├── layouts/
│   └── pages/
│       ├── index.astro
│       ├── games.astro
│       ├── g/[slug].astro         # getStaticPaths() over the collection
│       ├── contribute.astro
│       └── shelf.astro
├── netlify/functions/
│   └── submit-guide.ts            # the only write path in the system
├── scripts/
│   └── validate-content.ts        # runs in CI on every PR
└── astro.config.mjs
```

One file per game, containing both metadata and guide content. Splitting them would double the diff surface for no benefit — a contributor editing Wingspan touches one file, and the PR shows exactly what changed.

### 5.2 A guide file

```yaml
# src/content/games/wingspan.yaml
title: Wingspan
aliases: []
category: board
year: 2019
publisher: Stonemaier Games
designers: [Elizabeth Hargrave]
complexity: 2.4
tags: [engine-building, set-collection, card-drafting]
rulebook_url: https://stonemaier-games.s3.amazonaws.com/…/wingspan-rules.pdf
contributors: [jameson, birdnerd42]

snapshot:
  players: { min: 1, max: 5, best: 3 }
  time: { min: 40, max: 70 }
  equipment: [cards, dice, board, tokens]
  premise: Attract birds to your wildlife preserve.

goal: >-
  Score the most points from birds, bonus cards, end-of-round goals,
  eggs, cached food, and tucked cards.

setup:
  - Give each player a player mat and 8 action cubes.
  - Deal 5 bird cards and 2 bonus cards to each player.
  # …

loop:
  - Play a bird from your hand to a habitat.
  - Gain food from the birdfeeder and activate forest powers.
  # …

key_rules:
  - Each habitat row activates right to left, and every bird already
    there triggers again.

ending:
  trigger: The game ends after the fourth round.
  scoring:
    - 1 point per egg on any bird card.
    # …

forgotten:
  - Brown powers trigger on activation; white powers only when played.

tips:
  - Eggs are the densest late-game points — don't sleep on the lay-eggs action.

variants: []
glossary:
  - term: Tuck
    definition: Slide a card face-down under a bird; usually worth 1 point.
```

YAML over JSON because contributors read and hand-edit it, and multi-line prose is far more legible. Astro's `glob()` loader parses both.

### 5.3 The schema is the contract

```ts
// src/content.config.ts
import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const bullet = z.string().min(3).max(240);

const games = defineCollection({
  loader: glob({ pattern: '**/*.yaml', base: './src/content/games' }),
  schema: z.object({
    title: z.string().min(1),
    aliases: z.array(z.string()).default([]),
    category: z.enum(['board','card','dice','party','tile','pen_paper','dexterity','word','other']),
    year: z.number().int().min(1000).max(2100).optional(),
    publisher: z.string().optional(),
    designers: z.array(z.string()).default([]),
    complexity: z.number().min(1).max(5).optional(),
    tags: z.array(z.string()).default([]),
    rulebook_url: z.string().url().optional(),
    contributors: z.array(z.string()).default([]),

    snapshot: z.object({
      players: z.object({ min: z.number().int(), max: z.number().int(), best: z.number().int().optional() }),
      time: z.object({ min: z.number().int(), max: z.number().int() }),
      equipment: z.array(z.string()).default([]),
      premise: z.string().max(160),
    }),

    goal: z.string().max(200),
    setup: z.array(bullet).min(1).max(10),
    loop: z.array(bullet).min(1).max(8),
    key_rules: z.array(bullet).min(4).max(8),
    ending: z.object({ trigger: z.string().max(240), scoring: z.array(bullet).min(1) }),
    forgotten: z.array(bullet).min(2).max(6),
    tips: z.array(bullet).min(2).max(6),
    variants: z.array(z.object({ name: z.string(), text: z.string().max(400) })).default([]),
    glossary: z.array(z.object({ term: z.string(), definition: z.string().max(120) })).default([]),
  }),
});

export const collections = { games };
```

This one file does the work that v0.1 spread across a SQL schema, a set of RLS policies, a client validation layer, and an Edge Function validator. A malformed guide can't reach production because the build fails.

The word budget needs one extra check that Zod can't express cleanly — a `scripts/validate-content.ts` step in CI that sums prose across blocks and fails past 700, warns past 450. It also checks slug uniqueness against aliases and that `rulebook_url` resolves.

### 5.4 Git as the revision system

Everything v0.1's `guide_revisions` table provided, with no code:

- **History** — `git log --follow src/content/games/wingspan.yaml`
- **Diffs** — GitHub's file view, or `git diff`
- **Attribution** — commit authorship, plus the `contributors` field for form submitters
- **Revert** — `git revert`, or the "Revert" button on any merged PR
- **Immutability** — commits are immutable by construction
- **Blame** — `git blame` answers "who wrote this wrong rule and when"

Rendering history in the UI is a nice-to-have: a "History" link per guide pointing at the GitHub commit log for that file costs one line and defers the whole feature.

---

## 6. The contribution pipeline

This is where the remaining engineering lives, and it's the piece that decides whether the community model works.

### 6.1 The problem it solves

Files-in-a-repo means contributions are pull requests. Your ideal contributor is a board game obsessive, not necessarily a developer — and "open a PR" filters that pool hard. GitHub's browser editor helps, but it still requires an account and understanding what a pull request is.

So we bridge it: **a web form that opens the PR on the contributor's behalf.** They never see git.

### 6.2 The flow

```
1. Contributor opens /contribute (or "Suggest a fix" on any guide page)
2. Block-by-block form, pre-filled when editing an existing guide
3. Live word-budget meter; required-field validation per block
4. Submit → POST to /.netlify/functions/submit-guide
5. Function:
     a. verifies Cloudflare Turnstile token          (spam gate)
     b. validates payload against the same Zod schema (shared import)
     c. serializes to YAML
     d. authenticates as a GitHub App installation
     e. creates branch  contrib/<slug>-<shortid>
     f. commits the file with the contributor's stated name in the trailer
     g. opens a PR, labeled `new-guide` or `edit`, body = their change note
6. Netlify builds a deploy preview for the PR
7. Jameson reviews the RENDERED GUIDE, not a diff, then merges
8. Merge to main → production build → live in ~2 minutes
```

**Step 7 is the quiet win.** v0.1 specced a custom moderation queue with block-level diff rendering — two weeks of work — to let a reviewer see what a change actually looks like. Netlify's deploy previews give exactly that, for free, automatically, per PR.

### 6.3 The function

One file, roughly 150 lines. Key decisions:

- **A GitHub App, not a personal access token.** Scoped to the one repo, permissions limited to `contents:write` and `pull_requests:write`, and the private key lives in a Netlify environment variable. A leaked PAT would be an account-wide problem; a leaked App key is a one-repo problem that's revocable in a click.
- **The contributor needs no GitHub account.** The App commits on their behalf. They supply a display name, which goes into the YAML `contributors` array and the commit trailer — attribution is preserved, which CC BY-SA requires.
- **Validation happens before the PR exists.** Malformed submissions get a helpful error in the form and never become repository noise.
- **No secrets reach the browser.** The form posts plain JSON; all GitHub credentials stay server-side.

### 6.4 Spam and abuse

Cheaper here than in v0.1, because nothing a contributor submits is ever live until you merge it.

- **Cloudflare Turnstile** on the form — free, no CAPTCHA puzzles for humans
- **Schema validation pre-PR** — junk never enters the repo
- **Rate limit by IP** in the function; start at 5 submissions per hour
- **Paste heuristic** in the form: a single paste over ~200 characters warns about copying rulebook text and tags the PR for closer review
- **GitHub's own tooling** for anything persistent — block the account, or turn off the App

The worst outcome is a closed PR. There is no vandalism vector on live content, because publishing requires a human merge.

### 6.5 Cold start — unchanged and still the biggest risk

The architecture got simpler; this didn't get easier. Contributors show up because there's an audience, and an audience shows up because there's content.

1. **Seed 60–100 guides before launch.** Catan, Ticket to Ride, Wingspan, Azul, Codenames, Uno, Hearts, Cribbage, Yahtzee, Liar's Dice, Euchre, Spades, Farkle, 7 Wonders, Splendor, Carcassonne, Dominion, Pandemic. Public-domain and folk games are ideal seed material — no licensing questions, high search volume, badly served today.
2. **Make the request queue the funnel.** Every zero-result search offers "request this game," which opens a labeled GitHub Issue. A public most-wanted page sorted by 👍 is the contributor to-do list.
3. **Fifteen minutes, not two hours.** The form is what makes a casual contribution possible at all.
4. **Recruit deliberately.** BGG forums, r/boardgames, game stores, local groups.

**Expect to write most content yourself for the first three to six months.** Treat month-6 contribution share as the metric that says whether the model works.

---

## 7. Application surfaces

### 7.1 Routes

| Route | Rendering | Purpose |
|---|---|---|
| `/` | Static | Search-first home; categories, popular, recently updated |
| `/games` | Static | Browse with filters — category, players, time, complexity, tags |
| `/g/[slug]` | Static, one per game | **The guide page.** The product. |
| `/contribute` | Static + island | The block-by-block form |
| `/g/[slug]/edit` | Static + island | Same form, pre-filled from the YAML |
| `/requests` | Static, rebuilt on deploy | Most-wanted, pulled from GitHub Issues at build |
| `/shelf` | Static + island | Saved games, read from `localStorage` |
| `/about`, `/guidelines`, `/legal` | Static | Policy pages |

Browse filters run client-side over a small JSON index emitted at build — a few hundred KB for thousands of games, cached after first load, no server round-trip.

### 7.2 The guide page

- **Above the fold on a phone:** title, snapshot chips (players / time / complexity), Goal, and the Refresher toggle. Nothing else competes.
- **Commonly Forgotten visually distinct** — a callout, not just another list.
- **Setup as a tickable checklist**, state in `localStorage`, resettable.
- **Large type, high contrast, generous tap targets.** Read on a phone, at a table, in dim light, one-handed. A *table mode* bumps type size and holds a wake lock.
- **"Report something wrong"** on every guide — one tap, opens a prefilled GitHub Issue via the form. No account needed.
- **Link to the official rulebook** in every guide footer, always.
- **View transitions** between guides (built into Astro) make a static site feel like an app for about three lines of config.

### 7.3 Search

Pagefind indexes the rendered HTML after the build and ships a chunked index the browser lazy-loads — it's designed for exactly this scale and doesn't degrade as the catalog grows. Results are instant because there's no network round-trip after the first index fetch.

Two behaviors matter more than relevance tuning:

- **Aliases are first-class.** "Perudo," "Dudo," and "Pirate's Dice" all resolve to Liar's Dice. The `aliases` field exists for this; populate it aggressively and make sure it lands in the indexed HTML.
- **Zero results is a conversion point.** It offers "request this game" and opens an Issue.

---

## 8. Legal and licensing

Not legal advice — flagging what needs a real answer before launch.

### 8.1 Rules vs. expression

Game *mechanics, systems, and rules as ideas* are generally not copyrightable in US law; the *specific expression* in a rulebook — exact wording, layout, illustrations, diagrams — is. That distinction is what makes this product possible.

Enforced in the product, not just stated in a policy:

- **Contributors write original prose. Never paste rulebook text.** In the contributor terms, the form UI, and the review guidelines.
- The word budget helps incidentally — a 450-word summary is structurally unlike a rulebook.
- No rulebook diagrams, no publisher art, no scanned components.
- A visible **DMCA / takedown policy** and a working contact address before launch.

Get a lawyer's read on the contributor terms and takedown policy before public launch.

### 8.2 Cover images

Publisher box art is copyrighted with no clean fair-use story for decorating a catalog. **Recommendation: no publisher art in v1** — generated category-colored tiles look fine and cost nothing.

### 8.3 BoardGameGeek

BGG's XML API grants a **non-commercial license only**, requires the "Powered by BGG" logo linked back, prohibits altering retrieved data, and **explicitly prohibits using the API or site data to train an AI or LLM system.**

**Updated by the no-monetization decision:** not monetizing clears the non-commercial restriction, so the BGG API is now legitimately available if you want it. The recommendation is unchanged, for a different reason — building the catalog on it creates a dependency that has to be unwound the day that decision ever changes, and the AI-training prohibition constrains tooling regardless. Contributors enter metadata in the form; `bgg_id` is stored only for outbound "see on BGG" links, which is just linking.

### 8.4 Contributor licensing

**Decided: CC BY-SA 4.0**, declared in a `LICENSE` file at the repo root and in the contributor terms on the form.

**What a contributor license is for.** Someone who writes a guide owns the copyright to that text automatically. Without an explicit agreement you have no clear right to publish it, keep publishing it, let a second contributor edit it, or let anyone else reuse it — and once five people have edited one guide, ownership of the result is genuinely unclear. The license is the contributor stating, at submission, the terms under which anyone can use what they wrote. In practice: a checkbox on the form and a file in the repo.

**What BY-SA means.** Two conditions. *Attribution* — reusers credit the source. *ShareAlike* — anyone who builds on it releases their version under the same terms.

It fits for three reasons: it's the wiki norm, so contributors recognize it; ShareAlike means nobody can take the corpus, polish it and close it off, which is the promise that makes volunteers comfortable donating work; and attribution is already carried mechanically by git history and the `contributors` field.

**Why not the NonCommercial variant.** BY-SA permits commercial reuse by third parties, and BY-NC-SA would block it. Avoid NC anyway: "commercial" is notoriously vague, NC licenses are incompatible with Wikipedia, and they'd block uses you'd probably welcome — a game store printing guides for a demo table, a teacher handing them out. Choosing not to monetize does not require the NC clause.

Settle this before the first outside contribution; retroactive license changes mean chasing every contributor.

---

## 9. Milestones

One developer, part-time. Shorter than v0.1 by roughly four weeks, all of it database and moderation work that no longer exists.

| # | Milestone | Scope | Est. |
|---|---|---|---|
| **M0** | Foundations | Astro project, Tailwind v4, repo, Netlify connected, `content.config.ts` schema, CI validation script, 3 hand-written guides | 1 wk |
| **M1** | Read path | Guide page and renderer, browse, category indexes, responsive + dark mode, view transitions, ~20 seed guides | 1.5–2 wks |
| **M2** | Search & browse | Pagefind wired up, aliases in the index, client-side filters, zero-result → request flow | 1 wk |
| **M3** | Contribution pipeline | The form, GitHub App, Netlify Function, Turnstile, deploy-preview review loop, contributor docs | 2 wks |
| **M4** | Offline & polish | PWA, service worker, shelf, table mode, "report an issue" flow, analytics | 1.5 wks |
| **M5** | Content push & launch | 60–100 seed guides, guidelines, legal pages, contributor recruiting, soft launch | 3–4 wks (mostly writing) |

**Total to public launch: roughly 10–12 weeks part-time**, dominated by M5 content rather than code.

**Suggested first slice: M0 + the first three guides.** Writing three real guides by hand — one board, one card, one dice — will tell you more about whether the ten-block format holds than any amount of schema design. Do that before building the form.

---

## 10. Risks

| Risk | Severity | Mitigation |
|---|---|---|
| **Contributions never materialize; you write everything forever** | High | §6.5. Now the single biggest risk, since the technical ones shrank. Month-6 checkpoint: under 20% outside contribution means rethinking the model, not waiting longer. |
| **The form is the whole bridge to non-developers — if it's bad, the community model fails** | High | Treat M3 as product work, not plumbing. Test with two or three non-technical board game friends before launch. |
| **A published guide is wrong and someone plays a whole game wrong** | Med-High | Human merge required, deploy-preview review, one-tap issue reports, instant `git revert`, rulebook link on every guide |
| **Publisher takedown request** | Medium | Original prose only, no art, no rulebook text, working DMCA process, lawyer review |
| **Guides bloat toward rulebook length** | Medium | Word budget enforced in CI, review guidelines, periodic audit of the longest files |
| **GitHub App key leaks** | Medium | Netlify env vars only, never client-side; single-repo scope; rotate on suspicion. Worst case is spam PRs, not content compromise. |
| **Build minutes or bandwidth ceiling** | Low | 300 build-min and 100 GB/mo on Netlify free — roughly 150 deploys and over a million pageviews. Cloudflare Pages is the escape hatch. |
| **Learning-curve drag on Astro** | Low | §12. The concept surface is small and the docs are good; budget a day of reading before M0. |

---

## 11. Decisions of record

**No open questions.** All nine from v0.1 are settled. The register below is what the build proceeds on; anything not listed is an implementation choice, not a decision awaiting an answer.

| Decision | Settled as | When |
|---|---|---|
| **Monetization** | None — no ads, affiliate links, or paid tier | v0.2 |
| **Scope** | Tabletop only — no video games, RPGs, sports, lawn or drinking games | v0.2 |
| **Contributor license** | CC BY-SA 4.0 | v0.2 |
| **Localization** | English only for v1; file layout leaves the door open | v0.2 |
| **Product name** | Turn One by Atomic10 | v0.2 |
| **Feature names** | Shelf (saved games), The Teach (full-guide mode) | v0.2 |
| **Storage** | YAML files in git — no database | v0.2 |
| **Framework** | Astro, static output | v0.2 |
| **Hosting** | Netlify, free tier | v0.2 |
| **SEO strategy** | Static generation — resolved outright, no mitigation needed | v0.2 |
| **Cover images** | No publisher art; generated category tiles | v0.1 |
| **BoardGameGeek** | Outbound links only, not a data source | v0.1 |
| **Default reading mode** | Refresher | v0.1 |

Two things still need a person other than you: a lawyer's read on the contributor terms and takedown policy before public launch (§8), and two or three non-technical board game friends testing the submission form before it ships (§10). Neither blocks starting.

---

## 12. Appendix: the Astro you'll actually need

You said you wanted to learn something new. The good news is that this project uses a small slice of Astro, and it's the slice the docs cover best. Five concepts:

1. **Content collections.** `src/content.config.ts` defines a collection with a loader and a Zod schema. `getCollection('games')` returns validated, typed entries. This replaces your entire database layer.
2. **`getStaticPaths()`.** In `src/pages/g/[slug].astro`, return one entry per game and Astro generates one HTML file per game at build. This is the whole "how do 3,000 pages exist" answer.
3. **Islands and client directives.** Components are static HTML unless marked `client:load`, `client:idle`, or `client:visible`. Default to no directive; add one only when something must run in the browser.
4. **Layouts and slots.** `src/layouts/Base.astro` wraps pages; `<slot />` is where page content lands. Same idea as a template inheritance system.
5. **The build output.** `npm run build` produces `dist/` — plain HTML, CSS, and a little JS. Read that directory once. Seeing the actual files is what makes SSG click.

What you can ignore for now: server-side rendering modes, server islands, middleware, actions, and the adapter ecosystem. All useful, none needed for a static content site.

**Worth a day before M0:** the "Content Collections" and "Routing" guides in the Astro docs, then build a throwaway three-page site from a folder of YAML. You'll hit every concept above in an afternoon.

---

## 13. Kickoff checklist

- [ ] `npm create astro@latest` — minimal template, TypeScript strict
- [ ] Add Tailwind v4 via `@tailwindcss/vite`
- [ ] Create the GitHub repo; connect Netlify; confirm deploy previews are on for PRs
- [ ] Write `src/content.config.ts` from §5.3
- [ ] Write `scripts/validate-content.ts` (word budget, slug uniqueness) and wire it into CI
- [ ] Add `LICENSE` (CC BY-SA 4.0) and a `CONTRIBUTING.md`
- [ ] **Hand-write three guides — one board, one card, one dice — before anything else**
- [ ] Build `src/pages/g/[slug].astro` and the guide renderer as pure Astro components
- [ ] Confirm the three guides render, then judge the ten-block format on real output

That third-from-last item is the one that matters. Everything else is recoverable; a guide format that doesn't survive contact with three real games would be expensive to discover in month three.
