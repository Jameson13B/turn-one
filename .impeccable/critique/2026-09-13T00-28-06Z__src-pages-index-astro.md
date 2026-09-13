---
target: homepage + guide template (Refresher mode)
total_score: 20
max_score: 28
na_heuristics: 5,9,10
p0_count: 0
p1_count: 3
target_identity: "file:/Users/jamesonbrown/claude-repos/turn-one/src/pages/index.astro"
target_fingerprint: "sha256:54610a5972ce946426e0f6a3eb974a9e4b7d93c19fc20567fe8def71929a8b83"
target_path: /Users/jamesonbrown/claude-repos/turn-one/src/pages/index.astro
timestamp: 2026-09-13T00-28-06Z
slug: src-pages-index-astro
---
Method: dual-agent (A: general-purpose design-review subagent · B: general-purpose detector/evidence subagent)

## Scope

Two surfaces, Refresher-mode content only (per request): the homepage (`src/pages/index.astro`) and the guide page template (`src/pages/g/[slug].astro`), evidenced live across all three seed guides (Hearts, Liar's Dice, Wingspan). "The Teach" toggle content (Setup, Key Rules, Tips, Variants, Glossary) was explicitly out of scope for both assessments.

## Design Health Score

Applicable max: **28** (7 of 10 heuristics apply to a static, read-only reference surface with no forms, errors, or destructive actions).

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3/4 | Toggle's pressed/idle state is now unambiguous; no other dynamic state exists in scope. |
| 2 | Match Between System and Real World | 3/4 | Game-turn language matches player mental models well; "Weight 1.8" gives a raw BGG-style decimal with no scale context. |
| 3 | User Control and Freedom | 3/4 | Toggle and footer exits work, but only 1 of 3 guides has a working "official rules" exit (see P1 below). |
| 4 | Consistency and Standards | 3/4 | The guide template is internally consistent across all three instances; the homepage shares almost none of its visual language, and 2/3 guides violate the project's own rulebook-link guardrail. |
| 5 | Error Prevention | n/a | No forms or destructive actions exist on a static reference page. |
| 6 | Recognition Rather Than Recall | 3/4 | Chips and persistent labels reduce recall load well; aliases (`aka Perudo`) are `sr-only`, so a sighted visitor who searched "Perudo" gets no on-page confirmation. |
| 7 | Flexibility and Efficiency of Use | 2/4 | The reading-mode toggle is a real, working accelerator. But `global.css` defines a `data-table-mode="on"` 19px "arm's-length" font bump — explicitly commented for "reading at arm's length mid-game" — with no UI control anywhere that sets it. |
| 8 | Aesthetic and Minimalist Design | 3/4 | The guide template is restrained and considered; the homepage is minimal to the point of looking unfinished, pulling the blended score down. |
| 9 | Error Recovery | n/a | No error states exist in the scoped content. |
| 10 | Help and Documentation | n/a | Appropriately absent — the product's whole premise is not needing documentation to read the reference. |
| **Total** | | **20/28** | **Good (71%)** |

## Design Specificity Verdict

Split cleanly by surface.

**The guide template is genuinely grounded in this product.** The Zod schema (`src/content.config.ts`) hard-caps every block's length — `bullet` at 240 chars, `forgotten` at 2–6 items, `goal` at 200 chars — so the "know enough by turn one" word-budget discipline CLAUDE.md describes is enforced structurally, not just by editorial willpower. The brass accent (`--color-brass`) is used exactly once per page, exclusively on "Commonly Forgotten," confirmed by inspection across all three live guides — nothing else borrows it. The Refresher default renders exactly blocks 2/4/7/6 as documented. This isn't a template a recipe site could drop in unchanged.

**The homepage carries none of that identity, and it's not just a stylistic gap — it skips a guardrail the project already committed to.** CLAUDE.md states: *"No publisher cover images. Generated category-colored tiles instead."* (line 62). The current implementation (`src/pages/index.astro`) renders a plain divided list — title, category as a small uppercase text label, nothing else. There are no tiles, colored or otherwise. This is a specified feature that hasn't shipped yet, not a matter of taste. As it stands, strip the tagline and this page is indistinguishable from a generic index for any "pick one of N things" product.

**Deterministic scan**: `impeccable detect --json` against the raw `.astro` source returned `[]` (0 findings) — it doesn't appear to parse Astro template syntax, so Assessment B additionally ran it against the live rendered URLs, which surfaced 9 `line-length` warnings (quality, all guide pages). Cross-checked against actual rendered line boxes via CDP measurement, real wrapped lines run 56–65 chars — well under the detector's claimed 85–92 and under the 80-char guideline. **This specific detector output is a false positive on the numbers**, but it points at something real: the guide `<article>` column has no `ch`-based max-width (`max-w-3xl` only), unlike the homepage's intro paragraph, which explicitly uses `max-w-prose` (65ch). Nothing enforces measure on guide body text today; it just hasn't been stressed by long-enough sentences yet.

## Overall Impression

The guide template — the actual product — is well-crafted for an M0 pressure-test: restrained color use, enforced word budgets, a real progressive-disclosure toggle with correct default state, reduced-motion handling, and a legible emotional arc on arrival. The single biggest opportunity is that two things meant to *complete* the product per its own spec haven't shipped yet: the homepage's category-tiles (guardrail, not opinion) and two of three guides' rulebook links (guardrail, not opinion). Neither is a design disagreement; both are the project's own stated bar not yet met.

## What's Working

1. **The schema *is* the editorial voice.** Character/array caps in `content.config.ts` mean the word-budget guardrail is enforced at build time by Zod, not just by a style guide. Most content projects only encode this in prose.
2. **Brass is used with real restraint.** Confirmed across all three live guides: the accent appears exactly once, exclusively on Commonly Forgotten. That restraint is what gives the color meaning — it's easy to get wrong and the project didn't.
3. **The reading-mode toggle is polished well past M0 expectations.** Correct default (Refresher = blocks 2/4/7/6), grid-based expand/collapse, `motion-reduce` fallback, localStorage persistence, and (after this session's earlier fixes) correctly-contrasted pressed states in both themes.

## Priority Issues

**[P1] Two of three seed guides silently drop the required rulebook link.**
*Confirmed independently by both assessments.* Hearts and Liar's Dice have no `rulebook_url` in their YAML; only Wingspan does. The template correctly hides the link when absent (`{g.rulebook_url && (...)}`), so the footer quietly degrades to just a GitHub-issue link with no path to the actual rules.
**Why it matters**: CLAUDE.md states this isn't optional — "Every guide links to its official rulebook in the footer" — and frames it as part of the project's legal/trust posture. The schema doesn't enforce it either (`rulebook_url` is `.optional()`), so nothing in CI catches a future regression.
**Fix**: Make `rulebook_url` required in the schema; backfill URLs for Hearts and Liar's Dice.
**Suggested command**: `/impeccable harden`

**[P1] The homepage doesn't yet implement the category-colored tiles CLAUDE.md specifies.**
CLAUDE.md line 62: "No publisher cover images. Generated category-colored tiles instead." The current homepage renders a plain text list with a small uppercase category label — no tile, no color, none of the guide template's felt/brass identity.
**Why it matters**: this is a named, already-decided feature, not an aesthetic debate — and until it ships, the homepage is the one surface in the product that could be mistaken for an unrelated site.
**Fix**: Build the generated category-colored tile per game (board/card/dice categories each get a distinct token-driven tile color), replacing the current plain-text row.
**Suggested command**: `/impeccable shape` (to nail the tile concept quickly) → `/impeccable colorize` or `/impeccable layout`

**[P1] Snapshot's "equipment" field is captured and validated but never rendered.**
`content.config.ts` defines `snapshot.equipment` and every guide populates it (Hearts: `[standard deck]`; Wingspan: `[cards, dice, board, tokens]`), but the Snapshot chip row in `[slug].astro` only renders players/time/complexity — equipment is dropped silently.
**Why it matters**: CLAUDE.md's own Block 1 definition names five things: "players, time, complexity 1–5, equipment, one-sentence premise." A returning player's first useful question is often "do I have the right pieces out" — exactly what's missing.
**Fix**: Add an equipment chip or inline line to the Snapshot section.
**Suggested command**: `/impeccable polish`

**[P2] "Commonly Forgotten" — the product's signature block — fails contrast in light mode.**
*Confirmed independently by both assessments, with Assessment B's exact figure: `--color-brass` (#9a6712) on `--color-brass-soft` (#f5ead0) computes to **4.06:1**, under the 4.5:1 AA floor for this text size/weight (14px/600 does not qualify for the large-text exemption). The dark-theme pairing is fine at 7.27:1.
**Why it matters**: this is the single block CLAUDE.md calls "the block that makes the product," and in the default light theme its own label is borderline illegible for low-vision users.
**Fix**: Darken `--color-brass` for light mode (e.g., toward `#7a5210`) and re-verify the ratio.
**Suggested command**: `/impeccable polish`

**[P2] The reading-mode toggle and Snapshot chips assume prior knowledge with no accessible structure.**
Three related gaps in the page's only interactive control: (1) `#mode-refresher`/`#mode-teach` are two independent `aria-pressed` buttons with no wrapping `role="group"`/`aria-label`, so screen-reader users get two disconnected toggles rather than "one control, two views"; (2) "The Teach" is an unexplained branded label with no hint text before it's clicked; (3) "Weight 1.8" chips give a raw decimal with no scale context (out of what?).
**Why it matters**: a first-time visitor (this product explicitly also serves "someone who hasn't played") hits two small comprehension gaps in their first ten seconds, and screen-reader users lose the toggle's relational meaning entirely.
**Fix**: Wrap the toggle in a labeled group (or proper tab/radiogroup pattern); add a one-line caption; add a "/5" suffix or tooltip to the weight chip.
**Suggested command**: `/impeccable clarify`

## Persona Red Flags

**Casey (Distracted Mobile User)**: True 390px-width rendering (verified via CDP device emulation after a plain Chrome CLI screenshot flag gave a misleading clipped-text read that Assessment B caught and discarded as a tooling artifact, not a real bug) shows no horizontal overflow anywhere. But on every guide — including the shortest — header + chips + premise + toggle + a 5-step "On your turn" list consume nearly a full phone screen before "Commonly Forgotten" appears. The product's intended payoff moment is at least one scroll away even on Hearts, the simplest guide.

**Sam (Accessibility-Dependent User)**: Two concrete, measured issues: the ungrouped toggle buttons (P2 above) and the light-mode brass contrast at 4.06:1 (P2 above, exact figure). Also: "3–6 players" uses an en dash that some screen readers may render as "3 dash 6" rather than "3 to 6."

**Jordan (Confused First-Timer)**: "Weight 1.8"/"Weight 2.4" give no scale context, and "The Teach" is unexplained branded jargon rather than a plain label like "Full guide" — two small but real "what does this mean" moments in the first ten seconds.

## Minor Observations

- `global.css` defines a `data-table-mode="on"` 19px font-bump rule, commented for exactly this product's mid-game arm's-length use case — but nothing in the codebase ever sets that attribute. It's a finished token with no control wired to it; worth shipping the control or removing the rule so it doesn't bit-rot silently.
- `ending.scoring` has no upper bound in the schema (`.min(1)`, no `.max()`) — Wingspan already runs 6 items, while sibling arrays `forgotten` (max 6) and `loop` (max 8) are capped. Nothing structurally protects this list from drifting past scannable length.
- Reading-mode toggle buttons measure 38px tall (Assessment B, CDP-measured and cross-checked against Tailwind class math) — clears the 24×24 AA minimum but is short of the 44×44 AAA target for the page's only interactive control.
- Footer "Tell us" links straight to a raw GitHub issue-creation URL — a fairly technical, heavyweight ask to surface directly to a casual player mid-game rather than in the contributor-facing docs.
- The inline-SVG favicon (a felt-green square with a serif "1") is a nice, cheap, on-brand touch even at 32px — noted as a small thing done right, not a problem.

## Questions to Consider

1. Should "Commonly Forgotten" visually outrank "Goal" given it's named as the product's differentiator, or is a color tint alone the right amount of emphasis once the contrast is fixed?
2. Was the homepage's plain-list treatment a deliberate "index isn't the product" call, or did the category-tile guardrail just not reach `index.astro` yet in M0?
3. Was sequencing the reading-mode toggle ahead of `data-table-mode` (arm's-length text) intentional, or did the second half of "progressive disclosure for this product" get quietly dropped?
