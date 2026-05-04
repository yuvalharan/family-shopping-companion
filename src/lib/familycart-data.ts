export const CATEGORIES = [
  "חלב",
  "גבינות",
  "ירקות",
  "פירות",
  "קטניות",
  "אגוזים וגרעינים",
  "דגנים",
  "שתייה",
  "בשר",
  "חומרי ניקוי",
  "קמח",
  "תינוקות",
  "הגיינה",
  "אחר",
] as const;

export type Category = (typeof CATEGORIES)[number];

export const UNITS = ['ק"ג', "יחידות", "בקבוקים", "ליטר", "גרם", "חבילות"] as const;
export type Unit = (typeof UNITS)[number];

export type Product = {
  id: string;
  name: string;
  category: Category;
  default_quantity: number;
  unit: Unit;
  created_at?: string;
};

export type ShoppingItem = {
  id: string;
  product_id: string;
  quantity_needed: number;
  is_checked: boolean;
  created_at?: string;
};
