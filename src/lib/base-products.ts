import type { Unit } from "./familycart-data";

export type BaseProduct = {
  name: string;
  category: string;
  default_quantity: number;
  unit: Unit;
};

export const BASE_PRODUCTS: BaseProduct[] = [
  // חלב ומוצריו
  { name: "חלב 3%", category: "חלב ומוצריו", default_quantity: 2, unit: "ליטר" },
  { name: "חלב 1%", category: "חלב ומוצריו", default_quantity: 2, unit: "ליטר" },
  { name: "שמנת חמוצה", category: "חלב ומוצריו", default_quantity: 2, unit: "יחידות" },
  { name: "שמנת לבישול", category: "חלב ומוצריו", default_quantity: 1, unit: "יחידות" },
  { name: "חמאה", category: "חלב ומוצריו", default_quantity: 1, unit: "יחידות" },
  { name: "יוגורט טבעי", category: "חלב ומוצריו", default_quantity: 4, unit: "יחידות" },
  { name: "יוגורט ילדים", category: "חלב ומוצריו", default_quantity: 6, unit: "יחידות" },
  { name: "קוטג'", category: "חלב ומוצריו", default_quantity: 2, unit: "יחידות" },
  { name: "גבינה צהובה", category: "חלב ומוצריו", default_quantity: 1, unit: "יחידות" },
  { name: "גבינה לבנה 5%", category: "חלב ומוצריו", default_quantity: 2, unit: "יחידות" },
  { name: "גבינה לבנה 9%", category: "חלב ומוצריו", default_quantity: 1, unit: "יחידות" },
  { name: "גבינת שמנת", category: "חלב ומוצריו", default_quantity: 1, unit: "יחידות" },
  { name: "ביצים", category: "חלב ומוצריו", default_quantity: 12, unit: "יחידות" },

  // ירקות
  { name: "עגבניות", category: "ירקות", default_quantity: 1, unit: 'ק"ג' },
  { name: "מלפפונים", category: "ירקות", default_quantity: 1, unit: 'ק"ג' },
  { name: "פלפל אדום", category: "ירקות", default_quantity: 0.5, unit: 'ק"ג' },
  { name: "פלפל צהוב", category: "ירקות", default_quantity: 0.5, unit: 'ק"ג' },
  { name: "בצל", category: "ירקות", default_quantity: 1, unit: 'ק"ג' },
  { name: "שום", category: "ירקות", default_quantity: 1, unit: "יחידות" },
  { name: "גזר", category: "ירקות", default_quantity: 1, unit: 'ק"ג' },
  { name: "תפוח אדמה", category: "ירקות", default_quantity: 2, unit: 'ק"ג' },
  { name: "חסה", category: "ירקות", default_quantity: 1, unit: "יחידות" },
  { name: "עלי תרד", category: "ירקות", default_quantity: 1, unit: "שקית" },
  { name: "ברוקולי", category: "ירקות", default_quantity: 1, unit: "יחידות" },
  { name: "כרובית", category: "ירקות", default_quantity: 1, unit: "יחידות" },
  { name: "קישוא", category: "ירקות", default_quantity: 0.5, unit: 'ק"ג' },
  { name: "סלרי", category: "ירקות", default_quantity: 1, unit: "יחידות" },
  { name: "בטטה", category: "ירקות", default_quantity: 1, unit: 'ק"ג' },

  // פירות
  { name: "תפוחים", category: "פירות", default_quantity: 1, unit: 'ק"ג' },
  { name: "בננות", category: "פירות", default_quantity: 1, unit: 'ק"ג' },
  { name: "תפוזים", category: "פירות", default_quantity: 1, unit: 'ק"ג' },
  { name: "לימון", category: "פירות", default_quantity: 0.5, unit: 'ק"ג' },
  { name: "אבוקדו", category: "פירות", default_quantity: 3, unit: "יחידות" },
  { name: "ענבים", category: "פירות", default_quantity: 0.5, unit: 'ק"ג' },
  { name: "אבטיח", category: "פירות", default_quantity: 1, unit: "יחידות" },
  { name: "מנגו", category: "פירות", default_quantity: 2, unit: "יחידות" },

  // בשר ודגים
  { name: "חזה עוף", category: "בשר ודגים", default_quantity: 1, unit: 'ק"ג' },
  { name: "שוקיים עוף", category: "בשר ודגים", default_quantity: 1, unit: 'ק"ג' },
  { name: "בשר טחון", category: "בשר ודגים", default_quantity: 0.5, unit: 'ק"ג' },
  { name: "סטייק אנטריקוט", category: "בשר ודגים", default_quantity: 0.5, unit: 'ק"ג' },
  { name: "נקניקיות", category: "בשר ודגים", default_quantity: 1, unit: "חבילות" },
  { name: "שניצל", category: "בשר ודגים", default_quantity: 1, unit: "חבילות" },
  { name: "סלמון", category: "בשר ודגים", default_quantity: 0.5, unit: 'ק"ג' },
  { name: "טונה שימורים", category: "בשר ודגים", default_quantity: 4, unit: "יחידות" },

  // מאפים
  { name: "לחם אחיד", category: "מאפים", default_quantity: 2, unit: "יחידות" },
  { name: "לחם שיפון", category: "מאפים", default_quantity: 1, unit: "יחידות" },
  { name: "פיתות", category: "מאפים", default_quantity: 1, unit: "חבילות" },
  { name: "לחמניות", category: "מאפים", default_quantity: 6, unit: "יחידות" },
  { name: "קרואסון", category: "מאפים", default_quantity: 4, unit: "יחידות" },

  // דגנים וקטניות
  { name: "אורז", category: "דגנים וקטניות", default_quantity: 1, unit: 'ק"ג' },
  { name: "פסטה", category: "דגנים וקטניות", default_quantity: 2, unit: "יחידות" },
  { name: "קוסקוס", category: "דגנים וקטניות", default_quantity: 1, unit: "יחידות" },
  { name: "עדשים", category: "דגנים וקטניות", default_quantity: 0.5, unit: 'ק"ג' },
  { name: "חומוס יבש", category: "דגנים וקטניות", default_quantity: 0.5, unit: 'ק"ג' },
  { name: "שעועית שחורה", category: "דגנים וקטניות", default_quantity: 0.5, unit: 'ק"ג' },
  { name: "קוואקר", category: "דגנים וקטניות", default_quantity: 1, unit: "יחידות" },
  { name: "קורנפלקס", category: "דגנים וקטניות", default_quantity: 1, unit: "יחידות" },
  { name: "גרנולה", category: "דגנים וקטניות", default_quantity: 1, unit: "יחידות" },

  // שתייה
  { name: "מים מינרלים", category: "שתייה", default_quantity: 6, unit: "בקבוקים" },
  { name: "מיץ תפוזים", category: "שתייה", default_quantity: 2, unit: "ליטר" },
  { name: "מיץ תפוחים", category: "שתייה", default_quantity: 1, unit: "ליטר" },
  { name: "קולה", category: "שתייה", default_quantity: 2, unit: "ליטר" },
  { name: "סודה", category: "שתייה", default_quantity: 2, unit: "ליטר" },
  { name: "מיץ ענבים", category: "שתייה", default_quantity: 1, unit: "ליטר" },

  // ניקיון
  { name: "אבקת כביסה", category: "ניקיון", default_quantity: 1, unit: "יחידות" },
  { name: "מרכך כביסה", category: "ניקיון", default_quantity: 1, unit: "יחידות" },
  { name: "נוזל לכלים", category: "ניקיון", default_quantity: 2, unit: "יחידות" },
  { name: "טבליות מדיח", category: "ניקיון", default_quantity: 1, unit: "חבילות" },
  { name: "מנקה אמבטיה", category: "ניקיון", default_quantity: 1, unit: "יחידות" },
  { name: "מנקה שירותים", category: "ניקיון", default_quantity: 1, unit: "יחידות" },
  { name: "שקיות אשפה", category: "ניקיון", default_quantity: 2, unit: "חבילות" },
  { name: "נייר טואלט", category: "ניקיון", default_quantity: 1, unit: "חבילות" },
  { name: "מגבות נייר", category: "ניקיון", default_quantity: 2, unit: "גלילים" },
  { name: "ספוגיות", category: "ניקיון", default_quantity: 1, unit: "חבילות" },
  { name: "אקונומיקה", category: "ניקיון", default_quantity: 1, unit: "יחידות" },

  // טיפוח אישי
  { name: "שמפו", category: "טיפוח אישי", default_quantity: 1, unit: "יחידות" },
  { name: "מרכך שיער", category: "טיפוח אישי", default_quantity: 1, unit: "יחידות" },
  { name: "סבון רחצה", category: "טיפוח אישי", default_quantity: 2, unit: "יחידות" },
  { name: "משחת שיניים", category: "טיפוח אישי", default_quantity: 2, unit: "יחידות" },
  { name: "מברשת שיניים", category: "טיפוח אישי", default_quantity: 2, unit: "יחידות" },
  { name: "דאודורנט", category: "טיפוח אישי", default_quantity: 2, unit: "יחידות" },
  { name: "קרם לחות", category: "טיפוח אישי", default_quantity: 1, unit: "יחידות" },
  { name: "תחבושות היגייניות", category: "טיפוח אישי", default_quantity: 1, unit: "חבילות" },

  // שימורים ויבשים
  { name: "רסק עגבניות", category: "שימורים ויבשים", default_quantity: 3, unit: "יחידות" },
  { name: "שימורי תירס", category: "שימורים ויבשים", default_quantity: 2, unit: "יחידות" },
  { name: "זיתים", category: "שימורים ויבשים", default_quantity: 1, unit: "יחידות" },
  { name: "חמוצים", category: "שימורים ויבשים", default_quantity: 1, unit: "יחידות" },
  { name: "מיונז", category: "שימורים ויבשים", default_quantity: 1, unit: "יחידות" },
  { name: "חרדל", category: "שימורים ויבשים", default_quantity: 1, unit: "יחידות" },
  { name: "קטשופ", category: "שימורים ויבשים", default_quantity: 1, unit: "יחידות" },
  { name: "שמן זית", category: "שימורים ויבשים", default_quantity: 1, unit: "יחידות" },
  { name: "שמן קנולה", category: "שימורים ויבשים", default_quantity: 1, unit: "יחידות" },
  { name: "חומץ", category: "שימורים ויבשים", default_quantity: 1, unit: "יחידות" },
  { name: "סויה", category: "שימורים ויבשים", default_quantity: 1, unit: "יחידות" },

  // תבלינים
  { name: "מלח", category: "תבלינים", default_quantity: 1, unit: "יחידות" },
  { name: "פלפל שחור", category: "תבלינים", default_quantity: 1, unit: "יחידות" },
  { name: "כמון", category: "תבלינים", default_quantity: 1, unit: "יחידות" },
  { name: "פפריקה", category: "תבלינים", default_quantity: 1, unit: "יחידות" },
  { name: "כורכום", category: "תבלינים", default_quantity: 1, unit: "יחידות" },
  { name: "אורגנו", category: "תבלינים", default_quantity: 1, unit: "יחידות" },

  // קפה ותה
  { name: "קפה טחון", category: "קפה ותה", default_quantity: 1, unit: "יחידות" },
  { name: "נס קפה", category: "קפה ותה", default_quantity: 1, unit: "יחידות" },
  { name: "תה שחור", category: "קפה ותה", default_quantity: 1, unit: "קופסה" },
  { name: "תה צמחים", category: "קפה ותה", default_quantity: 1, unit: "קופסה" },
  { name: "סוכר", category: "קפה ותה", default_quantity: 1, unit: 'ק"ג' },

  // קפואים
  { name: "אפונה קפואה", category: "קפואים", default_quantity: 1, unit: "שקית" },
  { name: "תירס קפוא", category: "קפואים", default_quantity: 1, unit: "שקית" },
  { name: "ירקות מעורבים קפואים", category: "קפואים", default_quantity: 1, unit: "שקית" },
  { name: "שניצל קפוא", category: "קפואים", default_quantity: 1, unit: "חבילות" },
  { name: "פיצה קפואה", category: "קפואים", default_quantity: 2, unit: "יחידות" },
];
