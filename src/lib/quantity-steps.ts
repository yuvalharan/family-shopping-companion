// Smart quantity step logic per unit.
// Returns the next quantity value when stepping up (dir=1) or down (dir=-1).

const GRAM_ML_STEPS = [0, 100, 250, 500, 750, 1000];

export function nextQuantity(current: number, unit: string, dir: 1 | -1): number {
  const cur = Number.isFinite(current) ? current : 0;

  if (unit === "גרם" || unit === 'מ"ל') {
    if (dir === 1) {
      const up = GRAM_ML_STEPS.find((s) => s > cur);
      return up ?? cur + 250;
    }
    const down = [...GRAM_ML_STEPS].reverse().find((s) => s < cur);
    return down ?? Math.max(0, cur - 250);
  }

  if (unit === 'ק"ג' || unit === "ליטר") {
    const v = cur + dir * 0.5;
    return Math.max(0, Math.round(v * 2) / 2);
  }

  // Default: integer units (יחידות, חבילות, בקבוקים, שקית, קופסה, גלילים, ...)
  const base = Math.round(cur);
  return Math.max(0, base + dir);
}

export function quantityStep(unit: string): number {
  if (unit === "גרם" || unit === 'מ"ל') return 50;
  if (unit === 'ק"ג' || unit === "ליטר") return 0.5;
  return 1;
}
