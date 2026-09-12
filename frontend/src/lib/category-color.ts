// Single source for expense-category colours, shared by every chart.
// A qualitative palette: 8 hues at even lightness/chroma so they read as one
// family, deliberately separate from the brand indigo and the credit/owed money
// hues, which carry meaning a category must not borrow.
const CATEGORY_PALETTE = [
  'oklch(0.64 0.15 25)', // coral
  'oklch(0.70 0.13 70)', // amber
  'oklch(0.66 0.13 140)', // green
  'oklch(0.64 0.11 195)', // teal
  'oklch(0.60 0.14 250)', // blue
  'oklch(0.58 0.15 300)', // violet
  'oklch(0.62 0.16 350)', // magenta
  'oklch(0.63 0.10 110)', // olive
];
const CATEGORY_MUTED = 'oklch(0.72 0.01 277)';

// Fixed slots keep common categories stable across every chart; anything else
// is hashed to a slot so it still gets a distinct, repeatable colour.
const CATEGORY_SLOT: Record<string, number> = {
  Food: 0,
  Groceries: 2,
  Transport: 4,
  Lodging: 5,
  Accommodation: 5,
  Utilities: 3,
  Entertainment: 6,
  Shopping: 1,
  Sports: 2,
  Household: 7,
  Activities: 4,
};

export function getCategoryColor(category: string): string {
  if (category === 'Others' || category === 'Uncategorized')
    return CATEGORY_MUTED;
  const slot = CATEGORY_SLOT[category];
  if (slot !== undefined) return CATEGORY_PALETTE[slot];
  let hash = 0;
  for (let i = 0; i < category.length; i++)
    hash = (hash * 31 + category.charCodeAt(i)) >>> 0;
  return CATEGORY_PALETTE[hash % CATEGORY_PALETTE.length];
}
