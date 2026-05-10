import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState, type CSSProperties } from "react";
import { toast } from "sonner";
import {
  ArrowRight,
  Bookmark,
  Check,
  GripVertical,
  Plus,
  Search,
  Trash2,
  Pencil,
} from "lucide-react";
import {
  DndContext,
  PointerSensor,
  TouchSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCenter,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { restrictToVerticalAxis, restrictToParentElement } from "@dnd-kit/modifiers";
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
import { useSpaceMembers } from "@/hooks/use-space-members";
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
  const { lists, items, products, categories, loading, savedLists, spaces } = useFamilyCart();
  const navigate = useNavigate();

  const list = lists.find((l) => l.id === listId);
  const listSpace = list ? spaces.find((s) => s.id === list.space_id) : null;
  const isShared = !!listSpace && !listSpace.is_personal;
  const memberMap = useSpaceMembers(isShared ? list?.space_id ?? null : null);

  const productMap = useMemo(() => {
    const m = new Map<string, Product>();
    products.forEach((p) => m.set(p.id, p));
    return m;
  }, [products]);

  const sortFn = (a: { sort_order?: number | null; created_at?: string }, b: { sort_order?: number | null; created_at?: string }) => {
    const ao = a.sort_order ?? Number.POSITIVE_INFINITY;
    const bo = b.sort_order ?? Number.POSITIVE_INFINITY;
    if (ao !== bo) return ao - bo;
    return (a.created_at ?? "").localeCompare(b.created_at ?? "");
  };

  const listItems = useMemo(
    () => items.filter((i) => i.shopping_list_id === listId),
    [items, listId],
  );
  const pending = useMemo(() => listItems.filter((i) => !i.is_checked).slice().sort(sortFn), [listItems]);
  const inCart = useMemo(() => listItems.filter((i) => i.is_checked).slice().sort(sortFn), [listItems]);


  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmOverwrite, setConfirmOverwrite] = useState<string | null>(null);

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

        <div className="text-xl font-bold">
          {pending.length === 0
            ? "הכל נאסף! 🛒"
            : `${pending.length} פריטים נותרו`}
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            className="h-12 rounded-2xl"
            onClick={() => setAddOpen(true)}
          >
            <Plus className="size-5 ms-2" />
            הוסף פריט
          </Button>
          <Button
            variant="outline"
            className="h-12 rounded-2xl"
            onClick={() => {
              const existing = savedLists.find((s) => s.space_id === list.space_id && s.name.trim() === list.name.trim());
              if (existing) setConfirmOverwrite(existing.id);
              else actions.saveListAsTemplate(list.id);
            }}
            disabled={listItems.length === 0}
          >
            <Bookmark className="size-5 ms-2" />
            שמור רשימה
          </Button>
        </div>

        {pending.length > 0 && (
          <SortableSection
            title="לקנייה"
            items={pending}
            productMap={productMap}
            memberMap={memberMap}
            showAddedBy={isShared}
            onReorder={(ids) => actions.reorderItems(list.id, [...ids, ...inCart.map((i) => i.id)])}
            checked={false}
          />
        )}

        {inCart.length > 0 && (
          <SortableSection
            title="בעגלה"
            items={inCart}
            productMap={productMap}
            memberMap={memberMap}
            showAddedBy={isShared}
            onReorder={(ids) => actions.reorderItems(list.id, [...pending.map((i) => i.id), ...ids])}
            checked
          />
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

      <AlertDialog open={!!confirmOverwrite} onOpenChange={(v) => { if (!v) setConfirmOverwrite(null); }}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-right">תבנית בשם זה כבר קיימת — האם לדרוס אותה?</AlertDialogTitle>
          </AlertDialogHeader>
          <AlertDialogFooter className="sm:justify-start gap-2">
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (confirmOverwrite) actions.saveListAsTemplate(list.id, { overwriteId: confirmOverwrite });
                setConfirmOverwrite(null);
              }}
            >דרוס</AlertDialogAction>
            <AlertDialogCancel>ביטול</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function SortableSection({
  title,
  items,
  productMap,
  memberMap,
  showAddedBy,
  onReorder,
  checked,
}: {
  title: string;
  items: Array<{ id: string; product_id: string; quantity_needed: number; notes?: string | null; user_id?: string | null }>;
  productMap: Map<string, Product>;
  memberMap: Map<string, string>;
  showAddedBy: boolean;
  onReorder: (orderedIds: string[]) => void;
  checked: boolean;
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const ids = items.map((i) => i.id);
  const handleEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIdx = ids.indexOf(active.id as string);
    const newIdx = ids.indexOf(over.id as string);
    if (oldIdx < 0 || newIdx < 0) return;
    onReorder(arrayMove(ids, oldIdx, newIdx));
  };
  return (
    <section className="space-y-2.5">
      <h2 className="text-sm font-semibold text-muted-foreground">{title}</h2>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleEnd}
        modifiers={[restrictToVerticalAxis, restrictToParentElement]}
      >
        <SortableContext items={ids} strategy={verticalListSortingStrategy}>
          <div className="space-y-2.5">
            {items.map((item) => {
              const p = productMap.get(item.product_id);
              if (!p) return null;
              const addedBy = showAddedBy && item.user_id ? memberMap.get(item.user_id) : undefined;
              return (
                <ItemRow
                  key={item.id}
                  itemId={item.id}
                  product={p}
                  qty={item.quantity_needed}
                  notes={item.notes ?? null}
                  checked={checked}
                  addedBy={addedBy}
                />
              );
            })}
          </div>
        </SortableContext>
      </DndContext>
    </section>
  );
}

