#!/usr/bin/env node
/**
 * Turn One content validator. No dependencies by design — it runs on a clean
 * checkout before `npm install` finishes, and in CI without a install step.
 *
 * Astro's content collection schema already enforces structure at build time
 * (a malformed guide fails `npm run build`). This script checks the two things
 * the Zod schema can't express cleanly:
 *
 *   1. The prose word budget   — warn at 450, fail at 700. See docs/TDD.md §4.3
 *   2. Slug uniqueness across filenames AND declared aliases
 *
 * Run: npm run validate       Exits non-zero on failure so it can gate CI.
 */

import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const GAMES_DIR = 'src/content/games';
const WARN_AT = 450;
const FAIL_AT = 700;

// Top-level blocks whose text counts toward the prose budget.
// Catalog metadata (title, publisher, tags, glossary, variants) does not.
const PROSE_BLOCKS = new Set([
  'goal',
  'setup',
  'loop',
  'key_rules',
  'forgotten',
  'tips',
  'ending',
]);

// Within `snapshot`, only the premise is prose.
const SNAPSHOT_PROSE_KEY = 'premise';

/** Strip YAML scaffolding from a line, leaving just the human text. */
function textOf(line) {
  let s = line.trim();
  if (!s || s.startsWith('#')) return '';
  s = s.replace(/^-\s*/, ''); // list item marker
  s = s.replace(/^[a-z_]+:\s*/i, ''); // key prefix
  s = s.replace(/^[>|][-+]?\s*$/, ''); // block scalar indicator alone
  s = s.replace(/^["']|["']$/g, ''); // wrapping quotes
  return s.trim();
}

function wordCount(str) {
  const t = str.trim();
  return t ? t.split(/\s+/).filter(Boolean).length : 0;
}

/**
 * Walk the file line by line, tracking which top-level block we're inside.
 * Counts words only within prose blocks.
 */
function analyze(source) {
  const lines = source.split(/\r?\n/);
  let currentBlock = null;
  let inSnapshot = false;
  let words = 0;
  const aliases = [];

  for (const line of lines) {
    if (!line.trim() || line.trim().startsWith('#')) continue;

    const topLevel = line.match(/^([a-z_]+):(.*)$/i);

    if (topLevel) {
      const [, key, rest] = topLevel;
      currentBlock = key;
      inSnapshot = key === 'snapshot';

      if (key === 'aliases') {
        const inline = rest.match(/\[(.*)\]/);
        if (inline) {
          for (const a of inline[1].split(',')) {
            const cleaned = a.trim().replace(/^["']|["']$/g, '');
            if (cleaned) aliases.push(cleaned);
          }
        }
      }

      if (PROSE_BLOCKS.has(key)) words += wordCount(textOf(rest));
      continue;
    }

    // Indented line — belongs to the current top-level block.
    if (inSnapshot) {
      const m = line.match(/^\s+([a-z_]+):\s*(.*)$/i);
      if (m && m[1] === SNAPSHOT_PROSE_KEY) words += wordCount(m[2]);
      continue;
    }

    if (currentBlock && PROSE_BLOCKS.has(currentBlock)) {
      words += wordCount(textOf(line));
    }
  }

  return { words, aliases };
}

// --- run ---

let files;
try {
  files = readdirSync(GAMES_DIR)
    .filter((f) => f.endsWith('.yaml') || f.endsWith('.yml'))
    .sort();
} catch {
  console.error(`No ${GAMES_DIR} directory found. Nothing to validate.`);
  process.exit(0);
}

if (files.length === 0) {
  console.log('No guide files yet. Nothing to validate.');
  process.exit(0);
}

const errors = [];
const warnings = [];
const claimed = new Map(); // slug or alias -> file that claimed it

for (const file of files) {
  const slug = file.replace(/\.ya?ml$/, '');
  let source;

  try {
    source = readFileSync(join(GAMES_DIR, file), 'utf8');
  } catch (err) {
    errors.push(`${file}: could not read — ${err.message}`);
    continue;
  }

  const { words, aliases } = analyze(source);

  // slug + alias uniqueness
  const normalize = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  for (const claim of [slug, ...aliases.map(normalize)]) {
    if (!claim) continue;
    const owner = claimed.get(claim);
    if (owner && owner !== file) {
      errors.push(`${file}: "${claim}" is already claimed by ${owner}`);
    } else {
      claimed.set(claim, file);
    }
  }

  // word budget
  if (words > FAIL_AT) {
    errors.push(`${file}: ${words} words of prose exceeds the hard limit of ${FAIL_AT}`);
  } else if (words > WARN_AT) {
    warnings.push(`${file}: ${words} words — over the ${WARN_AT}-word target. Tighten it.`);
  } else {
    console.log(`  ok    ${file.padEnd(20)} ${String(words).padStart(3)} words`);
  }
}

for (const w of warnings) console.warn(`  warn  ${w}`);
for (const e of errors) console.error(`  FAIL  ${e}`);

const s = (n) => (n === 1 ? '' : 's');
console.log(
  `\n${files.length} guide${s(files.length)} checked · ` +
    `${errors.length} error${s(errors.length)} · ` +
    `${warnings.length} warning${s(warnings.length)}`
);

process.exit(errors.length > 0 ? 1 : 0);
