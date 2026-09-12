# Contributing to Turn One

Thanks for writing a guide. This document is short on purpose — so is every guide.

## The one rule that matters

**Write in your own words. Never paste text from a rulebook.**

Game rules as ideas aren't copyrightable, but the specific wording of a rulebook is.
An original summary is a different thing from a copy. This is the legal footing the
whole project stands on, so it isn't negotiable. The same goes for rulebook diagrams,
publisher artwork, and scanned components — none of those belong here.

## The format

Every guide is the same ten blocks in the same order. That uniformity *is* the product:
a reader learns the shape once and reads every future guide faster.

1. **Snapshot** — players, time, complexity, equipment, one-sentence premise
2. **Goal** — how you win, one sentence
3. **Setup** — table state before turn one, max 10 steps
4. **The Loop** — what happens on your turn, max 8 items
5. **Key Rules** — 4–8 bullets, one rule each
6. **Ending & Scoring** — what triggers the end, then how points work
7. **Commonly Forgotten** — the rules experienced players get wrong
8. **Tips** — 2–6 bullets for someone who's played before
9. **Variants** *(optional)* — clearly labeled as variants, never as base rules
10. **Glossary** *(optional)* — game-specific terms

**Block 7 is the most valuable one.** It's what a returning player actually needs and
what no rulebook provides, because a rulebook can't know which of its rules people skip.
If you only get one block really right, make it that one.

## The word budget

**Roughly 450 words of prose per guide.** The build warns past 450 and fails past 700.

This will feel tight. That's the point — a guide that grows to rulebook length has
failed at its job. Completeness is explicitly not a goal. Every guide links to the
official rulebook for edge cases, and that's where edge cases belong.

Run `npm run validate` to check your word count before opening a PR.

## Adding a guide

1. Create `src/content/games/<slug>.yaml` — lowercase, hyphenated (`liars-dice.yaml`).
   The filename becomes the URL.
2. Copy the structure from an existing guide. `hearts.yaml` is a good short model.
3. Fill in `aliases` generously. "Perudo", "Dudo" and "Pirate's Dice" should all find
   Liar's Dice. This is the single highest-value field for making search work.
4. Run `npm run validate` and `npm run build` locally.
5. Open a pull request. A preview of your rendered guide builds automatically —
   check it before asking for review.

## What gets a guide rejected

- Text lifted from a rulebook
- Over the hard word limit
- Strategy advice filed under Commonly Forgotten (that's Tips)
- Variants presented as base rules
- Games outside scope — no video games, RPGs, sports, lawn games, or drinking games

## Licensing

Contributions are licensed **CC BY-SA 4.0**. By opening a pull request you agree to
release your text under those terms: anyone may reuse it with attribution, provided
they share their version under the same license. Attribution is carried by git history
and the `contributors` field in each file — add your name there.
