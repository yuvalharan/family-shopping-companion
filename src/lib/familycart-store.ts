import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { CATEGORIES } from "./familycart-data";
import type { Product, SavedList, SavedListItem, ShoppingItem, ShoppingList, Unit } from "./familycart-data";

type State = {
  products: Product[];
  items: ShoppingItem[];
  lists: ShoppingList[];
  categories: string[];
  savedLists: SavedList[];
  savedItems: SavedListItem[];
  loading: boolean;
};

let state: State = {
  products: [],
  items: [],
  lists: [],
  categories: [],
  savedLists: [],
  savedItems: [],
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
    .on("postgres_changes", { event: "*", schema: "public", table: "shopping_lists" }, (payload) => {
      if (payload.eventType === "INSERT") {
        const row = payload.new as unknown as ShoppingList;
        if (!state.lists.some((l) => l.id === row.id)) {
          state = { ...state, lists: [...state.lists, row] };
          emit();
        }
      } else if (payload.eventType === "UPDATE") {
        const row = payload.new as unknown as ShoppingList;
        state = { ...state, lists: state.lists.map((l) => (l.id === row.id ? row : l)) };
        emit();
      } else if (payload.eventType === "DELETE") {
        const id = (payload.old as { id: string }).id;
        state = {
          ...state,
          lists: state.lists.filter((l) => l.id !== id),
          items: state.items.filter((i) => i.shopping_list_id !== id),
        };
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
      } else if (status === "SUBSCRIBED") {
        loadAll();
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

async function getUserId(): Promise<string | null> {
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}

let loaded = false;
let loadingPromise: Promise<void> | null = null;
let currentUserId: string | null = null;

async function loadAll() {
  const [productsRes, itemsRes, listsRes, categoriesRes, savedListsRes, savedItemsRes] = await Promise.all([
    supabase.from("products").select("*").order("created_at", { ascending: true }),
    supabase.from("shopping_items").select("*").order("created_at", { ascending: true }),
    supabase.from("shopping_lists").select("*").order("created_at", { ascending: false }),
    supabase.from("categories").select("name").order("created_at", { ascending: true }),
    supabase.from("saved_lists").select("*").order("created_at", { ascending: false }),
    supabase.from("saved_list_items").select("*").order("created_at", { ascending: true }),
  ]);
  const dbCategories = ((categoriesRes.data ?? []) as Array<{ name: string }>).map((r) => r.name);
  state = {
    products: (productsRes.data ?? []) as unknown as Product[],
    items: (itemsRes.data ?? []) as unknown as ShoppingItem[],
    lists: (listsRes.data ?? []) as unknown as ShoppingList[],
    categories: [...new Set([...CATEGORIES, ...dbCategories])],
    savedLists: (savedListsRes.data ?? []) as unknown as SavedList[],
    savedItems: (savedItemsRes.data ?? []) as unknown as SavedListItem[],
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

supabase.auth.onAuthStateChange((_e, session) => {
  const newUserId = session?.user?.id ?? null;
  if (newUserId !== currentUserId) {
    currentUserId = newUserId;
    loaded = false;
    loadingPromise = null;
    state = { products: [], items: [], lists: [], categories: [...CATEGORIES], savedLists: [], savedItems: [], loading: !!newUserId };
    emit();
    if (newUserId) ensureLoaded();
  }
});

export function useFamilyCart() {
  const [snapshot, setSnapshot] = useState<State>(getSnapshot);

  useEffect(() => {
    setSnapshot(getSnapshot());
    const unsubscribe = subscribe(() => setSnapshot(getSnapshot()));
    getUserId().then((uid) => {
      if (uid) ensureLoaded();
    });
    return unsubscribe;
  }, []);

  return snapshot;
}

export const actions = {
  async addProduct(input: { name: string; category: string; default_quantity: number; unit: Unit }): Promise<Product | undefined> {
    const uid = await getUserId();
    if (!uid) return undefined;
    const { data, error } = await supabase.from("products").insert({ ...input, user_id: uid }).select().single();
    if (error || !data) {
      toast.error("שגיאה בשמירה, אנא נסה שוב");
      return undefined;
    }
    state = { ...state, products: [...state.products, data as unknown as Product] };
    emit();
    toast.success("המוצר נוסף בהצלחה");
    return data as unknown as Product;
  },

  async addProductsBulk(inputs: Array<{ name: string; category: string; default_quantity: number; unit: Unit }>) {
    if (inputs.length === 0) return 0;
    const uid = await getUserId();
    if (!uid) return 0;
    const rows = inputs.map((i) => ({ ...i, user_id: uid }));
    const { data, error } = await supabase.from("products").insert(rows).select();
    if (error || !data) {
      toast.error("שגיאה בייבוא המוצרים");
      return 0;
    }
    state = { ...state, products: [...state.products, ...(data as unknown as Product[])] };
    emit();
    return data.length;
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

  async addCategory(name: string): Promise<{ ok: true; name: string } | { ok: false; error: string }> {
    const trimmed = name.trim();
    if (!trimmed) return { ok: false, error: "שם הקטגוריה חסר" };
    const lower = trimmed.toLowerCase();
    const existing = state.categories.find((c) => c.toLowerCase() === lower);
    if (existing) return { ok: false, error: "קטגוריה זו כבר קיימת" };
    state = { ...state, categories: [...state.categories, trimmed] };
    emit();
    const { error } = await supabase.from("categories").insert({ name: trimmed, user_id: (await getUserId()) ?? undefined });
    if (error) {
      toast.error("שגיאה בשמירה, אנא נסה שוב");
      return { ok: false, error: "שגיאה בשמירה" };
    }
    return { ok: true, name: trimmed };
  },

  async renameCategory(oldName: string, newName: string): Promise<{ ok: true } | { ok: false; error: string }> {
    const trimmed = newName.trim();
    if (!trimmed) return { ok: false, error: "שם הקטגוריה חסר" };
    if (trimmed === oldName) return { ok: true };
    const lower = trimmed.toLowerCase();
    if (state.categories.some((c) => c.toLowerCase() === lower && c !== oldName)) {
      return { ok: false, error: "קטגוריה זו כבר קיימת" };
    }
    // Update products in DB
    const { error: prodErr } = await supabase
      .from("products")
      .update({ category: trimmed })
      .eq("category", oldName);
    if (prodErr) {
      toast.error("שגיאה בשמירה");
      return { ok: false, error: "שגיאה בשמירה" };
    }
    // Insert new category, delete old (if it was in categories table)
    await supabase.from("categories").insert({ name: trimmed, user_id: (await getUserId()) ?? undefined });
    await supabase.from("categories").delete().eq("name", oldName);
    state = {
      ...state,
      categories: state.categories.map((c) => (c === oldName ? trimmed : c)),
      products: state.products.map((p) => (p.category === oldName ? { ...p, category: trimmed } : p)),
    };
    emit();
    toast.success("הקטגוריה עודכנה");
    return { ok: true };
  },

  async deleteCategory(name: string) {
    const fallback = state.categories.find((c) => c !== name) ?? CATEGORIES[0];
    // Move products to fallback category
    const { error: prodErr } = await supabase
      .from("products")
      .update({ category: fallback })
      .eq("category", name);
    if (prodErr) {
      toast.error("שגיאה במחיקה");
      return;
    }
    await supabase.from("categories").delete().eq("name", name);
    state = {
      ...state,
      categories: state.categories.filter((c) => c !== name),
      products: state.products.map((p) => (p.category === name ? { ...p, category: fallback } : p)),
    };
    emit();
    toast.success("הקטגוריה נמחקה");
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

  async createShoppingList(name: string): Promise<ShoppingList | null> {
    const trimmed = name.trim();
    if (!trimmed) return null;
    const uid = await getUserId();
    if (!uid) return null;
    const { data, error } = await supabase
      .from("shopping_lists")
      .insert({ name: trimmed, user_id: uid })
      .select()
      .single();
    if (error || !data) {
      toast.error("שגיאה ביצירת הרשימה");
      return null;
    }
    const list = data as unknown as ShoppingList;
    state = { ...state, lists: [list, ...state.lists] };
    emit();
    toast.success("הרשימה נוצרה");
    return list;
  },

  async renameShoppingList(id: string, name: string) {
    const trimmed = name.trim();
    if (!trimmed) return;
    state = {
      ...state,
      lists: state.lists.map((l) => (l.id === id ? { ...l, name: trimmed } : l)),
    };
    emit();
    const { error } = await supabase.from("shopping_lists").update({ name: trimmed }).eq("id", id);
    if (error) toast.error("שגיאה בשמירה");
  },

  async deleteShoppingList(id: string) {
    const { error } = await supabase.from("shopping_lists").delete().eq("id", id);
    if (error) {
      toast.error("שגיאה במחיקה");
      return;
    }
    state = {
      ...state,
      lists: state.lists.filter((l) => l.id !== id),
      items: state.items.filter((i) => i.shopping_list_id !== id),
    };
    emit();
    toast.success("הרשימה נמחקה");
  },

  async completeShoppingList(id: string) {
    const completedAt = new Date().toISOString();
    state = {
      ...state,
      lists: state.lists.map((l) => (l.id === id ? { ...l, is_completed: true, completed_at: completedAt } : l)),
    };
    emit();
    const { error } = await supabase
      .from("shopping_lists")
      .update({ is_completed: true, completed_at: completedAt })
      .eq("id", id);
    if (error) toast.error("שגיאה בסיום הרשימה");
  },

  async addItemToList(listId: string, product: Product, quantity?: number) {
    const qty = Math.max(1, quantity ?? product.default_quantity);
    const existing = state.items.find((i) => i.shopping_list_id === listId && i.product_id === product.id);
    if (existing) {
      await this.setQuantity(existing.id, qty);
      return;
    }
    const uid = await getUserId();
    if (!uid) return;
    const { data, error } = await supabase
      .from("shopping_items")
      .insert({
        shopping_list_id: listId,
        product_id: product.id,
        quantity_needed: qty,
        is_checked: false,
        user_id: uid,
      })
      .select()
      .single();
    if (error || !data) {
      toast.error("שגיאה בשמירה");
      return;
    }
    state = { ...state, items: [...state.items, data as unknown as ShoppingItem] };
    emit();
  },

  async removeItem(itemId: string) {
    const { error } = await supabase.from("shopping_items").delete().eq("id", itemId);
    if (error) {
      toast.error("שגיאה בשמירה");
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
    const { error } = await supabase.from("shopping_items").update({ is_checked: next }).eq("id", itemId);
    if (error) toast.error("שגיאה בשמירה");
  },

  async setQuantity(itemId: string, qty: number) {
    const value = qty > 0 ? qty : 1;
    state = {
      ...state,
      items: state.items.map((i) => (i.id === itemId ? { ...i, quantity_needed: value } : i)),
    };
    emit();
    const { error } = await supabase
      .from("shopping_items")
      .update({ quantity_needed: value })
      .eq("id", itemId);
    if (error) toast.error("שגיאה בשמירה");
  },

  async setItemNotes(itemId: string, notes: string) {
    const trimmed = notes.trim();
    const value = trimmed.length > 0 ? trimmed : null;
    state = {
      ...state,
      items: state.items.map((i) => (i.id === itemId ? { ...i, notes: value } : i)),
    };
    emit();
    const { error } = await supabase
      .from("shopping_items")
      .update({ notes: value })
      .eq("id", itemId);
    if (error) toast.error("שגיאה בשמירה");
  },

  async reactivateShoppingList(id: string) {
    state = {
      ...state,
      lists: state.lists.map((l) => (l.id === id ? { ...l, is_completed: false, completed_at: null } : l)),
    };
    emit();
    const { error } = await supabase
      .from("shopping_lists")
      .update({ is_completed: false, completed_at: null })
      .eq("id", id);
    if (error) toast.error("שגיאה בביטול הסיום");
  },

  async saveListAsTemplate(listId: string): Promise<SavedList | null> {
    const list = state.lists.find((l) => l.id === listId);
    if (!list) return null;
    const uid = await getUserId();
    if (!uid) return null;
    const sourceItems = state.items.filter((i) => i.shopping_list_id === listId);
    const { data: savedList, error } = await supabase
      .from("saved_lists")
      .insert({ name: list.name, user_id: uid })
      .select()
      .single();
    if (error || !savedList) {
      toast.error("שגיאה בשמירת התבנית");
      return null;
    }
    const saved = savedList as unknown as SavedList;
    let savedItems: SavedListItem[] = [];
    if (sourceItems.length > 0) {
      const rows = sourceItems.map((i) => ({
        saved_list_id: saved.id,
        product_id: i.product_id,
        quantity_needed: i.quantity_needed,
        user_id: uid,
      }));
      const { data: itemsData, error: itemsErr } = await supabase
        .from("saved_list_items")
        .insert(rows)
        .select();
      if (itemsErr) {
        toast.error("שגיאה בשמירת פריטי התבנית");
      } else if (itemsData) {
        savedItems = itemsData as unknown as SavedListItem[];
      }
    }
    state = {
      ...state,
      savedLists: [saved, ...state.savedLists],
      savedItems: [...state.savedItems, ...savedItems],
    };
    emit();
    toast.success("הרשימה נשמרה כתבנית");
    return saved;
  },

  async deleteSavedList(id: string) {
    const { error } = await supabase.from("saved_lists").delete().eq("id", id);
    if (error) {
      toast.error("שגיאה במחיקה");
      return;
    }
    state = {
      ...state,
      savedLists: state.savedLists.filter((l) => l.id !== id),
      savedItems: state.savedItems.filter((i) => i.saved_list_id !== id),
    };
    emit();
    toast.success("התבנית נמחקה");
  },

  async loadSavedListAsActive(savedListId: string, name: string): Promise<ShoppingList | null> {
    const trimmed = name.trim();
    if (!trimmed) return null;
    const uid = await getUserId();
    if (!uid) return null;
    const templateItems = state.savedItems.filter((i) => i.saved_list_id === savedListId);
    const { data: listData, error } = await supabase
      .from("shopping_lists")
      .insert({ name: trimmed, user_id: uid })
      .select()
      .single();
    if (error || !listData) {
      toast.error("שגיאה ביצירת הרשימה");
      return null;
    }
    const list = listData as unknown as ShoppingList;
    let newItems: ShoppingItem[] = [];
    if (templateItems.length > 0) {
      const rows = templateItems.map((i) => ({
        shopping_list_id: list.id,
        product_id: i.product_id,
        quantity_needed: i.quantity_needed,
        is_checked: false,
        user_id: uid,
      }));
      const { data: itemsData, error: itemsErr } = await supabase
        .from("shopping_items")
        .insert(rows)
        .select();
      if (itemsErr) {
        toast.error("שגיאה בהוספת פריטים");
      } else if (itemsData) {
        newItems = itemsData as unknown as ShoppingItem[];
      }
    }
    state = {
      ...state,
      lists: [list, ...state.lists],
      items: [...state.items, ...newItems],
    };
    emit();
    toast.success("רשימה חדשה נוצרה מהתבנית");
    return list;
  },
};
