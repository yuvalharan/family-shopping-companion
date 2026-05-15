import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Pencil, Trash2, Search, X, Plus, ShoppingCart, PackagePlus, CirclePlus, Download, ArrowUpDown, Check, ChevronsDownUp, ChevronsUpDown } from "lucide-react";
import { toast } from "sonner";
import { AppHeader } from "@/components/familycart/AppHeader";
import { AddProductDialog } from "@/components/familycart/AddProductDialog";

import { ImportProductsDialog } from "@/components/familycart/ImportProductsDialog";
import { ProductAutocomplete, type ProductSuggestion } from "@/components/familycart/ProductAutocomplete";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { type Product, type Unit } from "@/lib/familycart-data";
import { actions, useFamilyCart } from "@/lib/familycart-store";
import { formatQuantity } from "@/lib/units";
import { useAuth } from "@/lib/auth";


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
  const { products, loading, categories, lists } = useFamilyCart();
  const { user } = useAuth();
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [deleteProduct, setDeleteProduct] = useState<Product | null>(null);
  
  const [addOpen, setAddOpen] = useState(false);
  const [prefill, setPrefill] = useState<ProductSuggestion | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [setupOpen, setSetupOpen] = useState(false);
  const setupShownRef = useRef(false);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const [activeCat, setActiveCat] = useState<string>("__all__");
  const [sortBy, setSortBy] = useState<"category" | "name_asc" | "name_desc" | "date_added">(() => {
    if (typeof window === "undefined") return "category";
    const v = localStorage.getItem("familycart:master-sort");
    return (v === "name_asc" || v === "name_desc" || v === "date_added" || v === "category") ? v : "category";
  });
  const [sortOpen, setSortOpen] = useState(false);
  useEffect(() => {
    if (typeof window !== "undefined") localStorage.setItem("familycart:master-sort", sortBy);
  }, [sortBy]);


  useEffect(() => {
    if (loading || !user || setupShownRef.current) return;
    if (products.length === 0) {
      const key = `familycart:setup-shown:${user.id}`;
      if (!localStorage.getItem(key)) {
        setSetupOpen(true);
        setupShownRef.current = true;
        localStorage.setItem(key, "1");
      }
    }
  }, [loading, user, products.length]);

  const activeLists = useMemo(() => lists.filter((l) => !l.is_completed), [lists]);

  const toggle = (cat: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat); else next.add(cat);
      return next;
    });
  };

  const filteredProducts = useMemo(() => {
    const q = search.trim().toLowerCase();
    return products.filter((p) => {
      if (activeCat !== "__all__" && p.category !== activeCat) return false;
      if (q && !p.name.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [products, search, activeCat]);

  const grouped = useMemo(() => {
    const map = new Map<string, Product[]>();
    for (const p of filteredProducts) {
      if (!map.has(p.category)) map.set(p.category, []);
      map.get(p.category)!.push(p);
    }
    return categories.filter((c) => map.has(c)).map((c) => ({
      category: c,
      products: map.get(c)!,
    }));
  }, [filteredProducts, categories]);

  const flatSorted = useMemo(() => {
    const arr = [...filteredProducts];
    if (sortBy === "name_asc") arr.sort((a, b) => a.name.localeCompare(b.name, "he"));
    else if (sortBy === "name_desc") arr.sort((a, b) => b.name.localeCompare(a.name, "he"));
    else if (sortBy === "date_added") arr.sort((a, b) => (b.created_at ?? "").localeCompare(a.created_at ?? ""));
    return arr;
  }, [filteredProducts, sortBy]);

  const isFiltering = search.trim().length > 0 || activeCat !== "__all__";
  const isEmpty = !loading && products.length === 0;

  const openAddWithPrefill = (suggestion: ProductSuggestion) => {
    setPrefill(suggestion);
    setAddOpen(true);
    setSearch("");
  };


  return (
    <div className="min-h-dvh bg-background">
      <AppHeader />
      <main className="mx-auto max-w-xl px-4 py-6 pb-32 space-y-5">
        {!isEmpty && !loading && (
          <>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setImportOpen(true)}
                className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <Download className="size-4" />
                ייבא מוצרים נפוצים
              </button>
            </div>

            <div className="mx-auto w-3/5 flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="size-4 absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onFocus={() => setSearchFocused(true)}
                  onBlur={() => setTimeout(() => setSearchFocused(false), 150)}
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
                {searchFocused && search.trim().length > 0 && (
                  <ProductAutocomplete
                    query={search}
                    onPick={openAddWithPrefill}
                    className="absolute z-50 top-full mt-1 w-full bg-popover border border-border rounded-lg shadow-lg overflow-hidden"
                  />
                )}
              </div>
              <Popover open={sortOpen} onOpenChange={setSortOpen}>
                <PopoverTrigger asChild>
                  <button
                    aria-label="מיון"
                    className="h-11 px-3 rounded-xl border border-input bg-background hover:bg-muted flex items-center gap-1.5 text-sm text-foreground shrink-0"
                  >
                    <ArrowUpDown className="size-4" />
                    <span>מיון</span>
                  </button>
                </PopoverTrigger>
                <PopoverContent align="start" dir="rtl" className="w-56 p-1">
                  {([
                    { v: "category", l: "לפי קטגוריה" },
                    { v: "date_added", l: "לפי תאריך הוספה" },
                    { v: "name_asc", l: "לפי שם א-ת" },
                    { v: "name_desc", l: "לפי שם ת-א" },
                  ] as const).map((opt) => (
                    <button
                      key={opt.v}
                      onClick={() => { setSortBy(opt.v); setSortOpen(false); }}
                      className="w-full flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm hover:bg-muted text-right"
                    >
                      <span>{opt.l}</span>
                      {sortBy === opt.v && <Check className="size-4 text-primary" />}
                    </button>
                  ))}
                </PopoverContent>
              </Popover>
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
          </>
        )}

        {loading && (
          <p className="text-center text-muted-foreground mt-12">טוען מוצרים...</p>
        )}
        {isEmpty && (
          <div className="text-center py-16">
            <div className="mx-auto size-20 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-4">
              <PackagePlus className="size-9" />
            </div>
            <h2 className="text-xl font-semibold mb-2">המחסן ריק</h2>
            <p className="text-muted-foreground mb-6">הוסף את המוצרים הקבועים שלך</p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-2">
              <Button onClick={() => setSetupOpen(true)} size="lg" className="rounded-2xl">
                <Download className="size-5 ms-1" />
                ייבא מוצרים נפוצים
              </Button>
              <Button onClick={() => setAddOpen(true)} size="lg" variant="outline" className="rounded-2xl">
                <Plus className="size-5 ms-1" />
                הוסף מוצר ראשון
              </Button>
            </div>
          </div>
        )}
        {!loading && !isEmpty && filteredProducts.length === 0 && (
          <p className="text-center text-muted-foreground mt-12">לא נמצאו מוצרים</p>
        )}
        {(() => {
          const renderCard = (p: Product) => (
            <div
              key={p.id}
              className="bg-surface rounded-2xl shadow-soft p-4 flex items-center justify-between gap-3"
            >
              <div className="min-w-0">
                <div className="font-medium truncate">{p.name}</div>
                <InlineQuantity product={p} />
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <QuickAddPopover product={p} activeLists={activeLists} />
                <button
                  onClick={() => setEditProduct(p)}
                  className="size-9 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted flex items-center justify-center transition-colors"
                  aria-label="ערוך מוצר"
                >
                  <Pencil className="size-4" />
                </button>
                <button
                  onClick={() => setDeleteProduct(p)}
                  className="size-9 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 flex items-center justify-center transition-colors"
                  aria-label="מחק מוצר"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            </div>
          );

          if (sortBy === "category") {
            return grouped.map(({ category, products }) => {
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
                      {products.map(renderCard)}
                    </div>
                  )}
                </section>
              );
            });
          }
          return <div className="space-y-2.5">{flatSorted.map(renderCard)}</div>;
        })()}
      </main>
      {isEmpty ? (
        <AddProductDialog open={addOpen} onOpenChange={(v) => { setAddOpen(v); if (!v) setPrefill(null); }} prefill={prefill ?? undefined} />
      ) : (
        <>
          <AddProductDialog />
          <AddProductDialog
            open={addOpen}
            onOpenChange={(v) => { setAddOpen(v); if (!v) setPrefill(null); }}
            prefill={prefill ?? undefined}
          />
        </>
      )}
      {editProduct && (
        <AddProductDialog
          product={editProduct}
          open={true}
          onOpenChange={(v) => { if (!v) setEditProduct(null); }}
        />
      )}
      
      <ImportProductsDialog open={importOpen} onOpenChange={setImportOpen} />
      <ImportProductsDialog
        open={setupOpen}
        onOpenChange={setSetupOpen}
        title="בואו נגדיר את המחסן שלך"
        subtitle="בחר את המוצרים שאתה קונה בדרך כלל"
      />
      <AlertDialog open={!!deleteProduct} onOpenChange={(v) => { if (!v) setDeleteProduct(null); }}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-right">
              האם למחוק את {deleteProduct?.name}?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-right">
              לא ניתן לבטל פעולה זו.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="sm:justify-start gap-2">
            <AlertDialogAction
              onClick={() => {
                if (deleteProduct) actions.removeProduct(deleteProduct.id);
                setDeleteProduct(null);
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              מחק
            </AlertDialogAction>
            <AlertDialogCancel>ביטול</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function InlineQuantity({ product }: { product: Product }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(String(product.default_quantity));

  const start = () => {
    setValue(String(product.default_quantity));
    setEditing(true);
  };

  const commit = () => {
    const parsed = parseFloat(value);
    const n = Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
    setEditing(false);
    if (n !== product.default_quantity) {
      actions.updateProduct(product.id, {
        name: product.name,
        category: product.category,
        default_quantity: n,
        unit: product.unit,
      });
    }
  };

  if (editing) {
    return (
      <div className="flex items-center gap-1.5 mt-1">
        <Input
          autoFocus
          type="number"
          inputMode="decimal"
          step="any"
          min={0}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Enter") commit();
            if (e.key === "Escape") setEditing(false);
          }}
          className="h-7 w-16 px-2 text-sm"
        />
        <span className="text-sm text-muted-foreground">{product.unit}</span>
      </div>
    );
  }

  const display = formatQuantity(product.default_quantity, product.unit);
  return (
    <div className="flex items-center gap-1.5 mt-1">
      <button
        onClick={start}
        aria-label="ערוך כמות"
        className="inline-flex items-center justify-center min-w-9 h-7 px-2 text-sm rounded-md border border-input bg-muted text-foreground hover:border-ring hover:bg-muted/70 transition-colors"
      >
        {display.value}
      </button>
      <span className="text-sm text-muted-foreground">{display.unit}</span>
    </div>
  );
}

function QuickAddPopover({
  product,
  activeLists,
}: {
  product: Product;
  activeLists: { id: string; name: string }[];
}) {
  const [open, setOpen] = useState(false);
  const [selectedListId, setSelectedListId] = useState<string | null>(null);
  const [qty, setQty] = useState(product.default_quantity);
  const [creatingList, setCreatingList] = useState(false);
  const [newListName, setNewListName] = useState("");
  const [busy, setBusy] = useState(false);

  const reset = () => {
    setSelectedListId(null);
    setQty(product.default_quantity);
    setCreatingList(false);
    setNewListName("");
  };

  const handleOpenChange = (v: boolean) => {
    setOpen(v);
    if (!v) reset();
  };

  const selectedList = activeLists.find((l) => l.id === selectedListId);

  const confirmAdd = async () => {
    if (!selectedListId) return;
    setBusy(true);
    await actions.addItemToList(selectedListId, product, qty);
    setBusy(false);
    toast.success(`${product.name} נוסף ל${selectedList?.name ?? "רשימה"}`);
    handleOpenChange(false);
  };

  const confirmCreateList = async () => {
    const trimmed = newListName.trim();
    if (!trimmed) return;
    setBusy(true);
    const list = await actions.createShoppingList(trimmed);
    if (list) {
      await actions.addItemToList(list.id, product, qty);
      toast.success(`${product.name} נוסף ל${list.name}`);
      setBusy(false);
      handleOpenChange(false);
    } else {
      setBusy(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <button
          className="size-9 rounded-xl text-muted-foreground hover:text-primary hover:bg-primary/10 flex items-center justify-center transition-colors relative"
          aria-label="הוסף לרשימה"
        >
          <ShoppingCart className="size-4" />
          <CirclePlus className="size-3 absolute -top-0.5 -right-0.5 bg-background rounded-full text-primary" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" dir="rtl" className="w-72 p-3 space-y-3">
        {selectedListId ? (
          <div className="space-y-3">
            <div className="text-sm font-medium">
              הוסף את {product.name} ל{selectedList?.name}
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm text-muted-foreground">כמות:</label>
              <Input
                type="number"
                inputMode="decimal"
                step="any"
                min={0}
                value={qty}
                onChange={(e) => {
                  const n = parseFloat(e.target.value);
                  setQty(Number.isFinite(n) && n > 0 ? n : 0);
                }}
                className="h-9"
              />
              <span className="text-sm text-muted-foreground shrink-0">{product.unit}</span>
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={confirmAdd} disabled={busy || qty <= 0} className="flex-1">
                הוסף
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setSelectedListId(null)} disabled={busy}>
                חזור
              </Button>
            </div>
          </div>
        ) : creatingList ? (
          <div className="space-y-3">
            <div className="text-sm font-medium">רשימה חדשה</div>
            <Input
              autoFocus
              value={newListName}
              onChange={(e) => setNewListName(e.target.value)}
              placeholder="שם הרשימה"
              onKeyDown={(e) => { if (e.key === "Enter") confirmCreateList(); }}
              className="h-9"
            />
            <div className="flex items-center gap-2">
              <label className="text-sm text-muted-foreground">כמות:</label>
              <Input
                type="number"
                inputMode="decimal"
                step="any"
                min={0}
                value={qty}
                onChange={(e) => {
                  const n = parseFloat(e.target.value);
                  setQty(Number.isFinite(n) && n > 0 ? n : 0);
                }}
                className="h-9"
              />
              <span className="text-sm text-muted-foreground shrink-0">{product.unit}</span>
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={confirmCreateList} disabled={busy || !newListName.trim() || qty <= 0} className="flex-1">
                צור והוסף
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setCreatingList(false)} disabled={busy}>
                ביטול
              </Button>
            </div>
          </div>
        ) : (
          <>
            {activeLists.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-2">אין רשימות פעילות</p>
            ) : (
              <div className="space-y-1">
                <div className="text-xs text-muted-foreground px-2 pb-1">בחר רשימה:</div>
                {activeLists.map((l) => (
                  <button
                    key={l.id}
                    onClick={() => setSelectedListId(l.id)}
                    className="w-full text-right rounded-lg px-3 py-2 hover:bg-muted text-sm font-medium"
                  >
                    {l.name}
                  </button>
                ))}
              </div>
            )}
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => setCreatingList(true)}
            >
              <Plus className="size-4 ms-1" />
              צור רשימה חדשה
            </Button>
          </>
        )}
      </PopoverContent>
    </Popover>
  );
}
