import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { CATEGORIES } from "./familycart-data";
import type { Product, ShoppingItem, Unit } from "./familycart-data";

type State = {
  products: Product[];
  items: ShoppingItem[];
  categories: string[];
  loading: boolean;
};

let state: State = {
  products: [],
  items: [],
  categories: [],
  loading: true,
};

const listeners = new Set<() => void>();
function emit() {
  listeners.forEach((l) => l());
}

let realtimeChannel: ReturnType<typeof supabase.channel> | null = null;

function startRealtimeSync() {
  if (realtimeChannel) return;
  realtimeChannel = supabase
    .channel("familycart-sync")
    .on("postgres_changes", { event: "*", schema: "public", table: "products" }, (payload) => {
      if (payload.eventType === "INSERT") {
        const row = payload.new as unknown as Product;
        if (!state.products.some((p) => p.id === row.id)) {
          state = { ...state, products: [...state.products, row] };
          emit();
        }
      } else if (payload.eventType === "UPDATE") {
        const row = payload.new as unknown as Product;
        state = { ...state, products: state.products.map((p) => (p.id === row.id ? row : p)) };
        emit();
      } else if (payload.eventType === "DELETE") {
        const id = (payload.old as { id: string }).id;
        state = {
          ...state,
          products: state.products.filter((p) => p.id !== id),
          items: state.items.filter((i) => i.product_id !== id),
        };
        emit();
      }
    })
    .on("postgres_changes", { event: "*", schema: "public", table: "shopping_items" }, (payload) => {
      if (payload.eventType === "INSERT") {
        const row = payload.new as unknown as ShoppingItem;
        if (!state.items.some((i) => i.id === row.id)) {
          state = { ...state, items: [...state.items, row] };
          emit();
        }
      } else if (payload.eventType === "UPDATE") {
        const row = payload.new as unknown as ShoppingItem;
        state = { ...state, items: state.items.map((i) => (i.id === row.id ? row : i)) };
        emit();
      } else if (payload.eventType === "DELETE") {
        const id = (payload.old as { id: string }).id;
        state = { ...state, items: state.items.filter((i) => i.id !== id) };
        emit();
      }
    })
    .on("postgres_changes", { event: "*", schema: "public", table: "categories" }, (payload) => {
      if (payload.eventType === "INSERT") {
        const name = (payload.new as { name: string }).name;
        if (!state.categories.includes(name)) {
          state = { ...state, categories: [...state.categories, name] };
          emit();
        }
      } else if (payload.eventType === "DELETE") {
        const name = (payload.old as { name: string }).name;
        state = { ...state, categories: state.categories.filter((c) => c !== name) };
        emit();
      }
    })
    .subscribe((status, err) => {
      if (err) {
        console.error("[Realtime] subscription error:", err);
      } else {
        console.log("[Realtime] status:", status);
        if (status === "SUBSCRIBED") {
          // Re-fetch on every (re)connect to catch any events missed during the gap.
          loadAll();
        }
      }
    });
}

function stopRealtimeSync() {
  if (realtimeChannel) {
    supabase.removeChannel(realtimeChannel);
    realtimeChannel = null;
  }
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  if (listeners.size === 1) startRealtimeSync();
  return () => {
    listeners.delete(cb);
    if (listeners.size === 0) stopRealtimeSync();
  };
}
const getSnapshot = () => state;

let loaded = false;
let loadingPromise: Promise<void> | null = null;

async function loadAll() {
  const [productsRes, itemsRes, categoriesRes] = await Promise.all([
    supabase.from("products").select("*").order("created_at", { ascending: true }),
    supabase.from("shopping_items").select("*").order("created_at", { ascending: true }),
    supabase.from("categories").select("name").order("created_at", { ascending: true }),
  ]);
  const dbCategories = (categoriesRes.data ?? []).map((r: { name: string }) => r.name);
  state = {
    products: (productsRes.data ?? []) as unknown as Product[],
    items: (itemsRes.data ?? []) as unknown as ShoppingItem[],
    categories: dbCategories.length > 0 ? dbCategories : CATEGORIES,
    loading: false,
  };
  emit();
}

function ensureLoaded() {
  if (loaded || loadingPromise) return loadingPromise;
  loaded = true;
  loadingPromise = loadAll().catch((e) => {
    loaded = false;
    loadingPromise = null;
    toast.error("שגיאה בטעינת הנתונים");
    console.error(e);
  });
  return loadingPromise;
}

