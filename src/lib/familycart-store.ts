import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { CATEGORIES } from "./familycart-data";
import type { Product, SavedList, SavedListItem, SharedSpace, ShoppingItem, ShoppingList, Unit } from "./familycart-data";

const ACTIVE_SPACE_KEY = "familycart:active-space";

type SpaceInvite = {
  id: string;
  space_id: string;
  invite_code: string;
  created_at: string;
  expires_at: string;
};

type State = {
  products: Product[];
  items: ShoppingItem[];
  lists: ShoppingList[];
  // categories now per-space (DB-backed strings)
  categoriesBySpace: Record<string, string[]>;
  savedLists: SavedList[];
  savedItems: SavedListItem[];
  spaces: SharedSpace[];
  activeSpaceId: string | null;
  invites: SpaceInvite[];
  loading: boolean;
};

let state: State = {
  products: [],
  items: [],
  lists: [],
  categoriesBySpace: {},
  savedLists: [],
  savedItems: [],
  spaces: [],
  activeSpaceId: null,
  invites: [],
  loading: true,
};

const listeners = new Set<() => void>();
function emit() { listeners.forEach((l) => l()); }

let realtimeChannel: ReturnType<typeof supabase.channel> | null = null;

function startRealtimeSync() {
  if (realtimeChannel) return;
  realtimeChannel = supabase
    .channel("familycart-sync")
    .on("postgres_changes", { event: "*", schema: "public", table: "products" }, (payload) => {
      if (payload.eventType === "INSERT") {
        const row = payload.new as unknown as Product;
        if (!state.products.some((p) => p.id === row.id)) {
          state = { ...state, products: [...state.products, row] }; emit();
        }
      } else if (payload.eventType === "UPDATE") {
        const row = payload.new as unknown as Product;
        state = { ...state, products: state.products.map((p) => (p.id === row.id ? row : p))}; emit();
      } else if (payload.eventType === "DELETE") {
        const id = (payload.old as { id: string }).id;
        state = { ...state, products: state.products.filter((p) => p.id !== id), items: state.items.filter((i) => i.product_id !== id) }; emit();
      }
    })
    .on("postgres_changes", { event: "*", schema: "public", table: "shopping_items" }, (payload) => {
      if (payload.eventType === "INSERT") {
        const row = payload.new as unknown as ShoppingItem;
        if (!state.items.some((i) => i.id === row.id)) { state = { ...state, items: [...state.items, row] }; emit(); }
      } else if (payload.eventType === "UPDATE") {
        const row = payload.new as unknown as ShoppingItem;
        state = { ...state, items: state.items.map((i) => (i.id === row.id ? row : i)) }; emit();
      } else if (payload.eventType === "DELETE") {
        const id = (payload.old as { id: string }).id;
        state = { ...state, items: state.items.filter((i) => i.id !== id) }; emit();
      }
    })
    .on("postgres_changes", { event: "*", schema: "public", table: "shopping_lists" }, (payload) => {
      if (payload.eventType === "INSERT") {
        const row = payload.new as unknown as ShoppingList;
        if (!state.lists.some((l) => l.id === row.id)) { state = { ...state, lists: [...state.lists, row] }; emit(); }
      } else if (payload.eventType === "UPDATE") {
        const row = payload.new as unknown as ShoppingList;
        state = { ...state, lists: state.lists.map((l) => (l.id === row.id ? row : l)) }; emit();
      } else if (payload.eventType === "DELETE") {
        const id = (payload.old as { id: string }).id;
        state = { ...state, lists: state.lists.filter((l) => l.id !== id), items: state.items.filter((i) => i.shopping_list_id !== id) }; emit();
      }
    })
    .on("postgres_changes", { event: "*", schema: "public", table: "categories" }, () => {
      // simplest: refetch categories
      reloadCategories();
    })
    .on("postgres_changes", { event: "*", schema: "public", table: "shared_spaces" }, () => { loadAll(); })
    .on("postgres_changes", { event: "*", schema: "public", table: "space_members" }, () => { loadAll(); })
    .subscribe((status, err) => {
      if (err) console.error("[Realtime] subscription error:", err);
      else if (status === "SUBSCRIBED") loadAll();
    });
}

