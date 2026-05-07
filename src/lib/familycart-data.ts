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
  space_id: string;
  created_at?: string;
};

export type ShoppingList = {
  id: string;
  name: string;
  is_completed: boolean;
  completed_at?: string | null;
  space_id: string;
  created_at?: string;
};

export type ShoppingItem = {
  id: string;
  shopping_list_id: string;
  product_id: string;
  quantity_needed: number;
  is_checked: boolean;
  notes?: string | null;
  space_id: string;
  created_at?: string;
};

export type SavedList = {
  id: string;
  name: string;
  space_id: string;
  created_at?: string;
};

export type SavedListItem = {
  id: string;
  saved_list_id: string;
  product_id: string;
  quantity_needed: number;
  space_id: string;
  created_at?: string;
};

export type SharedSpace = {
  id: string;
  name: string;
  owner_id: string;
  is_personal: boolean;
  color_index: number;
  created_at?: string;
};

export type SpaceMemberInfo = {
  user_id: string;
  email: string;
  joined_at: string;
  is_owner: boolean;
};

export const SPACE_COLORS = [
  { bg: "bg-blue-100", text: "text-blue-800", dot: "bg-blue-500" },
  { bg: "bg-green-100", text: "text-green-800", dot: "bg-green-500" },
  { bg: "bg-purple-100", text: "text-purple-800", dot: "bg-purple-500" },
  { bg: "bg-pink-100", text: "text-pink-800", dot: "bg-pink-500" },
  { bg: "bg-amber-100", text: "text-amber-800", dot: "bg-amber-500" },
  { bg: "bg-teal-100", text: "text-teal-800", dot: "bg-teal-500" },
  { bg: "bg-rose-100", text: "text-rose-800", dot: "bg-rose-500" },
  { bg: "bg-indigo-100", text: "text-indigo-800", dot: "bg-indigo-500" },
] as const;

export function spaceColorFor(space: { id: string; is_personal: boolean; color_index?: number }) {
  if (space.is_personal) {
    return { bg: "bg-muted", text: "text-foreground", dot: "bg-muted-foreground" };
  }
  const idx = (space.color_index ?? 0) % SPACE_COLORS.length;
  return SPACE_COLORS[idx];
}
