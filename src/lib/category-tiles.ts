// Literal Tailwind class names, one per src/content.config.ts category enum
// value — Tailwind's scanner needs the full class string in source, so this
// can't be built with template-literal interpolation (bg-cat-${category}
// silently drops the CSS var, since the scanner never sees it as text).
export const categoryTileClass: Record<string, string> = {
  board: 'bg-cat-board',
  card: 'bg-cat-card',
  dice: 'bg-cat-dice',
  party: 'bg-cat-party',
  tile: 'bg-cat-tile',
  pen_paper: 'bg-cat-pen_paper',
  dexterity: 'bg-cat-dexterity',
  word: 'bg-cat-word',
  other: 'bg-cat-other',
};

export function categoryTileCode(category: string): string {
  return category.slice(0, 2).toUpperCase();
}
