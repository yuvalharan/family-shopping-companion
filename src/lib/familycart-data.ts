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
};

export type ShoppingItem = {
  id: string;
  product_id: string;
  quantity_needed: number;
  is_checked: boolean;
};

export const SEED_PRODUCTS: Product[] = [
  { id: "p1", name: "חלב", category: "חלב", default_quantity: 2, unit: "ליטר" },
  { id: "p2", name: "יוגורט", category: "חלב", default_quantity: 4, unit: "יחידות" },
  { id: "p3", name: "קוטג'", category: "גבינות", default_quantity: 2, unit: "יחידות" },
  { id: "p4", name: "גבינה צהובה", category: "גבינות", default_quantity: 1, unit: "חבילות" },
  { id: "p5", name: "עגבניות", category: "ירקות", default_quantity: 1, unit: 'ק"ג' },
  { id: "p6", name: "מלפפונים", category: "ירקות", default_quantity: 1, unit: 'ק"ג' },
  { id: "p7", name: "בצל", category: "ירקות", default_quantity: 1, unit: 'ק"ג' },
  { id: "p8", name: "תפוחים", category: "פירות", default_quantity: 2, unit: 'ק"ג' },
  { id: "p9", name: "בננות", category: "פירות", default_quantity: 1, unit: 'ק"ג' },
  { id: "p10", name: "עדשים", category: "קטניות", default_quantity: 500, unit: "גרם" },
  { id: "p11", name: "שקדים", category: "אגוזים וגרעינים", default_quantity: 250, unit: "גרם" },
  { id: "p12", name: "אורז", category: "דגנים", default_quantity: 1, unit: 'ק"ג' },
  { id: "p13", name: "מים מינרלים", category: "שתייה", default_quantity: 6, unit: "בקבוקים" },
  { id: "p14", name: "חזה עוף", category: "בשר", default_quantity: 1, unit: 'ק"ג' },
  { id: "p15", name: "סבון כלים", category: "חומרי ניקוי", default_quantity: 1, unit: "יחידות" },
  { id: "p16", name: "קמח לבן", category: "קמח", default_quantity: 1, unit: 'ק"ג' },
  { id: "p17", name: "חיתולים", category: "תינוקות", default_quantity: 1, unit: "חבילות" },
  { id: "p18", name: "משחת שיניים", category: "הגיינה", default_quantity: 1, unit: "יחידות" },
];