function stopRealtimeSync() {
  if (realtimeChannel) { supabase.removeChannel(realtimeChannel); realtimeChannel = null; }
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  if (listeners.size === 1) startRealtimeSync();
  return () => { listeners.delete(cb); if (listeners.size === 0) stopRealtimeSync(); };
}
const getSnapshot = () => state;

async function getUserId(): Promise<string | null> {
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}

let loaded = false;
let loadingPromise: Promise<void> | null = null;
let currentUserId: string | null = null;

async function reloadCategories() {
  const { data } = await supabase.from("categories").select("name,space_id");
  const map: Record<string, string[]> = {};
  ((data ?? []) as Array<{ name: string; space_id: string }>).forEach((r) => {
    (map[r.space_id] ??= []).push(r.name);
  });
  state = { ...state, categoriesBySpace: map };
  emit();
}

async function loadAll() {
  const [productsRes, itemsRes, listsRes, categoriesRes, savedListsRes, savedItemsRes, spacesRes, invitesRes] = await Promise.all([
    supabase.from("products").select("*").order("created_at", { ascending: true }),
    supabase.from("shopping_items").select("*").order("created_at", { ascending: true }),
    supabase.from("shopping_lists").select("*").order("created_at", { ascending: false }),
    supabase.from("categories").select("name,space_id").order("created_at", { ascending: true }),
    supabase.from("saved_lists").select("*").order("created_at", { ascending: false }),
    supabase.from("saved_list_items").select("*").order("created_at", { ascending: true }),
    supabase.from("shared_spaces").select("*").order("is_personal", { ascending: false }).order("created_at", { ascending: true }),
    supabase.from("space_invites").select("*").order("created_at", { ascending: false }),
  ]);
  const dbCats = (categoriesRes.data ?? []) as Array<{ name: string; space_id: string }>;
  const catsBySpace: Record<string, string[]> = {};
  dbCats.forEach((r) => { (catsBySpace[r.space_id] ??= []).push(r.name); });
  const spaces = (spacesRes.data ?? []) as unknown as SharedSpace[];

  // Determine active space
  let activeId: string | null = null;
  try { activeId = localStorage.getItem(ACTIVE_SPACE_KEY); } catch { /* ignore */ }
  if (!activeId || !spaces.some((s) => s.id === activeId)) {
    activeId = spaces.find((s) => s.is_personal)?.id ?? spaces[0]?.id ?? null;
  }

  state = {
    products: (productsRes.data ?? []) as unknown as Product[],
    items: (itemsRes.data ?? []) as unknown as ShoppingItem[],
    lists: (listsRes.data ?? []) as unknown as ShoppingList[],
    categoriesBySpace: catsBySpace,
    savedLists: (savedListsRes.data ?? []) as unknown as SavedList[],
    savedItems: (savedItemsRes.data ?? []) as unknown as SavedListItem[],
    spaces,
    activeSpaceId: activeId,
    invites: (invitesRes.data ?? []) as unknown as SpaceInvite[],
    loading: false,
  };
  emit();
}

function ensureLoaded() {
  if (loaded || loadingPromise) return loadingPromise;
  loaded = true;
  loadingPromise = loadAll().catch((e) => {
    loaded = false; loadingPromise = null;
    toast.error("שגיאה בטעינת הנתונים");
    console.error(e);
  });
  return loadingPromise;
}

supabase.auth.onAuthStateChange((_e, session) => {
  const newUserId = session?.user?.id ?? null;
  if (newUserId !== currentUserId) {
    currentUserId = newUserId;
    loaded = false; loadingPromise = null;
    state = { products: [], items: [], lists: [], categoriesBySpace: {}, savedLists: [], savedItems: [], spaces: [], activeSpaceId: null, invites: [], loading: !!newUserId };
    emit();
    if (newUserId) ensureLoaded();
  }
});

export function useFamilyCart() {
  const [snapshot, setSnapshot] = useState<State>(getSnapshot);
  useEffect(() => {
    setSnapshot(getSnapshot());
    const unsubscribe = subscribe(() => setSnapshot(getSnapshot()));
    getUserId().then((uid) => { if (uid) ensureLoaded(); });
    return unsubscribe;
  }, []);

  const activeSpaceId = snapshot.activeSpaceId;
  const dbCats = activeSpaceId ? (snapshot.categoriesBySpace[activeSpaceId] ?? []) : [];
  const categories = [...new Set([...CATEGORIES, ...dbCats])];
  // scope products to active space only (master list view)
  const products = activeSpaceId ? snapshot.products.filter((p) => p.space_id === activeSpaceId) : [];
  // shopping_items filtered to currently visible lists in calling components, but we expose all
  return {
    ...snapshot,
    categories,
    products,
    allProducts: snapshot.products,
    activeSpace: snapshot.spaces.find((s) => s.id === activeSpaceId) ?? null,
  };
}