export function useFamilyCart() {
  const [snapshot, setSnapshot] = useState<State>(getSnapshot);

  useEffect(() => {
    // Catch any state changes that arrived before the subscription was registered
    setSnapshot(getSnapshot());
    const unsubscribe = subscribe(() => setSnapshot(getSnapshot()));
    ensureLoaded();
    return unsubscribe;
  }, []);

  return snapshot;
}

export const actions = {
  async addProduct(input: { name: string; category: string; default_quantity: number; unit: Unit }) {
    const { data, error } = await supabase
      .from("products")
      .insert(input)
      .select()
      .single();
    if (error || !data) {
      toast.error("שגיאה בשמירה, אנא נסה שוב");
      return;
    }
    state = { ...state, products: [...state.products, data as unknown as Product] };
    emit();
    toast.success("המוצר נוסף בהצלחה");
  },

  async updateProduct(id: string, input: { name: string; category: string; default_quantity: number; unit: Unit }) {
    const { error } = await supabase.from("products").update(input).eq("id", id);
    if (error) {
      toast.error("שגיאה בשמירה, אנא נסה שוב");
      return;
    }
    state = {
      ...state,
      products: state.products.map((p) => (p.id === id ? { ...p, ...input } : p)),
    };
    emit();
    toast.success("המוצר עודכן");
  },

  async addCategory(name: string) {
    const trimmed = name.trim();
    if (!trimmed || state.categories.includes(trimmed)) return trimmed;
    state = { ...state, categories: [...state.categories, trimmed] };
    emit();
    const { error } = await supabase.from("categories").insert({ name: trimmed });
    if (error) toast.error("שגיאה בשמירה, אנא נסה שוב");
    return trimmed;
  },

  async removeProduct(id: string) {
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) {
      toast.error("שגיאה בשמירה, אנא נסה שוב");
      return;
    }
    state = {
      ...state,
      products: state.products.filter((p) => p.id !== id),
      items: state.items.filter((i) => i.product_id !== id),
    };
    emit();
    toast.success("המוצר הוסר");
  },

  async addToShoppingList(product: Product) {
    if (state.items.some((i) => i.product_id === product.id)) return;
    const { data, error } = await supabase
      .from("shopping_items")
      .insert({
        product_id: product.id,
        quantity_needed: product.default_quantity,
        is_checked: false,
      })
      .select()
      .single();
    if (error || !data) {
      toast.error("שגיאה בשמירה, אנא נסה שוב");
      return;
    }
    state = { ...state, items: [...state.items, data as unknown as ShoppingItem] };
    emit();
    toast.success("המוצר נוסף לרשימה");
  },

  async removeFromShoppingList(itemId: string) {
    const { error } = await supabase.from("shopping_items").delete().eq("id", itemId);
    if (error) {
      toast.error("שגיאה בשמירה, אנא נסה שוב");
      return;
    }
    state = { ...state, items: state.items.filter((i) => i.id !== itemId) };
    emit();
    toast.success("המוצר הוסר מהרשימה");
  },

  async toggleChecked(itemId: string) {
    const item = state.items.find((i) => i.id === itemId);
    if (!item) return;
    const next = !item.is_checked;
    state = {
      ...state,
      items: state.items.map((i) => (i.id === itemId ? { ...i, is_checked: next } : i)),
    };
    emit();
    const { error } = await supabase
      .from("shopping_items")
      .update({ is_checked: next })
      .eq("id", itemId);
    if (error) toast.error("שגיאה בשמירה, אנא נסה שוב");
  },

  async setQuantity(itemId: string, qty: number) {
    const value = Math.max(1, qty);
    state = {
      ...state,
      items: state.items.map((i) => (i.id === itemId ? { ...i, quantity_needed: value } : i)),
    };
    emit();
    const { error } = await supabase
      .from("shopping_items")
      .update({ quantity_needed: value })
      .eq("id", itemId);
    if (error) toast.error("שגיאה בשמירה, אנא נסה שוב");
  },

  async clearChecked() {
    const checkedIds = state.items.filter((i) => i.is_checked).map((i) => i.id);
    if (checkedIds.length === 0) return;
    const { error } = await supabase.from("shopping_items").delete().in("id", checkedIds);
    if (error) {
      toast.error("שגיאה בשמירה, אנא נסה שוב");
      return;
    }
    state = { ...state, items: state.items.filter((i) => !i.is_checked) };
    emit();
    toast.success("הפריטים המסומנים הוסרו");
  },
};
