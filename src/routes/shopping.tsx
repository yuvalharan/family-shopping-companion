import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { Minus, Plus, Trash2, ShoppingCart } from "lucide-react";
import { AppHeader } from "@/components/familycart/AppHeader";
import { CATEGORIES, type Category, type Product } from "@/lib/familycart-data";
import { actions, useFamilyCart } from "@/lib/familycart-store";

export const Route = createFileRoute("/shopping")({
  head: () => ({
    meta: [
      { title: "FamilyCart — רשימת קניות" },
      { name: "description", content: "רשימת הקניות הנוכחית — סמנו פריטים בזמן הקנייה." },
      { property: "og:title", content: "FamilyCart — רשימת קניות" },
      { property: "og:description", content: "מה צריך לקנות עכשיו, מסודר לפי קטגוריות." },
    ],
  }),
  component: ShoppingListPage,
});

function ShoppingListPage() {
  const { products, items } = useFamilyCart();

  const productMap = useMemo(() => {
    const m = new Map<string, Product>();
    products.forEach((p) => m.set(p.id, p));
    return m;
  }, [products]);

  const grouped = useMemo(() => {
    const map = new Map<Category, typeof items>();
    for (const item of items) {
      const p = productMap.get(item.product_id);
      if (!p) continue;
      if (!map.has(p.category)) map.set(p.category, []);
      map.get(p.category)!.push(item);
    }
    return CATEGORIES.filter((c) => map.has(c)).map((c) => ({
      category: c,
      items: map.get(c)!,
    }));
  }, [items, productMap]);

  const checkedCount = items.filter((i) => i.is_checked).length;

  if (items.length === 0) {
    return (
      <div className="min-h-dvh bg-background">
        <AppHeader />
        <main className="mx-auto max-w-xl px-4 py-20 text-center">
          <div className="mx-auto size-20 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-4">
            <ShoppingCart className="size-9" />
          </div>
          <h2 className="text-xl font-semibold mb-2">רשימת הקניות ריקה</h2>
          <p className="text-muted-foreground">
            עברו לרשימה הראשית והוסיפו את המוצרים שצריך לקנות.
          </p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-background">
      <AppHeader />
      <main className="mx-auto max-w-xl px-4 py-6 pb-32 space-y-7">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {items.length} פריטים · {checkedCount} סומנו
          </p>
          {checkedCount > 0 && (
            <button
              onClick={actions.clearChecked}
              className="text-sm text-primary font-medium hover:underline"
            >
              נקה מסומנים
            </button>
          )}
        </div>

        {grouped.map(({ category, items }) => (
          <section key={category}>
            <h2 className="text-lg font-semibold mb-3">{category}</h2>
            <div className="space-y-2.5">
              {items.map((item) => {
                const product = productMap.get(item.product_id)!;
                return (
                  <div
                    key={item.id}
                    className={
                      "bg-surface rounded-2xl shadow-soft p-4 flex items-center justify-between gap-3 transition-opacity " +
                      (item.is_checked ? "opacity-55" : "")
                    }
                  >
                    <label className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={item.is_checked}
                        onChange={() => actions.toggleChecked(item.id)}
                        className="size-5 accent-primary shrink-0"
                      />
                      <div className="min-w-0">
                        <div
                          className={
                            "font-medium truncate " +
                            (item.is_checked ? "line-through" : "")
                          }
                        >
                          {product.name}
                        </div>
                        <div className="text-sm text-muted-foreground">{product.unit}</div>
                      </div>
                    </label>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => actions.setQuantity(item.id, item.quantity_needed - 1)}
                        className="size-8 rounded-full border border-border text-foreground hover:bg-muted flex items-center justify-center"
                        aria-label="הפחת"
                      >
                        <Minus className="size-3.5" />
                      </button>
                      <span className="w-7 text-center font-medium tabular-nums">
                        {item.quantity_needed}
                      </span>
                      <button
                        onClick={() => actions.setQuantity(item.id, item.quantity_needed + 1)}
                        className="size-8 rounded-full border border-border text-foreground hover:bg-muted flex items-center justify-center"
                        aria-label="הוסף"
                      >
                        <Plus className="size-3.5" />
                      </button>
                      <button
                        onClick={() => actions.removeFromShoppingList(item.id)}
                        className="size-8 ms-1 rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10 flex items-center justify-center"
                        aria-label="הסר"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </main>
    </div>
  );
}
