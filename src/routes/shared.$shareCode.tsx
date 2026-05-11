import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatQuantity } from "@/lib/units";
import { CATEGORIES } from "@/lib/familycart-data";

export const Route = createFileRoute("/shared/$shareCode")({
  head: () => ({
    meta: [{ title: "FamilyCart — רשימה משותפת" }],
  }),
  component: SharedListPage,
});

type Item = {
  id: string;
  product_id: string;
  quantity_needed: number;
  is_checked: boolean;
  notes: string | null;
  sort_order: number | null;
  created_at: string;
};
type Product = {
  id: string;
  name: string;
  category: string;
  unit: string;
};
type ListMeta = {
  id: string;
  name: string;
  group_by_category: boolean;
  category_order: string[] | null;
  notes: string | null;
};

type State =
  | { status: "loading" }
  | { status: "expired" }
  | { status: "not_found" }
  | { status: "ok"; list: ListMeta; items: Item[]; products: Map<string, Product> };

function SharedListPage() {
  const { shareCode } = Route.useParams();
  const [state, setState] = useState<State>({ status: "loading" });

  const load = useCallback(async () => {
    const { data, error } = await supabase.rpc("get_shared_list", { _code: shareCode });
    if (error) {
      setState({ status: "not_found" });
      return;
    }
    const payload = data as {
      error?: string;
      list?: ListMeta;
      items?: Item[];
      products?: Product[];
    };
    if (payload?.error === "expired") return setState({ status: "expired" });
    if (payload?.error || !payload?.list)
      return setState({ status: "not_found" });
    const pmap = new Map<string, Product>();
    (payload.products ?? []).forEach((p) => pmap.set(p.id, p));
    setState({
      status: "ok",
      list: payload.list,
      items: payload.items ?? [],
      products: pmap,
    });
  }, [shareCode]);

  useEffect(() => {
    void load();
    const t = setInterval(() => void load(), 4000);
    return () => clearInterval(t);
  }, [load]);

  const toggle = async (item: Item) => {
    const next = !item.is_checked;
    if (state.status !== "ok") return;
    setState({
      ...state,
      items: state.items.map((i) => (i.id === item.id ? { ...i, is_checked: next } : i)),
    });
    const { error } = await supabase.rpc("toggle_shared_item", {
      _code: shareCode,
      _item_id: item.id,
      _checked: next,
    });
    if (error) void load();
  };

  if (state.status === "loading") {
    return (
      <div className="min-h-dvh bg-background flex items-center justify-center text-muted-foreground">
        טוען...
      </div>
    );
  }

  if (state.status === "expired") {
    return (
      <div className="min-h-dvh bg-background flex items-center justify-center px-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold">הקישור פג תוקף</h1>
          <p className="text-muted-foreground">בקש מבעל הרשימה קישור חדש</p>
        </div>
      </div>
    );
  }

  if (state.status === "not_found") {
    return (
      <div className="min-h-dvh bg-background flex items-center justify-center px-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold">הרשימה לא נמצאה</h1>
          <p className="text-muted-foreground">ייתכן שהקישור בוטל</p>
        </div>
      </div>
    );
  }

  const { list, items, products } = state;
  const sortFn = (a: Item, b: Item) => {
    const ao = a.sort_order ?? Number.POSITIVE_INFINITY;
    const bo = b.sort_order ?? Number.POSITIVE_INFINITY;
    if (ao !== bo) return ao - bo;
    return a.created_at.localeCompare(b.created_at);
  };
  const pending = items.filter((i) => !i.is_checked).slice().sort(sortFn);
  const inCart = items.filter((i) => i.is_checked).slice().sort(sortFn);

  const renderItem = (item: Item) => {
    const product = products.get(item.product_id);
    if (!product) return null;
    const checked = item.is_checked;
    return (
      <div
        key={item.id}
        className={
          "rounded-2xl shadow-soft p-4 flex items-start gap-3 transition-colors " +
          (checked ? "bg-green-100 dark:bg-green-900/30 opacity-70" : "bg-surface")
        }
      >
        <input
          type="checkbox"
          checked={checked}
          onChange={() => toggle(item)}
          className="size-5 accent-primary shrink-0 mt-0.5"
          aria-label="סמן כנאסף"
        />
        <div className="min-w-0 flex-1 space-y-1.5">
          <div className="font-medium truncate">{product.name}</div>
          <div className="flex items-center gap-1.5">
            <span className="inline-flex items-center justify-center min-w-9 h-7 px-2 text-sm rounded-md border border-input bg-muted text-foreground">
              {formatQuantity(item.quantity_needed, product.unit).value}
            </span>
            <span className="text-sm text-muted-foreground">
              {formatQuantity(item.quantity_needed, product.unit).unit}
            </span>
          </div>
          {item.notes && (
            <div className="text-xs text-muted-foreground">{item.notes}</div>
          )}
        </div>
      </div>
    );
  };

  let pendingContent: React.ReactNode = null;
  if (pending.length > 0) {
    const grouped = new Map<string, Item[]>();
    pending.forEach((i) => {
      const cat = products.get(i.product_id)?.category ?? "אחר";
      if (!grouped.has(cat)) grouped.set(cat, []);
      grouped.get(cat)!.push(i);
    });
    const order = list.category_order && list.category_order.length > 0
      ? list.category_order
      : CATEGORIES;
    const cats = Array.from(grouped.keys()).sort(
      (a, b) => (order.indexOf(a) + 1 || 999) - (order.indexOf(b) + 1 || 999),
    );
    pendingContent = (
      <div className="space-y-4">
        {cats.map((cat) => {
          const catItems = grouped.get(cat)!;
          return (
            <div key={cat} className="space-y-2.5">
              <div className="flex items-center gap-2 px-1">
                <h3 className="text-base font-bold">{cat}</h3>
                <span className="text-xs text-muted-foreground">({catItems.length})</span>
              </div>
              <div className="space-y-2.5">{catItems.map(renderItem)}</div>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-background" dir="rtl">
      <div className="bg-primary/10 text-primary text-sm py-2 px-4 text-center">
        רשימה משותפת — צפייה בלבד. סמן פריטים שנאספו
      </div>
      <main className="mx-auto max-w-xl px-4 py-5 space-y-5">
        <h1 className="text-xl font-bold">{list.name}</h1>
        {list.notes && (
          <p className="text-sm text-muted-foreground italic">{list.notes}</p>
        )}
        <div className="text-xl font-bold">
          {pending.length === 0 ? "הכל נאסף! 🛒" : `${pending.length} פריטים נותרו`}
        </div>

        {pending.length > 0 && (
          <section className="space-y-2.5">
            <h2 className="text-sm font-semibold text-muted-foreground">לקנייה</h2>
            {pendingContent}
          </section>
        )}

        {inCart.length > 0 && (
          <section className="space-y-2.5">
            <h2 className="text-sm font-semibold text-muted-foreground">בעגלה</h2>
            <div className="space-y-2.5">{inCart.map(renderItem)}</div>
          </section>
        )}

        {items.length === 0 && (
          <p className="text-center text-muted-foreground py-12">הרשימה ריקה</p>
        )}
      </main>
    </div>
  );
}
