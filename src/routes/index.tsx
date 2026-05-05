import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Pencil, Trash2, Settings2, Search, X } from "lucide-react";
import { AppHeader } from "@/components/familycart/AppHeader";
import { AddProductDialog } from "@/components/familycart/AddProductDialog";
import { ManageCategoriesDialog } from "@/components/familycart/ManageCategoriesDialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [activeCat, setActiveCat] = useState<string>("__all__");

  const toggle = (cat: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat); else next.add(cat);
      return next;
    });
  };

  const grouped = useMemo(() => {
    const q = search.trim().toLowerCase();
    const map = new Map<string, Product[]>();
    for (const p of products) {
      if (activeCat !== "__all__" && p.category !== activeCat) continue;
      if (q && !p.name.toLowerCase().includes(q)) continue;
      if (!map.has(p.category)) map.set(p.category, []);
      map.get(p.category)!.push(p);
    }
    return categories.filter((c) => map.has(c)).map((c) => ({
      category: c,
      products: map.get(c)!,
    }));
  }, [products, categories, search, activeCat]);

  const isFiltering = search.trim().length > 0 || activeCat !== "__all__";

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

        <div className="relative mx-auto w-3/5">
          <Search className="size-4 absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="חיפוש מוצר..."
            className="pr-9 pl-9 h-11 rounded-xl"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              aria-label="נקה חיפוש"
              className="absolute left-2 top-1/2 -translate-y-1/2 size-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted"
            >
              <X className="size-4" />
            </button>
          )}
        </div>

        <Select value={activeCat} onValueChange={setActiveCat}>
          <SelectTrigger className="h-11 rounded-xl">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">כל הקטגוריות</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c} value={c}>{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {loading && (
          <p className="text-center text-muted-foreground mt-12">טוען מוצרים...</p>
        )}
        {!loading && grouped.length === 0 && (
          <p className="text-center text-muted-foreground mt-12">
            {isFiltering || products.length > 0 ? "לא נמצאו מוצרים" : "אין עדיין מוצרים. הוסיפו את הראשון!"}
          </p>
        )}
        {grouped.map(({ category, products }) => {
          const isOpen = isFiltering || expanded.has(category);
          return (
            <section key={category}>
              <button
                onClick={() => toggle(category)}
                className="w-full text-right bg-surface rounded-2xl shadow-soft px-4 py-3 mb-3 font-bold text-foreground hover:bg-muted transition-colors border border-foreground"
                aria-expanded={isOpen}
              >
                {category}
              </button>
              {isOpen && (
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
