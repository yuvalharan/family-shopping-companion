export const CATEGORIES = [
  "חלב ומוצריו",
  "ירקות",
  "פירות",
  "בשר ודגים",
  "מאפים",
  "דגנים וקטניות",
  "שתייה",
  "ניקיון",
  "טיפוח אישי",
  "שימורים ויבשים",
  "תבלינים",
  "קפה ותה",
  "קפואים",
];

export type Category = string;

export const UNITS = [
  'ק"ג',
  "יחידות",
  "בקבוקים",
  "ליטר",
  "גרם",
  "חבילות",
  "שקית",
  "קופסה",
  "גלילים",
] as const;
export type Unit = (typeof UNITS)[number];

export type Product = {
  id: string;
  name: string;
  category: string;
  default_quantity: number;
  unit: Unit;
  created_at?: string;
};

export type ShoppingList = {
  id: string;
  name: string;
  is_completed: boolean;
  completed_at?: string | null;
  created_at?: string;
};

export type ShoppingItem = {
  id: string;
  shopping_list_id: string;
  product_id: string;
  quantity_needed: number;
  is_checked: boolean;
  notes?: string | null;
  created_at?: string;
};
