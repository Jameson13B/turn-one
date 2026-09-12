import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

// One bullet of guide prose. Length caps here are what keep guides from
// drifting toward rulebook length — see docs/TDD.md §4.3.
const bullet = z.string().min(3).max(240);

const games = defineCollection({
  loader: glob({ pattern: '**/*.yaml', base: './src/content/games' }),
  schema: z.object({
    // --- catalog metadata ---
    title: z.string().min(1),
    aliases: z.array(z.string()).default([]),
    category: z.enum([
      'board',
      'card',
      'dice',
      'party',
      'tile',
      'pen_paper',
      'dexterity',
      'word',
      'other',
    ]),
    year: z.number().int().min(1000).max(2100).optional(),
    publisher: z.string().optional(),
    designers: z.array(z.string()).default([]),
    complexity: z.number().min(1).max(5).optional(),
    tags: z.array(z.string()).default([]),
    rulebook_url: z.string().url().optional(),
    contributors: z.array(z.string()).default([]),

    // --- the Atomic10 format: ten blocks, in order ---

    // 1. Snapshot
    snapshot: z.object({
      players: z.object({
        min: z.number().int().min(1),
        max: z.number().int().min(1),
        best: z.number().int().min(1).optional(),
      }),
      time: z.object({
        min: z.number().int().min(1),
        max: z.number().int().min(1),
      }),
      equipment: z.array(z.string()).default([]),
      premise: z.string().max(160),
    }),

    // 2. Goal
    goal: z.string().max(200),

    // 3. Setup
    setup: z.array(bullet).min(1).max(10),

    // 4. The Loop
    loop: z.array(bullet).min(1).max(8),

    // 5. Key Rules
    key_rules: z.array(bullet).min(4).max(8),

    // 6. Ending & Scoring
    ending: z.object({
      trigger: z.string().max(240),
      scoring: z.array(bullet).min(1),
    }),

    // 7. Commonly Forgotten — the block that makes the product
    forgotten: z.array(bullet).min(2).max(6),

    // 8. Tips
    tips: z.array(bullet).min(2).max(6),

    // 9. Variants (optional)
    variants: z
      .array(
        z.object({
          name: z.string(),
          text: z.string().max(400),
        })
      )
      .default([]),

    // 10. Glossary (optional)
    glossary: z
      .array(
        z.object({
          term: z.string(),
          definition: z.string().max(120),
        })
      )
      .default([]),
  }),
});

export const collections = { games };
