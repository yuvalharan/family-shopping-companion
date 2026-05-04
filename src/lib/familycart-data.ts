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
];

export type Category = string;

export const UNITS = ['ק"ג', "יחידות", "בקבוקים", "ליטר", "גרם", "חבילות"] as const;
export type Unit = (typeof UNITS)[number];

export type Product = {
  id: string;
  name: string;
  category: string;
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
