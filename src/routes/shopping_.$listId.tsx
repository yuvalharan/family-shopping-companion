import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  ArrowRight,
  Check,
  Plus,
  Search,
  Trash2,
  Pencil,
  StickyNote,
} from "lucide-react";
import { formatQuantity } from "@/lib/units";
import { AppHeader } from "@/components/familycart/AppHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { actions, useFamilyCart } from "@/lib/familycart-store";
import type { Product } from "@/lib/familycart-data";

export const Route = createFileRoute("/shopping_/$listId")({
  head: () => ({
    meta: [{ title: "FamilyCart — רשימת קנייה" }],
  }),
  component: ShoppingListDetailPage,
});

function ShoppingListDetailPage() {
  const { listId } = Route.useParams();
  const { lists, items, products, categories, loading } = useFamilyCart();
  const navigate = useNavigate();

  const list = lists.find((l) => l.id === listId);
  const productMap = useMemo(() => {
    const m = new Map<string, Product>();
    products.forEach((p) => m.set(p.id, p));
    return m;
  }, [products]);

  const listItems = useMemo(
    () => items.filter((i) => i.shopping_list_id === listId),
    [items, listId],
  );
  const pending = listItems.filter((i) => !i.is_checked);
  const inCart = listItems.filter((i) => i.is_checked);

  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (loading) {
    return (
      <div className="min-h-dvh bg-background">
        <AppHeader />
        <main className="mx-auto max-w-xl px-4 py-20 text-center text-muted-foreground">
          טוען...
        </main>
      </div>
    );
  }

  if (!list) {
    return (
      <div className="min-h-dvh bg-background">
        <AppHeader />
        <main className="mx-auto max-w-xl px-4 py-20 text-center">
          <p className="text-muted-foreground mb-4">הרשימה לא נמצאה.</p>
          <Link to="/shopping" className="text-primary font-medium">
            חזרה לרשימות
          </Link>
        </main>
      </div>
    );
  }

  const startEdit = () => {
    setNameDraft(list.name);
    setEditingName(true);
  };
  const saveName = async () => {
    if (nameDraft.trim() && nameDraft.trim() !== list.name) {
      await actions.renameShoppingList(list.id, nameDraft);
    }
    setEditingName(false);
  };

  const handleFinish = () => {
    const id = list.id;
    void actions.completeShoppingList(id);
    toast.success("קנייה הושלמה! כל הכבוד 🛒", {
      duration: 5000,
      action: {
        label: "בטל",
        onClick: () => {
          void actions.reactivateShoppingList(id);
          navigate({ to: "/shopping/$listId", params: { listId: id } });
        },
      },
    });
    navigate({ to: "/shopping" });
  };


  const handleDelete = async () => {
    await actions.deleteShoppingList(list.id);
    navigate({ to: "/shopping" });
  };

  return (
    <div className="min-h-dvh bg-background">
      <AppHeader />
      <main className="mx-auto max-w-xl px-4 py-5 pb-36 space-y-5">
        <div className="flex items-center gap-2">
          <Link
            to="/shopping"
            className="size-9 rounded-xl flex items-center justify-center text-muted-foreground hover:bg-muted"
            aria-label="חזרה"
          >
            <ArrowRight className="size-5" />
          </Link>
          {editingName ? (
            <Input
              autoFocus
              value={nameDraft}
              onChange={(e) => setNameDraft(e.target.value)}
              onBlur={saveName}
              onKeyDown={(e) => {
                if (e.key === "Enter") saveName();
                if (e.key === "Escape") setEditingName(false);
              }}
              className="text-lg font-semibold"
            />
          ) : (
            <button
              onClick={startEdit}
              className="flex-1 text-right flex items-center gap-2 group min-w-0"
            >
              <h1 className="text-xl font-bold truncate">{list.name}</h1>
              <Pencil className="size-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          )}
          <button
            onClick={() => setConfirmDelete(true)}
            className="size-9 rounded-xl flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            aria-label="מחק"
          >
            <Trash2 className="size-4" />
          </button>
        </div>

        <div className="text-sm text-muted-foreground">
          {pending.length === 0
            ? "הכל נאסף! 🛒"
            : `${pending.length} פריטים נותרו`}
        </div>

        <Button
          variant="outline"
          className="w-full justify-start h-12 rounded-2xl"
          onClick={() => setAddOpen(true)}
        >
          <Plus className="size-5 ms-2" />
          הוסף פריט
        </Button>

        {pending.length > 0 && (
          <section className="space-y-2.5">
            <h2 className="text-sm font-semibold text-muted-foreground">לקנייה</h2>
            {pending.map((item) => {
              const p = productMap.get(item.product_id);
              if (!p) return null;
              return (
                <ItemRow
                  key={item.id}
                  product={p}
                  qty={item.quantity_needed}
                  checked={false}
                  onToggle={() => actions.toggleChecked(item.id)}
                  onInc={() => actions.setQuantity(item.id, item.quantity_needed + 1)}
                  onDec={() => actions.setQuantity(item.id, item.quantity_needed - 1)}
                  onRemove={() => actions.removeItem(item.id)}
                />
              );
            })}
          </section>
        )}

        {inCart.length > 0 && (
          <section className="space-y-2.5">
            <h2 className="text-sm font-semibold text-muted-foreground">בעגלה</h2>
            {inCart.map((item) => {
              const p = productMap.get(item.product_id);
              if (!p) return null;
              return (
                <ItemRow
                  key={item.id}
                  product={p}
                  qty={item.quantity_needed}
                  checked
                  onToggle={() => actions.toggleChecked(item.id)}
                  onInc={() => actions.setQuantity(item.id, item.quantity_needed + 1)}
                  onDec={() => actions.setQuantity(item.id, item.quantity_needed - 1)}
                  onRemove={() => actions.removeItem(item.id)}
                />
              );
            })}
          </section>
        )}

        {listItems.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">הרשימה ריקה — הוסף פריטים מהמחסן</p>
            <Button onClick={() => setAddOpen(true)} className="rounded-2xl">
              <Plus className="size-5 ms-1" />
              הוסף פריטים
            </Button>
          </div>
        )}
      </main>

      {listItems.length > 0 && (
        <div className="fixed bottom-5 inset-x-4 mx-auto max-w-lg z-30">
          <Button
            size="lg"
            onClick={handleFinish}
            className="w-full h-14 rounded-2xl text-base font-semibold shadow-lift"
          >
            <Check className="size-5 ms-1" />
            סיים קנייה
          </Button>
        </div>
      )}

      <AddItemDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        listId={list.id}
        products={products}
        categories={categories}
        existingProductIds={new Set(listItems.map((i) => i.product_id))}
      />

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-right">
              האם למחוק את הרשימה {list.name}?
            </AlertDialogTitle>
          </AlertDialogHeader>
          <AlertDialogFooter className="sm:justify-start gap-2">
            <AlertDialogAction
              onClick={() => { setConfirmDelete(false); handleDelete(); }}
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

function ItemRow({
  product,
  qty,
  checked,
  onToggle,
  onInc,
  onDec,
  onRemove,
}: {
  product: Product;
  qty: number;
  checked: boolean;
  onToggle: () => void;
  onInc: () => void;
  onDec: () => void;
  onRemove: () => void;
}) {
  return (
    <div
      className={
        "rounded-2xl shadow-soft p-4 flex items-center justify-between gap-3 transition-colors " +
        (checked ? "bg-green-100 dark:bg-green-900/30 opacity-70" : "bg-surface")
      }
    >
      <label className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer">
        <input
          type="checkbox"
          checked={checked}
          onChange={onToggle}
          className="size-5 accent-primary shrink-0"
        />
        <div className="min-w-0">
          <div className="font-medium truncate">
            {product.name}
          </div>
          <div className="text-sm text-muted-foreground">{formatQuantity(qty, product.unit).unit}</div>
        </div>
      </label>
      <div className="flex items-center gap-1 shrink-0">
        <button
          onClick={onDec}
          className="size-8 rounded-full border border-border hover:bg-muted flex items-center justify-center"
          aria-label="הפחת"
        >
          <Minus className="size-3.5" />
        </button>
        <span className="min-w-7 px-1 text-center font-medium tabular-nums">{formatQuantity(qty, product.unit).value}</span>
        <button
          onClick={onInc}
          className="size-8 rounded-full border border-border hover:bg-muted flex items-center justify-center"
          aria-label="הוסף"
        >
          <Plus className="size-3.5" />
        </button>
        <button
          onClick={onRemove}
          className="size-8 ms-1 rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10 flex items-center justify-center"
          aria-label="הסר"
        >
          <Trash2 className="size-3.5" />
        </button>
      </div>
    </div>
  );
}

const ALL_CATS = "__all__";

function AddItemDialog({
  open,
  onOpenChange,
  listId,
  products,
  categories,
  existingProductIds,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  listId: string;
  products: Product[];
  categories: string[];
  existingProductIds: Set<string>;
}) {
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState<string>(ALL_CATS);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter((p) => {
      if (cat !== ALL_CATS && p.category !== cat) return false;
      if (q && !p.name.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [products, query, cat]);

  const grouped = useMemo(() => {
    const map = new Map<string, Product[]>();
    for (const p of filtered) {
      if (!map.has(p.category)) map.set(p.category, []);
      map.get(p.category)!.push(p);
    }
    return categories.filter((c) => map.has(c)).map((c) => ({ category: c, products: map.get(c)! }));
  }, [filtered, categories]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md h-[92dvh] sm:h-auto sm:max-h-[85vh] flex flex-col [&>button]:hidden" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-right">הוספת פריט לרשימה</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 flex flex-col flex-1 min-h-0">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="חיפוש מוצר..."
              className="pr-9"
            />
          </div>
          <Select value={cat} onValueChange={setCat}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_CATS}>כל הקטגוריות</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex-1 overflow-y-auto -mx-2 px-2 space-y-4">
            {grouped.length === 0 && (
              <p className="text-center text-muted-foreground py-8 text-sm">
                לא נמצאו מוצרים
              </p>
            )}
            {grouped.map(({ category, products }) => (
              <section key={category}>
                <h3 className="text-xs font-semibold text-muted-foreground mb-2">
                  {category}
                </h3>
                <div className="space-y-1.5">
                  {products.map((p) => {
                    const already = existingProductIds.has(p.id);
                    return (
                      <button
                        key={p.id}
                        disabled={already}
                        onClick={() => actions.addItemToList(listId, p)}
                        className={
                          "w-full text-right rounded-xl px-3 py-2.5 flex items-center justify-between gap-2 transition-colors " +
                          (already
                            ? "bg-muted/50 text-muted-foreground cursor-not-allowed"
                            : "bg-surface hover:bg-muted")
                        }
                      >
                        <div className="min-w-0">
                          <div className="font-medium truncate">{p.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {(() => { const d = formatQuantity(p.default_quantity, p.unit); return `${d.value} ${d.unit}`; })()}
                          </div>
                        </div>
                        {already ? (
                          <Check className="size-4 text-primary shrink-0" />
                        ) : (
                          <Plus className="size-4 text-primary shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        </div>
        <div className="mt-2">
          <Button className="w-full" onClick={() => onOpenChange(false)}>
            סיום
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
