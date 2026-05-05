import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Pencil, Trash2, ChevronDown, Settings2 } from "lucide-react";
import { AppHeader } from "@/components/familycart/AppHeader";
import { AddProductDialog } from "@/components/familycart/AddProductDialog";
import { ManageCategoriesDialog } from "@/components/familycart/ManageCategoriesDialog";
import { type Product } from "@/lib/familycart-data";
import { actions, useFamilyCart } from "@/lib/familycart-store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "FamilyCart — רשימה ראשית" },
      { name: "description", content: "ניהול מוצרי הבית הקבועים — הוספה, עריכה והעברה לרשימת הקניות." },
      { property: "og:title", content: "FamilyCart — רשימה ראשית" },
      { property: "og:description", content: "ניהול מוצרי הבית הקבועים בצורה פשוטה ונוחה." },
    ],
  }),
  component: MasterListPage,
});

function MasterListPage() {
  const { products, loading, categories } = useFamilyCart();
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [manageOpen, setManageOpen] = useState(false);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  const toggle = (cat: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat); else next.add(cat);
      return next;
    });
  };

  const grouped = useMemo(() => {
    const map = new Map<string, Product[]>();
    for (const p of products) {
      if (!map.has(p.category)) map.set(p.category, []);
      map.get(p.category)!.push(p);
    }
    return categories.filter((c) => map.has(c)).map((c) => ({
      category: c,
      products: map.get(c)!,
    }));
  }, [products, categories]);

  return (
    <div className="min-h-dvh bg-background">
      <AppHeader />
      <main className="mx-auto max-w-xl px-4 py-6 pb-32 space-y-5">
        <div className="flex justify-end">
          <button
            onClick={() => setManageOpen(true)}
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <Settings2 className="size-4" />
            נהל קטגוריות
          </button>
        </div>
        {loading && (
          <p className="text-center text-muted-foreground mt-12">טוען מוצרים...</p>
        )}
        {!loading && grouped.length === 0 && (
          <p className="text-center text-muted-foreground mt-12">אין עדיין מוצרים. הוסיפו את הראשון!</p>
        )}
        {grouped.map(({ category, products }) => {
          const isCollapsed = collapsed.has(category);
          return (
            <section key={category}>
              <button
                onClick={() => toggle(category)}
                className="w-full flex items-center justify-between mb-3 group"
                aria-expanded={!isCollapsed}
              >
                <h2 className="text-lg font-semibold text-foreground">{category}</h2>
                <ChevronDown
                  className={
                    "size-5 text-muted-foreground transition-transform duration-200 " +
                    (isCollapsed ? "-rotate-90" : "")
                  }
                />
              </button>
              {!isCollapsed && (
                <div className="space-y-2.5">
                  {products.map((p) => (
                    <div
                      key={p.id}
                      className="bg-surface rounded-2xl shadow-soft p-4 flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <div className="font-medium truncate">{p.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {p.default_quantity} {p.unit}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => setEditProduct(p)}
                          className="size-9 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted flex items-center justify-center transition-colors"
                          aria-label="ערוך מוצר"
                        >
                          <Pencil className="size-4" />
                        </button>
                        <button
                          onClick={() => actions.removeProduct(p.id)}
                          className="size-9 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 flex items-center justify-center transition-colors"
                          aria-label="מחק מוצר"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          );
        })}
      </main>
      <AddProductDialog />
      {editProduct && (
        <AddProductDialog
          product={editProduct}
          open={true}
          onOpenChange={(v) => { if (!v) setEditProduct(null); }}
        />
      )}
      <ManageCategoriesDialog open={manageOpen} onOpenChange={setManageOpen} />
    </div>
  );
}
