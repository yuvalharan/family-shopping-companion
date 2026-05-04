import { useEffect, useSyncExternalStore } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Product, ShoppingItem, Category, Unit } from "./familycart-data";

type State = {
  products: Product[];
  items: ShoppingItem[];
  loading: boolean;
};

let state: State = {
  products: [],
  items: [],
  loading: true,
};

const listeners = new Set<() => void>();
function emit() {
  listeners.forEach((l) => l());
}
function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}
const getSnapshot = () => state;

let loaded = false;
let loadingPromise: Promise<void> | null = null;

async function loadAll() {
  const [productsRes, itemsRes] = await Promise.all([
    supabase.from("products").select("*").order("created_at", { ascending: true }),
    supabase.from("shopping_items").select("*").order("created_at", { ascending: true }),
  ]);
  state = {
    products: (productsRes.data ?? []) as unknown as Product[],
    items: (itemsRes.data ?? []) as unknown as ShoppingItem[],
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
    console.error("Failed to load FamilyCart data", e);
  });
  return loadingPromise;
}

export function useFamilyCart() {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  useEffect(() => {
    ensureLoaded();
  }, []);
  return snapshot;
}

export const actions = {
  async addProduct(input: { name: string; category: Category; default_quantity: number; unit: Unit }) {
    const { data, error } = await supabase
      .from("products")
      .insert(input)
      .select()
      .single();
    if (error || !data) {
      console.error(error);
      return;
    }
    state = { ...state, products: [...state.products, data as unknown as Product] };
    emit();
  },

  async removeProduct(id: string) {
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) {
      console.error(error);
      return;
    }
    state = {
      ...state,
      products: state.products.filter((p) => p.id !== id),
      items: state.items.filter((i) => i.product_id !== id),
    };
    emit();
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
      console.error(error);
      return;
    }
    state = { ...state, items: [...state.items, data as unknown as ShoppingItem] };
    emit();
  },

  async removeFromShoppingList(itemId: string) {
    const { error } = await supabase.from("shopping_items").delete().eq("id", itemId);
    if (error) {
      console.error(error);
      return;
    }
    state = { ...state, items: state.items.filter((i) => i.id !== itemId) };
    emit();
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
    if (error) console.error(error);
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
    if (error) console.error(error);
  },

  async clearChecked() {
    const checkedIds = state.items.filter((i) => i.is_checked).map((i) => i.id);
    if (checkedIds.length === 0) return;
    const { error } = await supabase.from("shopping_items").delete().in("id", checkedIds);
    if (error) {
      console.error(error);
      return;
    }
    state = { ...state, items: state.items.filter((i) => !i.is_checked) };
    emit();
  },
};
