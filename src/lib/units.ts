import type { Unit } from "./familycart-data";

const GRAM = 'גרם';
const KG = 'ק"ג';

/**
 * Display-only conversion between גרם and ק"ג.
 * - >=1000 גרם → ק"ג
 * - <1 ק"ג → גרם
 * Underlying stored value/unit are unchanged.
 */
export function formatQuantity(
  quantity: number,
  unit: Unit | string,
): { value: string; unit: string } {
  if (unit === GRAM && quantity >= 1000) {
    const kg = quantity / 1000;
    return { value: trim(kg), unit: KG };
  }
  if (unit === KG && quantity > 0 && quantity < 1) {
    return { value: String(Math.round(quantity * 1000)), unit: GRAM };
  }
  return { value: trim(quantity), unit: String(unit) };
}

function trim(n: number): string {
  return Number.isInteger(n) ? String(n) : String(Number(n.toFixed(2)));
}