function ItemRow({
  itemId,
  product,
  qty,
  notes,
  checked,
  addedBy,
}: {
  itemId: string;
  product: Product;
  qty: number;
  notes: string | null;
  checked: boolean;
  addedBy?: string;
}) {
  const [editingQty, setEditingQty] = useState(false);
  const [qtyDraft, setQtyDraft] = useState(String(qty));
  const [notesDraft, setNotesDraft] = useState(notes ?? "");

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: itemId });
  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
    zIndex: isDragging ? 10 : undefined,
  };

  const startQty = () => {
    setQtyDraft(String(qty));
    setEditingQty(true);
  };
  const commitQty = () => {
    const parsed = parseFloat(qtyDraft);
    const n = Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
    setEditingQty(false);
    if (n !== qty) actions.setQuantity(itemId, n);
  };

  const commitNotes = () => {
    if ((notesDraft ?? "") !== (notes ?? "")) {
      actions.setItemNotes(itemId, notesDraft);
    }
  };

  const display = formatQuantity(qty, product.unit);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={
        "rounded-2xl shadow-soft p-4 flex items-start justify-between gap-2 transition-colors " +
        (checked ? "bg-green-100 dark:bg-green-900/30 opacity-70" : "bg-surface")
      }
    >
      <button
        type="button"
        aria-label="גרור לסידור"
        className="size-8 -ms-1 mt-0.5 shrink-0 flex items-center justify-center text-muted-foreground hover:text-foreground touch-none cursor-grab active:cursor-grabbing"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="size-4" />
      </button>
      <div className="flex items-start gap-3 min-w-0 flex-1">
        <input
          type="checkbox"
          checked={checked}
          onChange={() => actions.toggleChecked(itemId)}
          className="size-5 accent-primary shrink-0 mt-0.5"
          aria-label="סמן כנאסף"
        />
        <div className="min-w-0 flex-1 space-y-1.5">
          <div className="font-medium truncate">{product.name}</div>
          {addedBy && (
            <div className="text-[11px] text-muted-foreground/80">נוסף על ידי {addedBy}</div>
          )}

          {editingQty ? (
            <div className="flex items-center gap-1.5">
              <Input
                autoFocus
                type="number"
                inputMode="decimal"
                step="any"
                min={0}
                value={qtyDraft}
                onChange={(e) => setQtyDraft(e.target.value)}
                onBlur={commitQty}
                onKeyDown={(e) => {
                  if (e.key === "Enter") commitQty();
                  if (e.key === "Escape") setEditingQty(false);
                }}
                className="h-7 w-16 px-2 text-sm"
              />
              <span className="text-sm text-muted-foreground">{product.unit}</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <button
                onClick={startQty}
                aria-label="ערוך כמות"
                className="inline-flex items-center justify-center min-w-9 h-7 px-2 text-sm rounded-md border border-input bg-muted text-foreground hover:border-ring hover:bg-muted/70 transition-colors"
              >
                {display.value}
              </button>
              <span className="text-sm text-muted-foreground">{display.unit}</span>
            </div>
          )}

          <input
            type="text"
            value={notesDraft}
            onChange={(e) => setNotesDraft(e.target.value)}
            onBlur={commitNotes}
            onKeyDown={(e) => {
              if (e.key === "Enter") (e.target as HTMLInputElement).blur();
              if (e.key === "Escape") {
                setNotesDraft(notes ?? "");
                (e.target as HTMLInputElement).blur();
              }
            }}
            placeholder="הוסף הערה..."
            className="w-full bg-transparent border-0 outline-none text-xs text-foreground placeholder:text-muted-foreground/70 placeholder:italic p-0 text-right"
          />
        </div>
      </div>
      <div className="flex items-center gap-0.5 shrink-0">
        <button
          onClick={() => actions.removeItem(itemId)}
          className="size-8 rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10 flex items-center justify-center"
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
            {grouped.length === 0 ? (
              <p className="text-center text-muted-foreground py-8 text-sm px-4">
                {query.trim().length > 0
                  ? "המוצר לא נמצא ברשימה הראשית — הוסף אותו תחילה דרך הרשימה הראשית"
                  : "לא נמצאו מוצרים"}
              </p>
            ) : grouped.map(({ category, products }) => (
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
                        onClick={() => {
                          actions.addItemToList(listId, p);
                          onOpenChange(false);
                        }}
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
      </DialogContent>
    </Dialog>
  );
}