function activeSpaceIdOrNull() { return state.activeSpaceId; }

export const actions = {
  setActiveSpace(spaceId: string) {
    if (!state.spaces.some((s) => s.id === spaceId)) return;
    try { localStorage.setItem(ACTIVE_SPACE_KEY, spaceId); } catch { /* ignore */ }
    state = { ...state, activeSpaceId: spaceId };
    emit();
  },

  async addProduct(input: { name: string; category: string; default_quantity: number; unit: Unit }, spaceId?: string): Promise<Product | undefined> {
    const uid = await getUserId();
    const sid = spaceId ?? activeSpaceIdOrNull();
    if (!uid || !sid) return undefined;
    const { data, error } = await supabase.from("products").insert({ ...input, user_id: uid, space_id: sid }).select().single();
    if (error || !data) { toast.error("שגיאה בשמירה, אנא נסה שוב"); return undefined; }
    state = { ...state, products: [...state.products, data as unknown as Product] }; emit();
    toast.success("המוצר נוסף בהצלחה");
    return data as unknown as Product;
  },

  async addProductsBulk(inputs: Array<{ name: string; category: string; default_quantity: number; unit: Unit }>, spaceId?: string) {
    if (inputs.length === 0) return 0;
    const uid = await getUserId();
    const sid = spaceId ?? activeSpaceIdOrNull();
    if (!uid || !sid) return 0;
    const rows = inputs.map((i) => ({ ...i, user_id: uid, space_id: sid }));
    const { data, error } = await supabase.from("products").insert(rows).select();
    if (error || !data) { toast.error("שגיאה בייבוא המוצרים"); return 0; }
    state = { ...state, products: [...state.products, ...(data as unknown as Product[])] }; emit();
    return data.length;
  },

  async updateProduct(id: string, input: { name: string; category: string; default_quantity: number; unit: Unit }) {
    const { error } = await supabase.from("products").update(input).eq("id", id);
    if (error) { toast.error("שגיאה בשמירה, אנא נסה שוב"); return; }
    state = { ...state, products: state.products.map((p) => (p.id === id ? { ...p, ...input } : p)) }; emit();
    toast.success("המוצר עודכן");
  },

  async addCategory(name: string): Promise<{ ok: true; name: string } | { ok: false; error: string }> {
    const trimmed = name.trim();
    if (!trimmed) return { ok: false, error: "שם הקטגוריה חסר" };
    const sid = activeSpaceIdOrNull();
    const uid = await getUserId();
    if (!sid || !uid) return { ok: false, error: "אין מרחב פעיל" };
    const lower = trimmed.toLowerCase();
    const existing = (state.categoriesBySpace[sid] ?? []).concat(CATEGORIES).find((c) => c.toLowerCase() === lower);
    if (existing) return { ok: false, error: "קטגוריה זו כבר קיימת" };
    const next = { ...state.categoriesBySpace, [sid]: [...(state.categoriesBySpace[sid] ?? []), trimmed] };
    state = { ...state, categoriesBySpace: next }; emit();
    const { error } = await supabase.from("categories").insert({ name: trimmed, user_id: uid, space_id: sid });
    if (error) { toast.error("שגיאה בשמירה, אנא נסה שוב"); return { ok: false, error: "שגיאה בשמירה" }; }
    return { ok: true, name: trimmed };
  },

  async renameCategory(oldName: string, newName: string): Promise<{ ok: true } | { ok: false; error: string }> {
    const trimmed = newName.trim();
    if (!trimmed) return { ok: false, error: "שם הקטגוריה חסר" };
    if (trimmed === oldName) return { ok: true };
    const sid = activeSpaceIdOrNull();
    const uid = await getUserId();
    if (!sid || !uid) return { ok: false, error: "אין מרחב פעיל" };
    const lower = trimmed.toLowerCase();
    if ((state.categoriesBySpace[sid] ?? []).some((c) => c.toLowerCase() === lower && c !== oldName)) {
      return { ok: false, error: "קטגוריה זו כבר קיימת" };
    }
    const { error: prodErr } = await supabase.from("products").update({ category: trimmed }).eq("category", oldName).eq("space_id", sid);
    if (prodErr) { toast.error("שגיאה בשמירה"); return { ok: false, error: "שגיאה בשמירה" }; }
    await supabase.from("categories").insert({ name: trimmed, user_id: uid, space_id: sid });
    await supabase.from("categories").delete().eq("name", oldName).eq("space_id", sid);
    const next = { ...state.categoriesBySpace, [sid]: (state.categoriesBySpace[sid] ?? []).map((c) => c === oldName ? trimmed : c) };
    state = {
      ...state,
      categoriesBySpace: next,
      products: state.products.map((p) => (p.category === oldName && p.space_id === sid ? { ...p, category: trimmed } : p)),
    };
    emit();
    toast.success("הקטגוריה עודכנה");
    return { ok: true };
  },

  async deleteCategory(name: string) {
    const sid = activeSpaceIdOrNull();
    if (!sid) return;
    const all = [...new Set([...CATEGORIES, ...(state.categoriesBySpace[sid] ?? [])])];
    const fallback = all.find((c) => c !== name) ?? CATEGORIES[0];
    const { error: prodErr } = await supabase.from("products").update({ category: fallback }).eq("category", name).eq("space_id", sid);
    if (prodErr) { toast.error("שגיאה במחיקה"); return; }
    await supabase.from("categories").delete().eq("name", name).eq("space_id", sid);
    const next = { ...state.categoriesBySpace, [sid]: (state.categoriesBySpace[sid] ?? []).filter((c) => c !== name) };
    state = {
      ...state,
      categoriesBySpace: next,
      products: state.products.map((p) => (p.category === name && p.space_id === sid ? { ...p, category: fallback } : p)),
    };
    emit();
    toast.success("הקטגוריה נמחקה");
  },

  async removeProduct(id: string) {
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) { toast.error("שגיאה בשמירה, אנא נסה שוב"); return; }
    state = { ...state, products: state.products.filter((p) => p.id !== id), items: state.items.filter((i) => i.product_id !== id) }; emit();
    toast.success("המוצר הוסר");
  },

  async createShoppingList(name: string, spaceId?: string): Promise<ShoppingList | null> {
    const trimmed = name.trim();
    if (!trimmed) return null;
    const uid = await getUserId();
    const sid = spaceId ?? activeSpaceIdOrNull();
    if (!uid || !sid) return null;
    const { data, error } = await supabase.from("shopping_lists").insert({ name: trimmed, user_id: uid, space_id: sid }).select().single();
    if (error || !data) { toast.error("שגיאה ביצירת הרשימה"); return null; }
    const list = data as unknown as ShoppingList;
    state = { ...state, lists: [list, ...state.lists] }; emit();
    toast.success("הרשימה נוצרה");
    return list;
  },

  async renameShoppingList(id: string, name: string) {
    const trimmed = name.trim();
    if (!trimmed) return;
    state = { ...state, lists: state.lists.map((l) => (l.id === id ? { ...l, name: trimmed } : l)) }; emit();
    const { error } = await supabase.from("shopping_lists").update({ name: trimmed }).eq("id", id);
    if (error) toast.error("שגיאה בשמירה");
  },

  async deleteShoppingList(id: string) {
    const { error } = await supabase.from("shopping_lists").delete().eq("id", id);
    if (error) { toast.error("שגיאה במחיקה"); return; }
    state = { ...state, lists: state.lists.filter((l) => l.id !== id), items: state.items.filter((i) => i.shopping_list_id !== id) }; emit();
    toast.success("הרשימה נמחקה");
  },

  async completeShoppingList(id: string) {
    const completedAt = new Date().toISOString();
    state = { ...state, lists: state.lists.map((l) => (l.id === id ? { ...l, is_completed: true, completed_at: completedAt } : l)) }; emit();
    const { error } = await supabase.from("shopping_lists").update({ is_completed: true, completed_at: completedAt }).eq("id", id);
    if (error) toast.error("שגיאה בסיום הרשימה");
  },

  async addItemToList(listId: string, product: Product, quantity?: number) {
    const qty = Math.max(1, quantity ?? product.default_quantity);
    const existing = state.items.find((i) => i.shopping_list_id === listId && i.product_id === product.id);
    if (existing) { await this.setQuantity(existing.id, qty); return; }
    const uid = await getUserId();
    if (!uid) return;
    const list = state.lists.find((l) => l.id === listId);
    const sid = list?.space_id ?? activeSpaceIdOrNull();
    if (!sid) return;
    const { data, error } = await supabase.from("shopping_items")
      .insert({ shopping_list_id: listId, product_id: product.id, quantity_needed: qty, is_checked: false, user_id: uid, space_id: sid })
      .select().single();
    if (error || !data) { toast.error("שגיאה בשמירה"); return; }
    state = { ...state, items: [...state.items, data as unknown as ShoppingItem] }; emit();
  },

  async removeItem(itemId: string) {
    const { error } = await supabase.from("shopping_items").delete().eq("id", itemId);
    if (error) { toast.error("שגיאה בשמירה"); return; }
    state = { ...state, items: state.items.filter((i) => i.id !== itemId) }; emit();
  },

  async toggleChecked(itemId: string) {
    const item = state.items.find((i) => i.id === itemId);
    if (!item) return;
    const next = !item.is_checked;
    state = { ...state, items: state.items.map((i) => (i.id === itemId ? { ...i, is_checked: next } : i)) }; emit();
    const { error } = await supabase.from("shopping_items").update({ is_checked: next }).eq("id", itemId);
    if (error) toast.error("שגיאה בשמירה");
  },

  async setQuantity(itemId: string, qty: number) {
    const value = qty > 0 ? qty : 1;
    state = { ...state, items: state.items.map((i) => (i.id === itemId ? { ...i, quantity_needed: value } : i)) }; emit();
    const { error } = await supabase.from("shopping_items").update({ quantity_needed: value }).eq("id", itemId);
    if (error) toast.error("שגיאה בשמירה");
  },

  async setItemNotes(itemId: string, notes: string) {
    const trimmed = notes.trim();
    const value = trimmed.length > 0 ? trimmed : null;
    state = { ...state, items: state.items.map((i) => (i.id === itemId ? { ...i, notes: value } : i)) }; emit();
    const { error } = await supabase.from("shopping_items").update({ notes: value }).eq("id", itemId);
    if (error) toast.error("שגיאה בשמירה");
  },

  async reactivateShoppingList(id: string) {
    state = { ...state, lists: state.lists.map((l) => (l.id === id ? { ...l, is_completed: false, completed_at: null } : l)) }; emit();
    const { error } = await supabase.from("shopping_lists").update({ is_completed: false, completed_at: null }).eq("id", id);
    if (error) toast.error("שגיאה בביטול הסיום");
  },

  async saveListAsTemplate(listId: string): Promise<SavedList | null> {
    const list = state.lists.find((l) => l.id === listId);
    if (!list) return null;
    const uid = await getUserId();
    if (!uid) return null;
    const sid = list.space_id;
    const sourceItems = state.items.filter((i) => i.shopping_list_id === listId);
    const { data: savedList, error } = await supabase.from("saved_lists")
      .insert({ name: list.name, user_id: uid, space_id: sid }).select().single();
    if (error || !savedList) { toast.error("שגיאה בשמירת הרשימה"); return null; }
    const saved = savedList as unknown as SavedList;
    let savedItems: SavedListItem[] = [];
    if (sourceItems.length > 0) {
      const rows = sourceItems.map((i) => ({
        saved_list_id: saved.id, product_id: i.product_id, quantity_needed: i.quantity_needed, user_id: uid, space_id: sid,
      }));
      const { data: itemsData, error: itemsErr } = await supabase.from("saved_list_items").insert(rows).select();
      if (itemsErr) toast.error("שגיאה בשמירת פריטי הרשימה");
      else if (itemsData) savedItems = itemsData as unknown as SavedListItem[];
    }
    state = { ...state, savedLists: [saved, ...state.savedLists], savedItems: [...state.savedItems, ...savedItems] }; emit();
    toast.success("הרשימה נשמרה");
    return saved;
  },

  async deleteSavedList(id: string) {
    const { error } = await supabase.from("saved_lists").delete().eq("id", id);
    if (error) { toast.error("שגיאה במחיקה"); return; }
    state = { ...state, savedLists: state.savedLists.filter((l) => l.id !== id), savedItems: state.savedItems.filter((i) => i.saved_list_id !== id) }; emit();
    toast.success("הרשימה נמחקה");
  },

  async loadSavedListAsActive(savedListId: string, name: string): Promise<ShoppingList | null> {
    const trimmed = name.trim();
    if (!trimmed) return null;
    const uid = await getUserId();
    if (!uid) return null;
    const saved = state.savedLists.find((s) => s.id === savedListId);
    const sid = saved?.space_id ?? activeSpaceIdOrNull();
    if (!sid) return null;
    const templateItems = state.savedItems.filter((i) => i.saved_list_id === savedListId);
    const { data: listData, error } = await supabase.from("shopping_lists")
      .insert({ name: trimmed, user_id: uid, space_id: sid }).select().single();
    if (error || !listData) { toast.error("שגיאה ביצירת הרשימה"); return null; }
    const list = listData as unknown as ShoppingList;
    let newItems: ShoppingItem[] = [];
    if (templateItems.length > 0) {
      const rows = templateItems.map((i) => ({
        shopping_list_id: list.id, product_id: i.product_id, quantity_needed: i.quantity_needed, is_checked: false, user_id: uid, space_id: sid,
      }));
      const { data: itemsData, error: itemsErr } = await supabase.from("shopping_items").insert(rows).select();
      if (itemsErr) toast.error("שגיאה בהוספת פריטים");
      else if (itemsData) newItems = itemsData as unknown as ShoppingItem[];
    }
    state = { ...state, lists: [list, ...state.lists], items: [...state.items, ...newItems] }; emit();
    toast.success("רשימה חדשה נוצרה");
    return list;
  },

  // ---------- Spaces ----------
  async createSpace(name: string): Promise<SharedSpace | null> {
    const trimmed = name.trim();
    if (!trimmed) return null;
    const uid = await getUserId();
    if (!uid) return null;
    const colorIndex = state.spaces.filter((s) => !s.is_personal).length;
    // Generate the ID client-side so we can add the owner as a member before
    // fetching — the SELECT RLS policy requires is_space_member, which needs
    // a space_members row to exist first.
    const spaceId = crypto.randomUUID();
    const { error: insertError } = await supabase.from("shared_spaces")
      .insert({ id: spaceId, name: trimmed, owner_id: uid, is_personal: false, color_index: colorIndex });
    if (insertError) { toast.error("שגיאה ביצירת המרחב"); console.error(insertError); return null; }
    const { error: memberError } = await supabase.from("space_members").insert({ space_id: spaceId, user_id: uid });
    if (memberError) { toast.error("שגיאה ביצירת המרחב"); console.error(memberError); return null; }
    const { data, error: fetchError } = await supabase.from("shared_spaces").select().eq("id", spaceId).single();
    if (fetchError || !data) { toast.error("שגיאה ביצירת המרחב"); console.error(fetchError); return null; }
    const space = data as unknown as SharedSpace;
    state = { ...state, spaces: [...state.spaces, space] }; emit();
    toast.success("המרחב נוצר");
    return space;
  },

  async renameSpace(id: string, name: string) {
    const trimmed = name.trim();
    if (!trimmed) return;
    const { error } = await supabase.from("shared_spaces").update({ name: trimmed }).eq("id", id);
    if (error) { toast.error("שגיאה בעדכון השם"); return; }
    state = { ...state, spaces: state.spaces.map((s) => s.id === id ? { ...s, name: trimmed } : s) }; emit();
    toast.success("השם עודכן");
  },

  async deleteSpace(id: string) {
    const space = state.spaces.find((s) => s.id === id);
    if (!space || space.is_personal) return;
    const { error } = await supabase.from("shared_spaces").delete().eq("id", id);
    if (error) { toast.error("שגיאה במחיקה"); return; }
    const personalId = state.spaces.find((s) => s.is_personal)?.id ?? null;
    state = {
      ...state,
      spaces: state.spaces.filter((s) => s.id !== id),
      activeSpaceId: state.activeSpaceId === id ? personalId : state.activeSpaceId,
    };
    if (state.activeSpaceId) try { localStorage.setItem(ACTIVE_SPACE_KEY, state.activeSpaceId); } catch { /* ignore */ }
    emit();
    toast.success("המרחב נמחק");
  },

  async leaveSpace(id: string) {
    const uid = await getUserId();
    if (!uid) return;
    const { error } = await supabase.from("space_members").delete().eq("space_id", id).eq("user_id", uid);
    if (error) { toast.error("שגיאה ביציאה"); return; }
    const personalId = state.spaces.find((s) => s.is_personal)?.id ?? null;
    state = {
      ...state,
      spaces: state.spaces.filter((s) => s.id !== id),
      activeSpaceId: state.activeSpaceId === id ? personalId : state.activeSpaceId,
    };
    emit();
    toast.success("יצאת מהמרחב");
  },

  async createInvite(spaceId: string): Promise<SpaceInvite | null> {
    const code = (crypto.randomUUID?.() ?? Math.random().toString(36).slice(2)).replace(/-/g, "").slice(0, 16);
    const { data, error } = await supabase.from("space_invites").insert({ space_id: spaceId, invite_code: code }).select().single();
    if (error || !data) { toast.error("שגיאה ביצירת קישור"); return null; }
    const invite = data as unknown as SpaceInvite;
    state = { ...state, invites: [invite, ...state.invites] }; emit();
    return invite;
  },

  async acceptInvite(code: string): Promise<{ ok: true; spaceId: string } | { ok: false; error: string }> {
    const { data, error } = await supabase.rpc("accept_invite", { _code: code });
    if (error) {
      const msg = error.message || "";
      if (msg.includes("expired_invite")) return { ok: false, error: "ההזמנה פגה" };
      if (msg.includes("invalid_invite")) return { ok: false, error: "קישור לא תקין" };
      if (msg.includes("not_authenticated")) return { ok: false, error: "יש להתחבר תחילה" };
      return { ok: false, error: "שגיאה בהצטרפות" };
    }
    await loadAll();
    return { ok: true, spaceId: data as string };
  },

  async getInviteInfo(code: string) {
    const { data, error } = await supabase.rpc("get_invite_space", { _code: code });
    if (error) return null;
    const row = (data as Array<{ space_id: string; space_name: string; expires_at: string; already_member: boolean }>)[0];
    return row ?? null;
  },

  async copyDataBetweenSpaces(
    sourceSpaceId: string,
    targetSpaceId: string,
    opts: { products: boolean; activeLists: boolean; savedLists: boolean },
  ): Promise<boolean> {
    const uid = await getUserId();
    if (!uid) return false;
    if (sourceSpaceId === targetSpaceId) return false;
    const needProducts = opts.products || opts.activeLists || opts.savedLists;

    // Fetch source data fresh from DB to avoid stale state
    const [srcProductsRes, srcCatsRes, srcListsRes, srcItemsRes, srcSavedRes, srcSavedItemsRes,
           tgtProductsRes, tgtCatsRes] = await Promise.all([
      supabase.from("products").select("*").eq("space_id", sourceSpaceId),
      supabase.from("categories").select("name").eq("space_id", sourceSpaceId),
      opts.activeLists
        ? supabase.from("shopping_lists").select("*").eq("space_id", sourceSpaceId).eq("is_completed", false)
        : Promise.resolve({ data: [] as Array<{ id: string; name: string }> }),
      opts.activeLists
        ? supabase.from("shopping_items").select("*").eq("space_id", sourceSpaceId)
        : Promise.resolve({ data: [] as Array<{ shopping_list_id: string; product_id: string; quantity_needed: number; notes: string | null }> }),
      opts.savedLists
        ? supabase.from("saved_lists").select("*").eq("space_id", sourceSpaceId)
        : Promise.resolve({ data: [] as Array<{ id: string; name: string }> }),
      opts.savedLists
        ? supabase.from("saved_list_items").select("*").eq("space_id", sourceSpaceId)
        : Promise.resolve({ data: [] as Array<{ saved_list_id: string; product_id: string; quantity_needed: number }> }),
      needProducts
        ? supabase.from("products").select("*").eq("space_id", targetSpaceId)
        : Promise.resolve({ data: [] as Array<{ id: string; name: string }> }),
      opts.products
        ? supabase.from("categories").select("name").eq("space_id", targetSpaceId)
        : Promise.resolve({ data: [] as Array<{ name: string }> }),
    ]);

    const srcProducts = (srcProductsRes.data ?? []) as Array<{ id: string; name: string; category: string; default_quantity: number; unit: Unit }>;
    const tgtProducts = (tgtProductsRes.data ?? []) as Array<{ id: string; name: string }>;

    // Map source product id -> target product id (existing or newly created)
    const productIdMap = new Map<string, string>();
    const tgtByName = new Map<string, string>();
    tgtProducts.forEach((p) => tgtByName.set(p.name.trim().toLowerCase(), p.id));

    // Categories (only when copying products)
    if (opts.products) {
      const tgtCatNames = new Set(((tgtCatsRes.data ?? []) as Array<{ name: string }>).map((c) => c.name.toLowerCase()));
      const builtinLower = new Set(CATEGORIES.map((c) => c.toLowerCase()));
      const newCats = ((srcCatsRes.data ?? []) as Array<{ name: string }>)
        .filter((c) => !tgtCatNames.has(c.name.toLowerCase()) && !builtinLower.has(c.name.toLowerCase()))
        .map((c) => ({ name: c.name, user_id: uid, space_id: targetSpaceId }));
      if (newCats.length > 0) await supabase.from("categories").insert(newCats);
    }

    // Products: insert missing-by-name; map ids for both new and existing
    const toInsertProducts: Array<{ name: string; category: string; default_quantity: number; unit: Unit; user_id: string; space_id: string }> = [];
    const toInsertSourceIds: string[] = [];
    for (const p of srcProducts) {
      const key = p.name.trim().toLowerCase();
      const existingId = tgtByName.get(key);
      if (existingId) {
        productIdMap.set(p.id, existingId);
      } else if (needProducts) {
        toInsertProducts.push({ name: p.name, category: p.category, default_quantity: p.default_quantity, unit: p.unit, user_id: uid, space_id: targetSpaceId });
        toInsertSourceIds.push(p.id);
      }
    }
    if (toInsertProducts.length > 0) {
      const { data: inserted, error } = await supabase.from("products").insert(toInsertProducts).select();
      if (error) { toast.error("שגיאה בייבוא"); return false; }
      (inserted ?? []).forEach((row, idx) => {
        productIdMap.set(toInsertSourceIds[idx], (row as { id: string }).id);
      });
    }

    // Active lists
    if (opts.activeLists) {
      const lists = (srcListsRes.data ?? []) as Array<{ id: string; name: string }>;
      const items = (srcItemsRes.data ?? []) as Array<{ shopping_list_id: string; product_id: string; quantity_needed: number; notes: string | null }>;
      for (const l of lists) {
        const { data: newList, error } = await supabase.from("shopping_lists")
          .insert({ name: l.name, user_id: uid, space_id: targetSpaceId }).select().single();
        if (error || !newList) continue;
        const rows = items.filter((it) => it.shopping_list_id === l.id)
          .map((it) => {
            const pid = productIdMap.get(it.product_id);
            if (!pid) return null;
            return {
              shopping_list_id: (newList as { id: string }).id,
              product_id: pid,
              quantity_needed: it.quantity_needed,
              notes: it.notes,
              is_checked: false,
              user_id: uid,
              space_id: targetSpaceId,
            };
          })
          .filter((r): r is NonNullable<typeof r> => r !== null);
        if (rows.length > 0) await supabase.from("shopping_items").insert(rows);
      }
    }

    // Saved lists
    if (opts.savedLists) {
      const lists = (srcSavedRes.data ?? []) as Array<{ id: string; name: string }>;
      const items = (srcSavedItemsRes.data ?? []) as Array<{ saved_list_id: string; product_id: string; quantity_needed: number }>;
      for (const l of lists) {
        const { data: newList, error } = await supabase.from("saved_lists")
          .insert({ name: l.name, user_id: uid, space_id: targetSpaceId }).select().single();
        if (error || !newList) continue;
        const rows = items.filter((it) => it.saved_list_id === l.id)
          .map((it) => {
            const pid = productIdMap.get(it.product_id);
            if (!pid) return null;
            return {
              saved_list_id: (newList as { id: string }).id,
              product_id: pid,
              quantity_needed: it.quantity_needed,
              user_id: uid,
              space_id: targetSpaceId,
            };
          })
          .filter((r): r is NonNullable<typeof r> => r !== null);
        if (rows.length > 0) await supabase.from("saved_list_items").insert(rows);
      }
    }

    await loadAll();
    return true;
  },

  async getSpaceMembers(spaceId: string) {
    const { data, error } = await supabase.rpc("get_space_members", { _space_id: spaceId });
    if (error) return [];
    return (data ?? []) as Array<{ user_id: string; email: string; joined_at: string; is_owner: boolean }>;
  },
};
